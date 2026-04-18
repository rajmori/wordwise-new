import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000/api';
let token = '';
let courseId = '';

const testSignup = async () => {
    console.log('\n🔵 Testing Signup to get Token...');
    const res = await fetch(`${BASE_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: 'Purchase Tester',
            email: `tester_${Date.now()}@example.com`,
            password: 'password123'
        })
    });

    const data = await res.json();
    if (res.status === 201 || res.status === 200) {
        token = data.token;
        console.log('✅ Signup Passed. Token received.');
        console.log('🔑 Token preview:', token.substring(0, 20) + '...');
    } else {
        console.log('❌ Signup Failed:', data.message);
        process.exit(1);
    }
};

const getPublishedCourses = async () => {
    console.log('\n🔵 Fetching Published Courses...');
    const res = await fetch(`${BASE_URL}/courses/published`);
    const data = await res.json();

    if (data.success && data.data.length > 0) {
        courseId = data.data[0]._id;
        console.log('✅ Found course:', data.data[0].title, `(ID: ${courseId})`);
    } else {
        console.log('❌ No published courses found');
        process.exit(1);
    }
};

const testCreateOrder = async () => {
    console.log('\n🔵 Testing Create Course Order...');

    if (!token || !courseId) {
        console.log('❌ Missing token or courseId');
        return;
    }

    console.log(`📤 Sending request with token to /course-orders/create...`);

    const res = await fetch(`${BASE_URL}/course-orders/create`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ courseId })
    });

    const data = await res.json();
    console.log(`📥 Response Status: ${res.status}`);
    console.log('Response Body:', JSON.stringify(data, null, 2));

    if (res.status === 200 && data.success) {
        console.log('✅ Order Creation SUCCESS');
    } else {
        console.log('❌ Order Creation FAILED');
    }
};

const runTests = async () => {
    try {
        await testSignup();
        await getPublishedCourses();
        await testCreateOrder();
    } catch (error) {
        console.error('Test Error:', error);
    }
};

runTests();
