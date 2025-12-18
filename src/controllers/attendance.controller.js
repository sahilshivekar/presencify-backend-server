import { Op } from 'sequelize';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import Class from '../db/models/class.model.js';
import Room from '../db/models/room.model.js';
import Course from '../db/models/course.model.js';
import Teacher from '../db/models/teacher.model.js';
import Batch from '../db/models/batch.model.js';
import moment from 'moment';
import Timetable from '../db/models/timetable.model.js';
import Division from '../db/models/division.model.js';
import Semester from '../db/models/semester.model.js';
import BranchCourseSemester from '../db/models/branchCourseSemester.model.js';
import Branch from '../db/models/branch.model.js';
import Scheme from '../db/models/scheme.model.js';
import Student from '../db/models/student.model.js';
import { Attendance, AttendanceStudent } from '../db/models/attendance.model.js';
import StudentDivision from '../db/models/studentDivision.model.js';
import sequelize from '../config/db.connection.js';
import { fromYYYYMMDDToDDMMYYYY } from "../utils/date.js";
import { sendAttendanceReportToEmail } from "../utils/email.js";
import { sendNotification } from "../utils/firebaseCloudMessaging.js";
import StudentFCMToken from "../db/models/studentFCMToken.model.js";
import StudentBatch from '../db/models/studentBatch.model.js';
import httpStatus from 'http-status';
// removed logger import as per request to remove logs


//* create attendance sheet type thing where student ids will be added
const createAttendance = asyncHandler(async (req, res) => {
    const {
        classId,
        date
    } = req.body;

    const classObj = await Class.findByPk(classId);

    if (!classObj) {
        throw new ApiError(httpStatus.NOT_FOUND, "Class not found")
    }

    const timetable = await Timetable.findByPk(classObj.timetableId);
    const division = await Division.findByPk(timetable.divisionId);
    const semester = await Semester.findByPk(division.semesterId);

    if (semester.startDate > date || semester.endDate < date) {
        throw new ApiError(httpStatus.BAD_REQUEST, `Date is out of bounds because semester start date is ${semester.startDate} and semester end date is ${semester.endDate}`)
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
        return res.status(httpStatus.CONFLICT).json(new ApiResponse(httpStatus.CONFLICT, "Attendance already exists", checkIfAttendaceAlreadyCreatedForTodaysClass));
    }

    const attendance = await Attendance.create({
        classId: classId,
        date: date
    });

    res.status(httpStatus.CREATED).json(new ApiResponse(httpStatus.CREATED, "Attendance created successfully", attendance));

})



// ! this will be used by the teacher initially to mark all the students as absent so that attendance for all the students will remain in the database
// ! or if the teacher manually want to add attendance
const addStudentsAttendance = asyncHandler(async (req, res) => {
    const {
        attendanceId,
        presentStudentIds,
        absentStudentIds
    } = req.body;

    const attendance = await Attendance.findByPk(attendanceId)

    if (!attendance) {
        throw new ApiError(httpStatus.NOT_FOUND, "Attendance not found")
    }

    //!check if attendance is already added or not 
    const alreadyAddedAttendance = await AttendanceStudent.findOne({
        where: {
            attendanceId: attendanceId
        }
    })

    if (alreadyAddedAttendance) {
        throw new ApiError(httpStatus.CONFLICT, "Attendance is already added. Use the update student attendance feature to modify students attendance status.")
    }

    const classObj = await Class.findByPk(attendance.classId);
    const timetable = await Timetable.findByPk(classObj.timetableId);

    // check course and semester id to know whether to update students individual channel or not
    const division = await Division.findByPk(timetable.divisionId);
    const semester = await Semester.findByPk(division.semesterId);

    const transaction = await sequelize.transaction();
    try {
        await AttendanceStudent.bulkCreate(
            [...presentStudentIds.map(studentId => ({
                attendanceId,
                studentId,
                attendanceStatus: true
            })),
            ...absentStudentIds.map(studentId => ({
                attendanceId,
                studentId,
                attendanceStatus: false
            }))],
            { transaction }
        );
        await transaction.commit();
    } catch (error) {
        await transaction.rollback();
        if (error.name === 'SequelizeForeignKeyConstraintError') {
            throw new ApiError(httpStatus.BAD_REQUEST, "One or more student IDs are invalid")
        }
        throw error;
    }

    res.status(httpStatus.CREATED).json(new ApiResponse(httpStatus.CREATED, "Students attendance added successfully", null));
})



