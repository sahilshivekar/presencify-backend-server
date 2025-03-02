import { Router } from 'express';
import { verifyAdminJWT } from "../middlewares/auth.middleware.js"

import {
    getDivisions,
    addDivision,
    updateDivision,
    removeDivision,
    getDivisionById
} from '../controllers/division.controller.js';

const router = Router();

router.route('/get-divisions').get(verifyAdminJWT, getDivisions)

router.route('/add').post(verifyAdminJWT, addDivision)
router.route('/update').put(verifyAdminJWT, updateDivision)
router.route('/remove').delete(verifyAdminJWT, removeDivision)
router.route('/get-division-by-id').get(verifyAdminJWT, getDivisionById)

export default router;