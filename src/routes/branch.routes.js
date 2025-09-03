import { Router } from 'express';
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    getBranches,
    addBranch,
    updateBranch,
    removeBranch,
    getBranchById
} from '../controllers/branch.controller.js';
import { ROLES } from '../config/roles.js';

const router = Router();

// Basic CRUD operations
router.route('/')
    .get(verifyJWT([ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT]), getBranches)
    .post(verifyJWT([ROLES.ADMIN]), addBranch);

router.route('/:id')
    .get(verifyJWT([ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT]), getBranchById)
    .put(verifyJWT([ROLES.ADMIN]), updateBranch)
    .delete(verifyJWT([ROLES.ADMIN]), removeBranch);

export default router;
