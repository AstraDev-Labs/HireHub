const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const resourceSchema = new mongoose.Schema({
    id: {
        type: String,
        default: uuidv4,
        index: true
    },
    companyId: {
        type: String,
        index: true
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

// --- Static Methods ---

resourceSchema.statics.findById = async function (id) {
    try { return await this.findOne({ id }); } catch { return null; }
};

resourceSchema.statics.findByFilter = async function (filter = {}) {
    return this.find(filter);
};

const PrepResource = mongoose.model('PrepResource', resourceSchema);

module.exports = PrepResource;
