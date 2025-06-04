import { Router } from 'express';
import {
    updateStaffPassword,
    loginStaff,
    sendVerificationCodeToEmail,
    verifyCode,
    getAccessToken,
    logout,
} from '../controllers/staffAuth.controller.js';
import { verifyStaffJWT } from '../middlewares/auth.middleware.js';
const router = Router();

// ! routes for staff
router.route('/staff/update-staff-password').put(verifyStaffJWT, updateStaffPassword);
router.route('/staff/login-staff').post(loginStaff);
router.route('/staff/send-verification-code-to-email').post(sendVerificationCodeToEmail);
router.route('/staff/verify-code').post(verifyStaffJWT, verifyCode);
router.route('/staff/get-access-token').get(getAccessToken);
router.route('/staff/logout').post(verifyStaffJWT, logout);

export default router;