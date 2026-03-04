const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USERNAME,
            pass: (process.env.EMAIL_PASSWORD || '').replace(/\s+/g, '')
        }
    });

    // 2. Define the email options
    const mailOptions = {
        from: `CPMS System <${process.env.EMAIL_USERNAME}>`,
        to: options.email,
        subject: options.subject,
        text: options.message
    };

    // Add HTML if provided
    if (options.html) {
        mailOptions.html = options.html;
    }

    // 3. Send the email
    await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
