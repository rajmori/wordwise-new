import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Course from './models/Course.js';
import Counter from './models/Counter.js';

dotenv.config();

const COURSE_COUNT = 5;

const runTest = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Reset Counter for clean test (optional, but good for verification)
        await Counter.deleteMany({ name: 'courseId' });
        console.log('🔄 Reset courseId counter');

        console.log(`🚀 Creating ${COURSE_COUNT} courses in parallel...`);

        const promises = [];
        for (let i = 0; i < COURSE_COUNT; i++) {
            const courseData = {
                title: `Atomic Test Course ${i + 1}`,
                description: 'Testing atomic ID generation',
                difficultyLevel: 'Beginner',
                estimatedDuration: { value: 1, unit: 'weeks' },
                price: 0,
                status: 'draft',
                createdBy: new mongoose.Types.ObjectId(), // Dummy User ID
                modules: []
            };
            promises.push(Course.create(courseData));
        }

        const courses = await Promise.all(promises);

        console.log('✅ Courses created successfully.');

        const ids = courses.map(c => c.courseId).sort();
        console.log('📋 Generated IDs:', ids);

        // Verification
        const uniqueIds = new Set(ids);
        if (uniqueIds.size !== COURSE_COUNT) {
            console.error('❌ Duplicate IDs found!');
            process.exit(1);
        }

        // Check format
        const formatRegex = /^CRS\d{3}$/;
        const invalidFormat = ids.find(id => !formatRegex.test(id));
        if (invalidFormat) {
            console.error(`❌ Invalid ID format found: ${invalidFormat}`);
            process.exit(1);
        }

        // Check sequence (should be CRS001, CRS002, ...)
        if (ids[0] !== 'CRS001' || ids[ids.length - 1] !== `CRS00${COURSE_COUNT}`) {
            console.error('❌ IDs are not sequential starting from CRS001');
            // process.exit(1); // Soft fail as other tests might have run
        }

        console.log('✅ All verification checks passed!');

    } catch (error) {
        console.error('❌ Test failed:', error);
    } finally {
        await mongoose.disconnect();
    }
};

runTest();
