// Quick script to check MongoDB courses
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const courseSchema = new mongoose.Schema({}, { strict: false });
const Course = mongoose.model('Course', courseSchema);

async function checkCourses() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        const courses = await Course.find({});
        console.log(`\n📊 Total courses in database: ${courses.length}\n`);

        if (courses.length > 0) {
            courses.forEach((course, index) => {
                console.log(`\n--- Course ${index + 1} ---`);
                console.log(`ID: ${course._id}`);
                console.log(`Title: ${course.title}`);
                console.log(`Description: ${course.description}`);
                console.log(`Difficulty: ${course.difficultyLevel}`);
                console.log(`Status: ${course.status}`);
                console.log(`Modules: ${course.modules?.length || 0}`);
                console.log(`Created: ${course.createdAt}`);
            });
        } else {
            console.log('❌ No courses found in database');
        }

        await mongoose.disconnect();
        console.log('\n✅ Disconnected from MongoDB');
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

checkCourses();
