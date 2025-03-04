import Timetable from '../db/models/timetable.model.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import Division from '../db/models/division.model.js';
import { Op } from 'sequelize';
import Branch from '../db/models/branch.model.js';
import Semester from '../db/models/semester.model.js';
import Scheme from '../db/models/scheme.model.js';

//! Get all timetables
const getTimetables = asyncHandler(async (req, res) => {
    const {
        semesterNumber,
        academicStartYearOfSemester,
        academicEndYearOfSemester,
        page = 1,
        limit = 10
    } = req.query;

    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    let semesterFilterClause = {};
    let academicStartYearOfSemesterFilterClause = {};
    let academicEndYearOfSemesterFilterClause = {};

    if (semesterNumber) {
        if (isNaN(Number(semesterNumber))) {
            throw new ApiError(400, "Semester number must be a number");
        }
        semesterFilterClause.semesterNumber = Number(semesterNumber);
    }

    if (academicStartYearOfSemester) {
        if (isNaN(Number(academicStartYearOfSemester))) {
            throw new ApiError(400, "Academic start year must be a number");
        }
        academicStartYearOfSemesterFilterClause.academicStartYear = {
            [Op.gte]: academicStartYearOfSemester
        }
    }   

    if (academicEndYearOfSemester) {
        if (isNaN(Number(academicEndYearOfSemester))) {
            throw new ApiError(400, "Academic end year must be a number");
        }
        if (academicStartYearOfSemester && !isNaN(Number(academicStartYearOfSemester))) {
            if (Number(academicEndYearOfSemester) <= Number(academicStartYearOfSemester)) {
                throw new ApiError(400, "Academic end year must be greater than academic start year");
            }
        }
        academicEndYearOfSemesterFilterClause.academicEndYear = {
            [Op.lte]: academicEndYearOfSemester
        }
    }

    const timetables = await Timetable.findAll({
        include: [
            {
                model: Division,
                required: true,
                duplicating: false,
                include: [
                    {
                        model: Semester,
                        required: true,
                        duplicating: false,
                        where: {
                            [Op.and]: [
                                semesterFilterClause,
                                academicStartYearOfSemesterFilterClause,
                                academicEndYearOfSemesterFilterClause
                            ]
                        },
                        include: [
                            {
                                model: Branch,
                                required: true,
                                duplicating: false
                            },
                            {
                                model: Scheme,
                                required: true,
                                duplicating: false
                            }
                        ]
                    }
                ]
            }
        ],
        offset: offset,
        limit: parseInt(limit, 10)
    });

    res.status(200).json(new ApiResponse(200, "Timetables retrieved successfully.", timetables));
});

//! Get timetable by id
const getTimetableById = asyncHandler(async (req, res) => {
    const { timetableId } = req.query;

    if (!timetableId) {
        throw new ApiError(400, "Timetable id is required");
    }

    const timetable = await Timetable.findOne({
        where: { id: timetableId },
        include: [
            {
                model: Division,
                required: true,
                duplicating: false,
                include: [
                    {
                        model: Semester,
                        required: true,
                        duplicating: false,
                        include: [
                            {
                                model: Branch,
                                required: true,
                                duplicating: false
                            },
                            {
                                model: Scheme,
                                required: true,
                                duplicating: false
                            }
                        ]
                    }
                ]
            }
        ]
    });

    if (!timetable) throw new ApiError(404, "Timetable not found");

    res
        .status(200)
        .json(
            new ApiResponse(
                200,
                "Timetable fetched successfully",
                timetable
            )
        );
});

//* Add a timetable
const addTimetable = asyncHandler(async (req, res) => {
    const {
        divisionId,
        timetableVersion = 1
    } = req.body;

    if (!divisionId) {
        throw new ApiError(400, "Division id is required");
    }

    if (timetableVersion && isNaN(Number(timetableVersion))) {
        throw new ApiError(400, "Timetable version must be a number");
    }

    const division = await Division.findByPk(divisionId);

    if (!division) {
        throw new ApiError(404, "Division not found");
    }

    const timetable = await Timetable.create({
        divisionId: divisionId,
        timetableVersion: timetableVersion
    });

    res.status(201).json(new ApiResponse(201, "Timetable added successfully", timetable));
});

//* Update timetable
const updateTimetable = asyncHandler(async (req, res) => {
    const { timetableId, timetableVersion } = req.body;

    if (!timetableId) {
        throw new ApiError(400, "Timetable id is required");
    }

    if (!timetableVersion) {
        throw new ApiError(400, "Timetable version is required");
    }

    if (isNaN(Number(timetableVersion))) {
        throw new ApiError(400, "Timetable version must be a number");
    }

    const timetable = await Timetable.findByPk(timetableId);

    if (!timetable) {
        throw new ApiError(404, "Timetable not found");
    }

    if (timetable.timetableVersion >= timetableVersion) {
        throw new ApiError(400, "Timetable version must be greater than current version");
    }

    timetable.timetableVersion = timetableVersion;

    await timetable.save();

    res.status(200).json(new ApiResponse(200, "Timetable updated successfully", timetable));
});

//* Remove timetable
const removeTimetable = asyncHandler(async (req, res) => {
    const { timetableId } = req.query;

    if (!timetableId) {
        throw new ApiError(400, "Timetable id is required");
    }

    const timetable = await Timetable.findByPk(timetableId);

    if (!timetable) {
        throw new ApiError(404, "Timetable not found");
    }

    await timetable.destroy();

    res.status(200).json(new ApiResponse(200, "Timetable deleted successfully", null));
});

export {
    getTimetables,
    getTimetableById,
    addTimetable,
    updateTimetable,
    removeTimetable
}