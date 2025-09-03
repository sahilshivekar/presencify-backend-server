import Teacher from '../db/models/teacher.model.js';
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

const generateAccessAndRefreshTokens = async (teacher) => {
    try {
        const newAccessToken = await teacher.generateAccessToken();
        const newRefreshToken = await teacher.generateRefreshToken();

        return { newAccessToken, newRefreshToken };
    } catch (err) {
        throw new ApiError(500, "Something went wrong while generating tokens");
    }
};



//* get all the teacher
const getTeacher = asyncHandler(async (req, res) => {

    const {
        searchQuery,
        courseId,
        page = 1,
        limit = 10,
        getAll = "false",
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

    const teacher = await Teacher.findAndCountAll({
        where: searchClause,
        include: includeClause,
        ...(limit && getAll == "false" ? { offset: offset, } : {}),
        ...(limit && getAll == "false" ? { limit: parseInt(limit, 10) } : {}),
        distinct: true,
    });
    console.log(teacher.rows)
    res
        .status(200)
        .json(
            new ApiResponse(
                200,
                "Teachers retrieved successfully.",
                {
                    teacher: teacher.rows,
                    totalTeacher: teacher.count
                }
            )
        );

});

const getTeacherById = asyncHandler(async (req, res) => {
    const { teacherId } = req.query;

    if (!teacherId) {
        throw new ApiError(400, "Teacher id is required");
    }

    const teacher = await Teacher.findByPk(teacherId);

    if (!teacher) {
        throw new ApiError(404, "Teacher not found");
    }

    res
        .status(200)
        .json(
            new ApiResponse(
                200,
                "Teacher fetched successfully",
                teacher
            )
        );
});

//* add teacher
const addTeacher = asyncHandler(async (req, res) => {

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

    const teacherImageLocalPath = req.file?.path

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
            if (teacherImageLocalPath) {
                fs.unlinkSync(teacherImageLocalPath)
            }
            throw new ApiError(400, `${fieldName} is required`); // Use fieldName here
        }
    }

    // if (password !== confirmPassword) {
    //     if (teacherImageLocalPath) {
    //         fs.unlinkSync(teacherImageLocalPath)
    //     }
    //     throw new ApiError(400, "Password and confirm password field do not match");
    // }

    if (!['Male', 'Female', 'Other'].includes(gender)) {
        if (teacherImageLocalPath) {
            fs.unlinkSync(teacherImageLocalPath)
        }
        throw new ApiError(400, "Invalid gender value. Must be Male, Female, or Other")
    }

    if (!['Teacher', 'Head of Department', 'Principal'].includes(role)) {
        if (teacherImageLocalPath) {
            fs.unlinkSync(teacherImageLocalPath)
        }
        throw new ApiError(400, "Invalid role value. Must be Teacher, Head of Department, or Principal")
    }

    if (!isValidPhoneNumber(phoneNumber)) {
        if (teacherImageLocalPath) {
            fs.unlinkSync(teacherImageLocalPath)
        }
        throw new ApiError(400, "Invalid phone number.")
    }

    const existingTeacherMember = await Teacher.findOne({ where: { email } })

    if (existingTeacherMember) {
        if (teacherImageLocalPath) {
            fs.unlinkSync(teacherImageLocalPath)
        }
        throw new ApiError(400, "A teacher member with this email already exists")
    }

    let teacherImageUrl = null;
    let teacherImagePublicId = null;

    if (teacherImageLocalPath) {

        const teacherImage = await uploadOnCloudinary(teacherImageLocalPath)

        if (!teacherImage?.url) {
            fs.unlinkSync(teacherImageLocalPath)
            throw new ApiError(500, "Some issue occured while uploading the image")
        }

        teacherImageUrl = teacherImage.secure_url
        teacherImagePublicId = teacherImage.public_id
    }

    const addedTeacherMember = await Teacher.create({
        firstName: firstName,
        middleName: middleName || null,
        lastName: lastName,
        teacherImageUrl: teacherImageUrl,
        teacherImagePublicId: teacherImagePublicId,
        email: email,
        phoneNumber: phoneNumber,
        gender: gender,
        highestQualification: highestQualification || null,
        role: role,
        // password: password,
        isActive: isActive || true
    });


    if (!addedTeacherMember) {
        throw new ApiError(500, "Some issue occured while adding teacher member")
    }

    res
        .status(201)
        .json(
            new ApiResponse(
                201,
                'Teacher member added successfully',
                addedTeacherMember
            )
        )

});

