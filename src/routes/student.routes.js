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
import { verifyJWT } from '../middlewares/auth.middleware.js';
import { ROLES } from '../config/roles.js';
import { upload } from '../middlewares/multer.middleware.js';

const router = express.Router();

// Basic CRUD operations
router.route('/')
    .get(verifyJWT([ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT]), getStudents)
    .post(verifyJWT([ROLES.ADMIN]), upload.single('studentImageFile'), addStudent)
    

router.route('/:id')
    .get(verifyJWT([ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT]), getStudentDetailsById)
    .put(verifyJWT([ROLES.ADMIN, ROLES.STUDENT]), updateStudentDetails)
    .delete(verifyJWT([ROLES.ADMIN]), removeStudent);

// Student profile image management
router.route('/image')
    .put(verifyJWT([ROLES.ADMIN, ROLES.STUDENT]), upload.single('studentImageFile'), updateStudentImage)
    .delete(verifyJWT([ROLES.ADMIN, ROLES.STUDENT]), removeStudentImage);

// Password management (admin only)
router.route('/password')
    .put(verifyJWT([ROLES.ADMIN]), updateStudentPassword);

// Student relationship queries
router.route('/:id/semesters')
    .get(verifyJWT([ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT]), getStudentSemestersById);

router.route('/:id/divisions')
    .get(verifyJWT([ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT]), getStudentDivisionsById);

router.route('/:id/batches')
    .get(verifyJWT([ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT]), getStudentBatchesById);

// Semester management (admin only)
router.route('/semester')
    .post(verifyJWT([ROLES.ADMIN]), addStudentToSemester)
    .delete(verifyJWT([ROLES.ADMIN]), removeStudentFromSemester);

// Division management (admin only)
router.route('/division')
    .post(verifyJWT([ROLES.ADMIN]), addStudentToDivision)
    .put(verifyJWT([ROLES.ADMIN]), changeStudentDivision);

// Batch management (admin only)
router.route('/batch')
    .post(verifyJWT([ROLES.ADMIN]), addStudentToBatch)
    .put(verifyJWT([ROLES.ADMIN]), changeStudentBatch);

export default router;
