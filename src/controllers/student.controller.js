import { Op } from 'sequelize';
import { asyncHandler } from '../utils/asyncHandler.js';
import fs from 'fs';
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
        getAll = false
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
                required: divisionId || divisionCode ? true : false,
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
                        required: divisionId || divisionCode ? true : false,
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
                required: batchCode || batchId ? true : false,
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
                        required: batchCode || batchId ? true : false,
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
    if(addedStudent){
        console.log("student added")
        console.log(addedStudent)
    }
    res.status(httpStatus.CREATED).json(new ApiResponse(httpStatus.CREATED, "Student added successfully", addedStudent));
});


//* Update student details
const updateStudentDetails = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const {
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
    console.log(student)
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
        throw new ApiError(httpStatus.BAD_REQUEST, `Student is already added in other semester of another year for the same academic year`);
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
        throw new ApiError(httpStatus.BAD_REQUEST, "Student is already present in other divisions of the same semester. Please use the change division feature for moving student to different divsion.")
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
        throw new ApiError(httpStatus.BAD_REQUEST, "Student is already present in other batches of the same division. Please use the change division feature for moving student to different batch.")
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
    addStudentToBatch,
    changeStudentBatch,
    getStudentDetailsById,
    getStudentSemestersById,
    getStudentDivisionsById,
    getStudentBatchesById
}
