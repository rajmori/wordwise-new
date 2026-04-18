import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Course from './models/Course.js';

dotenv.config();

const inspect = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const courses = await Course.find({}, 'title courseId');
        console.log('📋 Current Course IDs:');
        courses.forEach(c => {
            console.log(`- ${c.title}: ${c.courseId || 'MISSING'}`);
        });
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
    }
};

inspect();
