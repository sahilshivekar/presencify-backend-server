import {Router} from 'express';
import {
    addStudentFCMTokens,
    updateStudentFCMTokens,
    removeStudentFCMTokens
} from '../controllers/studentFCMToken.controller.js';
import { verifyAdminJWT, verifyStudentJWT } from '../middlewares/auth.middleware.js';

const router = Router();

// ! routes for admin
router.route('/admin/add-student-fcm-token').post(verifyAdminJWT, addStudentFCMTokens)
router.route('/admin/update-student-fcm-token').put(verifyAdminJWT, updateStudentFCMTokens)
router.route('/admin/remove-student-fcm-token').delete(verifyAdminJWT, removeStudentFCMTokens)

// ! routes for student
router.route('/student/add-student-fcm-token').post(verifyStudentJWT, addStudentFCMTokens)
router.route('/student/update-student-fcm-token').put(verifyStudentJWT, updateStudentFCMTokens)
router.route('/student/remove-student-fcm-token').delete(verifyStudentJWT, removeStudentFCMTokens)

export default router