//! this will be used by the teacher to correct a students attendance status
const updateStudentAttendance = asyncHandler(async (req, res) => {

    const {
        attendanceId,
        studentId,
        newAttendanceStatus
    } = req.body;

    const attendance = await Attendance.findByPk(attendanceId)

    if (!attendance) {
        throw new ApiError(httpStatus.NOT_FOUND, "Attendance not found")
    }

    const attendanceStudent = await AttendanceStudent.findOne({
        where: {
            attendanceId: attendanceId,
            studentId: studentId
        }
    })

    if (!attendanceStudent) {
        throw new ApiError(httpStatus.NOT_FOUND, "Attendance of this student not found")
    }

    if (attendanceStudent.attendanceStatus === newAttendanceStatus) {
        throw new ApiError(httpStatus.BAD_REQUEST, "New attendance status is same as old attendance status")
    }

    attendanceStudent.attendanceStatus = newAttendanceStatus
    await attendanceStudent.save()

    res.status(httpStatus.OK).json(new ApiResponse(httpStatus.OK, "Students attendance status updated successfully", attendanceStudent));
})

//* bulk update attendance status for multiple students
const bulkUpdateStudentAttendance = asyncHandler(async (req, res) => {
    const { attendanceUpdates } = req.body;
    
    // logging removed
    
    const transaction = await sequelize.transaction();
    
    try {
        // Validate all attendance records exist
        const attendanceIds = [...new Set(attendanceUpdates.map(update => update.attendanceId))];
        const existingAttendances = await Attendance.findAll({
            where: { id: attendanceIds },
            attributes: ['id'],
            transaction
        });
        
        const existingAttendanceIds = existingAttendances.map(attendance => attendance.id);
        const invalidAttendanceIds = attendanceIds.filter(id => !existingAttendanceIds.includes(id));
        
        if (invalidAttendanceIds.length > 0) {
            throw new ApiError(
                httpStatus.NOT_FOUND, 
                `Attendance records not found: ${invalidAttendanceIds.join(', ')}`
            );
        }
        
        // Validate all students exist
        const studentIds = [...new Set(attendanceUpdates.map(update => update.studentId))];
        const existingStudents = await Student.findAll({
            where: { id: studentIds },
            attributes: ['id'],
            transaction
        });
        
        const existingStudentIds = existingStudents.map(student => student.id);
        const invalidStudentIds = studentIds.filter(id => !existingStudentIds.includes(id));
        
        if (invalidStudentIds.length > 0) {
            throw new ApiError(
                httpStatus.NOT_FOUND, 
                `Students not found: ${invalidStudentIds.join(', ')}`
            );
        }
        
        // Validate all attendance-student combinations exist
        const attendanceStudentChecks = await Promise.all(
            attendanceUpdates.map(async (update) => {
                const attendanceStudent = await AttendanceStudent.findOne({
                    where: {
                        attendanceId: update.attendanceId,
                        studentId: update.studentId
                    },
                    transaction
                });
                return attendanceStudent ? null : update;
            })
        );
        
        const invalidCombinations = attendanceStudentChecks.filter(Boolean);
        if (invalidCombinations.length > 0) {
            throw new ApiError(
                httpStatus.NOT_FOUND, 
                `Invalid attendance-student combinations found`
            );
        }
        
        // Filter out updates that don't change the status
        const validUpdates = [];
        for (const update of attendanceUpdates) {
            const existingRecord = await AttendanceStudent.findOne({
                where: {
                    attendanceId: update.attendanceId,
                    studentId: update.studentId
                },
                transaction
            });
            
            if (existingRecord && existingRecord.attendanceStatus !== update.newAttendanceStatus) {
                validUpdates.push(update);
            }
        }
        
        if (validUpdates.length === 0) {
            throw new ApiError(
                httpStatus.BAD_REQUEST, 
                "No attendance status changes to apply"
            );
        }
        
        // Perform bulk updates
        let updatedCount = 0;
        for (const update of validUpdates) {
            const [affectedRows] = await AttendanceStudent.update(
                { attendanceStatus: update.newAttendanceStatus },
                {
                    where: {
                        attendanceId: update.attendanceId,
                        studentId: update.studentId
                    },
                    transaction
                }
            );
            updatedCount += affectedRows;
        }
        
    await transaction.commit();
    // logging removed
        
        res
            .status(httpStatus.OK)
            .json(
                new ApiResponse(
                    httpStatus.OK,
                    `${updatedCount} attendance records updated successfully`,
                    { updatedCount, processedUpdates: validUpdates.length }
                )
            );
            
    } catch (error) {
        if (!transaction.finished) {
            await transaction.rollback();
        }
        // logging removed
        throw error;
    }
});


