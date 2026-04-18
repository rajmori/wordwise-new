import Razorpay from 'razorpay';
import dotenv from 'dotenv';

dotenv.config();

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

async function testNewPlan() {
    try {
        console.log('🔍 Testing Razorpay Configuration\n');
        console.log('🔑 API Key ID:', process.env.RAZORPAY_KEY_ID);
        console.log('🔑 API Key Secret:', '***' + process.env.RAZORPAY_KEY_SECRET.slice(-4));
        console.log('📋 Plan ID:', process.env.RAZORPAY_PLAN_ID);
        console.log('');

        // Fetch plan details
        console.log('📥 Fetching plan details...');
        const plan = await razorpay.plans.fetch('plan_Rt3pLdBd9FLFPT');

        console.log('\n✅ Plan Details:');
        console.log('   - Plan ID:', plan.id);
        console.log('   - Plan Name:', plan.item.name);
        console.log('   - Amount:', plan.item.amount / 100, 'INR');
        console.log('   - Currency:', plan.item.currency);
        console.log('   - Period:', plan.period);
        console.log('   - Interval:', plan.interval);
        console.log('   - Description:', plan.item.description || 'N/A');
        console.log('   - Active:', plan.item.active);

        console.log('\n✅ Razorpay API keys are valid!');
        console.log('✅ Plan is accessible and ready to use!');

    } catch (error) {
        console.error('\n❌ Error:', error.error || error.message);
        if (error.statusCode === 401) {
            console.error('\n⚠️  Authentication failed! API keys might be incorrect.');
        } else if (error.statusCode === 400) {
            console.error('\n⚠️  Plan might not exist or might be in LIVE mode while using TEST keys');
        }
    }
}

testNewPlan();

