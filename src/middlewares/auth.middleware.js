import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import Admin from "../db/models/admin.model.js";
import Student from "../db/models/student.model.js";
import Teacher from "../db/models/teacher.model.js";
import { ROLES } from "../config/roles.js";
import { StatusCodes } from "http-status-codes";
import { logger } from "../config/logger.js";
const modelMap = {
    [ROLES.ADMIN]: Admin,
    [ROLES.TEACHER]: Teacher,
    [ROLES.STUDENT]: Student,
};

/**
 * Middleware to verify JWT and authorize based on allowed roles.
 * Usage: verifyJWT([ROLES.ADMIN, ROLES.TEACHER]) or verifyJWT([ROLES.STUDENT])
 */
const verifyJWT = (allowedRoles) => 
    asyncHandler(async (req, _, next) => {

        if (allowedRoles.length === 0) throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, "No roles provided");

        const token =
            req.cookies?.accessToken ||
            req.header("Authorization")?.replace("Bearer ", "");

        if (!token) {
            throw new ApiError(StatusCodes.UNAUTHORIZED, "Unauthorized request: No token provided");
        }

        const decodedToken = jwt.verify(token, process.env.JWT_ACCESS_TOKEN_SECRET);

        if (!decodedToken || !decodedToken.id || !decodedToken.role) {
            throw new ApiError(StatusCodes.UNAUTHORIZED, "Unauthorized request: Invalid token");
        }

        // Check if role is allowed  
        if (!allowedRoles.includes(decodedToken.role)) {
            throw new ApiError(StatusCodes.FORBIDDEN, "Forbidden: Insufficient permissions");
        }

        const UserModel = modelMap[decodedToken.role];

        // Fetch user by ID without sensitive info
        const user = await UserModel.findByPk(decodedToken.id, {
            attributes: { exclude: ["password", "refreshToken"] },
        });

        if (!user) {
            throw new ApiError(StatusCodes.UNAUTHORIZED, "Invalid Access Token: User not found");
        }

        // Optional: auto-assign user id to req.body or req.query based on role and method:
        if (req.method !== "GET") {
            if (decodedToken.role === ROLES.STUDENT) {
                req.body.studentId = user.id;
            } else if (decodedToken.role === ROLES.TEACHER) {
                req.body.teacherId = user.id;
            } else if (decodedToken.role === ROLES.ADMIN) {
                req.body.adminId = user.id;
            }
        }

        if (decodedToken.role === ROLES.STUDENT) {
            req.query.studentId = user.id;
            req.student = user;
        } else if (decodedToken.role === ROLES.TEACHER) {
            req.query.teacherId = user.id;
            req.teacher = user;
        } else if (decodedToken.role === ROLES.ADMIN) {
            req.query.adminId = user.id;
            req.admin = user;
        }

        next();
    });

export { verifyJWT };
