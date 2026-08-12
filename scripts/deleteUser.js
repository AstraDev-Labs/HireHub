require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');

async function deleteUser() {
    try {
        await mongoose.connect(process.env.SYSTEM_DB_URI);
        console.log("Connected to MongoDB.");

        const email = 'tarun.ganapathi2007@gmail.com';
        
        const result = await User.deleteMany({ email: email });
        console.log(`Deleted ${result.deletedCount} user(s) with email ${email}`);

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await mongoose.disconnect();
        console.log("Disconnected.");
    }
}

deleteUser();
