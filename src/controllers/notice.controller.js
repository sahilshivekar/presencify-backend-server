import Notice from '../db/models/notice.model.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { Op } from 'sequelize';
import Semester from '../db/models/semester.model.js';
import Branch from '../db/models/branch.model.js';
import Scheme from '../db/models/scheme.model.js';
import Teacher from '../db/models/teacher.model.js';
import fs from 'fs';
import { uploadOnCloudinary, deleteFromCloudinary } from '../utils/cloudinary.js';

//* Get all notices
const getNotices = asyncHandler(async (req, res) => {
    const {
        searchQuery,
        audiences,
        addedAfter,
        addedBefore,
        uploadedBy,
        page = 1,
        limit = 10
    } = req.query;

    let searchClause = {};

    if (searchQuery) {
        searchClause = {
            [Op.or]: [
                { title: { [Op.iLike]: `%${searchQuery}%` } },
                { description: { [Op.iLike]: `%${searchQuery}%` } },
            ]
        };
    }

    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    let audiencesFilterClause = {};
    let addedAtFilterClause = {};
    let uploadedByFilterClause = {};

    if (audiences) {
        if (!['Students', 'Teacher', 'Everyone'].includes(audiences)) {
            throw new ApiError(400, "Invalid value for audiences parameter. Must be Students, Teacher, or Everyone");
        }
        audiencesFilterClause.audiences = audiences
    }

    if (addedAfter) {
        let addedAfterDate = new Date(addedAfter);
        if (isNaN(addedAfterDate.getTime())) {
            throw new ApiError(400, "Invalid value for addedAfter parameter");
        }
        addedAtFilterClause.createdAt = {
            [Op.gte]: addedAfterDate // Use addedAfterDate, not addedAfter
        };
    }

    if (addedBefore) {
        let addedBeforeDate = new Date(addedBefore);
        if (isNaN(addedBeforeDate.getTime())) {
            throw new ApiError(400, "Invalid value for addedBefore parameter");
        }

        if (addedAtFilterClause.createdAt) {
            // Combine with existing filter
            addedAtFilterClause.createdAt = {
                ...addedAtFilterClause.createdAt,
                [Op.lte]: addedBeforeDate // Use addedBeforeDate, not addedBefore
            };
        } else {
            // No existing filter, create a new one
            addedAtFilterClause.createdAt = {
                [Op.lte]: addedBeforeDate // Use addedBeforeDate, not addedBefore
            };
        }
    }

    if (uploadedBy) {
        const teacher = await Teacher.findByPk(uploadedBy);
        if (!teacher) {
            throw new ApiError(404, "Invalid value for uploaded by parameter");
        }
        uploadedByFilterClause.uploadedBy = uploadedBy;
    }

    const notices = await Notice.findAll({
        where: {
            [Op.and]: [
                searchClause,
                audiencesFilterClause,
                addedAtFilterClause,
                uploadedByFilterClause
            ]
        },
        include: [
            {
                model: Teacher,
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
                'Notices retrieved successfully.',
                notices
            )
        );
});

//* Get notice by ID
const getNoticeById = asyncHandler(async (req, res) => {
    const { noticeId } = req.query;

    if (!noticeId) {
        throw new ApiError(400, "Notice id is required");
    }
    console.log(noticeId)

    const notice = await Notice.findOne({
        where: { id: noticeId },
        include: [
            {
                model: Teacher,
                required: true,
            }
        ]
    });

    console.log(notice)
    if (!notice) {
        throw new ApiError(404, 'Notice not found');
    }

    res
        .status(200)
        .json(
            new ApiResponse(
                200,
                'Notice retrieved successfully.',
                notice
            )
        );
});

//* Add a new notice
const addNotice = asyncHandler(async (req, res) => {
    const {
        title,
        description,
        uploadedBy,
        audiences,
        isPinned
    } = req.body;

    const noticeImageFilePath = req?.file?.path;

    const requiredFields = {
        "Title": title,
        "Uploaded By": uploadedBy,
        "Audiences": audiences,
        "Is Pinned": isPinned
    };

    for (const fieldName in requiredFields) {
        if (!requiredFields[fieldName]) {
            if (noticeImageFilePath) {
                fs.unlinkSync(noticeImageFilePath);
            }
            throw new ApiError(400, `${fieldName} is required`);
        }
    }


    if (req?.file) {
        const image = req?.file;

        if (image.mimetype !== "image/jpeg" && image.mimetype !== "image/png") {
            fs.unlinkSync(noticeImageFilePath);
            throw new ApiError(400, "Invalid file type. Must be a jpeg or png");
        }
    }

    const teacher = await Teacher.findByPk(uploadedBy);

    if (!teacher) {
        if (noticeImageFilePath) {
            fs.unlinkSync(noticeImageFilePath);
        }
        throw new ApiError(404, "Teacher member with given id in uploaded by field not found");
    }

    let imageFileUrl = null;
    let imageFilePublicId = null;
    if (noticeImageFilePath) {
        const imageFile = await uploadOnCloudinary(noticeImageFilePath);
        if (!imageFile) {
            throw new ApiError(500, "Error uploading image file");
        }
        imageFileUrl = imageFile.secure_url;
        imageFilePublicId = imageFile.public_id;
    }


    const notice = await Notice.create({
        title,
        description: description || null,
        uploadedBy,
        audiences,
        isPinned,
        imageFileUrl,
        imageFilePublicId
    });

    if (!notice) {
        if (noticeImageFilePath) {
            fs.unlinkSync(noticeImageFilePath);
        }
        throw new ApiError(500, "Error adding notice");
    }

    res
        .status(201)
        .json(
            new ApiResponse(
                201,
                'Notice added successfully.',
                notice
            )
        );
});

//* Update a notice
const updateNotice = asyncHandler(async (req, res) => {

    const {
        noticeId,
        title,
        description,
        uploadedBy,
        audiences,
        isPinned
    } = req.body;

    const noticeImageFilePath = req?.file?.path;

    if (!noticeId) {
        if (noticeImageFilePath) {
            fs.unlinkSync(noticeImageFilePath);
        }
        throw new ApiError(400, "Notice id is required");
    }

    const notice = await Notice.findByPk(noticeId);

    if (!notice) {
        if (noticeImageFilePath) {
            fs.unlinkSync(noticeImageFilePath);
        }
        throw new ApiError(404, "Notice not found");
    }

    if (req?.file) {
        const image = req?.file;

        if (image.mimetype !== "image/jpeg" && image.mimetype !== "image/png") {
            fs.unlinkSync(noticeImageFilePath);
            throw new ApiError(400, "Invalid file type. Must be a jpeg or png");
        }
    }

    if (uploadedBy) {
        const teacher = await Teacher.findByPk(uploadedBy);

        if (!teacher) {
            if (noticeImageFilePath) {
                fs.unlinkSync(noticeImageFilePath);
            }
            throw new ApiError(404, "Teacher member with given id in uploaded by field not found");
        }
    }

    if (noticeImageFilePath) {
        const imageFile = await uploadOnCloudinary(noticeImageFilePath);
        if (!imageFile) {
            throw new ApiError(500, "Error uploading image file");
        }
        await deleteFromCloudinary(notice.imageFilePublicId);
        notice.imageFileUrl = imageFile.secure_url;
        notice.imageFilePublicId = imageFile.public_id;
    }

    if (isPinned) {
        notice.isPinned = isPinned;
    }

    if (title) {
        notice.title = title;
    }

    if (description) {
        notice.description = description;
    }

    if (uploadedBy) {
        notice.uploadedBy = uploadedBy;
    }

    if (audiences) {
        notice.audiences = audiences;
    }

    const updatedNotice = await notice.save();

    res
        .status(200)
        .json(
            new ApiResponse(
                200,
                'Notice updated successfully.',
                updatedNotice
            )
        );

});

//* Delete a notice
const deleteNotice = asyncHandler(async (req, res) => {
    const { noticeId } = req.query;

    if (!noticeId) {
        throw new ApiError(400, "Notice id is required");
    }

    const notice = await Notice.findByPk(noticeId);

    if (!notice) {
        throw new ApiError(404, "Notice not found");
    }

    await deleteFromCloudinary(notice.imageFilePublicId);

    await notice.destroy();


    res
        .status(200)
        .json(
            new ApiResponse(
                200,
                'Notice deleted successfully.',
                null
            )
        );
});

export {
    getNotices,
    getNoticeById,
    addNotice,
    updateNotice,
    deleteNotice
};