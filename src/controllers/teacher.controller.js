import Teacher from '../db/models/teacher.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js'
import { ApiError } from '../utils/ApiError.js'
import { Op } from 'sequelize'
import { uploadOnCloudinary, deleteFromCloudinary } from '../utils/cloudinary.js';
import fs from "fs"
import Course from '../db/models/course.model.js';
import TeacherTeachesCourse from '../db/models/teacherTeachesCourse.model.js';
import Scheme from '../db/models/scheme.model.js';
import httpStatus from 'http-status';
import sequelize from '../config/db.connection.js';

// All input validation is now handled in @teacher.validation.js

const options = {
    httpOnly: true,
    secure: true,
};

const generateAccessAndRefreshTokens = async (teacher) => {
    try {
        const newAccessToken = await teacher.generateAccessToken();
        const newRefreshToken = await teacher.generateRefreshToken();

        return { newAccessToken, newRefreshToken };
    } catch (err) {
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Something went wrong while generating tokens");
    }
};

//* get all the teacher
const getTeacher = asyncHandler(async (req, res) => {

    const {
        searchQuery,
        courseId,
        page = 1,
        limit = 10,
        getAll = "false",
    } = req.query;

    // Normalize getAll to a boolean regardless of it coming as string or boolean
    const isGetAll = getAll === true || getAll === 'true';

    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    let searchClause = {};

    if (searchQuery) {
        searchClause = {
            [Op.or]: [
                {
                    firstName: {
                        [Op.iLike]: `%${searchQuery}%`
                    }
                },
                {
                    email: {
                        [Op.iLike]: `%${searchQuery}%`
                    }
                },
                {
                    lastName: {
                        [Op.iLike]: `%${searchQuery}%`
                    }
                },
                {
                    highestQualification: {
                        [Op.iLike]: `%${searchQuery}%`
                    }
                },
                {
                    phoneNumber: {
                        [Op.iLike]: `%${searchQuery}%`
                    }
                }
            ]
        };
    }

    let courseIdFilterClause = {}
    let includeClause = []

    if (courseId) {
        courseIdFilterClause.courseId = courseId
        includeClause.push(
            {
                model: TeacherTeachesCourse,
                required: true,
                where: courseIdFilterClause,
                duplicating: false,
                include: [
                    {
                        model: Course,
                        required: true,
                        duplicating: false,
                    }
                ]
            }
        )
    }

    const teacher = await Teacher.findAndCountAll({
        where: searchClause,
        include: includeClause,
        ...(limit && !isGetAll ? { offset: offset, } : {}),
        ...(limit && !isGetAll ? { limit: parseInt(limit, 10) } : {}),
        distinct: true,
    });
    
    res
        .status(httpStatus.OK)
        .json(
            new ApiResponse(
                httpStatus.OK,
                "Teachers retrieved successfully.",
                {
                    teacher: teacher.rows,
                    totalTeacher: teacher.count
                }
            )
        );

});

const getTeacherById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Validation moved to @teacher.validation.js

    const teacher = await Teacher.findByPk(id);

    if (!teacher) {
        throw new ApiError(httpStatus.NOT_FOUND, "Teacher not found");
    }

    res
        .status(httpStatus.OK)
        .json(
            new ApiResponse(
                httpStatus.OK,
                "Teacher fetched successfully",
                teacher
            )
        );
});

