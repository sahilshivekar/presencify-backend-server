import Admin from '../db/models/admin.model.js';
import VerificationCode from '../db/models/verificationCode.model.js'
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js'
import { ApiError } from '../utils/ApiError.js'
import { Op } from 'sequelize'
import { sendVerificationCode } from '../utils/email.js';
import { getAdminsSchema, emailSchema } from '../validators/admin.validators.js';
import crypto from 'crypto';
import jwt from 'jsonwebtoken'
import { type } from 'os';


//* generate verfication code for verifying email and forgot password
const generateVerificationCode = (length = 6) => {
    let code = '';
    for (let i = 0; i < length; i++) {
        code += crypto.randomInt(0, 10).toString();
    }
    return code;
}

//* options for setting cookies
const options = {
    httpOnly: true,
    secure: true,
}


//* Add new admin
const addAdmin = asyncHandler(async (req, res) => {

    const { email, username, password } = req.body;

    await Admin.create({
        email,
        username,
        password,
    });

    const newAdmin = await Admin.findOne({ email })

    if (!newAdmin) {
        throw new ApiError(500, "Some issue occuered while adding admin")
    }

    res
        .status(201)
        .json(
            new ApiResponse(
                201,
                'Admin added successfully',
                newAdmin
            )
        )

});

//* Change admin details (only email and password)
const updateAdminDetails = asyncHandler(async (req, res) => {

    const { email, username } = req.body;

    if (req.admin.username == username && req.admin.email == email) {
        throw new ApiError(400, "No changes detected. The username and email are the same as the current ones.")
    }

    const admin = await Admin.findByPk(req.admin.id);

    admin.username = username;
    admin.email = email.toLowerCase();
    await admin.save();

    res
        .status(200)
        .json(
            new ApiResponse(
                200,
                "Admin details updated successfully",
                admin
            )
        );
});



//* Remove admin
//* after this must remove the tokens stored on the device (for web in cookies and for android in sharedprefrences or datastore)
const removeAdmin = asyncHandler(async (req, res) => {

    const admin = await Admin.findByPk(req.admin.id);

    if (!admin) {
        throw new ApiError(404, "Admin not found");
    }

    await admin.destroy();

    res
        .status(200)
        .clearCookie("adminAccessToken")
        .clearCookie("adminRefreshToken")
        .json(
            new ApiResponse(
                200,
                "Admin account deleted successfully",
                "If you are not accessing this api from a browser then you must manually remove the tokens stored"
            )
        );
});


//* show all the admins
const getAdmins = asyncHandler(async (req, res) => {
    const {
        searchQuery,
        sortBy,
        sortOrder,
        page,
        limit
    } = req.query;

    const offset = (page - 1) * limit;

    let whereClause = {};

    if (searchQuery) {
        whereClause = {
            [Op.or]: [
                {
                    email: {
                        [Op.like]: `%${searchQuery}%`
                    }
                },
                {
                    username: {
                        [Op.like]: `%${searchQuery}%`
                    }
                }
            ]
        };
    }

    // Determine sorting order, defaults value are specified in the validators
    const orderClause = [[sortBy, sortOrder]];

    // Fetch admins from the database
    const admins = await Admin.findAll({
        where: whereClause,
        order: orderClause,
        offset: offset,
        limit: limit
    });

    // Return the list of admins
    res
        .status(200)
        .json(
            new ApiResponse(
                200,
                "Admins retrieved successfully.",
                admins
            )
        );
});




const getAdminDetails = asyncHandler(async (req, res) => {

    const admin = await Admin.scope("withPassword").findByPk(req.admin.id);

    if (!admin) {
        throw new ApiError(400, "Admin not found")
    }

    res.status(200).json(
        new ApiResponse(
            200,
            "Admin details retrieved successfully",
            admin
        )
    )
});

export {
    addAdmin,
    updateAdminDetails,
    removeAdmin,
    getAdmins,
    getAdminDetails,
};
