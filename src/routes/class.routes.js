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
import { verifyAdminJWT, verifyStaffJWT, verifyStudentJWT } from '../middlewares/auth.middleware.js';
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



// ! routes for staff
router.route('/staff/get-classes').get(verifyStaffJWT, getClasses);
router.route('/staff/cancel-class').post(verifyStaffJWT, cancelClass);
router.route('/staff/get-class-by-id').get(verifyStaffJWT, getClassById);
router.route('/staff/add-extra-class').post(verifyStaffJWT, addExtraClass);
router.route('/staff/get-cancelled-classes').get(verifyStaffJWT, getCancelledClasses);



// ! routes for student
router.route('/student/get-classes').get(verifyStudentJWT, getClasses);
router.route('/student/get-class-by-id').get(verifyStudentJWT, getClassById);
router.route('/student/get-cancelled-classes').get(verifyStudentJWT, getCancelledClasses);


export default router;