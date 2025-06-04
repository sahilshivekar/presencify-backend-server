import { ApiError } from "../utils/ApiError.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import jwt from "jsonwebtoken"
import Admin from "../db/models/admin.model.js"
import Student from "../db/models/student.model.js"
import Staff from "../db/models/staff.model.js"

const verifyAdminJWT = asyncHandler(async (req, _, next) => {
    try {

        const token = req.cookies?.adminAccessToken || req.header("Authorization")?.replace("Bearer ", "");

        if (!token) {
            throw new ApiError(401, "Unauthorized request");
        }

        const decodedToken = jwt.verify(token, process.env.JWT_ACCESS_TOKEN_SECRET)

        const admin = await Admin.findByPk(decodedToken?.id, {
            attributes: { exclude: ['password', 'refreshToken'] }
        });

        if (!admin) {
            throw new ApiError(401, "Invalid Access Token")
        }

        req.admin = admin.dataValues;
        next()

    } catch (err) {
        console.log(err)
        throw new ApiError(401, "Unauthorized request");
    }

})


const verifyStudentJWT = asyncHandler(async (req, _, next) => {
    try {

        const token = req.cookies?.studentAccessToken || req.header("Authorization")?.replace("Bearer ", "");

        if (!token) {
            throw new ApiError(401, "Unauthorized request");
        }

        const decodedToken = jwt.verify(token, process.env.JWT_ACCESS_TOKEN_SECRET)

        const student = await Student.findByPk(decodedToken?.id, {
            attributes: { exclude: ['password', 'refreshToken'] }
        });

        if (!student) {
            throw new ApiError(401, "Invalid Access Token")
        }
        if (req.method != 'GET') {
            req.body.studentId = student.id
        }
        req.query.studentId = student.id
        req.student = student.dataValues;
        next()

    } catch (err) {
        console.log(err)
        throw new ApiError(401, "Unauthorized request");
    }

})

const verifyStaffJWT = asyncHandler(async (req, _, next) => {
    try {

        const token = req.cookies?.staffAccessToken || req.header("Authorization")?.replace("Bearer ", "");

        if (!token) {
            throw new ApiError(401, "Unauthorized request");
        }

        const decodedToken = jwt.verify(token, process.env.JWT_ACCESS_TOKEN_SECRET)

        const staff = await Staff.findByPk(decodedToken?.id, {
            attributes: { exclude: ['password', 'refreshToken'] }
        });

        if (!staff) {
            throw new ApiError(401, "Invalid Access Token")
        }

        if (req.method != 'GET') {
            req.body.staffId = staff.id
            req.body.teacherId = staff.id
        }
        req.query.teacherId = staff.id
        req.query.staffId = staff.id

        req.teacher = staff.dataValues;
        next()

    } catch (err) {
        console.log(err)
        throw new ApiError(401, "Unauthorized request");
    }
})


export { verifyAdminJWT, verifyStudentJWT, verifyStaffJWT }