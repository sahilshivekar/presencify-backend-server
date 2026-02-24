import { Op } from 'sequelize';
import { asyncHandler } from '../utils/asyncHandler.js';
import fs from 'fs';
import csvParser from 'csv-parser';
import Student from '../db/models/student.model.js'
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { uploadOnCloudinary, deleteFromCloudinary } from '../utils/cloudinary.js';
import { isValidPhoneNumber } from 'libphonenumber-js';
import Scheme from "../db/models/scheme.model.js"
import moment from "moment"
import Semester from '../db/models/semester.model.js';
import StudentSemester from '../db/models/studentSemester.model.js';
import Branch from '../db/models/branch.model.js';
import StudentBatch from '../db/models/studentBatch.model.js';
import StudentDivision from '../db/models/studentDivision.model.js';
import Division from '../db/models/division.model.js';
import sequelize from '../config/db.connection.js';
import Batch from '../db/models/batch.model.js';
import { get } from 'http';
import { getDateStringFromObj } from "../utils/date.js";
import Dropout from '../db/models/dropout.model.js'
import httpStatus from 'http-status';
import studentValidation from '../validators/student.validation.js';

//* Get all students
const getStudents = asyncHandler(async (req, res) => {
    let {
        searchQuery,
        branchIds,
        semesterNumbers,
        academicStartYearOfSemester,
        academicEndYearOfSemester,
        semesterId,
        batchId,
        schemeId,
        divisionId,
        dropoutAcademicStartYear,
        dropoutAcademicEndYear,
        admissionTypes,
        admissionYear,
        currentBatch = false,
        currentDivision = false,
        currentSemester = false,
        divisionCode,
        batchCode,
        page = 1,
        limit = 10,
        getAll = false,
        intention = null
    } = req.query;

    // Only convert to arrays, don't validate here
    if (branchIds && !Array.isArray(branchIds)) {
        branchIds = [branchIds];
    }

    if (semesterNumbers && !Array.isArray(semesterNumbers)) {
        semesterNumbers = [semesterNumbers];
    }
    if (semesterNumbers) {
        semesterNumbers = semesterNumbers.map(semesterNumber => Number(semesterNumber))
    }
    if (admissionTypes && !Array.isArray(admissionTypes)) {
        admissionTypes = [admissionTypes];
    }
    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    let searchClause = {};

    if (searchQuery) {
        searchClause = {
            [Op.or]: [
                { firstName: { [Op.iLike]: `%${searchQuery}%` } },
                { lastName: { [Op.iLike]: `%${searchQuery}%` } },
                { email: { [Op.iLike]: `%${searchQuery}%` } },
                { phoneNumber: { [Op.iLike]: `%${searchQuery}%` } },
                { prn: { [Op.iLike]: `%${searchQuery}%` } },
            ]
        };
    }

    let admissionYearFilterClause = {};
    let admissionTypeFilterClause = {};
    let schemeFilterClause = {};
    let branchFilterClause = {};

    if (admissionYear) {
        admissionYearFilterClause.admissionYear = {
            [Op.eq]: Number(admissionYear)
        }
    }

    if (admissionTypes) {
        admissionTypeFilterClause.admissionType = {
            [Op.in]: admissionTypes
        };
    }

    if (schemeId) {
        schemeFilterClause.id = schemeId;
    }

    if (branchIds) {
        branchFilterClause.branchId = {
            [Op.in]: branchIds
        };
    }

    if (academicStartYearOfSemester) {
        academicStartYearOfSemester = Number(academicStartYearOfSemester)
    }

    if (academicEndYearOfSemester) {
        academicEndYearOfSemester = Number(academicEndYearOfSemester)
    }

    if (dropoutAcademicStartYear) {
        dropoutAcademicStartYear = Number(dropoutAcademicStartYear)
    }

    if (dropoutAcademicEndYear) {
        dropoutAcademicEndYear = Number(dropoutAcademicEndYear)
    }

    const currentDate = new Date()

    const students = await Student.findAndCountAll({
        where: {
            [Op.and]: [
                searchClause,
                admissionTypeFilterClause,
                admissionYearFilterClause,
                branchFilterClause
            ]
        },
        distinct: true,
        include: [
            {
                model: StudentSemester,
                required: semesterNumbers || academicStartYearOfSemester || academicEndYearOfSemester || semesterId ? true : false,
                duplicating: false,
                include: [
                    {
                        model: Semester,
                        required: semesterNumbers || academicStartYearOfSemester || academicEndYearOfSemester || semesterId ? true : false,
                        where: {
                            [Op.and]: [
                                ...(semesterNumbers ? [{
                                    semesterNumber: {
                                        [Op.in]: semesterNumbers
                                    }
                                }] : []),
                                ...(currentSemester === true ? [{
                                    endDate: {
                                        [Op.gte]: currentDate
                                    },
                                    startDate: {
                                        [Op.lte]: currentDate
                                    }
                                }] : []),
                                ...(academicStartYearOfSemester ? [{
                                    academicStartYear: {
                                        [Op.gte]: academicStartYearOfSemester
                                    }
                                }] : []),
                                ...(academicEndYearOfSemester ? [{
                                    academicEndYear: {
                                        [Op.lte]: academicEndYearOfSemester
                                    }
                                }] : []),
                                ...(semesterId ? [{
                                    id: semesterId
                                }] : [])

                            ]
                        },
                        duplicating: false,
                    }
                ]
            },
            {
                model: Branch,
                required: true,
                duplicating: false,
            },
            {
                model: StudentDivision,
                required: divisionId || divisionCode || intention == "MODIFY_STUDENT_DIVISION" ? true : false,
                duplicating: false,
                where: {
                    [Op.and]: [
                        ...(divisionId ? [{ divisionId: divisionId }] : []),
                        ...(currentDivision === true ? [{ endDate: null }] : [])
                    ]
                },
                include: [
                    {
                        model: Division,
                        required: divisionId || divisionCode || intention == "MODIFY_STUDENT_DIVISION" ? true : false,
                        duplicating: false,
                        where: {
                            [Op.and]: [
                                ...(divisionCode ? [{ divisionCode }] : []),
                            ]
                        }
                    }
                ]
            },
            {
                model: StudentBatch,
                required: batchCode || batchId || intention == "MODIFY_STUDENT_BATCH" ? true : false,
                duplicating: false,
                where: {
                    [Op.and]: [
                        ...(batchId ? [{ batchId: batchId }] : []),
                        ...(currentBatch === true ? [{ endDate: null }] : [])
                    ]
                },
                include: [
                    {
                        model: Batch,
                        required: batchCode || batchId || intention == "MODIFY_STUDENT_BATCH" ? true : false,
                        duplicating: false,
                        where: {
                            [Op.and]: [
                                ...(batchCode ? [{ batchCode }] : []),
                            ]
                        }
                    }
                ]
            },
            {
                model: Scheme,
                required: true,
                duplicating: false,
                where: schemeFilterClause,
            },
            {
                model: Dropout,
                required: dropoutAcademicEndYear || dropoutAcademicStartYear ? true : false,
                duplicating: false,
                where: {
                    [Op.and]: [
                        ...(dropoutAcademicEndYear ? [{
                            academicEndYear: { [Op.lte]: dropoutAcademicEndYear }
                        }] : []),
                        ...(dropoutAcademicStartYear ? [{
                            academicStartYear: { [Op.gte]: dropoutAcademicStartYear }
                        }] : [])
                    ]
                }
            }
        ],
        ...(limit && getAll === false ? { offset: offset, } : {}),
        ...(limit && getAll === false ? { limit: parseInt(limit, 10) } : {})
    });

    res
        .status(httpStatus.OK)
        .json(
            new ApiResponse(
                httpStatus.OK,
                "Students retrieved successfully.",
                {
                    students: students.rows,
                    totalStudents: students.count
                }
            )
        );

});

