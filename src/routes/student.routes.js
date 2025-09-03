import express from 'express';
import {
    getStudents,
    addStudent,
    updateStudentDetails,
    updateStudentPassword,
    updateStudentImage,
    removeStudentImage,
    removeStudent,
    getStudentDetailsById,
    addStudentToSemester,
    removeStudentFromSemester,
    addStudentToDivision,
    changeStudentDivision,
    addStudentToBatch,
    changeStudentBatch,
    getStudentSemestersById,
    getStudentDivisionsById,    
    getStudentBatchesById
} from '../controllers/student.controller.js';
import { verifyAdminJWT, verifyTeacherJWT, verifyStudentJWT } from '../middlewares/auth.middleware.js';
import { upload } from '../middlewares/multer.middleware.js';
const router = express.Router();

// ! routes for admin
router.route('/admin/get-students').get(verifyAdminJWT, getStudents)
router.route('/admin/get-student-details-by-id').get(verifyAdminJWT, getStudentDetailsById)
router.route('/admin/update-details').put(verifyAdminJWT, updateStudentDetails)
router.route('/admin/update-image').put(verifyAdminJWT, upload.single('studentImageFile'), updateStudentImage)
router.route('/admin/remove-image').delete(verifyAdminJWT, removeStudentImage)
router.route('/admin/get-student-semesters-by-id').get(verifyAdminJWT, getStudentSemestersById)
router.route('/admin/get-student-divisions-by-id').get(verifyAdminJWT, getStudentDivisionsById)
router.route('/admin/get-student-batches-by-id').get(verifyAdminJWT, getStudentBatchesById)
router.route('/admin/update-password').put(verifyAdminJWT, updateStudentPassword)
router.route('/admin/remove').delete(verifyAdminJWT, removeStudent)
router.route('/admin/add-to-semester').post(verifyAdminJWT, addStudentToSemester)
router.route('/admin/remove-from-semester').delete(verifyAdminJWT, removeStudentFromSemester)
router.route('/admin/add-to-division').post(verifyAdminJWT, addStudentToDivision)
router.route('/admin/change-division').put(verifyAdminJWT, changeStudentDivision)
router.route('/admin/add-to-batch').post(verifyAdminJWT, addStudentToBatch)
router.route('/admin/change-batch').put(verifyAdminJWT, changeStudentBatch)
router.route('/admin/add').post(verifyAdminJWT, upload.single('studentImageFile'), addStudent)

// ! routes for teacher
router.route('/teacher/get-students').get(verifyTeacherJWT, getStudents)
router.route('/teacher/get-student-details-by-id').get(verifyTeacherJWT, getStudentDetailsById)
router.route('/teacher/get-student-semesters-by-id').get(verifyTeacherJWT, getStudentSemestersById)
router.route('/teacher/get-student-divisions-by-id').get(verifyTeacherJWT, getStudentDivisionsById)
router.route('/teacher/get-student-batches-by-id').get(verifyTeacherJWT, getStudentBatchesById)


// ! routes for student
router.route('/student/get-students').get(verifyStudentJWT, getStudents)
router.route('/student/get-student-details-by-id').get(verifyStudentJWT, getStudentDetailsById)
router.route('/student/update-details').put(verifyStudentJWT, updateStudentDetails)
router.route('/student/update-image').put(verifyStudentJWT, upload.single('studentImageFile'), updateStudentImage)
router.route('/student/remove-image').delete(verifyStudentJWT, removeStudentImage)
router.route('/student/get-student-semesters-by-id').get(verifyStudentJWT, getStudentSemestersById)
router.route('/student/get-student-divisions-by-id').get(verifyStudentJWT, getStudentDivisionsById)
router.route('/student/get-student-batches-by-id').get(verifyStudentJWT, getStudentBatchesById)



export default router;
