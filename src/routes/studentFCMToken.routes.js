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
    .post(verifyJWT([ROLES.ADMIN, ROLES.STUDENT]), validate(studentFCMValidation.addStudentFCMTokens), addStudentFCMTokens)
    .put(verifyJWT([ROLES.ADMIN, ROLES.STUDENT]), validate(studentFCMValidation.updateStudentFCMTokens), updateStudentFCMTokens)
    .delete(verifyJWT([ROLES.ADMIN, ROLES.STUDENT]), validate(studentFCMValidation.removeStudentFCMTokens), removeStudentFCMTokens);

export default router;
