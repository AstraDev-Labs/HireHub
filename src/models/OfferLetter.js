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
        default: 'ISSUED'
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

offerLetterSchema.statics.findByStudentId = async function (studentId) {
    return this.find({ studentId });
};

offerLetterSchema.statics.findByCompanyId = async function (companyId) {
    return this.find({ companyId });
};

offerLetterSchema.statics.findAll = async function () {
    return this.find();
};

const OfferLetter = mongoose.model('OfferLetter', offerLetterSchema);

module.exports = OfferLetter;
