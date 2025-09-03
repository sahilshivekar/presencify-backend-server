import Scheme from '../db/models/scheme.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js'
import { ApiError } from '../utils/ApiError.js'
import { Op } from 'sequelize'
import University from '../db/models/university.model.js';


//* get all the schemes
const getSchemes = asyncHandler(async (req, res) => {

    const { searchQuery } = req.query;

    const searchClause = {};

    if (searchQuery) {
        searchClause = {
            [Op.or]: [
                {
                    name: {
                        [Op.like]: `%${searchQuery}%`
                    }
                },
                {
                    abbreviation: {
                        [Op.like]: `%${searchQuery}%`
                    }
                }
            ]
        };
    }

    const schemes = await Scheme.findAll({
        where: searchClause
    });

    res
        .status(200)
        .json(
            new ApiResponse(
                200,
                "Schemes retrieved successfully.",
                schemes
            )
        );

});


//* add scheme
const addScheme = asyncHandler(async (req, res) => {

    const { name, universityId } = req.body;

    const university = await University.findByPk(universityId);

    if (!university) {
        throw new ApiError(404, "University not found");
    }

    const scheme = await Scheme.create({
        name: name || "",
        universityId: universityId || null
    });

    res
        .status(201)
        .json(
            new ApiResponse(
                201,
                'Scheme added successfully',
                scheme
            )
        )

});

//* update scheme
const updateScheme = asyncHandler(async (req, res) => {

    const { id, name } = req.body;

    if (!id) {
        throw new ApiError(400, "Scheme id is required");
    }

    const scheme = await Scheme.findByPk(id);

    if (!scheme) {
        throw new ApiError(404, "Scheme not found");
    }

    scheme.name = name || scheme.name;

    await scheme.save();

    res
        .status(200)
        .json(
            new ApiResponse(
                200,
                "Scheme updated successfully",
                scheme
            )
        );
});

//* remove scheme
const removeScheme = asyncHandler(async (req, res) => {

    const { id } = req.body;

    if (!id) {
        throw new ApiError(400, "Scheme id is required");
    }

    const scheme = await Scheme.findByPk(id);

    if (!scheme) {
        throw new ApiError(404, "Scheme not found");
    }

    await scheme.destroy();

    res
        .status(200)
        .json(
            new ApiResponse(
                200,
                "Scheme deleted successfully",
                null
            )
        );
});

const getSchemeById = asyncHandler(async (req, res) => {
    const { schemeId } = req.query;

    if (!schemeId) {
        throw new ApiError(400, "Scheme id is required");
    }

    const scheme = await Scheme.findOne({
        where: { id: schemeId },
        include: [
            {
                model: University,
                required: true,
            }
        ]
    });

    if (!scheme) {
        throw new ApiError(404, "Scheme not found");
    }

    res
        .status(200)
        .json(
            new ApiResponse(
                200,
                "Scheme retrieved successfully",
                scheme
            )
        );
});

export {
    getSchemes,
    addScheme,
    updateScheme,
    removeScheme,
    getSchemeById
};