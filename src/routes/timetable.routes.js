import express from 'express';
import {
    getTimetables,
    getTimetableById,
    addTimetable,
    updateTimetable,
    removeTimetable
} from '../controllers/timetable.controller.js';
import { verifyAdminJWT, verifyTeacherJWT, verifyStudentJWT } from '../middlewares/auth.middleware.js';
const router = express.Router();

// ! routes for admin
router.route('/admin/get-timetables').get(verifyAdminJWT, getTimetables);
router.route('/admin/get-timetable-by-id').get(verifyAdminJWT, getTimetableById);
router.route('/admin/add-timetable').post(verifyAdminJWT, addTimetable);
router.route('/admin/update-timetable').put(verifyAdminJWT, updateTimetable);
router.route('/admin/remove-timetable').delete(verifyAdminJWT, removeTimetable);

// ! routes for teacher
router.route('/teacher/get-timetables').get(verifyTeacherJWT, getTimetables);
router.route('/teacher/get-timetable-by-id').get(verifyTeacherJWT, getTimetableById);


// ! routes for student
router.route('/student/get-timetables').get(verifyStudentJWT, getTimetables);
router.route('/student/get-timetable-by-id').get(verifyStudentJWT, getTimetableById);



export default router;