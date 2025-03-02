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
import { verifyAdminJWT } from '../middlewares/auth.middleware.js';
import { upload } from '../middlewares/multer.middleware.js';

const router = express.Router();

router.route('/get-staff').get(verifyAdminJWT, getStaff)

router.route('/get-staff-by-id').get(verifyAdminJWT, getStaffById)

router.route('/add').post(verifyAdminJWT, upload.single('staffImageFile'), addStaff)

router.route('/update-details').put(verifyAdminJWT, updateStaffDetails)

router.route('/update-password').put(verifyAdminJWT, updateStaffPassword)

router.route('/update-image').put(verifyAdminJWT, upload.single('staffImageFile'), updateStaffImage)

// router.route('/update-image').put(verifyAdminJWT, upload.single(staffImageFile) ,updateStaff)

// router.route('/login').post(loginAdmin)

router.route('/remove').delete(verifyAdminJWT, removeStaff)

router.route('/remove-image').delete(verifyAdminJWT, removeImage)

router.route('/get-teaching-subjects').get(verifyAdminJWT, getTeachingSubjects)

router.route('/add-teaching-subject').post(verifyAdminJWT, addTeachingSubject)

router.route('/remove-teaching-subject').delete(verifyAdminJWT, removeTeachingSubject)

export default router;