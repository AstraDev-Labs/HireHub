const dynamoose = require('dynamoose');
const https = require('https');
const { NodeHttpHandler } = require("@aws-sdk/node-http-handler");

// Create a high-throughput HTTP handler for massive concurrency (10k+ requests)
const requestHandler = new NodeHttpHandler({
    httpsAgent: new https.Agent({
        maxSockets: 500,
        keepAlive: true,
        timeout: 3000
    })
});

// Helper to ensure AWS credentials are set correctly
const setupAWS = () => {
    // If we have explicit credentials in env, use them
    if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
        const ddb = new dynamoose.aws.ddb.DynamoDB({
            region: process.env.AWS_REGION || 'eu-north-1',
            requestHandler: requestHandler,
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
            }
        });
        dynamoose.aws.ddb.set(ddb);
        console.log(`✅ Connected to DynamoDB (${process.env.AWS_REGION || 'eu-north-1'}) with explicit credentials and pooling`);
    } else if (process.env.NODE_ENV === 'development' && process.env.DYNAMODB_LOCAL === 'true') {
        dynamoose.aws.ddb.local(process.env.DYNAMODB_LOCAL_ENDPOINT || 'http://localhost:8000');
        console.log('✅ Connected to DynamoDB Local');
    } else {
        // Fallback to default AWS credential provider (IAM roles, etc.)
        const ddb = new dynamoose.aws.ddb.DynamoDB({
            region: process.env.AWS_REGION || 'eu-north-1',
            requestHandler: requestHandler
        });
        dynamoose.aws.ddb.set(ddb);
        console.log(`✅ Connected to DynamoDB (${process.env.AWS_REGION || 'eu-north-1'}) using default provider and pooling`);
    }
};

setupAWS();

// Global settings - V4 syntax: dynamoose.Table.defaults
dynamoose.Table.defaults.set({
    create: true,       // Auto-create tables if they don't exist
    waitForActive: true, // Wait until table is ACTIVE
    prefix: process.env.DYNAMODB_TABLE_PREFIX || 'cpms_'
});

module.exports = dynamoose;