//* Add a student
const addStudent = asyncHandler(async (req, res) => {
    const {
        prn,
        firstName,
        middleName,
        lastName,
        email,
        phoneNumber,
        gender,
        dob,
        schemeId,
        admissionYear,
        admissionType,
        branchId,
        parentEmail
    } = req.body;
    const studentImageLocalPath = req?.file?.path

    // Remove all field validation, assume already validated

    const existingStudent = await Student.findOne({ where: { email } });

    if (existingStudent) {
        if (studentImageLocalPath) fs.unlinkSync(studentImageLocalPath);
        throw new ApiError(httpStatus.BAD_REQUEST, "A student with this email already exists");
    }

    const scheme = await Scheme.findByPk(schemeId)
    if (!scheme) {
        if (studentImageLocalPath) fs.unlinkSync(studentImageLocalPath);
        throw new ApiError(httpStatus.NOT_FOUND, "Scheme not found")
    }

    const branch = await Branch.findByPk(branchId)
    if (!branch) {
        if (studentImageLocalPath) fs.unlinkSync(studentImageLocalPath);
        throw new ApiError(httpStatus.NOT_FOUND, "Branch not found")
    }

    let studentImageUrl = null;
    let studentImagePublicId = null;

    if (studentImageLocalPath) {
        const studentImage = await uploadOnCloudinary(studentImageLocalPath);
        if (!studentImage?.url) {
            throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Error uploading image");
        }
        studentImageUrl = studentImage.secure_url;
        studentImagePublicId = studentImage.public_id;
    }

    let dobForDB = null
    if (dob) {
        dobForDB = moment(dob, "YYYY/MM/DD").toDate();

        if (new Date() < dobForDB) {
            throw new ApiError(httpStatus.BAD_REQUEST, "Date of birth cannot be in the future")
        }
    }
    const addedStudent = await Student.create({
        prn,
        firstName,
        middleName: middleName || null,
        lastName,
        email,
        phoneNumber,
        parentEmail: parentEmail || null,
        gender: gender || null,
        dob: dobForDB,
        studentImgUrl: studentImageUrl,
        studentImgPublicId: studentImagePublicId,
        schemeId,
        admissionYear: Number(admissionYear) || null,
        admissionType: admissionType,
        branchId: branchId
    });

    res.status(httpStatus.CREATED).json(new ApiResponse(httpStatus.CREATED, "Student added successfully", addedStudent));
});


//* Update student details
const updateStudentDetails = asyncHandler(async (req, res) => {
    const {
        id,
        firstName,
        middleName,
        lastName,
        email,
        gender,
        phoneNumber,
        dob,
        schemeId,
        branchId,
        parentEmail,
        prn,
        admissionYear,
        admissionType
    } = req.body;

    // Remove input validation, assume already validated

    const student = await Student.findByPk(id);
    if (!student) throw new ApiError(httpStatus.NOT_FOUND, "Student not found");

    let dobForDB = null
    if (dob) {
        dobForDB = moment(dob, "YYYY/MM/DD").toDate();

        if (new Date() < dobForDB) {
            throw new ApiError(httpStatus.BAD_REQUEST, "Date of birth cannot be in the future")
        }
    }

    if (schemeId) {
        const scheme = await Scheme.findByPk(schemeId)
        if (!scheme) {
            throw new ApiError(httpStatus.NOT_FOUND, "Scheme not found")
        }
    }

    if (branchId) {
        const branch = await Branch.findByPk(branchId)
        if (!branch) {
            throw new ApiError(httpStatus.NOT_FOUND, "Branch not found")
        }
    }

    student.firstName = firstName || student.firstName;
    student.middleName = middleName || student.middleName;
    student.lastName = lastName || student.lastName;
    student.email = email || student.email;
    student.gender = gender || student.gender;
    student.phoneNumber = phoneNumber || student.phoneNumber;
    student.dob = dobForDB || student.dob;
    student.schemeId = schemeId || student.schemeId;
    student.branchId = branchId || student.branchId;
    student.parentEmail = parentEmail || student.parentEmail;
    student.prn = prn || student.prn
    student.admissionYear = admissionYear || student.admissionYear
    student.admissionType = admissionType || student.admissionType

    await student.save();

    res.status(httpStatus.OK).json(new ApiResponse(httpStatus.OK, "Student updated successfully", student));
});

//* Update student password
const updateStudentPassword = asyncHandler(async (req, res) => {
    const { id, password, confirmPassword } = req.body;

    // Remove input validation, assume already validated

    const student = await Student.findByPk(id);
    if (!student) throw new ApiError(httpStatus.NOT_FOUND, "Student not found");

    student.password = password;
    await student.save();

    res.status(httpStatus.OK).json(new ApiResponse(httpStatus.OK, "Student password updated successfully", student));
});

//* Update student image
const updateStudentImage = asyncHandler(async (req, res) => {
    const { id } = req.body;
    const studentImageLocalPath = req.file?.path;

    // Remove input validation, assume already validated

    const student = await Student.findByPk(id);
    if (!student) {
        if (studentImageLocalPath) fs.unlinkSync(studentImageLocalPath);
        throw new ApiError(httpStatus.NOT_FOUND, "Student not found");
    }

    if (!studentImageLocalPath) throw new ApiError(httpStatus.BAD_REQUEST, "Student image file is required");

    const uploadedImageResponse = await uploadOnCloudinary(studentImageLocalPath);
    if (!uploadedImageResponse?.url) throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Error uploading image");

    student.studentImgUrl = uploadedImageResponse.secure_url;
    student.studentImgPublicId = uploadedImageResponse.public_id;

    await student.save();

    res.status(httpStatus.OK).json(new ApiResponse(httpStatus.OK, "Student image updated successfully", { student }));
});

//* Remove student image
const removeStudentImage = asyncHandler(async (req, res) => {
    const { studentId } = req.query;

    // Remove input validation, assume already validated

    const student = await Student.findByPk(studentId);
    if (!student) throw new ApiError(httpStatus.NOT_FOUND, "Student not found");

    if (student.studentImgPublicId == null) throw new ApiError(httpStatus.BAD_REQUEST, "There is no student image uploaded to remove");
    const deletedImage = await deleteFromCloudinary(student.studentImgPublicId);
    if (!deletedImage) throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Error deleting image");

    student.studentImgUrl = null;
    student.studentImgPublicId = null;

    await student.save();
    res.status(httpStatus.OK).json(new ApiResponse(httpStatus.OK, "Student image deleted successfully", student));
});

//* Remove student
const removeStudent = asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Remove input validation, assume already validated

    const student = await Student.findByPk(id);
    if (!student) throw new ApiError(httpStatus.NOT_FOUND, "Student not found");

    await deleteFromCloudinary(student.studentImagePublicId);
    await student.destroy();

    res.status(httpStatus.OK).json(new ApiResponse(httpStatus.OK, "Student deleted successfully", null));
});

