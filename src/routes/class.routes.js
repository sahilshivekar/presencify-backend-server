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
import validate from '../middlewares/validate.js';
import classValidation from '../validators/class.validation.js';

const router = express.Router();

// Basic CRUD operations
router.route('/')
    .get(
        validate(classValidation.getClasses),
        verifyJWT([ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT]),
        getClasses
    )
    .post(
        validate(classValidation.addClass),
        verifyJWT([ROLES.ADMIN]),
        addClass
    );

// Cancelled class operations (place before '/:id' to avoid route conflicts)
router.route('/cancelled')
    .get(
        validate(classValidation.getCancelledClasses),
        verifyJWT([ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT]),
        getCancelledClasses
    )
    .post(
        validate(classValidation.cancelClass),
        verifyJWT([ROLES.ADMIN, ROLES.TEACHER]),
        cancelClass
    );

router.route('/:id')
    .get(
        validate(classValidation.getClassById),
        verifyJWT([ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT]),
        getClassById
    )
    .put(
        validate(classValidation.extendActiveTillDateOfClass),
        verifyJWT([ROLES.ADMIN]),
        extendActiveTillDateOfClass
    )
    .delete(
        validate(classValidation.removeClass),
        verifyJWT([ROLES.ADMIN]),
        removeClass
    );

// Extra class operations
router.route('/extra')
    .post(
        validate(classValidation.addExtraClass),
        verifyJWT([ROLES.ADMIN, ROLES.TEACHER]),
        addExtraClass
    );

export default router;
