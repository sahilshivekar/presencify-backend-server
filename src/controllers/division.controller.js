import Division from '../db/models/division.model.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { Op } from 'sequelize';
import Semester from '../db/models/semester.model.js';
import Branch from '../db/models/branch.model.js';
import Scheme from '../db/models/scheme.model.js';
const getDivisions = asyncHandler(async (req, res) => {

  
    res.status(200).json(new ApiResponse(200, "Divisions fetched successfully", {
        divisions: divisions.rows,
        totalCount: divisions.count
    }));
});

const addDivision = asyncHandler(async (req, res) => {
    const {
        divisionCode,
        semesterId,
    } = req.body;
    if (!divisionCode || !semesterId) {
        throw new ApiError(400, "Division code and semester id are required");
    }

    const semester = await Semester.findByPk(semesterId);
    if (!semester) {
        throw new ApiError(404, "Semester not found");
    }

    const division = await Division.create({
        divisionCode: divisionCode,
        semesterId: semesterId,
    });

    if (!division) {
        throw new ApiError(500, "Some issue occured while adding division");
    }

    res.status(201).json(new ApiResponse(201, "Division added successfully", { division }));
});

const updateDivision = asyncHandler(async (req, res) => {
    const {
        id,
        divisionCode
    } = req.body;

    if (!id) {
        throw new ApiError(400, "Division id is required");
    }

    if(!divisionCode){
        throw new ApiError(400, "Division code is required");
    }

    const division = await Division.findByPk(id);

    if (!division) {
        throw new ApiError(404, "Division not found");
    }

    division.divisionCode = divisionCode;

    await division.save();

    res.status(200).json(new ApiResponse(200, "Division updated successfully", division));
});


const removeDivision = asyncHandler(async (req, res) => {
    const { id } = req.body;

    if (!id) {
        throw new ApiError(400, "Division id is required");
    }

    const division = await Division.findByPk(id);

    if (!division) {
        throw new ApiError(404, "Division not found");
    }

    await division.destroy();

    res.status(200).json(new ApiResponse(200, "Division deleted successfully", null));
});


const getDivisionById = asyncHandler(async (req, res) => {
    const { divisionId } = req.query;

    if (!divisionId) {
        throw new ApiError(400, "Division id is required");
    }

    const division = await Division.findOne({
        where: { id: divisionId },
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
        throw new ApiError(404, "Division not found");
    }

    res
        .status(200)
        .json(
            new ApiResponse(
                200,
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