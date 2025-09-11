import express from 'express';
import {
    getSemesters,
    addSemester,
    updateSemester,
    removeSemester,
    getCoursesOfSemester,
    getSemesterById
} from '../controllers/semester.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import { ROLES } from '../config/roles.js';
import validate from '../middlewares/validate.js';
import semesterValidation from '../validators/semester.validation.js';

const router = express.Router();

// Basic CRUD operations
router.route('/')
    .get(
        validate(semesterValidation.getSemesters),
        verifyJWT([ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT]),
        getSemesters
    )
    .post(
        validate(semesterValidation.addSemester),
        verifyJWT([ROLES.ADMIN]),
        addSemester
    );

router.route('/:id')
    .get(
        validate(semesterValidation.getSemesterById),
        verifyJWT([ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT]),
        getSemesterById
    )
    .put(
        validate(semesterValidation.updateSemester),
        verifyJWT([ROLES.ADMIN]),
        updateSemester
    )
    .delete(
        validate(semesterValidation.removeSemester),
        verifyJWT([ROLES.ADMIN]),
        removeSemester
    );

// Semester-specific operations
router.route('/courses')
    .get(
        validate(semesterValidation.getCoursesOfSemester),
        verifyJWT([ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT]),
        getCoursesOfSemester
    );

export default router;