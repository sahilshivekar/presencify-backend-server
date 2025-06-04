import express from 'express';
import {
    getStaff,
    addStaff,
    updateStaffDetails,
    updateStaffPassword,
    updateStaffImage,
    removeStaff,
    removeImage,
    getStaffById,
    getTeachingSubjects,
    addTeachingSubject,
    removeTeachingSubject
} from '../controllers/staff.controller.js';
import { verifyAdminJWT, verifyStaffJWT, verifyStudentJWT } from '../middlewares/auth.middleware.js';
import { upload } from '../middlewares/multer.middleware.js';

const router = express.Router();

// ! routes for admin
router.route('/admin/get-staff').get(verifyAdminJWT, getStaff)
router.route('/admin/get-staff-by-id').get(verifyAdminJWT, getStaffById)
router.route('/admin/update-details').put(verifyAdminJWT, updateStaffDetails)
router.route('/admin/update-image').put(verifyAdminJWT, upload.single('staffImageFile'), updateStaffImage)
router.route('/admin/remove-image').delete(verifyAdminJWT, removeImage)
router.route('/admin/get-teaching-subjects').get(verifyAdminJWT, getTeachingSubjects)
router.route('/admin/update-password').put(verifyAdminJWT, updateStaffPassword)
router.route('/admin/add').post(verifyAdminJWT, upload.single('staffImageFile'), addStaff)
router.route('/admin/remove').delete(verifyAdminJWT, removeStaff)
router.route('/admin/add-teaching-subject').post(verifyAdminJWT, addTeachingSubject)
router.route('/admin/remove-teaching-subject').delete(verifyAdminJWT, removeTeachingSubject)





// ! routes for staff
router.route('/staff/get-staff').get(verifyStaffJWT, getStaff)
router.route('/staff/get-staff-by-id').get(verifyStaffJWT, getStaffById)
router.route('/staff/get-teaching-subjects').get(verifyStaffJWT, getTeachingSubjects)
router.route('/staff/update-details').put(verifyStaffJWT, updateStaffDetails)
router.route('/staff/update-image').put(verifyStaffJWT, upload.single('staffImageFile'), updateStaffImage)
router.route('/staff/remove-image').delete(verifyStaffJWT, removeImage)




// ! routes for student
router.route('/student/get-staff').get(verifyStudentJWT, getStaff)
router.route('/student/get-staff-by-id').get(verifyStudentJWT, getStaffById)
router.route('/student/get-teaching-subjects').get(verifyStudentJWT, getTeachingSubjects)




export default router;