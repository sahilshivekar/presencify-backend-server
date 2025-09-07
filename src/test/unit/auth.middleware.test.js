jest.mock("../../db/models/admin.model.js", () => ({ __esModule: true, default: { findByPk: jest.fn() } }))

jest.mock("../../db/models/student.model.js", () => ({ __esModule: true, default: { findByPk: jest.fn() } }))

jest.mock("../../db/models/teacher.model.js", () => ({ __esModule: true, default: { findByPk: jest.fn() } }))

jest.mock("jsonwebtoken", () => ({
    __esModule: true,
    default: { verify: jest.fn() },
    verify: jest.fn()
}))

// Now import code under test and helpers
import { verifyJWT } from "../../middlewares/auth.middleware.js";
import { ROLES } from "../../config/roles.js";
import { StatusCodes } from "http-status-codes";
import httpMocks from "node-mocks-http";
import jwt from "jsonwebtoken"; // Changed to default import to match auth middleware

// Import mocked models - Jest will give us the mocked versions
import Admin from "../../db/models/admin.model.js";
import Student from "../../db/models/student.model.js";
import Teacher from "../../db/models/teacher.model.js";



describe("verifyJWT middleware", () => {
    let req, res, next;

    beforeEach(() => {
        req = httpMocks.createRequest();
        res = httpMocks.createResponse();
        next = jest.fn();
        // Reset all model mocks
        jest.clearAllMocks();
        Admin.findByPk.mockReset();
        Student.findByPk.mockReset();
        Teacher.findByPk.mockReset();
        // Reset JWT mock
        jwt.verify.mockReset();
    });

    it("rejects when allowedRoles is empty", async () => {
        await verifyJWT([])(req, res, next);
        expect(next).toHaveBeenCalledWith(
            expect.objectContaining({
                statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
                message: "No roles provided",
            })
        );
    });

    it("rejects when no token in cookies or Authorization", async () => {
        await verifyJWT([ROLES.ADMIN])(req, res, next);
        expect(next).toHaveBeenCalledWith(
            expect.objectContaining({
                statusCode: StatusCodes.UNAUTHORIZED,
                message: "Unauthorized request: No token provided",
            })
        );
    });

    it("rejects when jwt.verify throws (invalid/expired)", async () => {
        req.cookies.accessToken = "token";
        await verifyJWT([ROLES.ADMIN])(req, res, next);
        expect(next).toHaveBeenCalledWith(
            expect.objectContaining({
                statusCode: StatusCodes.UNAUTHORIZED,
                message: "Unauthorized request: Invalid token",
            })
        );
    });

    it("rejects when decoded.role not in allowedRoles", async () => {
        req.cookies.accessToken = "token";
        jest.spyOn(jwt, "verify").mockReturnValue({ id: "u1", role: ROLES.STUDENT });
        await verifyJWT([ROLES.ADMIN])(req, res, next);
        expect(next).toHaveBeenCalledWith(
            expect.objectContaining({
                statusCode: StatusCodes.FORBIDDEN,
                message: "Forbidden: Insufficient permissions",
            })
        );
    });

    //! following is the reason simply
    //     expect(next).toHaveBeenCalledWith(
    //         expect.objectContaining({
    //             statusCode: StatusCodes.FORBIDDEN,
    //             message: "Forbidden: Insufficient permissions",
    //         })
    //     ); 
    //! is not used
    // It is because all the operations in above tests are synchronous
    // But in the next test, we have async operations (findByPk)
    // So the when the middleware is running our test function continues
    // and hits expect(next).toHaveBeenCalledWith(...) before next() is actually called
    // Thus we need to await next being called by wrapping it in a Promise
    it("rejects when UserModel.findByPk resolves null", async () => {
        req.cookies.accessToken = "token"; // token present [3]
        jwt.verify.mockReturnValue({ id: "u1", role: ROLES.ADMIN }); // same shape middleware calls [5]
        Admin.findByPk.mockResolvedValue(null); // async null result [2]

        // Await next(err) deterministically
        const nextCalled = new Promise((resolve) => {
            next.mockImplementation((err) => resolve(err));
        }); // resolve when next is invoked [2]

        await verifyJWT([ROLES.ADMIN])(req, res, next); // wrapper resolves immediately, catch runs later [1]

        const err = await nextCalled; // wait for next(err) [2]
        expect(err).toMatchObject({
            statusCode: StatusCodes.UNAUTHORIZED,
            message: "Invalid Access Token: User not found",
        }); // matches ApiError mapping [3]
    });


    const roleCases = [
        { role: ROLES.STUDENT, bodyKey: "studentId", queryKey: "studentId", userKey: "student" },
        { role: ROLES.TEACHER, bodyKey: "teacherId", queryKey: "teacherId", userKey: "teacher" },
        { role: ROLES.ADMIN, bodyKey: "adminId", queryKey: "adminId", userKey: "admin" },
    ];

    describe.each(roleCases)("passes for valid role %s", (c) => {
        it(`sets req.body.${c.bodyKey}, req.query.${c.queryKey}, req.${c.userKey} for non-GET`, async () => {
            req.cookies.accessToken = "token";
            req.method = "POST";
            jest.spyOn(jwt, "verify").mockReturnValue({ id: "u42", role: c.role });

            // Mock the appropriate model based on role
            if (c.role === ROLES.STUDENT) Student.findByPk.mockResolvedValue({ id: "u42" });
            else if (c.role === ROLES.TEACHER) Teacher.findByPk.mockResolvedValue({ id: "u42" });
            else if (c.role === ROLES.ADMIN) Admin.findByPk.mockResolvedValue({ id: "u42" });

            await verifyJWT([c.role])(req, res, next);
            expect(req.body[c.bodyKey]).toBe("u42");
            expect(req.query[c.queryKey]).toBe("u42");
            expect(req[c.userKey]).toEqual({ id: "u42" });
            expect(next).toHaveBeenCalledWith();
        });

        it(`sets only req.query.${c.queryKey}, req.${c.userKey} for GET`, async () => {
            req.cookies.accessToken = "token";
            req.method = "GET";
            jest.spyOn(jwt, "verify").mockReturnValue({ id: "u99", role: c.role });

            // Mock the appropriate model based on role
            if (c.role === ROLES.STUDENT) Student.findByPk.mockResolvedValue({ id: "u99" });
            else if (c.role === ROLES.TEACHER) Teacher.findByPk.mockResolvedValue({ id: "u99" });
            else if (c.role === ROLES.ADMIN) Admin.findByPk.mockResolvedValue({ id: "u99" });

            await verifyJWT([c.role])(req, res, next);
            expect(req.body[c.bodyKey]).toBeUndefined();
            expect(req.query[c.queryKey]).toBe("u99");
            expect(req[c.userKey]).toEqual({ id: "u99" });
            expect(next).toHaveBeenCalledWith();
        });
    });
});
