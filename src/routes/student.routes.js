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
import validate from '../middlewares/validate.js';
import studentValidation from '../validators/student.validation.js';

const router = express.Router();

// Basic CRUD operations
router.route('/')
    .get(
        verifyJWT([ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT]),
        validate(studentValidation.getStudents),
        getStudents
    )
    .post(
        verifyJWT([ROLES.ADMIN]),
        upload.single('studentImageFile'),
        validate(studentValidation.addStudent),
        addStudent
    )
    

router.route('/:id')
    .get(
        verifyJWT([ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT]),
        validate(studentValidation.getStudentDetailsById),
        getStudentDetailsById
    )
    .put(
        verifyJWT([ROLES.ADMIN, ROLES.STUDENT]),
        validate(studentValidation.updateStudentDetails),
        updateStudentDetails
    )
    .delete(
        verifyJWT([ROLES.ADMIN]),
        validate(studentValidation.removeStudent),
        removeStudent
    );

// Student profile image management
router.route('/image')
    .put(
        verifyJWT([ROLES.ADMIN, ROLES.STUDENT]),
        upload.single('studentImageFile'),
        validate(studentValidation.updateStudentImage),
        updateStudentImage
    )
    .delete(
        verifyJWT([ROLES.ADMIN, ROLES.STUDENT]),
        validate(studentValidation.removeStudentImage),
        removeStudentImage
    );

// Password management (admin only)
router.route('/password')
    .put(verifyJWT([ROLES.ADMIN]), validate(studentValidation.updateStudentPassword), updateStudentPassword);

// Student relationship queries
router.route('/:id/semesters')
    .get(
        verifyJWT([ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT]),
        validate(studentValidation.getStudentSemestersById),
        getStudentSemestersById
    );

router.route('/:id/divisions')
    .get(
        verifyJWT([ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT]),
        validate(studentValidation.getStudentDivisionsById),
        getStudentDivisionsById
    );

router.route('/:id/batches')
    .get(
        verifyJWT([ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT]),
        validate(studentValidation.getStudentBatchesById),
        getStudentBatchesById
    );

// Semester management (admin only)
router.route('/semester')
    .post(verifyJWT([ROLES.ADMIN]), validate(studentValidation.addStudentToSemester), addStudentToSemester)
    .delete(verifyJWT([ROLES.ADMIN]), validate(studentValidation.removeStudentFromSemester), removeStudentFromSemester);

// Division management (admin only)
router.route('/division')
    .post(verifyJWT([ROLES.ADMIN]), validate(studentValidation.addStudentToDivision), addStudentToDivision)
    .put(verifyJWT([ROLES.ADMIN]), validate(studentValidation.changeStudentDivision), changeStudentDivision);

// Batch management (admin only)
router.route('/batch')
    .post(verifyJWT([ROLES.ADMIN]), validate(studentValidation.addStudentToBatch), addStudentToBatch)
    .put(verifyJWT([ROLES.ADMIN]), validate(studentValidation.changeStudentBatch), changeStudentBatch);

export default router;
