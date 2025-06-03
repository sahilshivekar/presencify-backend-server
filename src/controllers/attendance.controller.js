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
import { getIO } from '../socket/index.js';
import { fromYYYYMMDDToDDMMYYYY } from "../utils/date.js";
import { sendAttendanceReportToEmail } from "../utils/email.js";


const realtimeAttendanceHelper = async (
    currStudentIds,
    currCourseId,
    currSemesterId,
    currBatchId,
    currDivisionId
) => {
    const io = getIO();
    const openRooms = io.of("/attendance").adapter.rooms.keys()
    const openRoomsList = [...openRooms]
    console.log(openRoomsList)
    // ! For individual student attendance
    let studentRooms = openRoomsList.filter(openRoom => openRoom.includes("student_attendance"))

    for (const roomName of studentRooms) {
        const studentId = roomName.split("_")[3]
        const courseId = roomName.split("_")[5]
        const semesterId = roomName.split("_")[7]
        const divisionId = roomName.split("_")[9]
        const batchId = roomName.split("_")[11]
        const startDate = roomName.split("_")[13]
        const endDate = roomName.split("_")[15]
        console.log(currStudentIds.includes(Number(studentId)), currStudentIds)
        console.log(currCourseId == courseId, courseId)
        console.log(currSemesterId == semesterId, currSemesterId, semesterId)
        if (
            currStudentIds.includes(Number(studentId)) &&
            currCourseId == courseId &&
            currSemesterId == semesterId
        ) {
            console.log("here")
            const attendance = await getAttendanceOfStudentForSpecificCourseInSemesterQuery(
                studentId,
                courseId,
                semesterId,
                divisionId == "null" ? null : divisionId,
                batchId == "null" ? null : batchId,
                startDate == "null" ? null : startDate,
                endDate == "null" ? null : endDate
            )
            io.of("/attendance").to(roomName).emit("student_updated_attendance", attendance);
        }
    }



    // ! For all attendance by course, batch, division, semester

    let roomsOfAllStudents = openRoomsList.filter(openRoom => openRoom.includes("all_attendance_room"))
    for (const openRoom of roomsOfAllStudents) {
        const semesterId = openRoom.split("_")[4]
        const divisionId = openRoom.split("_")[6]
        const batchId = openRoom.split("_")[8]
        const courseId = openRoom.split("_")[10]
        const startDate = openRoom.split("_")[12]
        const endDate = openRoom.split("_")[14]


        if (
            semesterId == currSemesterId ||
            divisionId == currDivisionId ||
            batchId == currBatchId ||
            courseId == currCourseId
        ) {

            const updatedAttendance = await getAttendanceOfAllForSemesterDivisionBatchCourseQuery(
                semesterId == "null" ? null : semesterId,
                divisionId == "null" ? null : divisionId,
                batchId == "null" ? null : batchId,
                courseId == "null" ? null : courseId,
                startDate == "null" ? null : startDate,
                endDate == "null" ? null : endDate
            )
            io.of("/attendance").to(openRoom).emit("all_updated_attendance", updatedAttendance);
        }
    }

}


//* create attendance sheet type thing where student ids will be added
const createAttendance = asyncHandler(async (req, res) => {
    const {
        classId,
        BLEsessionUUID,
        date
    } = req.body;


    if (!classId || !date || !BLEsessionUUID) {
        throw new ApiError(400, "Class ID, Date and BLE Session UUID are required")
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
            BLEsessionUUID: BLEsessionUUID,
            date: date
        });

        res.status(201).json(new ApiResponse(201, "Attendance created successfully", attendance));
    }
})



// ! this will be used by the teacher initially to mark all the students as absent so that attendance for all the students will remain in the database
// ! or if the teacher manually want to add attendance
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
    let batch = null
    if (classObj?.batchId) {
        batch = await Batch.findByPk(classObj.batchId)
    }

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

    if (presentStudentIds.length + absentStudentIds.length > studentsOfDivision.length) {
        throw new ApiError(400, `There are some student ids which do not belong to the current division`)
    }


    // check course and semester id to know whether to update students individual channel or not
    const division = await Division.findByPk(timetable.divisionId);
    const semester = await Semester.findByPk(division.semesterId);

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
        }))]
    )

    realtimeAttendanceHelper(
        [...presentStudentIds, ...absentStudentIds],
        classObj.courseId,
        semester.id,
        classObj?.batchId,
        division.id
    )

    res.status(201).json(new ApiResponse(201, "Students attendance added successfully", {}));
})



