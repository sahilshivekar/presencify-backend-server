import express from 'express';
import {
    removeAttendance,
    addStudentsAttendance,
    updateStudentAttendance,
    createAttendance,
    getAttendanceOfStudentForSpecificCourseInSemester,
    getAttendanceOfAllForSemesterDivisionBatchCourse,
    markStudentAttendanceByBLEsessionUUID,
    sendAttendanceReport
} from '../controllers/attendance.controller.js';
import { verifyAdminJWT } from '../middlewares/auth.middleware.js';
const router = express.Router();

router.route('/create-attendance').post(verifyAdminJWT, createAttendance);
router.route('/add-students-to-attendance').post(verifyAdminJWT, addStudentsAttendance);    
router.route('/remove-attendance').delete(verifyAdminJWT, removeAttendance);
router.route('/update-student-attendance').put(verifyAdminJWT, updateStudentAttendance);
router.route('/get-attendance-of-student').get(verifyAdminJWT, getAttendanceOfStudentForSpecificCourseInSemester)
router.route('/get-attendance-of-all').get(verifyAdminJWT, getAttendanceOfAllForSemesterDivisionBatchCourse)
router.route('/mark-student-attendance').post(verifyAdminJWT, markStudentAttendanceByBLEsessionUUID)
router.route('/send-attendance-report').post(verifyAdminJWT, sendAttendanceReport)

export default router;