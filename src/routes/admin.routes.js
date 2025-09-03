import { Router } from 'express';
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    addAdmin,
    updateAdminDetails,
    removeAdmin,
    getAdmins,
    getAdminDetails
} from '../controllers/admin.controller.js';
import { ROLES } from '../config/roles.js';

const router = Router();

// Secured routes (admin authentication required)
router.route('/me')
    .get(verifyJWT([ROLES.ADMIN]), getAdminDetails)
    .put(verifyJWT([ROLES.ADMIN]), updateAdminDetails)
    .delete(verifyJWT([ROLES.ADMIN]), removeAdmin)

router.route('/')
    .get(verifyJWT([ROLES.ADMIN]), getAdmins)
    .post(verifyJWT([ROLES.ADMIN]), addAdmin);


export default router;
