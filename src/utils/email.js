import nodemailer from 'nodemailer';

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

// Function to send a basic email
const sendVerificationCode = async (to, verificationCode) => {

    const transporter = createTransporter();

    const text = `Verification code: ${verificationCode}`
    const subject = `Email verification code`

    const mailOptions = {
        from: process.env.NODEMAILER_USER,
        to,
        subject,
        text
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log("Email sent: " + info.response);
        return true;
    } catch (error) {
        console.error("Error sending email: " + error);
        return false;
    }
};


export {
    sendVerificationCode,
};
