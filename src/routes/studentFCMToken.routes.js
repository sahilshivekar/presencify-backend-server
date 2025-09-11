import { Router } from 'express';
import {
    addStudentFCMTokens,
    updateStudentFCMTokens,
    removeStudentFCMTokens
} from '../controllers/studentFCMToken.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import { ROLES } from '../config/roles.js';
import validate from '../middlewares/validate.js';
import studentFCMValidation from '../validators/studentFCMToken.validation.js';

const router = Router();

// FCM Token management operations
router.route('/')
    .post(validate(studentFCMValidation.addStudentFCMTokens), verifyJWT([ROLES.ADMIN, ROLES.STUDENT]), addStudentFCMTokens)
    .put(validate(studentFCMValidation.updateStudentFCMTokens), verifyJWT([ROLES.ADMIN, ROLES.STUDENT]), updateStudentFCMTokens)
    .delete(validate(studentFCMValidation.removeStudentFCMTokens), verifyJWT([ROLES.ADMIN, ROLES.STUDENT]), removeStudentFCMTokens);

export default router;
