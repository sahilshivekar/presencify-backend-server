import { Router } from 'express';
import { verifyJWT } from "../middlewares/auth.middleware.js"
import {
    getCourses,
    addCourse,
    updateCourse,
    removeCourse,
    addCourseToBranchWithSemesterNumber,
    removeCourseFromBranchWithSemesterNumber,
    getCourseById
} from '../controllers/course.controller.js';
import { ROLES } from '../config/roles.js';

const router = Router();

// Basic CRUD operations
router.route('/')
    .get(verifyJWT([ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT]), getCourses)
    .post(verifyJWT([ROLES.ADMIN]), addCourse);

router.route('/:id')
    .get(verifyJWT([ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT]), getCourseById)
    .put(verifyJWT([ROLES.ADMIN]), updateCourse)
    .delete(verifyJWT([ROLES.ADMIN]), removeCourse);

// Branch-semester relationship operations (nested resource pattern)
router.route('/branch')
    .post(verifyJWT([ROLES.ADMIN]), addCourseToBranchWithSemesterNumber);

router.route('/branch/:branchCourseSemesterId')
    .delete(verifyJWT([ROLES.ADMIN]), removeCourseFromBranchWithSemesterNumber);

export default router;