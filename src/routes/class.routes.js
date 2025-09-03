import express from 'express';
import {
    addClass,
    getClasses,
    getClassById,
    extendActiveTillDateOfClass,
    removeClass,
    addExtraClass,
    getCancelledClasses,
    cancelClass
} from '../controllers/class.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import { ROLES } from '../config/roles.js';

const router = express.Router();

// Basic CRUD operations
router.route('/')
    .get(verifyJWT([ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT]), getClasses)
    .post(verifyJWT([ROLES.ADMIN]), addClass)
    .delete(verifyJWT([ROLES.ADMIN]), removeClass);

router.route('/:id')
    .get(verifyJWT([ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT]), getClassById)
    .put(verifyJWT([ROLES.ADMIN]), extendActiveTillDateOfClass);

// Extra class operations
router.route('/extra')
    .post(verifyJWT([ROLES.ADMIN, ROLES.TEACHER]), addExtraClass);

// Cancelled class operations
router.route('/cancelled')
    .get(verifyJWT([ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT]), getCancelledClasses)
    .post(verifyJWT([ROLES.ADMIN, ROLES.TEACHER]), cancelClass);

export default router;
