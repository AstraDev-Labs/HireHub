const dynamoose = require('../config/dynamodb');
const { v4: uuidv4 } = require('uuid');

const auditLogSchema = new dynamoose.Schema({
    id: {
        type: String,
        hashKey: true,
        default: () => uuidv4()
    },
    actorId: {
        type: String,
        required: true,
        index: { name: 'ActorIndex', type: 'global' }
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
        index: { name: 'ActionIndex', type: 'global' }
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
        updatedAt: null
    }
});

const AuditLog = dynamoose.model('AuditLog', auditLogSchema);

AuditLog.findAll = async function (filter = {}) {
    let scan = AuditLog.scan();
    for (const [key, value] of Object.entries(filter)) {
        scan = scan.where(key).eq(value);
    }
    return scan.exec();
};

module.exports = AuditLog;
