import { Router } from 'express';
import { verifyAdminJWT, verifyStaffJWT, verifyStudentJWT } from "../middlewares/auth.middleware.js"
const router = Router();
import {
    addStudentToDropout,
    removeStudentFromDropout,
    getDropoutById,
    getDropoutDetailsOfStudent
} from '../controllers/dropout.controller.js';

//!  secured routes

// ! routes for admin
router.route('/admin/add-student-to-dropout').post(verifyAdminJWT, addStudentToDropout);
router.route('/admin/remove-student-from-dropout').delete(verifyAdminJWT, removeStudentFromDropout);
router.route('/admin/get-dropout-by-id').get(verifyAdminJWT, getDropoutById);
router.route('/admin/get-dropout-details-of-student').get(verifyAdminJWT, getDropoutDetailsOfStudent);

// ! routes for staff
router.route('/staff/get-dropout-details-of-student').get(verifyStaffJWT, getDropoutDetailsOfStudent);

// ! routes for student
router.route('/student/get-dropout-details-of-student').get(verifyStudentJWT, getDropoutDetailsOfStudent);


export default router;
