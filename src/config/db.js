const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const systemURI = process.env.SYSTEM_DB_URI || 'mongodb://127.0.0.1:27017/placement_system';
const logsURI = process.env.LOGS_DB_URI || 'mongodb://127.0.01:27017/placement_logs';

// Connect to System DB (Default Connection)
const systemDB = mongoose.connection;

mongoose.connect(systemURI)
    .then(() => console.log('✅ Connected to placement_system database (Default)'))
    .catch(err => console.error(`❌ System DB Error: ${err.message}`));

// Connect to Logs DB (Separate Connection)
const logsDB = mongoose.createConnection(logsURI);

logsDB.on('connected', () => {
    console.log('✅ Connected to placement_logs database');
});

logsDB.on('error', (err) => {
    console.error(`❌ Logs DB Error: ${err.message}`);
});

module.exports = { systemDB, logsDB };
