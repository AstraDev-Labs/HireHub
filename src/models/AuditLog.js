const mongoose = require('mongoose');
const { logsDb } = require('../config/db');
const { v4: uuidv4 } = require('uuid');

const auditLogSchema = new mongoose.Schema({
    id: {
        type: String,
        default: () => uuidv4(),
        index: true
    },
    actorId: {
        type: String,
        required: true,
        index: true
    },
    actorName: {
        type: String,
        required: true
    },
    actorRole: {
        type: String,
        required: true,
        enum: ['ADMIN', 'STAFF', 'COMPANY']
    },
    action: {
        type: String,
        required: true, // e.g., 'CREATE', 'UPDATE', 'DELETE'
        index: true
    },
    resource: {
        type: String,
        required: true // e.g., 'Challenge', 'Drive', 'Interview'
    },
    resourceId: String,
    details: String // Human-readable description
}, {
    timestamps: {
        createdAt: 'timestamp',
        updatedAt: false
    }
});

auditLogSchema.statics.findAll = async function (filter = {}) {
    return this.find(filter);
};

const AuditLog = logsDb.model('AuditLog', auditLogSchema);

module.exports = AuditLog;
