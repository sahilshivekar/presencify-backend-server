import Staff from '../db/models/staff.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js'
import { ApiError } from '../utils/ApiError.js'
import { Op } from 'sequelize'
import { uploadOnCloudinary, deleteFromCloudinary } from '../utils/cloudinary.js';
import fs from "fs"
import { isValidPhoneNumber, parsePhoneNumberWithError } from 'libphonenumber-js';
import Course from '../db/models/course.model.js';
import TeacherTeachesCourse from '../db/models/teacherTeachesCourse.model.js';
import Scheme from '../db/models/scheme.model.js';


const options = {
    httpOnly: true,
    secure: true,
};

const generateAccessAndRefreshTokens = async (staff) => {
    try {
        const newAccessToken = await staff.generateAccessToken();
        const newRefreshToken = await staff.generateRefreshToken();

        return { newAccessToken, newRefreshToken };
    } catch (err) {
        throw new ApiError(500, "Something went wrong while generating tokens");
    }
};



//* get all the staff
const getStaff = asyncHandler(async (req, res) => {

    const {
        searchQuery,
        courseId,
        page = 1,
        limit = 10
    } = req.query;

    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    let searchClause = {};

    if (searchQuery) {
        searchClause = {
            [Op.or]: [
                {
                    firstName: {
                        [Op.iLike]: `%${searchQuery}%`
                    }
                },
                {
                    email: {
                        [Op.iLike]: `%${searchQuery}%`
                    }
                },
                {
                    lastName: {
                        [Op.iLike]: `%${searchQuery}%`
                    }
                },
                {
                    highestQualification: {
                        [Op.iLike]: `%${searchQuery}%`
                    }
                },
                {
                    phoneNumber: {
                        [Op.iLike]: `%${searchQuery}%`
                    }
                }
            ]
        };
    }

    let courseIdFilterClause = {}
    let includeClause = []

    if (courseId) {
        courseIdFilterClause.courseId = courseId
        includeClause.push(
            {
                model: TeacherTeachesCourse,
                required: true,
                where: courseIdFilterClause,
                duplicating: false,
                include: [
                    {
                        model: Course,
                        required: true,
                        duplicating: false,
                    }
                ]
            }
        )
    }

    const staff = await Staff.findAndCountAll({
        where: searchClause,
        include: includeClause,
        offset: offset,
        limit: parseInt(limit, 10),
        distinct: true,
    });
    console.log(staff.rows)
    res
        .status(200)
        .json(
            new ApiResponse(
                200,
                "Staffs retrieved successfully.",
                {
                    staff: staff.rows,
                    totalStaff: staff.count
                }
            )
        );

});

const getStaffById = asyncHandler(async (req, res) => {
    const { staffId } = req.query;

    if (!staffId) {
        throw new ApiError(400, "Staff id is required");
    }

    const staff = await Staff.findByPk(staffId);

    if (!staff) {
        throw new ApiError(404, "Staff not found");
    }

    res
        .status(200)
        .json(
            new ApiResponse(
                200,
                "Staff fetched successfully",
                staff
            )
        );
});

//* add staff
const addStaff = asyncHandler(async (req, res) => {

    const {
        firstName,
        middleName,
        lastName,
        email,
        phoneNumber,
        gender,
        highestQualification,
        role,
        // password,
        // confirmPassword,
        isActive
    } = req.body;

    const staffImageLocalPath = req.file?.path

    const fields = {
        "First Name": firstName,
        "Last Name": lastName,
        "Email": email,
        "Phone Number": phoneNumber,
        "Gender": gender,
        "Role": role,
        // "Password": password,
        // "Confirm Password": confirmPassword
    };

    for (const fieldName in fields) {
        if (!fields[fieldName]) {
            if (staffImageLocalPath) {
                fs.unlinkSync(staffImageLocalPath)
            }
            throw new ApiError(400, `${fieldName} is required`); // Use fieldName here
        }
    }

    // if (password !== confirmPassword) {
    //     if (staffImageLocalPath) {
    //         fs.unlinkSync(staffImageLocalPath)
    //     }
    //     throw new ApiError(400, "Password and confirm password field do not match");
    // }

    if (!['Male', 'Female', 'Other'].includes(gender)) {
        if (staffImageLocalPath) {
            fs.unlinkSync(staffImageLocalPath)
        }
        throw new ApiError(400, "Invalid gender value. Must be Male, Female, or Other")
    }

    if (!['Teacher', 'Head of Department', 'Principal'].includes(role)) {
        if (staffImageLocalPath) {
            fs.unlinkSync(staffImageLocalPath)
        }
        throw new ApiError(400, "Invalid role value. Must be Teacher, Head of Department, or Principal")
    }

    if (!isValidPhoneNumber(phoneNumber)) {
        if (staffImageLocalPath) {
            fs.unlinkSync(staffImageLocalPath)
        }
        throw new ApiError(400, "Invalid phone number.")
    }

    const existingStaffMember = await Staff.findOne({ where: { email } })

    if (existingStaffMember) {
        if (staffImageLocalPath) {
            fs.unlinkSync(staffImageLocalPath)
        }
        throw new ApiError(400, "A staff member with this email already exists")
    }

    let staffImageUrl = null;
    let staffImagePublicId = null;

    if (staffImageLocalPath) {

        const staffImage = await uploadOnCloudinary(staffImageLocalPath)

        if (!staffImage?.url) {
            fs.unlinkSync(staffImageLocalPath)
            throw new ApiError(500, "Some issue occured while uploading the image")
        }

        staffImageUrl = staffImage.secure_url
        staffImagePublicId = staffImage.public_id
    }

    const addedStaffMember = await Staff.create({
        firstName: firstName,
        middleName: middleName || null,
        lastName: lastName,
        staffImageUrl: staffImageUrl,
        staffImagePublicId: staffImagePublicId,
        email: email,
        phoneNumber: phoneNumber,
        gender: gender,
        highestQualification: highestQualification || null,
        role: role,
        // password: password,
        isActive: isActive || true
    });


    if (!addedStaffMember) {
        throw new ApiError(500, "Some issue occured while adding staff member")
    }

    res
        .status(201)
        .json(
            new ApiResponse(
                201,
                'Staff member added successfully',
                addedStaffMember
            )
        )

});

