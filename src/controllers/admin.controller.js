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

//* generate access and refresh tokens for admins at the time of login 
const generateAccessAndRefreshTokens = async (admin) => {
    try {
        const newAccessToken = await admin.generateAccessToken();
        const newRefreshToken = await admin.generateRefreshToken();

        return { newAccessToken, newRefreshToken }
    } catch (err) {
        throw new ApiError(500, "Something went wrong while generating tokens")
    }
}

//* hit a end point to give access token by checking refresh token
const getAccessToken = asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        throw new ApiError(401, "Refresh token is required")
    }

    const actualRefreshToken = refreshToken.replace("Bearer ", "");

    let adminId;
    jwt.verify(actualRefreshToken, process.env.JWT_REFRESH_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            throw new ApiError(401, "Invalid refresh token") // Token invalid or expired
        }
        adminId = decoded.id;
    });
    
    console.log(adminId)
    const admin = await Admin.findByPk(adminId);

    if (!admin) {
        throw new ApiError(401, "Admin with this refresh token doesn't exist")
    }


    const { newAccessToken, newRefreshToken } = await generateAccessAndRefreshTokens(admin)

    admin.refreshToken = newRefreshToken;

    await admin.save();

    res
        .status(200)
        .cookie("adminAccessToken", newAccessToken, {
            ...options,
            maxAge: 86400000 /** bcz access token expiray is 1 day  */
        })
        .cookie("adminRefreshToken", newRefreshToken, {
            ...options,
            maxAge: 1296000000 /** bcz refresh token expiray is 15 day  */
        })
        .json(
            new ApiResponse(
                200,
                "Access token refreshed successfully",
                {
                    accessToken: newAccessToken,
                    refreshToken: newRefreshToken
                })
        )

});

//* login admin
const loginAdmin = asyncHandler(async (req, res) => {
    const { emailOrUsername, password } = req.body;

    if (!emailOrUsername) {
        throw new ApiError(400, "Username or Email is needed")
    }

    const admin = await Admin.scope('withPassword').findOne({
        where: {
            [Op.or]: {
                email: emailOrUsername,
                username: emailOrUsername
            }
        }
    })

    if (!admin) {
        throw new ApiError(404, "No admin found with entered credentials")
    }

    const isPasswordMatching = await admin.isPasswordMatching(password);


    if (!isPasswordMatching) {
        throw new ApiError(400, "Password didn't match")
    }

    const { newAccessToken, newRefreshToken } = await generateAccessAndRefreshTokens(admin);

    // avoiding the database request for saving time and manually adding the tokens
    admin.refreshToken = newRefreshToken;

    await admin.save();

    delete admin.dataValues.password;
    delete admin.dataValues.refreshToken;

    res
        .status(200)
        .cookie("adminAccessToken", newAccessToken, {
            ...options,
            maxAge: 86400000 /** bcz access token expiray is 1 day  */
        })
        .cookie("adminRefreshToken", newRefreshToken, {
            ...options,
            maxAge: 1296000000 /** bcz refresh token expiray is 15 day  */
        })
        .json(
            new ApiResponse(
                200,
                "Login Successful",
                {
                    admin: admin, accessToken: newAccessToken, refreshToken: newRefreshToken
                }
            )
        )
})

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

    if (!email) {
        throw new ApiError(400, "Email is required");
    }

    if (!username) {
        throw new ApiError(400, "Username is required");
    }

    if (req.admin.username == username && req.admin.email == email) {
        throw new ApiError(400, "No changes detected. The username and email are the same as the current ones.")
    }

    const admin = await Admin.findByPk(req.admin.id);

    admin.username = username;
    admin.email = email;

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

//* Verify if the password is correct
const verifyPassword = asyncHandler(async (req, res) => {

    const { password } = req.body;

    if (!password) {
        throw new ApiError(400, "Password is required");
    }

    const admin = await Admin.scope('withPassword').findByPk(req.admin.id);

    if (!admin) {
        throw new ApiError(404, "Admin not found");
    }

    const isPasswordMatching = await admin.isPasswordMatching(password);

    if (!isPasswordMatching) {
        throw new ApiError(400, "Password is incorrect");
    }

    res.status(200).json(
        new ApiResponse(
            200,
            "Password is correct",
            null
        )
    );
});

