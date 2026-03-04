const dynamoose = require('../config/dynamodb');
const { v4: uuidv4 } = require('uuid');

const emailLogSchema = new dynamoose.Schema({
    id: {
        type: String,
        hashKey: true,
        default: () => uuidv4()
    },
    sentTo: { type: String, required: true },
    sentBy: { type: String, required: true },
    companyId: String,
    subject: String,
    message: String,
    sentAt: {
        type: String,
        default: () => new Date().toISOString()
    }
}, {
    timestamps: false
});

const EmailLog = dynamoose.model('EmailLog', emailLogSchema);

module.exports = EmailLog;
