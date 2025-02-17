import Course from '../db/models/course.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js'
import { ApiError } from '../utils/ApiError.js'
import { Op, where } from 'sequelize'
import University from '../db/models/university.model.js';
import Scheme from '../db/models/scheme.model.js';
import BranchCourseSemester from '../db/models/branchCourseSemester.model.js';
import Branch from '../db/models/branch.model.js';
import sequelize from '../config/db.connection.js';
import { parse } from 'path';
import Semester from '../db/models/semester.model.js';

//* get all the courses
const getCourses = asyncHandler(async (req, res) => {

    const {
        searchQuery,
        branchId,
        semesterNumber,
        schemeId,
        page = 1,
        limit = 10
        // how to show optional subject while adding courses for semester will be handled in frontend
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

    const courses = await Course.findAll({
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
        limit: parseInt(limit, 10),
        offset: offset,
    });

    res
        .status(200)
        .json(
            new ApiResponse(
                200,
                "Courses retrieved successfully.",
                courses
            )
        );
});


//* add course
const addCourse = asyncHandler(async (req, res) => {

    const { code, name, abbreviation, schemeId } = req.body;

    const scheme = await Scheme.findByPk(schemeId);

    if (!scheme) {
        throw new ApiError(404, "Scheme not found");
    }

    const course = await Course.create({
        code: code || "",
        name: name || "",
        abbreviation: abbreviation || "",
        schemeId: schemeId || null,
    });

    res
        .status(201)
        .json(
            new ApiResponse(
                201,
                'Course added successfully',
                course
            )
        )

});

const addCourseToBranchWithSemesterNumber = asyncHandler(async (req, res) => {
    const { courseId, branchId, semesterNumber } = req.body;

    if(semesterNumber < 1 || semesterNumber > 8) {  
        throw new ApiError(400, "Semester number must be between 1 and 8");
    }

    const course = await Course.findByPk(courseId);

    if (!course) {
        throw new ApiError(404, "Course not found");
    }

    const branch = await Branch.findByPk(branchId);

    if (!branch) {
        throw new ApiError(404, "Branch not found");
    }

    const addedCourseToBranchEntry = await BranchCourseSemester.create({
        branchId: branchId,
        courseId: courseId,
        semesterNumber: semesterNumber
    });

    res
        .status(200)
        .json(
            new ApiResponse(
                200,
                "Course added successfully",
                addedCourseToBranchEntry
            )
        );
});

const removeCourseFromBranchWithSemesterNumber = asyncHandler(async (req, res) => {
    const { branchCourseSemesterId } = req.body;

    if (!branchCourseSemesterId) {
        throw new ApiError(400, "branchCourseSemester id is required");
    }

    const branchCourseSemester = await BranchCourseSemester.findByPk(branchCourseSemesterId);

    if (!branchCourseSemester) {
        throw new ApiError(404, "BranchCourseSemester not found");
    }

    await branchCourseSemester.destroy();

    res
        .status(200)
        .json(
            new ApiResponse(
                200,
                "BranchCourseSemester deleted successfully",
                null
            )
        );
});

//* update course
const updateCourse = asyncHandler(async (req, res) => {

    const { id, code, name, abbreviation, schemeId } = req.body;

    if (!id) {
        throw new ApiError(400, "Course id is required");
    }

    const course = await Course.findByPk(id);

    if (!course) {
        throw new ApiError(404, "Course not found");
    }

    course.name = name || course.name;
    course.abbreviation = abbreviation || course.abbreviation;
    course.schemeId = schemeId || course.schemeId;
    course.code = code || course.code;

    await course.save();

    res
        .status(200)
        .json(
            new ApiResponse(
                200,
                "Course updated successfully",
                course
            )
        );
});

//* remove course
const removeCourse = asyncHandler(async (req, res) => {

    const { id } = req.body;

    if (!id) {
        throw new ApiError(400, "Course id is required");
    }

    const course = await Course.findByPk(id);

    if (!course) {
        throw new ApiError(404, "Course not found");
    }

    await course.destroy();

    res
        .status(200)
        .json(
            new ApiResponse(
                200,
                "Course deleted successfully",
                null
            )
        );
});

export {
    getCourses,
    addCourse,
    updateCourse,
    removeCourse,
    addCourseToBranchWithSemesterNumber,
    removeCourseFromBranchWithSemesterNumber,
};          