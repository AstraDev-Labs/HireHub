const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

const userSchema = new mongoose.Schema({

    username: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    fullName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        index: true
    },
    phoneNumber: {
        type: String,
        required: true
    },
    department: String,
    role: {
        type: String,
        enum: ['STUDENT', 'ADMIN', 'STAFF', 'COMPANY', 'PARENT'],
        default: 'STUDENT'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    approvalStatus: {
        type: String,
        enum: ['APPROVED', 'PENDING', 'DENIED'],
        default: 'PENDING',
        index: true
    },
    emailVerified: {
        type: Boolean,
        default: false
    },
    phoneVerified: {
        type: Boolean,
        default: false
    },
    companyId: String,
    studentName: String,
    studentContact: String,
    linkedStudentId: String,
    refreshToken: String,
    lastLogin: String,
    publicKey: { type: String, default: null },
    profileImage: { type: String, default: null },
    passwordResetToken: { type: String, required: false },
    passwordResetExpires: { type: Number, required: false }
}, {
    timestamps: true
});

// --- Static Methods ---

userSchema.statics.createWithHash = async function (data) {
    if (data.password) {
        data.password = await bcrypt.hash(data.password, 12);
    }
    return this.create(data);
};

userSchema.statics.findByEmail = async function (email) {
    return this.findOne({ email: email.toLowerCase() });
};

userSchema.statics.findByUsername = async function (username) {
    return this.findOne({ username });
};



userSchema.statics.findByApprovalStatus = async function (status) {
    return this.find({ approvalStatus: status });
};

userSchema.statics.findAll = async function (filter = {}) {
    return this.find(filter);
};

userSchema.statics.correctPassword = async function (candidatePassword, hashedPassword) {
    if (!hashedPassword) return false;
    return bcrypt.compare(candidatePassword, hashedPassword);
};

userSchema.statics.countAll = async function (filter = {}) {
    return this.countDocuments(filter);
};

// Password strength validation
userSchema.statics.validatePassword = function (password) {
    const errors = [];
    if (password.length < 8) errors.push('at least 8 characters');
    if (!/[A-Z]/.test(password)) errors.push('one uppercase letter');
    if (!/[a-z]/.test(password)) errors.push('one lowercase letter');
    if (!/[0-9]/.test(password)) errors.push('one number');
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) errors.push('one special character');
    return errors;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
