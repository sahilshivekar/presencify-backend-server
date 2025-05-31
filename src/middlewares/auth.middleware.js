import { ApiError } from "../utils/ApiError.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import jwt from "jsonwebtoken"
import Admin from "../db/models/admin.model.js"


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