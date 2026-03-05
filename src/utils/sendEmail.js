const nodemailer = require('nodemailer');

/**
 * sendEmail - Send email directly via nodemailer (Gmail)
 */
const sendEmail = async (options) => {
    const emailUser = process.env.EMAIL_USERNAME;
    const emailPass = process.env.EMAIL_PASSWORD;

    if (!emailUser || !emailPass) {
        console.warn('⚠️  EMAIL_USERNAME or EMAIL_PASSWORD missing! LOGGING EMAIL INSTEAD:');
        console.log('-----------------------------------');
        console.log('📧 To:', options.email);
        console.log('📝 Subject:', options.subject);
        if (options.data && options.data.resetURL) {
            console.log('🔗 Reset URL:', options.data.resetURL);
        }
        if (options.data && options.data.otp) {
            console.log('🔢 OTP:', options.data.otp);
        }
        console.log('-----------------------------------');
        return;
    }

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: emailUser,
            pass: emailPass
        }
    });

    // Build email content based on type
    let html = options.html || '';
    let text = options.text || options.message || '';

    // Fallback to internal templates if no HTML/text provided
    if (!html && !text) {
        const type = options.type || 'forgot-password';

        if (type === 'forgot-password') {
            const { resetURL, fullName } = options.data || {};
            html = `
                <div style="font-family: 'Inter', system-ui, sans-serif; max-width: 500px; margin: 0 auto; padding: 40px; border: 1px solid #e5e7eb; border-radius: 20px; background-color: #ffffff;">
                    <h2 style="color: #111827; text-align: center; font-size: 24px; font-weight: 800;">Reset Your Password</h2>
                    <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
                        Hi ${fullName || 'there'},<br><br>
                        We received a request to reset your password. Click the button below to set a new password.
                    </p>
                    <div style="text-align: center; margin: 32px 0;">
                        <a href="${resetURL}" style="background-color: #3b82f6; color: #ffffff; padding: 14px 28px; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 16px; display: inline-block;">Reset Password</a>
                    </div>
                    <p style="color: #9ca3af; font-size: 14px; text-align: center;">This link expires in 10 minutes.<br>If you didn't request this, ignore this email.</p>
                    <div style="margin-top: 40px; padding-top: 24px; border-top: 1px solid #f3f4f6; text-align: center;">
                        <p style="color: #9ca3af; font-size: 12px;">&copy; 2026 HireHub. All rights reserved.</p>
                    </div>
                </div>
            `;
            text = `Hi ${fullName || 'there'},\n\nReset your password: ${resetURL}\n\nThis link expires in 10 minutes.`;
        } else if (type === 'otp') {
            const { otp, fullName } = options.data || {};
            html = `
                <div style="font-family: 'Inter', system-ui, sans-serif; max-width: 500px; margin: 0 auto; padding: 40px; border: 1px solid #e5e7eb; border-radius: 20px; background-color: #ffffff;">
                    <h2 style="color: #111827; text-align: center; font-size: 24px; font-weight: 800;">Verify Your Email</h2>
                    <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
                        Hi ${fullName || 'there'},<br><br>Your verification code is:
                    </p>
                    <div style="text-align: center; margin: 32px 0;">
                        <span style="background-color: #f3f4f6; padding: 16px 32px; border-radius: 12px; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #111827;">${otp}</span>
                    </div>
                    <p style="color: #9ca3af; font-size: 14px; text-align: center;">This code expires in 10 minutes.</p>
                </div>
            `;
            text = `Your verification code is: ${otp}`;
        }
    }

    try {
        await transporter.sendMail({
            from: `"HireHub System" <${emailUser}>`,
            to: options.email,
            subject: options.subject,
            text,
            html
        });
        console.log('✅ Email sent directly to:', options.email);
    } catch (err) {
        console.error('❌ Email send error:', err.message);

        // Fallback: log the link/otp
        if (options.data && options.data.resetURL) {
            console.log('🔗 EMERGENCY RESET LINK:', options.data.resetURL);
        }
        if (options.data && options.data.otp) {
            console.log('🔢 EMERGENCY OTP:', options.data.otp);
        }

        throw new Error('Failed to send email');
    }
};

module.exports = sendEmail;
