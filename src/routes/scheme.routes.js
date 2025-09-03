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

const router = Router();

// Basic CRUD operations
router.route('/')
    .get(verifyJWT([ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT]), getSchemes)
    .post(verifyJWT([ROLES.ADMIN]), addScheme);

router.route('/:id')
    .get(verifyJWT([ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT]), getSchemeById)
    .put(verifyJWT([ROLES.ADMIN]), updateScheme)
    .delete(verifyJWT([ROLES.ADMIN]), removeScheme);

export default router;
