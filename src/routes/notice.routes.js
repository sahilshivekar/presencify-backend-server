import express from 'express';
import { upload } from '../middlewares/multer.middleware.js';
import {
    getNotices,
    getNoticeById,
    addNotice,
    updateNotice,
    deleteNotice
} from '../controllers/notice.controller.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import multer from 'multer';
import { verifyAdminJWT } from '../middlewares/auth.middleware.js';


const router = express.Router();

router.route('/get-notices').get(verifyAdminJWT, getNotices);

router.route('/get-notice-by-id').get(verifyAdminJWT, getNoticeById);

router.route('/add-notice').post(verifyAdminJWT, upload.single('noticeImageFile'), addNotice);

router.route('/update-notice').put(verifyAdminJWT, upload.single('noticeImageFile'), updateNotice);

router.route('/delete-notice').delete(verifyAdminJWT, deleteNotice);

// Error handling middleware for the file limit exceed.
router.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            res.status(413).json(new ApiResponse(413, 'The uploaded image is too large. Please limit the file size to 10 MB.'))
        }
    }
});

export default router;