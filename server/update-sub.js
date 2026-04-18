
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/user.model.js';

dotenv.config();

async function updateSub() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        const email = 'raj89@yopmail.com'; // User from screenshot
        // Or if the user just created 'rrr@yopmail.com' (last one), maybe that one?
        // The screenshot shows "R" avatar. 'raj89' starts with r, 'rrr' starts with r.
        // I will update BOTH 'raj89@yopmail.com' and 'rrr@yopmail.com' to be safe.

        await User.updateMany(
            { email: { $in: ['raj89@yopmail.com', 'rrr@yopmail.com'] } },
            { $set: { isSubscribed: true } }
        );

        console.log("Updated subscription for raj89@yopmail.com and rrr@yopmail.com to TRUE.");

        await mongoose.disconnect();
    } catch (error) {
        console.error(error);
    }
}

updateSub();
