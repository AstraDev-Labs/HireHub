const dynamoose = require('../config/dynamodb');
const { v4: uuidv4 } = require('uuid');

const offerLetterSchema = new dynamoose.Schema({
    id: {
        type: String,
        hashKey: true,
        default: () => uuidv4()
    },
    studentId: {
        type: String,
        required: true,
        index: { name: 'StudentOfferIndex', type: 'global' }
    },
    companyId: {
        type: String,
        required: true,
        index: { name: 'CompanyOfferIndex', type: 'global' }
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
    issuedBy: String
}, {
    timestamps: true
});

const OfferLetter = dynamoose.model('OfferLetter', offerLetterSchema);

OfferLetter.findById = async function (id) {
    try { return await OfferLetter.get(id); } catch { return null; }
};

OfferLetter.findByStudentId = async function (studentId) {
    return OfferLetter.query('studentId').eq(studentId).using('StudentOfferIndex').exec();
};

OfferLetter.findByCompanyId = async function (companyId) {
    return OfferLetter.query('companyId').eq(companyId).using('CompanyOfferIndex').exec();
};

OfferLetter.findAll = async function () {
    return OfferLetter.scan().exec();
};

module.exports = OfferLetter;
