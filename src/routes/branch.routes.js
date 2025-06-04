import { Router } from 'express';
import { verifyAdminJWT, verifyStaffJWT, verifyStudentJWT } from "../middlewares/auth.middleware.js"

import {
    getBranches,
    addBranch,
    updateBranch,
    removeBranch,
    getBranchById
} from '../controllers/branch.controller.js';

const router = Router();

// ! routes for admin
router.route('/admin/get-branches').get(verifyAdminJWT, getBranches) 
router.route('/admin/get-branch-by-id').get(verifyAdminJWT, getBranchById);
router.route('/admin/add').post(verifyAdminJWT, addBranch);
router.route('/admin/update').put(verifyAdminJWT, updateBranch)       
router.route('/admin/remove').delete(verifyAdminJWT, removeBranch);   

// ! routes for staff
router.route('/staff/get-branches').get(verifyStaffJWT, getBranches) 
router.route('/staff/get-branch-by-id').get(verifyStaffJWT, getBranchById);

// ! routes for student
router.route('/student/get-branches').get(verifyStudentJWT, getBranches) 
router.route('/student/get-branch-by-id').get(verifyStudentJWT, getBranchById);

export default router;