import express from 'express';
import { upload } from '../middlewares/multer.middleware.js';
import { verifyAdminJWT, verifyStaffJWT, verifyStudentJWT } from '../middlewares/auth.middleware.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import {
    getEvents,
    getEventById,
    addEvent,
    updateEvent,
    deleteEvent
} from '../controllers/event.controller.js';
import multer from 'multer';
const router = express.Router();

// ! routes for admin
router.route('/admin/get-events').get(verifyAdminJWT, getEvents);
router.route('/admin/get-event-by-id').get(verifyAdminJWT, getEventById);
router.route('/admin/add-event').post(verifyAdminJWT, upload.single('eventImageFile'), addEvent);
router.route('/admin/update-event').put(verifyAdminJWT, upload.single('eventImageFile'), updateEvent);
router.route('/admin/delete-event').delete(verifyAdminJWT, deleteEvent);
router.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            res.status(413).json(new ApiResponse(413, 'The uploaded image is too large. Please limit the file size to 10 MB.'))
        }
    }
});



// ! routes for staff
router.route('/staff/get-events').get(verifyStaffJWT, getEvents);
router.route('/staff/get-event-by-id').get(verifyStaffJWT, getEventById);


// ! routes for student
router.route('/student/get-events').get(verifyStudentJWT, getEvents);
router.route('/student/get-event-by-id').get(verifyStudentJWT, getEventById);


export default router;