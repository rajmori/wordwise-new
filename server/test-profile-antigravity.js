import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000/api';
let token = '';

const testSignup = async () => {
    console.log('\n🔵 Testing Signup for Profile Test...');
    const res = await fetch(`${BASE_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: 'Profile Tester',
            email: `profile_${Date.now()}@example.com`,
            password: 'password123'
        })
    });

    const data = await res.json();
    console.log(`Signup Status: ${res.status}`);

    if (res.status === 201) {
        token = data.token;
        console.log('✅ Signup Passed');
    } else {
        console.log('❌ Signup Failed');
    }
    return data;
};

const testGetProfile = async () => {
    console.log('\n🔵 Testing GET Profile...');
    const res = await fetch(`${BASE_URL}/profile`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    const data = await res.json();
    console.log(`GET Status: ${res.status}`);

    if (res.status === 200 && data.email) {
        console.log('✅ GET Profile Passed');
        console.log('Profile Data:', data);
    } else {
        console.log('❌ GET Profile Failed');
    }
};

const testUpdateProfile = async () => {
    console.log('\n🔵 Testing PUT Profile (Name Update)...');
    const res = await fetch(`${BASE_URL}/profile`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            name: 'Profile Updated Name'
        })
    });

    const data = await res.json();
    console.log(`PUT Status: ${res.status}`);

    if (res.status === 200 && data.name === 'Profile Updated Name') {
        console.log('✅ PUT Profile Passed (Name Updated)');
    } else {
        console.log('❌ PUT Profile Failed');
    }
};

const testUnauthorizedAccess = async () => {
    console.log('\n🔵 Testing Unauthorized Access...');
    const res = await fetch(`${BASE_URL}/profile`, {
        method: 'GET'
    });

    console.log(`Unauthorized Status: ${res.status}`);

    if (res.status === 401) {
        console.log('✅ Unauthorized Access Blocked');
    } else {
        console.log('❌ Unauthorized Access Failed (Should be 401)');
    }
};

const runTests = async () => {
    try {
        await testSignup();
        if (token) {
            await testGetProfile();
            await testUpdateProfile();
            await testUnauthorizedAccess();
        }
    } catch (error) {
        console.error('Test Error:', error);
    }
};

runTests();
