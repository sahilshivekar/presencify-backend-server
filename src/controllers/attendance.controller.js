import { Op } from 'sequelize';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import Class from '../db/models/class.model.js';
import Room from '../db/models/room.model.js';
import Course from '../db/models/course.model.js';
import Staff from '../db/models/staff.model.js';
import Batch from '../db/models/batch.model.js';
import moment from 'moment';
import Timetable from '../db/models/timetable.model.js';
import Division from '../db/models/division.model.js';
import Semester from '../db/models/semester.model.js';
import BranchCourseSemester from '../db/models/branchCourseSemester.model.js';
import Branch from '../db/models/branch.model.js';
import Student from '../db/models/student.model.js';
import { Attendance, AttendanceStudent } from '../db/models/attendance.model.js';
import StudentDivision from '../db/models/studentDivision.model.js';
import sequelize from '../config/db.connection.js';


//* create attendance sheet type thing where student ids will be added
const createAttendance = asyncHandler(async (req, res) => {
    const {
        classId,
        date
    } = req.body;


    if (!classId || !date) {
        throw new ApiError(400, "Class ID and Date are required")
    }

    if (!moment(date, 'YYYY-MM-DD', true).isValid()) {
        throw new ApiError(400, "Invalid date format")
    }


    const classObj = await Class.findByPk(classId);

    if (!classObj) {
        throw new ApiError(404, "Class not found")
    }

    const timetable = await Timetable.findByPk(classObj.timetableId);
    const division = await Division.findByPk(timetable.divisionId);
    const semester = await Semester.findByPk(division.semesterId);

    if (semester.startDate > date || semester.endDate < date) {
        throw new ApiError(400, `Date is out of bounds because semester start date is ${semester.startDate} and semester end date is ${semester.endDate}`)
    }

    const checkIfAttendaceAlreadyCreatedForTodaysClass = await Attendance.findOne({
        where: {
            [Op.and]: [
                { classId: classId },
                { date: date }
            ]
        }
    })

    if (checkIfAttendaceAlreadyCreatedForTodaysClass) {
        res.status(201).json(new ApiResponse(201, "Attendance was already created successfully", checkIfAttendaceAlreadyCreatedForTodaysClass));
    } else {
        const attendance = await Attendance.create({
            classId: classId,
            date: date
        });

        res.status(201).json(new ApiResponse(201, "Attendance created successfully", attendance));
    }
})


const addStudentsAttendance = asyncHandler(async (req, res) => {
    const {
        attendanceId,
        presentStudentIds,
        absentStudentIds
    } = req.body;

    if (!attendanceId || !presentStudentIds || !absentStudentIds) {
        throw new ApiError(400, "Attendance ID, Present Student IDs and Absent Student IDs are required")
    }

    const duplicateStudentIds = presentStudentIds.filter(studentId => absentStudentIds.includes(studentId))

    if (duplicateStudentIds.length > 0) {
        throw new ApiError(400, `These student ids are in both present and absent student ids: ${duplicateStudentIds}`)
    }

    const attendance = await Attendance.findByPk(attendanceId)

    if (!attendance) {
        throw new ApiError(404, "Attendance not found")
    }

    //!check if attendance is already added or not 
    const alreadyAddedAttendance = await AttendanceStudent.findOne({
        where: {
            attendanceId: attendanceId
        }
    })

    if (alreadyAddedAttendance) {
        throw new ApiError(400, "Attendance is already added. Use the update student attendance feature to modify students attendance status.")
    }

    const classObj = await Class.findByPk(attendance.classId);
    const timetable = await Timetable.findByPk(classObj.timetableId);

    const studentsOfDivision = await StudentDivision.findAll({
        where: {
            divisionId: timetable.divisionId,
            endDate: null
        }
    })

    const missingStudents = studentsOfDivision.filter(student => !presentStudentIds.includes(student.studentId) && !absentStudentIds.includes(student.studentId))

    if (missingStudents.length > 0) {
        throw new ApiError(400, `These student ids are missing: ${missingStudents.map(student => student.studentId)}`)
    }

    console.log(presentStudentIds.length + absentStudentIds.length, studentsOfDivision.length)
    if (presentStudentIds.length + absentStudentIds.length > studentsOfDivision.length) {
        throw new ApiError(400, `There are some student ids which do not belong to the current division`)
    }

    const addedAttendance = await AttendanceStudent.bulkCreate(
        [...presentStudentIds.map(studentId => ({
            attendanceId,
            studentId,
            attendanceStatus: true
        })),
        ...absentStudentIds.map(studentId => ({
            attendanceId,
            studentId,
            attendanceStatus: false
        }))]
    )

    res.status(201).json(new ApiResponse(201, "Students attendance added successfully", addedAttendance));

})

