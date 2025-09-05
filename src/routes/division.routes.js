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
import validate from '../middlewares/validate.js';
import divisionValidation from '../validators/division.validation.js';

const router = Router();

// Basic CRUD operations
router.route('/')
    .get(
        verifyJWT([ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT]),
        validate(divisionValidation.getDivisions),
        getDivisions
    )
    .post(
        verifyJWT([ROLES.ADMIN]),
        validate(divisionValidation.addDivision),
        addDivision
    );

router.route('/:id')
    .get(
        verifyJWT([ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT]),
        validate(divisionValidation.getDivisionById),
        getDivisionById
    )
    .put(
        verifyJWT([ROLES.ADMIN]),
        validate(divisionValidation.updateDivision),
        updateDivision
    )
    .delete(
        verifyJWT([ROLES.ADMIN]),
        validate(divisionValidation.removeDivision),
        removeDivision
    );

export default router;
