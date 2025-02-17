import { Router } from 'express';
import { verifyAdminJWT } from "../middlewares/auth.middleware.js"
const router = Router();
import {
    getUniversities,
    addUniversity,
    updateUniversity,
    removeUniversity,
} from '../controllers/university.controller.js';


//!  secured routes

router.route('/get-universities').get(verifyAdminJWT, getUniversities) 
router.route('/add').post(verifyAdminJWT, addUniversity);
router.route('/update').put(verifyAdminJWT, updateUniversity)       
router.route('/remove').delete(verifyAdminJWT, removeUniversity);

export default router;