const updateStudentAttendance = asyncHandler(async (req, res) => {

    const {
        attendanceId,
        studentId,
        newAttendanceStatus
    } = req.body;

    if (!attendanceId || !studentId) {
        throw new ApiError(400, "Attendance ID and Student ID are required")
    }

    // adding this check separately because if the value is false it won't enter in the controller
    if (newAttendanceStatus !== true && newAttendanceStatus !== false) {
        throw new ApiError(400, "New attendance status must be true or false")
    }

    const attendance = await Attendance.findByPk(attendanceId)

    if (!attendance) {
        throw new ApiError(404, "Attendance not found")
    }

    const attendanceStudent = await AttendanceStudent.findOne({
        where: {
            attendanceId: attendanceId,
            studentId: studentId
        }
    })

    if (!attendanceStudent) {
        throw new ApiError(404, "Attendance of this student not found")
    }

    if (attendanceStudent.attendanceStatus === newAttendanceStatus) {
        throw new ApiError(400, "New attendance status is same as old attendance status")
    }

    attendanceStudent.attendanceStatus = newAttendanceStatus
    await attendanceStudent.save()

    res.status(200).json(new ApiResponse(200, "Students attendance status updated successfully", attendanceStudent));
})


const removeAttendance = asyncHandler(async (req, res) => {
    const {
        attendanceId
    } = req.query;

    if (!attendanceId) {
        throw new ApiError(400, "Attendance ID is required")
    }

    const attendance = await Attendance.findByPk(attendanceId)

    if (!attendance) {
        throw new ApiError(404, "Attendance not found")
    }

    await attendance.destroy()

    res.status(200).json(new ApiResponse(200, "Attendance deleted successfully", null));
})


//! to get attendance of student for specific course in a semester
//  studentId, courseId, semesterId //! not division id bcz division keeps changing but semester doesn't

//! to get attendance of a division for a semester - can also be course wise
//  divisionId, - if course wise then courseId is also required

//! to get attendance of a course throughout the semester of all students
/// semesterId, courseId

