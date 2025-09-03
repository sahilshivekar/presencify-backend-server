import { Router } from 'express';
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    loginAdmin,
    addAdmin,
    updateAdminDetails,
    updateAdminPassword,
    verifyPassword,
    removeAdmin,
    getAdmins,
    sendVerificationCodeToEmail,
    verifyCode,
    getAccessToken,
    logout,
    getAdminDetails
} from '../controllers/admin.controller.js';
import { ROLES } from '../config/roles.js';

const router = Router();

// Public routes (no authentication required)
router.route('/login').post(loginAdmin);
router.route('/forgot-password').post(sendVerificationCodeToEmail);
router.route('/verify-code').post(verifyCode);
router.route('/access-token').post(getAccessToken);

// Secured routes (admin authentication required)
router.route('/me')
    .get(verifyJWT([ROLES.ADMIN]), getAdminDetails)
    .put(verifyJWT([ROLES.ADMIN]), updateAdminDetails)
    .delete(verifyJWT([ROLES.ADMIN]), removeAdmin)

router.route('/')
    .get(verifyJWT([ROLES.ADMIN]), getAdmins)
    .post(verifyJWT([ROLES.ADMIN]), addAdmin);


// Authentication and password management
router.route('/verify-password').post(verifyJWT([ROLES.ADMIN]), verifyPassword);
router.route('/update-password').put(verifyJWT([ROLES.ADMIN]), updateAdminPassword);
router.route('/logout').post(verifyJWT([ROLES.ADMIN]), logout);
router.route('/email-verification').get(verifyJWT([ROLES.ADMIN]), sendVerificationCodeToEmail);

export default router;