const updateTeacherDetails = asyncHandler(async (req, res) => {
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

    if (req.admin && !id) { // will make it (req.admind && !id) || req.teacher.id after adding teacher
        throw new ApiError(400, "Teacher id is required")
    }

    const teacher = await Teacher.findByPk(id);

    if (!teacher) {
        throw new ApiError(404, "Teacher not found")
    }

    if (!isValidPhoneNumber(phoneNumber)) {
        throw new ApiError(400, "Invalid phone number.")
    }

    teacher.firstName = firstName || teacher.firstName;
    teacher.middleName = middleName || teacher.middleName;
    teacher.lastName = lastName || teacher.lastName;
    teacher.email = email || teacher.email;
    teacher.role = role || teacher.role;
    teacher.gender = gender || teacher.gender;
    teacher.highestQualification = highestQualification || teacher.highestQualification;
    teacher.phoneNumber = phoneNumber || teacher.phoneNumber;
    teacher.isActive = isActive || teacher.isActive;

    await teacher.save();

    res
        .status(200)
        .json(
            new ApiResponse(
                200,
                "Teacher updated successfully",
                teacher
            )
        );
})

const updateTeacherPassword = asyncHandler(async (req, res) => {
    const {
        id,
        password,
        confirmPassword
    } = req.body;

    if (req.admin && !id) { // will make it (req.admind && !id) || req.teacher.id after adding teacher
        throw new ApiError(400, "Teacher id is required")
    }

    const teacher = await Teacher.findByPk(id);

    if (!teacher) {
        throw new ApiError(404, "Teacher not found")
    }

    if (password !== confirmPassword) {
        throw new ApiError(400, "Password and confirm password field do not match");
    }

    teacher.password = password || '';

    await teacher.save();

    res
        .status(200)
        .json(
            new ApiResponse(
                200,
                "Teacher password updated successfully",
                teacher
            )
        );
})


const updateTeacherImage = asyncHandler(async (req, res) => {
    const {
        id
    } = req.body;
    const teacherImageLocalPath = req.file?.path

    if (req.admin && !id) { // will make it (req.admind && !id) || req.teacher.id after adding teacher
        if (teacherImageLocalPath) {
            fs.unlinkSync(teacherImageLocalPath)
        }
        throw new ApiError(400, "Teacher id is required")
    }

    const teacher = await Teacher.findByPk(id);

    if (!teacher) {
        if (teacherImageLocalPath) {
            fs.unlinkSync(teacherImageLocalPath)
        }
        throw new ApiError(404, "Teacher not found")
    }

    if (!teacherImageLocalPath) {
        throw new ApiError(400, "Teacher image file is required")
    }

    const uploadedImageResponse = await uploadOnCloudinary(teacherImageLocalPath)

    if (!uploadedImageResponse?.url) {
        throw new ApiError(500, "Some issue occured while uploading the image")
    }

    teacher.teacherImageUrl = uploadedImageResponse.secure_url
    teacher.teacherImagePublicId = uploadedImageResponse.public_id

    await teacher.save();

    res
        .status(200)
        .json(
            new ApiResponse(
                200,
                "Teacher image updated successfully",
                teacher
            )
        );
})

const removeImage = asyncHandler(async (req, res) => {
    const { id } = req.query;

    if (req.admin && !id) {
        throw new ApiError(400, "Teacher id is required");
    }

    const teacher = await Teacher.findByPk(id);

    if (!teacher) {
        throw new ApiError(404, "Teacher not found")
    }

    const deletedImage = await deleteFromCloudinary(teacher.teacherImagePublicId)

    if (!deletedImage) {
        throw new ApiError(500, "Some issue occured while deleting the image")
    }

    teacher.teacherImageUrl = null;
    teacher.teacherImagePublicId = null;

    await teacher.save();

    res
        .status(200)
        .json(
            new ApiResponse(
                200,
                "Teacher image deleted successfully",
                teacher
            )
        );
})

//* remove teacher
const removeTeacher = asyncHandler(async (req, res) => {

    const { id } = req.query;

    if (req.admin && !id) {
        throw new ApiError(400, "Teacher id is required");
    }

    const teacher = await Teacher.findByPk(id);

    if (!teacher) {
        throw new ApiError(404, "Teacher not found");
    }
    if (teacher.teacherImagePublicId) {
        const deletedImage = await deleteFromCloudinary(teacher.teacherImagePublicId)
        if (!deletedImage) {
            throw new ApiError(500, "Some issue occured while deleting the image")
        }
    }


    await teacher.destroy();

    res
        .status(200)
        .json(
            new ApiResponse(
                200,
                "Teacher deleted successfully",
                null
            )
        );
});

// const loginTeacher = asyncHandler(async (req, res) => {
//     const { emailOrPhoneNumber, password } = req.body; // Changed to emailOrPhoneNumber

//     if (!emailOrPhoneNumber) {
//         throw new ApiError(400, "Email or Phone Number is needed"); // Updated message
//     }

//     const teacher = await Teacher.findOne({
//         where: {
//             [Op.or]: {
//                 email: emailOrPhoneNumber.toLowerCase(),
//                 phoneNumber: emailOrPhoneNumber, // Added phone number check
//             },
//         },
//     });

//     if (!teacher) {
//         throw new ApiError(404, "No teacher found with entered credentials");
//     }

//     const isPasswordMatching = await teacher.isPasswordMatching(password);

