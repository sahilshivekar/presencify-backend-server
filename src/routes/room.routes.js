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

const router = express.Router();

// Basic CRUD operations
router.route('/')
    .get(verifyJWT([ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT]), getRooms)
    .post(verifyJWT([ROLES.ADMIN]), addRoom);

router.route('/:id')
    .get(verifyJWT([ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT]), getRoomById)
    .put(verifyJWT([ROLES.ADMIN]), updateRoom)
    .delete(verifyJWT([ROLES.ADMIN]), removeRoom);

export default router;
