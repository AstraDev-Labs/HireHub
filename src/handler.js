const serverless = require('serverless-http');
const app = require('./server');

// Wrap Express app for AWS Lambda
module.exports.handler = serverless(app);