//     if (!isPasswordMatching) {
//         throw new ApiError(400, "Password didn't match");
//     }

//     const { newAccessToken, newRefreshToken } = await generateAccessAndRefreshTokens(teacher);

//     teacher.refreshToken = newRefreshToken;
//     await teacher.save();

//     delete teacher.dataValues.password;
//     delete teacher.dataValues.refreshToken;

//     res
//         .status(200)
//         .cookie("teacherAccessToken", newAccessToken, { // Changed cookie name
//             ...options,
//             maxAge: 86400000,
//         })
//         .cookie("teacherRefreshToken", newRefreshToken, { // Changed cookie name
//             ...options,
//             maxAge: 1296000000,
//         })
//         .json(
//             new ApiResponse(200, "Login Successful", {
//                 teacher: teacher,
//                 accessToken: newAccessToken,
//                 refreshToken: newRefreshToken,
//             })
//         );
// });

// const sendVerificationCodeToEmail = asyncHandler(async (req, res) => {
//     let { email } = req.body;

//     await emailSchema.validateAsync(req.body);

//     if (!email && !req?.teacher?.email) { // Use req.teacher
//         throw new ApiError(400, "Email is required");
//     }

//     if (email) {
//         email = email.toLowerCase();
//     } else {
//         email = req?.teacher?.email.toLowerCase(); // Use req.teacher
//     }

//     const teacher = await Teacher.findOne({ where: { email } });

//     if (!teacher) {
//         throw new ApiError(400, "Teacher with this email doesn't exist"); // Updated message
//     }

//     const code = generateVerificationCode();
//     const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

//     const record = await VerificationCode.create({
//         email: teacher.email,
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
//         new ApiResponse(200, `Verification code sent on ${teacher.email}`, {
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

//     const teacher = await Teacher.scope('withPassword').findOne({ where: { email: email.toLowerCase() } }); // Use Teacher model

//     if (!teacher.isVerified) {
//         teacher.isVerified = true;
//         await teacher.save();
//     }

//     await VerificationCode.destroy({ where: { email: email.toLowerCase() } });

//     const { newAccessToken, newRefreshToken } = await generateAccessAndRefreshTokens(teacher);

//     teacher.refreshToken = newRefreshToken;
//     await teacher.save();

//     delete teacher.dataValues.password;
//     delete teacher.dataValues.refreshToken;

//     res
//         .status(200)
//         .cookie("teacherAccessToken", newAccessToken, { // Changed cookie name
//             ...options,
//             maxAge: 86400000,
//         })
//         .cookie("teacherRefreshToken", newRefreshToken, { // Changed cookie name
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

//     let teacherId;
//     jwt.verify(actualRefreshToken, process.env.JWT_REFRESH_TOKEN_SECRET, (err, decoded) => {
//         if (err) {
//             throw new ApiError(401, "Invalid refresh token");
//         }
//         teacherId = decoded.id;
//     });

//     const teacher = await Teacher.findByPk(teacherId);

//     if (!teacher) {
//         throw new ApiError(401, "Teacher with this refresh token doesn't exist"); // Updated message
//     }

//     const { newAccessToken, newRefreshToken } = await generateAccessAndRefreshTokens(teacher);

//     teacher.refreshToken = newRefreshToken;
//     await teacher.save();

//     res
//         .status(200)
//         .cookie("teacherAccessToken", newAccessToken, { // Changed cookie name
//             ...options,
//             maxAge: 86400000,
//         })
//         .cookie("teacherRefreshToken", newRefreshToken, { // Changed cookie name
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
    const { teacherId, courseId } = req.body;

    if (!teacherId || !courseId) {
        throw new ApiError(400, "Teacher ID and Course ID are required");
    }

    const teacher = await Teacher.findByPk(teacherId);

    if (!teacher) {
        throw new ApiError(404, "Teacher not found");
    }

    const course = await Course.findByPk(courseId);

    if (!course) {
        throw new ApiError(404, "Course not found");
    }

    const alreadyAssigned = await TeacherTeachesCourse.findOne({
        where: {
            teacherId: teacherId,
            courseId: courseId,
        }
    });

    if(alreadyAssigned) {
        throw new ApiError(400, "Course is already assigned to this teacher member")
    }

    const teacherTeachesCourseEntry = await TeacherTeachesCourse.create({
        teacherId: teacherId,
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
    const { teacherId } = req.query;

    if (!teacherId) {
        throw new ApiError(400, "Teacher ID is required");
    }

    const teacher = await Teacher.findByPk(teacherId);

    if (!teacher) {
        throw new ApiError(404, "Teacher not found");
    }

    const teachingSubjects = await TeacherTeachesCourse.findAll({
        where: {
            teacherId: teacherId
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
    getTeacher,
    addTeacher,
    updateTeacherDetails,
    updateTeacherPassword,
    updateTeacherImage,
    removeTeacher,
    removeImage,
    getTeacherById,
    getTeachingSubjects,
    addTeachingSubject,
    removeTeachingSubject
}