const removeAttendance = asyncHandler(async (req, res) => {
    const {
        attendanceId
    } = req.query;

    const attendance = await Attendance.findByPk(attendanceId)

    if (!attendance) {
        throw new ApiError(httpStatus.NOT_FOUND, "Attendance not found")
    }

    await attendance.destroy()

    res.status(httpStatus.OK).json(new ApiResponse(httpStatus.OK, "Attendance removed successfully", null));
})



const getAttendanceOfStudentForSpecificCourseInSemester = asyncHandler(async (req, res) => {

    const {
        studentId,
        courseId,
        semesterId,
        divisionId,
        batchId,
        startDate,
        endDate,
        semesterNumber,
        academicStartYear,
        academicEndYear,
        branchId,
        schemeId
    } = req.query;

    // courseid, semesterid, studentId
    if (studentId) {
        const student = await Student.findByPk(studentId);
        if (!student) {
            throw new ApiError(httpStatus.NOT_FOUND, "Student not found")
        }
    }

    if (courseId) {
        const course = await Course.findByPk(courseId);
        if (!course) {
            throw new ApiError(httpStatus.NOT_FOUND, "Course not found")
        }
    }

    if (semesterId) {
        const semester = await Semester.findByPk(semesterId);
        if (!semester) {
            throw new ApiError(httpStatus.NOT_FOUND, "Semester not found")
        }
    }

    if (divisionId) {
        const division = await Division.findByPk(divisionId);
        if (!division) {
            throw new ApiError(httpStatus.NOT_FOUND, "Division not found")
        }
    }
    if (branchId) {
        const branch = await Branch.findByPk(branchId);
        if (!branch) {
            throw new ApiError(httpStatus.NOT_FOUND, "Branch not found")
        }
    }
    if (schemeId) {
        const scheme = await Scheme.findByPk(schemeId);
        if (!scheme) {
            throw new ApiError(httpStatus.NOT_FOUND, "Scheme not found")
        }
    }
    // for the rest of the subjects 
    const attendance = await getAttendanceOfStudentForSpecificCourseInSemesterQuery(
        studentId,
        courseId,
        semesterId ? semesterId : null,
        divisionId ? divisionId : null,
        batchId ? batchId : null,
        startDate ? startDate : null,
        endDate ? endDate : null,
        semesterNumber ? Number(semesterNumber) : null,
        academicStartYear ? Number(academicStartYear) : null,
        academicEndYear ? Number(academicEndYear) : null,
        branchId ? branchId : null,
        schemeId ? schemeId : null
    );

    res.status(httpStatus.OK).json(new ApiResponse(httpStatus.OK, "Attendance fetched successfully", attendance));
});

