import University from '../db/models/university.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js'
import { ApiError } from '../utils/ApiError.js'
import { Op } from 'sequelize'

//* get all the universities
const getUniversities = asyncHandler(async (req, res) => {

    const universities = await University.findAll();

    res
        .status(200)
        .json(
            new ApiResponse(
                200,
                "Universities retrieved successfully.",
                universities
            )
        );

});


//* add university
const addUniversity = asyncHandler(async (req, res) => {

    const { name, abbreviation } = req.body;

    const university = await University.create({
        name: name || "",
        abbreviation: abbreviation || ""
    });

    res
        .status(201)
        .json(
            new ApiResponse(
                201,
                'University added successfully',
                university
            )
        )

});

//* update university
const updateUniversity = asyncHandler(async (req, res) => {

    const {id, name, abbreviation } = req.body;

    if(!id) {
        throw new ApiError(400, "University id is required");
    }

    const university = await University.findByPk(id);
    
    if (!university) {
        throw new ApiError(404, "University not found");
    }

    university.name = name || university.name;
    university.abbreviation = abbreviation || abbreviation;

    await university.save();

    res
        .status(200)
        .json(
            new ApiResponse(
                200,
                "University updated successfully",
                university
            )
        );
});

//* remove university
const removeUniversity = asyncHandler(async (req, res) => {

    const { id } = req.body;

    if(!id) {
        throw new ApiError(400, "University id is required");
    }

    const university = await University.findByPk(id);

    if (!university) {
        throw new ApiError(404, "University not found");
    }

    await university.destroy();

    res
        .status(200)
        .json(
            new ApiResponse(
                200,
                "University deleted successfully",
                null
            )
        );
});

const getUniversityById = asyncHandler(async (req, res) => {
    const { universityId } = req.query;

    if (!universityId) {
        throw new ApiError(400, "University id is required");
    }

    const university = await University.findByPk(universityId);

    if (!university) {
        throw new ApiError(404, "University not found");
    }

    res
        .status(200)
        .json(
            new ApiResponse(
                200,
                "University retrieved successfully",
                university
            )
        );
}); 

export {
    getUniversities,
    addUniversity,
    updateUniversity,
    removeUniversity,
    getUniversityById
};  