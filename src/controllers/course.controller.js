import Course from '../db/models/course.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js'
import { ApiError } from '../utils/ApiError.js'
import { Op } from 'sequelize'
import University from '../db/models/university.model.js';
import Scheme from '../db/models/scheme.model.js';
import BranchCourseSemester from '../db/models/branchCourseSemester.model.js';
import Branch from '../db/models/branch.model.js';
import sequelize from '../config/db.connection.js';
import { parse } from 'path';
import Semester from '../db/models/semester.model.js';
import httpStatus from 'http-status';
import { logger } from '../config/logger.js';

//* get all the courses
const getCourses = asyncHandler(async (req, res) => {
    const {
        searchQuery,
        branchId,
        semesterNumber,
        schemeId,
        page = 1,
        limit = 10,
        getAll = false,
    } = req.query;

    const whereClause = {};

    if (searchQuery) {
        whereClause.name = {
            [Op.iLike]: `%${searchQuery}%`
        }
    }

    let branchClause = {}
    if (branchId) {
        branchClause = { branchId: branchId }
    }

    let semesterNumberClause = {}
    if (semesterNumber) {
        semesterNumberClause = { semesterNumber: semesterNumber }
    }

    const branchCourseSemesterWhereClause = {
        [Op.and]: [
            branchClause,
            semesterNumberClause
        ]
    }
    let schemeClause = {}
    if (schemeId) {
        schemeClause = { id: schemeId }
    }

    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const courses = await Course.findAndCountAll({
        where: whereClause,
        include: [
            {
                model: BranchCourseSemester,
                required: true,
                where: branchCourseSemesterWhereClause,
                duplicating: false,
                include: {
                    model: Branch,
                    required: true,
                    duplicating: false,
                }
            },
            {
                model: Scheme,
                required: true,
                where: schemeClause,
                duplicating: false,
                include: {
                    model: University,
                    required: true,
                    duplicating: false,
                }
            }
        ],
        ...(limit && getAll === false ? { offset: offset, } : {}),
        ...(limit && getAll === false ? { limit: parseInt(limit, 10) } : {})
    });

    res
        .status(httpStatus.OK)
        .json(
            new ApiResponse(
                httpStatus.OK,
                "Courses retrieved successfully.",
                {
                    courses: courses.rows,
                    totalCount: courses.count
                }
            )
        );
});


//* add course
const addCourse = asyncHandler(async (req, res) => {
    const { 
        code, 
        name, 
        optionalSubject,
        schemeId 
    } = req.body;

    // Only check for existence of related scheme, not input validation
    const scheme = await Scheme.findByPk(schemeId);

    if (!scheme) {
        throw new ApiError(httpStatus.NOT_FOUND, "Scheme not found");
    }

    const course = await Course.create({
        code: code || "",
        name: name || "",
        optionalSubject: optionalSubject || null,
        schemeId: schemeId || null,
    });

    res
        .status(httpStatus.CREATED)
        .json(
            new ApiResponse(
                httpStatus.CREATED,
                'Course added successfully',
                course
            )
        )
});

const addCourseToBranchWithSemesterNumber = asyncHandler(async (req, res) => {
    const { courseId, branchId, semesterNumber } = req.body;

    // Remove input validation for semesterNumber range, handled by validator

    // Only check for existence of related records
    const course = await Course.findByPk(courseId);

    if (!course) {
        throw new ApiError(httpStatus.NOT_FOUND, "Course not found");
    }

    const branch = await Branch.findByPk(branchId);

    if (!branch) {
        throw new ApiError(httpStatus.NOT_FOUND, "Branch not found");
    }

    const addedCourseToBranchEntry = await BranchCourseSemester.create({
        branchId: branchId,
        courseId: courseId,
        semesterNumber: semesterNumber
    });

    res
        .status(httpStatus.CREATED)
        .json(
            new ApiResponse(
                httpStatus.CREATED,
                "Course added successfully",
                addedCourseToBranchEntry
            )
        );
});

const removeCourseFromBranchWithSemesterNumber = asyncHandler(async (req, res) => {
    const { branchCourseSemesterId } = req.params;

    // Remove input validation for presence, handled by validator

    const branchCourseSemester = await BranchCourseSemester.findByPk(branchCourseSemesterId);

    if (!branchCourseSemester) {
        throw new ApiError(httpStatus.NOT_FOUND, "BranchCourseSemester not found");
    }

    await branchCourseSemester.destroy();

    res
        .status(httpStatus.NO_CONTENT)
        .json(
            new ApiResponse(
                httpStatus.NO_CONTENT,
                "BranchCourseSemester deleted successfully",
                null
            )
        );
});

//* update course
const updateCourse = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { code, name, abbreviation, schemeId } = req.body;

    // Remove input validation for presence, handled by validator

    const course = await Course.findByPk(id);

    if (!course) {
        throw new ApiError(httpStatus.NOT_FOUND, "Course not found");
    }

    course.name = name || course.name;
    course.abbreviation = abbreviation || course.abbreviation;
    course.schemeId = schemeId || course.schemeId;
    course.code = code || course.code;

    await course.save();

    res
        .status(httpStatus.OK)
        .json(
            new ApiResponse(
                httpStatus.OK,
                "Course updated successfully",
                course
            )
        );
});

