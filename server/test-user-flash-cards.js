import mongoose from 'mongoose';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import Subscription from './models/Subscription.js';
import User from './models/user.model.js';

dotenv.config();

const BASE_URL = 'http://localhost:3000/api';

const runTest = async () => {
    try {
        console.log('🧪 Testing User Flash Card Access (Full Flow)...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB for setup');

        // 1. Test without token (Should be 401)
        const resNoAuth = await fetch(`${BASE_URL}/flash-cards/user`);
        console.log(`No Auth Status: ${resNoAuth.status} (Expected 401)`);

        // 2. Login/Signup as regular user
        const email = `testuser_${Date.now()}@example.com`;
        const signupRes = await fetch(`${BASE_URL}/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Test User',
                email,
                password: 'password123'
            })
        });
        const signupData = await signupRes.json();

        if (!signupData._id || !signupData.token) {
            console.error('❌ Signup Failed (Unexpected format):', signupData);
            return;
        }

        const token = signupData.token;
        const userId = signupData._id;
        console.log(`User created. Token obtained. ID: ${userId}`);

        // 3. Test with token but NO subscription (Should be 403)
        const resNoSub = await fetch(`${BASE_URL}/flash-cards/user`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const dataNoSub = await resNoSub.json();
        console.log(`No Sub Status: ${resNoSub.status} (Expected 403)`);

        // 4. Manually create subscription in DB
        const sub = await Subscription.create({
            userId: userId,
            planName: 'Premium',
            status: 'active',
            startDate: new Date(),
            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
            razorpaySubscriptionId: 'sub_test_123'
        });
        console.log('✅ Subscription created in DB manually');

        // 5. Test WITH subscription (Should be 200)
        const resSub = await fetch(`${BASE_URL}/flash-cards/user`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        console.log(`With Sub Status: ${resSub.status} (Expected 200)`);
        if (resSub.status !== 200) {
            const errorText = await resSub.text();
            console.error('❌ Error Body:', errorText);
        } else {
            const dataSub = await resSub.json();
            console.log(`✅ Success! Got ${dataSub.count} cards.`);
        }

    } catch (error) {
        console.error('❌ Test Error:', error);
    } finally {
        await mongoose.disconnect();
    }
};

runTest();
