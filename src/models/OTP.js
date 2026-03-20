const dynamoose = require('../config/dynamodb');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

const otpSchema = new dynamoose.Schema({
    id: {
        type: String,
        hashKey: true,
        default: () => uuidv4()
    },
    email: {
        type: String,
        required: true,
        index: { name: 'OTPEmailIndex', type: 'global' }
    },
    code: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['EMAIL_VERIFY', 'PHONE_VERIFY'],
        required: true
    },
    expiresAt: {
        type: Number,
        required: true
    },
    verified: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

const OTP = dynamoose.model('OTP', otpSchema);

// --- Static Methods ---

OTP.generate = function (length = 6) {
    let code = '';
    for (let i = 0; i < length; i++) {
        code += crypto.randomInt(0, 10);
    }
    return code;
};

OTP.createOTP = async function (email, type) {
    // Invalidate old OTPs of same type for this email
    const existing = await OTP.query('email').eq(email.toLowerCase()).using('OTPEmailIndex').exec();
    for (const old of existing) {
        if (old.type === type && !old.verified) {
            await OTP.delete(old.id);
        }
    }

    const code = OTP.generate();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

    return OTP.create({
        email: email.toLowerCase(),
        code,
        type,
        expiresAt
    });
};

OTP.verifyOTP = async function (email, code, type) {
    const results = await OTP.query('email').eq(email.toLowerCase()).using('OTPEmailIndex').exec();
    const otp = results.find(o => o.type === type && o.code === code && !o.verified);

    if (!otp) return { valid: false, reason: 'Invalid OTP code.' };
    if (Date.now() > otp.expiresAt) return { valid: false, reason: 'OTP has expired. Please request a new one.' };

    // Mark as verified
    otp.verified = true;
    await otp.save();

    return { valid: true };
};

module.exports = OTP;
