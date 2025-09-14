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
    .post(validate(dropoutValidation.addStudentToDropout), verifyJWT([ROLES.ADMIN]), addStudentToDropout)
    .delete(validate(dropoutValidation.removeStudentFromDropout), verifyJWT([ROLES.ADMIN]), removeStudentFromDropout);


// Student-specific dropout details
router.route('/student')
    .get(validate(dropoutValidation.getDropoutDetailsOfStudent), verifyJWT([ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT]), getDropoutDetailsOfStudent);

router.route('/:id')
    .get(validate(dropoutValidation.getDropoutById), verifyJWT([ROLES.ADMIN]), getDropoutById);

export default router;
