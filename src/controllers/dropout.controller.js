import { Op } from 'sequelize';
import Student from '../db/models/student.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import Dropout from '../db/models/dropout.model.js'
import httpStatus from 'http-status';

const addStudentToDropout = asyncHandler(async (req, res) => {
    const { studentId, academicStartYear, academicEndYear } = req.body

    // Input validation is handled by @dropout.validation.js

    const student = await Student.findByPk(studentId)

    if (!student) {
        throw new ApiError(httpStatus.NOT_FOUND, "Student not found")
    }

    if (academicStartYear < student.admissionYear) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Academic start year cannot be before student's admission year")
    }

    const isAlreayInDropout = await Dropout.findOne({
        where: {
            studentId,
            academicStartYear,
            academicEndYear
        }
    })

    if (isAlreayInDropout) {
        throw new ApiError(httpStatus.CONFLICT, "Student is already in dropout")
    }

    const dropout = await Dropout.create({
        studentId,
        academicStartYear,
        academicEndYear
    })

    res
        .status(httpStatus.CREATED)
        .json(
            new ApiResponse(
                httpStatus.CREATED,
                "Student added to dropout successfully",
                dropout
            )
        )
})

const removeStudentFromDropout = asyncHandler(async (req, res) => {
    const { studentId, academicStartYear, academicEndYear } = req.query

    // Input validation is handled by @dropout.validation.js

    const student = await Student.findByPk(studentId)

    if (!student) {
        throw new ApiError(httpStatus.NOT_FOUND, "Student not found")
    }
    
    if (academicStartYear < student.admissionYear) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Academic start year cannot be before student's admission year")
    }

    const isAlreayInDropout = await Dropout.findOne({
        where: {
            studentId,
            academicStartYear,
            academicEndYear
        }
    })

    if (!isAlreayInDropout) {
        throw new ApiError(httpStatus.NOT_FOUND, "Student is not in dropout")
    }

    await isAlreayInDropout.destroy()

    res
        .status(httpStatus.OK)
        .json(
            new ApiResponse(
                httpStatus.OK,
                "Student removed from dropout successfully",
                null
            )
        )
})

const getDropoutById = asyncHandler(async (req, res) => {
    const { id } = req.params

    // Input validation is handled by @dropout.validation.js

    const dropout = await Dropout.findOne({
        where: {
            id: id
        },
        include: {
            model: Student,
            required: true,
            duplicating: false
        }
    })

    if (!dropout) {
        throw new ApiError(httpStatus.NOT_FOUND, "Dropout details for given input not found")
    }

    res
        .status(httpStatus.OK)
        .json(
            new ApiResponse(
                httpStatus.OK,
                "Dropout fetched successfully",
                dropout
            )
        )
})

const getDropoutDetailsOfStudent = asyncHandler(async (req, res) => {
    const { studentId } = req.query

    // Input validation is handled by @dropout.validation.js

    const dropouts = await Dropout.findAll({
        where: {
            studentId: studentId
        }
    })

    res
        .status(httpStatus.OK)
        .json(
            new ApiResponse(
                httpStatus.OK,
                "Dropout fetched successfully",
                dropouts
            )
        )
})

export {
    addStudentToDropout,
    removeStudentFromDropout,
    getDropoutById,
    getDropoutDetailsOfStudent
}