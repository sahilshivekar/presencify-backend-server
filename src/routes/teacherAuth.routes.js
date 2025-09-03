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

const router = Router();

// Public authentication routes (no authentication required)
router.route('/login').post(loginTeacher);
router.route('/send-verification-code').post(sendVerificationCodeToEmail);
router.route('/access-token').get(getAccessToken);

// Secured authentication routes (teacher authentication required)
router.route('/update-password').put(verifyJWT([ROLES.TEACHER]), updateTeacherPassword);
router.route('/verify-code').post(verifyJWT([ROLES.TEACHER]), verifyCode);
router.route('/logout').post(verifyJWT([ROLES.TEACHER]), logout);

export default router;
