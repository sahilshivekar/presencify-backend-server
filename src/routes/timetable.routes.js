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
import validate from '../middlewares/validate.js';
import timetableValidation from '../validators/timetable.validation.js';

const router = express.Router();

// Basic CRUD operations
router.route('/')
    .get(
        verifyJWT([ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT]),
        validate(timetableValidation.getTimetables),
        getTimetables
    )
    .post(
        verifyJWT([ROLES.ADMIN]),
        validate(timetableValidation.addTimetable),
        addTimetable
    );

router.route('/:id')
    .get(
        verifyJWT([ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT]),
        validate(timetableValidation.getTimetableById),
        getTimetableById
    )
    .put(
        verifyJWT([ROLES.ADMIN]),
        validate(timetableValidation.updateTimetable),
        updateTimetable
    )
    .delete(
        verifyJWT([ROLES.ADMIN]),
        validate(timetableValidation.removeTimetable),
        removeTimetable
    );

export default router;
