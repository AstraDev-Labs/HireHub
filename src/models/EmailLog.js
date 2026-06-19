const mongoose = require('mongoose');
const { logsDb } = require('../config/db');
const { v4: uuidv4 } = require('uuid');

const emailLogSchema = new mongoose.Schema({
    id: {
        type: String,
        default: () => uuidv4(),
        index: true
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

const EmailLog = logsDb.model('EmailLog', emailLogSchema);

module.exports = EmailLog;
