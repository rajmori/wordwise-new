import fetch from 'node-fetch';
import assert from 'assert';

const BASE_URL = 'http://localhost:3000/api/auth';
let authToken = '';
let cookie = '';

const runTest = async () => {
    try {
        console.log('🚀 Starting Refresh Token Test...');

        // 1. Signup/Login
        console.log('1️⃣ Logging in...');
        const loginRes = await fetch(`${BASE_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'raj.mori@example.com', password: 'password123' }) // Assuming this user exists from previous tests or seed
        });

        // If login fails, try signup (user might not exist)
        let data;
        let response = loginRes;

        if (loginRes.status === 400) {
            console.log('   User not found, signing up...');
            response = await fetch(`${BASE_URL}/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: 'Refresh Test', email: 'refresh.test@example.com', password: 'password123' })
            });
        }

        data = await response.json();
        authToken = data.token;

        // Extract cookie
        const rawCookie = response.headers.get('set-cookie');
        if (!rawCookie || !rawCookie.includes('refreshToken=')) {
            throw new Error('❌ No refreshToken cookie received!');
        }
        cookie = rawCookie.split(';')[0]; // Extract just the key=value
        console.log('✅ Login successful. Received Cookie:', cookie.substring(0, 20) + '...');

        // 2. Refresh Token
        console.log('2️⃣ Testing Refresh Token endpoint...');
        const refreshRes = await fetch(`${BASE_URL}/refresh-token`, {
            method: 'POST',
            headers: {
                'Cookie': cookie
            }
        });

        if (refreshRes.status !== 200) {
            const err = await refreshRes.json();
            throw new Error(`❌ Refresh failed: ${err.message}`);
        }

        const refreshData = await refreshRes.json();
        const newCookie = refreshRes.headers.get('set-cookie');

        if (!refreshData.token) throw new Error('❌ No access token in refresh response');
        if (refreshData.token === authToken) console.warn('⚠️ Access Token is same? (It should be new)');
        if (!newCookie) throw new Error('❌ No new cookie set after refresh (Rotation failed)');

        cookie = newCookie.split(';')[0]; // Update cookie
        console.log('✅ Refresh successful. New Token received.');

        // 3. Logout
        console.log('3️⃣ Testing Logout...');
        const logoutRes = await fetch(`${BASE_URL}/logout`, {
            method: 'POST',
            headers: { 'Cookie': cookie }
        });

        if (logoutRes.status !== 200) throw new Error('❌ Logout failed');

        const logoutCookie = logoutRes.headers.get('set-cookie');
        if (!logoutCookie || !logoutCookie.includes('refreshToken=;')) {
            console.warn('⚠️ Cookie might not be explicitly cleared in header, logic check needed.');
        }
        console.log('✅ Logout successful.');

        // 4. Verify Refresh Fails after Logout
        console.log('4️⃣ Verifying Refresh fails after logout...');
        const finalRes = await fetch(`${BASE_URL}/refresh-token`, {
            method: 'POST',
            headers: { 'Cookie': cookie } // Trying to use the old cookie (which ideally the client would have cleared, but if they kept it...)
            // Wait, logout clears it on CLIENT. But we also deleted it from DB.
        });

        if (finalRes.status === 403 || finalRes.status === 401) {
            console.log('✅ Verified: Refresh denied after logout.');
        } else {
            const d = await finalRes.json();
            throw new Error(`❌ Refresh succeeded after logout! Status: ${finalRes.status}`);
        }

        console.log('🎉 All Refresh Token tests passed!');

    } catch (error) {
        console.error('❌ Test Failed:', error);
        process.exit(1);
    }
};

// Wait for server to start roughly
setTimeout(runTest, 5000);
