import express from 'express';
import {
    getTeacher,
    addTeacher,
    updateTeacherDetails,
    updateTeacherPassword,
    updateTeacherImage,
    removeTeacher,
    removeImage,
    getTeacherById,
    getTeachingSubjects,
    addTeachingSubject,
    removeTeachingSubject
} from '../controllers/teacher.controller.js';
import { verifyAdminJWT, verifyTeacherJWT, verifyStudentJWT } from '../middlewares/auth.middleware.js';
import { upload } from '../middlewares/multer.middleware.js';

const router = express.Router();

// ! routes for admin
router.route('/admin/get-teacher').get(verifyAdminJWT, getTeacher)
router.route('/admin/get-teacher-by-id').get(verifyAdminJWT, getTeacherById)
router.route('/admin/update-details').put(verifyAdminJWT, updateTeacherDetails)
router.route('/admin/update-image').put(verifyAdminJWT, upload.single('teacherImageFile'), updateTeacherImage)
router.route('/admin/remove-image').delete(verifyAdminJWT, removeImage)
router.route('/admin/get-teaching-subjects').get(verifyAdminJWT, getTeachingSubjects)
router.route('/admin/update-password').put(verifyAdminJWT, updateTeacherPassword)
router.route('/admin/add').post(verifyAdminJWT, upload.single('teacherImageFile'), addTeacher)
router.route('/admin/remove').delete(verifyAdminJWT, removeTeacher)
router.route('/admin/add-teaching-subject').post(verifyAdminJWT, addTeachingSubject)
router.route('/admin/remove-teaching-subject').delete(verifyAdminJWT, removeTeachingSubject)





// ! routes for teacher
router.route('/teacher/get-teacher').get(verifyTeacherJWT, getTeacher)
router.route('/teacher/get-teacher-by-id').get(verifyTeacherJWT, getTeacherById)
router.route('/teacher/get-teaching-subjects').get(verifyTeacherJWT, getTeachingSubjects)
router.route('/teacher/update-details').put(verifyTeacherJWT, updateTeacherDetails)
router.route('/teacher/update-image').put(verifyTeacherJWT, upload.single('teacherImageFile'), updateTeacherImage)
router.route('/teacher/remove-image').delete(verifyTeacherJWT, removeImage)




// ! routes for student
router.route('/student/get-teacher').get(verifyStudentJWT, getTeacher)
router.route('/student/get-teacher-by-id').get(verifyStudentJWT, getTeacherById)
router.route('/student/get-teaching-subjects').get(verifyStudentJWT, getTeachingSubjects)




export default router;