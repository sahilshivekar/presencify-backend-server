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
import fs from 'fs';
import csvParser from 'csv-parser';
import Semester from '../db/models/semester.model.js';
import TeacherTeachesCourse from '../db/models/teacherTeachesCourse.model.js';
import Teacher from '../db/models/teacher.model.js';
import httpStatus from 'http-status';
import courseValidation from '../validators/course.validation.js';

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
        onlyOptional = false,
        teacherIds
    } = req.query;
    const whereClause = {};

    if (searchQuery) {
        whereClause.name = {
            [Op.iLike]: `%${searchQuery}%`
        }
    }

    if (onlyOptional) {
        whereClause.optionalCourse = { [Op.not]: null };
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

    // Handle teacherIds - can be a single ID or comma-separated IDs
    let teacherClause = {};
    if (teacherIds) {
        const teacherIdArray = Array.isArray(teacherIds) ? teacherIds : teacherIds.split(',');
        teacherClause = { teacherId: { [Op.in]: teacherIdArray } };
    }

    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    // STEP 1: Get all matching course IDs with filters (lightweight query for counting and pagination)
    const allMatchingIds = await Course.findAll({
        attributes: ['id'],
        where: whereClause,
        include: [
            {
                model: BranchCourseSemester,
                required: branchId || semesterNumber ? true : false,
                where: branchCourseSemesterWhereClause,
                attributes: [],
            },
            {
                model: Scheme,
                required: true,
                where: schemeClause,
                attributes: [],
            },
            {
                model: TeacherTeachesCourse,
                required: teacherIds ? true : false,
                where: teacherClause,
                attributes: [],
            }
        ],
        order: [['name', 'ASC'], ['id', 'ASC']], // Add secondary sort for consistency
        subQuery: false,
        raw: true
    });

    // Deduplicate IDs (JOINs may create duplicates when Course has multiple branches/teachers)
    const uniqueIdSet = new Set();
    const uniqueIds = [];
    for (const item of allMatchingIds) {
        if (!uniqueIdSet.has(item.id)) {
            uniqueIdSet.add(item.id);
            uniqueIds.push(item);
        }
    }

    const totalCount = uniqueIds.length;

    // If getAll is false, apply pagination
    let paginatedIds;
    if (getAll === false && limit) {
        paginatedIds = uniqueIds.slice(offset, offset + parseInt(limit, 10));
    } else {
        paginatedIds = uniqueIds;
    }

    // If no results, return empty response
    if (paginatedIds.length === 0) {
        return res.status(httpStatus.OK).json(
            new ApiResponse(
                httpStatus.OK,
                "Courses retrieved successfully.",
                {
                    courses: [],
                    totalCount: totalCount
                }
            )
        );
    }

    // STEP 2: Fetch full records with all includes using the paginated IDs
    const courseIds = paginatedIds.map(c => c.id);

    const courses = await Course.findAll({
        where: {
            id: {
                [Op.in]: courseIds
            }
        },
        include: [
            {
                model: BranchCourseSemester,
                required: false,
                separate: true, // Fetch in separate query to avoid JOIN duplicates
                include: {
                    model: Branch,
                    required: true,
                }
            },
            {
                model: Scheme,
                required: true,
                include: {
                    model: University,
                    required: true,
                }
            },
            {
                model: TeacherTeachesCourse,
                required: false,
                separate: true, // Fetch in separate query to avoid JOIN duplicates
                include: {
                    model: Teacher,
                    required: true,
                }
            }
        ],
        order: [['name', 'ASC'], ['id', 'ASC']] // Same order as step 1
    });

    res
        .status(httpStatus.OK)
        .json(
            new ApiResponse(
                httpStatus.OK,
                "Courses retrieved successfully.",
                {
                    courses: courses,
                    totalCount: totalCount
                }
            )
        );
});


//* add course
const addCourse = asyncHandler(async (req, res) => {
    const {
        code,
        name,
        type,
        optionalCourse,
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
        type: type,
        optionalCourse: optionalCourse || null,
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
        .status(httpStatus.OK)
        .json(
            new ApiResponse(
                httpStatus.OK,
                "BranchCourseSemester deleted successfully",
                null
            )
        );
});

//* update course
const updateCourse = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { code, name, type, optionalCourse, schemeId } = req.body;

    // Remove input validation for presence, handled by validator

    const course = await Course.findByPk(id);

    if (!course) {
        throw new ApiError(httpStatus.NOT_FOUND, "Course not found");
    }

    course.name = name || course.name;
    course.type = type || course.type;
    course.optionalCourse = optionalCourse || course.optionalCourse;
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
        .status(httpStatus.OK)
        .json(
            new ApiResponse(
                httpStatus.OK,
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
                model: BranchCourseSemester,
                required: false,
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
                duplicating: false,
                include: {
                    model: University,
                    required: true,
                    duplicating: false,
                }
            },
            {
                model: TeacherTeachesCourse,
                required: false,
                duplicating: false,
                include: {
                    model: Teacher,
                    required: true,
                    duplicating: false,
                }
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
        throw error;
    }
});

