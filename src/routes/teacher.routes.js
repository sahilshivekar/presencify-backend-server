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
        validate(teacherValidation.getTeacher),
        verifyJWT([ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT]),
        getTeacher
    )
    .post(
        upload.single('teacherImageFile'),
        validate(teacherValidation.addTeacher),
        verifyJWT([ROLES.ADMIN]),
        addTeacher
    )
    .delete(
        validate(teacherValidation.removeTeacher),
        verifyJWT([ROLES.ADMIN]),
        removeTeacher
    );

// Teacher profile image management (place before dynamic routes)
router.route('/image')
    .put(
        upload.single('teacherImageFile'),
        validate(teacherValidation.updateTeacherImage),
        verifyJWT([ROLES.ADMIN, ROLES.TEACHER]),
        updateTeacherImage
    )
    .delete(
        validate(teacherValidation.removeImage),
        verifyJWT([ROLES.ADMIN, ROLES.TEACHER]),
        removeImage
    );

// Password management (admin only)
router.route('/password')
    .put(validate(teacherValidation.updateTeacherPassword), verifyJWT([ROLES.ADMIN]), updateTeacherPassword);

// Teaching subjects management
router.route('/subjects')
    .get(
        validate(teacherValidation.getTeachingSubjects),
        verifyJWT([ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT]),
        getTeachingSubjects
    )
    .post(
        validate(teacherValidation.addTeachingSubject),
        verifyJWT([ROLES.ADMIN]),
        addTeachingSubject
    )
    .delete(
        validate(teacherValidation.removeTeachingSubject),
        verifyJWT([ROLES.ADMIN]),
        removeTeachingSubject
    );

// Dynamic routes should be registered last
router.route('/:id')
    .get(
        validate(teacherValidation.getTeacherById),
        verifyJWT([ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT]),
        getTeacherById
    )
    .put(
        validate(teacherValidation.updateTeacherDetails),
        verifyJWT([ROLES.ADMIN, ROLES.TEACHER]),
        updateTeacherDetails
    );

export default router;