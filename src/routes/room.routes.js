import express from 'express';
import {
    addRoom,
    getRooms,
    getRoomById,
    updateRoom,
    removeRoom
} from '../controllers/room.controller.js';
import { verifyAdminJWT, verifyStaffJWT, verifyStudentJWT } from '../middlewares/auth.middleware.js';
const router = express.Router();

// ! routes for admin
router.route('/admin/get-rooms').get(verifyAdminJWT, getRooms);
router.route('/admin/get-room-by-id').get(verifyAdminJWT, getRoomById);
router.route('/admin/add-room').post(verifyAdminJWT, addRoom);
router.route('/admin/update-room').put(verifyAdminJWT, updateRoom);
router.route('/admin/remove-room').delete(verifyAdminJWT, removeRoom);

// ! routes for staff
router.route('/staff/get-rooms').get(verifyStaffJWT, getRooms);
router.route('/staff/get-room-by-id').get(verifyStaffJWT, getRoomById);


// ! routes for student
router.route('/student/get-rooms').get(verifyStudentJWT, getRooms);
router.route('/student/get-room-by-id').get(verifyStudentJWT, getRoomById);


export default router;