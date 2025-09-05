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
const refreshTokens = asyncHandler(async (req, res) => {

    const { refreshToekn } = req.body;

    const actualToken = refreshToekn.replace("Bearer ", "");

    const decoded = jwt.verify(actualToken, process.env.JWT_REFRESH_TOKEN_SECRET);

    const admin = await Admin.findByPk(decoded.id);

    if (!admin) {
        throw new ApiError(httpStatus.UNAUTHORIZED, "Invalid refresh token");
    }

    const { newAccessToken, newRefreshToken } = await generateAccessAndRefreshTokens(admin.id);

    admin.refreshToken = newRefreshToken;

    await admin.save();

    res
        .status(200)
        .cookie("adminAccessToken", newAccessToken, {
            ...options,
            maxAge: 86400000 // 1 day
        })
        .cookie("adminRefreshToken", newRefreshToken, {
            ...options,
            maxAge: 1296000000 // 15 days
        })
        .json(
            new ApiResponse(
                200,
                "Access token refreshed successfully",
                {
                    accessToken: newAccessToken,
                    refreshToken: newRefreshToken
                }
            )
        );
});


const login = asyncHandler(async (req, res) => {

    const { emailOrUsername, password } = req.body;

    const admin = await Admin.scope('withPassword').findOne({
        where: {
            [Op.or]: {
                email: emailOrUsername.toLowerCase(),
                username: emailOrUsername
            }
        }
    });

    if (!admin) {
        throw new ApiError(httpStatus.UNAUTHORIZED, "Invalid email or username");
    }

    const isPasswordMatching = await admin.isPasswordMatching(password);

    if (!isPasswordMatching) {
        throw new ApiError(httpStatus.UNAUTHORIZED, "Invalid password");
    }

    const { newAccessToken, newRefreshToken } = await generateAccessAndRefreshTokens(admin);

    admin.refreshToken = newRefreshToken;
    await admin.save();

    delete admin.password;
    delete admin.refreshToken;

    res
        .status(200)
        .cookie("adminAccessToken", newAccessToken, { ...options, maxAge: 86400000 })
        .cookie("adminRefreshToken", newRefreshToken, { ...options, maxAge: 1296000000 })
        .json(
            new ApiResponse(
                200,
                "Login Successful",
                {
                    admin: admin,
                    accessToken: newAccessToken,
                    refreshToken: newRefreshToken
                }
            )
        );
});


//* Verify if the password is correct
const verifyPassword = asyncHandler(async (req, res) => {

    const { password } = req.body;

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

    // check the routers file if didn't get why we are taking emails this way
    if (!email && !req?.admin?.email) {
        throw new ApiError(400, "Email is required");
    }

    if (req?.admin?.email) {
        email = req?.admin?.email.toLowerCase()
    }

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

    const codeRecord = await VerificationCode.findOne({
        where: {
            [Op.and]: [{ email: email.toLowerCase() }, { code }]
        }
    })

    if (!codeRecord) {
        throw new ApiError(400, "Invalid verification code")
    }

    const admin = await Admin.scope('withPassword').findOne({ where: { email: email.toLowerCase() } })

    if (!admin.isVerified) {
        admin.isVerified = true;
        await admin.save()
    }

    await VerificationCode.destroy({ where: { email: email.toLowerCase() } })

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


export {
    updateAdminPassword,
    verifyPassword,
    verifyCode,
    login,
    sendVerificationCodeToEmail,
    refreshTokens,
    logout,
};
