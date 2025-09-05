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
import validate from '../middlewares/validate.js';
import courseValidation from '../validators/course.validation.js';

const router = Router();

// Basic CRUD operations
router.route('/')
    .get(
        verifyJWT([ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT]),
        validate(courseValidation.getCourses),
        getCourses
    )
    .post(
        verifyJWT([ROLES.ADMIN]),
        validate(courseValidation.addCourse),
        addCourse
    );

router.route('/:id')
    .get(
        verifyJWT([ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT]),
        validate(courseValidation.getCourseById),
        getCourseById
    )
    .put(
        verifyJWT([ROLES.ADMIN]),
        validate(courseValidation.updateCourse),
        updateCourse
    )
    .delete(
        verifyJWT([ROLES.ADMIN]),
        validate(courseValidation.removeCourse),
        removeCourse
    );

// Branch-semester relationship operations (nested resource pattern)
router.route('/branch')
    .post(
        verifyJWT([ROLES.ADMIN]),
        validate(courseValidation.addCourseToBranchWithSemesterNumber),
        addCourseToBranchWithSemesterNumber
    );

router.route('/branch/:branchCourseSemesterId')
    .delete(
        verifyJWT([ROLES.ADMIN]),
        validate(courseValidation.removeCourseFromBranchWithSemesterNumber),
        removeCourseFromBranchWithSemesterNumber
    );

export default router;