import Branch from '../db/models/branch.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js'
import { ApiError } from '../utils/ApiError.js'
import { Op } from 'sequelize'

//* get all the branches
const getBranches = asyncHandler(async (req, res) => {

    const {
        searchQuery
    } = req.query;

    const whereClause = {};

    if (searchQuery) {
        whereClause.name = {
            [Op.iLike]: `%${searchQuery}%`
        }
    }

    const branches = await Branch.findAll({
        where: whereClause
    });

    res
        .status(200)
        .json(
            new ApiResponse(
                200,
                "Branches retrieved successfully.",
                branches
            )
        );
});


//* add branch
const addBranch = asyncHandler(async (req, res) => {

    const { name, abbreviation } = req.body;

    const branch = await Branch.create({
        name: name || "",
        abbreviation: abbreviation || "",
    });

    res
        .status(201)
        .json(
            new ApiResponse(
                201,
                'Branch added successfully',
                branch
            )
        )

});

//* update branch
const updateBranch = asyncHandler(async (req, res) => {

    const { id } = req.params;
    const { name, abbreviation } = req.body;

    if (!id) {
        throw new ApiError(400, "Branch id is required");
    }

    const branch = await Branch.findByPk(id);

    if (!branch) {
        throw new ApiError(404, "Branch not found");
    }

    branch.name = name || branch.name;
    branch.abbreviation = abbreviation || branch.abbreviation;

    await branch.save();

    res
        .status(200)
        .json(
            new ApiResponse(
                200,
                "Branch updated successfully",
                branch
            )
        );
});

//* remove branch
const removeBranch = asyncHandler(async (req, res) => {

    const { id } = req.params;

    if (!id) {
        throw new ApiError(400, "Branch id is required");
    }

    const branch = await Branch.findByPk(id);

    if (!branch) {
        throw new ApiError(404, "Branch not found");
    }

    await branch.destroy();

    res
        .status(200)
        .json(
            new ApiResponse(
                200,
                "Branch deleted successfully",
                null
            )
        );
});

const getBranchById = asyncHandler(async (req, res) => {    
    const { id } = req.params;

    if (!id) {
        throw new ApiError(400, "Branch id is required");
    }

    const branch = await Branch.findByPk(id);

    if (!branch) {
        throw new ApiError(404, "Branch not found");
    }

    res
        .status(200)
        .json(
            new ApiResponse(
                200,
                "Branch retrieved successfully",
                branch
            )
        );
});

export {
    getBranches,
    addBranch,
    updateBranch,
    removeBranch,
    getBranchById
};