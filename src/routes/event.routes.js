import express from 'express';
import { upload } from '../middlewares/multer.middleware.js';
import { verifyAdminJWT } from '../middlewares/auth.middleware.js';
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

router.route('/get-events').get(verifyAdminJWT, getEvents);

router.route('/get-event-by-id').get(verifyAdminJWT, getEventById);

router.route('/add-event').post(verifyAdminJWT, upload.single('eventImageFile'), addEvent);

router.route('/update-event').put(verifyAdminJWT, upload.single('eventImageFile'), updateEvent);

router.route('/delete-event').delete(verifyAdminJWT, deleteEvent);

// Error handling middleware for the file limit exceed.
router.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            res.status(413).json(new ApiResponse(413, 'The uploaded image is too large. Please limit the file size to 10 MB.'))
        }
    }
});
export default router;