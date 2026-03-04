const dynamoose = require('../config/dynamodb');
const { v4: uuidv4 } = require('uuid');

const roundSchema = new dynamoose.Schema({
    id: {
        type: String,
        hashKey: true,
        default: () => uuidv4()
    },
    companyId: {
        type: String,
        required: true,
        index: { name: 'CompanyRoundIndex', type: 'global' }
    },
    roundName: String,
    roundType: String,
    roundOrder: {
        type: Number,
        required: true
    },
    description: String
}, {
    timestamps: true
});

const Round = dynamoose.model('Round', roundSchema);

// --- Static Methods ---

Round.findById = async function (id) {
    try { return await Round.get(id); } catch { return null; }
};

Round.findByCompanyId = async function (companyId) {
    const results = await Round.query('companyId').eq(companyId).using('CompanyRoundIndex').exec();
    // Sort by roundOrder
    return results.sort((a, b) => a.roundOrder - b.roundOrder);
};

module.exports = Round;