const getAttendanceOfAllForSemesterDivisionBatchCourse = asyncHandler(async (req, res) => {
    const {
        semesterId,
        divisionId,
        batchId,
        courseId,
        startDate,
        endDate,
        semesterNumber,
        academicStartYear,
        academicEndYear,
        branchId,
        schemeId
    } = req.query;


    if (courseId) {
        const course = await Course.findByPk(courseId);
        if (!course) {
            throw new ApiError(httpStatus.NOT_FOUND, "Course not found")
        }
    }

    if (semesterId) {
        const semester = await Semester.findByPk(semesterId);
        if (!semester) {
            throw new ApiError(httpStatus.NOT_FOUND, "Semester not found")
        }
    }

    if (divisionId) {
        const division = await Division.findByPk(divisionId);
        if (!division) {
            throw new ApiError(httpStatus.NOT_FOUND, "Division not found")
        }
    }

    if (batchId) {
        const batch = await Batch.findByPk(batchId);
        if (!batch) {
            throw new ApiError(httpStatus.NOT_FOUND, "Batch not found")
        }
    }
    if (branchId) {
        const branch = await Branch.findByPk(branchId);
        if (!branch) {
            throw new ApiError(httpStatus.NOT_FOUND, "Branch not found")
        }
    }
    if (schemeId) {
        const scheme = await Scheme.findByPk(schemeId);
        if (!scheme) {
            throw new ApiError(httpStatus.NOT_FOUND, "Scheme not found")
        }
    }

    const attendance = await getAttendanceOfAllForSemesterDivisionBatchCourseQuery(
        semesterId,
        divisionId,
        batchId,
        courseId,
        startDate,
        endDate,
        semesterNumber ? Number(semesterNumber) : null,
        academicStartYear ? Number(academicStartYear) : null,
        academicEndYear ? Number(academicEndYear) : null,
        branchId ? branchId : null,
        schemeId ? schemeId : null
    )
    res.status(httpStatus.OK).json(new ApiResponse(httpStatus.OK, "Attendance fetched successfully", attendance));
})



