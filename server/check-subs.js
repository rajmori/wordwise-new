
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/user.model.js';

dotenv.config();

async function checkUsers() {
    try {
        console.log("Connecting to DB at", process.env.MONGODB_URI);
        if (!process.env.MONGODB_URI) {
            console.log("MONGODB_URI missing!");
            return;
        }

        await mongoose.connect(process.env.MONGODB_URI);

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
