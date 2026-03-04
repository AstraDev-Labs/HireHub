const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const User = require('../models/User');
const Student = require('../models/Student');
const OTP = require('../models/OTP');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const sendEmail = require('../utils/sendEmail');
const dynamoose = require('../config/dynamodb');

const signToken = id => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
    });
};

const signRefreshToken = id => {
    return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, {
        expiresIn: process.env.JWT_REFRESH_EXPIRES_IN
    });
};

// Cookie options
const cookieOptions = (maxAge) => ({
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // Must be 'none' for cross-domain

    maxAge,
    path: '/',
});

exports.register = catchAsync(async (req, res, next) => {
    // 1. Validate password strength
    const passwordErrors = User.validatePassword(req.body.password || '');
    if (passwordErrors.length > 0) {
        return next(new AppError(
            `Password must contain: ${passwordErrors.join(', ')}.`,
            400
        ));
    }

    // 2. Validate phone number
    if (!req.body.phoneNumber || !/^\d{10}$/.test(req.body.phoneNumber)) {
        return next(new AppError('A valid 10-digit phone number is required.', 400));
    }

    // 3. Validate Company Registration
    if (req.body.role === 'COMPANY') {
        if (!req.body.companyId) {
            return next(new AppError('Please select your company (companyId required).', 400));
        }
        if (!req.body.companyEmail) {
            return next(new AppError('Please provide your company email.', 400));
        }
    }

    // 4. Check for duplicate email
    const existingUser = await User.findByEmail(req.body.email);
    if (existingUser) {
        return next(new AppError('Email already in use.', 400));
    }

    // Use 10 rounds instead of 12. 12 takes ~250ms and blocks the event loop hard.
    // 10 takes ~60ms, allowing 4x more concurrent registrations.
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const userId = uuidv4();

    // 5. Build Transaction Operations
    const transactionJobs = [
        User.transaction.create({
            id: userId,
            username: req.body.username,
            email: req.body.email.toLowerCase(),
            password: hashedPassword,
            fullName: req.body.fullName,
            role: req.body.role || 'STUDENT',
            companyId: req.body.companyId || undefined,
            studentName: req.body.studentName,
            studentContact: req.body.studentContact,
            phoneNumber: req.body.phoneNumber,
            department: req.body.department,
            linkedStudentId: req.body.linkedStudentId,
            approvalStatus: 'PENDING',
            emailVerified: req.body.phoneVerified || false,
            phoneVerified: req.body.phoneVerified || false
        })
    ];

    // 6. If Student, add Student Profile to transaction
    if (req.body.role === 'STUDENT') {
        transactionJobs.push(
            Student.transaction.create({
                userId: userId,
                name: req.body.fullName,
                email: req.body.email.toLowerCase(),
                phone: req.body.phoneNumber || 'N/A',
                department: req.body.department || 'N/A',
                batchYear: Number(req.body.batchYear) || new Date().getFullYear(),
                cgpa: 0,
                placementStatus: 'NOT_PLACED'
            })
        );
    }

    // 7. Execute Transaction
    await dynamoose.transaction(transactionJobs);

    const newUser = {
        id: userId,
        username: req.body.username,
        email: req.body.email.toLowerCase(),
        role: req.body.role || 'STUDENT',
        fullName: req.body.fullName,
        emailVerified: req.body.phoneVerified || false
    };

    // 8. Send email verification OTP (only if not already verified via phone step)
    if (!newUser.emailVerified) {
        const otp = await OTP.createOTP(newUser.email, 'EMAIL_VERIFY');
        try {
            await sendEmail({
                email: newUser.email,
                subject: 'CPMS — Verify Your Email Address',
                message: `Your email verification code is: ${otp.code}\n\nThis code expires in 5 minutes.`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px;">
                        <h2 style="color: #1f2937; margin-bottom: 8px;">Welcome to CPMS!</h2>
                        <p style="color: #6b7280; font-size: 14px;">Verify your email to complete registration:</p>
                        <div style="background: #f3f4f6; border-radius: 8px; padding: 16px; text-align: center; margin: 20px 0;">
                            <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #111827;">${otp.code}</span>
                        </div>
                        <p style="color: #9ca3af; font-size: 12px;">This code expires in 5 minutes.</p>
                    </div>
                `
            });
        } catch (emailErr) {
            console.error('⚠️ Email sending failed:', emailErr.message);
        }
    }

    res.status(201).json({
        status: 'success',
        message: 'Account created! Please check your email for the verification code.',
        data: {
            user: {
                username: newUser.username,
                email: newUser.email,
                role: newUser.role,
                approvalStatus: newUser.approvalStatus,
                emailVerified: false
            }
        }
    });
});

// In-memory login attempt tracker (use Redis in production for multi-instance)
const loginAttempts = new Map();
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

function getAttemptInfo(email) {
    const info = loginAttempts.get(email);
    if (!info) return { attempts: 0, lockedUntil: null };
    // Reset if lockout expired
    if (info.lockedUntil && Date.now() > info.lockedUntil) {
        loginAttempts.delete(email);
        return { attempts: 0, lockedUntil: null };
    }
    return info;
}

function recordFailedAttempt(email) {
    const info = getAttemptInfo(email);
    info.attempts += 1;
    if (info.attempts >= MAX_ATTEMPTS) {
        info.lockedUntil = Date.now() + LOCKOUT_DURATION;
    }
    loginAttempts.set(email, info);
}

function clearAttempts(email) {
    loginAttempts.delete(email);
}

exports.login = catchAsync(async (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return next(new AppError('Please provide email and password', 400));
    }

    // Check account lockout
    const attemptInfo = getAttemptInfo(email.toLowerCase());
    if (attemptInfo.lockedUntil) {
        const minsLeft = Math.ceil((attemptInfo.lockedUntil - Date.now()) / 60000);
        return next(new AppError(`Account temporarily locked due to too many failed attempts. Try again in ${minsLeft} minutes.`, 429));
    }

    const user = await User.findByEmail(email);

    if (!user || !(await User.correctPassword(password, user.password))) {
        recordFailedAttempt(email.toLowerCase());
        const remaining = MAX_ATTEMPTS - getAttemptInfo(email.toLowerCase()).attempts;
        const msg = remaining > 0
            ? `Incorrect email or password. ${remaining} attempts remaining.`
            : 'Account locked due to too many failed attempts. Try again in 15 minutes.';
        return next(new AppError(msg, 401));
    }

    // Successful login — clear failed attempts
    clearAttempts(email.toLowerCase());

    if (!user.isActive) {
        return next(new AppError('Your account has been deactivated. Contact admin.', 403));
    }

    // Check email verification
    if (!user.emailVerified) {
        return res.status(403).json({
            status: 'fail',
            code: 'EMAIL_NOT_VERIFIED',
            message: 'Please verify your email before logging in.',
            data: { email: user.email }
        });
    }

    if (user.approvalStatus !== 'APPROVED') {
        return next(new AppError(`Your account is currently ${user.approvalStatus}. Please wait for Staff/HoD approval.`, 403));
    }

    // Generate tokens
    const accessToken = signToken(user.id);
    const refreshToken = signRefreshToken(user.id);

    // Update user state
    await User.update({ id: user.id }, {
        lastLogin: new Date().toISOString(),
        refreshToken
    });

    // Set HttpOnly cookies
    res.cookie('jwt', accessToken, cookieOptions(24 * 60 * 60 * 1000));        // 1 day
    res.cookie('refreshToken', refreshToken, cookieOptions(7 * 24 * 60 * 60 * 1000)); // 7 days

    // Build response (exclude sensitive fields)
    const userResponse = { ...user };
    if (typeof user.toJSON === 'function') Object.assign(userResponse, user.toJSON());
    delete userResponse.password;
    delete userResponse.refreshToken;
    delete userResponse.passwordResetToken;
    delete userResponse.passwordResetExpires;

    // Check if profile is complete (for Students)
    let isProfileComplete = true;
    let studentDetails = {};

    if (user.role === 'STUDENT') {
        const student = await Student.findByUserId(user.id);
        if (student) {
            if (student.department === 'N/A' || student.phone === 'N/A') {
                isProfileComplete = false;
            }
            studentDetails = {
                cgpa: student.cgpa,
                batchYear: student.batchYear,
                department: student.department,
                studentId: student.id
            };
        } else {
            isProfileComplete = false;
        }
    }

    Object.assign(userResponse, studentDetails);
    userResponse._id = user.id;

    res.status(200).json({
        status: 'success',
        token: accessToken,         // Still sent in body for backward compatibility
        data: {
            user: userResponse,
            isProfileComplete
        }
    });
});

exports.logout = catchAsync(async (req, res, next) => {
    // Clear HttpOnly cookies
    res.cookie('jwt', 'loggedout', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',

        expires: new Date(0),
        path: '/',
    });
    res.cookie('refreshToken', 'loggedout', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',

        expires: new Date(0),
        path: '/',
    });

    // Invalidate refresh token in DB if user is authenticated
    if (req.user) {
        try {
            await User.update({ id: req.user._id || req.user.id }, { refreshToken: '' });
        } catch (err) {
            console.error('Failed to clear refresh token on logout:', err.message);
            // Don't block logout if DB update fails
        }
    }

    res.status(200).json({ status: 'success', message: 'Logged out successfully' });
});

exports.refreshToken = catchAsync(async (req, res, next) => {
    // Read refresh token from cookie first, then body
    const token = req.cookies?.refreshToken || req.body?.refreshToken;

    if (!token) {
        return next(new AppError('Please provide refresh token', 400));
    }

    let decoded;
    try {
        decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    } catch (err) {
        return next(new AppError('Invalid or expired refresh token. Please log in again.', 401));
    }

    const user = await User.findById(decoded.id);
    if (!user) {
        return next(new AppError('User not found', 401));
    }

    if (user.refreshToken !== token) {
        return next(new AppError('Invalid refresh token', 401));
    }

    const newAccessToken = signToken(user.id);

    // Set new access token cookie
    res.cookie('jwt', newAccessToken, cookieOptions(24 * 60 * 60 * 1000));

    res.status(200).json({
        status: 'success',
        token: newAccessToken
    });
});
