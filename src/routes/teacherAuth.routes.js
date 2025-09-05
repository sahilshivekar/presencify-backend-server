import { Router } from 'express';
import {
    updateTeacherPassword,
    loginTeacher,
    sendVerificationCodeToEmail,
    verifyCode,
    getAccessToken,
    logout,
} from '../controllers/teacherAuth.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import { ROLES } from '../config/roles.js';
import validate from '../middlewares/validate.js';
import teacherAuthValidation from '../validators/teacherAuth.validation.js';

const router = Router();

// Public authentication routes (no authentication required)
router.route('/login').post(validate(teacherAuthValidation.loginTeacher), loginTeacher);
router.route('/send-verification-code').post(validate(teacherAuthValidation.sendVerificationCodeToEmail), sendVerificationCodeToEmail);
router.route('/access-token').get(validate(teacherAuthValidation.getAccessToken), getAccessToken);

// Secured authentication routes (teacher authentication required)
router.route('/update-password').put(verifyJWT([ROLES.TEACHER]), validate(teacherAuthValidation.updateTeacherPassword), updateTeacherPassword);
router.route('/verify-code').post(verifyJWT([ROLES.TEACHER]), validate(teacherAuthValidation.verifyCode), verifyCode);
router.route('/logout').post(verifyJWT([ROLES.TEACHER]), logout);

export default router;
