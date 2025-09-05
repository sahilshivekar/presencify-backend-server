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
        verifyJWT([ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT]),
        validate(semesterValidation.getSemesters),
        getSemesters
    )
    .post(
        verifyJWT([ROLES.ADMIN]),
        validate(semesterValidation.addSemester),
        addSemester
    );

router.route('/:id')
    .get(
        verifyJWT([ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT]),
        validate(semesterValidation.getSemesterById),
        getSemesterById
    )
    .put(
        verifyJWT([ROLES.ADMIN]),
        validate(semesterValidation.updateSemester),
        updateSemester
    )
    .delete(
        verifyJWT([ROLES.ADMIN]),
        validate(semesterValidation.removeSemester),
        removeSemester
    );

// Semester-specific operations
router.route('/courses')
    .get(
        verifyJWT([ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT]),
        validate(semesterValidation.getCoursesOfSemester),
        getCoursesOfSemester
    );

export default router;