// if i try to get atttendance with all upper cases it will work but i can't implement the 
// aggregation in the same query for multiple cases hence this controller will not be use instead
//  separate controller for separate cases will be used
const getAttendance = asyncHandler(async (req, res) => {
    const {
        date,
        attendanceId,
        classId,
        studentId,
        courseId,
        semesterId,
        divisionId
    } = req.query;

    if (date) {
        if (!moment(date, 'YYYY-MM-DD', true).isValid()) {
            throw new ApiError(400, "Invalid date format")
        }
    }

    if (studentId) {
        const student = await Student.findByPk(studentId);
        if (!student) {
            throw new ApiError(404, "Student not found")
        }
    }

    if (courseId) {
        const course = await Course.findByPk(courseId);
        if (!course) {
            throw new ApiError(404, "Course not found")
        }
    }

    if (semesterId) {
        const semester = await Semester.findByPk(semesterId);
        if (!semester) {
            throw new ApiError(404, "Semester not found")
        }
    }

    if (divisionId) {
        const division = await Division.findByPk(divisionId);
        if (!division) {
            throw new ApiError(404, "Division not found")
        }
    }

    if (attendanceId) {
        const attendance = await Attendance.findByPk(attendanceId);
        if (!attendance) {
            throw new ApiError(404, "Attendance not found")
        }
    }

    if (classId) {
        const classObj = await Class.findByPk(classId);
        if (!classObj) {
            throw new ApiError(404, "Class not found")
        }
    }

    if (courseId) {
        const course = await Course.findByPk(courseId);
        if (!course) {
            throw new ApiError(404, "Course not found")
        }
    }

    const attendance = await Attendance.findAll({
        where: {
            [Op.and]: [
                ...(attendanceId ? [{ id: attendanceId }] : []),
                ...(date ? [{ date: date }] : []),
                ...(classId ? [{ classId: classId }] : []),
            ],
        },
        include: [
            {
                model: Class,
                required: true,
                duplicating: false,
                include: [
                    {
                        model: Course,
                        required: true,
                        duplicating: false,
                        where: {
                            [Op.and]: [
                                ...(courseId ? [{ id: courseId }] : []),
                            ]
                        }
                    },
                    {
                        model: Timetable,
                        required: true,
                        duplicating: false,
                        include: [
                            {
                                model: Division,
                                required: true,
                                duplicating: false,
                                where: {
                                    [Op.and]: [
                                        ...(divisionId ? [{ id: divisionId }] : []),
                                    ]
                                },
                                include: [
                                    {
                                        model: Semester,
                                        required: true,
                                        duplicating: false,
                                        where: {
                                            [Op.and]: [
                                                ...(semesterId ? [{ id: semesterId }] : []),
                                            ]
                                        }
                                    }
                                ]
                            }
                        ]
                    }
                ]
            },
            {
                model: AttendanceStudent,
                required: true,
                duplicating: false,
                include: [
                    {
                        model: Student,
                        required: true,
                        duplicating: false,
                        where: {
                            [Op.and]: [
                                ...(studentId ? [{ id: studentId }] : []),
                            ]
                        }
                    },
                ]
            },
        ]
    })

    if (!attendance) {
        throw new ApiError(404, "Attendance not found")
    }

    res.status(200).json(new ApiResponse(200, "Attendance fetched successfully", attendance));
})



const getAttendanceOfStudentForSpecificCourseInSemester = asyncHandler(async (req, res) => {

    const {
        studentId,
        courseId,
        semesterId
    } = req.query;

    if (!studentId || !courseId || !semesterId) {
        throw new ApiError(400, "Student ID, Course ID and Semester ID are required")
    }

    const student = await Student.findByPk(studentId);

    if (!student) {
        throw new ApiError(404, "Student not found")
    }

    const course = await Course.findByPk(courseId);

    if (!course) {
        throw new ApiError(404, "Course not found")
    }

    const semester = await Semester.findByPk(semesterId);

    if (!semester) {
        throw new ApiError(404, "Semester not found")
    }

    // courseid, semesterid, studentId

    // for the rest of the subjects 
    const attendance = await sequelize.query(
        `
        SELECT
        attendance_students.student_id, 
        courses.course_name, 
        courses.course_id,
        courses.course_code,
        semesters.semester_id,
        semesters.semester_number,
        COUNT(attendances.attendance_id) AS total_lectures,  
        SUM(CASE WHEN attendance_students.attendance_status = true THEN 1 ELSE 0 END) AS attended_lectures
        FROM attendances
        INNER JOIN attendance_students ON attendances.attendance_id = attendance_students.attendance_id
        INNER JOIN classes ON classes.class_id = attendances.class_id
        INNER JOIN courses ON courses.course_id = classes.course_id
        INNER JOIN timetables ON timetables.timetable_id = classes.timetable_id
        INNER JOIN divisions ON divisions.division_id = timetables.division_id
        INNER JOIN semesters ON semesters.semester_id = divisions.semester_id
        WHERE attendance_students.student_id = ${studentId} AND courses.course_id = ${courseId} AND semesters.semester_id = ${semesterId}
        GROUP BY 
        attendance_students.student_id, 
        courses.course_name, 
        courses.course_id,
        courses.course_code,
        semesters.semester_id,
        semesters.semester_number,
        attendances.attendance_date
        `
    )

    res.status(200).json(new ApiResponse(200, "Attendance fetched successfully", attendance[0]));
});

