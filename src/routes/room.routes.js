import express from 'express';
import {
    addRoom,
    getRooms,
    getRoomById,
    updateRoom,
    removeRoom
} from '../controllers/room.controller.js';
import { verifyAdminJWT } from '../middlewares/auth.middleware.js';
const router = express.Router();

router.route('/add-room').post(verifyAdminJWT, addRoom);
router.route('/get-rooms').get(verifyAdminJWT, getRooms);
router.route('/get-room-by-id').get(verifyAdminJWT, getRoomById);
router.route('/update-room').put(verifyAdminJWT, updateRoom);
router.route('/remove-room').delete(verifyAdminJWT, removeRoom);

export default router;