import { Router } from 'express';
import { verifyAdminJWT } from "../middlewares/auth.middleware.js"
const router = Router();
import {
    getCourses,
    addCourse,
    updateCourse,
    removeCourse,
    addCourseToBranchWithSemesterNumber,
    removeCourseFromBranchWithSemesterNumber,
    getCourseById
} from '../controllers/course.controller.js';


//!  secured routes

router.route('/get-courses').get(verifyAdminJWT, getCourses) 
router.route('/add').post(verifyAdminJWT, addCourse);
router.route('/update').put(verifyAdminJWT, updateCourse)       
router.route('/remove').delete(verifyAdminJWT, removeCourse); 
router.route('/add-to-branch-with-semester-number').post(verifyAdminJWT, addCourseToBranchWithSemesterNumber);  
router.route('/remove-from-branch-with-semester-number').delete(verifyAdminJWT, removeCourseFromBranchWithSemesterNumber);
router.route('/get-course-by-id').get(verifyAdminJWT, getCourseById);

export default router;