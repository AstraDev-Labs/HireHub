const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const interviewSchema = new mongoose.Schema({
    id: {
        type: String,
        default: () => uuidv4(),
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
    studentId: {
        type: String,
        required: true,
        index: true
    },
    roundId: {
        type: String,
        required: true
    },
    studentName: { type: String },
    companyName: { type: String },
    roundName: { type: String },
    scheduledAt: {
        type: Date,
        required: true,
        index: true
    },
    durationMinutes: {
        type: Number,
        default: 30
    },
    meetLink: {
        type: String
    },
    status: {
        type: String,
        enum: ['SCHEDULED', 'COMPLETED', 'CANCELED', 'NO_SHOW'],
        default: 'SCHEDULED',
        index: true
    },
    feedback: {
        type: String
    }
}, {
    timestamps: true
});

interviewSchema.statics.findById = async function (id) {
    try { return await this.findOne({ id }); } catch { return null; }
};

interviewSchema.statics.findByStudentId = async function (studentId, { skip = 0, limit = 0, sort = {} } = {}) {
    return this.find({ studentId }).sort(sort).skip(skip).limit(limit);
};

interviewSchema.statics.findByCompanyId = async function (companyId, { skip = 0, limit = 0, sort = {} } = {}) {
    return this.find({ companyId }).sort(sort).skip(skip).limit(limit);
};

interviewSchema.statics.findByDriveId = async function (driveId, { skip = 0, limit = 0, sort = {} } = {}) {
    return this.find({ driveId }).sort(sort).skip(skip).limit(limit);
};

const InterviewSlot = mongoose.model('InterviewSlot', interviewSchema);

module.exports = InterviewSlot;
