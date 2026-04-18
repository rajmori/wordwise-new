
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './server/models/user.model.js';

dotenv.config({ path: './server/.env' }); // Adjust path if needed, assuming running from root
// If .env is in root, use dotenv.config()

async function checkUsers() {
    try {
        if (!process.env.MONGODB_URI) {
            // Fallback for dev if needed, or error
            console.log("MONGODB_URI not found.");
            // Try server/.env
            dotenv.config({ path: 'server/.env' });
        }

        console.log("Connecting to DB...");
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/wordwise');

        const users = await User.find({}, 'name email isSubscribed');
        console.log("\n--- User Subscription Status ---");
        users.forEach(u => {
            console.log(`User: ${u.name} (${u.email}) | Subscribed: ${u.isSubscribed}`);
        });
        console.log("--------------------------------\n");

        await mongoose.disconnect();
    } catch (error) {
        console.error(error);
    }
}

checkUsers();
