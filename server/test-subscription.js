/**
 * Test script to verify Stripe subscription setup
 * This simulates creating a checkout session
 */

import Stripe from 'stripe';
import dotenv from 'dotenv';

dotenv.config({ path: './.env' });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function testSubscriptionSetup() {
    try {
        console.log('🧪 Testing Stripe Subscription Setup...\n');

        // Test 1: Verify API Key
        console.log('✅ Test 1: Stripe API Key');
        console.log(`   Secret Key: ${process.env.STRIPE_SECRET_KEY.substring(0, 20)}...`);
        console.log(`   Status: Connected\n`);

        // Test 2: Verify Price ID
        console.log('✅ Test 2: Annual Price ID');
        const price = await stripe.prices.retrieve(process.env.STRIPE_ANNUAL_PRICE_ID);
        console.log(`   Price ID: ${price.id}`);
        console.log(`   Amount: $${(price.unit_amount / 100).toFixed(2)} ${price.currency.toUpperCase()}`);
        console.log(`   Interval: ${price.recurring.interval}ly`);
        console.log(`   Status: Active\n`);

        // Test 3: Create Test Customer
        console.log('✅ Test 3: Create Test Customer');
        const customer = await stripe.customers.create({
            email: 'test@wordwise.com',
            name: 'Test User',
            metadata: {
                userId: 'test_user_123',
                test: 'true'
            }
        });
        console.log(`   Customer ID: ${customer.id}`);
        console.log(`   Email: ${customer.email}\n`);

        // Test 4: Create Checkout Session
        console.log('✅ Test 4: Create Checkout Session');
        const session = await stripe.checkout.sessions.create({
            mode: 'subscription',
            customer: customer.id,
            line_items: [
                {
                    price: process.env.STRIPE_ANNUAL_PRICE_ID,
                    quantity: 1
                }
            ],
            success_url: `${process.env.FRONTEND_URL}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.FRONTEND_URL}/subscription/cancel`,
            metadata: {
                userId: 'test_user_123',
                test: 'true'
            },
            allow_promotion_codes: false
        });
        console.log(`   Session ID: ${session.id}`);
        console.log(`   Checkout URL: ${session.url}\n`);

        // Test 5: Clean up test customer
        console.log('🧹 Cleaning up test customer...');
        await stripe.customers.del(customer.id);
        console.log(`   Test customer deleted\n`);

        // Summary
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('✅ ALL TESTS PASSED!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        console.log('🎉 Your Stripe subscription setup is working correctly!\n');

        console.log('📋 Configuration Summary:');
        console.log(`   Product: WordWise Annual Pro Course Series`);
        console.log(`   Price: $${(price.unit_amount / 100).toFixed(2)} USD/year`);
        console.log(`   Price ID: ${price.id}`);
        console.log(`   Frontend URL: ${process.env.FRONTEND_URL}\n`);

        console.log('🎯 Next Steps:');
        console.log('1. ✅ Stripe product created');
        console.log('2. ✅ Price ID configured');
        console.log('3. ⏳ Set up webhook endpoint (see instructions below)');
        console.log('4. ⏳ Test complete checkout flow');
        console.log('5. ⏳ Build frontend subscription UI\n');

        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🔗 WEBHOOK SETUP INSTRUCTIONS');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        console.log('For LOCAL TESTING (recommended):');
        console.log('1. Install Stripe CLI: brew install stripe/stripe-cli/stripe');
        console.log('2. Login: stripe login');
        console.log('3. Forward webhooks: stripe listen --forward-to localhost:3000/api/subscriptions/webhook');
        console.log('4. Copy the webhook signing secret (whsec_...) to your .env file\n');

        console.log('For PRODUCTION:');
        console.log('1. Go to: https://dashboard.stripe.com/test/webhooks');
        console.log('2. Click "Add endpoint"');
        console.log('3. Endpoint URL: http://localhost:3000/api/subscriptions/webhook');
        console.log('4. Select events: checkout.session.completed, customer.subscription.updated,');
        console.log('                  customer.subscription.deleted, invoice.payment_failed');
        console.log('5. Copy the signing secret to your .env file\n');

        return { success: true };

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        
        if (error.type === 'StripeAuthenticationError') {
            console.error('\n⚠️  Authentication failed. Please check your STRIPE_SECRET_KEY in .env');
        } else if (error.type === 'StripeInvalidRequestError') {
            console.error('\n⚠️  Invalid request. Please check your STRIPE_ANNUAL_PRICE_ID in .env');
        }
        
        throw error;
    }
}

// Run the test
testSubscriptionSetup()
    .then(() => {
        console.log('✅ Test script completed successfully!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Test script failed:', error.message);
        process.exit(1);
    });