// ! query only
const getAttendanceOfStudentForSpecificCourseInSemesterQuery = async (
    studentId,
    courseId,
    semesterId,
    divisionId,
    batchId,
    startDate,
    endDate,
    semesterNumber,
    academicStartYear,
    academicEndYear,
    branchId,
    schemeId
) => {

    // for getting total and attended lectures of a student for a specific course

    // in the query include the join of batches only if batchId is provided 
    // bcz as the one division have many batches its adding duplicate rows
    const aggregatedAttendance = await sequelize.query(
        `
        SELECT
        courses.course_id AS "courseId",
        courses.course_name AS "courseName",
        COUNT(attendances.attendance_id)::integer AS "totalLectures",
        SUM(CASE WHEN attendance_students.attendance_status = true THEN 1 ELSE 0 END)::integer AS "attendedLectures"
        FROM attendances
        INNER JOIN attendance_students ON attendances.attendance_id = attendance_students.attendance_id
        INNER JOIN classes ON classes.class_id = attendances.class_id
        INNER JOIN courses ON courses.course_id = classes.course_id
        INNER JOIN timetables ON timetables.timetable_id = classes.timetable_id
        INNER JOIN divisions ON divisions.division_id = timetables.division_id
        ${batchId ? `INNER JOIN batches ON batches.division_id = divisions.division_id` : ''}
        INNER JOIN semesters ON semesters.semester_id = divisions.semester_id
        WHERE 
        attendance_students.student_id = '${studentId}'
        AND courses.course_id = '${courseId}'
        ${semesterId ? `AND semesters.semester_id = '${semesterId}'` : ''}
        ${semesterNumber != null ? `AND semesters.semester_number = ${semesterNumber}` : ''}
        ${academicStartYear != null ? `AND semesters.academic_start_year = ${academicStartYear}` : ''}
        ${academicEndYear != null ? `AND semesters.academic_end_year = ${academicEndYear}` : ''}
        ${branchId ? `AND semesters.branch_id = '${branchId}'` : ''}
        ${schemeId ? `AND semesters.scheme_id = '${schemeId}'` : ''}
        ${divisionId ? `AND divisions.division_id = '${divisionId}'` : ''}
        ${batchId ? `AND batches.batch_id = '${batchId}'` : ''}
        ${startDate ? `AND attendances.attendance_date >= '${startDate}'` : ''}
        ${endDate ? `AND attendances.attendance_date <= '${endDate}'` : ''}
        GROUP BY 
        courses.course_id,
        courses.course_name;
        `
    )

    // for getting detail with each attendance_id and status
    const detailedAttendance = await sequelize.query(
        `
        SELECT
        attendances.attendance_id AS "attendanceId",
        attendances.attendance_date AS "date",
        attendance_students.attendance_status AS "attendanceStatus"
        FROM attendances
        INNER JOIN attendance_students ON attendances.attendance_id = attendance_students.attendance_id
        INNER JOIN classes ON classes.class_id = attendances.class_id
        INNER JOIN courses ON courses.course_id = classes.course_id
        INNER JOIN timetables ON timetables.timetable_id = classes.timetable_id
        INNER JOIN divisions ON divisions.division_id = timetables.division_id
        ${batchId ? `INNER JOIN batches ON batches.division_id = divisions.division_id` : ''}
        INNER JOIN semesters ON semesters.semester_id = divisions.semester_id
        WHERE 
        attendance_students.student_id = '${studentId}'
        AND courses.course_id = '${courseId}'
        ${semesterId ? `AND semesters.semester_id = '${semesterId}'` : ''}
        ${semesterNumber != null ? `AND semesters.semester_number = ${semesterNumber}` : ''}
        ${academicStartYear != null ? `AND semesters.academic_start_year = ${academicStartYear}` : ''}
        ${academicEndYear != null ? `AND semesters.academic_end_year = ${academicEndYear}` : ''}
        ${branchId ? `AND semesters.branch_id = '${branchId}'` : ''}
        ${schemeId ? `AND semesters.scheme_id = '${schemeId}'` : ''}
        ${divisionId ? `AND divisions.division_id = '${divisionId}'` : ''}
        ${batchId ? `AND batches.batch_id = '${batchId}'` : ''}
        ${startDate ? `AND attendances.attendance_date >= '${startDate}'` : ''}
        ${endDate ? `AND attendances.attendance_date <= '${endDate}'` : ''}
        ORDER BY
        attendances.attendance_date;
        `
    )

    return {
        aggregatedAttendance: aggregatedAttendance[0],
        detailedAttendance: detailedAttendance[0]
    }
}