const getStudentDetailsById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Remove input validation, assume already validated

    const student = await Student.findOne({
        where: {
            id: id
        },
        attributes: { exclude: ['password', 'refreshToken'] },
        include: [
            {
                model: Branch,
                required: true
            },
            {
                model: Scheme,
                required: true
            },
            {
                model: StudentSemester,
                include: [
                    {
                        model: Semester,
                        required: true
                    }
                ]
            },
            {
                model: StudentDivision,
                include: [
                    {
                        model: Division,
                        required: true,
                        include: [
                            {
                                model: Semester,
                                required: true
                            }
                        ]
                    }
                ]
            },
            {
                model: StudentBatch,
                include: [
                    {
                        model: Batch,
                        required: true,
                        include: [
                            {
                                model: Division,
                                required: true,
                                include: [
                                    {
                                        model: Semester,
                                        required: true
                                    }
                                ]
                            }
                        ]
                    }
                ]
            }
        ]
    });
    if (!student) throw new ApiError(httpStatus.NOT_FOUND, "Student not found");

    res
        .status(httpStatus.OK)
        .json(
            new ApiResponse(
                httpStatus.OK,
                "Student fetched successfully",
                student
            )
        );
});


const getStudentSemestersById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Remove input validation, assume already validated

    const student = await Student.findByPk(id);

    if (!student) throw new ApiError(httpStatus.NOT_FOUND, "Student not found");

    const studentSemesters = await StudentSemester.findAll({
        where: {
            studentId: id
        },
        include: [
            {
                model: Semester,
                required: true
            }
        ]
    });

    res
        .status(httpStatus.OK)
        .json(
            new ApiResponse(
                httpStatus.OK,
                "Student semesters fetched successfully",
                studentSemesters
            )
        );
})

const getStudentDivisionsById = asyncHandler(async (req, res) => {
    const { studentId, semesterNumber } = req.query;

    // Remove input validation, assume already validated

    const student = await Student.findByPk(studentId);

    if (!student) throw new ApiError(httpStatus.NOT_FOUND, "Student not found");

    const semesterNumberClause = {}

    if (semesterNumber) {
        semesterNumberClause.semesterNumber = semesterNumber;
    }

    const studentDivisions = await StudentDivision.findAll({
        where: {
            studentId: studentId
        },
        include: [
            {
                model: Division,
                required: true,
                include: [
                    {
                        model: Semester,
                        required: true,
                        where: semesterNumberClause
                    }
                ]
            }
        ]
    });

    res
        .status(httpStatus.OK)
        .json(
            new ApiResponse(
                httpStatus.OK,
                "Student's divisions fetched successfully",
                studentDivisions
            )
        );
})

const getStudentBatchesById = asyncHandler(async (req, res) => {
    const { studentId, semesterNumber } = req.query;

    // Remove input validation, assume already validated

    const student = await Student.findByPk(studentId);

    if (!student) throw new ApiError(httpStatus.NOT_FOUND, "Student not found");

    const semesterNumberClause = {}

    if (semesterNumber) {
        semesterNumberClause.semesterNumber = semesterNumber;
    }

    const studentBatches = await StudentBatch.findAll({
        where: {
            studentId: studentId
        },
        include: [
            {
                model: Batch,
                required: true,
                include: [
                    {
                        model: Division,
                        required: true,
                        include: [
                            {
                                model: Semester,
                                required: true,
                                where: semesterNumberClause
                            }
                        ]
                    }
                ]
            }
        ]
    });

    res
        .status(httpStatus.OK)
        .json(
            new ApiResponse(
                httpStatus.OK,
                "Student's batches fetched successfully",
                studentBatches
            )
        );
})


const addStudentToSemester = asyncHandler(async (req, res) => {
    const { studentId, semesterId } = req.body;

    // Remove input validation, assume already validated

    const student = await Student.findByPk(studentId);

    if (!student) {
        throw new ApiError(httpStatus.NOT_FOUND, "Student not found");
    }

    const semester = await Semester.findByPk(semesterId);

    if (!semester) {
        throw new ApiError(httpStatus.NOT_FOUND, "Semester not found");
    }


    if (student.branchId !== semester.branchId) {
        throw new ApiError(httpStatus.BAD_REQUEST, `Student is not present in the same branch as the semester`)
    }

    const alreadyExists = await StudentSemester.findOne({
        where: {
            studentId: studentId,
            semesterId: semesterId
        }
    });

    if (alreadyExists) {
        throw new ApiError(httpStatus.BAD_REQUEST, `Student is already present in this semester`);
    }

    const semesterNumberToAdd = semester.semesterNumber;
    let validSemesterNumber;

    // checks for which semester the duplicated academic year is fine
    if (semesterNumberToAdd == 1) {
        validSemesterNumber = 2;
    } else if (semesterNumberToAdd == 2) {
        validSemesterNumber = 1;
    } else if (semesterNumberToAdd == 3) {
        validSemesterNumber = 4;
    } else if (semesterNumberToAdd == 4) {
        validSemesterNumber = 3;
    } else if (semesterNumberToAdd == 5) {
        validSemesterNumber = 6;
    } else if (semesterNumberToAdd == 6) {
        validSemesterNumber = 5;
    } else if (semesterNumberToAdd == 7) {
        validSemesterNumber = 8;
    } else if (semesterNumberToAdd == 8) {
        validSemesterNumber = 7;
    }


    const alreadyExistsInOtherSemesterForSameAcademicYear = await StudentSemester.findOne({
        where: {
            studentId: studentId,
            semesterId: {
                [Op.ne]: semesterId
            },
        },
        include: [
            {
                model: Semester,
                required: true,
                where: {
                    academicStartYear: semester.academicStartYear,
                    academicEndYear: semester.academicEndYear,
                    semesterNumber: {
                        [Op.ne]: validSemesterNumber
                    }
                }
            }
        ]
    });

    if (alreadyExistsInOtherSemesterForSameAcademicYear) {
        throw new ApiError(httpStatus.BAD_REQUEST, `Student is already added in other semester for the same academic year`);
    }

    // check if student is in dropout for same semester academic year
    const studentDropout = await Dropout.findOne({
        where: {
            academicEndYear: semester.academicEndYear,
            academicStartYear: semester.academicStartYear,
            studentId: studentId
        }
    })

    if (studentDropout) {
        throw new ApiError(httpStatus.BAD_REQUEST, `Student is in drop-out list for the same academic year of semester's`)
    }

    const studentSemesterEntry = await StudentSemester.create({
        studentId: studentId,
        semesterId: semesterId
    });

    res
        .status(httpStatus.OK)
        .json(
            new ApiResponse(
                httpStatus.OK,
                "Student added successfully",
                studentSemesterEntry
            )
        );
});

const removeStudentFromSemester = asyncHandler(async (req, res) => {
    const { studentSemesterId } = req.query;

    const studentSemester = await StudentSemester.findByPk(studentSemesterId);

    if (!studentSemester) {
        throw new ApiError(httpStatus.NOT_FOUND, "StudentSemester not found");
    }

    const transaction = await sequelize.transaction();
    try {
        const divisionsThatBelongToThisSemester = await Division.findAll({
            where: {
                semesterId: studentSemester.semesterId
            },
            transaction
        });

        await StudentDivision.destroy({
            where: {
                studentId: studentSemester.studentId,
                divisionId: {
                    [Op.in]: divisionsThatBelongToThisSemester.map(division => division.id)
                }
            },
            transaction
        });

        const batchesOfCurrentSemester = await Batch.findAll({
            where: {
                divisionId: {
                    [Op.in]: divisionsThatBelongToThisSemester.map(division => division.id)
                }
            },
            transaction
        });

        await StudentBatch.destroy({
            where: {
                studentId: studentSemester.studentId,
                batchId: {
                    [Op.in]: batchesOfCurrentSemester.map(batch => batch.id)
                }
            },
            transaction
        });

        await studentSemester.destroy({ transaction });
        await transaction.commit();
    } catch (error) {
        await transaction.rollback();
        throw error;
    }

    res
        .status(httpStatus.OK)
        .json(
            new ApiResponse(
                httpStatus.OK,
                `Student is removed from the semester`,
                null
            )
        );
});

