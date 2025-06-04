import { Router } from 'express';
import { verifyAdminJWT, verifyStaffJWT, verifyStudentJWT } from "../middlewares/auth.middleware.js"

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



// ! routes for staff
router.route('/staff/get-divisions').get(verifyStaffJWT, getDivisions)
router.route('/staff/get-division-by-id').get(verifyStaffJWT, getDivisionById)


// ! routes for student
router.route('/student/get-divisions').get(verifyStudentJWT, getDivisions)
router.route('/student/get-division-by-id').get(verifyStudentJWT, getDivisionById)


export default router;