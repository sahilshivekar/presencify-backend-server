import express from 'express';
import {
    addClass,
    getClasses,
    getClassById,
    extendActiveTillDateOfClass,
    removeClass
} from '../controllers/class.controller.js';
import { verifyAdminJWT } from '../middlewares/auth.middleware.js';
const router = express.Router();

router.route('/add-class').post(verifyAdminJWT, addClass);
router.route('/get-classes').get(verifyAdminJWT, getClasses);
router.route('/get-class-by-id').get(verifyAdminJWT, getClassById);
router.route('/extend-acitve-till-date-of-class').put(verifyAdminJWT, extendActiveTillDateOfClass);
router.route('/remove-class').delete(verifyAdminJWT, removeClass);  

export default router;