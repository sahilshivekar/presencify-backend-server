import express from 'express';
import {
    addClass,
    getClasses,
    getClassById,
    extendActiveTillDateOfClass,
    removeClass,
    addExtraClass,
    getCancelledClasses,
    cancelClass
} from '../controllers/class.controller.js';
import { verifyAdminJWT, verifyTeacherJWT, verifyStudentJWT } from '../middlewares/auth.middleware.js';
const router = express.Router();

// ! routes for admin
router.route('/admin/get-classes').get(verifyAdminJWT, getClasses);
router.route('/admin/cancel-class').post(verifyAdminJWT, cancelClass);
router.route('/admin/get-class-by-id').get(verifyAdminJWT, getClassById);
router.route('/admin/add-extra-class').post(verifyAdminJWT, addExtraClass);
router.route('/admin/get-cancelled-classes').get(verifyAdminJWT, getCancelledClasses);
router.route('/admin/add-class').post(verifyAdminJWT, addClass);
router.route('/admin/extend-acitve-till-date-of-class').put(verifyAdminJWT, extendActiveTillDateOfClass);
router.route('/admin/remove-class').delete(verifyAdminJWT, removeClass);  



// ! routes for teacher
router.route('/teacher/get-classes').get(verifyTeacherJWT, getClasses);
router.route('/teacher/cancel-class').post(verifyTeacherJWT, cancelClass);
router.route('/teacher/get-class-by-id').get(verifyTeacherJWT, getClassById);
router.route('/teacher/add-extra-class').post(verifyTeacherJWT, addExtraClass);
router.route('/teacher/get-cancelled-classes').get(verifyTeacherJWT, getCancelledClasses);



// ! routes for student
router.route('/student/get-classes').get(verifyStudentJWT, getClasses);
router.route('/student/get-class-by-id').get(verifyStudentJWT, getClassById);
router.route('/student/get-cancelled-classes').get(verifyStudentJWT, getCancelledClasses);


export default router;