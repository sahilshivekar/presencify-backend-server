import { Router } from 'express';
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    login,
    updateAdminPassword,
    verifyPassword,
    sendVerificationCodeToEmail,
    verifyCode,
    refreshTokens,
    logout,
} from '../controllers/adminAuth.controller.js';
import { ROLES } from '../config/roles.js';


const router = Router();

// Public routes (no authentication required)
router.route('/login').post(login);
router.route('/forgot-password').post(sendVerificationCodeToEmail);
router.route('/verify-code').post(verifyCode);
router.route('/access-token').post(refreshTokens);

// Authentication and password management
router.route('/verify-password').post(verifyJWT([ROLES.ADMIN]), verifyPassword);
router.route('/update-password').put(verifyJWT([ROLES.ADMIN]), updateAdminPassword);
router.route('/logout').post(verifyJWT([ROLES.ADMIN]), logout);
router.route('/email-verification').get(verifyJWT([ROLES.ADMIN]), sendVerificationCodeToEmail);

export default router;
