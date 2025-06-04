import { Router } from 'express';
import { verifyAdminJWT, verifyStaffJWT, verifyStudentJWT } from "../middlewares/auth.middleware.js"
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

// ! routes for staff
router.route('/staff/get-universities').get(verifyStaffJWT, getUniversities) 
router.route('/staff/get-university-by-id').get(verifyStaffJWT, getUniversityById);


// ! routes for student
router.route('/student/get-universities').get(verifyStudentJWT, getUniversities) 
router.route('/student/get-university-by-id').get(verifyStudentJWT, getUniversityById);
export default router;
