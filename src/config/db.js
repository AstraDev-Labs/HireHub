const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const systemURI = process.env.SYSTEM_DB_URI || 'mongodb://127.0.0.1:27017/placement_system';
const logsURI = process.env.LOGS_DB_URI || 'mongodb://127.0.0.1:27017/placement_logs';

// Set mongoose options if needed
mongoose.set('strictQuery', false);

// Secondary connection for logs
const logsDb = mongoose.createConnection(logsURI);
logsDb.on('connected', () => console.log(`✅ Logs DB Connected: ${logsDb.host}`));
logsDb.on('error', (err) => console.error(`❌ Logs DB Connection Error: ${err.message}`));

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(systemURI);
        console.log(`✅ System DB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`❌ System DB Connection Error: ${error.message}`);
        process.exit(1);
    }
};

module.exports = { connectDB, logsDb };
