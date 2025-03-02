import { Router } from 'express';
import { verifyAdminJWT } from "../middlewares/auth.middleware.js"
const router = Router();
import {
    getSchemes,
    addScheme,
    updateScheme,
    removeScheme,
    getSchemeById
} from '../controllers/scheme.controller.js';


//!  secured routes

router.route('/get-schemes').get(verifyAdminJWT, getSchemes) 
router.route('/add').post(verifyAdminJWT, addScheme);
router.route('/update').put(verifyAdminJWT, updateScheme)       
router.route('/remove').delete(verifyAdminJWT, removeScheme);   
router.route('/get-scheme-by-id').get(verifyAdminJWT, getSchemeById);

export default router;