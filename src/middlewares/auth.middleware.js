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

        //logger.debug(`Verifying JWT for roles: ${JSON.stringify(allowedRoles)}`);

        // Check for token in cookies (with role-specific names) or Authorization header
        const token =
            req.cookies?.adminAccessToken ||
            req.cookies?.teacherAccessToken ||
            req.cookies?.studentAccessToken ||
            req.cookies?.accessToken ||
            req.header("Authorization")?.replace("Bearer ", "");
        // console.log(token)
        if (!token) {
            // //logger.warn(`No token provided for request ${req.method} ${req.originalUrl}`);
            throw new ApiError(StatusCodes.UNAUTHORIZED, "Unauthorized request: No token provided");
        }

        let decodedToken;
        try {
            decodedToken = jwt.verify(token, process.env.JWT_ACCESS_TOKEN_SECRET);
        } catch (error) {   
            logger.error(`JWT verification failed: ${error}`);
            throw new ApiError(StatusCodes.UNAUTHORIZED, "Unauthorized request: Invalid token");
        }
        
        if (!decodedToken || !decodedToken.id || !decodedToken.role) {
            //logger.warn(`Decoded token missing required fields: ${JSON.stringify(decodedToken)}`);
            throw new ApiError(StatusCodes.UNAUTHORIZED, "Invalid token");
        }

        // Check if role is allowed  
        if (!allowedRoles.includes(decodedToken.role)) {
            logger.warn(`Forbidden: User role ${decodedToken.role} not in allowed roles ${JSON.stringify(allowedRoles)}`);
            throw new ApiError(StatusCodes.FORBIDDEN, "Forbidden: Insufficient permissions");
        }

        const UserModel = modelMap[decodedToken.role];

        // Fetch user by ID without sensitive info
        const user = await UserModel.findByPk(decodedToken.id, {
            attributes: { exclude: ["password", "refreshToken"] },
        });

        if (!user) {
            logger.error(`User not found for id: ${decodedToken.id}, role: ${decodedToken.role}`);
            throw new ApiError(StatusCodes.UNAUTHORIZED, "Invalid Access Token: User not found");
        } else {
            logger.info(`JWT verified for userId: ${decodedToken?.id}, role: ${decodedToken?.role}`);
        }

        // Optional: auto-assign user id to req.body or req.query based on role and method:
        if (req.method !== "GET") {
            if (decodedToken.role === ROLES.STUDENT) {
                req.body.studentId = user.id;
                //logger.debug(`Assigned studentId to req.body: ${user.id}`);
            } else if (decodedToken.role === ROLES.TEACHER) {
                // injecting teacherId is commented for temporary time, since the it's automatically applying itself as id for 
                // getClass filter criteria if user role is teacher on client side
                // req.body.teacherId = user.id;
                //logger.debug(`Assigned teacherId to req.body: ${user.id}`);
            } else if (decodedToken.role === ROLES.ADMIN) {
                req.body.adminId = user.id;
                //logger.debug(`Assigned adminId to req.body: ${user.id}`);
            }
        }

        if (decodedToken.role === ROLES.STUDENT) {
            req.query.studentId = user.id;
            req.student = user;
            //logger.debug(`Assigned studentId to req.query and req.student: ${user.id}`);
        } else if (decodedToken.role === ROLES.TEACHER) {
            // req.query.teacherId = user.id;
            // req.teacher = user;
            //logger.debug(`Assigned teacherId to req.query and req.teacher: ${user.id}`);
        } else if (decodedToken.role === ROLES.ADMIN) {
            req.query.adminId = user.id;
            req.admin = user;
            //logger.debug(`Assigned adminId to req.query and req.admin: ${user.id}`);
        }

        //logger.info(`JWT auth successful for userId: ${user.id}, role: ${decodedToken.role}`);
        next();
    });

export { verifyJWT };
