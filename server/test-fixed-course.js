// Test course creation with fixed data
import fetch from 'node-fetch';

async function testFixedCourse() {
    try {
        // Login
        const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'admin@wordwise.com',
                password: 'admin123'
            })
        });

        const loginData = await loginResponse.json();
        const token = loginData.token;
        console.log('✅ Logged in\n');

        // Create course with modules but NO lesson objects
        const courseData = {
            title: 'Fixed Test Course',
            description: 'Testing with fixed module structure',
            difficultyLevel: 'Beginner',
            estimatedDuration: {
                value: 7,
                unit: 'days'
            },
            learningOutcomes: ['Outcome 1', 'Outcome 2'],
            targetAudience: ['Students'],
            modules: [
                {
                    title: 'Module 1',
                    description: 'First module',
                    order: 0,
                    lessons: [] // Empty array - no lesson objects
                }
            ],
            status: 'draft'
        };

        console.log('Sending course data:', JSON.stringify(courseData, null, 2));

        const createResponse = await fetch('http://localhost:5000/api/courses', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(courseData)
        });

        const createData = await createResponse.json();

        if (createData.success) {
            console.log('\n✅ SUCCESS! Course created!');
            console.log('Course ID:', createData.data._id);
            console.log('Title:', createData.data.title);
            console.log('Modules:', createData.data.modules.length);
        } else {
            console.log('\n❌ FAILED');
            console.log('Response:', JSON.stringify(createData, null, 2));
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

testFixedCourse();