const getAttendanceOfCourseOnDate = asyncHandler(async (req, res) => {
    const {
        date,
        courseId,
    } = req.query;

    if (!date || !courseId) {
        throw new ApiError(400, "Date and Course ID are required")
    }

    if (date) {
        if (!moment(date, 'YYYY-MM-DD', true).isValid()) {
            throw new ApiError(400, "Invalid date format")
        }
    }

    const course = await Course.findByPk(courseId);

    if (!course) {
        throw new ApiError(404, "Course not found")
    }

    const attendance = await Attendance.findAll({
        where: {
            [Op.and]: [
                { date: date },
            ]
        },
        include: [
            {
                model: Class,
                required: true,
                duplicating: false,
                where: {
                    [Op.and]: [
                        { courseId: courseId }
                    ]
                }
            },
            {
                model: AttendanceStudent,
                required: true,
                duplicating: false,
                attributes: ['studentId'],
                include: [
                    {
                        model: Student,
                        required: true,
                        duplicating: false,
                        attributes: ['firstName', 'lastName'],
                    }
                ],
            }
        ]
    })

    if (!attendance) {
        throw new ApiError(404, "Attendance for this date and subject is found")
    }

    res.status(200).json(new ApiResponse(200, "Attendance fetched successfully", attendance));

})

const getAttendanceOfCourseThroughoutSemester = asyncHandler(async (req, res) => {
    const {
        courseId,
        divisionId
    } = req.query;

    if (!courseId || !divisionId) {
        throw new ApiError(400, "Course ID and Division ID are required")
    }

    const course = await Course.findByPk(courseId);

    if (!course) {
        throw new ApiError(400, "Course not found")
    }

    const division = await Division.findByPk(divisionId)

    if (!division) {
        throw new ApiError(400, "Division not found")
    }

    const attendance = await sequelize.query(
        `
        SELECT
        CONCAT(students.first_name, ' ', students.last_name) AS student_name,
        --courses.course_name,
        --courses.course_code,
        --semesters.semester_id,
        --semesters.semester_number,
        COUNT(attendances.attendance_id) AS total_lectures,
        SUM(CASE WHEN attendance_students.attendance_status = true THEN 1 ELSE 0 END) AS attended_lectures
        FROM attendances
        INNER JOIN attendance_students ON attendances.attendance_id = attendance_students.attendance_id
        INNER JOIN students ON students.student_id = attendance_students.student_id
        INNER JOIN classes ON classes.class_id = attendances.class_id
        INNER JOIN courses ON courses.course_id = classes.course_id
        INNER JOIN timetables ON timetables.timetable_id = classes.timetable_id
        INNER JOIN divisions ON divisions.division_id = timetables.division_id
        INNER JOIN semesters ON semesters.semester_id = divisions.semester_id
        WHERE courses.course_id = ${courseId} AND divisions.division_id = ${divisionId}
        GROUP BY 
        --courses.course_name,
        --courses.course_code,
        --semesters.semester_id,
        --semesters.semester_number,
        students.first_name,
        students.last_name
        `
    )

    const formattedResult = attendance[0].map(row => ({
        studentName: row.student_name, // Rename field manually
        totalLectures: row.total_lectures,
        attendedLectures: row.attended_lectures,
    }));

    res.status(200).json(new ApiResponse(200, "Attendance fetched successfully", formattedResult));
})

export {
    removeAttendance,
    addStudentsAttendance,
    updateStudentAttendance,
    createAttendance,
    getAttendance,
    getAttendanceOfStudentForSpecificCourseInSemester,
    getAttendanceOfCourseOnDate,
    getAttendanceOfCourseThroughoutSemester
}