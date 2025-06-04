import express from 'express';
import {
    getSemesters,
    addSemester,
    updateSemester,
    removeSemester,
    getCoursesOfSemester,
    getSemesterById
} from '../controllers/semester.controller.js';
import { verifyAdminJWT, verifyStaffJWT, verifyStudentJWT } from '../middlewares/auth.middleware.js';

const router = express.Router();

// ! routes for admin
router.route('/admin/get-semesters').get(verifyAdminJWT, getSemesters);
router.route('/admin/get-courses-of-semester').get(verifyAdminJWT, getCoursesOfSemester);
router.route('/admin/get-semester-by-id').get(verifyAdminJWT, getSemesterById);
router.route('/admin/add').post(verifyAdminJWT, addSemester);
router.route('/admin/update').put(verifyAdminJWT, updateSemester);
router.route('/admin/remove').delete(verifyAdminJWT, removeSemester);


// ! routes for staff
router.route('/staff/get-semesters').get(verifyStaffJWT, getSemesters);
router.route('/staff/get-courses-of-semester').get(verifyStaffJWT, getCoursesOfSemester);
router.route('/staff/get-semester-by-id').get(verifyStaffJWT, getSemesterById);

// ! routes for student
router.route('/student/get-semesters').get(verifyStudentJWT, getSemesters);
router.route('/student/get-courses-of-semester').get(verifyStudentJWT, getCoursesOfSemester);
router.route('/student/get-semester-by-id').get(verifyStudentJWT, getSemesterById);

export default router;