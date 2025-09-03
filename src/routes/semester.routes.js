import express from 'express';
import {
    getSemesters,
    addSemester,
    updateSemester,
    removeSemester,
    getCoursesOfSemester,
    getSemesterById
} from '../controllers/semester.controller.js';
import { verifyAdminJWT, verifyTeacherJWT, verifyStudentJWT } from '../middlewares/auth.middleware.js';

const router = express.Router();

// ! routes for admin
router.route('/admin/get-semesters').get(verifyAdminJWT, getSemesters);
router.route('/admin/get-courses-of-semester').get(verifyAdminJWT, getCoursesOfSemester);
router.route('/admin/get-semester-by-id').get(verifyAdminJWT, getSemesterById);
router.route('/admin/add').post(verifyAdminJWT, addSemester);
router.route('/admin/update').put(verifyAdminJWT, updateSemester);
router.route('/admin/remove').delete(verifyAdminJWT, removeSemester);


// ! routes for teacher
router.route('/teacher/get-semesters').get(verifyTeacherJWT, getSemesters);
router.route('/teacher/get-courses-of-semester').get(verifyTeacherJWT, getCoursesOfSemester);
router.route('/teacher/get-semester-by-id').get(verifyTeacherJWT, getSemesterById);

// ! routes for student
router.route('/student/get-semesters').get(verifyStudentJWT, getSemesters);
router.route('/student/get-courses-of-semester').get(verifyStudentJWT, getCoursesOfSemester);
router.route('/student/get-semester-by-id').get(verifyStudentJWT, getSemesterById);

export default router;