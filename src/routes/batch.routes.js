import express from 'express';
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { getBatches, addBatch, updateBatch, removeBatch, getBatchById } from '../controllers/batch.controller.js';
import { ROLES } from '../config/roles.js';
import validate from '../middlewares/validate.js';
import batchValidation from '../validators/batch.validation.js';

const router = express.Router();

// Basic CRUD operations
router.route('/')
    .get(
        verifyJWT([ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT]),
        validate(batchValidation.getBatches),
        getBatches
    )
    .post(
        verifyJWT([ROLES.ADMIN]),
        validate(batchValidation.addBatch),
        addBatch
    );

router.route('/:id')
    .get(
        verifyJWT([ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT]),
        validate(batchValidation.getBatchById),
        getBatchById
    )
    .put(
        verifyJWT([ROLES.ADMIN]),
        validate(batchValidation.updateBatch),
        updateBatch
    )
    .delete(
        verifyJWT([ROLES.ADMIN]),
        validate(batchValidation.removeBatch),
        removeBatch
    );

export default router;
