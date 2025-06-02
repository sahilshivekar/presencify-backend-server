import {Router} from 'express';
import {
    addStudentFCMTokens,
    updateStudentFCMTokens,
    removeStudentFCMTokens
} from '../controllers/studentFCMToken.controller.js';
import { verifyAdminJWT } from '../middlewares/auth.middleware.js';

const router = Router();

router.route('/add-student-fcm-token').post(verifyAdminJWT, addStudentFCMTokens)
router.route('/update-student-fcm-token').put(verifyAdminJWT, updateStudentFCMTokens)
router.route('/remove-student-fcm-token').delete(verifyAdminJWT, removeStudentFCMTokens)

export default router