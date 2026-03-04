const OTP = require('../models/OTP');
const User = require('../models/User');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const sendEmail = require('../utils/sendEmail');

// --- Phone OTP (sent via email for free) ---

exports.sendPhoneOTP = catchAsync(async (req, res, next) => {
    const { email, phoneNumber } = req.body;
    console.log(`[OTP] Request for email: ${email}, phone: ${phoneNumber}`);

    if (!email || !phoneNumber) {
        return next(new AppError('Email and phone number are required.', 400));
    }

    // Validate phone format (10 digits)
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(phoneNumber)) {
        return next(new AppError('Please provide a valid 10-digit phone number.', 400));
    }

    console.log('[OTP] Generating code via OTP model...');
    const otp = await OTP.createOTP(email, 'PHONE_VERIFY');
    console.log(`[OTP] Generated code: ${otp.code}`);

    console.log('[OTP] Sending email via nodemailer...');
    await sendEmail({
        email,
        subject: 'CPMS — Email Verification Code',
        message: `Your email verification code is: ${otp.code}\n\nThis code expires in 5 minutes.`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px;">
                <h2 style="color: #1f2937; margin-bottom: 8px;">Verify Your Email</h2>
                <p style="color: #6b7280; font-size: 14px;">Use the code below to verify your email <strong>${email}</strong> and complete your CPMS registration:</p>
                <div style="background: #f3f4f6; border-radius: 8px; padding: 16px; text-align: center; margin: 20px 0;">
                    <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #111827;">${otp.code}</span>
                </div>
                <p style="color: #9ca3af; font-size: 12px;">This code expires in 5 minutes.</p>
            </div>
        `
    });
    console.log(`[OTP] Email verification code (${otp.code}) sent to ${email}`);
    console.log('[OTP] Email sent successfully!');

    res.status(200).json({
        status: 'success',
        message: `Verification code sent to your email for phone ${phoneNumber}.`
    });
});

exports.verifyPhoneOTP = catchAsync(async (req, res, next) => {
    const { email, code } = req.body;

    if (!email || !code) {
        return next(new AppError('Email and OTP code are required.', 400));
    }

    const result = await OTP.verifyOTP(email, code, 'PHONE_VERIFY');

    if (!result.valid) {
        return next(new AppError(result.reason, 400));
    }

    res.status(200).json({
        status: 'success',
        message: 'Phone number verified successfully!'
    });
});
