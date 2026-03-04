const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    // 0. Fallback for testing: If no email credentials, just log to console
    if (!process.env.EMAIL_USERNAME) {
        console.warn('⚠️  EMAIL_USERNAME is missing! LOGGING EMAIL CONTENT INSTEAD OF SENDING:');
        console.log('-----------------------------------');
        console.log('📧 To:', options.email);
        console.log('📝 Subject:', options.subject);
        console.log('🔗 Link:', options.message.match(/https?:\/\/[^\s]+/)?.[0] || 'No link found');
        console.log('-----------------------------------');
        return;
    }

    // 1. Create a transporter
    const transportConfig = process.env.EMAIL_HOST ? {
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT || 587,
        secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
        auth: {
            user: process.env.EMAIL_USERNAME,
            pass: (process.env.EMAIL_PASSWORD || '').replace(/\s+/g, '')
        },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 15000
    } : {
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USERNAME,
            pass: (process.env.EMAIL_PASSWORD || '').replace(/\s+/g, '')
        },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 15000
    };

    const transporter = nodemailer.createTransport(transportConfig);

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
    try {
        await transporter.sendMail(mailOptions);
        console.log('✅ Email sent successfully to:', options.email);
    } catch (err) {
        console.error('❌ Nodemailer Error:', err);
        throw err;
    }
};

module.exports = sendEmail;
