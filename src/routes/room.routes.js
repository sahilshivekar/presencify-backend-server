import express from 'express';
import {
    addRoom,
    getRooms,
    getRoomById,
    updateRoom,
    removeRoom
} from '../controllers/room.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import { ROLES } from '../config/roles.js';
import validate from '../middlewares/validate.js';
import roomValidation from '../validators/room.validation.js';

const router = express.Router();

// Basic CRUD operations
router.route('/')
    .get(
        verifyJWT([ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT]),
        validate(roomValidation.getRooms),
        getRooms
    )
    .post(
        verifyJWT([ROLES.ADMIN]),
        validate(roomValidation.addRoom),
        addRoom
    );

router.route('/:id')
    .get(
        verifyJWT([ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT]),
        validate(roomValidation.getRoomById),
        getRoomById
    )
    .put(
        verifyJWT([ROLES.ADMIN]),
        validate(roomValidation.updateRoom),
        updateRoom
    )
    .delete(
        verifyJWT([ROLES.ADMIN]),
        validate(roomValidation.removeRoom),
        removeRoom
    );

export default router;
