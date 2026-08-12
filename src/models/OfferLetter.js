const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const offerLetterSchema = new mongoose.Schema({
    id: {
        type: String,
        default: uuidv4,
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
    studentName: { type: String, required: true },
    companyName: { type: String, required: true },
    role: String,
    packageLpa: Number,
    joiningDate: String,
    offerDate: String,
    status: {
        type: String,
        enum: ['ISSUED', 'ACCEPTED', 'DECLINED', 'REVOKED'],
        default: 'ISSUED',
        index: true
    },
    remarks: String,
    issuedBy: String,
    attachmentUrl: String
}, {
    timestamps: true
});

offerLetterSchema.statics.findById = async function (id) {
    try { return await this.findOne({ id }); } catch { return null; }
};

offerLetterSchema.statics.findByStudentId = async function (studentId, { skip = 0, limit = 0, sort = {} } = {}) {
    return this.find({ studentId }).sort(sort).skip(skip).limit(limit);
};

offerLetterSchema.statics.findByCompanyId = async function (companyId, { skip = 0, limit = 0, sort = {} } = {}) {
    return this.find({ companyId }).sort(sort).skip(skip).limit(limit);
};

offerLetterSchema.statics.findAll = async function ({ skip = 0, limit = 0, sort = {} } = {}) {
    return this.find().sort(sort).skip(skip).limit(limit);
};

const OfferLetter = mongoose.model('OfferLetter', offerLetterSchema);

module.exports = OfferLetter;
