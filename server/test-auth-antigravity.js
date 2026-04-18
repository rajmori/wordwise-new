import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000/api/auth';
let token = '';

const testSignup = async () => {
    console.log('\n🔵 Testing Signup...');
    const res = await fetch(`${BASE_URL}/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: 'Antigravity User',
            email: `test_${Date.now()}@example.com`,
            password: 'password123'
        })
    });

    const data = await res.json();
    console.log(`Status: ${res.status}`);
    console.log('Response:', data);

    if (res.status === 201 || res.status === 200) {
        console.log('✅ Signup Passed');
        // Store user for login test if needed, but signup usually returns token
    } else {
        console.log('❌ Signup Failed');
    }
    return data;
};

const testLogin = async (email) => {
    console.log('\n🔵 Testing Login...');
    const res = await fetch(`${BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email: email,
            password: 'password123'
        })
    });

    const data = await res.json();
    console.log(`Status: ${res.status}`);
    // console.log('Response:', data);

    if (res.status === 200 && data.token) {
        token = data.token;
        console.log('✅ Login Passed (Token received)');
    } else {
        console.log('❌ Login Failed');
    }
};

const testGetMe = async () => {
    console.log('\n🔵 Testing Get Me...');
    if (!token) {
        console.log('⚠️ Skipping Get Me (No token)');
        return;
    }

    const res = await fetch(`${BASE_URL}/me`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    const data = await res.json();
    console.log(`Status: ${res.status}`);
    console.log('Response:', data);

    if (res.status === 200 && data.email) {
        console.log('✅ Get Me Passed');
    } else {
        console.log('❌ Get Me Failed');
    }
};

const runTests = async () => {
    try {
        const signupData = await testSignup();
        if (signupData.email) {
            await testLogin(signupData.email);
            await testGetMe();
        }
    } catch (error) {
        console.error('Test Error:', error);
    }
};

runTests();
