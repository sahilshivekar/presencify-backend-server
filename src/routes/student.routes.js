import express from 'express';
import {
    getStudents,
    addStudent,
    updateStudentDetails,
    updateStudentPassword,
    updateStudentImage,
    removeStudentImage,
    removeStudent,
    addStudentToBranch,
    removeStudentFromBranch,
    getStudentDetailsById,
    addStudentToSemester,
    removeStudentFromSemester,
    addStudentToDivision,
    changeStudentDivision,
    addStudentToBatch,
    changeStudentBatch,
    getStudentBranchesById,
    getStudentSemestersById,
    getStudentDivisionsById,    
    getStudentBatchesById
} from '../controllers/student.controller.js';
import { verifyAdminJWT } from '../middlewares/auth.middleware.js';
import { upload } from '../middlewares/multer.middleware.js';

const router = express.Router();

router.route('/get-students').get(verifyAdminJWT, getStudents)

router.route('/add').post(verifyAdminJWT, upload.single('studentImageFile'), addStudent)

router.route('/update-details').put(verifyAdminJWT, updateStudentDetails)

router.route('/update-password').put(verifyAdminJWT, updateStudentPassword)

router.route('/update-image').put(verifyAdminJWT, upload.single('studentImageFile'), updateStudentImage)

router.route('/remove-image').delete(verifyAdminJWT, removeStudentImage)

router.route('/remove').delete(verifyAdminJWT, removeStudent)

router.route('/get-student-details-by-id').get(verifyAdminJWT, getStudentDetailsById)

router.route('/add-to-branch').post(verifyAdminJWT, addStudentToBranch)

router.route('/remove-from-branch').delete(verifyAdminJWT, removeStudentFromBranch)

router.route('/add-to-semester').post(verifyAdminJWT, addStudentToSemester)

router.route('/remove-from-semester').delete(verifyAdminJWT, removeStudentFromSemester)

router.route('/add-to-division').post(verifyAdminJWT, addStudentToDivision)

router.route('/change-division').put(verifyAdminJWT, changeStudentDivision)

router.route('/add-to-batch').post(verifyAdminJWT, addStudentToBatch)

router.route('/change-batch').put(verifyAdminJWT, changeStudentBatch)
    
router.route('/get-student-branches-by-id').get(verifyAdminJWT, getStudentBranchesById)

router.route('/get-student-semesters-by-id').get(verifyAdminJWT, getStudentSemestersById)

router.route('/get-student-divisions-by-id').get(verifyAdminJWT, getStudentDivisionsById)

router.route('/get-student-batches-by-id').get(verifyAdminJWT, getStudentBatchesById)

export default router;
