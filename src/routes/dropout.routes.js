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

router.route('/add-student-to-dropout').post(verifyAdminJWT, addStudentToDropout);
router.route('/remove-student-from-dropout').delete(verifyAdminJWT, removeStudentFromDropout);
router.route('/get-dropout-by-id').get(verifyAdminJWT, getDropoutById);
router.route('/get-dropout-details-of-student').get(verifyAdminJWT, getDropoutDetailsOfStudent);

export default router;
