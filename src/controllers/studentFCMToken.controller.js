import { Op } from 'sequelize';
import { asyncHandler } from '../utils/asyncHandler.js';
import Student from '../db/models/student.model.js'
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import StudentFCMToken from '../db/models/studentFCMToken.model.js';
import httpStatus from 'http-status';

const addStudentFCMTokens = asyncHandler(async (req, res) => {
    const { studentId, fcmToken } = req.body;

    // Input validation is handled by @studentFCMToken.validation.js

    const student = await Student.findByPk(studentId);

    if (!student) {
        throw new ApiError(httpStatus.NOT_FOUND, "Student not found");
    }

    const studentFCMToken = await StudentFCMToken.findOne({
        where: {
            studentId: studentId,
            fcmToken: fcmToken
        }
    })

    if (studentFCMToken) {
        throw new ApiError(httpStatus.CONFLICT, "FCM token is already added for this student");
    }

    const studentFCMTokenEntry = await StudentFCMToken.create({
        studentId: studentId,
        fcmToken: fcmToken
    });

    res
        .status(httpStatus.CREATED)
        .json(
            new ApiResponse(
                httpStatus.CREATED,
                "FCM token added successfully",
                studentFCMTokenEntry
            )
        );
})


const updateStudentFCMTokens = asyncHandler(async (req, res) => {
    const { studentId, fcmToken } = req.body;

    // Input validation is handled by @studentFCMToken.validation.js

    const student = await Student.findByPk(studentId);

    if (!student) {
        throw new ApiError(httpStatus.NOT_FOUND, "Student not found");
    }

    const studentFCMToken = await StudentFCMToken.findOne({
        where: {
            studentId: studentId,
            fcmToken: fcmToken
        }
    })

    if (!studentFCMToken) {
        throw new ApiError(httpStatus.NOT_FOUND, "FCM token is not added for this student");
    }

    studentFCMToken.fcmToken = fcmToken;

    await studentFCMToken.save();

    res
        .status(httpStatus.OK)
        .json(
            new ApiResponse(
                httpStatus.OK,
                "FCM token updated successfully",
                studentFCMToken
            )
        );
})

const removeStudentFCMTokens = asyncHandler(async (req, res) => {
    const { studentId } = req.query;

    // Input validation is handled by @studentFCMToken.validation.js

    const student = await Student.findByPk(studentId);

    if (!student) {
        throw new ApiError(httpStatus.NOT_FOUND, "Student not found");
    }

    const studentFCMToken = await StudentFCMToken.findOne({
        where: {
            studentId: studentId
        }
    })

    if (!studentFCMToken) {
        throw new ApiError(httpStatus.NOT_FOUND, "FCM token is not added for this student");
    }

    await studentFCMToken.destroy();

    res
        .status(httpStatus.OK)
        .json(
            new ApiResponse(
                httpStatus.OK,
                "FCM token deleted successfully",
                null
            )
        );
})

export {
    addStudentFCMTokens,
    updateStudentFCMTokens,
    removeStudentFCMTokens
}
