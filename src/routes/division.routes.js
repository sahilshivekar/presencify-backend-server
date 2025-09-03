import { Router } from 'express';
import { verifyAdminJWT, verifyTeacherJWT, verifyStudentJWT } from "../middlewares/auth.middleware.js"

import {
    getDivisions,
    addDivision,
    updateDivision,
    removeDivision,
    getDivisionById
} from '../controllers/division.controller.js';

const router = Router();


// ! routes for admin
router.route('/admin/get-divisions').get(verifyAdminJWT, getDivisions)
router.route('/admin/get-division-by-id').get(verifyAdminJWT, getDivisionById)
router.route('/admin/add').post(verifyAdminJWT, addDivision)
router.route('/admin/update').put(verifyAdminJWT, updateDivision)
router.route('/admin/remove').delete(verifyAdminJWT, removeDivision)



// ! routes for teacher
router.route('/teacher/get-divisions').get(verifyTeacherJWT, getDivisions)
router.route('/teacher/get-division-by-id').get(verifyTeacherJWT, getDivisionById)


// ! routes for student
router.route('/student/get-divisions').get(verifyStudentJWT, getDivisions)
router.route('/student/get-division-by-id').get(verifyStudentJWT, getDivisionById)


export default router;