import Razorpay from 'razorpay';
import dotenv from 'dotenv';

dotenv.config();

console.log('🧪 Testing Razorpay Connection...\n');

console.log('📋 Configuration:');
console.log('Key ID:', process.env.RAZORPAY_KEY_ID);
console.log('Key Secret:', process.env.RAZORPAY_KEY_SECRET ? '***' + process.env.RAZORPAY_KEY_SECRET.slice(-4) : 'NOT SET');
console.log('Plan ID:', process.env.RAZORPAY_PLAN_ID);
console.log('');

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

async function testRazorpay() {
    try {
        console.log('1️⃣ Testing: Fetch Plan Details...');
        const plan = await razorpay.plans.fetch(process.env.RAZORPAY_PLAN_ID);
        console.log('✅ Plan fetched successfully:');
        console.log('   - Plan ID:', plan.id);
        console.log('   - Plan Name:', plan.item.name);
        console.log('   - Amount:', plan.item.amount / 100, plan.item.currency);
        console.log('   - Period:', plan.period);
        console.log('   - Interval:', plan.interval);
        console.log('');

        console.log('2️⃣ Testing: Create Test Customer...');
        const customer = await razorpay.customers.create({
            name: 'Test User',
            email: 'test@example.com',
            contact: '9999999999',
            notes: {
                test: 'true'
            }
        });
        console.log('✅ Customer created successfully:');
        console.log('   - Customer ID:', customer.id);
        console.log('   - Name:', customer.name);
        console.log('   - Email:', customer.email);
        console.log('');

        console.log('3️⃣ Testing: Create Test Subscription...');
        const subscription = await razorpay.subscriptions.create({
            plan_id: process.env.RAZORPAY_PLAN_ID,
            customer_notify: 0,
            quantity: 1,
            total_count: 12,
            notes: {
                test: 'true'
            }
        });
        console.log('✅ Subscription created successfully:');
        console.log('   - Subscription ID:', subscription.id);
        console.log('   - Status:', subscription.status);
        console.log('   - Plan ID:', subscription.plan_id);
        console.log('');

        console.log('4️⃣ Cleaning up: Cancelling test subscription...');
        await razorpay.subscriptions.cancel(subscription.id);
        console.log('✅ Test subscription cancelled');
        console.log('');

        console.log('🎉 All tests passed! Razorpay is configured correctly!');
        console.log('');

    } catch (error) {
        console.error('❌ Test failed!');
        console.error('');
        console.error('Error details:');
        console.error('   - Status Code:', error.statusCode);
        console.error('   - Error:', error.error);
        console.error('');
        
        if (error.statusCode === 401) {
            console.error('🔴 Authentication Error!');
            console.error('');
            console.error('This means your Razorpay credentials are incorrect.');
            console.error('');
            console.error('Please verify:');
            console.error('1. Go to https://dashboard.razorpay.com/app/keys');
            console.error('2. Make sure you\'re in TEST mode (not LIVE mode)');
            console.error('3. Copy the Key ID and Key Secret exactly');
            console.error('4. Update server/.env with the correct credentials');
            console.error('');
        } else if (error.statusCode === 400) {
            console.error('🔴 Bad Request Error!');
            console.error('');
            console.error('Possible issues:');
            console.error('- Plan ID might be incorrect');
            console.error('- Plan might not exist');
            console.error('- Plan might be in LIVE mode while using TEST keys');
            console.error('');
        }
        
        process.exit(1);
    }
}

testRazorpay();

