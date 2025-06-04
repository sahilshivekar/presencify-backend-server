import Staff from '../db/models/staff.model.js';
import VerificationCode from '../db/models/verificationCode.model.js'
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js'
import { ApiError } from '../utils/ApiError.js'
import { Op } from 'sequelize'
import { sendVerificationCode } from '../utils/email.js';
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

//* generate access and refresh tokens for staffs at the time of login 
const generateAccessAndRefreshTokens = async (staff) => {
    try {
        const newAccessToken = await staff.generateAccessToken();
        const newRefreshToken = await staff.generateRefreshToken();

        return { newAccessToken, newRefreshToken }
    } catch (err) {
        console.log(err)
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

    let staffId;
    jwt.verify(actualRefreshToken, process.env.JWT_REFRESH_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            throw new ApiError(401, "Invalid refresh token") // Token invalid or expired
        }
        staffId = decoded.id;
    });

    // console.log(staffId)
    const staff = await Staff.findByPk(staffId);

    if (!staff) {
        throw new ApiError(401, "Staff with this refresh token doesn't exist")
    }


    const { newAccessToken, newRefreshToken } = await generateAccessAndRefreshTokens(staff)

    staff.refreshToken = newRefreshToken;

    await staff.save();

    res
        .status(200)
        .cookie("staffAccessToken", newAccessToken, {
            ...options,
            maxAge: 86400000 /** bcz access token expiray is 1 day  */
        })
        .cookie("staffRefreshToken", newRefreshToken, {
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

//* login staff
const loginStaff = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email) {
        throw new ApiError(400, "Email or PRN is needed")
    }


    const staff = await Staff.findOne({
        where: {
            email: email.toLowerCase()
        }
    })

    if (!staff) {
        throw new ApiError(404, "No staff found with entered credentials")
    }

    const isPasswordMatching = await staff.isPasswordMatching(password);


    if (!isPasswordMatching) {
        throw new ApiError(400, "Password didn't match")
    }

    const { newAccessToken, newRefreshToken } = await generateAccessAndRefreshTokens(staff);

    // avoiding the database request for saving time and manually adding the tokens
    staff.refreshToken = newRefreshToken;

    await staff.save();

    delete staff.dataValues.password;
    delete staff.dataValues.refreshToken;

    res
        .status(200)
        .cookie("staffAccessToken", newAccessToken, {
            ...options,
            maxAge: 86400000 /** bcz access token expiray is 1 day  */
        })
        .cookie("staffRefreshToken", newRefreshToken, {
            ...options,
            maxAge: 1296000000 /** bcz refresh token expiray is 15 day  */
        })
        .json(
            new ApiResponse(
                200,
                "Login Successful",
                {
                    staff: staff, accessToken: newAccessToken, refreshToken: newRefreshToken
                }
            )
        )
})


//* Change staff password
const updateStaffPassword = asyncHandler(async (req, res) => {
    const { password, confirmPassword } = req.body;

    if (!password || !confirmPassword) {
        throw new ApiError(400, "Both password and confirm password are required");
    }

    if (password !== confirmPassword) {
        throw new ApiError(400, "Password and confirm password field do not match");
    }

    const staff = await Staff.findByPk(req.staff.id);

    if (!staff) {
        throw new ApiError(404, "Staff not found");
    }

    const isPasswordMatching = await staff.isPasswordMatching(password);

    if (isPasswordMatching) {
        throw new ApiError(400, "New password can't be same as old password.")
    }

    staff.password = password;

    await staff.save();

    res.status(200).json(
        new ApiResponse(
            200,
            "Password updated successfully",
            null
        )
    );
});




//* logout staff (remove cookies tokens)
const logout = asyncHandler(async (req, res) => {

    await Staff.update(
        { refreshToken: null },
        {
            where: {
                id: req.staff.id
            }
        }
    )

    res
        .status(200)
        .clearCookie('staffAccessToken')
        .clearCookie('staffRefreshToken')
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
    if (!email) {
        throw new ApiError(400, "Email is required");
    }

    email = email.toLowerCase()

    const staff = await Staff.findOne({ where: { email } })

    if (!staff) {
        throw new ApiError(400, "Staff with this email doesn't exists")
    }

    // Generate a random verification code (e.g., 6 digits)
    const code = generateVerificationCode()

    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    const record = await VerificationCode.create({
        email: staff.email,
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
                `Verification code sent on ${staff.email}`,
                {
                    expiresAt
                }
            )
        );
});


// verify if the user entered the code sent to him on his email
const verifyCode = asyncHandler(async (req, res) => {

    const { email, code } = req.body;

    if (!code) {
        throw new ApiError(400, "Please provide the code")
    }

    const codeRecord = await VerificationCode.findOne({
        where: {
            [Op.and]: [{ email: email.toLowerCase() }, { code }]
        }
    })

    if (!codeRecord) {
        throw new ApiError(400, "Invalid verification code")
    }

    const staff = await Staff.findOne({ where: { email: email.toLowerCase() } })

    await VerificationCode.destroy({ where: { email: email.toLowerCase() } })

    const { newAccessToken, newRefreshToken } = await generateAccessAndRefreshTokens(staff);

    // avoiding the database request for saving time and manually adding the tokens
    staff.refreshToken = newRefreshToken;

    await staff.save();

    delete staff.dataValues.password;
    delete staff.dataValues.refreshToken;


    res
        .status(200)
        .cookie("staffAccessToken", newAccessToken, {
            ...options,
            maxAge: 86400000 /** bcz access token expiray is 1 day  */
        })
        .cookie("staffRefreshToken", newRefreshToken, {
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
    updateStaffPassword,
    loginStaff,
    sendVerificationCodeToEmail,
    verifyCode,
    getAccessToken,
    logout,
};
