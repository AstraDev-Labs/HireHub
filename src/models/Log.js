const mongoose = require('mongoose');
const { logsDb } = require('../config/db');
const { v4: uuidv4 } = require('uuid');

const logSchema = new mongoose.Schema({
    id: {
        type: String,
        default: uuidv4,
        index: true
    },
    userId: String,
    action: String,
    route: String,
    method: String,
    ipAddress: String,
    statusCode: Number,
    timestamp: {
        type: String,
        default: () => new Date().toISOString()
    },
    metadata: mongoose.Schema.Types.Mixed
}, {
    timestamps: false
});

const Log = logsDb.model('Log', logSchema);

module.exports = Log;
