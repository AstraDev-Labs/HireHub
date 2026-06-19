const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const placementDriveSchema = new mongoose.Schema({
    id: {
        type: String,
        default: uuidv4,
        index: true
    },
    companyId: {
        type: String,
        required: true,
        index: true
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
    eligibleDepartments: { type: [String], default: [] },
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

placementDriveSchema.statics.findById = async function (id) {
    try { return await this.findOne({ id }); } catch { return null; }
};

placementDriveSchema.statics.findAll = async function () {
    return this.find();
};

placementDriveSchema.statics.findByCompanyId = async function (companyId) {
    return this.find({ companyId });
};

const PlacementDrive = mongoose.model('PlacementDrive', placementDriveSchema);

module.exports = PlacementDrive;
