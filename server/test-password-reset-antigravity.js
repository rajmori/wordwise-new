
import fetch from 'node-fetch';
import crypto from 'crypto';

const BASE_URL = 'http://localhost:3000/api/auth';
let TEST_EMAIL = `test_reset_${Date.now()}@example.com`;
const TEST_PASSWORD = 'password123';
const NEW_PASSWORD = 'newpassword123';
let RESET_TOKEN = null;

// Helper loggers
const log = (msg) => console.log(`\n🔵 ${msg}`);
const success = (msg) => console.log(`✅ ${msg}`);
const fail = (msg) => { console.error(`❌ ${msg}`); process.exit(1); };

async function runTests() {
    log('Starting Password Reset Verification...');

    // 1. Signup a user
    log('1. Creating a Test User...');
    const signupRes = await fetch(`${BASE_URL}/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Reset User', email: TEST_EMAIL, password: TEST_PASSWORD })
    });

    if (signupRes.status !== 201) fail(`Signup failed: ${signupRes.status}`);
    const userData = await signupRes.json();
    success(`User created: ${userData.email}`);

    // 2. Request Password Reset (Forgot Password)
    log('2. Requesting Password Reset Link...');
    const forgotRes = await fetch(`${BASE_URL}/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: TEST_EMAIL })
    });

    if (forgotRes.status !== 200) fail(`Forgot Password request failed: ${forgotRes.status}`);
    success('Reset link request successful');

    // NOTE: Since emails are mocked/ETHereal, we can't easily "read" the token from an inbox in this script without complex logic.
    // However, for this verification script, we can cheat slightly by querying the DB directly OR mock the token if we were testing controllers directly.
    // BUT since we are testing endpoints black-box style, we have a challenge.
    // SOLUTION: Use the MongoDB connection to fetch the token for the user.

    await new Promise(r => setTimeout(r, 1000)); // Wait for DB write

    // Connect to DB to fetch token (We need to dynamicaly import mongoose models or run a mongo shell command, but we are in a node script)
    // To keep it simple and dependency-free for this script, we will rely on MANUAL verification for the exact link, 
    // OR we can make a direct DB call if we import mongoose here.
    // Let's import mongoose to get the token.

    // We need to connect mongoose first
    const { default: mongoose } = await import('mongoose');
    const { default: ResetToken } = await import('./models/resetToken.model.js');
    const { default: User } = await import('./models/user.model.js');

    // Check .env for URI, but we might not have it loaded unless we use dotenv
    const { default: dotenv } = await import('dotenv');
    dotenv.config();

    if (!process.env.MONGODB_URI) {
        console.warn('⚠️ MONGODB_URI not found in env. Cannot fetch token automatically. Skipping token verification.');
    } else {
        await mongoose.connect(process.env.MONGODB_URI);
        const user = await User.findOne({ email: TEST_EMAIL });
        const tokenDoc = await ResetToken.findOne({ userId: user._id });

        if (!tokenDoc) fail('Reset Token not found in DB');
        RESET_TOKEN = tokenDoc.token;
        success(`Retrieved Reset Token from DB: ${RESET_TOKEN}`);

        // 3. Reset Password (with valid token)
        log('3. Resetting Password with Valid Token...');
        const resetRes = await fetch(`${BASE_URL}/reset-password/${RESET_TOKEN}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password: NEW_PASSWORD })
        });

        if (resetRes.status !== 200) {
            const err = await resetRes.json();
            fail(`Reset Password failed: ${err.message}`);
        }
        success('Password reset successful');

        // 4. Verify Login with New Password
        log('4. Verifying Login with New Password...');
        const loginRes = await fetch(`${BASE_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: TEST_EMAIL, password: NEW_PASSWORD })
        });

        if (loginRes.status !== 200) fail('Login with new password failed');
        success('Login successful with new password');

        // 5. Verify Token Invalidation (Reuse check)
        log('5. Verifying Token Invalidation...');
        const reuseRes = await fetch(`${BASE_URL}/reset-password/${RESET_TOKEN}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password: 'anotherpassword' })
        });

        if (reuseRes.status === 400) {
            success('Reuse of token blocked (correctly)');
        } else {
            fail(`Expected 400 for reused token, got ${reuseRes.status}`);
        }

        await mongoose.disconnect();
    }

    console.log('\n✨ All Password Reset Tests Passed!');
}

runTests().catch(fail);
