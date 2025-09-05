import express from 'express';
import {
    removeAttendance,
    addStudentsAttendance,
    updateStudentAttendance,
    createAttendance,
    getAttendanceOfStudentForSpecificCourseInSemester,
    getAttendanceOfAllForSemesterDivisionBatchCourse,
    markStudentAttendanceByBLEsessionUUID,
    sendAttendanceReport,
    getAttendance,
    getActiveAttendanceSheet
} from '../controllers/attendance.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import { ROLES } from '../config/roles.js';
import validate from '../middlewares/validate.js';
import attendanceValidation from '../validators/attendance.validation.js';

const router = express.Router();

// Basic CRUD operations for attendance sheets
router.route('/')
    .get(verifyJWT([ROLES.ADMIN, ROLES.TEACHER]), validate(attendanceValidation.getAttendance), getAttendance)
    .post(verifyJWT([ROLES.ADMIN, ROLES.TEACHER]), validate(attendanceValidation.createAttendance), createAttendance)
    .delete(verifyJWT([ROLES.ADMIN, ROLES.TEACHER]), validate(attendanceValidation.removeAttendance), removeAttendance);

// Student-specific attendance operations
router.route('/students')
    .post(verifyJWT([ROLES.ADMIN, ROLES.TEACHER]), validate(attendanceValidation.addStudentsAttendance), addStudentsAttendance)
    .put(verifyJWT([ROLES.ADMIN, ROLES.TEACHER]), validate(attendanceValidation.updateStudentAttendance), updateStudentAttendance);

// Individual student attendance queries
router.route('/student')
    .get(verifyJWT([ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT]), validate(attendanceValidation.getAttendanceOfStudentForSpecificCourseInSemester), getAttendanceOfStudentForSpecificCourseInSemester);

// Bulk attendance queries (all students)
router.route('/all')
    .get(verifyJWT([ROLES.ADMIN, ROLES.TEACHER]), validate(attendanceValidation.getAttendanceOfAllForSemesterDivisionBatchCourse), getAttendanceOfAllForSemesterDivisionBatchCourse);

// Active attendance sheet operations
router.route('/active')
    .get(verifyJWT([ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT]), validate(attendanceValidation.getActiveAttendanceSheet), getActiveAttendanceSheet);

// Reporting functionality
router.route('/report')
    .post(verifyJWT([ROLES.ADMIN, ROLES.TEACHER]), validate(attendanceValidation.sendAttendanceReport), sendAttendanceReport);

export default router;
