import { Router } from 'express';
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    addStudentToDropout,
    removeStudentFromDropout,
    getDropoutById,
    getDropoutDetailsOfStudent
} from '../controllers/dropout.controller.js';
import { ROLES } from '../config/roles.js';

const router = Router();

// Basic CRUD operations for dropout records
router.route('/')
    .post(verifyJWT([ROLES.ADMIN]), addStudentToDropout)
    .delete(verifyJWT([ROLES.ADMIN]), removeStudentFromDropout);

router.route('/:id')
    .get(verifyJWT([ROLES.ADMIN]), getDropoutById);

// Student-specific dropout details
router.route('/student')
    .get(verifyJWT([ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT]), getDropoutDetailsOfStudent);

export default router;
