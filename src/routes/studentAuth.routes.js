import { Router } from 'express';
import {
    updateStudentPassword,
    loginStudent,
    sendVerificationCodeToEmail,
    verifyCode,
    getAccessToken,
    logout,
} from '../controllers/studentAuth.controller.js';
import { verifyStudentJWT } from '../middlewares/auth.middleware.js';
const router = Router();

// ! routes for student
router.route('/student/update-student-password').put(verifyStudentJWT, updateStudentPassword);
router.route('/student/login-student').post(loginStudent);
router.route('/student/send-verification-code-to-email').post(sendVerificationCodeToEmail);
router.route('/student/verify-code').post(verifyStudentJWT, verifyCode);
router.route('/student/get-access-token').get(getAccessToken);
router.route('/student/logout').post(verifyStudentJWT, logout);

export default router;