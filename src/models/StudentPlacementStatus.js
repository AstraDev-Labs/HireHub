const dynamoose = require('../config/dynamodb');
const { v4: uuidv4 } = require('uuid');

const placementStatusSchema = new dynamoose.Schema({
    id: {
        type: String,
        hashKey: true,
        default: () => uuidv4()
    },
    studentId: {
        type: String,
        required: true,
        index: { name: 'StudentPlacementIndex', type: 'global' }
    },
    companyId: {
        type: String,
        required: true,
        index: { name: 'CompanyPlacementIndex', type: 'global' }
    },
    roundId: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['CLEARED', 'REJECTED', 'PENDING', 'PLACED', 'PENDING_APPROVAL'],
        default: 'PENDING_APPROVAL'
    },
    updatedBy: String
}, {
    timestamps: true
});

const StudentPlacementStatus = dynamoose.model('StudentPlacementStatus', placementStatusSchema);

// --- Static Methods ---

StudentPlacementStatus.findById = async function (id) {
    try { return await StudentPlacementStatus.get(id); } catch { return null; }
};

StudentPlacementStatus.findByStudentId = async function (studentId) {
    return StudentPlacementStatus.query('studentId').eq(studentId).using('StudentPlacementIndex').exec();
};

StudentPlacementStatus.findByCompanyId = async function (companyId) {
    return StudentPlacementStatus.query('companyId').eq(companyId).using('CompanyPlacementIndex').exec();
};

StudentPlacementStatus.findByFilter = async function (filter = {}) {
    let scan = StudentPlacementStatus.scan();
    for (const [key, value] of Object.entries(filter)) {
        if (typeof value === 'object' && value.$ne !== undefined) {
            scan = scan.where(key).not().eq(value.$ne);
        } else {
            scan = scan.where(key).eq(value);
        }
    }
    return scan.exec();
};

StudentPlacementStatus.findOne = async function (filter) {
    const results = await StudentPlacementStatus.findByFilter(filter);
    return results.length > 0 ? results[0] : null;
};

StudentPlacementStatus.findAll = async function () {
    return StudentPlacementStatus.scan().exec();
};

module.exports = StudentPlacementStatus;
