import express from 'express';
import { getBatches, addBatch, updateBatch, removeBatch, getBatchById } from '../controllers/batch.controller.js';

const router = express.Router();

router.route('/get-batches').get(getBatches);
router.route('/add').post(addBatch);
router.route('/update').put(updateBatch);
router.route('/remove').delete(removeBatch);
router.route('/get-batch-by-id').get(getBatchById);
export default router;