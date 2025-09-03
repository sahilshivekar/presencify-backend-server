import { Router } from 'express';
import {
    addStudentFCMTokens,
    updateStudentFCMTokens,
    removeStudentFCMTokens
} from '../controllers/studentFCMToken.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import { ROLES } from '../config/roles.js';

const router = Router();

// FCM Token management operations
router.route('/')
    .post(verifyJWT([ROLES.ADMIN, ROLES.STUDENT]), addStudentFCMTokens)
    .put(verifyJWT([ROLES.ADMIN, ROLES.STUDENT]), updateStudentFCMTokens)
    .delete(verifyJWT([ROLES.ADMIN, ROLES.STUDENT]), removeStudentFCMTokens);

export default router;
