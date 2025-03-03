import Semester from '../db/models/semester.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js'
import { ApiError } from '../utils/ApiError.js'
import { Op, where } from 'sequelize'
import Branch from '../db/models/branch.model.js';
import Scheme from '../db/models/scheme.model.js';
import Course from '../db/models/course.model.js';
import BranchCourseSemester from '../db/models/branchCourseSemester.model.js';
import University from '../db/models/university.model.js';
import SemesterCourse from '../db/models/semesterCourse.model.js';

//* get all the semesters
const getSemesters = asyncHandler(async (req, res) => {

    const {
        semesterNumber,
        academicStartYear,
        academicEndYear,
        branchId,
        schemeId,
        page = 1,
        limit = 10
    } = req.query;

    const whereClause = {};
    if (semesterNumber) {
        whereClause.semesterNumber = {
            [Op.eq]: parseInt(semesterNumber)
        }
    }

    if (academicStartYear) {
        whereClause.academicStartYear = {
            [Op.gte]: parseInt(academicStartYear)
        }
    }

    if (academicEndYear) {
        whereClause.academicEndYear = {
            [Op.lte]: parseInt(academicEndYear)
        }
    }

    if (branchId) {
        whereClause.branchId = {
            [Op.eq]: branchId
        }
    }

    if (schemeId) {
        whereClause.schemeId = {
            [Op.eq]: schemeId
        }
    }

    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const semesters = await Semester.findAll({
        where: whereClause,
        include: [
            {
                model: Branch,
                required: true,
                duplicating: false,
            },
            {
                model: Scheme,
                required: true,
                duplicating: false,
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
                "Semesters retrieved successfully.",
                semesters
            )
        );
});


//* add semester
const addSemester = asyncHandler(async (req, res) => {

    const {
        branchId,
        semesterNumber,
        academicStartYear,
        academicEndYear,
        startDate,
        endDate,
        schemeId,
        optionalCourseIds
    } = req.body;

    if (!branchId || !semesterNumber || !academicStartYear || !academicEndYear || !schemeId || !startDate || !endDate) {
        throw new ApiError(400, "branchId, semesterNumber, academicStartYear, academicEndYear, startDate, endDate, schemeId must be provided")
    }

    if (academicEndYear < academicStartYear) {
        throw new ApiError(400, "Academic end year cannot be less than academic start year");
    }

    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);

    if(startDateObj >= endDateObj) {
        throw new ApiError(400, "End date cannot be less than or equal to start date");
    }

    if(startDateObj.getFullYear() < Number(academicStartYear)) {
        throw new ApiError(400, "Start date cannot be lesser than academic start year");
    }

    if(endDateObj.getFullYear() > Number(academicEndYear)) {
        throw new ApiError(400, "End date cannot be greater than academic end year");
    }

    // searching courses for the semeseter to be added bcz if the semester contains optional courses then we must create a entry in SemesterCourse table to tell the optional subjects for a particular semester
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
        schemeClause = { schemeId: schemeId }
    }



    const courses = await Course.findAll({
        where: {
            [Op.and]: [
                schemeClause,
                { optionalSubject: { [Op.ne]: null } }
            ]
        },
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
            }
            // },
            // {
            //     model: Scheme,
            //     required: true,
            //     where: schemeClause,
            //     duplicating: false,
            // }
        ]
    });

    // creating a map to store the optional courses and the courses that belong to them
    const requiredOptionalCourses = {}
    for (const course of courses) {
        if (requiredOptionalCourses[course.optionalSubject]) { // differentiating between the optional subjects based on the unique string for each optional subject
            requiredOptionalCourses[course.optionalSubject] = [...requiredOptionalCourses[course.optionalSubject], course.id]
        } else {
            requiredOptionalCourses[course.optionalSubject] = [course.id]
        }
    }

    const countOfRequiredOptionalCourses = Object.keys(requiredOptionalCourses).length

    // if the semester contains optional courses then we must check if the courses that are being added are valid
    if (countOfRequiredOptionalCourses > 0) {

        if (!optionalCourseIds) {
            throw new ApiError(400, `optional courses must be provided for semester ${semesterNumber}`)
        }
        if (!Array.isArray(optionalCourseIds)) {
            throw new ApiError(400, "optionalCourseIds must be a array of CourseId")
        }


        if (optionalCourseIds.length <= 0 || optionalCourseIds.length != countOfRequiredOptionalCourses) {
            throw new ApiError(400, `Please give ${countOfRequiredOptionalCourses} optional courses`)
        }

        for (let optionalCourseId of optionalCourseIds) {
            for (let optionalCourseList of Object.values(requiredOptionalCourses)) {
                if (optionalCourseList.includes(optionalCourseId)) {
                    optionalCourseList.length = 0; // making length 0 bcz each courseId from the input list must belong to a diff optionCourseList
                    break
                }
            }
        }

        // if the length of any of the optionCourseList is greater than 0 then the courses that are being added are not valid
        for (let optionalCourseList of Object.values(requiredOptionalCourses)) {
            if (optionalCourseList.length > 0) {
                throw new ApiError(400, `Invalid optional courses`)
            }
        }
    }



    const semester = await Semester.create({
        branchId: branchId || null,
        semesterNumber: semesterNumber || null,
        academicStartYear: academicStartYear || null,
        academicEndYear: academicEndYear || null,
        schemeId: schemeId || null,
        startDate: startDate || null,
        endDate: endDate || null,
    });


    if (optionalCourseIds && optionalCourseIds.length > 0) {

        // adding entry of optional courses for the specific semester
        for (let optionalCourseId of optionalCourseIds) {
            const addedOptionalCourse = await SemesterCourse.create({
                semesterId: semester.id,
                courseId: optionalCourseId
            });
        }
    }
    const addedOptionalCourses = []

    for (let optionalCourseId of optionalCourseIds) {
        const course = await Course.findByPk(optionalCourseId);
        if (course) {
            addedOptionalCourses.push(course);
        }
    }

    res
        .status(201)
        .json(
            new ApiResponse(
                201,
                'Semester added successfully',
                { semester, addedOptionalCourses }
            )
        )

});

