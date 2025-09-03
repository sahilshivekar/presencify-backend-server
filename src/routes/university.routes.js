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

const router = Router();

// Basic CRUD operations
router.route('/')
    .get(verifyJWT([ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT]), getUniversities)
    .post(verifyJWT([ROLES.ADMIN]), addUniversity);

router.route('/:id')
    .get(verifyJWT([ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT]), getUniversityById)
    .put(verifyJWT([ROLES.ADMIN]), updateUniversity)
    .delete(verifyJWT([ROLES.ADMIN]), removeUniversity);

export default router;