const updateStaffDetails = asyncHandler(async (req, res) => {
    const {
        id,
        firstName,
        middleName,
        lastName,
        email,
        role,
        gender,
        highestQualification,
        phoneNumber,
        isActive
    } = req.body;

    if (req.admin && !id) { // will make it (req.admind && !id) || req.staff.id after adding staff
        throw new ApiError(400, "Staff id is required")
    }

    const staff = await Staff.findByPk(id);

    if (!staff) {
        throw new ApiError(404, "Staff not found")
    }

    if (!isValidPhoneNumber(phoneNumber)) {
        throw new ApiError(400, "Invalid phone number.")
    }

    staff.firstName = firstName || staff.firstName;
    staff.middleName = middleName || staff.middleName;
    staff.lastName = lastName || staff.lastName;
    staff.email = email || staff.email;
    staff.role = role || staff.role;
    staff.gender = gender || staff.gender;
    staff.highestQualification = highestQualification || staff.highestQualification;
    staff.phoneNumber = phoneNumber || staff.phoneNumber;
    staff.isActive = isActive || staff.isActive;

    await staff.save();

    res
        .status(200)
        .json(
            new ApiResponse(
                200,
                "Staff updated successfully",
                staff
            )
        );
})

const updateStaffPassword = asyncHandler(async (req, res) => {
    const {
        id,
        password,
        confirmPassword
    } = req.body;

    if (req.admin && !id) { // will make it (req.admind && !id) || req.staff.id after adding staff
        throw new ApiError(400, "Staff id is required")
    }

    const staff = await Staff.findByPk(id);

    if (!staff) {
        throw new ApiError(404, "Staff not found")
    }

    if (password !== confirmPassword) {
        throw new ApiError(400, "Password and confirm password field do not match");
    }

    staff.password = password || '';

    await staff.save();

    res
        .status(200)
        .json(
            new ApiResponse(
                200,
                "Staff password updated successfully",
                staff
            )
        );
})


const updateStaffImage = asyncHandler(async (req, res) => {
    const {
        id
    } = req.body;
    const staffImageLocalPath = req.file?.path

    if (req.admin && !id) { // will make it (req.admind && !id) || req.staff.id after adding staff
        if (staffImageLocalPath) {
            fs.unlinkSync(staffImageLocalPath)
        }
        throw new ApiError(400, "Staff id is required")
    }

    const staff = await Staff.findByPk(id);

    if (!staff) {
        if (staffImageLocalPath) {
            fs.unlinkSync(staffImageLocalPath)
        }
        throw new ApiError(404, "Staff not found")
    }

    if (!staffImageLocalPath) {
        throw new ApiError(400, "Staff image file is required")
    }

    const uploadedImageResponse = await uploadOnCloudinary(staffImageLocalPath)

    if (!uploadedImageResponse?.url) {
        throw new ApiError(500, "Some issue occured while uploading the image")
    }

    staff.staffImageUrl = uploadedImageResponse.secure_url
    staff.staffImagePublicId = uploadedImageResponse.public_id

    await staff.save();

    res
        .status(200)
        .json(
            new ApiResponse(
                200,
                "Staff image updated successfully",
                staff
            )
        );
})

