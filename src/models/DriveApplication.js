const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const driveApplicationSchema = new mongoose.Schema({
    id: {
        type: String,
        default: uuidv4,
        index: true
    },
    studentId: {
        type: String,
        required: true,
        index: true
    },
    driveId: {
        type: String,
        required: true,
        index: true
    },
    companyId: {
        type: String,
        required: true,
        index: true
    },
    status: {
        type: String,
        enum: ['APPLIED', 'SHORTLISTED', 'REJECTED', 'WITHDRAWN'],
        default: 'APPLIED',
        index: true
    }
}, {
    timestamps: true
});

// --- Static Methods ---
driveApplicationSchema.statics.findById = async function (id) {
    try { return await this.findOne({ id }); } catch { return null; }
};

driveApplicationSchema.statics.findByStudentId = async function (studentId, { skip = 0, limit = 0, sort = {} } = {}) {
    return this.find({ studentId }).sort(sort).skip(skip).limit(limit);
};

driveApplicationSchema.statics.findByDriveId = async function (driveId, { skip = 0, limit = 0, sort = {} } = {}) {
    return this.find({ driveId }).sort(sort).skip(skip).limit(limit);
};

// Mongoose already provides findOne(), but overriding to match exact behavior if needed
driveApplicationSchema.statics.findOneApp = async function (filter) {
    return this.findOne(filter);
};

const DriveApplication = mongoose.model('DriveApplication', driveApplicationSchema);

module.exports = DriveApplication;
