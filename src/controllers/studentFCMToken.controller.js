import { Op } from 'sequelize';
import { asyncHandler } from '../utils/asyncHandler.js';
import Student from '../db/models/student.model.js'
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import StudentFCMToken from '../db/models/studentFCMToken.model.js';

const addStudentFCMTokens = asyncHandler(async (req, res) => {
    const {
        studentId,
        fcmToken
    } = req.body;

    if (!studentId || !fcmToken) {
        throw new ApiError(400, "Student id and fcm token are required");
    }

    const student = await Student.findByPk(studentId);

    if (!student) {
        throw new ApiError(404, "Student not found");
    }

    const studentFCMToken = await StudentFCMToken.findOne({
        where: {
            studentId: studentId,
            fcmToken: fcmToken
        }
    })

    if (studentFCMToken) {
        throw new ApiError(400, "FCM token is already added for this student");
    }

    const studentFCMTokenEntry = await StudentFCMToken.create({
        studentId: studentId,
        fcmToken: fcmToken
    });

    res
        .status(200)
        .json(
            new ApiResponse(
                200,
                "FCM token added successfully",
                studentFCMTokenEntry
            )
        );
})


const updateStudentFCMTokens = asyncHandler(async (req, res) => {
    const {
        studentId,
        fcmToken
    } = req.body;

    if (!studentId || !fcmToken) {
        throw new ApiError(400, "Student id and fcm token are required");
    }

    const student = await Student.findByPk(studentId);

    if (!student) {
        throw new ApiError(404, "Student not found");
    }

    const studentFCMToken = await StudentFCMToken.findOne({
        where: {
            studentId: studentId,
            fcmToken: fcmToken
        }
    })

    if (!studentFCMToken) {
        throw new ApiError(404, "FCM token is not added for this student");
    }

    studentFCMToken.fcmToken = fcmToken;

    await studentFCMToken.save();

    res
        .status(200)
        .json(
            new ApiResponse(
                200,
                "FCM token updated successfully",
                studentFCMToken
            )
        );
})

const removeStudentFCMTokens = asyncHandler(async (req, res) => {
    const {
        studentId
    } = req.query;

    if (!studentId) {
        throw new ApiError(400, "Student id is required");
    }

    const student = await Student.findByPk(studentId);

    if (!student) {
        throw new ApiError(404, "Student not found");
    }

    const studentFCMToken = await StudentFCMToken.findOne({
        where: {
            studentId: studentId
        }
    })

    if (!studentFCMToken) {
        throw new ApiError(404, "FCM token is not added for this student");
    }

    await studentFCMToken.destroy();

    res
        .status(200)
        .json(
            new ApiResponse(
                200,
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

