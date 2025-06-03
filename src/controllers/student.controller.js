import { Op } from 'sequelize';
import { asyncHandler } from '../utils/asyncHandler.js';
import fs from 'fs';
import Student from '../db/models/student.model.js'
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { uploadOnCloudinary, deleteFromCloudinary } from '../utils/cloudinary.js';
import { isValidPhoneNumber, parsePhoneNumberWithError } from 'libphonenumber-js';
import Scheme from "../db/models/scheme.model.js"
import moment from "moment"
import Semester from '../db/models/semester.model.js';
import StudentSemester from '../db/models/studentSemester.model.js';
import Branch from '../db/models/branch.model.js';
import StudentBatch from '../db/models/studentBatch.model.js';
import StudentDivision from '../db/models/studentDivision.model.js';
import Division from '../db/models/division.model.js';
import Batch from '../db/models/batch.model.js';
import { get } from 'http';
import { getDateStringFromObj } from "../utils/date.js";
import Dropout from '../db/models/dropout.model.js'

//* Get all students
const getStudents = asyncHandler(async (req, res) => {
    let {
        searchQuery,
        branchIds,
        semesterNumbers,
        academicStartYearOfSemester,
        academicEndYearOfSemester,
        batchId,
        schemeId,
        divisionId,
        academicStartYearOfDropYear,
        academicEndYearOfDropYear,
        // academicStatuses,
        admissionTypes,
        admissionYear,
        currentBatch, // can be true or false 
        currentDivision, // can be true or false
        currentSemester, // can be true or false
        divisionCode,
        batchCode,
        page = 1,
        limit = 10
    } = req.query;

    // converting form data raw values to arrays bcz if there is only one value in parameter then it will not be converted to array
    if (branchIds && !Array.isArray(branchIds)) {
        branchIds = [branchIds];
    }
    // if (academicStatuses && !Array.isArray(academicStatuses)) {
    //     academicStatuses = [academicStatuses];
    // }
    if (semesterNumbers && !Array.isArray(semesterNumbers)) {
        semesterNumbers = [semesterNumbers];
    }
    if (semesterNumbers) {
        // here it will be already a array
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
    // let academicStatusFilterClause = {};
    let admissionTypeFilterClause = {};
    let schemeFilterClause = {};
    let branchFilterClause = {};

    if (admissionYear) {
        if (isNaN(Number(admissionYear))) {
            throw new ApiError(400, "Admission year must be a number");
        }
        admissionYearFilterClause.admissionYear = {
            [Op.eq]: Number(admissionYear)
        }
    }

    if (admissionTypes) {
        admissionTypeFilterClause.admissionType = {
            [Op.in]: admissionTypes
        };
    }

    // ! here 
    // if (academicStatuses) {
    //     academicStatuses.forEach(academicStatus => {
    //         if (!['Active', 'Drop out', 'Graduated'].includes(academicStatus)) {
    //             throw new ApiError(400, "Invalid academic status. Must be 'Active', 'Drop out', 'Graduated'");
    //         }
    //     })
    //     academicStatusFilterClause.academicStatus = {
    //         [Op.in]: academicStatuses
    //     };
    // }

    if (schemeId) {
        schemeFilterClause.id = Number(schemeId);
    }

    if (branchIds) {
        branchFilterClause.branchId = {
            [Op.in]: branchIds.map(branchId => Number(branchId))
        };
    }

    if (semesterNumbers) {
        semesterNumbers.forEach(semesterNumber => {
            if (isNaN(Number(semesterNumber))) {
                throw new ApiError(400, "Semester number must be a number");
            }
            if (![1, 2, 3, 4, 5, 6, 7, 8].includes(Number(semesterNumber))) {
                throw new ApiError(400, "Invalid semester number");
            }
        })
    }

    if (academicStartYearOfSemester) {
        if (isNaN(Number(academicStartYearOfSemester))) {
            throw new ApiError(400, "Academic start year must be a number");
        }
        academicStartYearOfSemester = Number(academicStartYearOfSemester)
    }

    if (academicEndYearOfSemester) {
        if (isNaN(Number(academicEndYearOfSemester))) {
            throw new ApiError(400, "Academic end year must be a number");
        }
        if (academicStartYearOfSemester && !isNaN(Number(academicStartYearOfSemester))) {
            if (Number(academicEndYearOfSemester) <= Number(academicStartYearOfSemester)) {
                throw new ApiError(400, "Academic end year must be greater than academic start year");
            }
        }
        academicEndYearOfSemester = Number(academicEndYearOfSemester)
    }

    const currentDate = new Date()

    const students = await Student.findAndCountAll({
        where: {
            [Op.and]: [
                searchClause,
                admissionTypeFilterClause,
                // academicStatusFilterClause, //! here
                admissionYearFilterClause,
                branchFilterClause
            ]
        },
        distinct: true,
        include: [
            {
                model: StudentSemester,
                required: semesterNumbers || academicStartYearOfSemester || academicEndYearOfSemester ? true : false,
                duplicating: false,
                include: [
                    {
                        model: Semester,
                        required: semesterNumbers || academicStartYearOfSemester || academicEndYearOfSemester ? true : false,
                        where: {
                            [Op.and]: [
                                ...(semesterNumbers ? [{
                                    semesterNumber: {
                                        [Op.in]: semesterNumbers
                                    }
                                }] : []),
                                ...(currentSemester == 'true' ? [{
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
                        ...(divisionId ? [{ divisionId: Number(divisionId) }] : []),
                        ...(currentDivision == 'true' ? [{ endDate: null }] : []) // need to write true in 
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
                required: batchCode || batchId == {} ? true : false,
                duplicating: false,
                where: {
                    [Op.and]: [
                        ...(batchId ? [{ batchId: Number(batchId) }] : []),
                        ...(currentBatch == 'true' ? [{ endDate: null }] : [])
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
                required: academicEndYearOfDropYear || academicStartYearOfDropYear ? true : false,
                duplicating: false,
                where: {
                    [Op.and]: [
                        ...(academicEndYearOfDropYear ? [{
                            academicEndYear: { [Op.lte]: academicEndYearOfDropYear }
                        }] : []),
                        ...(academicStartYearOfDropYear ? [{
                            academicStartYear: { [Op.gte]: academicStartYearOfDropYear }
                        }] : [])
                    ]
                }
            }
        ],
        offset: offset,
        limit: parseInt(limit, 10)
    });
    const studentNames = students.rows.map(student => student.firstName + " " + student.lastName);
    console.log(studentNames)
    console.log("rows length", students.rows.length)
    console.log("count from returned object", students.count)
    res
        .status(200)
        .json(
            new ApiResponse(
                200,
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
        // password,
        // confirmPassword,
        schemeId,
        academicStatus,
        admissionYear,
        admissionType,
        branchId,
        parentEmail
    } = req.body;
    const studentImageLocalPath = req?.file?.path
    const fields = {
        "PRN": prn,
        "First Name": firstName,
        "Last Name": lastName,
        "Email": email,
        "Phone Number": phoneNumber,
        // "Password": password,
        // "Confirm Password": confirmPassword,
        "Academic Status": academicStatus,
        "Scheme": schemeId,
        "Admission Year": admissionYear,
        "Admission Type": admissionType,
        "Branch ID": branchId
    };

    for (const fieldName in fields) {
        if (!fields[fieldName]) {
            if (studentImageLocalPath) fs.unlinkSync(studentImageLocalPath);
            throw new ApiError(400, `${fieldName} is required`);
        }
    }

    if (isNaN(Number(admissionYear))) {
        if (studentImageLocalPath) fs.unlinkSync(studentImageLocalPath);
        throw new ApiError(400, "Admission year must be a number");
    }

    // if (password !== confirmPassword) {
    //     if (studentImageLocalPath) fs.unlinkSync(studentImageLocalPath);
    //     throw new ApiError(400, "Password and confirm password do not match");
    // }

    if (!['Male', 'Female', 'Other'].includes(gender)) {
        if (studentImageLocalPath) fs.unlinkSync(studentImageLocalPath);
        throw new ApiError(400, "Invalid gender value. Must be Male, Female, or Other");
    }

    if (!['Active', 'Drop out', 'Graduated'].includes(academicStatus)) {
        if (studentImageLocalPath) fs.unlinkSync(studentImageLocalPath);
        throw new ApiError(400, "Invalid academic status. Must be 'Active', 'Drop out', 'Graduated'");
    }

    if (!isValidPhoneNumber(phoneNumber)) {
        if (studentImageLocalPath) fs.unlinkSync(studentImageLocalPath);
        throw new ApiError(400, "Invalid phone number.");
    }

    const existingStudent = await Student.findOne({ where: { email } });

    if (existingStudent) {
        if (studentImageLocalPath) fs.unlinkSync(studentImageLocalPath);
        throw new ApiError(400, "A student with this email already exists");
    }

    const scheme = await Scheme.findByPk(schemeId)
    if (!scheme) {
        if (studentImageLocalPath) fs.unlinkSync(studentImageLocalPath);
        throw new ApiError(404, "Scheme not found")
    }

    const branch = await Branch.findByPk(branchId)
    if (!branch) {
        if (studentImageLocalPath) fs.unlinkSync(studentImageLocalPath);
        throw new ApiError(404, "Branch not found")
    }

    let studentImageUrl = null;
    let studentImagePublicId = null;

    if (studentImageLocalPath) {
        const studentImage = await uploadOnCloudinary(studentImageLocalPath);
        if (!studentImage?.url) {
            throw new ApiError(500, "Error uploading image");
        }
        studentImageUrl = studentImage.secure_url;
        studentImagePublicId = studentImage.public_id;
    }

    let dobForDB = null
    if (dob) {
        dobForDB = moment(dob, "YYYY/MM/DD").toDate();

        if (new Date() < dobForDB) {
            throw new ApiError(400, "Date of birth cannot be in the future")
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
        // password,
        academicStatus,
        schemeId,
        admissionYear: Number(admissionYear) || null,
        admissionType: admissionType,
        branchId: branchId
    });

    res.status(201).json(new ApiResponse(201, "Student added successfully", { student: addedStudent }));
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
        academicStatus,
        branchId,
        parentEmail
    } = req.body;

    if (!id) throw new ApiError(400, "Student ID is required");

    const student = await Student.findByPk(id);
    if (!student) throw new ApiError(404, "Student not found");

    if (!isValidPhoneNumber(phoneNumber)) throw new ApiError(400, "Invalid phone number.");

    let dobForDB = null
    if (dob) {
        dobForDB = moment(dob, "YYYY/MM/DD").toDate();

        if (new Date() < dobForDB) {
            throw new ApiError(400, "Date of birth cannot be in the future")
        }
    }

    if (schemeId) {
        const scheme = await Scheme.findByPk(schemeId)
        if (!scheme) {
            throw new ApiError(404, "Scheme not found")
        }
    }

    if (branchId) {
        const branch = await Branch.findByPk(branchId)
        if (!branch) {
            throw new ApiError(404, "Branch not found")
        }
    }

    student.firstName = firstName || student.firstName;
    student.middleName = middleName || student.middleName;
    student.lastName = lastName || student.lastName;
    student.email = email || student.email;
    student.gender = gender || student.gender;
    student.phoneNumber = phoneNumber || student.phoneNumber;
    student.dob = dobForDB || student.dob;
    student.academicStatus = academicStatus || student.academicStatus;
    student.schemeId = schemeId || student.schemeId;
    student.branchId = branchId || student.branchId;
    student.parentEmail = parentEmail || student.parentEmail;

    await student.save();

    res.status(200).json(new ApiResponse(200, "Student updated successfully", student));
});

//* Update student password
const updateStudentPassword = asyncHandler(async (req, res) => {
    const { id, password, confirmPassword } = req.body;

    if (!id) throw new ApiError(400, "Student ID is required");

    const student = await Student.findByPk(id);
    if (!student) throw new ApiError(404, "Student not found");

    if (password !== confirmPassword) throw new ApiError(400, "Password and confirm password do not match");

    student.password = password;
    await student.save();

    res.status(200).json(new ApiResponse(200, "Student password updated successfully", student));
});

//* Update student image
const updateStudentImage = asyncHandler(async (req, res) => {
    const { id } = req.body;
    const studentImageLocalPath = req.file?.path;

    if (!id) {
        if (studentImageLocalPath) fs.unlinkSync(studentImageLocalPath);
        throw new ApiError(400, "Student ID is required");
    }

    const student = await Student.findByPk(id);
    if (!student) {
        if (studentImageLocalPath) fs.unlinkSync(studentImageLocalPath);
        throw new ApiError(404, "Student not found");
    }

    if (!studentImageLocalPath) throw new ApiError(400, "Student image file is required");

    const uploadedImageResponse = await uploadOnCloudinary(studentImageLocalPath);
    if (!uploadedImageResponse?.url) throw new ApiError(500, "Error uploading image");

    student.studentImgUrl = uploadedImageResponse.secure_url;
    student.studentImgPublicId = uploadedImageResponse.public_id;

    await student.save();

    res.status(200).json(new ApiResponse(200, "Student image updated successfully", student));
});

//* Remove student image
const removeStudentImage = asyncHandler(async (req, res) => {
    const { id } = req.body;

    if (!id) throw new ApiError(400, "Student ID is required");

    const student = await Student.findByPk(id);
    if (!student) throw new ApiError(404, "Student not found");

    if (student.studentImgPublicId == null) throw new ApiError(400, "There is no student image uploaded to remove");
    const deletedImage = await deleteFromCloudinary(student.studentImgPublicId);
    if (!deletedImage) throw new ApiError(500, "Error deleting image");

    student.studentImgUrl = null;
    student.studentImgPublicId = null;

    await student.save();

    res.status(200).json(new ApiResponse(200, "Student image deleted successfully", student));
});

//* Remove student
const removeStudent = asyncHandler(async (req, res) => {
    const { id } = req.body;

    if (!id) throw new ApiError(400, "Student ID is required");

    const student = await Student.findByPk(id);
    if (!student) throw new ApiError(404, "Student not found");

    await deleteFromCloudinary(student.studentImagePublicId);
    await student.destroy();

    res.status(200).json(new ApiResponse(200, "Student deleted successfully", null));
});

const getStudentDetailsById = asyncHandler(async (req, res) => {
    const { studentId } = req.query;

    if (!studentId) {
        throw new ApiError(400, "Student id is required");
    }

    const student = await Student.findOne({
        where: {
            id: studentId
        },
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

    if (!student) throw new ApiError(404, "Student not found");

    res
        .status(200)
        .json(
            new ApiResponse(
                200,
                "Student fetched successfully",
                student
            )
        );
});


const getStudentSemestersById = asyncHandler(async (req, res) => {
    const { studentId } = req.query;

    if (!studentId) {
        throw new ApiError(400, "Student id is required");
    }

    const student = await Student.findByPk(studentId);

    if (!student) throw new ApiError(404, "Student not found");

    const studentSemesters = await StudentSemester.findAll({
        where: {
            studentId: studentId
        },
        include: [
            {
                model: Semester,
                required: true
            }
        ]
    });

    res
        .status(200)
        .json(
            new ApiResponse(
                200,
                "Student fetched successfully",
                studentSemesters
            )
        );
})

const getStudentDivisionsById = asyncHandler(async (req, res) => {
    const { studentId, semesterNumber } = req.query;

    if (!studentId) {
        throw new ApiError(400, "Student id is required");
    }

    const student = await Student.findByPk(studentId);

    if (!student) throw new ApiError(404, "Student not found");

    const semesterNumberClause = {}

    if (semesterNumber && isNaN(Number(semesterNumber))) {
        throw new ApiError(400, "Semester number must be a number");
    }

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
        .status(200)
        .json(
            new ApiResponse(
                200,
                "Student's divisions fetched successfully",
                studentDivisions
            )
        );
})

const getStudentBatchesById = asyncHandler(async (req, res) => {
    const { studentId, semesterNumber } = req.query;

    if (!studentId) {
        throw new ApiError(400, "Student id is required");
    }

    const student = await Student.findByPk(studentId);

    if (!student) throw new ApiError(404, "Student not found");

    const semesterNumberClause = {}

    if (semesterNumber && isNaN(Number(semesterNumber))) {
        throw new ApiError(400, "Semester number must be a number");
    }

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
        .status(200)
        .json(
            new ApiResponse(
                200,
                "Student's batches fetched successfully",
                studentBatches
            )
        );
})


const addStudentToSemester = asyncHandler(async (req, res) => {
    const { studentId, semesterId } = req.body;

    if (!studentId || !semesterId) {
        throw new ApiError(400, "Student id and semester id are required");
    }

    const student = await Student.findByPk(studentId);

    if (!student) {
        throw new ApiError(404, "Student not found");
    }

    const semester = await Semester.findByPk(semesterId);

    if (!semester) {
        throw new ApiError(404, "Semester not found");
    }


    if (student.branchId !== semester.branchId) {
        throw new ApiError(400, `Student is not present in the same branch as the semester`)
    }

    const alreadyExists = await StudentSemester.findOne({
        where: {
            studentId: studentId,
            semesterId: semesterId
        }
    });

    if (alreadyExists) {
        throw new ApiError(400, `Student is already present in this semester`);
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
        throw new ApiError(400, `Student is already added in other semester of another year for the same academic year`);
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
        throw new ApiError(400, `Student is in drop-out list for the same academic year of semester's`)
    }

    const studentSemesterEntry = await StudentSemester.create({
        studentId: studentId,
        semesterId: semesterId
    });

    res
        .status(200)
        .json(
            new ApiResponse(
                200,
                "Student added successfully",
                studentSemesterEntry
            )
        );
});

const removeStudentFromSemester = asyncHandler(async (req, res) => {
    const { studentSemesterId } = req.body;

    if (!studentSemesterId) {
        throw new ApiError(400, "StudentSemester id is required");
    }

    const studentSemester = await StudentSemester.findByPk(studentSemesterId);

    if (!studentSemester) {
        throw new ApiError(404, "StudentSemester not found");
    }
    const divisionsThatBelongToThisSemester = await Division.findAll({
        where: {
            semesterId: studentSemester.semesterId
        }
    });

    await StudentDivision.destroy({
        where: {
            studentId: studentSemester.studentId,
            divisionId: {
                [Op.in]: divisionsThatBelongToThisSemester.map(division => division.id)
            }
        }
    });


    const batchesOfCurrentSemester = await Batch.findAll({
        where: {
            divisionId: {
                [Op.in]: divisionsThatBelongToThisSemester.map(division => division.id)
            }
        }
    });

    await StudentBatch.destroy({
        where: {
            studentId: studentSemester.studentId,
            batchId: {
                [Op.in]: batchesOfCurrentSemester.map(batch => batch.id)
            }
        }
    })

    if (!studentSemester) {
        throw new ApiError(404, "StudentSemester entry with given Id is not found");
    }

    await studentSemester.destroy();

    res
        .status(200)
        .json(
            new ApiResponse(
                200,
                `Student is removed from the semester`,
                null
            )
        );
});

const addStudentToDivision = asyncHandler(async (req, res) => {
    const { studentId, divisionId } = req.body;

    if (!studentId || !divisionId) {
        throw new ApiError(400, "Student id and division id are required");
    }

    const student = await Student.findByPk(studentId);

    if (!student) {
        throw new ApiError(404, "Student not found");
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
        throw new ApiError(400, "Student is not present in the same semester as the division")
    }

    const alreadyExists = await StudentDivision.findOne({
        where: {
            studentId: studentId,
            divisionId: divisionId,
            endDate: null
        }
    });

    if (alreadyExists) {
        throw new ApiError(400, "Student is already present in this division")
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
        throw new ApiError(400, "Student is already present in other divisions of the same semester. Please use the change division feature for moving student to different divsion.")
    }

    const studentDivisionEntry = await StudentDivision.create({
        studentId: studentId,
        divisionId: divisionId,
        startDate: semester.startDate,
    });


    res
        .status(200)
        .json(
            new ApiResponse(
                200,
                "Student added successfully",
                studentDivisionEntry
            )
        );

});

const changeStudentDivision = asyncHandler(async (req, res) => {
    const { studentDivisionId, divisionId, newDivisionStartDate } = req.body;

    if (!studentDivisionId || !divisionId) {
        throw new Error("StudentDivision ID or Division ID is not provided");
    }

    if (!newDivisionStartDate) {
        throw new ApiError(400, "New division start date is required");
    }

    const studentDivision = await StudentDivision.findByPk(studentDivisionId);

    if (!studentDivision) {
        throw new Error("Student's previous division is not found");
    }

    if (studentDivision.endDate != null) {
        throw new Error("Invalid previous division.");
    }

    const division = await Division.findByPk(divisionId);

    if (!division) {
        throw new Error("Division is not found");
    }


    if (studentDivision.divisionId === divisionId) {
        throw new Error("Student's new division can't be same as previous division");
    }

    const isStudentInSameSemesterAsDivision = await StudentSemester.findOne({
        where: {
            studentId: studentDivision.studentId,
            semesterId: division.semesterId
        }
    });

    if (!isStudentInSameSemesterAsDivision) {
        throw new ApiError(400, "Student is not present in the same semester as the new division")
    }

    const startDateOfNewDivision = new Date(newDivisionStartDate);

    if (isNaN(startDateOfNewDivision.getTime())) {
        throw new ApiError(400, "Invalid date format for new division start date");
    }

    const semester = await Semester.findByPk(division.semesterId);

    if (startDateOfNewDivision.toISOString().split('T')[0] <= studentDivision.startDate) {
        throw new ApiError(400, "New division start date cannot be lesser than or same as previous division start date");
    }

    if (startDateOfNewDivision.toISOString().split('T')[0] >= semester.endDate) {
        throw new ApiError(400, "New division start date cannot be greater than end date of the semester");
    }

    const endDateOfPrevDivision = new Date(startDateOfNewDivision.getFullYear(), startDateOfNewDivision.getMonth(), startDateOfNewDivision.getDate() - 1);

    // console.log("in the start end date object creations")
    // console.log(startDateOfNewDivision)
    // console.log(endDateOfPrevDivision) // this will print date as 30
    // console.log(endDateOfPrevDivision.getDate()) // this will print date as 31 bcz of the way its printing the whole date in iso

    const batchesOfCurrentDivision = await Batch.findAll({
        where: {
            divisionId: studentDivision.divisionId,
        }
    });

    // removing student from his previous batch of the previous division
    const studentBatch = await StudentBatch.findOne({
        where: {
            studentId: studentDivision.studentId,
            batchId: {
                [Op.in]: batchesOfCurrentDivision.map(batch => batch.id),
            },
            endDate: null
        }
    });

    if (studentBatch) {
        // if the admin adds the student in a diff batch in the future date.
        // then the student batch added for future will be deleted and there previous batch's end date will be set to end date of the previous division
        if (studentBatch.startDate > startDateOfNewDivision.toISOString().split('T')[0]) {

            const futureBatchStartDateObj = new Date(studentBatch.startDate)
            const prevBatchEndDateObj = new Date(futureBatchStartDateObj.getFullYear(), futureBatchStartDateObj.getMonth(), futureBatchStartDateObj.getDate());

            // console.log(`prev date: ${prevBatchEndDateObj.toISOString()}`) // this will print privious date even if i haven't did getDate() - 1 in the expression the reason is during creation its getting created locally and the printing is done in iso format
            // console.log(`future start date: ${futureBatchStartDateObj.toISOString()}`)

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
                ]
            });

            // console.log(`future batch is ${studentBatch.toJSON()}`)
            if (previousBatch) {
                // console.log(`previous batch is ${previousBatch.toJSON()}`)
            } else {
                // console.log("prev batch is null")
            }

            await studentBatch.destroy();

            if (previousBatch) {
                // console.log(`setting end date of prev batch to ${endDateOfPrevDivision}`)
                previousBatch.endDate = endDateOfPrevDivision;
                await previousBatch.save();
            }
        } else {
            studentBatch.endDate = endDateOfPrevDivision;
            await studentBatch.save();
        }
    }

    // console.log(`setting end date of prev division to ${endDateOfPrevDivision}`)
    studentDivision.endDate = endDateOfPrevDivision;

    await studentDivision.save();


    const newStudentDivision = await StudentDivision.create({
        studentId: studentDivision.studentId,
        divisionId: divisionId,
        startDate: startDateOfNewDivision
    });

    if (!newStudentDivision) {
        throw new ApiError(500, "Some issue occured while changing division");
    }

    res
        .status(200)
        .json(
            new ApiResponse(
                200,
                "Student's division is changed successfully",
                newStudentDivision
            )
        );

});

const addStudentToBatch = asyncHandler(async (req, res) => {
    const { studentId, batchId } = req.body;

    if (!studentId || !batchId) {
        throw new ApiError(400, "Student id and batch id are required");
    }

    const student = await Student.findByPk(studentId);

    if (!student) {
        throw new ApiError(404, "Student not found");
    }

    const batch = await Batch.findByPk(batchId);

    if (!batch) {
        throw new ApiError(404, "Batch not found");
    }

    const isStudentInSameDivisionAsBatch = await StudentDivision.findOne({
        where: {
            studentId: studentId,
            divisionId: batch.divisionId,
            endDate: null
        }
    });

    if (!isStudentInSameDivisionAsBatch) {
        throw new ApiError(400, "Student is not present in the same division as the batch")
    }


    const alreadyExists = await StudentBatch.findOne({
        where: {
            studentId: studentId,
            batchId: batchId,
            endDate: null
        }
    });

    if (alreadyExists) {
        throw new ApiError(400, "Student is already present in this batch")
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
        throw new ApiError(400, "Student is already present in other batches of the same division. Please use the change division feature for moving student to different batch.")
    }

    const studentBatchEntry = await StudentBatch.create({
        studentId: studentId,
        batchId: batchId,
        startDate: isStudentInSameDivisionAsBatch.startDate,
    });

    res
        .status(200)
        .json(
            new ApiResponse(
                200,
                "Student added to batch successfully",
                studentBatchEntry
            )
        );

});

const changeStudentBatch = asyncHandler(async (req, res, next) => {

    const { studentBatchId, batchId, newBatchStartDate } = req.body;

    if (!studentBatchId || !batchId) {
        throw new Error("StudentBatch ID or Batch ID is not provided");
    }

    if (!newBatchStartDate) {
        throw new ApiError(400, "New batch start date is required");
    }

    const studentBatch = await StudentBatch.findByPk(studentBatchId);

    if (!studentBatch) {
        throw new Error("Student's previous batch is not found");
    }

    if (studentBatch.endDate != null) {
        throw new Error("Invalid previous batch.");
    }

    const batch = await Batch.findByPk(batchId);

    if (!batch) {
        throw new Error("Batch is not found");
    }

    if (studentBatch.batchId === batchId) {
        throw new Error("Student's new batch can't be same as previous batch");
    }

    const isStudentInSameDivisionAsBatch = await StudentDivision.findOne({
        where: {
            studentId: studentBatch.studentId,
            divisionId: batch.divisionId,
            endDate: null
        }
    });

    if (!isStudentInSameDivisionAsBatch) {
        throw new ApiError(400, "Student is not present in the same division as the batch")
    }

    const division = await Division.findByPk(batch.divisionId);
    const semester = await Semester.findByPk(division.semesterId);

    const startDateOfNewBatch = new Date(newBatchStartDate);

    if (isNaN(startDateOfNewBatch.getTime())) {
        throw new ApiError(400, "Invalid date format for new division start date");
    }

    if (startDateOfNewBatch.toISOString().split('T')[0] > semester.endDate) {
        throw new ApiError(400, "New batch start date cannot be greater than end date of the semester");
    }

    if (startDateOfNewBatch.toISOString().split('T')[0] <= studentBatch.startDate) {
        throw new ApiError(400, "New batch start date cannot be lesser than or same as previous batch start date");
    }

    const endDateOfPrevBatch = new Date(startDateOfNewBatch.getFullYear(), startDateOfNewBatch.getMonth(), startDateOfNewBatch.getDate() - 1);

    if (studentBatch.startDate >= startDateOfNewBatch.toISOString().split('T')[0]) {
        throw new ApiError(400, "New batch start date cannot be lesser than or same as previous batch start date");
    }

    studentBatch.endDate = endDateOfPrevBatch;

    await studentBatch.save();

    const newStudentBatch = await StudentBatch.create({
        studentId: studentBatch.studentId,
        batchId: batchId,
        startDate: startDateOfNewBatch
    });

    res
        .status(200)
        .json(
            new ApiResponse(
                200,
                "Student's batch is changed successfully",
                newStudentBatch
            )
        );

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
