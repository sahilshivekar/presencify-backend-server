import Student from '../db/models/student.model.js';
import VerificationCode from '../db/models/verificationCode.model.js'
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js'
import { ApiError } from '../utils/ApiError.js'
import { Op } from 'sequelize'
import { sendVerificationCode } from '../utils/email.js';
import crypto from 'crypto';
import jwt from 'jsonwebtoken'
import { type } from 'os';
import httpStatus from 'http-status';


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

//* generate access and refresh tokens for students at the time of login 
const generateAccessAndRefreshTokens = async (student) => {
    try {
        const newAccessToken = await student.generateAccessToken();
        const newRefreshToken = await student.generateRefreshToken();

        return { newAccessToken, newRefreshToken }
    } catch (err) {
    // removed debug log
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Something went wrong while generating tokens")
    }
}

//* hit a end point to give access token by checking refresh token
const refreshTokens = asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;

    // Validation is handled by middleware

    const actualRefreshToken = refreshToken.replace("Bearer ", "");

    let decoded;
    try {
        decoded = jwt.verify(actualRefreshToken, process.env.JWT_REFRESH_TOKEN_SECRET);
    } catch (err) {
        throw new ApiError(httpStatus.UNAUTHORIZED, "Invalid refresh token");
    }

    const studentId = decoded.id;
    
    const student = await Student.findByPk(studentId);

    if (!student) {
        throw new ApiError(httpStatus.UNAUTHORIZED, "Student with this refresh token doesn't exist");
    }

    const { newAccessToken, newRefreshToken } = await generateAccessAndRefreshTokens(student);

    student.refreshToken = newRefreshToken;

    await student.save();

    res
        .status(httpStatus.OK)
        .cookie("studentAccessToken", newAccessToken, {
            ...options,
            maxAge: 86400000 /** bcz access token expiray is 1 day  */
        })
        .cookie("studentRefreshToken", newRefreshToken, {
            ...options,
            maxAge: 1296000000 /** bcz refresh token expiray is 15 day  */
        })
        .json(
            new ApiResponse(
                httpStatus.OK,
                "Access token refreshed successfully",
                {
                    accessToken: newAccessToken,
                    refreshToken: newRefreshToken
                })
        );

});

//* login student
const loginStudent = asyncHandler(async (req, res) => {
    const { emailOrPRN, password } = req.body;

    // Validation is handled by middleware

    const student = await Student.findOne({
        where: {
            [Op.or]: {
                email: emailOrPRN.toLowerCase(),
                prn: emailOrPRN
            }
        }
    })

    if (!student) {
        throw new ApiError(httpStatus.BAD_REQUEST, "No student found with entered credentials")
    }

    const isPasswordMatching = await student.isPasswordMatching(password);

    if (!isPasswordMatching) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Password didn't match")
    }

    const { newAccessToken, newRefreshToken } = await generateAccessAndRefreshTokens(student);

    // avoiding the database request for saving time and manually adding the tokens
    student.refreshToken = newRefreshToken;

    await student.save();

    delete student.dataValues.password;
    delete student.dataValues.refreshToken;

    res
        .status(httpStatus.OK)
        .cookie("studentAccessToken", newAccessToken, {
            ...options,
            maxAge: 86400000 /** bcz access token expiray is 1 day  */
        })
        .cookie("studentRefreshToken", newRefreshToken, {
            ...options,
            maxAge: 1296000000 /** bcz refresh token expiray is 15 day  */
        })
        .json(
            new ApiResponse(
                httpStatus.OK,
                "Login Successful",
                {
                    student: student, accessToken: newAccessToken, refreshToken: newRefreshToken
                }
            )
        )
})


//* Change student password
const updateStudentPassword = asyncHandler(async (req, res) => {
    const { password, confirmPassword } = req.body;

    // Validation is handled by middleware

    const student = await Student.findByPk(req.student.id);

    if (!student) {
        throw new ApiError(httpStatus.NOT_FOUND, "Student not found");
    }

    const isPasswordMatching = await student.isPasswordMatching(password);

    if (isPasswordMatching) {
        throw new ApiError(httpStatus.BAD_REQUEST, "New password can't be same as old password.")
    }

    student.password = password;

    await student.save();

    res.status(httpStatus.OK).json(
        new ApiResponse(
            httpStatus.OK,
            "Password updated successfully",
            null
        )
    );
});




//* logout student (remove cookies tokens)
const logout = asyncHandler(async (req, res) => {

    await Student.update(
        { refreshToken: null },
        {
            where: {
                id: req.student.id
            }
        }
    )

    res
        .status(httpStatus.OK)
        .clearCookie('studentAccessToken')
        .clearCookie('studentRefreshToken')
        .json(
            new ApiResponse(
                httpStatus.OK,
                "Logged out successfully",
                null
            )
        );
});

// send verification code to email
const sendVerificationCodeToEmail = asyncHandler(async (req, res) => {

    let { email } = req.body;

    // Validation is handled by middleware

    email = email.toLowerCase()
    
    const student = await Student.findOne({ where: { email } })

    if (!student) {
        throw new ApiError(httpStatus.NOT_FOUND, "Student with this email doesn't exists")
    }

    // Generate a random verification code (e.g., 6 digits)
    const code = generateVerificationCode()

    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    const record = await VerificationCode.create({
        email: student.email,
        code,
        expiresAt
    })

    if (!record) {
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Some issue occured while generating code")
    }

    // Call the email utility function to send the email
    const emailSent = await sendVerificationCode(email, code);

    if (!emailSent) {
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Error sending verification email");
    }

    setTimeout(
        async () => {
            await VerificationCode.destroy({
                where: {
                    [Op.and]: [{ email }, { code }]
                }
            })
            // removed debug log
        },
        5 * 60 * 1000
    )


    res
        .status(httpStatus.OK)
        .json(
            new ApiResponse(
                httpStatus.OK,
                `Verification code sent on ${student.email}`,
                {
                    expiresAt
                }
            )
        );
});


// verify if the user entered the code sent to him on his email
const verifyCode = asyncHandler(async (req, res) => {

    const { email, code } = req.body;

    // Validation is handled by middleware

    const codeRecord = await VerificationCode.findOne({
        where: {
            [Op.and]: [{ email:email.toLowerCase() }, { code }]
        }
    })

    if (!codeRecord) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Invalid verification code")
    }

    const student = await Student.findOne({ where: { email:email.toLowerCase() } })

    await VerificationCode.destroy({ where: { email:email.toLowerCase() } })

    const { newAccessToken, newRefreshToken } = await generateAccessAndRefreshTokens(student);

    // avoiding the database request for saving time and manually adding the tokens
    student.refreshToken = newRefreshToken;

    await student.save();

    delete student.dataValues.password;
    delete student.dataValues.refreshToken;


    res
        .status(httpStatus.OK)
        .cookie("studentAccessToken", newAccessToken, {
            ...options,
            maxAge: 86400000 /** bcz access token expiray is 1 day  */
        })
        .cookie("studentRefreshToken", newRefreshToken, {
            ...options,
            maxAge: 1296000000 /** bcz refresh token expiray is 15 day  */
        })
        .json(
            new ApiResponse(
                httpStatus.OK,
                "Verification successful!",
                {
                    accessToken: newAccessToken, refreshToken: newRefreshToken
                }
            )
        )
})


export {
    updateStudentPassword,
    loginStudent,
    sendVerificationCodeToEmail,
    verifyCode,
    refreshTokens,
    logout,
};
