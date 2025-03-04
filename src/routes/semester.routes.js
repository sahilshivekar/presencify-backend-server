import express from 'express';
import { 
    getSemesters,
    addSemester,
    updateSemester,
    removeSemester,
    getCoursesOfSemester,
    getSemesterById
} from '../controllers/semester.controller.js';
import { verifyAdminJWT } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.route('/get-semesters').get(verifyAdminJWT,getSemesters);

router.route('/add').post(verifyAdminJWT, addSemester);

router.route('/update').put(verifyAdminJWT, updateSemester);

router.route('/remove').delete(verifyAdminJWT, removeSemester);

router.route('/get-courses-of-semester').get(verifyAdminJWT, getCoursesOfSemester);

router.route('/get-semester-by-id').get(verifyAdminJWT, getSemesterById);
export default router;