const getAttendanceOfAllForSemesterDivisionBatchCourseQuery = async (
    semesterId,
    divisionId,
    batchId,
    courseId,
    startDate,
    endDate,
    semesterNumber,
    academicStartYear,
    academicEndYear,
    branchId,
    schemeId
) => {
    if (!semesterId && !divisionId && !courseId && !batchId && !startDate && !endDate &&
        semesterNumber == null && academicStartYear == null && academicEndYear == null && !branchId && !schemeId) {
        throw new ApiError(
            httpStatus.BAD_REQUEST,
            "One of the parameters is required: semesterId, divisionId, courseId, batchId, startDate, endDate, semesterNumber, academicStartYear, academicEndYear, branchId, schemeId"
        )
    }

    // Build WHERE clause dynamically
    const conditions = [];
    if (semesterId) conditions.push(`semesters.semester_id = '${semesterId}'`);
    if (semesterNumber != null) conditions.push(`semesters.semester_number = ${semesterNumber}`);
    if (academicStartYear != null) conditions.push(`semesters.academic_start_year = ${academicStartYear}`);
    if (academicEndYear != null) conditions.push(`semesters.academic_end_year = ${academicEndYear}`);
    if (branchId) conditions.push(`semesters.branch_id = '${branchId}'`);
    if (schemeId) conditions.push(`semesters.scheme_id = '${schemeId}'`);
    if (divisionId) conditions.push(`timetables.division_id = '${divisionId}'`);
    if (batchId) conditions.push(`classes.batch_id = '${batchId}'`);
    if (courseId) conditions.push(`classes.course_id = '${courseId}'`);
    if (startDate) conditions.push(`attendances.attendance_date >= '${startDate}'`);
    if (endDate) conditions.push(`attendances.attendance_date <= '${endDate}'`);
    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const attendance = await sequelize.query(
        `
        WITH attendance_grouped_by_course_id_and_attendance_date AS (SELECT
        courses.course_id AS course_id,
        attendances.attendance_date AS "attendanceDate",
        attendances.attendance_id AS "attendanceId",
        COUNT(DISTINCT attendance_students.student_id)::int AS "totalStudents",
        SUM(CASE WHEN attendance_students.attendance_status = true THEN 1 ELSE 0 END)::int AS "presentStudents"
        FROM attendances
        INNER JOIN attendance_students ON attendances.attendance_id = attendance_students.attendance_id
        INNER JOIN classes ON classes.class_id = attendances.class_id
        INNER JOIN courses ON courses.course_id = classes.course_id
        INNER JOIN timetables ON timetables.timetable_id = classes.timetable_id
        INNER JOIN divisions ON divisions.division_id = timetables.division_id
        ${batchId ? `INNER JOIN batches ON batches.division_id = divisions.division_id` : ''}
        INNER JOIN semesters ON semesters.semester_id = divisions.semester_id
        ${whereClause}
        GROUP BY courses.course_id, attendances.attendance_date, attendances.attendance_id
        ORDER BY attendances.attendance_date)

        SELECT
        course_id AS "courseId",
        json_agg(
            json_build_object(
                'attendanceDate', "attendanceDate",
                'totalStudents', "totalStudents",
                'presentStudents', "presentStudents",
                'attendanceId', "attendanceId"
            ) ORDER BY "attendanceDate"
        ) AS "attendanceSummary"
        FROM attendance_grouped_by_course_id_and_attendance_date
        GROUP BY course_id;
        `
    )

    return attendance[0]

}


