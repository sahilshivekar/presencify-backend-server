import { websocketAuthentication } from "./index.js";

const attendanceNamespace = (io) => {
    const attendance = io.of("/attendance");

    websocketAuthentication(attendance);

    attendance.on("connection", (socket) => {
        console.log("New connection to attendance namespace: ", socket.id);

        attendanceOfStudentForSpecificCourseInSemesterRoom(socket);

        attendanceOfAllForSemesterDivisionBatchCourseRoom(socket);

        socket.on("disconnect", () => {
            console.log("Disconnected from attendance namespace:", socket.id);
        });
    });

}
// ! dates remaining
// here first three parameters must be provided
const attendanceOfStudentForSpecificCourseInSemesterRoom = (socket) => {
    socket.on("student_attendance_room", (
        studentId, 
        courseId, 
        semesterId, 
        divisionId = null, 
        batchId = null, 
        startDate = null, 
        endDate = null
    ) => {
        socket.join(`
            student_attendance_
            studentId_${studentId}_
            courseId_${courseId}_
            semesterId_${semesterId}_
            divisionId_${divisionId}_
            batchId_${batchId}_
            startDate_${startDate}_
            endDate_${endDate}_
            `);
        console.log("Student attendance room joined: ", socket.id);
    });
}


const attendanceOfAllForSemesterDivisionBatchCourseRoom = (socket) => {
    socket.on("all_attendance_room", (
        semesterId = null, 
        divisionId = null, 
        batchId = null, 
        courseId = null, 
        startDate = null, 
        endDate = null
    ) => {
        socket.join(`
            all_attendance_room_
            semesterId_${semesterId}_
            divisionId_${divisionId}_
            batchId_${batchId}_
            courseId_${courseId}_
            startDate_${startDate}_
            endDate_${endDate}_   
            `);
        // if you don't keep _ after the endDate here then it will be not 
        // passed as "null" but as null and then the rest of the logic will not work
        console.log("All attendance room joined: ", socket.id);
    });
}


export default attendanceNamespace