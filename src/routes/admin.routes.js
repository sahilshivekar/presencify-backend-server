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
import validate from '../middlewares/validate.js';
import adminValidation from '../validators/admin.validation.js';

const router = Router();

// Secured routes (admin authentication required)
router.route('/me')
    .get(verifyJWT([ROLES.ADMIN]), getAdminDetails)
    .put(verifyJWT([ROLES.ADMIN]), validate(adminValidation.updateAdminDetails), updateAdminDetails)
    .delete(verifyJWT([ROLES.ADMIN]), removeAdmin)

router.route('/')
    .get(verifyJWT([ROLES.ADMIN]), validate(adminValidation.getAdmins), getAdmins)
    .post(verifyJWT([ROLES.ADMIN]), validate(adminValidation.addAdmin), addAdmin);


export default router;
