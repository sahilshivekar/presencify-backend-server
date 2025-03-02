import { Op } from 'sequelize';
import fs from 'fs';
import { uploadOnCloudinary, deleteFromCloudinary } from '../utils/cloudinary.js';
import { isValidPhoneNumber, parsePhoneNumberWithError } from 'libphonenumber-js';
import Scheme from "../db/models/scheme.model.js"
import Semester from '../db/models/semester.model.js';
import StudentSemester from '../db/models/studentSemester.model.js';
import Branch from '../db/models/branch.model.js';
import Event from '../db/models/event.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import Staff from '../db/models/staff.model.js';
import { upload } from '../middlewares/multer.middleware.js';

//* Get all events
const getEvents = asyncHandler(async (req, res) => {
    const {
        searchQuery,
        startDatetime,
        endDatetime,
        uploadedBy,
        page = 1,
        limit = 10
    } = req.query;

    let whereClause = {};

    if (searchQuery) {
        whereClause = {
            [Op.or]: [
                { title: { [Op.iLike]: `%${searchQuery}%` } },
                { description: { [Op.iLike]: `%${searchQuery}%` } },
                { location: { [Op.iLike]: `%${searchQuery}%` } },
            ]
        };
    }

    let startDatetimeFilterClause = {};
    let endDatetimeFilterClause = {};
    let uploadedByFilterClause = {};

    if (startDatetime) {
        let startDate = new Date(startDatetime);
        if (isNaN(startDate.getTime())) {
            throw new ApiError(400, "Invalid value for start datetime parameter");
        }
        startDatetimeFilterClause.startDatetime = {
            [Op.gte]: startDate
        }
    }

    if (endDatetime) {
        let endDate = new Date(endDatetime);
        console.log(endDatetime)
        console.log(endDate);
        if (isNaN(endDate.getTime())) {
            throw new ApiError(400, "Invalid value for end datetime parameter");
        }
        endDatetimeFilterClause.endDatetime = {
            [Op.lte]: endDate
        }
    }

    if (uploadedBy) {
        const staff = await Staff.findByPk(uploadedBy);
        if (!staff) {
            throw new ApiError(404, "Invalid value for uploaded by parameter");
        }
        uploadedByFilterClause.uploadedBy = uploadedBy;
    }

    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const events = await Event.findAll({
        where: {
            [Op.and]: [
                whereClause,
                startDatetimeFilterClause,
                endDatetimeFilterClause,
                uploadedByFilterClause
            ]
        },
        include: [
            {
                model: Staff,
                required: true,
                duplicating: false,
            }
        ],
        limit: parseInt(limit, 10),
        offset: offset,
    });

    res
        .status(200)
        .json(
            new ApiResponse(
                200,
                'Events retrieved successfully.',
                events
            )
        );
});

//* Get event by ID
const getEventById = asyncHandler(async (req, res) => {
    const { eventId } = req.query;

    if (!eventId) {
        throw new ApiError(400, "Event id is required");
    }

    const event = await Event.findOne({
        where: { id: eventId },
        include: [
            {
                model: Staff,
                required: true,
            }
        ]
    });

    if (!event) {
        throw new ApiError(404, 'Event not found');
    }

    res
        .status(200)
        .json(
            new ApiResponse(
                200,
                'Event retrieved successfully.',
                event
            )
        );
});

