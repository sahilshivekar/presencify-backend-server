import { Router } from 'express';
import { verifyAdminJWT } from "../middlewares/auth.middleware.js"
const router = Router();
import {
    getSchemes,
    addScheme,
    updateScheme,
    removeScheme,
} from '../controllers/scheme.controller.js';


//!  secured routes

router.route('/get-schemes').get(verifyAdminJWT, getSchemes) 
router.route('/add').post(verifyAdminJWT, addScheme);
router.route('/update').put(verifyAdminJWT, updateScheme)       
router.route('/remove').delete(verifyAdminJWT, removeScheme);   

export default router;