//! this will be used by the teacher to correct a students attendance status
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

    const classObj = await Class.findByPk(attendance.classId);
    const timetable = await Timetable.findByPk(classObj.timetableId);
    const division = await Division.findByPk(timetable.divisionId);

    realtimeAttendanceHelper(
        [studentId],
        classObj.courseId,
        division.semesterId,
        classObj?.batchId,
        timetable.divisionId
    )

    res.status(200).json(new ApiResponse(200, "Students attendance status updated successfully", attendanceStudent));
})


// ! this will be used only by the student to send the appropriate BLEsessionUUID to mark his attendance
const markStudentAttendanceByBLEsessionUUID = asyncHandler(async (req, res) => {
    const {
        BLEsessionUUID,
        studentId
    } = req.body;

    if (!BLEsessionUUID || !studentId) {
        throw new ApiError(400, "BLE Session UUID and Student ID are required")
    }


    const attendanceSheet = await Attendance.findOne({
        where: {
            BLEsessionUUID: BLEsessionUUID
        }
    })

    if (!attendanceSheet) {
        throw new ApiError(404, "BLE session UUID is not valid")
    }

    const attendanceSheetCreatedAt = new Date(attendanceSheet.createdAt)
    // console.log(attendanceSheetCreatedAt)

    const fiveMinAfterTimeStamp = new Date(attendanceSheetCreatedAt.getTime() + (5 * 60 * 1000))

    // console.log(fiveMinAfterTimeStamp)

    const currentTimeStamp = new Date()

    if (currentTimeStamp > fiveMinAfterTimeStamp) {
        throw new ApiError(400, "Deadline to mark attendance is over")
    }

    // if (attendanceSheet.createdAt < ) {

    await AttendanceStudent.update(
        {
            attendanceStatus: true
        },
        {
            where: {
                studentId: studentId,
                attendanceId: attendanceSheet.id
            }
        }
    )

    const classObj = await Class.findByPk(attendanceSheet.classId);
    const timetable = await Timetable.findByPk(classObj.timetableId);
    const division = await Division.findByPk(timetable.divisionId);

    realtimeAttendanceHelper(
        [studentId],
        classObj.courseId,
        division.semesterId,
        classObj?.batchId,
        timetable.divisionId
    )

    res
        .status(200)
        .json(new ApiResponse(200, "Attendance marked successfully", null));
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



const getAttendanceOfStudentForSpecificCourseInSemester = asyncHandler(async (req, res) => {

    const {
        studentId,
        courseId,
        semesterId,
        divisionId,
        batchId,
        startDate,
        endDate
    } = req.query;

    // courseid, semesterid, studentId

    // for the rest of the subjects 
    const attendance = await getAttendanceOfStudentForSpecificCourseInSemesterQuery(
        studentId,
        courseId,
        semesterId ? semesterId : null,
        divisionId ? divisionId : null,
        batchId ? batchId : null,
        startDate ? startDate : null,
        endDate ? endDate : null
    );

    res.status(200).json(new ApiResponse(200, "Attendance fetched successfully", attendance));
});

const getAttendanceOfAllForSemesterDivisionBatchCourse = asyncHandler(async (req, res) => {
    const {
        semesterId,
        divisionId,
        batchId,
        courseId,
        startDate,
        endDate
    } = req.query;

    const attendance = await getAttendanceOfAllForSemesterDivisionBatchCourseQuery(
        semesterId,
        divisionId,
        batchId,
        courseId,
        startDate,
        endDate
    )
    res.status(200).json(new ApiResponse(200, "Attendance fetched successfully", attendance));
})



// ! query only
const getAttendanceOfStudentForSpecificCourseInSemesterQuery = async (
    studentId,
    courseId,
    semesterId,
    divisionId,
    batchId,
    startDate,
    endDate
) => {

    if (!studentId && !courseId && !semesterId && !divisionId && !batchId && !startDate && !endDate) {
        throw new ApiError(400, "One of the parameters is required: studentId, courseId, semesterId, divisionId, batchId, startDate, endDate")
    }

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
        attendance_students.student_id = ${studentId}
        AND courses.course_id = ${courseId}
        ${semesterId ? `AND semesters.semester_id = ${semesterId}` : ''}
        ${divisionId ? `AND divisions.division_id = ${divisionId}` : ''}
        ${batchId ? `AND batches.batch_id = ${batchId}` : ''}
        ${startDate ? `AND attendances.attendance_date >= '${startDate}'` : ''}
        ${endDate ? `AND attendances.attendance_date <= '${endDate}'` : ''}
        GROUP BY 
        courses.course_id,
        courses.course_name;
        `
    )
    // console.log(aggregatedAttendance) 
    //! [ { course_id: 101, total_lectures: '18', attended_lectures: '0' } ]


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
        attendance_students.student_id = ${studentId}
        AND courses.course_id = ${courseId}
        ${semesterId ? `AND semesters.semester_id = ${semesterId}` : ''}
        ${divisionId ? `AND divisions.division_id = ${divisionId}` : ''}
        ${batchId ? `AND batches.batch_id = ${batchId}` : ''}
        ${startDate ? `AND attendances.attendance_date >= '${startDate}'` : ''}
        ${endDate ? `AND attendances.attendance_date <= '${endDate}'` : ''}
        ORDER BY
        attendances.attendance_date;
        `
    )
    // console.log(detailedAttendance) 
    //!  { attendance_id: 1, date: '2025-01-08', attendance_status: false },
    //!  { attendance_id: 2, date: '2025-01-09', attendance_status: false },


    if (!aggregatedAttendance || !detailedAttendance) {
        throw new ApiError(404, "Attendance for this course not found")
    }

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
    endDate
) => {
    if (!semesterId && !divisionId && !courseId && !batchId && !startDate && !endDate) {
        throw new ApiError(400, "One of the parameters is required: semesterId, divisionId, courseId, batchId, startDate, endDate")
    }
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
        WHERE 
        ${semesterId ? `semesters.semester_id = ${semesterId}` : ''}
        ${divisionId ? `AND timetables.division_id = ${divisionId}` : ''}
        ${batchId ? `AND classes.batch_id = ${batchId}` : ''}
        ${courseId ? `AND classes.course_id = ${courseId}` : ''}
        ${startDate ? `AND attendances.attendance_date >= '${startDate}'` : ''}
        ${endDate ? `AND attendances.attendance_date <= '${endDate}'` : ''}
        GROUP BY courses.course_id, attendances.attendance_date, attendances.attendance_id
        ORDER BY attendances.attendance_date)

        SELECT 
        course_id,
        json_agg(
            json_build_object(
                'attendanceDate', "attendanceDate",
                'totalStudents', "totalStudents",
                'presentStudents', "presentStudents",
                'attendanceId', "attendanceId"
            ) ORDER BY "attendanceDate"
        ) AS attendanceSummary
        FROM attendance_grouped_by_course_id_and_attendance_date
        GROUP BY course_id;
        `
    )

    return attendance[0]

}


const sendAttendanceReport = asyncHandler(async (req, res) => {
    const {
        startDate, // will be same as end date if its about single day attendance
        endDate,
        studentIds,
        courseIds,
        semesterId
    } = req.body;

    if (!studentIds && !courseIds && !semesterId) {
        throw new ApiError(400, "These parameters are required: studentId, courseId, semesterId")
    }

    let studentWithNoParentEmail = []

    for (const studentId of studentIds) {
        let allCourseAttendance = []
        let emailText = ""
        for (const courseId of courseIds) {
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

            // each object in the "allCourseAttendance" represents a course
            allCourseAttendance.forEach(courseAttendance => {
                if (courseAttendance.aggregatedAttendance.length != 0) {
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
            sendAttendanceReportToEmail(student.parentEmail, emailText)
        
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


    res
        .status(200)
        .json(
            new ApiResponse(
                200,
                "Attendance report sent to student's parent for those who had there valid parent's email attached to their details",
                {
                    studentWithNoParentEmail: studentWithNoParentEmail
                }
            )
        );

})



export {
    removeAttendance,
    addStudentsAttendance,
    updateStudentAttendance,
    createAttendance,
    getAttendanceOfStudentForSpecificCourseInSemester,
    getAttendanceOfAllForSemesterDivisionBatchCourse,
    markStudentAttendanceByBLEsessionUUID,
    sendAttendanceReport
}