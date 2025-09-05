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
        verifyJWT([ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT]),
        validate(classValidation.getClasses),
        getClasses
    )
    .post(
        verifyJWT([ROLES.ADMIN]),
        validate(classValidation.addClass),
        addClass
    );

router.route('/:id')
    .get(
        verifyJWT([ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT]),
        validate(classValidation.getClassById),
        getClassById
    )
    .put(
        verifyJWT([ROLES.ADMIN]),
        validate(classValidation.extendActiveTillDateOfClass),
        extendActiveTillDateOfClass
    )
    .delete(
        verifyJWT([ROLES.ADMIN]),
        validate(classValidation.removeClass),
        removeClass
    );

// Extra class operations
router.route('/extra')
    .post(
        verifyJWT([ROLES.ADMIN, ROLES.TEACHER]),
        validate(classValidation.addExtraClass),
        addExtraClass
    );

// Cancelled class operations
router.route('/cancelled')
    .get(
        verifyJWT([ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT]),
        validate(classValidation.getCancelledClasses),
        getCancelledClasses
    )
    .post(
        verifyJWT([ROLES.ADMIN, ROLES.TEACHER]),
        validate(classValidation.cancelClass),
        cancelClass
    );

export default router;
