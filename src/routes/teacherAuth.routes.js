import { Router } from 'express';
import {
    updateTeacherPassword,
    loginTeacher,
    sendVerificationCodeToEmail,
    verifyCode,
    getAccessToken,
    logout,
} from '../controllers/teacherAuth.controller.js';
import { verifyTeacherJWT } from '../middlewares/auth.middleware.js';
const router = Router();

// ! routes for teacher
router.route('/teacher/update-teacher-password').put(verifyTeacherJWT, updateTeacherPassword);
router.route('/teacher/login-teacher').post(loginTeacher);
router.route('/teacher/send-verification-code-to-email').post(sendVerificationCodeToEmail);
router.route('/teacher/verify-code').post(verifyTeacherJWT, verifyCode);
router.route('/teacher/get-access-token').get(getAccessToken);
router.route('/teacher/logout').post(verifyTeacherJWT, logout);

export default router;