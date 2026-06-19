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
        default: 'PENDING_APPROVAL'
    },
    updatedBy: String
}, {
    timestamps: true
});

// --- Static Methods ---

placementStatusSchema.statics.findById = async function (id) {
    try { return await this.findOne({ id }); } catch { return null; }
};

placementStatusSchema.statics.findByStudentId = async function (studentId) {
    return this.find({ studentId });
};

placementStatusSchema.statics.findByCompanyId = async function (companyId) {
    return this.find({ companyId });
};

placementStatusSchema.statics.findByFilter = async function (filter = {}) {
    return this.find(filter);
};

// Mongoose provides a built-in findOne that works perfectly for their use case
// The old dynamoose model manually defined findOne.
// If explicitly needed for backward compatibility in case they call it passing identical arguments:
placementStatusSchema.statics.customFindOne = async function (filter) {
    return this.findOne(filter);
};

placementStatusSchema.statics.findAll = async function () {
    return this.find();
};

const StudentPlacementStatus = mongoose.model('StudentPlacementStatus', placementStatusSchema);

// Override the Mongoose findOne only if it doesn't conflict, but we just let Mongoose's findOne be used directly
// since Mongoose model instance inherently gets `findOne` from mongoose.Model.

module.exports = StudentPlacementStatus;
