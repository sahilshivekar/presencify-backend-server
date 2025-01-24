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
router.route('/login').post(loginAdmin);

// send code to email (for forgot password option at the time of login)
router.route("/forgot-password").post(sendVerificationCodeToEmail)

// verify the email verification code
router.route("/verify-code").post(verifyCode)

// provide access token 
router.route("/get-access-token").post(getAccessToken);


//!  secured routes
// send admin his details
router.route('/me').get(verifyAdminJWT, getAdminDetails)

// add a new admin
router.route('/add').post(verifyAdminJWT, addAdmin);

// retrieve info of current admin
router.route('/get-admins').get(verifyAdminJWT, getAdmins)  // current admin

// update current admin details
router.route('/update-details').put(verifyAdminJWT, updateAdminDetails)

// verify password 
router.route('/verify-password').post(verifyAdminJWT, verifyPassword)

// update current admin password
router.route('/update-password').put(verifyAdminJWT, updateAdminPassword)

// delete a admin
router.route('/remove-admin').delete(verifyAdminJWT, removeAdmin);

// logout admin
router.route("/logout").post(verifyAdminJWT, logout)

// send code to email (for email verfication and to reset the password if the password is forgotten but the admin is logged in)
router.route("/email-verification").get(verifyAdminJWT, sendVerificationCodeToEmail)


export default router;
