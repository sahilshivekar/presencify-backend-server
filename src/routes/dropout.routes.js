import { Router } from 'express';
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    addStudentToDropout,
    removeStudentFromDropout,
    getDropoutById,
    getDropoutDetailsOfStudent
} from '../controllers/dropout.controller.js';
import { ROLES } from '../config/roles.js';
import validate from '../middlewares/validate.js';
import dropoutValidation from '../validators/dropout.validation.js';

const router = Router();

// Basic CRUD operations for dropout records
router.route('/')
    .post(verifyJWT([ROLES.ADMIN]), validate(dropoutValidation.addStudentToDropout), addStudentToDropout)
    .delete(verifyJWT([ROLES.ADMIN]), validate(dropoutValidation.removeStudentFromDropout), removeStudentFromDropout);

router.route('/:id')
    .get(verifyJWT([ROLES.ADMIN]), validate(dropoutValidation.getDropoutById), getDropoutById);

// Student-specific dropout details
router.route('/student')
    .get(verifyJWT([ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT]), validate(dropoutValidation.getDropoutDetailsOfStudent), getDropoutDetailsOfStudent);

export default router;
