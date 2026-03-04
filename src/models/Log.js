const dynamoose = require('../config/dynamodb');
const { v4: uuidv4 } = require('uuid');

const logSchema = new dynamoose.Schema({
    id: {
        type: String,
        hashKey: true,
        default: () => uuidv4()
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
    metadata: Object
}, {
    timestamps: false
});

const Log = dynamoose.model('Log', logSchema);

module.exports = Log;
