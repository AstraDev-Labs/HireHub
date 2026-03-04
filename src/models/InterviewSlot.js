const dynamoose = require('../config/dynamodb');
const { v4: uuidv4 } = require('uuid');

const interviewSchema = new dynamoose.Schema({
    id: {
        type: String,
        hashKey: true,
        default: () => uuidv4()
    },
    driveId: {
        type: String,
        required: true,
        index: { name: 'DriveInterviewIndex', type: 'global' }
    },
    companyId: {
        type: String,
        required: true,
        index: { name: 'CompanyInterviewIndex', type: 'global' }
    },
    studentId: {
        type: String,
        required: true,
        index: { name: 'StudentInterviewIndex', type: 'global' }
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

const InterviewSlot = dynamoose.model('InterviewSlot', interviewSchema);

InterviewSlot.findById = async function (id) {
    try { return await InterviewSlot.get(id); } catch { return null; }
};

InterviewSlot.findByStudentId = async function (studentId) {
    return InterviewSlot.query('studentId').eq(studentId).using('StudentInterviewIndex').exec();
};

InterviewSlot.findByCompanyId = async function (companyId) {
    return InterviewSlot.query('companyId').eq(companyId).using('CompanyInterviewIndex').exec();
};

InterviewSlot.findByDriveId = async function (driveId) {
    return InterviewSlot.query('driveId').eq(driveId).using('DriveInterviewIndex').exec();
};

module.exports = InterviewSlot;
