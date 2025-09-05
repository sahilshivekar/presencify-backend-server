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
import validate from '../middlewares/validate.js';
import branchValidation from '../validators/branch.validation.js';

const router = Router();

// Basic CRUD operations
router.route('/')
    .get(
        verifyJWT([ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT]),
        validate(branchValidation.getBranches),
        getBranches
    )
    .post(
        verifyJWT([ROLES.ADMIN]),
        validate(branchValidation.addBranch),
        addBranch
    );

router.route('/:id')
    .get(
        verifyJWT([ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT]),
        validate(branchValidation.getBranchById),
        getBranchById
    )
    .put(
        verifyJWT([ROLES.ADMIN]),
        validate(branchValidation.updateBranch),
        updateBranch
    )
    .delete(
        verifyJWT([ROLES.ADMIN]),
        validate(branchValidation.removeBranch),
        removeBranch
    );

export default router;