const addStudentToDivision = asyncHandler(async (req, res) => {
    const { studentId, divisionId } = req.body;

    // Remove input validation, assume already validated

    const student = await Student.findByPk(studentId);

    if (!student) {
        throw new ApiError(httpStatus.NOT_FOUND, "Student not found");
    }

    const division = await Division.findByPk(divisionId);

    const semester = await Semester.findByPk(division.semesterId);

    const isStudentInSameSemesterAsDivision = await StudentSemester.findOne({
        where: {
            studentId: studentId,
            semesterId: division.semesterId
        }
    });

    if (!isStudentInSameSemesterAsDivision) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Student is not present in the same semester as the division")
    }

    const alreadyExists = await StudentDivision.findOne({
        where: {
            studentId: studentId,
            divisionId: divisionId,
            endDate: null
        }
    });

    if (alreadyExists) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Student is already present in this division")
    }

    const divisionsOfTheSemester = await Division.findAll({
        where: {
            semesterId: division.semesterId,
            id: {
                [Op.ne]: divisionId
            }
        }
    });


    const studentPresentInOtherDivisions = await StudentDivision.findOne({
        where: {
            studentId: studentId,
            divisionId: {
                [Op.in]: divisionsOfTheSemester.map(division => division.id)
            }
        }
    })

    if (studentPresentInOtherDivisions) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Student is already present in other division of the same semester. Please use the change division feature for moving student to different divsion.")
    }

    const studentDivisionEntry = await StudentDivision.create({
        studentId: studentId,
        divisionId: divisionId,
        startDate: semester.startDate,
    });


    res
        .status(httpStatus.OK)
        .json(
            new ApiResponse(
                httpStatus.OK,
                "Student added successfully",
                studentDivisionEntry
            )
        );

});

const changeStudentDivision = asyncHandler(async (req, res) => {
    const { studentDivisionId, divisionId, newDivisionStartDate } = req.body;

    const studentDivision = await StudentDivision.findByPk(studentDivisionId);

    if (!studentDivision) {
        throw new ApiError(httpStatus.NOT_FOUND, "Student's previous division is not found");
    }

    if (studentDivision.endDate != null) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Invalid previous division.");
    }

    const division = await Division.findByPk(divisionId);

    if (!division) {
        throw new ApiError(httpStatus.NOT_FOUND, "Division is not found");
    }

    if (studentDivision.divisionId === divisionId) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Student's new division can't be same as previous division");
    }

    const isStudentInSameSemesterAsDivision = await StudentSemester.findOne({
        where: {
            studentId: studentDivision.studentId,
            semesterId: division.semesterId
        }
    });

    if (!isStudentInSameSemesterAsDivision) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Student is not present in the same semester as the new division")
    }

    const startDateOfNewDivision = new Date(newDivisionStartDate);

    if (isNaN(startDateOfNewDivision.getTime())) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Invalid date format for new division start date");
    }

    const semester = await Semester.findByPk(division.semesterId);

    if (startDateOfNewDivision.toISOString().split('T')[0] <= studentDivision.startDate) {
        throw new ApiError(httpStatus.BAD_REQUEST, "New division start date cannot be lesser than or same as previous division start date");
    }

    if (startDateOfNewDivision.toISOString().split('T')[0] >= semester.endDate) {
        throw new ApiError(httpStatus.BAD_REQUEST, "New division start date cannot be greater than end date of the semester");
    }

    const endDateOfPrevDivision = new Date(startDateOfNewDivision.getFullYear(), startDateOfNewDivision.getMonth(), startDateOfNewDivision.getDate() - 1);

    const transaction = await sequelize.transaction();
    try {
        const batchesOfCurrentDivision = await Batch.findAll({
            where: {
                divisionId: studentDivision.divisionId,
            },
            transaction
        });

        // removing student from his previous batch of the previous division
        const studentBatch = await StudentBatch.findOne({
            where: {
                studentId: studentDivision.studentId,
                batchId: {
                    [Op.in]: batchesOfCurrentDivision.map(batch => batch.id),
                },
                endDate: null
            },
            transaction
        });

        if (studentBatch) {
            if (studentBatch.startDate > startDateOfNewDivision.toISOString().split('T')[0]) {
                const futureBatchStartDateObj = new Date(studentBatch.startDate)
                const prevBatchEndDateObj = new Date(futureBatchStartDateObj.getFullYear(), futureBatchStartDateObj.getMonth(), futureBatchStartDateObj.getDate());

                const previousBatch = await StudentBatch.findOne({
                    where: {
                        studentId: studentDivision.studentId,
                        endDate: prevBatchEndDateObj.toISOString().split('T')[0],
                    },
                    include: [
                        {
                            model: Batch,
                            required: true,
                            where: {
                                divisionId: studentDivision.divisionId
                            }
                        }
                    ],
                    transaction
                });

                await studentBatch.destroy({ transaction });

                if (previousBatch) {
                    previousBatch.endDate = endDateOfPrevDivision;
                    await previousBatch.save({ transaction });
                }
            } else {
                studentBatch.endDate = endDateOfPrevDivision;
                await studentBatch.save({ transaction });
            }
        }

        studentDivision.endDate = endDateOfPrevDivision;
        await studentDivision.save({ transaction });

        const newStudentDivision = await StudentDivision.create({
            studentId: studentDivision.studentId,
            divisionId: divisionId,
            startDate: startDateOfNewDivision
        }, { transaction });

        if (!newStudentDivision) {
            throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Some issue occured while changing division");
        }
        await transaction.commit();
        res
            .status(httpStatus.OK)
            .json(
                new ApiResponse(
                    httpStatus.OK,
                    "Student's division is changed successfully",
                    newStudentDivision
                )
            );
    } catch (error) {
        await transaction.rollback();
        throw error;
    }

});

const addStudentToBatch = asyncHandler(async (req, res) => {
    const { studentId, batchId } = req.body;

    // Remove input validation, assume already validated

    const student = await Student.findByPk(studentId);

    if (!student) {
        throw new ApiError(httpStatus.NOT_FOUND, "Student not found");
    }

    const batch = await Batch.findByPk(batchId);

    if (!batch) {
        throw new ApiError(httpStatus.NOT_FOUND, "Batch not found");
    }

    const isStudentInSameDivisionAsBatch = await StudentDivision.findOne({
        where: {
            studentId: studentId,
            divisionId: batch.divisionId,
            endDate: null
        }
    });

    if (!isStudentInSameDivisionAsBatch) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Student is not present in the same division as the batch")
    }


    const alreadyExists = await StudentBatch.findOne({
        where: {
            studentId: studentId,
            batchId: batchId,
            endDate: null
        }
    });

    if (alreadyExists) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Student is already present in this batch")
    }

    const batchesOfTheDivision = await Batch.findAll({
        where: {
            divisionId: batch.divisionId,
            id: {
                [Op.ne]: batchId
            }
        }
    });


    const studentPresentInOtherBatches = await StudentBatch.findOne({
        where: {
            studentId: studentId,
            batchId: {
                [Op.in]: batchesOfTheDivision.map(batch => batch.id)
            },
            endDate: null
        }
    })

    if (studentPresentInOtherBatches) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Student is already present in other batch of the same division. Please use the change division feature for moving student to different batch.")
    }

    const studentBatchEntry = await StudentBatch.create({
        studentId: studentId,
        batchId: batchId,
        startDate: isStudentInSameDivisionAsBatch.startDate,
    });

    res
        .status(httpStatus.OK)
        .json(
            new ApiResponse(
                httpStatus.OK,
                "Student added to batch successfully",
                studentBatchEntry
            )
        );

});