const removeImage = asyncHandler(async (req, res) => {
    const { id } = req.query;

    if (req.admin && !id) {
        throw new ApiError(400, "Staff id is required");
    }

    const staff = await Staff.findByPk(id);

    if (!staff) {
        throw new ApiError(404, "Staff not found")
    }

    const deletedImage = await deleteFromCloudinary(staff.staffImagePublicId)

    if (!deletedImage) {
        throw new ApiError(500, "Some issue occured while deleting the image")
    }

    staff.staffImageUrl = null;
    staff.staffImagePublicId = null;

    await staff.save();

    res
        .status(200)
        .json(
            new ApiResponse(
                200,
                "Staff image deleted successfully",
                staff
            )
        );
})

//* remove staff
const removeStaff = asyncHandler(async (req, res) => {

    const { id } = req.query;

    if (req.admin && !id) {
        throw new ApiError(400, "Staff id is required");
    }

    const staff = await Staff.findByPk(id);

    if (!staff) {
        throw new ApiError(404, "Staff not found");
    }
    const deletedImage = await deleteFromCloudinary(staff.staffImagePublicId)

    if (!deletedImage) {
        throw new ApiError(500, "Some issue occured while deleting the image")
    }

    await staff.destroy();

    res
        .status(200)
        .json(
            new ApiResponse(
                200,
                "Staff deleted successfully",
                null
            )
        );
});

// const loginStaff = asyncHandler(async (req, res) => {
//     const { emailOrPhoneNumber, password } = req.body; // Changed to emailOrPhoneNumber

//     if (!emailOrPhoneNumber) {
//         throw new ApiError(400, "Email or Phone Number is needed"); // Updated message
//     }

//     const staff = await Staff.findOne({
//         where: {
//             [Op.or]: {
//                 email: emailOrPhoneNumber.toLowerCase(),
//                 phoneNumber: emailOrPhoneNumber, // Added phone number check
//             },
//         },
//     });

//     if (!staff) {
//         throw new ApiError(404, "No staff found with entered credentials");
//     }

//     const isPasswordMatching = await staff.isPasswordMatching(password);

//     if (!isPasswordMatching) {
//         throw new ApiError(400, "Password didn't match");
//     }

//     const { newAccessToken, newRefreshToken } = await generateAccessAndRefreshTokens(staff);

//     staff.refreshToken = newRefreshToken;
//     await staff.save();

//     delete staff.dataValues.password;
//     delete staff.dataValues.refreshToken;

//     res
//         .status(200)
//         .cookie("staffAccessToken", newAccessToken, { // Changed cookie name
//             ...options,
//             maxAge: 86400000,
//         })
//         .cookie("staffRefreshToken", newRefreshToken, { // Changed cookie name
//             ...options,
//             maxAge: 1296000000,
//         })
//         .json(
//             new ApiResponse(200, "Login Successful", {
//                 staff: staff,
//                 accessToken: newAccessToken,
//                 refreshToken: newRefreshToken,
//             })
//         );
// });

// const sendVerificationCodeToEmail = asyncHandler(async (req, res) => {
//     let { email } = req.body;

//     await emailSchema.validateAsync(req.body);

//     if (!email && !req?.staff?.email) { // Use req.staff
//         throw new ApiError(400, "Email is required");
//     }

//     if (email) {
//         email = email.toLowerCase();
//     } else {
//         email = req?.staff?.email.toLowerCase(); // Use req.staff
//     }

//     const staff = await Staff.findOne({ where: { email } });

//     if (!staff) {
//         throw new ApiError(400, "Staff with this email doesn't exist"); // Updated message
//     }

//     const code = generateVerificationCode();
//     const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

//     const record = await VerificationCode.create({
//         email: staff.email,
//         code,
//         expiresAt,
//     });

//     if (!record) {
//         throw new ApiError(500, "Some issue occurred while generating code");
//     }

//     const emailSent = await sendVerificationCode(email, code);

//     if (!emailSent) {
//         throw new ApiError(500, "Error sending verification email");
//     }

//     setTimeout(async () => {
//         await VerificationCode.destroy({
//             where: {
//                 [Op.and]: [{ email }, { code }],
//             },
//         });
//         console.log(`Verification code for ${email} is deleted due to timeout`);
//     }, 5 * 60 * 1000);

//     res.status(200).json(
//         new ApiResponse(200, `Verification code sent on ${staff.email}`, {
//             expiresAt,
//         })
//     );
// });

// const verifyCode = asyncHandler(async (req, res) => {
//     const { email, code } = req.body;

//     await emailSchema.validateAsync({ email });

//     if (!code) {
//         throw new ApiError(400, "Please enter the code");
//     }

//     const codeRecord = await VerificationCode.findOne({
//         where: {
//             [Op.and]: [{ email: email.toLowerCase() }, { code }],
//         },
//     });

//     if (!codeRecord) {
//         throw new ApiError(400, "Invalid verification code");
//     }

