import express from 'express';
import {
    getTimetables,
    getTimetableById,
    addTimetable,
    updateTimetable,
    removeTimetable
} from '../controllers/timetable.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import { ROLES } from '../config/roles.js';

const router = express.Router();

// Basic CRUD operations
router.route('/')
    .get(verifyJWT([ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT]), getTimetables)
    .post(verifyJWT([ROLES.ADMIN]), addTimetable);

router.route('/:id')
    .get(verifyJWT([ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT]), getTimetableById)
    .put(verifyJWT([ROLES.ADMIN]), updateTimetable)
    .delete(verifyJWT([ROLES.ADMIN]), removeTimetable);

export default router;
