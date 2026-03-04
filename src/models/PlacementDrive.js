const dynamoose = require('../config/dynamodb');
const { v4: uuidv4 } = require('uuid');

const placementDriveSchema = new dynamoose.Schema({
    id: {
        type: String,
        hashKey: true,
        default: () => uuidv4()
    },
    companyId: {
        type: String,
        required: true,
        index: { name: 'CompanyDriveIndex', type: 'global' }
    },
    companyName: { type: String, required: true },
    title: { type: String, required: true },
    description: String,
    date: { type: String, required: true },
    time: String,
    venue: String,
    driveType: {
        type: String,
        enum: ['ON_CAMPUS', 'OFF_CAMPUS', 'VIRTUAL'],
        default: 'ON_CAMPUS'
    },
    eligibleDepartments: { type: Array, schema: [String], default: [] },
    minCgpa: { type: Number, default: 0 },
    status: {
        type: String,
        enum: ['UPCOMING', 'ONGOING', 'COMPLETED', 'CANCELLED'],
        default: 'UPCOMING'
    },
    createdBy: String
}, {
    timestamps: true
});

const PlacementDrive = dynamoose.model('PlacementDrive', placementDriveSchema);

PlacementDrive.findById = async function (id) {
    try { return await PlacementDrive.get(id); } catch { return null; }
};

PlacementDrive.findAll = async function () {
    return PlacementDrive.scan().exec();
};

PlacementDrive.findByCompanyId = async function (companyId) {
    return PlacementDrive.query('companyId').eq(companyId).using('CompanyDriveIndex').exec();
};

module.exports = PlacementDrive;
