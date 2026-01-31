import nodemailer from 'nodemailer';
import { logger } from '../config/logger.js';

// a reusable transporter object
const createTransporter = () => {
    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.NODEMAILER_USER,
            pass: process.env.NODEMAILER_PASS
        }
    });
};

const sendAttendanceReportToEmail = async (to, text) => {
    const transporter = createTransporter();

    const mailOptions = {
        from: process.env.NODEMAILER_USER,
        to: to,
        course: "Attendance Report of student from <College-Name> college",
        text: text
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        logger.info(`Email sent: ${info.response}`);
        return true
    } catch (error) {
        logger.error(`Error sending email: ${error}`);
        return false
    }
}

// Function to send a basic email
const sendVerificationCode = async (to, verificationCode) => {

    const transporter = createTransporter();

    const text = `Verification code: ${verificationCode}`
    const course = `Email verification code`

    const mailOptions = {
        from: process.env.NODEMAILER_USER,
        to,
        course,
        text
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        logger.info(`Email sent: ${info.response}`);
        return true;
    } catch (error) {
        logger.error(`Error sending email: ${error}`);
        return false;
    }
};


export {
    sendVerificationCode,
    sendAttendanceReportToEmail
};
