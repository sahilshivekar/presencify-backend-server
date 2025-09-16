import express from 'express';
import {
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
} from '../controllers/attendance.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import { ROLES } from '../config/roles.js';
import validate from '../middlewares/validate.js';
import attendanceValidation from '../validators/attendance.validation.js';

const router = express.Router();

// Basic CRUD operations for attendance sheets
router.route('/')
    .get(validate(attendanceValidation.getAttendance), verifyJWT([ROLES.ADMIN, ROLES.TEACHER]), getAttendance)
    .post(validate(attendanceValidation.createAttendance), verifyJWT([ROLES.ADMIN, ROLES.TEACHER]), createAttendance)
    .delete(validate(attendanceValidation.removeAttendance), verifyJWT([ROLES.ADMIN, ROLES.TEACHER]), removeAttendance);

// Student-specific attendance operations
router.route('/students')
    .post(validate(attendanceValidation.addStudentsAttendance), verifyJWT([ROLES.ADMIN, ROLES.TEACHER]), addStudentsAttendance)
    .put(validate(attendanceValidation.updateStudentAttendance), verifyJWT([ROLES.ADMIN, ROLES.TEACHER]), updateStudentAttendance);

// Individual student attendance queries
router.route('/student')
    .get(validate(attendanceValidation.getAttendanceOfAnyStudentForSpecificCourseInSemester), verifyJWT([ROLES.ADMIN, ROLES.TEACHER]), getAttendanceOfStudentForSpecificCourseInSemester);


router.route('/me')
    .get(validate(attendanceValidation.getAttendanceOfSelfForSpecificCourseInSemester), verifyJWT([ROLES.STUDENT]), getAttendanceOfStudentForSpecificCourseInSemester);

// Bulk attendance queries (all students)
router.route('/all')
    .get(validate(attendanceValidation.getAttendanceOfAllForSemesterDivisionBatchCourse), verifyJWT([ROLES.ADMIN, ROLES.TEACHER]), getAttendanceOfAllForSemesterDivisionBatchCourse);

// Active attendance sheet operations
router.route('/active')
    .get(validate(attendanceValidation.getActiveAttendanceSheet), verifyJWT([ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT]), getActiveAttendanceSheet);

// Reporting functionality
router.route('/report')
    .post(validate(attendanceValidation.sendAttendanceReport), verifyJWT([ROLES.ADMIN, ROLES.TEACHER]), sendAttendanceReport);

// Bulk operations
router.route('/bulk/update')
    .put(
        validate(attendanceValidation.bulkUpdateStudentAttendance),
        verifyJWT([ROLES.ADMIN, ROLES.TEACHER]),
        bulkUpdateStudentAttendance
    );

export default router;
