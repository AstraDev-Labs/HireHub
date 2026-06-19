const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const companySchema = new mongoose.Schema({
    id: {
        type: String,
        default: uuidv4,
        index: true
    },
    name: {
        type: String,
        required: true,
        index: true
    },
    email: {
        type: String,
        required: true
    },
    website: String,
    hiringStatus: {
        type: String,
        enum: ['OPEN', 'CLOSED'],
        default: 'OPEN'
    },
    minCgpa: {
        type: Number,
        default: 0
    },
    eligibleDepartments: {
        type: [String],
        default: []
    },
    jobRoles: {
        type: [String],
        default: []
    },
    jobDescriptions: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    packageLpa: {
        type: Number,
        required: true
    },
    location: {
        type: [String],
        default: []
    },
    description: String
}, {
    timestamps: true
});

// --- Static Methods ---

companySchema.statics.findById = async function (id) {
    try { return await this.findOne({ id }); } catch { return null; }
};

companySchema.statics.findAll = async function (filter = {}) {
    return this.find(filter);
};

companySchema.statics.countAll = async function () {
    return this.countDocuments();
};

const Company = mongoose.model('Company', companySchema);

module.exports = Company;
