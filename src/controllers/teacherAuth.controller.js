import Teacher from '../db/models/teacher.model.js';
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

//* generate access and refresh tokens for teachers at the time of login 
const generateAccessAndRefreshTokens = async (teacher) => {
    try {
        const newAccessToken = await teacher.generateAccessToken();
        const newRefreshToken = await teacher.generateRefreshToken();

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

    let teacherId;
    jwt.verify(actualRefreshToken, process.env.JWT_REFRESH_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            throw new ApiError(401, "Invalid refresh token") // Token invalid or expired
        }
        teacherId = decoded.id;
    });

    // console.log(teacherId)
    const teacher = await Teacher.findByPk(teacherId);

    if (!teacher) {
        throw new ApiError(401, "Teacher with this refresh token doesn't exist")
    }


    const { newAccessToken, newRefreshToken } = await generateAccessAndRefreshTokens(teacher)

    teacher.refreshToken = newRefreshToken;

    await teacher.save();

    res
        .status(200)
        .cookie("teacherAccessToken", newAccessToken, {
            ...options,
            maxAge: 86400000 /** bcz access token expiray is 1 day  */
        })
        .cookie("teacherRefreshToken", newRefreshToken, {
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

//* login teacher
const loginTeacher = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email) {
        throw new ApiError(400, "Email or PRN is needed")
    }


    const teacher = await Teacher.findOne({
        where: {
            email: email.toLowerCase()
        }
    })

    if (!teacher) {
        throw new ApiError(404, "No teacher found with entered credentials")
    }

    const isPasswordMatching = await teacher.isPasswordMatching(password);


    if (!isPasswordMatching) {
        throw new ApiError(400, "Password didn't match")
    }

    const { newAccessToken, newRefreshToken } = await generateAccessAndRefreshTokens(teacher);

    // avoiding the database request for saving time and manually adding the tokens
    teacher.refreshToken = newRefreshToken;

    await teacher.save();

    delete teacher.dataValues.password;
    delete teacher.dataValues.refreshToken;

    res
        .status(200)
        .cookie("teacherAccessToken", newAccessToken, {
            ...options,
            maxAge: 86400000 /** bcz access token expiray is 1 day  */
        })
        .cookie("teacherRefreshToken", newRefreshToken, {
            ...options,
            maxAge: 1296000000 /** bcz refresh token expiray is 15 day  */
        })
        .json(
            new ApiResponse(
                200,
                "Login Successful",
                {
                    teacher: teacher, accessToken: newAccessToken, refreshToken: newRefreshToken
                }
            )
        )
})


//* Change teacher password
const updateTeacherPassword = asyncHandler(async (req, res) => {
    const { password, confirmPassword } = req.body;

    if (!password || !confirmPassword) {
        throw new ApiError(400, "Both password and confirm password are required");
    }

    if (password !== confirmPassword) {
        throw new ApiError(400, "Password and confirm password field do not match");
    }

    const teacher = await Teacher.findByPk(req.teacher.id);

    if (!teacher) {
        throw new ApiError(404, "Teacher not found");
    }

    const isPasswordMatching = await teacher.isPasswordMatching(password);

    if (isPasswordMatching) {
        throw new ApiError(400, "New password can't be same as old password.")
    }

    teacher.password = password;

    await teacher.save();

    res.status(200).json(
        new ApiResponse(
            200,
            "Password updated successfully",
            null
        )
    );
});




//* logout teacher (remove cookies tokens)
const logout = asyncHandler(async (req, res) => {

    await Teacher.update(
        { refreshToken: null },
        {
            where: {
                id: req.teacher.id
            }
        }
    )

    res
        .status(200)
        .clearCookie('teacherAccessToken')
        .clearCookie('teacherRefreshToken')
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

    const teacher = await Teacher.findOne({ where: { email } })

    if (!teacher) {
        throw new ApiError(400, "Teacher with this email doesn't exists")
    }

    // Generate a random verification code (e.g., 6 digits)
    const code = generateVerificationCode()

    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    const record = await VerificationCode.create({
        email: teacher.email,
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
                `Verification code sent on ${teacher.email}`,
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

    const teacher = await Teacher.findOne({ where: { email: email.toLowerCase() } })

    await VerificationCode.destroy({ where: { email: email.toLowerCase() } })

    const { newAccessToken, newRefreshToken } = await generateAccessAndRefreshTokens(teacher);

    // avoiding the database request for saving time and manually adding the tokens
    teacher.refreshToken = newRefreshToken;

    await teacher.save();

    delete teacher.dataValues.password;
    delete teacher.dataValues.refreshToken;


    res
        .status(200)
        .cookie("teacherAccessToken", newAccessToken, {
            ...options,
            maxAge: 86400000 /** bcz access token expiray is 1 day  */
        })
        .cookie("teacherRefreshToken", newRefreshToken, {
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
    updateTeacherPassword,
    loginTeacher,
    sendVerificationCodeToEmail,
    verifyCode,
    getAccessToken,
    logout,
};
