import express from 'express';
import { verifyAdminJWT, verifyStaffJWT, verifyStudentJWT } from "../middlewares/auth.middleware.js"

import { getBatches, addBatch, updateBatch, removeBatch, getBatchById } from '../controllers/batch.controller.js';

const router = express.Router();


// ! routes for admin
router.route('/admin/get-batches').get(verifyAdminJWT, getBatches);
router.route('/admin/add').post(verifyAdminJWT, addBatch);
router.route('/admin/update').put(verifyAdminJWT, updateBatch);
router.route('/admin/remove').delete(verifyAdminJWT, removeBatch);
router.route('/admin/get-batch-by-id').get(verifyAdminJWT, getBatchById);


// ! routes for staff
router.route('/staff/get-batches').get(verifyStaffJWT, getBatches);
router.route('/staff/get-batch-by-id').get(verifyStaffJWT, getBatchById);

// ! routes for student
router.route('/student/get-batches').get(verifyStudentJWT, getBatches);
router.route('/student/get-batch-by-id').get(verifyStudentJWT, getBatchById);


export default router;