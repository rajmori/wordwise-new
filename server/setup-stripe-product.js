/**
 * Script to create WordWise Annual Subscription Product in Stripe
 * Run this once to set up your subscription product
 */

import Stripe from 'stripe';
import dotenv from 'dotenv';

dotenv.config({ path: './.env' });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function createSubscriptionProduct() {
    try {
        console.log('🚀 Creating WordWise Annual Subscription Product...\n');

        // Step 1: Create Product
        console.log('📦 Step 1: Creating product...');
        const product = await stripe.products.create({
            name: 'WordWise Annual Pro Course Series',
            description: 'Annual subscription to all WordWise language learning courses with unlimited access to premium content',
            metadata: {
                type: 'annual_subscription',
                platform: 'wordwise'
            }
        });
        console.log(`✅ Product created: ${product.id}`);
        console.log(`   Name: ${product.name}\n`);

        // Step 2: Create Annual Price
        console.log('💰 Step 2: Creating annual price...');
        const price = await stripe.prices.create({
            product: product.id,
            unit_amount: 9900, // $99.00 in cents (change this to your desired price)
            currency: 'usd',
            recurring: {
                interval: 'year',
                interval_count: 1
            },
            metadata: {
                plan_name: 'Annual Pro'
            }
        });
        console.log(`✅ Price created: ${price.id}`);
        console.log(`   Amount: $${(price.unit_amount / 100).toFixed(2)} USD per year\n`);

        // Step 3: Display configuration
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('✅ STRIPE PRODUCT SETUP COMPLETE!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        console.log('📋 Add this to your server/.env file:\n');
        console.log(`STRIPE_ANNUAL_PRICE_ID=${price.id}\n`);

        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📊 Product Details:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`Product ID:    ${product.id}`);
        console.log(`Product Name:  ${product.name}`);
        console.log(`Price ID:      ${price.id}`);
        console.log(`Amount:        $${(price.unit_amount / 100).toFixed(2)} USD`);
        console.log(`Interval:      ${price.recurring.interval}ly`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        console.log('🎯 Next Steps:');
        console.log('1. Copy the STRIPE_ANNUAL_PRICE_ID line above');
        console.log('2. Add it to your server/.env file');
        console.log('3. Restart your backend server');
        console.log('4. Set up webhook endpoint (see STRIPE_SUBSCRIPTION_SETUP.md)\n');

        return { product, price };

    } catch (error) {
        console.error('❌ Error creating subscription product:', error.message);
        
        if (error.type === 'StripeAuthenticationError') {
            console.error('\n⚠️  Authentication failed. Please check your STRIPE_SECRET_KEY in server/.env');
        }
        
        throw error;
    }
}

// Run the script
createSubscriptionProduct()
    .then(() => {
        console.log('✅ Script completed successfully!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Script failed:', error.message);
        process.exit(1);
    });

