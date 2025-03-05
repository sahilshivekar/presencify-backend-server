import express from 'express';
import {
    removeAttendance,
    addStudentsAttendance,
    updateStudentAttendance,
    createAttendance,
    getAttendance,
    getAttendanceOfStudentForSpecificCourseInSemester,
    getAttendanceOfCourseOnDate,
    getAttendanceOfCourseThroughoutSemester
} from '../controllers/attendance.controller.js';
import { verifyAdminJWT } from '../middlewares/auth.middleware.js';
const router = express.Router();

router.route('/create-attendance').post(verifyAdminJWT, createAttendance);
router.route('/add-students-to-attendance').post(verifyAdminJWT, addStudentsAttendance);    
router.route('/remove-attendance').delete(verifyAdminJWT, removeAttendance);
router.route('/update-student-attendance').put(verifyAdminJWT, updateStudentAttendance);
router.route('/get-attendance').get(verifyAdminJWT, getAttendance)
router.route('/get-attendance-of-student-for-specific-semester').get(verifyAdminJWT, getAttendanceOfStudentForSpecificCourseInSemester)
router.route('/get-attendance-date-course').get(verifyAdminJWT, getAttendanceOfCourseOnDate)
router.route('/get-attendance-course-division').get(verifyAdminJWT,getAttendanceOfCourseThroughoutSemester)

export default router;