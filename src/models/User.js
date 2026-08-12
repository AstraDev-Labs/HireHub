const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const userSchema = new mongoose.Schema({

    username: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    auth0_id: {
        type: String,
        unique: true,
        sparse: true,
        index: true
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
        enum: ['STUDENT', 'ADMIN', 'STAFF', 'COMPANY', 'PARENT']
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
    profileImage: { type: String, default: null }
}, {
    timestamps: true
});

// --- Static Methods ---

userSchema.statics.findByEmail = async function (email) {
    return this.findOne({ email: email.toLowerCase() });
};

userSchema.statics.findByUsername = async function (username) {
    return this.findOne({ username });
};



userSchema.statics.findByApprovalStatus = async function (status, { skip = 0, limit = 0 } = {}) {
    return this.find({ approvalStatus: status }).skip(skip).limit(limit);
};

userSchema.statics.findAll = async function (filter = {}, { skip = 0, limit = 0 } = {}) {
    return this.find(filter).skip(skip).limit(limit);
};

userSchema.statics.countAll = async function (filter = {}) {
    return this.countDocuments(filter);
};

const User = mongoose.model('User', userSchema);

module.exports = User;
