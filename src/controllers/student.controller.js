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
import StudentBranch from '../db/models/studentBranch.model.js';
import StudentBatch from '../db/models/studentBatch.model.js';
import StudentDivision from '../db/models/studentDivision.model.js';
import Division from '../db/models/division.model.js';
import Batch from '../db/models/batch.model.js';

//* Get all students
const getStudents = asyncHandler(async (req, res) => {
    const {
        searchQuery,
        branchId,
        semesterNumber,
        academicStartYearOfSemester,
        academicEndYearOfSemester,
        batchId,
        schemeId,
        divisionId,
        academicStatus,
        admissionType,
        admissionYear,
        page = 1,
        limit = 10
    } = req.query;

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
                // { admissionYear: { [Op.iLike]: `%${searchQuery}%` } },
                // { academicStatus: { [Op.iLike]: `%${searchQuery}%` } },
                // { admissionType: { [Op.iLike]: `%${searchQuery}%` } },
            ]
        };
    }

    let admissionYearFilterClause = {};
    let academicStatusFilterClause = {};
    let admissionTypeFilterClause = {};
    let schemeFilterClause = {};
    let semesterFilterClause = {};
    let branchFilterClause = {};
    let divisionFilterClause = {};
    let batchFilterClause = {};

    if (admissionYear) {
        if (isNaN(Number(admissionYear))) {
            throw new ApiError(400, "Admission year must be a number");
        }
        admissionYearFilterClause.admissionYear = Number(admissionYear);
    }

    if (admissionType) {
        admissionTypeFilterClause.admissionType = admissionType;
    }

    if (academicStatus) {

        if(!['Active', 'Drop out', 'Graduated'].includes(academicStatus)) {
            throw new ApiError(400, "Invalid academic status. Must be 'Active', 'Drop out', 'Graduated'");
        }
        academicStatusFilterClause.academicStatus = academicStatus;
    }

    if (schemeId) {
        schemeFilterClause.id = Number(schemeId);
    }

    if (branchId) {
        branchFilterClause.branchId = Number(branchId);
    }

    if (semesterNumber) {
        if (isNaN(Number(semesterNumber))) {
            throw new ApiError(400, "Semester number must be a number");
        }
        if (![1, 2, 3, 4, 5, 6, 7, 8].includes(Number(semesterNumber))) {
            throw new ApiError(400, "Invalid semester number");
        }
        semesterFilterClause.semesterNumber = Number(semesterNumber);
    }

    if (academicStartYearOfSemester) {
        if (isNaN(Number(academicStartYearOfSemester))) {
            throw new ApiError(400, "Academic start year must be a number");
        }
        semesterFilterClause.academicStartYear = {
            [Op.gte]: academicStartYearOfSemester
        }
    }

    if (academicEndYearOfSemester) {
        if (isNaN(Number(academicEndYearOfSemester))) {
            throw new ApiError(400, "Academic end year must be a number");
        }
        if (Number(academicEndYearOfSemester) <= Number(academicStartYearOfSemester)) {
            throw new ApiError(400, "Academic end year must be greater than academic start year");
        }
        semesterFilterClause.academicEndYear = {
            [Op.lte]: academicEndYearOfSemester
        }
    }

    if (batchId) {
        batchFilterClause.batchId = Number(batchId);
    }

    if (divisionId) {
        divisionFilterClause.divisionId = Number(divisionId);
    }

    const students = await Student.findAll({
        where: {
            [Op.and]: [
                searchClause,
                admissionTypeFilterClause,
                academicStatusFilterClause,
                admissionYearFilterClause
            ]
        },
        include: [
            {
                model: StudentSemester,
                required: true,
                duplicating: false,
                include: [
                    {
                        model: Semester,
                        required: true,
                        where: semesterFilterClause,
                        duplicating: false,
                    }
                ]
            },
            {
                model: StudentBranch,
                required: true,
                where: branchFilterClause,
                duplicating: false,
                include: [
                    {
                        model: Branch,
                        required: true,
                        duplicating: false,
                    }
                ]
            },
            {
                model: StudentDivision,
                required: true,
                duplicating: false,
                where: divisionFilterClause,
                include: [
                    {
                        model: Division,
                        required: true,
                        duplicating: false,
                    }
                ]
            },
            {
                model: StudentBatch,
                required: true,
                duplicating: false,
                where: batchFilterClause,
                include: [
                    {
                        model: Batch,
                        required: true,
                        duplicating: false,
                    }
                ]
            },
            {
                model: Scheme,
                required: true,
                duplicating: false,
                where: schemeFilterClause,
            }
        ],
        offset: offset,
        limit: parseInt(limit, 10)
    });


    // const students = await Student.findAll({
    //     where: searchClause,
    //     include: [
    //         {
    //             model: StudentSemester,
    //             required: true,
    //             duplicating: false,
    //             include: [
    //                 {
    //                     model: Semester,
    //                     required: true,
    //                     where: filterClause,
    //                     duplicating: false,
    //                     include: [
    //                         {
    //                             model: Branch,
    //                             required: true,
    //                             duplicating: false,
    //                         }
    //                     ]
    //                 }
    //             ]
    //         },
    //     ],
    //     offset: offset,
    //     limit: parseInt(limit, 10)
    // });

    res.status(200).json(new ApiResponse(200, "Students retrieved successfully.", students));
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
        password,
        confirmPassword,
        schemeId,
        academicStatus,
        admissionYear,
        admissionType
    } = req.body;

    const studentImageLocalPath = req.file?.path;

    const fields = {
        "PRN": prn,
        "First Name": firstName,
        "Last Name": lastName,
        "Email": email,
        "Phone Number": phoneNumber,
        "Password": password,
        "Confirm Password": confirmPassword,
        "Academic Status": academicStatus,
        "Scheme": schemeId,
        "Admission Year": admissionYear,
        "Admission Type": admissionType
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

    if (password !== confirmPassword) {
        if (studentImageLocalPath) fs.unlinkSync(studentImageLocalPath);
        throw new ApiError(400, "Password and confirm password do not match");
    }

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

    if (schemeId) {
        const scheme = await Scheme.findByPk(schemeId)
        if (!scheme) {
            throw new ApiError(404, "Scheme not found")
        }
    }
    let studentImageUrl = null;
    let studentImagePublicId = null;

    if (studentImageLocalPath) {
        const studentImage = await uploadOnCloudinary(studentImageLocalPath);
        if (!studentImage?.url) {
            fs.unlinkSync(studentImageLocalPath);
            throw new ApiError(500, "Error uploading image");
        }
        studentImageUrl = studentImage.secure_url;
        studentImagePublicId = studentImage.public_id;
    }

    let dobForDB = null
    if (dob) {
        dobForDB = moment(dob, "DD/MM/YYYY").toDate();

        if (new Date() < dobForDB) {
            throw new ApiError(400, "Invalid date of birth")
        }
    }
    const addedStudent = await Student.create({
        prn,
        firstName,
        middleName: middleName || null,
        lastName,
        email,
        phoneNumber,
        gender: gender || null,
        dob: dobForDB,
        studentImgUrl: studentImageUrl,
        studentImgPublicId: studentImagePublicId,
        password,
        academicStatus,
        schemeId,
        admissionYear: Number(admissionYear) || null,
        admissionType: admissionType
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
    } = req.body;

    if (!id) throw new ApiError(400, "Student ID is required");

    const student = await Student.findByPk(id);
    if (!student) throw new ApiError(404, "Student not found");

    if (!isValidPhoneNumber(phoneNumber)) throw new ApiError(400, "Invalid phone number.");

    let dobForDB = null
    if (dob) {
        dobForDB = moment(dob, "DD/MM/YYYY").toDate();

        if (new Date() < dobForDB) {
            throw new ApiError(400, "Invalid date of birth")
        }
    }

    if (schemeId) {
        const scheme = await Scheme.findByPk(schemeId)
        if (!scheme) {
            throw new ApiError(404, "Scheme not found")
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

    const student = await Student.findByPk(studentId);

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

const getStudentBranchesById = asyncHandler(async (req, res) => {

    const { studentId } = req.query;

    if (!studentId) {
        throw new ApiError(400, "Student id is required");
    }

    const student = await Student.findByPk(studentId);

    if (!student) throw new ApiError(404, "Student not found");

    const studentBranches = await StudentBranch.findAll({
        where: {
            studentId: studentId
        },
        include: [
            {
                model: Branch,
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
                studentBranches
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
                "Student fetched successfully",
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
                "Student fetched successfully",
                studentBatches
            )
        );
})


const addStudentToBranch = asyncHandler(async (req, res) => {
    const { studentId, branchId } = req.body;

    if (!studentId) {
        throw new ApiError(400, "Student id is required");
    }

    if (!branchId) {
        throw new ApiError(400, "Branch id is required");
    }

    const student = await Student.findByPk(studentId);

    if (!student) {
        throw new ApiError(404, "Student not found");
    }

    const branch = await Branch.findByPk(branchId);

    if (!branch) {
        throw new ApiError(404, "Branch not found");
    }

    const alreadyExists = await StudentBranch.findOne({
        where: {
            studentId: studentId
        }
    });

    if (alreadyExists) {
        const anotherBranchId = alreadyExists.branchId
        const branch = await Branch.findByPk(anotherBranchId)
        throw new ApiError(400, `Student is already present in ${branch.name} branch`);
    }

    const studentBranchEntry = await StudentBranch.create({
        studentId: studentId,
        branchId: branchId,
        academicStartYear: student.admissionYear,
        academicEndYear: student.admissionType === "FE" ? student.admissionYear + 4 : student.admissionYear + 3
    });

    res
        .status(200)
        .json(
            new ApiResponse(
                200,
                "Student added successfully",
                studentBranchEntry
            )
        );
});


const removeStudentFromBranch = asyncHandler(async (req, res) => {
    const { studentBranchId } = req.body;

    if (!studentBranchId) {
        throw new ApiError(400, "StudentBranch id is required");
    }

    const studentBranch = await StudentBranch.findByPk(studentBranchId);

    if (!studentBranch) {
        throw new ApiError(404, "Student's record with given id not found");
    }

    await studentBranch.destroy();

    res
        .status(200)
        .json(
            new ApiResponse(
                200,
                `Student is removed from the branch`,
                null
            )
        );
});

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

    const studentBranch = await StudentBranch.findOne({
        where: {
            studentId: studentId,
            branchId: semester.branchId
        }
    });

    if (!studentBranch) {
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
                    academicEndYear: semester.academicEndYear
                }
            }
        ]
    });

    if (alreadyExistsInOtherSemesterForSameAcademicYear) {
        throw new ApiError(400, `Student is already present in another semester for the same academic year`);
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
        startDate: new Date(),
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
    const { studentDivisionId, divisionId } = req.body;

    if (!studentDivisionId || !divisionId) {
        throw new Error("StudentDivision ID or Division ID is not provided");
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
        throw new ApiError(400, "Student is not present in the same semester as the division")
    }

    const newDate = new Date();

    studentDivision.endDate = newDate;

    await studentDivision.save();

    const newStudentDivision = await StudentDivision.create({
        studentId: studentDivision.studentId,
        divisionId: divisionId,
        startDate: newDate
    });

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
        throw new ApiError(400, "Student is already present in this division")
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
            }
        }
    })

    if (studentPresentInOtherBatches) {
        throw new ApiError(400, "Student is already present in other batches of the same division. Please use the change division feature for moving student to different batch.")
    }

    const studentBatchEntry = await StudentBatch.create({
        studentId: studentId,
        batchId: batchId,
        startDate: new Date(),
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

    const { studentBatchId, batchId } = req.body;

    if (!studentBatchId || !batchId) {
        throw new Error("StudentBatch ID or Batch ID is not provided");
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

    const newDate = new Date();

    studentBatch.endDate = newDate;

    await studentBatch.save();

    const newStudentBatch = await StudentBatch.create({
        studentId: studentBatch.studentId,
        batchId: batchId,
        startDate: newDate
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
    addStudentToBranch,
    removeStudentFromBranch,
    addStudentToSemester,
    removeStudentFromSemester,
    addStudentToDivision,
    changeStudentDivision,
    addStudentToBatch,
    changeStudentBatch,
    getStudentDetailsById,
    getStudentBranchesById,
    getStudentSemestersById,
    getStudentDivisionsById,
    getStudentBatchesById
}
