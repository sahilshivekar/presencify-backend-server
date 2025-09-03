import { Router } from 'express';
import {
    updateStudentPassword,
    loginStudent,
    sendVerificationCodeToEmail,
    verifyCode,
    getAccessToken,
    logout,
} from '../controllers/studentAuth.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import { ROLES } from '../config/roles.js';

const router = Router();

// Public authentication routes (no authentication required)
router.route('/login').post(loginStudent);
router.route('/send-verification-code').post(sendVerificationCodeToEmail);
router.route('/access-token').get(getAccessToken);

// Secured authentication routes (student authentication required)
router.route('/update-password').put(verifyJWT([ROLES.STUDENT]), updateStudentPassword);
router.route('/verify-code').post(verifyJWT([ROLES.STUDENT]), verifyCode);
router.route('/logout').post(verifyJWT([ROLES.STUDENT]), logout);

export default router;
