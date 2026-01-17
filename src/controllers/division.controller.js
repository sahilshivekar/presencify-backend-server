import Division from '../db/models/division.model.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { Op } from 'sequelize';
import Semester from '../db/models/semester.model.js';
import Branch from '../db/models/branch.model.js';
import Scheme from '../db/models/scheme.model.js';
import Batch from '../db/models/batch.model.js';
import httpStatus from 'http-status';

const getDivisions = asyncHandler(async (req, res) => {
    const {
        semesterNumber,
        branchId,
        semesterId,
        academicStartYear,
        academicEndYear,
        searchQuery,
        page = 1,
        limit = 10,
        getAll = false,
    } = req.query;

    const searchClause = {};

    if (searchQuery) {
        searchClause.divisionCode = {
            [Op.iLike]: `%${searchQuery}%`
        }
    }

    const semesterWhereClause = {};

    if (semesterNumber) {
        semesterWhereClause.semesterNumber = {
            [Op.eq]: semesterNumber
        }
    }

    if (branchId) {
        semesterWhereClause.branchId = {
            [Op.eq]: branchId
        }
    }

    if (academicStartYear) {
        semesterWhereClause.academicStartYear = {
            [Op.gte]: academicStartYear
        }
    }

    if (academicEndYear) {
        semesterWhereClause.academicEndYear = {
            [Op.lte]: academicEndYear
        }
    }

    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const divisions = await Division.findAndCountAll({
        where: {
            [Op.and]: [
                searchClause,
                ...(semesterId ? [{ semesterId }] : []),
            ]
        },
        include: [
            {
                model: Semester,
                required: true,
                where: semesterWhereClause,
                duplicating: false,
                include: [
                    {
                        model: Branch,
                        required: true,
                        duplicating: false,
                    },
                    {
                        model: Scheme,
                        required: true,
                        duplicating: false,
                    }
                ]
            },
            {
                model: Batch,
            }
        ],
        ...(limit ? { offset: offset, } : {}),
        ...(limit && getAll === false ? { limit } : {})
    });
    res.status(httpStatus.OK).json(new ApiResponse(httpStatus.OK, "Divisions fetched successfully", {
        divisions: divisions.rows,
        totalCount: divisions.count
    }));
});

const addDivision = asyncHandler(async (req, res) => {
    const {
        divisionCode,
        semesterId,
    } = req.body;

    // Input validation is handled by @division.validation.js

    const semester = await Semester.findByPk(semesterId);
    if (!semester) {
        throw new ApiError(httpStatus.NOT_FOUND, "Semester not found");
    }

    // Check for duplicate divisionCode in the same semester
    const existingDivision = await Division.findOne({
        where: {
            divisionCode: divisionCode,
            semesterId: semesterId,
        }
    });
    if (existingDivision) {
        throw new ApiError(httpStatus.CONFLICT, "Duplicate divisionCode in the same semester is not allowed");
    }

    const division = await Division.create({
        divisionCode: divisionCode,
        semesterId: semesterId,
    });

    if (!division) {
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Some issue occured while adding division");
    }

    res.status(httpStatus.CREATED).json(new ApiResponse(httpStatus.CREATED, "Division added successfully", { division }));
});

const updateDivision = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { divisionCode } = req.body;

    // Input validation is handled by @division.validation.js

    const division = await Division.findByPk(id);

    if (!division) {
        throw new ApiError(httpStatus.NOT_FOUND, "Division not found");
    }

    division.divisionCode = divisionCode;

    await division.save();

    res.status(httpStatus.OK).json(new ApiResponse(httpStatus.OK, "Division updated successfully", division));
});

const removeDivision = asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Input validation is handled by @division.validation.js

    const division = await Division.findByPk(id);

    if (!division) {
        throw new ApiError(httpStatus.NOT_FOUND, "Division not found");
    }

    await division.destroy();

    res.status(httpStatus.OK).json(new ApiResponse(httpStatus.OK, "Division deleted successfully", null));
});

const getDivisionById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Input validation is handled by @division.validation.js

    const division = await Division.findOne({
        where: { id: id },
        include: [
            {
                model: Semester,
                required: true,
                include: [
                    {
                        model: Branch,
                        required: true,
                    },
                    {
                        model: Scheme,
                        required: true,
                    }
                ]
            }
        ]
    });

    if (!division) {
        throw new ApiError(httpStatus.NOT_FOUND, "Division not found");
    }

    res
        .status(httpStatus.OK)
        .json(
            new ApiResponse(
                httpStatus.OK,
                "Division retrieved successfully",
                division
            )
        );
});

export {
    getDivisions,
    addDivision,
    updateDivision,
    removeDivision,
    getDivisionById
}