//* remove course
const removeCourse = asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Remove input validation for presence, handled by validator

    const course = await Course.findByPk(id);

    if (!course) {
        throw new ApiError(httpStatus.NOT_FOUND, "Course not found");
    }

    await course.destroy();

    res
        .status(httpStatus.NO_CONTENT)
        .json(
            new ApiResponse(
                httpStatus.NO_CONTENT,
                "Course deleted successfully",
                null
            )
        );
});

const getCourseById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Remove input validation for presence, handled by validator

    const course = await Course.findOne({
        where: { id: id },
        include: [
            {
                model: Scheme,
                required: true
            }
        ]
    })

    if (!course) {
        throw new ApiError(httpStatus.NOT_FOUND, "Course not found");
    }

    res
        .status(httpStatus.OK)
        .json(
            new ApiResponse(
                httpStatus.OK,
                "Course retrieved successfully",
                course
            )
        );
});

//* bulk create courses
const bulkCreateCourses = asyncHandler(async (req, res) => {
    const { courses } = req.body;
    
    logger.info(`Bulk creating ${courses.length} courses`);
    
    const transaction = await sequelize.transaction();
    
    try {
        // Check for duplicate course codes within request
        const courseCodes = courses.map(course => course.code);
        const uniqueCodes = new Set(courseCodes);
        if (uniqueCodes.size !== courseCodes.length) {
            throw new ApiError(
                httpStatus.CONFLICT,
                'Course codes already exist: duplicate codes in request'
            );
        }

        // Validate all schemes exist
        const schemeIds = [...new Set(courses.map(course => course.schemeId))];
        const existingSchemes = await Scheme.findAll({
            where: { id: schemeIds },
            attributes: ['id'],
            transaction
        });
        
        const existingSchemeIds = existingSchemes.map(scheme => scheme.id);
        const invalidSchemeIds = schemeIds.filter(id => !existingSchemeIds.includes(id));
        
        if (invalidSchemeIds.length > 0) {
            await transaction.rollback();
            throw new ApiError(
                httpStatus.BAD_REQUEST, 
                `Invalid scheme IDs: ${invalidSchemeIds.join(', ')}`
            );
        }
        
        // Check for duplicate course codes against database
        const existingCourses = await Course.findAll({
            where: { code: courseCodes },
            attributes: ['code'],
            transaction
        });
        
        if (existingCourses.length > 0) {
            const duplicateCodes = existingCourses.map(course => course.code);
            await transaction.rollback();
            throw new ApiError(
                httpStatus.CONFLICT, 
                `Course codes already exist: ${duplicateCodes.join(', ')}`
            );
        }
        
        // Create courses
        const createdCourses = await Course.bulkCreate(courses, {
            transaction,
            validate: true,
            returning: true,
            individualHooks: true
        });
        
        await transaction.commit();
        logger.info(`Successfully bulk created ${createdCourses.length} courses`);
        
        res
            .status(httpStatus.CREATED)
            .json(
                new ApiResponse(
                    httpStatus.CREATED,
                    `${createdCourses.length} courses created successfully`,
                    { courses: createdCourses }
                )
            );
            
    } catch (error) {
        if (!transaction.finished) {
            await transaction.rollback();
        }
        logger.error('Bulk create courses failed:', error.message);
        throw error;
    }
});

//* bulk delete courses
const bulkDeleteCourses = asyncHandler(async (req, res) => {
    const { courseIds } = req.body;
    
    logger.info(`Bulk deleting ${courseIds.length} courses`);
    
    const transaction = await sequelize.transaction();
    
    try {
        // Verify all courses exist
        const existingCourses = await Course.findAll({
            where: { id: courseIds },
            attributes: ['id'],
            transaction
        });
        
        if (existingCourses.length !== courseIds.length) {
            const existingIds = existingCourses.map(course => course.id);
            const nonExistentIds = courseIds.filter(id => !existingIds.includes(id));
            await transaction.rollback();
            throw new ApiError(
                httpStatus.NOT_FOUND, 
                `Courses not found: ${nonExistentIds.join(', ')}`
            );
        }
        
        // Check if any courses are referenced in BranchCourseSemester
        const referencedCourses = await BranchCourseSemester.findAll({
            where: { courseId: courseIds },
            attributes: ['courseId'],
            transaction
        });
        
        if (referencedCourses.length > 0) {
            const referencedIds = [...new Set(referencedCourses.map(ref => ref.courseId))];
            await transaction.rollback();
            throw new ApiError(
                httpStatus.CONFLICT, 
                `Cannot delete courses that are assigned to branches: ${referencedIds.join(', ')}`
            );
        }
        
        // Delete courses
        const deletedCount = await Course.destroy({
            where: { id: courseIds },
            transaction
        });
        
        await transaction.commit();
        logger.info(`Successfully bulk deleted ${deletedCount} courses`);
        
        res
            .status(httpStatus.OK)
            .json(
                new ApiResponse(
                    httpStatus.OK,
                    `${deletedCount} courses deleted successfully`,
                    { deletedCount }
                )
            );
            
    } catch (error) {
        if (!transaction.finished) {
            await transaction.rollback();
        }
        logger.error('Bulk delete courses failed:', error.message);
        throw error;
    }
});

export {
    getCourses,
    addCourse,
    updateCourse,
    removeCourse,
    addCourseToBranchWithSemesterNumber,
    removeCourseFromBranchWithSemesterNumber,
    getCourseById,
    bulkCreateCourses,
    bulkDeleteCourses
};          