const dynamoose = require('../config/dynamodb');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

const userSchema = new dynamoose.Schema({
    id: {
        type: String,
        hashKey: true,
        default: () => uuidv4()
    },
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
        index: { name: 'EmailIndex', type: 'global' }
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
        index: { name: 'ApprovalIndex', type: 'global' }
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

const User = dynamoose.model('User', userSchema);

// --- Static Methods ---

User.createWithHash = async function (data) {
    if (data.password) {
        data.password = await bcrypt.hash(data.password, 12);
    }
    return User.create(data);
};

User.findByEmail = async function (email) {
    const results = await User.query('email').eq(email.toLowerCase()).using('EmailIndex').exec();
    return results.length > 0 ? results[0] : null;
};

User.findById = async function (id) {
    try {
        return await User.get(id);
    } catch {
        return null;
    }
};

User.findByApprovalStatus = async function (status) {
    return User.query('approvalStatus').eq(status).using('ApprovalIndex').exec();
};

User.findAll = async function (filter = {}) {
    let scan = User.scan();
    for (const [key, value] of Object.entries(filter)) {
        if (typeof value === 'object' && value.$ne !== undefined) {
            scan = scan.where(key).not().eq(value.$ne);
        } else if (typeof value === 'object' && value.$in !== undefined) {
            scan = scan.where(key).in(value.$in);
        } else {
            scan = scan.where(key).eq(value);
        }
    }
    return scan.exec();
};

User.correctPassword = async function (candidatePassword, hashedPassword) {
    if (!hashedPassword) return false;
    return bcrypt.compare(candidatePassword, hashedPassword);
};

User.countAll = async function (filter = {}) {
    const results = await User.findAll(filter);
    return results.length;
};

// Password strength validation
User.validatePassword = function (password) {
    const errors = [];
    if (password.length < 8) errors.push('at least 8 characters');
    if (!/[A-Z]/.test(password)) errors.push('one uppercase letter');
    if (!/[a-z]/.test(password)) errors.push('one lowercase letter');
    if (!/[0-9]/.test(password)) errors.push('one number');
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) errors.push('one special character');
    return errors;
};

module.exports = User;