//* Add a new event
const addEvent = asyncHandler(async (req, res) => {
    const {
        title,
        description,
        location,
        startDatetime,
        endDatetime,
        registrationLink,
        uploadedBy,
    } = req.body;


    const eventImageFilePath = req?.file?.path;

    if (req?.file) {
        const image = req?.file;

        if (image.mimetype !== "image/jpeg" && image.mimetype !== "image/png") {
            fs.unlinkSync(eventImageFilePath);
            throw new ApiError(400, "Invalid file type. Must be a jpeg or png");
        }
    }
    const requiredFields = {
        "Title": title,
        "Start Datetime": startDatetime,
        "End Datetime": endDatetime,
        "Uploaded By": uploadedBy
    };

    for (const fieldName in requiredFields) {
        if (!requiredFields[fieldName]) {
            if (eventImageFilePath) {
                fs.unlinkSync(eventImageFilePath);
            }
            throw new ApiError(400, `${fieldName} is required`);
        }
    }

    const staff = await Staff.findByPk(uploadedBy);

    if (!staff) {
        throw new ApiError(404, "Staff member with given id in uploaded by field not found");
    }

    if (endDatetime && startDatetime && new Date(startDatetime) > new Date(endDatetime)) {
        if (eventImageFilePath) {
            fs.unlinkSync(eventImageFilePath);
        }
        throw new ApiError(400, "End datetime must be greater than start datetime");
    }

    let imageUrl = null
    let imagePublicId = null
    if (eventImageFilePath) {
        const imageUploadedResponse = await uploadOnCloudinary(eventImageFilePath);
        if (!imageUploadedResponse) {
            throw new ApiError(500, "Error uploading image");
        }
        imageUrl = imageUploadedResponse.secure_url;
        imagePublicId = imageUploadedResponse.public_id;
    }



    const event = await Event.create({
        title,
        description,
        imageUrl: imageUrl || null,
        imagePublicId: imagePublicId || null,
        location: location || null,
        startDatetime: new Date(startDatetime),
        endDatetime: new Date(endDatetime),
        registrationLink: registrationLink || null,
        uploadedBy,
    });

    if (!event) {
        if (eventImageFilePath) {
            fs.unlinkSync(eventImageFilePath);
        }
        throw new ApiError(500, "Error adding event");
    }

    res
        .status(201)
        .json(
            new ApiResponse(
                201,
                'Event added successfully.',
                event
            )
        );
});

//* Update an event
const updateEvent = asyncHandler(async (req, res) => {

    const {
        eventId,
        title,
        description,
        location,
        startDatetime,
        endDatetime,
        registrationLink,
        uploadedBy,
    } = req.body;

    const eventImageFilePath = req?.file?.path;

    if (!eventId) {
        if (eventImageFilePath) {
            fs.unlinkSync(eventImageFilePath);
        }
        throw new ApiError(400, "Event id is required");
    }

    if (req?.file) {
        const image = req?.file;

        if (image.mimetype !== "image/jpeg" && image.mimetype !== "image/png") {
            fs.unlinkSync(eventImageFilePath);
            throw new ApiError(400, "Invalid file type. Must be a jpeg or png");
        }
    }

    const event = await Event.findByPk(eventId);

    if (!event) {
        if (eventImageFilePath) {
            throw new ApiError(500, "Error uploading image");
        }
        throw new ApiError(404, "Event not found");
    }

    if (uploadedBy) {
        const staff = await Staff.findByPk(uploadedBy);
        if (!staff) {
            if (eventImageFilePath) {
                throw new ApiError(500, "Error uploading image");
            }
            throw new ApiError(404, "Staff member with given id in uploaded by field not found");
        }

        event.uploadedBy = uploadedBy;
    }

    if (title) {
        event.title = title;
    }

    if (description) {
        event.description = description;
    }

    if (location) {
        event.location = location;
    }

    if (startDatetime) {
        event.startDatetime = new Date(startDatetime);
    }

    if (endDatetime) {
        event.endDatetime = new Date(endDatetime);
    }

    if (endDatetime && startDatetime && new Date(startDatetime) > new Date(endDatetime)) {
        if (eventImageFilePath) {
            fs.unlinkSync(eventImageFilePath);
        }
        throw new ApiError(400, "End datetime must be greater than start datetime");
    }

    if (registrationLink) {
        event.registrationLink = registrationLink;
    }

    if (eventImageFilePath) {
        const imageUploadedResponse = await uploadOnCloudinary(eventImageFilePath);
        if (!imageUploadedResponse) {
            throw new ApiError(500, "Error uploading image");
        }
        await deleteFromCloudinary(event.imageFilePublicId);
        event.imageUrl = imageUploadedResponse.secure_url;
        event.imagePublicId = imageUploadedResponse.public_id;
    }

    const updatedEvent = await event.save();

    res
        .status(200)
        .json(
            new ApiResponse(
                200,
                'Event updated successfully.',
                updatedEvent
            )
        );
});

//* Delete an event
const deleteEvent = asyncHandler(async (req, res) => {
    const { eventId } = req.query;

    if (!eventId) {
        throw new ApiError(400, "Event id is required");
    }

    const event = await Event.findByPk(eventId);

    if (!event) {
        throw new ApiError(404, "Event not found");
    }

    await deleteFromCloudinary(event.imageFilePublicId);

    await event.destroy();

    res
        .status(200)
        .json(
            new ApiResponse(
                200,
                'Event deleted successfully.',
                null
            )
        );
});


export {
    getEvents,
    getEventById,
    addEvent,
    updateEvent,
    deleteEvent
};
