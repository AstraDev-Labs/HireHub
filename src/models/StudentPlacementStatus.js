const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const placementStatusSchema = new mongoose.Schema({
    id: {
        type: String,
        default: () => uuidv4(),
        index: true
    },
    studentId: {
        type: String,
        required: true,
        index: true
    },
    companyId: {
        type: String,
        required: true,
        index: true
    },
    roundId: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['CLEARED', 'REJECTED', 'PENDING', 'PLACED', 'PENDING_APPROVAL'],
        default: 'PENDING_APPROVAL',
        index: true
    },
    updatedBy: String
}, {
    timestamps: true
});

// --- Static Methods ---

placementStatusSchema.statics.findById = async function (id) {
    try { return await this.findOne({ id }); } catch { return null; }
};

placementStatusSchema.statics.findByStudentId = async function (studentId, { skip = 0, limit = 0, sort = {} } = {}) {
    return this.find({ studentId }).sort(sort).skip(skip).limit(limit);
};

placementStatusSchema.statics.findByCompanyId = async function (companyId, { skip = 0, limit = 0, sort = {} } = {}) {
    return this.find({ companyId }).sort(sort).skip(skip).limit(limit);
};

placementStatusSchema.statics.findByFilter = async function (filter = {}, { skip = 0, limit = 0, sort = {} } = {}) {
    return this.find(filter).sort(sort).skip(skip).limit(limit);
};

// Mongoose provides a built-in findOne that works perfectly for their use case
// The old dynamoose model manually defined findOne.
// If explicitly needed for backward compatibility in case they call it passing identical arguments:
placementStatusSchema.statics.customFindOne = async function (filter) {
    return this.findOne(filter);
};

placementStatusSchema.statics.findAll = async function ({ skip = 0, limit = 0, sort = {} } = {}) {
    return this.find().sort(sort).skip(skip).limit(limit);
};

const StudentPlacementStatus = mongoose.model('StudentPlacementStatus', placementStatusSchema);

// Override the Mongoose findOne only if it doesn't conflict, but we just let Mongoose's findOne be used directly
// since Mongoose model instance inherently gets `findOne` from mongoose.Model.

module.exports = StudentPlacementStatus;
