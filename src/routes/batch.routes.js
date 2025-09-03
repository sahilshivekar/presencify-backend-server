import express from 'express';
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { getBatches, addBatch, updateBatch, removeBatch, getBatchById } from '../controllers/batch.controller.js';
import { ROLES } from '../config/roles.js';

const router = express.Router();

// Basic CRUD operations
router.route('/')
    .get(verifyJWT([ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT]), getBatches)
    .post(verifyJWT([ROLES.ADMIN]), addBatch);

router.route('/:id')
    .get(verifyJWT([ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT]), getBatchById)
    .put(verifyJWT([ROLES.ADMIN]), updateBatch)
    .delete(verifyJWT([ROLES.ADMIN]), removeBatch);

export default router;
