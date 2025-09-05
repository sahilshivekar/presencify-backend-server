import { Router } from 'express';
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    getUniversities,
    addUniversity,
    updateUniversity,
    removeUniversity,
    getUniversityById
} from '../controllers/university.controller.js';
import { ROLES } from '../config/roles.js';
import validate from '../middlewares/validate.js';
import universityValidation from '../validators/university.validation.js';

const router = Router();

// Basic CRUD operations
router.route('/')
    .get(
        verifyJWT([ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT]),
        getUniversities
    )
    .post(
        verifyJWT([ROLES.ADMIN]),
        validate(universityValidation.addUniversity),
        addUniversity
    );

router.route('/:id')
    .get(
        verifyJWT([ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT]),
        validate(universityValidation.getUniversityById),
        getUniversityById
    )
    .put(
        verifyJWT([ROLES.ADMIN]),
        validate(universityValidation.updateUniversity),
        updateUniversity
    )
    .delete(
        verifyJWT([ROLES.ADMIN]),
        validate(universityValidation.removeUniversity),
        removeUniversity
    );

export default router;
