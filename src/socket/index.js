import { Server } from 'socket.io';
import jwt from "jsonwebtoken";
import Admin from "../db/models/admin.model.js";
import attendanceNamespace from "./attendanceNamespace.js";
import timetableNamespace from "./timetableNamespace.js";

let io;

const initSocket = (httpServer) => {
    io = new Server(httpServer, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"],
            credentials: true
        },
        pingTimeout: 30000, // close connection after 30 seconds of no ping
        pingInterval: 10000 // send ping every 10 seconds
    })

    

    // setup namespaces
    attendanceNamespace(io);
    timetableNamespace(io);

    return io;
}

const getIO = () => {
    if (!io) throw new Error("Socket.io not initialized!");
    return io;
};

const websocketAuthentication = (namespace) => {
    // JWT authentication
    namespace.use(async (socket, next) => {
        try {
            const token = socket.handshake.query.token;
            
            if (!token) {
                return next(new Error("Authentication error: Token missing"));
            }

            const decodedToken = jwt.verify(token, process.env.JWT_ACCESS_TOKEN_SECRET);
            const admin = await Admin.findByPk(decodedToken.id, {
                attributes: { exclude: ['password', 'refreshToken'] }
            });

            if (!admin) {
                return next(new Error("Authentication error: Invalid token"));
            }
            next();
        } catch (err) {
            next(new Error("Authentication error"));
        }
    });
}

export { initSocket, getIO, websocketAuthentication };