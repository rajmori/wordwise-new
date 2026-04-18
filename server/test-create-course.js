// Test course creation API
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

async function testCourseCreation() {
    try {
        // First, login to get a token
        console.log('🔐 Logging in...');
        const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'admin@wordwise.com',
                password: 'admin123'
            })
        });

        const loginData = await loginResponse.json();
        console.log('Login response:', loginData);

        if (!loginData.success) {
            console.error('❌ Login failed');
            return;
        }

        const token = loginData.token;
        console.log('✅ Login successful, token received\n');

        // Now create a course
        console.log('📝 Creating test course...');
        const courseData = {
            title: 'API Test Course',
            description: 'Testing course creation via API',
            difficultyLevel: 'Beginner',
            estimatedDuration: {
                value: 7,
                unit: 'days'
            },
            learningOutcomes: ['Test outcome 1', 'Test outcome 2'],
            targetAudience: ['Test audience'],
            modules: [],
            status: 'draft'
        };

        const createResponse = await fetch('http://localhost:5000/api/courses', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(courseData)
        });

        const createData = await createResponse.json();
        console.log('Create course response:', JSON.stringify(createData, null, 2));

        if (createData.success) {
            console.log('\n✅ Course created successfully!');
            console.log('Course ID:', createData.data._id);
        } else {
            console.log('\n❌ Course creation failed');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

testCourseCreation();
