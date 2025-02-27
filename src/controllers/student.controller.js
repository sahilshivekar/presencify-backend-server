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


//* Get all students
const getStudents = asyncHandler(async (req, res) => {
    const {
        searchQuery,
        branchId,
        semesterNumber,
        academicStartYear,
        academicEndYear
    } = req.query;

    let searchClause = {};

    if (searchQuery) {
        searchClause = {
            [Op.or]: [
                { firstName: { [Op.iLike]: `%${searchQuery}%` } },
                { lastName: { [Op.iLike]: `%${searchQuery}%` } },
                { email: { [Op.iLike]: `%${searchQuery}%` } },
                { phoneNumber: { [Op.iLike]: `%${searchQuery}%` } },
                { prn: { [Op.iLike]: `%${searchQuery}%` } },
                { admissionYear: { [Op.iLike]: `%${searchQuery}%` } },
                { academicStatus: { [Op.iLike]: `%${searchQuery}%` } },
                { admissionType: { [Op.iLike]: `%${searchQuery}%` } },
            ]
        };
    }

    let filterClause = {};

    if (branchId) {
        filterClause.branchId = Number(branchId);
    }
    if (semesterNumber) {
        if (isNaN(Number(semesterNumber))) {
            throw new ApiError(400, "Semester number must be a number");
        }
        if (![1, 2, 3, 4, 5, 6, 7, 8].includes(Number(semesterNumber))) {
            throw new ApiError(400, "Invalid semester number");
        }
        filterClause.semesterNumber = semesterNumber;
    }
    if (academicStartYear) {
        if (isNaN(Number(academicStartYear))) {
            throw new ApiError(400, "Academic start year must be a number");
        }  
        filterClause.academicStartYear = academicStartYear;
    }
    if (academicEndYear) {
        if (isNaN(Number(academicEndYear))) {
            throw new ApiError(400, "Academic start year must be a number");
        }
        filterClause.academicEndYear = academicEndYear;
    }


    const students = await Student.findAll({
        where: searchClause,
        include: [
            {
                model: StudentSemester,
                required: true,
                include: [
                    {
                        model: Semester,
                        required: true,
                        where: filterClause,
                        include: [
                            {
                                model: Branch,
                                required: true
                            }
                        ]
                    }
                ]
            },
        ]
    });

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
        academicStatus
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
    };

    for (const fieldName in fields) {
        if (!fields[fieldName]) {
            if (studentImageLocalPath) fs.unlinkSync(studentImageLocalPath);
            throw new ApiError(400, `${fieldName} is required`);
        }
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
        schemeId
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

export {
    getStudents,
    addStudent,
    updateStudentDetails,
    updateStudentPassword,
    updateStudentImage,
    removeStudentImage,
    removeStudent
};
