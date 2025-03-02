import { Router } from 'express';
import { verifyAdminJWT } from "../middlewares/auth.middleware.js"

import {
    getBranches,
    addBranch,
    updateBranch,
    removeBranch,
    getBranchById
} from '../controllers/branch.controller.js';

const router = Router();

router.route('/get-branches').get(verifyAdminJWT, getBranches) 
router.route('/add').post(verifyAdminJWT, addBranch);
router.route('/update').put(verifyAdminJWT, updateBranch)       
router.route('/remove').delete(verifyAdminJWT, removeBranch);   
router.route('/get-branch-by-id').get(verifyAdminJWT, getBranchById);

export default router;