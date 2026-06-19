const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const otpSchema = new mongoose.Schema({
    id: {
        type: String,
        default: () => uuidv4(),
        index: true
    },
    email: {
        type: String,
        required: true,
        index: true
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

// --- Static Methods ---

otpSchema.statics.generate = function (length = 6) {
    let code = '';
    for (let i = 0; i < length; i++) {
        code += Math.floor(Math.random() * 10);
    }
    return code;
};

otpSchema.statics.createOTP = async function (email, type) {
    // Invalidate old OTPs of same type for this email
    const existing = await this.find({ email: email.toLowerCase() });
    for (const old of existing) {
        if (old.type === type && !old.verified) {
            await this.deleteOne({ id: old.id });
        }
    }

    const code = this.generate();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

    return this.create({
        email: email.toLowerCase(),
        code,
        type,
        expiresAt
    });
};

otpSchema.statics.verifyOTP = async function (email, code, type) {
    const results = await this.find({ email: email.toLowerCase() });
    const otp = results.find(o => o.type === type && o.code === code && !o.verified);

    if (!otp) return { valid: false, reason: 'Invalid OTP code.' };
    if (Date.now() > otp.expiresAt) return { valid: false, reason: 'OTP has expired. Please request a new one.' };

    // Mark as verified
    otp.verified = true;
    await otp.save();

    return { valid: true };
};

const OTP = mongoose.model('OTP', otpSchema);

module.exports = OTP;
