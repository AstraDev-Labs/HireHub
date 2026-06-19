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
        required: true
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
        default: 'SCHEDULED'
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

interviewSchema.statics.findByStudentId = async function (studentId) {
    return this.find({ studentId });
};

interviewSchema.statics.findByCompanyId = async function (companyId) {
    return this.find({ companyId });
};

interviewSchema.statics.findByDriveId = async function (driveId) {
    return this.find({ driveId });
};

const InterviewSlot = mongoose.model('InterviewSlot', interviewSchema);

module.exports = InterviewSlot;