const getCoursesOfSemester = asyncHandler(async (req, res) => {
    const { semesterId } = req.query;

    if (!semesterId) {
        throw new ApiError(400, "Semester id is required");
    }

    const semester = await Semester.findByPk(semesterId);
    if (!semester) {
        throw new ApiError(404, "Semester not found");
    }

    const compulsaryCourses = await BranchCourseSemester.findAll({
        where: {
            branchId: semester.branchId,
            semesterNumber: semester.semesterNumber
        },
        include: {
            model: Course,
            required: true,
            where: {
                [Op.and]: [
                    {
                        schemeId: semester.schemeId,
                        optionalSubject: null
                    }
                ]
            }
        }
    });

    const optionalCourses = await SemesterCourse.findAll({
        where: {
            semesterId: semesterId
        },
        include: {
            model: Course,
            required: true,
        },
    });

    res
        .status(200)
        .json(
            new ApiResponse(
                200,
                "Courses retrieved successfully.",
                //! send full courses
                [...compulsaryCourses, ...optionalCourses]
            )
        );
})


//! updating the semester will make the optional courses and other courses invalid, hence it is very error prone so use delete and then create new semester instead of updating
const updateSemester = asyncHandler(async (req, res) => {
    const {
        semesterId,
        startDate,
        endDate
    } = req.body;

    if(!semesterId) {
        throw new ApiError(400, "Semester id is required");
    }

    if(!startDate || !endDate) {
        throw new ApiError(400, "Start date and end date are required");
    }

    const semester = await Semester.findByPk(semesterId);

    if (!semester) {
        throw new ApiError(404, "Semester not found");
    }
    
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);


    if(startDateObj >= endDateObj) {
        throw new ApiError(400, "End date cannot be less than or equal to start date");
    }

    if(startDateObj.getFullYear() < semester.academicStartYear) {
        throw new ApiError(400, "Start date cannot be lesser than academic start year");
    }

    if(endDateObj.getFullYear() > semester.academicEndYear) {
        throw new ApiError(400, "End date cannot be greater than academic end year");
    }


    semester.endDate = endDate || semester.endDate;
    semester.startDate = startDate || semester.startDate;

    await semester.save();

    res
        .status(200)
        .json(
            new ApiResponse(
                200,
                "Semester updated successfully",
                semester
            )
        );
});

//* remove semester
const removeSemester = asyncHandler(async (req, res) => {

    const { id } = req.body;

    if (!id) {
        throw new ApiError(400, "Semester id is required");
    }

    const semester = await Semester.findByPk(id);

    if (!semester) {
        throw new ApiError(404, "Semester not found");
    }

    await semester.destroy();

    res
        .status(200)
        .json(
            new ApiResponse(
                200,
                "Semester deleted successfully",
                null
            )
        );
});


const getSemesterById = asyncHandler(async (req, res) => {
    const { semesterId } = req.query;

    if (!semesterId) {
        throw new ApiError(400, "Semester id is required");
    }

    const semester = await Semester.findOne({
        where: { id: semesterId },
        include: [
            {
                model: Branch,
                required: true,
            },
            {
                model: Scheme,
                required: true,
            }
        ]
    });

    if (!semester) {
        throw new ApiError(404, "Semester not found");
    }

    res
        .status(200)
        .json(
            new ApiResponse(
                200,
                "Semester retrieved successfully",
                semester
            )
        );
});


export {
    getSemesters,
    addSemester,
    updateSemester,
    removeSemester,
    getCoursesOfSemester,
    getSemesterById
};