const changeStudentBatch = asyncHandler(async (req, res, next) => {

    const { studentBatchId, batchId, newBatchStartDate } = req.body;

    const studentBatch = await StudentBatch.findByPk(studentBatchId);

    if (!studentBatch) {
        throw new ApiError(httpStatus.NOT_FOUND, "Student's previous batch is not found");
    }

    if (studentBatch.endDate != null) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Invalid previous batch.");
    }

    const batch = await Batch.findByPk(batchId);

    if (!batch) {
        throw new ApiError(httpStatus.NOT_FOUND, "Batch is not found");
    }

    if (studentBatch.batchId === batchId) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Student's new batch can't be same as previous batch");
    }

    const isStudentInSameDivisionAsBatch = await StudentDivision.findOne({
        where: {
            studentId: studentBatch.studentId,
            divisionId: batch.divisionId,
            endDate: null
        }
    });

    if (!isStudentInSameDivisionAsBatch) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Student is not present in the same division as the batch")
    }

    const division = await Division.findByPk(batch.divisionId);
    const semester = await Semester.findByPk(division.semesterId);

    const startDateOfNewBatch = new Date(newBatchStartDate);

    if (isNaN(startDateOfNewBatch.getTime())) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Invalid date format for new division start date");
    }

    if (startDateOfNewBatch.toISOString().split('T')[0] > semester.endDate) {
        throw new ApiError(httpStatus.BAD_REQUEST, "New batch start date cannot be greater than end date of the semester");
    }

    if (startDateOfNewBatch.toISOString().split('T')[0] <= studentBatch.startDate) {
        throw new ApiError(httpStatus.BAD_REQUEST, "New batch start date cannot be lesser than or same as previous batch start date");
    }

    const endDateOfPrevBatch = new Date(startDateOfNewBatch.getFullYear(), startDateOfNewBatch.getMonth(), startDateOfNewBatch.getDate() - 1);

    if (studentBatch.startDate >= startDateOfNewBatch.toISOString().split('T')[0]) {
        throw new ApiError(httpStatus.BAD_REQUEST, "New batch start date cannot be lesser than or same as previous batch start date");
    }

    const transaction = await sequelize.transaction();
    try {
        studentBatch.endDate = endDateOfPrevBatch;
        await studentBatch.save({ transaction });

        const newStudentBatch = await StudentBatch.create({
            studentId: studentBatch.studentId,
            batchId: batchId,
            startDate: startDateOfNewBatch
        }, { transaction });

        await transaction.commit();
        res
            .status(httpStatus.OK)
            .json(
                new ApiResponse(
                    httpStatus.OK,
                    "Student's batch is changed successfully",
                    newStudentBatch
                )
            );
    } catch (error) {
        await transaction.rollback();
        throw error;
    }

});

// Revert: addStudentToDivision
const revertAddStudentToDivision = asyncHandler(async (req, res) => {
    const { studentDivisionId } = req.body;

    const studentDivision = await StudentDivision.findByPk(studentDivisionId);
    if (!studentDivision) throw new ApiError(httpStatus.NOT_FOUND, "StudentDivision not found");
    if (studentDivision.endDate !== null) throw new ApiError(httpStatus.BAD_REQUEST, "StudentDivision is not active");

    // Enforce LIFO: must be latest active division for the student
    const latestActiveDivision = await StudentDivision.findOne({
        where: { studentId: studentDivision.studentId, endDate: null },
        order: [["startDate", "DESC"]]
    });
    if (!latestActiveDivision || latestActiveDivision.id !== studentDivision.id) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Only the latest active division can be reverted");
    }

    const transaction = await sequelize.transaction();
    try {
        // Remove active batches in this division for the student
        const batchesInDivision = await Batch.findAll({ where: { divisionId: studentDivision.divisionId }, transaction });
        await StudentBatch.destroy({
            where: {
                studentId: studentDivision.studentId,
                batchId: { [Op.in]: batchesInDivision.map(b => b.id) },
                endDate: null
            },
            transaction
        });

        await studentDivision.destroy({ transaction });
        await transaction.commit();
    } catch (error) {
        await transaction.rollback();
        throw error;
    }

    res.status(httpStatus.OK).json(new ApiResponse(httpStatus.OK, "Reverted addStudentToDivision successfully", null));
});

// Revert: changeStudentDivision
const revertChangeStudentDivision = asyncHandler(async (req, res) => {
    const { newStudentDivisionId } = req.body;

    const newDivision = await StudentDivision.findByPk(newStudentDivisionId, {
        include: [
            {
                model: Division,
                required: true
            }
        ]
    });
    if (!newDivision) throw new ApiError(httpStatus.NOT_FOUND, "New StudentDivision not found");
    if (newDivision.endDate !== null) throw new ApiError(httpStatus.BAD_REQUEST, "Student is not active in this division now to revert");

    // Enforce LIFO: must be latest active division for the student in the same semester
    const latestActiveDivision = await StudentDivision.findOne({
        where: { studentId: newDivision.studentId, endDate: null },
        include: [
            {
                model: Division,
                required: true,
                where: { semesterId: newDivision.Division.semesterId }
            }
        ],
        order: [["startDate", "DESC"]]
    });
    if (!latestActiveDivision || latestActiveDivision.id !== newDivision.id) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Only the latest active division change or assignment can be reverted");
    }

    // Find previous division (most recent ended division) in the same semester
    const prevDivision = await StudentDivision.findOne({
        where: {
            studentId: newDivision.studentId,
            endDate: { [Op.ne]: null }
        },
        include: [
            {
                model: Division,
                required: true,
                where: { semesterId: newDivision.Division.semesterId }
            }
        ],
        order: [["endDate", "DESC"]]
    });
    if (!prevDivision) throw new ApiError(httpStatus.BAD_REQUEST, "This is initial division assignment for the student in this semester, no previous division found for revert. Use Unassgign division option if you wish to just remove the division assignment.");

    const transaction = await sequelize.transaction();
    try {
        // Remove active batches in the new division
        const batchesInNewDivision = await Batch.findAll({ where: { divisionId: newDivision.divisionId }, transaction });
        await StudentBatch.destroy({
            where: {
                studentId: newDivision.studentId,
                batchId: { [Op.in]: batchesInNewDivision.map(b => b.id) },
                startDate: { [Op.gte]: newDivision.startDate }
            },
            transaction
        });

        if (prevDivision) {
            // Store prevDivision endDate before nullifying
            const prevDivisionEndDate = prevDivision.endDate;

            // Restore previous division as active
            prevDivision.endDate = null;
            await prevDivision.save({ transaction });

            // Restore the latest batch that was ended with the division change
            const batchesInPrevDivision = await Batch.findAll({ where: { divisionId: prevDivision.divisionId }, transaction });
            await StudentBatch.update(
                { endDate: null },
                {
                    where: {
                        studentId: newDivision.studentId,
                        batchId: { [Op.in]: batchesInPrevDivision.map(b => b.id) },
                        endDate: prevDivisionEndDate
                    },
                    transaction
                }
            );
        }

        // Delete new division row
        await newDivision.destroy({ transaction });

        await transaction.commit();
    } catch (error) {
        await transaction.rollback();
        throw error;
    }

    res.status(httpStatus.OK).json(new ApiResponse(httpStatus.OK, "Reverted changeStudentDivision successfully", null));
});

