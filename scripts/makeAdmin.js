require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');

async function makeAdmin() {
    try {
        await mongoose.connect(process.env.SYSTEM_DB_URI);
        console.log("Connected to MongoDB.");

        const email = 'tarun.ganapathi2007@gmail.com'; // Adjust if you used a different email!
        
        const user = await User.findOne({ email });
        if (!user) {
            console.log(`User with email ${email} not found!`);
        } else {
            user.role = 'ADMIN';
            user.approvalStatus = 'APPROVED';
            await user.save({ validateBeforeSave: false });
            console.log(`Successfully upgraded ${email} to ADMIN and APPROVED their account!`);
        }
    } catch (err) {
        console.error("Error:", err);
    } finally {
        await mongoose.disconnect();
        console.log("Disconnected.");
    }
}

makeAdmin();