//* add teacher
const addTeacher = asyncHandler(async (req, res) => {

    const {
        firstName,
        middleName,
        lastName,
        email,
        phoneNumber,
        gender,
        highestQualification,
        role,
        // password,
        // confirmPassword,
        isActive
    } = req.body;

    const teacherImageLocalPath = req.file?.path

    // All input validation is now handled in @teacher.validation.js

    const existingTeacherMember = await Teacher.findOne({ where: { email } })

    if (existingTeacherMember) {
        if (teacherImageLocalPath) {
            fs.unlinkSync(teacherImageLocalPath)
        }
        throw new ApiError(httpStatus.BAD_REQUEST, "A teacher member with this email already exists")
    }

    let teacherImageUrl = null;
    let teacherImagePublicId = null;

    if (teacherImageLocalPath) {

        const teacherImage = await uploadOnCloudinary(teacherImageLocalPath)

        if (!teacherImage?.url) {
            fs.unlinkSync(teacherImageLocalPath)
            throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Some issue occured while uploading the image")
        }

        teacherImageUrl = teacherImage.secure_url
        teacherImagePublicId = teacherImage.public_id
    }

    const addedTeacherMember = await Teacher.create({
        firstName: firstName,
        middleName: middleName || null,
        lastName: lastName,
        teacherImageUrl: teacherImageUrl,
        teacherImagePublicId: teacherImagePublicId,
        email: email,
        phoneNumber: phoneNumber,
        gender: gender,
        highestQualification: highestQualification || null,
        role: role,
        // password: password,
        isActive: isActive || true
    });


    if (!addedTeacherMember) {
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Some issue occured while adding teacher member")
    }

    res
        .status(httpStatus.CREATED)
        .json(
            new ApiResponse(
                httpStatus.CREATED,
                'Teacher member added successfully',
                addedTeacherMember
            )
        )

});

const updateTeacherDetails = asyncHandler(async (req, res) => {
    const {
        id,
        firstName,
        middleName,
        lastName,
        email,
        role,
        gender,
        highestQualification,
        phoneNumber,
        isActive
    } = req.body;

    // Validation moved to @teacher.validation.js

    const teacher = await Teacher.findByPk(id);

    if (!teacher) {
        throw new ApiError(httpStatus.NOT_FOUND, "Teacher not found")
    }

    teacher.firstName = firstName || teacher.firstName;
    teacher.middleName = middleName || teacher.middleName;
    teacher.lastName = lastName || teacher.lastName;
    teacher.email = email || teacher.email;
    teacher.role = role || teacher.role;
    teacher.gender = gender || teacher.gender;
    teacher.highestQualification = highestQualification || teacher.highestQualification;
    teacher.phoneNumber = phoneNumber || teacher.phoneNumber;
    teacher.isActive = isActive || teacher.isActive;

    await teacher.save();

    res
        .status(httpStatus.OK)
        .json(
            new ApiResponse(
                httpStatus.OK,
                "Teacher updated successfully",
                teacher
            )
        );
})

const updateTeacherPassword = asyncHandler(async (req, res) => {
    const {
        id,
        password,
        confirmPassword
    } = req.body;

    // Validation moved to @teacher.validation.js

    const teacher = await Teacher.findByPk(id);

    if (!teacher) {
        throw new ApiError(httpStatus.NOT_FOUND, "Teacher not found")
    }

    teacher.password = password || '';

    await teacher.save();

    res
        .status(httpStatus.OK)
        .json(
            new ApiResponse(
                httpStatus.OK,
                "Teacher password updated successfully",
                teacher
            )
        );
})


const updateTeacherImage = asyncHandler(async (req, res) => {
    const {
        id
    } = req.body;
    const teacherImageLocalPath = req.file?.path

    // Validation moved to @teacher.validation.js

    const teacher = await Teacher.findByPk(id);

    if (!teacher) {
        if (teacherImageLocalPath) {
            fs.unlinkSync(teacherImageLocalPath)
        }
        throw new ApiError(httpStatus.NOT_FOUND, "Teacher not found")
    }

    if (!teacherImageLocalPath) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Teacher image file is required")
    }

    const uploadedImageResponse = await uploadOnCloudinary(teacherImageLocalPath)

    if (!uploadedImageResponse?.url) {
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Some issue occured while uploading the image")
    }

    teacher.teacherImageUrl = uploadedImageResponse.secure_url
    teacher.teacherImagePublicId = uploadedImageResponse.public_id

    await teacher.save();

    res
        .status(httpStatus.OK)
        .json(
            new ApiResponse(
                httpStatus.OK,
                "Teacher image updated successfully",
                teacher
            )
        );
})

const removeImage = asyncHandler(async (req, res) => {
    const { id } = req.query;

    // Validation moved to @teacher.validation.js

    const teacher = await Teacher.findByPk(id);

    if (!teacher) {
        throw new ApiError(httpStatus.NOT_FOUND, "Teacher not found")
    }

    const deletedImage = await deleteFromCloudinary(teacher.teacherImagePublicId)

    if (!deletedImage) {
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Some issue occured while deleting the image")
    }

    teacher.teacherImageUrl = null;
    teacher.teacherImagePublicId = null;

    await teacher.save();

    res
        .status(httpStatus.OK)
        .json(
            new ApiResponse(
                httpStatus.OK,
                "Teacher image deleted successfully",
                teacher
            )
        );
})

