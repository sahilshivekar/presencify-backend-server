import { Router } from 'express';
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    getSchemes,
    addScheme,
    updateScheme,
    removeScheme,
    getSchemeById
} from '../controllers/scheme.controller.js';
import { ROLES } from '../config/roles.js';
import validate from '../middlewares/validate.js';
import schemeValidation from '../validators/scheme.validation.js';

const router = Router();

// Basic CRUD operations
router.route('/')
    .get(
        verifyJWT([ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT]),
        validate(schemeValidation.getSchemes),
        getSchemes
    )
    .post(
        verifyJWT([ROLES.ADMIN]),
        validate(schemeValidation.addScheme),
        addScheme
    );

router.route('/:id')
    .get(
        verifyJWT([ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT]),
        validate(schemeValidation.getSchemeById),
        getSchemeById
    )
    .put(
        verifyJWT([ROLES.ADMIN]),
        validate(schemeValidation.updateScheme),
        updateScheme
    )
    .delete(
        verifyJWT([ROLES.ADMIN]),
        validate(schemeValidation.removeScheme),
        removeScheme
    );

export default router;
