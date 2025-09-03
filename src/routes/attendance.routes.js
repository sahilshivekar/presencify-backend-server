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
import { verifyAdminJWT, verifyTeacherJWT, verifyStudentJWT } from '../middlewares/auth.middleware.js';
const router = express.Router();


//! routes for admin
router.route('/admin/create-attendance').post(verifyAdminJWT, createAttendance);
router.route('/admin/add-students-to-attendance').post(verifyAdminJWT, addStudentsAttendance);    
router.route('/admin/remove-attendance').delete(verifyAdminJWT, removeAttendance);
router.route('/admin/update-student-attendance').put(verifyAdminJWT, updateStudentAttendance);
router.route('/admin/get-attendance-of-student').get(verifyAdminJWT, getAttendanceOfStudentForSpecificCourseInSemester)
router.route('/admin/get-attendance-of-all').get(verifyAdminJWT, getAttendanceOfAllForSemesterDivisionBatchCourse)
router.route('/admin/mark-student-attendance').post(verifyAdminJWT, markStudentAttendanceByBLEsessionUUID)
router.route('/admin/send-attendance-report').post(verifyAdminJWT, sendAttendanceReport)
router.route('/admin/get-attendance').get(verifyAdminJWT, getAttendance)
router.route('/admin/get-active-attendance-sheet').get(verifyAdminJWT, getActiveAttendanceSheet)



//! routes for teacher
router.route('/teacher/create-attendance').post(verifyTeacherJWT, createAttendance);
router.route('/teacher/add-students-to-attendance').post(verifyTeacherJWT, addStudentsAttendance);    
router.route('/teacher/remove-attendance').delete(verifyTeacherJWT, removeAttendance);
router.route('/teacher/update-student-attendance').put(verifyTeacherJWT, updateStudentAttendance);
router.route('/teacher/get-attendance-of-student').get(verifyTeacherJWT, getAttendanceOfStudentForSpecificCourseInSemester)
router.route('/teacher/get-attendance-of-all').get(verifyTeacherJWT, getAttendanceOfAllForSemesterDivisionBatchCourse)
router.route('/teacher/get-attendance').get(verifyTeacherJWT, getAttendance)
router.route('/teacher/send-attendance-report').post(verifyTeacherJWT, sendAttendanceReport)
router.route('/teacher/get-active-attendance-sheet').get(verifyTeacherJWT, getActiveAttendanceSheet)


//! routes for student
router.route('/student/get-attendance-of-student').get(verifyStudentJWT, getAttendanceOfStudentForSpecificCourseInSemester)
router.route('/student/mark-student-attendance').post(verifyStudentJWT, markStudentAttendanceByBLEsessionUUID)
router.route('/student/get-active-attendance-sheet').get(verifyStudentJWT, getActiveAttendanceSheet)


//! routes for student
export default router;