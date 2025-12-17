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
    revertAddStudentToDivision,
    revertChangeStudentDivision,
    addStudentToBatch,
    changeStudentBatch,
    revertAddStudentToBatch,
    revertChangeStudentBatch,
    getStudentSemestersById,
    getStudentDivisionsById,    
    getStudentBatchesById,
    bulkCreateStudents,
    bulkDeleteStudents,
    bulkAddStudentsToSemester,
    bulkAddStudentsToDivision,
    bulkAddStudentsToBatch,
    bulkCreateStudentsFromCSV
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

// Password management (admin only) - must be before /:id route
router.route('/password')
    .put(validate(studentValidation.updateStudentPassword), verifyJWT([ROLES.ADMIN]), updateStudentPassword);

// Student profile image management
router.route('/image')
    .put(
        upload.single('studentImageFile'),
        validate(studentValidation.updateStudentImage),
        verifyJWT([ROLES.ADMIN]),
        updateStudentImage
    )
    .delete(
        validate(studentValidation.removeStudentImage),
        verifyJWT([ROLES.ADMIN, ROLES.STUDENT]),
        removeStudentImage
    );
    

// Management endpoints should come before '/:id' to avoid path conflicts

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

router.route('/division/revert-add')
    .post(validate(studentValidation.revertAddStudentToDivision), verifyJWT([ROLES.ADMIN]), revertAddStudentToDivision);

router.route('/division/revert-change')
    .post(validate(studentValidation.revertChangeStudentDivision), verifyJWT([ROLES.ADMIN]), revertChangeStudentDivision);

// Batch management (admin only)
router.route('/batch')
    .post(validate(studentValidation.addStudentToBatch), verifyJWT([ROLES.ADMIN]), addStudentToBatch)
    .put(validate(studentValidation.changeStudentBatch), verifyJWT([ROLES.ADMIN]), changeStudentBatch);

router.route('/batch/revert-add')
    .post(validate(studentValidation.revertAddStudentToBatch), verifyJWT([ROLES.ADMIN]), revertAddStudentToBatch);

router.route('/batch/revert-change')
    .post(validate(studentValidation.revertChangeStudentBatch), verifyJWT([ROLES.ADMIN]), revertChangeStudentBatch);

// CRUD by ID — placed after management endpoints to avoid matching '/division' or '/batch'
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

// Bulk operations (admin only)
router.route('/bulk/create')
    .post(validate(studentValidation.bulkCreateStudents), verifyJWT([ROLES.ADMIN]), bulkCreateStudents);

router.route('/bulk/delete')
    .delete(validate(studentValidation.bulkDeleteStudents), verifyJWT([ROLES.ADMIN]), bulkDeleteStudents);

router.route('/bulk/semester')
    .post(validate(studentValidation.bulkAddStudentsToSemester), verifyJWT([ROLES.ADMIN]), bulkAddStudentsToSemester);

router.route('/bulk/division')
    .post(validate(studentValidation.bulkAddStudentsToDivision), verifyJWT([ROLES.ADMIN]), bulkAddStudentsToDivision);

router.route('/bulk/batch')
    .post(validate(studentValidation.bulkAddStudentsToBatch), verifyJWT([ROLES.ADMIN]), bulkAddStudentsToBatch);

// Bulk CSV upload (admin only)
router.route('/bulk/csv')
    .post(
        upload.single('csvFile'),
        validate(studentValidation.bulkCreateStudentsFromCSV),
        verifyJWT([ROLES.ADMIN]),
        bulkCreateStudentsFromCSV
    );

export default router;
