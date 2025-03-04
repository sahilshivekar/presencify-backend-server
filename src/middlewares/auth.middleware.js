import { ApiError } from "../utils/ApiError.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import jwt from "jsonwebtoken"
import Admin from "../db/models/admin.model.js"

//old access token
//eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTUsInVzZXJuYW1lIjoid2lldCIsImVtYWlsIjoid2lldEBnbWFpbC5jb20iLCJwYXNzd29yZCI6IiQyYiQxMCRNUHc5QmdzUXZwLkJwb3Ywb0lGQzYub0xJTFVDNzVjbjJZZ2hsWUx5bmRCYjlVT1AzU0N2aSIsImlhdCI6MTczNzMwMTIwOCwiZXhwIjoxNzM3Mzg3NjA4fQ.JMwaL6FiJjxlAY3Ne8gwx9XrOFvUv9TMIv8geBMg158

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


export { verifyAdminJWT }