import mongoose from 'mongoose';
import Course from './models/Course.js';
import connectDB from './config/db.js';
import dotenv from 'dotenv';

dotenv.config();

const runTest = async () => {
    try {
        await connectDB();

        console.log('Creating test course...');

        // 1. Create Course
        const course = await Course.create({
            title: 'Test Course ' + Date.now(),
            description: 'Test Description',
            difficultyLevel: 'Beginner',
            estimatedDuration: { value: 1, unit: 'days' },
            price: 100,
            createdBy: 'test-admin'
        });

        console.log('✨ Created Course:', course.title);
        console.log('🆔 Generated Course ID:', course.courseId);

        if (course.courseId && course.courseId.startsWith('C-')) {
            console.log('✅ Course ID Auto-Generation Passed');
        } else {
            console.log('❌ Course ID Auto-Generation Failed');
        }

        // Clean up
        await Course.findByIdAndDelete(course._id);
        console.log('🧹 Cleanup done');

        process.exit(0);
    } catch (error) {
        console.error('Test Failed:', error);
        process.exit(1);
    }
};

runTest();