//     const staff = await Staff.scope('withPassword').findOne({ where: { email: email.toLowerCase() } }); // Use Staff model

//     if (!staff.isVerified) {
//         staff.isVerified = true;
//         await staff.save();
//     }

//     await VerificationCode.destroy({ where: { email: email.toLowerCase() } });

//     const { newAccessToken, newRefreshToken } = await generateAccessAndRefreshTokens(staff);

//     staff.refreshToken = newRefreshToken;
//     await staff.save();

//     delete staff.dataValues.password;
//     delete staff.dataValues.refreshToken;

//     res
//         .status(200)
//         .cookie("staffAccessToken", newAccessToken, { // Changed cookie name
//             ...options,
//             maxAge: 86400000,
//         })
//         .cookie("staffRefreshToken", newRefreshToken, { // Changed cookie name
//             ...options,
//             maxAge: 1296000000,
//         })
//         .json(
//             new ApiResponse(200, "Verification successful!", {
//                 accessToken: newAccessToken,
//                 refreshToken: newRefreshToken,
//             })
//         );
// });



// const getAccessToken = asyncHandler(async (req, res) => {
//     const { refreshToken } = req.body;

//     if (!refreshToken) {
//         throw new ApiError(401, "Refresh token is required");
//     }

//     const actualRefreshToken = refreshToken.replace("Bearer ", "");

//     let staffId;
//     jwt.verify(actualRefreshToken, process.env.JWT_REFRESH_TOKEN_SECRET, (err, decoded) => {
//         if (err) {
//             throw new ApiError(401, "Invalid refresh token");
//         }
//         staffId = decoded.id;
//     });

//     const staff = await Staff.findByPk(staffId);

//     if (!staff) {
//         throw new ApiError(401, "Staff with this refresh token doesn't exist"); // Updated message
//     }

//     const { newAccessToken, newRefreshToken } = await generateAccessAndRefreshTokens(staff);

//     staff.refreshToken = newRefreshToken;
//     await staff.save();

//     res
//         .status(200)
//         .cookie("staffAccessToken", newAccessToken, { // Changed cookie name
//             ...options,
//             maxAge: 86400000,
//         })
//         .cookie("staffRefreshToken", newRefreshToken, { // Changed cookie name
//             ...options,
//             maxAge: 1296000000,
//         })
//         .json(
//             new ApiResponse(200, "Access token refreshed successfully", {
//                 accessToken: newAccessToken,
//                 refreshToken: newRefreshToken,
//             })
//         );
// });


//! logout is remaining

const addTeachingSubject = asyncHandler(async (req, res) => {
    const { staffId, courseId } = req.body;

    if (!staffId || !courseId) {
        throw new ApiError(400, "Staff ID and Course ID are required");
    }

    const staff = await Staff.findByPk(staffId);

    if (!staff) {
        throw new ApiError(404, "Staff not found");
    }

    const course = await Course.findByPk(courseId);

    if (!course) {
        throw new ApiError(404, "Course not found");
    }

    const teacherTeachesCourseEntry = await TeacherTeachesCourse.create({
        teacherId: staffId,
        courseId: courseId,
    });

    res
        .status(201)
        .json(
            new ApiResponse(
                201,
                "Teaching subject added successfully",
                teacherTeachesCourseEntry
            )
        );
});


const removeTeachingSubject = asyncHandler(async (req, res) => {
    const { teacherSubjectId } = req.query;

    if (!teacherSubjectId) {
        throw new ApiError(400, "Teacher subject ID is required");
    }

    const teacherSubject = await TeacherTeachesCourse.findByPk(teacherSubjectId);

    if (!teacherSubject) {
        throw new ApiError(404, "Teacher subject not found");
    }

    await teacherSubject.destroy();

    res
        .status(200)
        .json(
            new ApiResponse(
                200,
                "Teaching subject deleted successfully",
                null
            )
        );
});

const getTeachingSubjects = asyncHandler(async (req, res) => {
    const { staffId } = req.query;

    if (!staffId) {
        throw new ApiError(400, "Teacher ID is required");
    }

    const teacher = await Staff.findByPk(staffId);

    if (!teacher) {
        throw new ApiError(404, "Teacher not found");
    }

    const teachingSubjects = await TeacherTeachesCourse.findAll({
        where: {
            teacherId: staffId
        },
        include: [
            {
                model: Course,
                required: true,
                include: [
                    {
                        model: Scheme,
                        required: true,
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
                "Teaching subjects retrieved successfully",
                teachingSubjects
            )
        );
});


export {
    getStaff,
    addStaff,
    updateStaffDetails,
    updateStaffPassword,
    updateStaffImage,
    removeStaff,
    removeImage,
    getStaffById,
    getTeachingSubjects,
    addTeachingSubject,
    removeTeachingSubject
}