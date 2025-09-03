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

const router = express.Router();

// Basic CRUD operations
router.route('/')
    .get(verifyJWT([ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT]), getSemesters)
    .post(verifyJWT([ROLES.ADMIN]), addSemester);

router.route('/:id')
    .get(verifyJWT([ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT]), getSemesterById)
    .put(verifyJWT([ROLES.ADMIN]), updateSemester)
    .delete(verifyJWT([ROLES.ADMIN]), removeSemester);

// Semester-specific operations
router.route('/courses')
    .get(verifyJWT([ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT]), getCoursesOfSemester);

export default router;