//* bulk create courses from CSV
const bulkCreateCoursesFromCSV = asyncHandler(async (req, res) => {
    const csvFilePath = req?.file?.path;

    if (!csvFilePath) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'CSV file is required');
    }

    const cleanupFile = () => {
        if (csvFilePath && fs.existsSync(csvFilePath)) {
            fs.unlinkSync(csvFilePath);
        }
    };

    const parseCSV = () => new Promise((resolve, reject) => {
        const rows = [];
        fs.createReadStream(csvFilePath)
            .pipe(csvParser())
            .on('data', (row) => rows.push(row))
            .on('end', () => resolve(rows))
            .on('error', (err) => reject(err));
    });

    let rows;
    try {
        rows = await parseCSV();
    } catch (error) {
        cleanupFile();
        throw new ApiError(httpStatus.BAD_REQUEST, `Error parsing CSV file: ${error.message}`);
    }

    if (!rows || rows.length === 0) {
        cleanupFile();
        throw new ApiError(httpStatus.BAD_REQUEST, 'CSV file is empty or contains no valid data');
    }

    const validationErrors = [];
    const validatedCourses = [];
    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rowNumber = i + 2;
        const { error, value } = courseValidation.csvCourseRowSchema.validate(row, { abortEarly: false });
        if (error) {
            const msgs = error.details.map(d => d.message).join('; ');
            validationErrors.push({ row: rowNumber, code: row.code || 'N/A', errors: msgs });
        } else {
            validatedCourses.push({ ...value, rowNumber });
        }
    }

    if (validationErrors.length > 0) {
        cleanupFile();
        throw new ApiError(
            httpStatus.BAD_REQUEST,
            `Validation failed for ${validationErrors.length} row(s). No courses were added.`,
            validationErrors
        );
    }

    const transaction = await sequelize.transaction();
    let committed = false;
    try {
        const codes = validatedCourses.map(c => c.code);
        const schemeIds = [...new Set(validatedCourses.map(c => c.schemeId))];

        // Duplicate codes within CSV
        const codeSet = new Set();
        const duplicateCodes = [];
        for (const c of validatedCourses) {
            if (codeSet.has(c.code)) duplicateCodes.push({ row: c.rowNumber, code: c.code });
            codeSet.add(c.code);
        }
        if (duplicateCodes.length > 0) {
            throw new ApiError(httpStatus.BAD_REQUEST, 'Duplicate course codes found within CSV file', duplicateCodes);
        }

        // Validate schemes exist
        const existingSchemes = await Scheme.findAll({ where: { id: schemeIds }, attributes: ['id'], transaction });
        const existingSchemeIds = existingSchemes.map(s => s.id);
        const invalidSchemeIds = schemeIds.filter(id => !existingSchemeIds.includes(id));
        if (invalidSchemeIds.length > 0) {
            throw new ApiError(httpStatus.NOT_FOUND, `The following scheme IDs do not exist: ${invalidSchemeIds.join(', ')}`);
        }

        // Existing codes in DB
        const existingCourses = await Course.findAll({ where: { code: codes }, attributes: ['code'], transaction });
        if (existingCourses.length > 0) {
            const dupCodes = existingCourses.map(c => c.code);
            throw new ApiError(httpStatus.CONFLICT, `Course codes already exist: ${dupCodes.join(', ')}`);
        }

        const toCreate = validatedCourses.map(c => ({
            code: c.code,
            name: c.name,
            type: c.type,
            optionalCourse: c.optionalCourse || null,
            schemeId: c.schemeId
        }));

        const created = await Course.bulkCreate(toCreate, {
            transaction,
            validate: true,
            individualHooks: true,
            returning: true
        });

        await transaction.commit();
        committed = true;
        cleanupFile();

        res.status(httpStatus.CREATED).json(
            new ApiResponse(
                httpStatus.CREATED,
                `${created.length} courses created successfully from CSV`,
                { courses: created, createdCount: created.length }
            )
        );
    } catch (error) {
        if (!committed) await transaction.rollback();
        cleanupFile();
        throw error;
    }
});
//* bulk delete courses
const bulkDeleteCourses = asyncHandler(async (req, res) => {
    const { courseIds } = req.body;

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
    bulkDeleteCourses,
    bulkCreateCoursesFromCSV
};          