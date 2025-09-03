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
import { verifyJWT } from '../middlewares/auth.middleware.js';
import { ROLES } from '../config/roles.js';
import { upload } from '../middlewares/multer.middleware.js';

const router = express.Router();

// Basic CRUD operations
router.route('/')
    .get(verifyJWT([ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT]), getTeacher)
    .post(verifyJWT([ROLES.ADMIN]), upload.single('teacherImageFile'), addTeacher)
    .delete(verifyJWT([ROLES.ADMIN]), removeTeacher);

router.route('/:id')
    .get(verifyJWT([ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT]), getTeacherById)
    .put(verifyJWT([ROLES.ADMIN, ROLES.TEACHER]), updateTeacherDetails);

// Teacher profile image management
router.route('/image')
    .put(verifyJWT([ROLES.ADMIN, ROLES.TEACHER]), upload.single('teacherImageFile'), updateTeacherImage)
    .delete(verifyJWT([ROLES.ADMIN, ROLES.TEACHER]), removeImage);

// Password management (admin only)
router.route('/password')
    .put(verifyJWT([ROLES.ADMIN]), updateTeacherPassword);

// Teaching subjects management
router.route('/subjects')
    .get(verifyJWT([ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT]), getTeachingSubjects)
    .post(verifyJWT([ROLES.ADMIN]), addTeachingSubject)
    .delete(verifyJWT([ROLES.ADMIN]), removeTeachingSubject);

export default router;