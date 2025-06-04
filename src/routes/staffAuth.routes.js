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

router.route('/update-staff-password').put(verifyStaffJWT, updateStaffPassword);
router.route('/login-staff').post(loginStaff);
router.route('/send-verification-code-to-email').post(sendVerificationCodeToEmail);
router.route('/verify-code').post(verifyStaffJWT, verifyCode);
router.route('/get-access-token').get(getAccessToken);
router.route('/logout').post(verifyStaffJWT, logout);

export default router;