const sendAttendanceReport = asyncHandler(async (req, res) => {
    try {
        const {
            startDate, // will be same as end date if its about single day attendance
            endDate,
            studentIds,
            courseIds,
            semesterId
        } = req.body;

        let studentWithNoParentEmail = []
        let emailsSent = 0;
        let fcmNotificationsSent = 0;

        // Ensure we have arrays to iterate over
        let finalStudentIds = studentIds || [];
        let finalCourseIds = courseIds || [];


        // Early validation of semester if provided
        if (semesterId) {
            const semester = await Semester.findByPk(semesterId);
            if (!semester) {
                throw new ApiError(httpStatus.NOT_FOUND, "Semester not found");
            }
        }

        // If no courseIds provided but studentIds provided, get all courses
        if (finalCourseIds.length === 0 && finalStudentIds.length > 0) {
            const allCourses = await Course.findAll();
            finalCourseIds = allCourses.map(c => c.id);
        }

        // If no studentIds provided but courseIds provided, get all students
        if (finalStudentIds.length === 0 && finalCourseIds.length > 0) {
            const allStudents = await Student.findAll();
            finalStudentIds = allStudents.map(s => s.id);
        }

        // If only semesterId provided, get all students and courses
        if (finalStudentIds.length === 0 && finalCourseIds.length === 0 && semesterId) {
            const allStudents = await Student.findAll();
            const allCourses = await Course.findAll();
            finalStudentIds = allStudents.map(s => s.id);
            finalCourseIds = allCourses.map(c => c.id);
        }

        // Validate that all students exist
        for (const studentId of finalStudentIds) {
            const student = await Student.findByPk(studentId);
            if (!student) {
                throw new ApiError(httpStatus.NOT_FOUND, "Student not found");
            }
        }

        // Validate that all courses exist
        for (const courseId of finalCourseIds) {
            const course = await Course.findByPk(courseId);
            if (!course) {
                throw new ApiError(httpStatus.NOT_FOUND, "Course not found");
            }
        }

        let hasAnyAttendanceData = false;

        for (const studentId of finalStudentIds) {
            let allCourseAttendance = []
            let emailText = ""
            for (const courseId of finalCourseIds) {
                const attendance = await getAttendanceOfStudentForSpecificCourseInSemesterQuery(
                    studentId,
                    courseId,
                    semesterId,
                    null,
                    null,
                    startDate || null,
                    endDate || null
                )
                allCourseAttendance.push(attendance)
            }

            const student = await Student.findByPk(studentId)
            if (student.parentEmail != null) {
                let hasDataForThisStudent = false;

                // each object in the "allCourseAttendance" represents a course
                allCourseAttendance.forEach(courseAttendance => {
                    if (courseAttendance.aggregatedAttendance.length != 0) {
                        hasDataForThisStudent = true;
                        hasAnyAttendanceData = true;
                        emailText += `Attendance of ${student.firstName} ${student.lastName}\n\n`


                        emailText += `Course: ${courseAttendance.aggregatedAttendance[0].courseName}\n`
                        emailText += `Total lectures: ${courseAttendance.aggregatedAttendance[0].totalLectures}\n`
                        emailText += `Attended lectures: ${courseAttendance.aggregatedAttendance[0].attendedLectures}\n`
                        emailText += `Not attended lectures: ${courseAttendance.aggregatedAttendance[0].totalLectures - courseAttendance.aggregatedAttendance[0].attendedLectures}\n`

                        emailText += `Attendance in percentage: ${(100 * (courseAttendance.aggregatedAttendance[0].attendedLectures / courseAttendance.aggregatedAttendance[0].totalLectures)).toFixed(2)}%\n`


                        const attendedLecturesDates = []
                        courseAttendance.detailedAttendance.forEach(detailedAttendanceObj => {
                            if (detailedAttendanceObj.attendanceStatus == true) {
                                attendedLecturesDates.push(fromYYYYMMDDToDDMMYYYY(detailedAttendanceObj.date))
                            }
                        })
                        emailText += `Attended lectures dates: ${attendedLecturesDates.length > 0 ? attendedLecturesDates.join(", ") : "none"}\n`
                        const notAttendedLecturesDates = []
                        courseAttendance.detailedAttendance.forEach(detailedAttendanceObj => {
                            if (detailedAttendanceObj.attendanceStatus == false) {
                                notAttendedLecturesDates.push(fromYYYYMMDDToDDMMYYYY(detailedAttendanceObj.date))
                            }
                        })
                        emailText += `Not attended lectures dates: ${notAttendedLecturesDates.length > 0 ? notAttendedLecturesDates.join(", ") : "none"}\n\n\n\n\n`
                    }
                })

                // Only send email if there's actual attendance data
                if (hasDataForThisStudent && emailText.trim() !== "") {
                    try {
                        await sendAttendanceReportToEmail(student.parentEmail, emailText)
                        emailsSent++;
                    } catch (emailError) {
                        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Failed to send attendance report");
                    }
                }

            } else {
                studentWithNoParentEmail.push(
                    {
                        studentId: student.id,
                        firstName: student.firstName,
                        lastName: student.lastName
                    }
                )
            }
        }


        const responseMessage = hasAnyAttendanceData
            ? "Attendance report sent successfully"
            : "No attendance data found";

        res
            .status(httpStatus.OK)
            .json(
                new ApiResponse(
                    httpStatus.OK,
                    responseMessage,
                    {
                        reportSent: emailsSent > 0,
                        emailsSent: emailsSent,
                        fcmNotificationsSent: fcmNotificationsSent,
                        studentWithNoParentEmail: studentWithNoParentEmail
                    }
                )
            );
    } catch (error) {
        throw error;
    }
})
// following controller needed to get attendance in diff aspects    
// use only for getting attendance from a attendance id
const getAttendance = asyncHandler(async (req, res) => {
    const {
        date,
        attendanceId,
        classId,
        studentId,
        courseId,
        semesterId,
        divisionId,
        batchId,
        startDate,
        endDate
    } = req.query;

    if (studentId) {
        const student = await Student.findByPk(studentId);
        if (!student) {
            throw new ApiError(httpStatus.NOT_FOUND, "Student not found")
        }
    }

    if (courseId) {
        const course = await Course.findByPk(courseId);
        if (!course) {
            throw new ApiError(httpStatus.NOT_FOUND, "Course not found")
        }
    }

    if (semesterId) {
        const semester = await Semester.findByPk(semesterId);
        if (!semester) {
            throw new ApiError(httpStatus.NOT_FOUND, "Semester not found")
        }
    }

    if (divisionId) {
        const division = await Division.findByPk(divisionId);
        if (!division) {
            throw new ApiError(httpStatus.NOT_FOUND, "Division not found")
        }
    }

    if (attendanceId) {
        const attendance = await Attendance.findByPk(attendanceId);
        if (!attendance) {
            throw new ApiError(httpStatus.NOT_FOUND, "Attendance not found")
        }
    }

    if (classId) {
        const classObj = await Class.findByPk(classId);
        if (!classObj) {
            throw new ApiError(httpStatus.NOT_FOUND, "Class not found")
        }
    }

    if (courseId) {
        const course = await Course.findByPk(courseId);
        if (!course) {
            throw new ApiError(httpStatus.NOT_FOUND, "Course not found")
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
    // courseid, semesterid, studentId

    if (!attendance) {
        throw new ApiError(httpStatus.NOT_FOUND, "Attendance not found")
    }

    res.status(httpStatus.OK).json(new ApiResponse(httpStatus.OK, "Attendance fetched successfully", attendance));
})


// used by students in app to fetch active attendance sheet 
const getActiveAttendanceSheet = asyncHandler(async (req, res) => {
    const {
        studentId,
        divisionId
    } = req.query;

    const student = await Student.findByPk(studentId);

    if (!student) {
        throw new ApiError(httpStatus.NOT_FOUND, "Student not found")
    }

    const studentDivision = await StudentDivision.findOne({
        where: {
            studentId: studentId,
            divisionId: divisionId,
            endDate: null
        }
    })

    if (!studentDivision) {
        throw new ApiError(httpStatus.NOT_FOUND, "Student's division not found")
    }

    const timetable = await Timetable.findOne({
        where: {
            divisionId: studentDivision.divisionId
        }
    });

    if (!timetable) {
        throw new ApiError(httpStatus.NOT_FOUND, "Timetable not found")
    }

    const classes = await Class.findAll({
        where: {
            timetableId: timetable.id
        }
    })

    if (!classes) {
        throw new ApiError(httpStatus.NOT_FOUND, "Classes not found")
    }
    const classIds = classes.map(classObj => classObj.id)

    const fiveMinBeforeTimeStamp = new Date().getTime() - (5 * 60 * 1000)

    const activeAttendanceSheets = await Attendance.findAll({
        where: {
            classId: {
                [Op.in]: classIds
            },
            createdAt: {
                [Op.gte]: fiveMinBeforeTimeStamp
            }
        }
    })

    res
        .status(httpStatus.OK)
        .json(
            new ApiResponse(
                httpStatus.OK,
                "Active attendance sheets fetched successfully",
                activeAttendanceSheets
            )
        );


})

export {
    removeAttendance,
    addStudentsAttendance,
    updateStudentAttendance,
    bulkUpdateStudentAttendance,
    createAttendance,
    getAttendanceOfStudentForSpecificCourseInSemester,
    getAttendanceOfAllForSemesterDivisionBatchCourse,
    sendAttendanceReport,
    getAttendance,
    getActiveAttendanceSheet
}