// Revert: addStudentToBatch
const revertAddStudentToBatch = asyncHandler(async (req, res) => {
    const { studentBatchId } = req.body;

    const studentBatch = await StudentBatch.findByPk(studentBatchId);
    if (!studentBatch) throw new ApiError(httpStatus.NOT_FOUND, "StudentBatch not found");
    if (studentBatch.endDate !== null) throw new ApiError(httpStatus.BAD_REQUEST, "StudentBatch is not active");

    // Enforce LIFO: must be the currently active batch for the student in its division
    const activeBatch = await StudentBatch.findOne({
        where: { studentId: studentBatch.studentId, endDate: null },
        order: [["startDate", "DESC"]]
    });
    if (!activeBatch || activeBatch.id !== studentBatch.id) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Only the latest active batch can be reverted");
    }

    await studentBatch.destroy();
    res.status(httpStatus.OK).json(new ApiResponse(httpStatus.OK, "Reverted addStudentToBatch successfully", null));
});

// Revert: changeStudentBatch
const revertChangeStudentBatch = asyncHandler(async (req, res) => {
    const { newStudentBatchId } = req.body;

    const newBatch = await StudentBatch.findByPk(newStudentBatchId, {
        include: [
            {
                model: Batch,
                required: true
            }
        ]
    });
    if (!newBatch) throw new ApiError(httpStatus.NOT_FOUND, "New StudentBatch not found");
    if (newBatch.endDate !== null) throw new ApiError(httpStatus.BAD_REQUEST, "Student is not active in this batch now to revert");

    // Enforce LIFO: must be latest active batch for the student in the same division
    const latestActiveBatch = await StudentBatch.findOne({
        where: { studentId: newBatch.studentId, endDate: null },
        include: [
            {
                model: Batch,
                required: true,
                where: { divisionId: newBatch.Batch.divisionId }
            }
        ],
        order: [["startDate", "DESC"]]
    });
    if (!latestActiveBatch || latestActiveBatch.id !== newBatch.id) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Only the latest active batch change or assignment can be reverted");
    }

    // Find previous batch (most recent ended batch) in the same division
    const prevBatch = await StudentBatch.findOne({
        where: {
            studentId: newBatch.studentId,
            endDate: { [Op.ne]: null }
        },
        include: [
            {
                model: Batch,
                required: true,
                where: { divisionId: newBatch.Batch.divisionId }
            }
        ],
        order: [["endDate", "DESC"]]
    });
    if (!prevBatch) throw new ApiError(httpStatus.BAD_REQUEST, "This is initial batch assignment for the student in this division, no previous batch found for revert. Use Unassgign batch option if you wish to just remove the batch assignment.");

    const transaction = await sequelize.transaction();
    try {
        if (prevBatch) {
            // Restore previous batch as active
            prevBatch.endDate = null;
            await prevBatch.save({ transaction });
        }

        // Delete new batch row
        await newBatch.destroy({ transaction });

        await transaction.commit();
    } catch (error) {
        await transaction.rollback();
        throw error;
    }

    res.status(httpStatus.OK).json(new ApiResponse(httpStatus.OK, "Reverted changeStudentBatch successfully", null));
});


//* Bulk Create Students
const bulkCreateStudents = asyncHandler(async (req, res) => {
    const { students } = req.body;

    if (!students || !Array.isArray(students) || students.length === 0) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Students array is required and must not be empty");
    }



    const transaction = await sequelize.transaction();
    try {
        const createdStudents = [];
        const errors = [];

        for (let i = 0; i < students.length; i++) {
            const studentData = students[i];
            try {
                // Validate required fields
                if (!studentData.prn || !studentData.firstName || !studentData.lastName ||
                    !studentData.email || !studentData.phoneNumber || !studentData.branchId ||
                    !studentData.schemeId || !studentData.admissionType) {
                    errors.push({ index: i, error: "Missing required fields" });
                    continue;
                }

                // Check if PRN already exists
                const existingStudent = await Student.findOne({
                    where: { prn: studentData.prn },
                    transaction
                });

                if (existingStudent) {
                    errors.push({ index: i, error: `PRN ${studentData.prn} already exists` });
                    continue;
                }

                // Validate phone number
                if (!isValidPhoneNumber(studentData.phoneNumber, 'IN')) {
                    errors.push({ index: i, error: "Invalid phone number" });
                    continue;
                }

                // Process date of birth
                let dobForDB = null;
                if (studentData.dob) {
                    dobForDB = moment(studentData.dob, "YYYY/MM/DD").toDate();
                    if (new Date() < dobForDB) {
                        errors.push({ index: i, error: "Date of birth cannot be in the future" });
                        continue;
                    }
                }

                const student = await Student.create({
                    prn: studentData.prn,
                    firstName: studentData.firstName,
                    middleName: studentData.middleName || null,
                    lastName: studentData.lastName,
                    email: studentData.email,
                    phoneNumber: studentData.phoneNumber,
                    parentEmail: studentData.parentEmail || null,
                    gender: studentData.gender || null,
                    dob: dobForDB,
                    studentImgUrl: null,
                    studentImgPublicId: null,
                    schemeId: studentData.schemeId,
                    admissionYear: Number(studentData.admissionYear) || null,
                    admissionType: studentData.admissionType,
                    branchId: studentData.branchId
                }, { transaction });

                createdStudents.push(student);

            } catch (error) {
                errors.push({ index: i, error: error.message });
            }
        }

        await transaction.commit();



        res.status(httpStatus.CREATED).json(
            new ApiResponse(
                httpStatus.CREATED,
                `Bulk student creation completed. Created: ${createdStudents.length}, Errors: ${errors.length}`,
                {
                    createdStudents,
                    errors,
                    summary: {
                        total: students.length,
                        created: createdStudents.length,
                        failed: errors.length
                    }
                }
            )
        );

    } catch (error) {
        await transaction.rollback();
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Bulk student creation failed");
    }
});

//* Bulk Delete Students
const bulkDeleteStudents = asyncHandler(async (req, res) => {
    const { studentIds } = req.body;

    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Student IDs array is required and must not be empty");
    }



    const transaction = await sequelize.transaction();
    try {
        const students = await Student.findAll({
            where: { id: { [Op.in]: studentIds } },
            transaction
        });

        if (students.length === 0) {
            throw new ApiError(httpStatus.NOT_FOUND, "No students found with provided IDs");
        }

        // Delete images from cloudinary for students that have them
        const studentsWithImages = students.filter(student => student.studentImgPublicId);
        for (const student of studentsWithImages) {
            try {
                await deleteFromCloudinary(student.studentImgPublicId);
            } catch (error) {

            }
        }

        const deletedCount = await Student.destroy({
            where: { id: { [Op.in]: studentIds } },
            transaction
        });

        await transaction.commit();



        res.status(httpStatus.OK).json(
            new ApiResponse(
                httpStatus.OK,
                "Students deleted successfully",
                {
                    deletedCount,
                    requestedCount: studentIds.length
                }
            )
        );

    } catch (error) {
        await transaction.rollback();
        throw error;
    }
});

