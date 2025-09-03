import { Router } from 'express';
import { verifyAdminJWT, verifyTeacherJWT, verifyStudentJWT } from "../middlewares/auth.middleware.js"
const router = Router();
import {
    getSchemes,
    addScheme,
    updateScheme,
    removeScheme,
    getSchemeById
} from '../controllers/scheme.controller.js';


//!  secured routes

// ! routes for admin
router.route('/admin/get-schemes').get(verifyAdminJWT, getSchemes) 
router.route('/admin/get-scheme-by-id').get(verifyAdminJWT, getSchemeById);
router.route('/admin/add').post(verifyAdminJWT, addScheme);
router.route('/admin/update').put(verifyAdminJWT, updateScheme)       
router.route('/admin/remove').delete(verifyAdminJWT, removeScheme);   

// ! routes for teacher
router.route('/teacher/get-schemes').get(verifyTeacherJWT, getSchemes) 
router.route('/teacher/get-scheme-by-id').get(verifyTeacherJWT, getSchemeById);


// ! routes for student
router.route('/student/get-schemes').get(verifyStudentJWT, getSchemes) 
router.route('/student/get-scheme-by-id').get(verifyStudentJWT, getSchemeById);


export default router;