const dynamoose = require('../config/dynamodb');
const { v4: uuidv4 } = require('uuid');

const resourceSchema = new dynamoose.Schema({
    id: {
        type: String,
        hashKey: true,
        default: () => uuidv4()
    },
    companyId: {
        type: String,
        index: { name: 'ResourceCompanyIndex', type: 'global' }
    },
    roundId: String,
    title: { type: String, required: true },
    resourceType: { type: String, required: true },
    driveLink: { type: String, required: true },
    description: String,
    uploadedBy: { type: String, required: true }
}, {
    timestamps: true
});

const PrepResource = dynamoose.model('PrepResource', resourceSchema);

// --- Static Methods ---

PrepResource.findById = async function (id) {
    try { return await PrepResource.get(id); } catch { return null; }
};

PrepResource.findByFilter = async function (filter = {}) {
    if (filter.companyId) {
        let results = await PrepResource.query('companyId').eq(filter.companyId).using('ResourceCompanyIndex').exec();
        if (filter.roundId) {
            results = results.filter(r => r.roundId === filter.roundId);
        }
        return results;
    }
    let scan = PrepResource.scan();
    for (const [key, value] of Object.entries(filter)) {
        scan = scan.where(key).eq(value);
    }
    return scan.exec();
};

module.exports = PrepResource;
