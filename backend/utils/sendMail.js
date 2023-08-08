const nodemailer = require("nodemailer");
const ejs = require('ejs');

const sendMail = async (to, url, txt, subject, template)  => {
    const transporter = nodemailer.createTransport({
        host: process.env.SMPT_HOST,
        port: process.env.SMPT_PORT,
        service: process.env.SMPT_SERVICE,
        auth:{
            user: process.env.SMPT_MAIL,
            pass: process.env.SMPT_PASSWORD,
        },
    });
// Compile the email template with dynamic data

    const mailOptions = {
        from: process.env.SMPT_MAIL,
        to: to,
        subject: subject,
        html:template(to , url , subject)
    };

    await transporter.sendMail(mailOptions);
};

module.exports = sendMail;