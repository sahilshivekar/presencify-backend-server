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

const router = express.Router();

// Basic CRUD operations for attendance sheets
router.route('/')
    .get(verifyJWT([ROLES.ADMIN, ROLES.TEACHER]), getAttendance)
    .post(verifyJWT([ROLES.ADMIN, ROLES.TEACHER]), createAttendance)
    .delete(verifyJWT([ROLES.ADMIN, ROLES.TEACHER]), removeAttendance);

// Student-specific attendance operations
router.route('/students')
    .post(verifyJWT([ROLES.ADMIN, ROLES.TEACHER]), addStudentsAttendance)
    .put(verifyJWT([ROLES.ADMIN, ROLES.TEACHER]), updateStudentAttendance);

// Individual student attendance queries
router.route('/student')
    .get(verifyJWT([ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT]), getAttendanceOfStudentForSpecificCourseInSemester);

// Bulk attendance queries (all students)
router.route('/all')
    .get(verifyJWT([ROLES.ADMIN, ROLES.TEACHER]), getAttendanceOfAllForSemesterDivisionBatchCourse);

// Active attendance sheet operations
router.route('/active')
    .get(verifyJWT([ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT]), getActiveAttendanceSheet);

// Reporting functionality
router.route('/report')
    .post(verifyJWT([ROLES.ADMIN, ROLES.TEACHER]), sendAttendanceReport);

export default router;
