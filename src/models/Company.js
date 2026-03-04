const dynamoose = require('../config/dynamodb');
const { v4: uuidv4 } = require('uuid');

const companySchema = new dynamoose.Schema({
    id: {
        type: String,
        hashKey: true,
        default: () => uuidv4()
    },
    name: {
        type: String,
        required: true,
        index: { name: 'CompanyNameIndex', type: 'global' }
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
        type: Array,
        schema: [String],
        default: []
    },
    jobRoles: {
        type: Array,
        schema: [String],
        default: []
    },
    jobDescriptions: {
        type: Object,
        default: {}
    },
    packageLpa: {
        type: Number,
        required: true
    },
    location: {
        type: Array,
        schema: [String],
        default: []
    },
    description: String
}, {
    timestamps: true
});

const Company = dynamoose.model('Company', companySchema);

// --- Static Methods ---

Company.findById = async function (id) {
    try { return await Company.get(id); } catch { return null; }
};

Company.findAll = async function (filter = {}) {
    let scan = Company.scan();
    for (const [key, value] of Object.entries(filter)) {
        scan = scan.where(key).eq(value);
    }
    return scan.exec();
};

Company.countAll = async function () {
    const results = await Company.scan().exec();
    return results.length;
};

module.exports = Company;
