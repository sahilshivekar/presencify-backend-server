import express, { application } from "express"
import cors from "cors"
import cookieParser from "cookie-parser"

const app = express()

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

app.use(express.json({ limit: "16kb" }))
app.use(express.urlencoded({ extended: true, limit: "16kb" }))
app.use(express.static("public"))
app.use(cookieParser())


//! routes import
import adminRouter from "./routes/admin.routes.js"
import universityRouter from "./routes/university.routes.js"
import schemeRouter from "./routes/scheme.routes.js"
import courseRouter from "./routes/course.routes.js"
import branchRouter from "./routes/branch.routes.js"
import semesterRouter from "./routes/semester.routes.js"
import staffRouter from "./routes/staff.routes.js"
import studentRouter from "./routes/student.routes.js"
import divisionRouter from "./routes/division.routes.js"
import batchRouter from "./routes/batch.routes.js"
import eventRouter from "./routes/event.routes.js"
import noticeRouter from "./routes/notice.routes.js"
import timetableRouter from "./routes/timetable.routes.js"
import roomRouter from "./routes/room.routes.js"
import classRouter from "./routes/class.routes.js"
import attendanceRouter from "./routes/attendance.routes.js"
import dropoutRouter from "./routes/dropout.routes.js"

//! routes declaration
app.use("/api/v1/admin", adminRouter);
app.use("/api/v1/university", universityRouter);
app.use("/api/v1/scheme", schemeRouter);
app.use("/api/v1/course", courseRouter);
app.use("/api/v1/branch", branchRouter);
app.use("/api/v1/semester", semesterRouter);
app.use("/api/v1/staff", staffRouter);
app.use("/api/v1/student", studentRouter);
app.use("/api/v1/division", divisionRouter);
app.use("/api/v1/batch", batchRouter);
app.use("/api/v1/event", eventRouter);
app.use("/api/v1/notice", noticeRouter);
app.use("/api/v1/timetable", timetableRouter);
app.use("/api/v1/room", roomRouter);
app.use("/api/v1/class", classRouter);
app.use("/api/v1/attendance", attendanceRouter);
app.use("/api/v1/dropout", dropoutRouter);

export { app }