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
import { verifyAdminJWT, verifyTeacherJWT, verifyStudentJWT } from '../middlewares/auth.middleware.js';


const router = express.Router();

// ! routes for admin
router.route('/admin/get-notices').get(verifyAdminJWT, getNotices);
router.route('/admin/get-notice-by-id').get(verifyAdminJWT, getNoticeById);
router.route('/admin/add-notice').post(verifyAdminJWT, upload.single('noticeImageFile'), addNotice);
router.route('/admin/update-notice').put(verifyAdminJWT, upload.single('noticeImageFile'), updateNotice);
router.route('/admin/delete-notice').delete(verifyAdminJWT, deleteNotice);
router.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            res.status(413).json(new ApiResponse(413, 'The uploaded image is too large. Please limit the file size to 10 MB.'))
        }
    }
});


// ! routes for teacher
router.route('/teacher/get-notices').get(verifyTeacherJWT, getNotices);
router.route('/teacher/get-notice-by-id').get(verifyTeacherJWT, getNoticeById);



// ! routes for student
router.route('/student/get-notices').get(verifyStudentJWT, getNotices);
router.route('/student/get-notice-by-id').get(verifyStudentJWT, getNoticeById);



export default router;