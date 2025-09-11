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
        validate(studentValidation.getStudents),
        verifyJWT([ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT]),
        getStudents
    )
    .post(
        upload.single('studentImageFile'),
        validate(studentValidation.addStudent),
        verifyJWT([ROLES.ADMIN]),
        addStudent
    )
    

router.route('/:id')
    .get(
        validate(studentValidation.getStudentDetailsById),
        verifyJWT([ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT]),
        getStudentDetailsById
    )
    .put(
        validate(studentValidation.updateStudentDetails),
        verifyJWT([ROLES.ADMIN, ROLES.STUDENT]),
        updateStudentDetails
    )
    .delete(
        validate(studentValidation.removeStudent),
        verifyJWT([ROLES.ADMIN]),
        removeStudent
    );

// Student profile image management
router.route('/image')
    .put(
        upload.single('studentImageFile'),
        validate(studentValidation.updateStudentImage),
        verifyJWT([ROLES.ADMIN, ROLES.STUDENT]),
        updateStudentImage
    )
    .delete(
        validate(studentValidation.removeStudentImage),
        verifyJWT([ROLES.ADMIN, ROLES.STUDENT]),
        removeStudentImage
    );

// Password management (admin only)
router.route('/password')
    .put(validate(studentValidation.updateStudentPassword), verifyJWT([ROLES.ADMIN]), updateStudentPassword);

// Student relationship queries
router.route('/:id/semesters')
    .get(
        validate(studentValidation.getStudentSemestersById),
        verifyJWT([ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT]),
        getStudentSemestersById
    );

router.route('/:id/divisions')
    .get(
        validate(studentValidation.getStudentDivisionsById),
        verifyJWT([ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT]),
        getStudentDivisionsById
    );

router.route('/:id/batches')
    .get(
        validate(studentValidation.getStudentBatchesById),
        verifyJWT([ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT]),
        getStudentBatchesById
    );

// Semester management (admin only)
router.route('/semester')
    .post(validate(studentValidation.addStudentToSemester), verifyJWT([ROLES.ADMIN]), addStudentToSemester)
    .delete(validate(studentValidation.removeStudentFromSemester), verifyJWT([ROLES.ADMIN]), removeStudentFromSemester);

// Division management (admin only)
router.route('/division')
    .post(validate(studentValidation.addStudentToDivision), verifyJWT([ROLES.ADMIN]), addStudentToDivision)
    .put(validate(studentValidation.changeStudentDivision), verifyJWT([ROLES.ADMIN]), changeStudentDivision);

// Batch management (admin only)
router.route('/batch')
    .post(validate(studentValidation.addStudentToBatch), verifyJWT([ROLES.ADMIN]), addStudentToBatch)
    .put(validate(studentValidation.changeStudentBatch), verifyJWT([ROLES.ADMIN]), changeStudentBatch);

export default router;
