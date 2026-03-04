const dynamoose = require('../config/dynamodb');
const { v4: uuidv4 } = require('uuid');

const driveApplicationSchema = new dynamoose.Schema({
    id: {
        type: String,
        hashKey: true,
        default: () => uuidv4()
    },
    studentId: {
        type: String,
        required: true,
        index: { name: 'StudentApplicationIndex', type: 'global' }
    },
    driveId: {
        type: String,
        required: true,
        index: { name: 'DriveApplicationIndex', type: 'global' }
    },
    companyId: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['APPLIED', 'SHORTLISTED', 'REJECTED', 'WITHDRAWN'],
        default: 'APPLIED'
    }
}, {
    timestamps: true
});

const DriveApplication = dynamoose.model('DriveApplication', driveApplicationSchema);

// --- Static Methods ---
DriveApplication.findById = async function (id) {
    try { return await DriveApplication.get(id); } catch { return null; }
};

DriveApplication.findByStudentId = async function (studentId) {
    return DriveApplication.query('studentId').eq(studentId).using('StudentApplicationIndex').exec();
};

DriveApplication.findByDriveId = async function (driveId) {
    return DriveApplication.query('driveId').eq(driveId).using('DriveApplicationIndex').exec();
};

DriveApplication.findOne = async function (filter) {
    let scan = DriveApplication.scan();
    for (const [key, value] of Object.entries(filter)) {
        scan = scan.where(key).eq(value);
    }
    const results = await scan.exec();
    return results.length > 0 ? results[0] : null;
};

module.exports = DriveApplication;