//* Bulk Add Students to Semester
const bulkAddStudentsToSemester = asyncHandler(async (req, res) => {
    const { studentIds, semesterId } = req.body;

    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Student IDs array is required and must not be empty");
    }

    if (!semesterId) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Semester ID is required");
    }



    const transaction = await sequelize.transaction();
    try {
        const semester = await Semester.findByPk(semesterId, { transaction });
        if (!semester) {
            throw new ApiError(httpStatus.NOT_FOUND, "Semester not found");
        }

        const students = await Student.findAll({
            where: { id: { [Op.in]: studentIds } },
            transaction
        });

        if (students.length === 0) {
            throw new ApiError(httpStatus.NOT_FOUND, "No students found with provided IDs");
        }

        const studentSemesterData = [];
        const errors = [];

        for (const student of students) {
            try {
                // Check if student is already in this semester
                const existingStudentSemester = await StudentSemester.findOne({
                    where: {
                        studentId: student.id,
                        semesterId: semesterId
                    },
                    transaction
                });

                if (existingStudentSemester) {
                    errors.push({ studentId: student.id, error: "Student already in this semester" });
                    continue;
                }

                studentSemesterData.push({
                    studentId: student.id,
                    semesterId: semesterId
                });

            } catch (error) {
                errors.push({ studentId: student.id, error: error.message });
            }
        }

        let created = [];
        if (studentSemesterData.length > 0) {
            created = await StudentSemester.bulkCreate(studentSemesterData, { transaction });
        }

        await transaction.commit();



        res.status(httpStatus.CREATED).json(
            new ApiResponse(
                httpStatus.CREATED,
                `Bulk addition to semester completed. Added: ${created.length}, Errors: ${errors.length}`,
                {
                    created,
                    errors,
                    summary: {
                        total: studentIds.length,
                        added: created.length,
                        failed: errors.length
                    }
                }
            )
        );

    } catch (error) {
        await transaction.rollback();
        throw error;
    }
});

//* Bulk Add Students to Division
const bulkAddStudentsToDivision = asyncHandler(async (req, res) => {
    const { studentIds, divisionId } = req.body;

    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Student IDs array is required and must not be empty");
    }

    if (!divisionId) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Division ID is required");
    }



    const transaction = await sequelize.transaction();
    try {
        const division = await Division.findByPk(divisionId, { transaction });
        if (!division) {
            throw new ApiError(httpStatus.NOT_FOUND, "Division not found");
        }

        const students = await Student.findAll({
            where: { id: { [Op.in]: studentIds } },
            transaction
        });

        if (students.length === 0) {
            throw new ApiError(httpStatus.NOT_FOUND, "No students found with provided IDs");
        }

        const studentDivisionData = [];
        const errors = [];

        for (const student of students) {
            try {
                // Check if student is in the same semester as the division
                const semester = await Semester.findByPk(division.semesterId, { transaction });

                const isStudentInSameSemesterAsDivision = await StudentSemester.findOne({
                    where: {
                        studentId: student.id,
                        semesterId: semester.id
                    },
                    transaction
                });

                if (!isStudentInSameSemesterAsDivision) {
                    errors.push({ studentId: student.id, error: "Student not in the same semester as division" });
                    continue;
                }

                // Check if student is already in this division
                const existingStudentDivision = await StudentDivision.findOne({
                    where: {
                        studentId: student.id,
                        divisionId: divisionId,
                        endDate: null
                    },
                    transaction
                });

                if (existingStudentDivision) {
                    errors.push({ studentId: student.id, error: "Student already in this division" });
                    continue;
                }

                studentDivisionData.push({
                    studentId: student.id,
                    divisionId: divisionId,
                    startDate: new Date().toISOString().split('T')[0]
                });

            } catch (error) {
                errors.push({ studentId: student.id, error: error.message });
            }
        }

        let created = [];
        if (studentDivisionData.length > 0) {
            created = await StudentDivision.bulkCreate(studentDivisionData, { transaction });
        }

        await transaction.commit();



        res.status(httpStatus.CREATED).json(
            new ApiResponse(
                httpStatus.CREATED,
                `Bulk addition to division completed. Added: ${created.length}, Errors: ${errors.length}`,
                {
                    created,
                    errors,
                    summary: {
                        total: studentIds.length,
                        added: created.length,
                        failed: errors.length
                    }
                }
            )
        );

    } catch (error) {
        await transaction.rollback();
        throw error;
    }
});

//* Bulk Add Students to Batch
const bulkAddStudentsToBatch = asyncHandler(async (req, res) => {
    const { studentIds, batchId } = req.body;

    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Student IDs array is required and must not be empty");
    }

    if (!batchId) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Batch ID is required");
    }



    const transaction = await sequelize.transaction();
    try {
        const batch = await Batch.findByPk(batchId, { transaction });
        if (!batch) {
            throw new ApiError(httpStatus.NOT_FOUND, "Batch not found");
        }

        const students = await Student.findAll({
            where: { id: { [Op.in]: studentIds } },
            transaction
        });

        if (students.length === 0) {
            throw new ApiError(httpStatus.NOT_FOUND, "No students found with provided IDs");
        }

        const studentBatchData = [];
        const errors = [];

        for (const student of students) {
            try {
                // Check if student is in the same division as the batch
                const division = await Division.findByPk(batch.divisionId, { transaction });

                const isStudentInSameDivisionAsBatch = await StudentDivision.findOne({
                    where: {
                        studentId: student.id,
                        divisionId: division.id,
                        endDate: null
                    },
                    transaction
                });

                if (!isStudentInSameDivisionAsBatch) {
                    errors.push({ studentId: student.id, error: "Student not in the same division as batch" });
                    continue;
                }

                // Check if student is already in any batch of this division
                const existingStudentBatch = await StudentBatch.findOne({
                    where: {
                        studentId: student.id,
                        endDate: null
                    },
                    include: [{
                        model: Batch,
                        where: { divisionId: division.id },
                        required: true
                    }],
                    transaction
                });

                if (existingStudentBatch) {
                    errors.push({ studentId: student.id, error: "Student already in a batch of this division" });
                    continue;
                }

                studentBatchData.push({
                    studentId: student.id,
                    batchId: batchId,
                    startDate: new Date().toISOString().split('T')[0]
                });

            } catch (error) {
                errors.push({ studentId: student.id, error: error.message });
            }
        }

        let created = [];
        if (studentBatchData.length > 0) {
            created = await StudentBatch.bulkCreate(studentBatchData, { transaction });
        }

        await transaction.commit();



        res.status(httpStatus.CREATED).json(
            new ApiResponse(
                httpStatus.CREATED,
                `Bulk addition to batch completed. Added: ${created.length}, Errors: ${errors.length}`,
                {
                    created,
                    errors,
                    summary: {
                        total: studentIds.length,
                        added: created.length,
                        failed: errors.length
                    }
                }
            )
        );

    } catch (error) {
        await transaction.rollback();
        throw error;
    }
});


