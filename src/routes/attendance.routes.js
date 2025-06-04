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
import { verifyAdminJWT, verifyStaffJWT, verifyStudentJWT } from '../middlewares/auth.middleware.js';
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



//! routes for staff
router.route('/staff/create-attendance').post(verifyStaffJWT, createAttendance);
router.route('/staff/add-students-to-attendance').post(verifyStaffJWT, addStudentsAttendance);    
router.route('/staff/remove-attendance').delete(verifyStaffJWT, removeAttendance);
router.route('/staff/update-student-attendance').put(verifyStaffJWT, updateStudentAttendance);
router.route('/staff/get-attendance-of-student').get(verifyStaffJWT, getAttendanceOfStudentForSpecificCourseInSemester)
router.route('/staff/get-attendance-of-all').get(verifyStaffJWT, getAttendanceOfAllForSemesterDivisionBatchCourse)
router.route('/staff/get-attendance').get(verifyStaffJWT, getAttendance)
router.route('/staff/send-attendance-report').post(verifyStaffJWT, sendAttendanceReport)
router.route('/staff/get-active-attendance-sheet').get(verifyStaffJWT, getActiveAttendanceSheet)


//! routes for student
router.route('/student/get-attendance-of-student').get(verifyStudentJWT, getAttendanceOfStudentForSpecificCourseInSemester)
router.route('/student/mark-student-attendance').post(verifyStudentJWT, markStudentAttendanceByBLEsessionUUID)
router.route('/student/get-active-attendance-sheet').get(verifyStudentJWT, getActiveAttendanceSheet)


//! routes for student
export default router;