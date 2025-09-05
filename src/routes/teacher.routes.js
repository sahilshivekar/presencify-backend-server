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
import validate from '../middlewares/validate.js';
import teacherValidation from '../validators/teacher.validation.js';

const router = express.Router();

// Basic CRUD operations
router.route('/')
    .get(
        verifyJWT([ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT]),
        validate(teacherValidation.getTeacher),
        getTeacher
    )
    .post(
        verifyJWT([ROLES.ADMIN]),
        upload.single('teacherImageFile'),
        validate(teacherValidation.addTeacher),
        addTeacher
    )
    .delete(
        verifyJWT([ROLES.ADMIN]),
        validate(teacherValidation.removeTeacher),
        removeTeacher
    );

router.route('/:id')
    .get(
        verifyJWT([ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT]),
        validate(teacherValidation.getTeacherById),
        getTeacherById
    )
    .put(
        verifyJWT([ROLES.ADMIN, ROLES.TEACHER]),
        validate(teacherValidation.updateTeacherDetails),
        updateTeacherDetails
    );

// Teacher profile image management
router.route('/image')
    .put(
        verifyJWT([ROLES.ADMIN, ROLES.TEACHER]),
        upload.single('teacherImageFile'),
        validate(teacherValidation.updateTeacherImage),
        updateTeacherImage
    )
    .delete(
        verifyJWT([ROLES.ADMIN, ROLES.TEACHER]),
        validate(teacherValidation.removeImage),
        removeImage
    );

// Password management (admin only)
router.route('/password')
    .put(verifyJWT([ROLES.ADMIN]), validate(teacherValidation.updateTeacherPassword), updateTeacherPassword);

// Teaching subjects management
router.route('/subjects')
    .get(
        verifyJWT([ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT]),
        validate(teacherValidation.getTeachingSubjects),
        getTeachingSubjects
    )
    .post(
        verifyJWT([ROLES.ADMIN]),
        validate(teacherValidation.addTeachingSubject),
        addTeachingSubject
    )
    .delete(
        verifyJWT([ROLES.ADMIN]),
        validate(teacherValidation.removeTeachingSubject),
        removeTeachingSubject
    );

export default router;