//* Change admin password
const updateAdminPassword = asyncHandler(async (req, res) => {
    const { password, confirmPassword } = req.body;

    if (!password || !confirmPassword) {
        throw new ApiError(400, "Both password and confirm password are required");
    }

    if (password !== confirmPassword) {
        throw new ApiError(400, "Password and confirm password field do not match");
    }

    const admin = await Admin.scope('withPassword').findByPk(req.admin.id);

    if (!admin) {
        throw new ApiError(404, "Admin not found");
    }

    const isPasswordMatching = await admin.isPasswordMatching(password);

    if (isPasswordMatching) {
        throw new ApiError(400, "New password can't be same as old password.")
    }

    admin.password = password;

    await admin.save();

    res.status(200).json(
        new ApiResponse(
            200,
            "Password updated successfully",
            null
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
        page = 1,
        limit = 10
    } = req.query;

    await getAdminsSchema.validateAsync(req.query)

    const pageNumber = parseInt(page, 10);
    const pageSize = parseInt(limit, 10);

    const offset = (pageNumber - 1) * pageSize;

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


//* logout admin (remove cookies tokens)
const logout = asyncHandler(async (req, res) => {

    await Admin.update(
        { refreshToken: null },
        {
            where: {
                id: req.admin.id
            }
        }
    )

    res
        .status(200)
        .clearCookie('adminAccessToken')
        .clearCookie('adminRefreshToken')
        .json(
            new ApiResponse(
                200,
                "Logged out successfully",
                "If you are not accessing this api from a browser then you must manually remove the tokens stored"
            )
        );
});

// send verification code to email
const sendVerificationCodeToEmail = asyncHandler(async (req, res) => {

    let { email } = req.body;

    await emailSchema.validateAsync(req.body)

    // check the routers file if didn't get why we are taking emails this way
    if (!email && !req?.admin?.email) {
        throw new ApiError(400, "Email is required");
    }

    email = email || req?.admin?.email;

    const admin = await Admin.findOne({ where: { email } })

    if (!admin) {
        throw new ApiError(400, "Admin with this email doesn't exists")
    }

    // Generate a random verification code (e.g., 6 digits)
    const code = generateVerificationCode()

    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    const record = await VerificationCode.create({
        email: admin.email,
        code,
        expiresAt
    })

    if (!record) {
        throw new ApiError(500, "Some issue occured while generating code")
    }

    // Call the email utility function to send the email
    const emailSent = await sendVerificationCode(email, code);

    if (!emailSent) {
        throw new ApiError(500, "Error sending verification email");
    }

    setTimeout(
        async () => {
            await VerificationCode.destroy({
                where: {
                    [Op.and]: [{ email }, { code }]
                }
            })
            console.log(`Verfication code for ${email} is deleted due to timeout`)
        },
        5 * 60 * 1000
    )


    res
        .status(200)
        .json(
            new ApiResponse(
                200,
                `Verification code sent on ${admin.email}`,
                {
                    expiresAt
                }
            )
        );
});

// verify if the user entered the code sent to him on his email
const verifyCode = asyncHandler(async (req, res) => {

    const { email, code } = req.body;

    await emailSchema.validateAsync({ email })

    if (!code) {
        throw new ApiError(400, "Please enter the code")
    }

    const codeRecord = await VerificationCode.findOne({
        where: {
            [Op.and]: [{ email }, { code }]
        }
    })

    if (!codeRecord) {
        throw new ApiError(400, "Invalid verification code")
    }

    const admin = await Admin.scope('withPassword').findOne({ where: { email } })

    if (!admin.isVerified) {
        admin.isVerified = true;
        await admin.save()
    }

    await VerificationCode.destroy({ where: { email } })

    const { newAccessToken, newRefreshToken } = await generateAccessAndRefreshTokens(admin);

    // avoiding the database request for saving time and manually adding the tokens
    admin.refreshToken = newRefreshToken;

    await admin.save();

    delete admin.dataValues.password;
    delete admin.dataValues.refreshToken;


    res
        .status(200)
        .cookie("adminAccessToken", newAccessToken, {
            ...options,
            maxAge: 86400000 /** bcz access token expiray is 1 day  */
        })
        .cookie("adminRefreshToken", newRefreshToken, {
            ...options,
            maxAge: 1296000000 /** bcz refresh token expiray is 15 day  */
        })
        .json(
            new ApiResponse(
                200,
                "Verification successful!",
                {
                    accessToken: newAccessToken, refreshToken: newRefreshToken
                }
            )
        )
})

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
    loginAdmin,
    addAdmin,
    updateAdminDetails,
    updateAdminPassword,
    verifyPassword,
    removeAdmin,
    getAdmins,
    sendVerificationCodeToEmail,
    verifyCode,
    getAccessToken,
    logout,
    getAdminDetails
};
