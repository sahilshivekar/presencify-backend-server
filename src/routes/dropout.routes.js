import { Router } from 'express';
import { verifyAdminJWT } from "../middlewares/auth.middleware.js"
const router = Router();
import {
    addStudentToDropout,
    removeStudentFromDropout,
    getDropoutById
} from '../controllers/dropout.controller.js';

//!  secured routes

router.route('/add-student-to-dropout').post(verifyAdminJWT, addStudentToDropout);
router.route('/remove-student-from-dropout').delete(verifyAdminJWT, removeStudentFromDropout);
router.route('/get-dropout-by-id').get(verifyAdminJWT, getDropoutById);

export default router;
