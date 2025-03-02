import { Op } from 'sequelize';
import Batch from '../db/models/batch.model.js';
import Semester from '../db/models/semester.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import Branch from '../db/models/branch.model.js';
import Scheme from '../db/models/scheme.model.js';
import Division from '../db/models/division.model.js';

const getBatches = asyncHandler(async (req, res) => {
    const {
        semesterNumber,
        branchId,
        academicStartYear,
        academicEndYear,
        searchQuery,
        page = 1,
        limit = 10
    } = req.query;

    const searchClause = {}

    if (searchQuery) {
        searchClause.batchCode = {
            [Op.iLike]: `%${searchQuery}%`
        }
    }

    const semesterWhereClause = {}

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

    const batches = await Batch.findAll({
        where: searchClause,
        include: {
            model: Division,
            required: true,
            duplicating: false,
            include: [
                {
                    model: Semester,
                    required: true,
                    duplicating: false,
                    where: semesterWhereClause,
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
            ]
        },
        offset: offset,
        limit: limit
    });

    res.status(200).json(new ApiResponse(200, "Batches fetched successfully", batches));

})

const getBatchById = asyncHandler(async (req, res) => {
    const { batchId } = req.query;

    if (!batchId) {
        throw new ApiError(400, "Batch id is required");
    }

    const batch = await Batch.findOne({
        where: { id: batchId },
        include: [
            {
                model: Division,
                required: true,
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
            }
        ]
    });

    if (!batch) {
        throw new ApiError(404, "Batch not found");
    }

    res
        .status(200)
        .json(
            new ApiResponse(
                200,
                "Batch retrieved successfully",
                batch
            )
        );
})


const addBatch = asyncHandler(async (req, res) => {
    const {
        batchCode,
        semesterId,
    } = req.body;

    if (!batchCode || !semesterId) {
        throw new ApiError(400, "Batch code and semester id are required");
    }

    const semester = await Semester.findByPk(semesterId);
    if (!semester) {
        throw new ApiError(404, "Semester not found");
    }

    const batch = await Batch.create({
        batchCode: batchCode,
        semesterId: semesterId,
    });

    if (!batch) {
        throw new ApiError(500, "Some issue occured while adding batch");
    }

    res.status(201).json(new ApiResponse(201, "Batch added successfully", { batch }));
});

const updateBatch = asyncHandler(async (req, res) => {
    const {
        id,
        batchCode
    } = req.body;

    if (!id) {
        throw new ApiError(400, "Batch id is required");
    }

    if (!batchCode) {
        throw new ApiError(400, "Batch code is required");
    }

    const batch = await Batch.findByPk(id);

    if (!batch) {
        throw new ApiError(404, "Batch not found");
    }

    batch.batchCode = batchCode;

    await batch.save();

    res.status(200).json(new ApiResponse(200, "Batch updated successfully", batch));
});


const removeBatch = asyncHandler(async (req, res) => {
    const { id } = req.body;

    if (!id) {
        throw new ApiError(400, "Batch id is required");
    }

    const batch = await Batch.findByPk(id);

    if (!batch) {
        throw new ApiError(404, "Batch not found");
    }

    await batch.destroy();

    res.status(200).json(new ApiResponse(200, "Batch deleted successfully", null));
});

export {
    getBatches,
    addBatch,
    updateBatch,
    removeBatch,
    getBatchById
}
