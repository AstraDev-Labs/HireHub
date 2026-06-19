const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const roundSchema = new mongoose.Schema({
    id: {
        type: String,
        default: () => uuidv4(),
        index: true
    },
    companyId: {
        type: String,
        required: true,
        index: true
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

// --- Static Methods ---

roundSchema.statics.findById = async function (id) {
    try { return await this.findOne({ id }); } catch { return null; }
};

roundSchema.statics.findByCompanyId = async function (companyId) {
    const results = await this.find({ companyId });
    // Sort by roundOrder
    return results.sort((a, b) => a.roundOrder - b.roundOrder);
};

const Round = mongoose.model('Round', roundSchema);

module.exports = Round;
