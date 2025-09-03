import { Router } from 'express';
import { verifyAdminJWT, verifyTeacherJWT, verifyStudentJWT } from "../middlewares/auth.middleware.js"
const router = Router();
import {
    getUniversities,
    addUniversity,
    updateUniversity,
    removeUniversity,
    getUniversityById
} from '../controllers/university.controller.js';


//!  secured routes

// ! routes for admin
router.route('/admin/get-universities').get(verifyAdminJWT, getUniversities) 
router.route('/admin/get-university-by-id').get(verifyAdminJWT, getUniversityById);
router.route('/admin/add').post(verifyAdminJWT, addUniversity);
router.route('/admin/update').put(verifyAdminJWT, updateUniversity)       
router.route('/admin/remove').delete(verifyAdminJWT, removeUniversity);

// ! routes for teacher
router.route('/teacher/get-universities').get(verifyTeacherJWT, getUniversities) 
router.route('/teacher/get-university-by-id').get(verifyTeacherJWT, getUniversityById);


// ! routes for student
router.route('/student/get-universities').get(verifyStudentJWT, getUniversities) 
router.route('/student/get-university-by-id').get(verifyStudentJWT, getUniversityById);
export default router;
