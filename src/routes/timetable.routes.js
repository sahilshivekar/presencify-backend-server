import express from 'express';
import {
    getTimetables,
    getTimetableById,
    addTimetable,
    updateTimetable,
    removeTimetable
} from '../controllers/timetable.controller.js';
import { verifyAdminJWT } from '../middlewares/auth.middleware.js';
const router = express.Router();

router.route('/get-timetables').get(verifyAdminJWT, getTimetables);
router.route('/get-timetable-by-id').get(verifyAdminJWT, getTimetableById);
router.route('/add-timetable').post(verifyAdminJWT, addTimetable);
router.route('/update-timetable').put(verifyAdminJWT, updateTimetable);
router.route('/remove-timetable').delete(verifyAdminJWT, removeTimetable);

export default router;