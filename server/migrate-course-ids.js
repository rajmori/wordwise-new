import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Course from './models/Course.js';

dotenv.config();

const migrate = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        const courses = await Course.find({
            $or: [
                { courseId: { $exists: false } },
                { courseId: null },
                { courseId: '' }
            ]
        });

        console.log(`🚀 Found ${courses.length} courses needing IDs.`);

        for (const course of courses) {
            console.log(`🔹 Processing: ${course.title}`);
            // Saving will trigger the pre-save hook to generate courseId
            await course.save();
            console.log(`✅ Assigned ID: ${course.courseId}`);
        }

        console.log('🎉 Migration completed successfully!');
    } catch (error) {
        console.error('❌ Migration failed:', error);
    } finally {
        await mongoose.disconnect();
    }
};

migrate();
