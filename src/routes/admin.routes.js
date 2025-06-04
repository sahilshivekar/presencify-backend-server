import { Router } from 'express';
import { verifyAdminJWT } from "../middlewares/auth.middleware.js"
const router = Router();
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

// login admin
router.route('/admin/login').post(loginAdmin);

// send code to email (for forgot password option at the time of login)
router.route("/admin/forgot-password").post(sendVerificationCodeToEmail)

// verify the email verification code
router.route("/admin/verify-code").post(verifyCode)

// provide access token 
router.route("/admin/get-access-token").post(getAccessToken);


//!  secured routes
// send admin his details
router.route('/admin/me').get(verifyAdminJWT, getAdminDetails)

// add a new admin
router.route('/admin/add').post(verifyAdminJWT, addAdmin);

// retrieve info of current admin
router.route('/admin/get-admins').get(verifyAdminJWT, getAdmins)  // current admin

// update current admin details
router.route('/admin/update-details').put(verifyAdminJWT, updateAdminDetails)

// verify password 
router.route('/admin/verify-password').post(verifyAdminJWT, verifyPassword)

// update current admin password
router.route('/admin/update-password').put(verifyAdminJWT, updateAdminPassword)

// delete a admin
router.route('/admin/remove-admin').delete(verifyAdminJWT, removeAdmin);

// logout admin
router.route("/admin/logout").post(verifyAdminJWT, logout)

// send code to email (for email verfication and to reset the password if the password is forgotten but the admin is logged in)
router.route("/admin/email-verification").get(verifyAdminJWT, sendVerificationCodeToEmail)


export default router;
