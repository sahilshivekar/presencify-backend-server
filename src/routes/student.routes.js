import express from 'express';
import {
    getStudents,
    addStudent,
    updateStudentDetails,
    updateStudentPassword,
    updateStudentImage,
    removeStudentImage,
    removeStudent
} from '../controllers/student.controller.js';
import { verifyAdminJWT } from '../middlewares/auth.middleware.js';
import { upload } from '../middlewares/multer.middleware.js';

const router = express.Router();

router.route('/get-students').get(verifyAdminJWT, getStudents)

router.route('/add').post(verifyAdminJWT, upload.single('studentImageFile'), addStudent)

router.route('/update-details').put(verifyAdminJWT, updateStudentDetails)

router.route('/update-password').put(verifyAdminJWT, updateStudentPassword)

router.route('/update-image').put(verifyAdminJWT, upload.single('studentImageFile'), updateStudentImage)

router.route('/remove-image').delete(verifyAdminJWT, removeStudentImage)

router.route('/remove').delete(verifyAdminJWT, removeStudent)

export default router;