//* remove teacher
const removeTeacher = asyncHandler(async (req, res) => {

    const { id } = req.query;

    const teacher = await Teacher.findByPk(id);

    if (!teacher) {
        throw new ApiError(httpStatus.NOT_FOUND, "Teacher not found");
    }

    const transaction = await sequelize.transaction();
    try {
        // Handle image deletion outside transaction (external service)
        if (teacher.teacherImagePublicId) {
            const deletedImage = await deleteFromCloudinary(teacher.teacherImagePublicId)
            if (!deletedImage) {
                await transaction.rollback();
                throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Some issue occured while deleting the image")
            }
        }
        
        await teacher.destroy({ transaction });
        await transaction.commit();
        
        res
            .status(httpStatus.NO_CONTENT)
            .json(
                new ApiResponse(
                    httpStatus.NO_CONTENT,
                    "Teacher deleted successfully",
                    null
                )
            );
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
});

//! logout is remaining

const addTeachingSubject = asyncHandler(async (req, res) => {
    const { teacherId, courseId } = req.body;

    const transaction = await sequelize.transaction();
    try {
        const teacher = await Teacher.findByPk(teacherId, { transaction });
        if (!teacher) {
            throw new ApiError(httpStatus.NOT_FOUND, "Teacher not found");
        }
        const course = await Course.findByPk(courseId, { transaction });
        if (!course) {
            throw new ApiError(httpStatus.NOT_FOUND, "Course not found");
        }
        const alreadyAssigned = await TeacherTeachesCourse.findOne({
            where: {
                teacherId: teacherId,
                courseId: courseId,
            },
            transaction
        });
        if(alreadyAssigned) {
            throw new ApiError(httpStatus.BAD_REQUEST, "Course is already assigned to this teacher member")
        }
        const teacherTeachesCourseEntry = await TeacherTeachesCourse.create({
            teacherId: teacherId,
            courseId: courseId,
        }, { transaction });
        await transaction.commit();
        res
            .status(httpStatus.CREATED)
            .json(
                new ApiResponse(
                    httpStatus.CREATED,
                    "Teaching subject added successfully",
                    teacherTeachesCourseEntry
                )
            );
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
});


const removeTeachingSubject = asyncHandler(async (req, res) => {
    const { teacherSubjectId } = req.query;

    const transaction = await sequelize.transaction();
    try {
        const teacherSubject = await TeacherTeachesCourse.findByPk(teacherSubjectId, { transaction });
        if (!teacherSubject) {
            throw new ApiError(httpStatus.NOT_FOUND, "Teacher subject not found");
        }
        await teacherSubject.destroy({ transaction });
        await transaction.commit();
        res
            .status(httpStatus.NO_CONTENT)
            .json(
                new ApiResponse(
                    httpStatus.NO_CONTENT,
                    "Teaching subject deleted successfully",
                    null
                )
            );
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
});

const getTeachingSubjects = asyncHandler(async (req, res) => {
    const { teacherId } = req.query;

    // Validation moved to @teacher.validation.js

    const teacher = await Teacher.findByPk(teacherId);

    if (!teacher) {
        throw new ApiError(httpStatus.NOT_FOUND, "Teacher not found");
    }

    const teachingSubjects = await TeacherTeachesCourse.findAll({
        where: {
            teacherId: teacherId
        },
        include: [
            {
                model: Course,
                required: true,
                include: [
                    {
                        model: Scheme,
                        required: true,
                    }
                ]
            }
        ]
    });

    res
        .status(httpStatus.OK)
        .json(
            new ApiResponse(
                httpStatus.OK,
                "Teaching subjects retrieved successfully",
                teachingSubjects
            )
        );
});


export {
    getTeacher,
    addTeacher,
    updateTeacherDetails,
    updateTeacherPassword,
    updateTeacherImage,
    removeTeacher,
    removeImage,
    getTeacherById,
    getTeachingSubjects,
    addTeachingSubject,
    removeTeachingSubject
}