//* Bulk Create Students from CSV
const bulkCreateStudentsFromCSV = asyncHandler(async (req, res) => {
    const csvFilePath = req?.file?.path;

    // Check if file exists
    if (!csvFilePath) {
        throw new ApiError(httpStatus.BAD_REQUEST, "CSV file is required");
    }

    // Helper function to clean up the file
    const cleanupFile = () => {
        if (csvFilePath && fs.existsSync(csvFilePath)) {
            fs.unlinkSync(csvFilePath);
        }
    };

    // Parse CSV file and collect rows
    const parseCSV = () => {
        return new Promise((resolve, reject) => {
            const rows = [];
            fs.createReadStream(csvFilePath)
                .pipe(csvParser())
                .on('data', (row) => {
                    rows.push(row);
                })
                .on('end', () => {
                    resolve(rows);
                })
                .on('error', (error) => {
                    reject(error);
                });
        });
    };

    let rows;
    try {
        rows = await parseCSV();
    } catch (error) {
        cleanupFile();
        throw new ApiError(httpStatus.BAD_REQUEST, `Error parsing CSV file: ${error.message}`);
    }

    // Check if CSV has any data
    if (!rows || rows.length === 0) {
        cleanupFile();
        throw new ApiError(httpStatus.BAD_REQUEST, "CSV file is empty or contains no valid data");
    }

    const validationErrors = [];
    const validatedStudents = [];

    // Validate each row using Joi schema
    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rowNumber = i + 2; // +2 because row 1 is header, and arrays are 0-indexed

        // Convert admissionYear to number if present
        if (row.admissionYear) {
            row.admissionYear = parseInt(row.admissionYear, 10);
        }

        // Validate row against schema
        const { error, value } = studentValidation.csvStudentRowSchema.validate(row, { abortEarly: false });

        if (error) {
            const errorMessages = error.details.map(detail => detail.message).join('; ');
            validationErrors.push({
                row: rowNumber,
                prn: row.prn || 'N/A',
                errors: errorMessages
            });
        } else {
            validatedStudents.push({ ...value, rowNumber });
        }
    }

    // If any validation errors, rollback and return errors
    if (validationErrors.length > 0) {
        cleanupFile();
        throw new ApiError(
            httpStatus.BAD_REQUEST,
            `Validation failed for ${validationErrors.length} row(s). No students were added.`,
            validationErrors
        );
    }

    // Start transaction for database operations
    const transaction = await sequelize.transaction();
    let transactionCommitted = false;

    try {
        // Collect all unique schemeIds and branchIds to validate
        const schemeIds = [...new Set(validatedStudents.map(s => s.schemeId))];
        const branchIds = [...new Set(validatedStudents.map(s => s.branchId))];
        const emails = validatedStudents.map(s => s.email.toLowerCase());
        const prns = validatedStudents.map(s => s.prn);
        const phoneNumbers = validatedStudents.map(s => s.phoneNumber);

        // Check for duplicate emails within CSV
        const emailSet = new Set();
        const duplicateEmails = [];
        for (const student of validatedStudents) {
            const lowerEmail = student.email.toLowerCase();
            if (emailSet.has(lowerEmail)) {
                duplicateEmails.push({ row: student.rowNumber, email: student.email });
            }
            emailSet.add(lowerEmail);
        }
        if (duplicateEmails.length > 0) {
            throw new ApiError(
                httpStatus.BAD_REQUEST,
                `Duplicate emails found within CSV file`,
                duplicateEmails
            );
        }

        // Check for duplicate PRNs within CSV
        const prnSet = new Set();
        const duplicatePrns = [];
        for (const student of validatedStudents) {
            if (prnSet.has(student.prn)) {
                duplicatePrns.push({ row: student.rowNumber, prn: student.prn });
            }
            prnSet.add(student.prn);
        }
        if (duplicatePrns.length > 0) {
            throw new ApiError(
                httpStatus.BAD_REQUEST,
                `Duplicate PRNs found within CSV file`,
                duplicatePrns
            );
        }

        // Validate all schemes exist
        const schemes = await Scheme.findAll({
            where: {},
            transaction
        });
        console.log(schemes)
        const foundSchemeIds = schemes.map(s => s.id);
        const missingSchemeIds = schemeIds.filter(id => !foundSchemeIds.includes(id));
        if (missingSchemeIds.length > 0) {
            throw new ApiError(
                httpStatus.NOT_FOUND,
                `The following scheme IDs do not exist: ${missingSchemeIds.join(', ')}`
            );
        }

        // Validate all branches exist
        const branches = await Branch.findAll({
            where: { id: { [Op.in]: branchIds } },
            transaction
        });
        const foundBranchIds = branches.map(b => b.id);
        const missingBranchIds = branchIds.filter(id => !foundBranchIds.includes(id));
        if (missingBranchIds.length > 0) {
            throw new ApiError(
                httpStatus.NOT_FOUND,
                `The following branch IDs do not exist: ${missingBranchIds.join(', ')}`
            );
        }

        // Check for existing emails in database
        const existingStudentsByEmail = await Student.findAll({
            where: { email: { [Op.in]: emails } },
            transaction
        });
        if (existingStudentsByEmail.length > 0) {
            const existingEmails = existingStudentsByEmail.map(s => s.email);
            throw new ApiError(
                httpStatus.BAD_REQUEST,
                `The following emails already exist in the database: ${existingEmails.join(', ')}`
            );
        }

        // Check for existing PRNs in database
        const existingStudentsByPrn = await Student.findAll({
            where: { prn: { [Op.in]: prns } },
            transaction
        });
        if (existingStudentsByPrn.length > 0) {
            const existingPrns = existingStudentsByPrn.map(s => s.prn);
            throw new ApiError(
                httpStatus.BAD_REQUEST,
                `The following PRNs already exist in the database: ${existingPrns.join(', ')}`
            );
        }

        // Check for existing phone numbers in database
        const existingStudentsByPhone = await Student.findAll({
            where: { phoneNumber: { [Op.in]: phoneNumbers } },
            transaction
        });
        if (existingStudentsByPhone.length > 0) {
            const existingPhones = existingStudentsByPhone.map(s => s.phoneNumber);
            throw new ApiError(
                httpStatus.BAD_REQUEST,
                `The following phone numbers already exist in the database: ${existingPhones.join(', ')}`
            );
        }

        // Prepare student data for bulk create
        const studentsToCreate = validatedStudents.map(student => {
            let dobForDB = null;
            if (student.dob) {
                dobForDB = moment(student.dob, "YYYY/MM/DD").toDate();
                if (new Date() < dobForDB) {
                    throw new ApiError(httpStatus.BAD_REQUEST, `Row ${student.rowNumber}: Date of birth cannot be in the future`);
                }
            }

            return {
                prn: student.prn,
                firstName: student.firstName,
                middleName: student.middleName || null,
                lastName: student.lastName,
                email: student.email.toLowerCase(),
                phoneNumber: student.phoneNumber,
                parentEmail: student.parentEmail || null,
                gender: student.gender,
                dob: dobForDB,
                studentImgUrl: null,
                studentImgPublicId: null,
                schemeId: student.schemeId,
                admissionYear: student.admissionYear,
                admissionType: student.admissionType,
                branchId: student.branchId
            };
        });

        // Bulk create students
        const createdStudents = await Student.bulkCreate(studentsToCreate, {
            transaction,
            individualHooks: true // This ensures password hashing via beforeCreate hook
        });

        await transaction.commit();
        transactionCommitted = true;
        cleanupFile();

        res.status(httpStatus.CREATED).json(
            new ApiResponse(
                httpStatus.CREATED,
                `Successfully created ${createdStudents.length} students from CSV`,
                {
                    createdCount: createdStudents.length,
                    students: createdStudents.map(s => ({
                        id: s.id,
                        prn: s.prn,
                        firstName: s.firstName,
                        lastName: s.lastName,
                        email: s.email
                    }))
                }
            )
        );

    } catch (error) {
        if (!transactionCommitted) {
            await transaction.rollback();
        }
        cleanupFile();
        throw error;
    }
});


export {
    getStudents,
    addStudent,
    updateStudentDetails,
    updateStudentPassword,
    updateStudentImage,
    removeStudentImage,
    removeStudent,
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
    getStudentDetailsById,
    getStudentSemestersById,
    getStudentDivisionsById,
    getStudentBatchesById,
    bulkCreateStudents,
    bulkDeleteStudents,
    bulkAddStudentsToSemester,
    bulkAddStudentsToDivision,
    bulkAddStudentsToBatch,
    bulkCreateStudentsFromCSV
}
