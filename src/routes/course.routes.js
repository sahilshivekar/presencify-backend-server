import { Router } from 'express';
import { verifyAdminJWT, verifyStaffJWT, verifyStudentJWT } from "../middlewares/auth.middleware.js"
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

// ! routes for admin
router.route('/admin/get-courses').get(verifyAdminJWT, getCourses) 
router.route('/admin/get-course-by-id').get(verifyAdminJWT, getCourseById);
router.route('/admin/add').post(verifyAdminJWT, addCourse);
router.route('/admin/update').put(verifyAdminJWT, updateCourse)       
router.route('/admin/remove').delete(verifyAdminJWT, removeCourse); 
router.route('/admin/add-to-branch-with-semester-number').post(verifyAdminJWT, addCourseToBranchWithSemesterNumber);  
router.route('/admin/remove-from-branch-with-semester-number').delete(verifyAdminJWT, removeCourseFromBranchWithSemesterNumber);



// ! routes for staff
router.route('/staff/get-courses').get(verifyStaffJWT, getCourses) 
router.route('/staff/get-course-by-id').get(verifyStaffJWT, getCourseById);



// ! routes for student
router.route('/student/get-courses').get(verifyStudentJWT, getCourses) 
router.route('/student/get-course-by-id').get(verifyStudentJWT, getCourseById);
export default router;