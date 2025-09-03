import { Router } from 'express';
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    getDivisions,
    addDivision,
    updateDivision,
    removeDivision,
    getDivisionById
} from '../controllers/division.controller.js';
import { ROLES } from '../config/roles.js';

const router = Router();

// Basic CRUD operations
router.route('/')
    .get(verifyJWT([ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT]), getDivisions)
    .post(verifyJWT([ROLES.ADMIN]), addDivision);

router.route('/:id')
    .get(verifyJWT([ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT]), getDivisionById)
    .put(verifyJWT([ROLES.ADMIN]), updateDivision)
    .delete(verifyJWT([ROLES.ADMIN]), removeDivision);

export default router;
