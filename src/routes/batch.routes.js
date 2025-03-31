import express from 'express';
import { verifyAdminJWT } from "../middlewares/auth.middleware.js"

import { getBatches, addBatch, updateBatch, removeBatch, getBatchById } from '../controllers/batch.controller.js';

const router = express.Router();

router.route('/get-batches').get(verifyAdminJWT, getBatches);
router.route('/add').post(verifyAdminJWT, addBatch);
router.route('/update').put(verifyAdminJWT, updateBatch);
router.route('/remove').delete(verifyAdminJWT, removeBatch);
router.route('/get-batch-by-id').get(verifyAdminJWT, getBatchById);
export default router;