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

router.route('/update-student-password').put(verifyStudentJWT, updateStudentPassword);
router.route('/login-student').post(loginStudent);
router.route('/send-verification-code-to-email').post(sendVerificationCodeToEmail);
router.route('/verify-code').post(verifyStudentJWT, verifyCode);
router.route('/get-access-token').get(getAccessToken);
router.route('/logout').post(verifyStudentJWT, logout);

export default router;