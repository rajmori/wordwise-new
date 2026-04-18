import Razorpay from 'razorpay';
import crypto from 'crypto';
import dotenv from 'dotenv';
import User from '../models/user.model.js';
import Subscription from '../models/Subscription.js';

dotenv.config();

// Initialize Razorpay
console.log('🔑 Razorpay Key ID:', process.env.RAZORPAY_KEY_ID);
console.log('🔑 Razorpay Key Secret:', process.env.RAZORPAY_KEY_SECRET ? '***' + process.env.RAZORPAY_KEY_SECRET.slice(-4) : 'NOT SET');
console.log('📋 Razorpay Plan ID:', process.env.RAZORPAY_PLAN_ID);

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

/**
 * Get Plan Details
 * GET /api/subscriptions/plan-details
 * Authentication: Not required (public endpoint)
 */
export const getPlanDetails = async (req, res) => {
    try {
        const planId = process.env.RAZORPAY_PLAN_ID;

        if (!planId) {
            return res.status(500).json({
                success: false,
                message: 'Plan ID not configured'
            });
        }

        console.log(`📋 Fetching plan details for: ${planId}`);

        // Fetch plan from Razorpay
        const plan = await razorpay.plans.fetch(planId);

        console.log(`✅ Plan details fetched: ${plan.item.name}`);

        res.json({
            success: true,
            plan: {
                id: plan.id,
                name: plan.item.name,
                description: plan.item.description || 'WordWise Premium - Annual Subscription',
                amount: plan.item.amount / 100, // Convert paise to rupees
                currency: plan.item.currency,
                period: plan.period,
                interval: plan.interval,
                active: plan.item.active
            }
        });

    } catch (error) {
        console.error('❌ Get Plan Details Error:', error);

        res.status(500).json({
            success: false,
            message: 'Failed to fetch plan details',
            error: error.message
        });
    }
};

/**
 * Create Payment Link for Vocabulary Course (One-time payment)
 * POST /api/subscriptions/create-payment-link
 * Authentication: Required (authenticateUser)
 */
export const createPaymentLink = async (req, res) => {
    try {
        // Get user from authenticated request
        const userId = req.user.id;

        // Find full user document
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check if user already has an active subscription
        const existingSubscription = await Subscription.findActiveForUser(userId);

        if (existingSubscription) {
            return res.status(400).json({
                success: false,
                message: 'You already have an active subscription'
            });
        }

        console.log(`🔗 Creating payment link for user: ${user.email}`);

        // Fetch plan details to get the amount
        const planId = process.env.RAZORPAY_PLAN_ID;
        let planAmount = parseInt(process.env.RAZORPAY_COURSE_AMOUNT) || 250000; // Default fallback
        let planDescription = 'WordWise Vocabulary Course - Annual Access';

        if (planId) {
            try {
                console.log(`📋 Fetching plan details for payment link: ${planId}`);
                const plan = await razorpay.plans.fetch(planId);
                planAmount = plan.item.amount; // Amount in paise
                planDescription = plan.item.description || plan.item.name || planDescription;
                console.log(`✅ Using plan amount: ₹${planAmount / 100} (${planAmount} paise)`);
            } catch (planError) {
                console.error('⚠️ Error fetching plan, using default amount:', planError.message);
            }
        }

        // Create Razorpay Payment Link
        const paymentLink = await razorpay.paymentLink.create({
            amount: planAmount, // Amount from plan in paise
            currency: 'INR',
            description: planDescription,
            customer: {
                name: user.name,
                email: user.email,
                contact: user.phone || ''
            },
            notify: {
                sms: false,
                email: true
            },
            reminder_enable: true,
            notes: {
                userId: user._id.toString(),
                userEmail: user.email,
                productType: 'vocabulary_course',
                planId: planId || 'none'
            },
            callback_url: `${process.env.FRONTEND_URL}/subscription/success`,
            callback_method: 'get'
        });

        console.log(`✅ Payment link created: ${paymentLink.id} for user ${user.email}`);
        console.log(`💰 Amount: ₹${paymentLink.amount / 100} (${paymentLink.amount} paise)`);
        console.log(`🔗 Payment URL: ${paymentLink.short_url}`);

        res.json({
            success: true,
            paymentLinkId: paymentLink.id,
            paymentUrl: paymentLink.short_url,
            amount: paymentLink.amount / 100, // Convert paise to rupees
            currency: paymentLink.currency,
            description: paymentLink.description,
            status: paymentLink.status
        });

    } catch (error) {
        console.error('❌ Create Payment Link Error:', error);

        res.status(500).json({
            success: false,
            message: 'Failed to create payment link. Please try again later.',
            error: error.message
        });
    }
};

/**
 * Create Razorpay Subscription for annual subscription
 * POST /api/subscriptions/create-subscription
 * Authentication: Required (authenticateUser)
 */
export const createSubscription = async (req, res) => {
    try {
        // Get user from authenticated request
        const userId = req.user.id;

        // Find full user document
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check if user already has an active subscription
        const existingSubscription = await Subscription.findActiveForUser(userId);

        if (existingSubscription) {
            return res.status(400).json({
                success: false,
                message: 'You already have an active subscription'
            });
        }

        // Create or retrieve Razorpay Customer
        let razorpayCustomerId = user.razorpayCustomerId;

        if (!razorpayCustomerId) {
            // Create new Razorpay customer
            const customer = await razorpay.customers.create({
                name: user.name,
                email: user.email,
                contact: user.phone || '',
                notes: {
                    userId: user._id.toString()
                }
            });

            razorpayCustomerId = customer.id;

            // Save Razorpay customer ID to user document
            user.razorpayCustomerId = razorpayCustomerId;
            await user.save();

            console.log(`✅ Created Razorpay customer: ${razorpayCustomerId} for user ${user.email}`);
        }

        // Create Razorpay Subscription
        const subscription = await razorpay.subscriptions.create({
            plan_id: process.env.RAZORPAY_PLAN_ID,
            customer_notify: 0, // Set to 0 for test mode to avoid SMS issues
            quantity: 1,
            total_count: 12, // 12 months for annual subscription
            notes: {
                userId: user._id.toString(),
                userEmail: user.email
            }
        });

        console.log(`✅ Razorpay subscription created: ${subscription.id} for user ${user.email}`);

        // Use Razorpay Payment Page URL from environment
        const paymentUrl = process.env.RAZORPAY_PAYMENT_PAGE_URL;

        console.log(`✅ Payment URL: ${paymentUrl} for subscription ${subscription.id}`);

        res.json({
            success: true,
            subscriptionId: subscription.id,
            planId: subscription.plan_id,
            status: subscription.status,
            customerId: razorpayCustomerId,
            // Return payment URL for redirect to Razorpay hosted page
            paymentUrl: paymentUrl,
            // Return Razorpay key for frontend (fallback)
            razorpayKeyId: process.env.RAZORPAY_KEY_ID
        });

    } catch (error) {
        console.error('❌ Create Subscription Error:', error);

        res.status(500).json({
            success: false,
            message: 'Failed to create subscription. Please try again later.'
        });
    }
};

/**
 * Get user's current subscription
 * GET /api/subscriptions/my-subscription
 * Authentication: Required (authenticateUser)
 */
export const getUserSubscription = async (req, res) => {
    try {
        const userId = req.user.id;

        const subscription = await Subscription.findOne({ userId })
            .sort({ createdAt: -1 });  // Get most recent subscription

        if (!subscription) {
            return res.json({
                success: true,
                subscription: null,
                message: 'No subscription found'
            });
        }

        res.json({
            success: true,
            subscription: {
                id: subscription._id,
                planName: subscription.planName,
                status: subscription.status,
                currentPeriodEnd: subscription.currentPeriodEnd,
                cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
                isValid: subscription.isValid(),
                createdAt: subscription.createdAt
            }
        });

    } catch (error) {
        console.error('❌ Get Subscription Error:', error);

        res.status(500).json({
            success: false,
            message: 'Failed to retrieve subscription'
        });
    }
};

/**
 * Confirm Payment Link Payment and Activate Subscription
 * POST /api/subscriptions/confirm-payment-link
 * Authentication: Required (authenticateUser)
 * Called after user completes payment via payment link
 */
export const confirmPaymentLink = async (req, res) => {
    try {
        const { razorpay_payment_link_id, razorpay_payment_id, razorpay_payment_link_reference_id, razorpay_payment_link_status } = req.body;
        const userId = req.user.id;

        console.log(`🔍 Confirming payment link payment for user: ${userId}`);
        console.log(`💳 Payment Link ID: ${razorpay_payment_link_id}`);
        console.log(`💰 Payment ID: ${razorpay_payment_id}`);

        // Find user
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check if subscription already exists
        let subscription = await Subscription.findOne({
            userId: user._id,
            razorpayPaymentId: razorpay_payment_id
        });

        if (subscription) {
            console.log(`✅ Subscription already exists for payment: ${razorpay_payment_id}`);
            return res.json({
                success: true,
                message: 'Subscription already activated',
                subscription: {
                    id: subscription._id,
                    planName: subscription.planName,
                    status: subscription.status,
                    currentPeriodEnd: subscription.currentPeriodEnd
                }
            });
        }

        // Verify payment with Razorpay
        let paymentDetails = null;
        if (razorpay_payment_id) {
            try {
                paymentDetails = await razorpay.payments.fetch(razorpay_payment_id);
                console.log(`📋 Payment status: ${paymentDetails.status}`);

                if (paymentDetails.status !== 'captured' && paymentDetails.status !== 'authorized') {
                    return res.status(400).json({
                        success: false,
                        message: 'Payment not completed yet'
                    });
                }
            } catch (error) {
                console.error('❌ Error fetching payment details:', error);
            }
        }

        // Calculate subscription dates
        // Start date: Current date (day of payment)
        const currentPeriodStart = new Date();

        // End date: 1 year from start date (as per requirements)
        const currentPeriodEnd = new Date(currentPeriodStart);
        currentPeriodEnd.setFullYear(currentPeriodEnd.getFullYear() + 1);

        // Get payment amount from Razorpay
        const amount = paymentDetails?.amount || parseInt(process.env.RAZORPAY_COURSE_AMOUNT) || 250000;

        // Create Razorpay subscription for the user
        let razorpaySubscription = null;
        try {
            // First, create or get customer
            let customerId = user.razorpayCustomerId;

            if (!customerId) {
                const customer = await razorpay.customers.create({
                    name: user.name,
                    email: user.email,
                    contact: user.phone || '',
                    notes: {
                        userId: user._id.toString()
                    }
                });
                customerId = customer.id;
                user.razorpayCustomerId = customerId;
                await user.save();
                console.log(`✅ Created Razorpay customer: ${customerId}`);
            }

            // Create subscription with the plan
            razorpaySubscription = await razorpay.subscriptions.create({
                plan_id: process.env.RAZORPAY_PLAN_ID,
                customer_id: customerId,
                quantity: 1,
                total_count: 1, // One-time yearly subscription
                start_at: Math.floor(currentPeriodStart.getTime() / 1000), // Unix timestamp
                notes: {
                    userId: user._id.toString(),
                    userEmail: user.email,
                    paymentLinkId: razorpay_payment_link_id,
                    paymentId: razorpay_payment_id
                }
            });

            console.log(`✅ Created Razorpay subscription: ${razorpaySubscription.id}`);
        } catch (error) {
            console.error('⚠️ Error creating Razorpay subscription:', error.error || error.message);
            // Continue with database subscription even if Razorpay subscription fails
        }

        // Create new subscription in database
        subscription = new Subscription({
            userId: user._id,
            razorpaySubscriptionId: razorpaySubscription?.id || razorpay_payment_link_id || `pl_${Date.now()}`,
            razorpayCustomerId: razorpaySubscription?.customer_id || paymentDetails?.customer_id || user.razorpayCustomerId || null,
            razorpayPaymentId: razorpay_payment_id,
            planName: razorpaySubscription?.notes?.plan_name || 'WordWise Vocabulary Course - Annual Access',
            amount: amount,
            currency: 'INR',
            status: 'active',
            currentPeriodStart: currentPeriodStart,
            currentPeriodEnd: currentPeriodEnd,
            cancelAtPeriodEnd: false
        });

        await subscription.save();

        // Update user's isSubscribed field
        user.isSubscribed = true;
        await user.save();

        console.log(`✅ Subscription created from payment link: ${razorpay_payment_id} for user ${user.email}`);
        console.log(`📋 Razorpay Subscription ID: ${subscription.razorpaySubscriptionId}`);
        console.log(`📋 Plan ID: ${process.env.RAZORPAY_PLAN_ID}`);
        console.log(`📅 Subscription period: ${currentPeriodStart.toISOString()} to ${currentPeriodEnd.toISOString()}`);

        res.json({
            success: true,
            message: 'Subscription activated successfully',
            subscription: {
                id: subscription._id,
                planName: subscription.planName,
                status: subscription.status,
                amount: subscription.amount,
                currentPeriodStart: subscription.currentPeriodStart,
                currentPeriodEnd: subscription.currentPeriodEnd,
                razorpaySubscriptionId: subscription.razorpaySubscriptionId
            }
        });

    } catch (error) {
        console.error('❌ Payment Link Confirmation Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to confirm payment',
            error: error.message
        });
    }
};

/**
 * Confirm Payment and Activate Subscription
 * POST /api/subscriptions/confirm-payment
 * Authentication: Required (authenticateUser)
 * Called after user returns from Razorpay payment page
 */
export const confirmPayment = async (req, res) => {
    try {
        const { subscription_id, payment_id } = req.body;
        const userId = req.user.id;

        console.log(`🔍 Confirming payment for subscription: ${subscription_id}, user: ${userId}`);

        // Fetch subscription details from Razorpay
        const razorpaySubscription = await razorpay.subscriptions.fetch(subscription_id);

        console.log(`📋 Razorpay subscription status: ${razorpaySubscription.status}`);

        // Find user
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check if subscription already exists in database
        let subscription = await Subscription.findOne({
            razorpaySubscriptionId: subscription_id
        });

        if (subscription) {
            // Update existing subscription
            subscription.status = razorpaySubscription.status;
            if (payment_id) {
                subscription.razorpayPaymentId = payment_id;
            }
            await subscription.save();

            console.log(`✅ Subscription updated: ${subscription_id} for user ${user.email}`);

            return res.json({
                success: true,
                message: 'Subscription already exists and updated',
                subscription: {
                    id: subscription._id,
                    planName: subscription.planName,
                    status: subscription.status,
                    amount: subscription.amount,
                    currentPeriodStart: subscription.currentPeriodStart,
                    currentPeriodEnd: subscription.currentPeriodEnd,
                    razorpaySubscriptionId: subscription.razorpaySubscriptionId
                }
            });
        }

        // Calculate subscription dates based on Razorpay data
        let currentPeriodStart = new Date();
        let currentPeriodEnd = new Date();

        if (razorpaySubscription.current_start) {
            currentPeriodStart = new Date(razorpaySubscription.current_start * 1000);
        }

        if (razorpaySubscription.current_end) {
            currentPeriodEnd = new Date(razorpaySubscription.current_end * 1000);
        } else {
            // Default to 1 year from start
            currentPeriodEnd = new Date(currentPeriodStart);
            currentPeriodEnd.setFullYear(currentPeriodEnd.getFullYear() + 1);
        }

        // Create new subscription in database
        subscription = new Subscription({
            userId: user._id,
            razorpaySubscriptionId: subscription_id,
            razorpayCustomerId: razorpaySubscription.customer_id,
            razorpayPaymentId: payment_id || null,
            planName: 'Annual Pro Course Series',
            amount: razorpaySubscription.plan_id ? parseInt(process.env.RAZORPAY_COURSE_AMOUNT) : null,
            currency: 'INR',
            status: razorpaySubscription.status, // Use status from Razorpay (active, authenticated, etc.)
            currentPeriodStart: currentPeriodStart,
            currentPeriodEnd: currentPeriodEnd,
            cancelAtPeriodEnd: false
        });

        await subscription.save();

        // Update user's isSubscribed field
        if (razorpaySubscription.status === 'active') {
            user.isSubscribed = true;
            await user.save();
        }

        console.log(`✅ Subscription created and activated: ${subscription_id} for user ${user.email}, status: ${razorpaySubscription.status}`);

        res.json({
            success: true,
            message: 'Subscription activated successfully',
            subscription: {
                id: subscription._id,
                planName: subscription.planName,
                status: subscription.status,
                amount: subscription.amount,
                currentPeriodStart: subscription.currentPeriodStart,
                currentPeriodEnd: subscription.currentPeriodEnd,
                razorpaySubscriptionId: subscription.razorpaySubscriptionId,
                razorpayStatus: razorpaySubscription.status
            }
        });

    } catch (error) {
        console.error('❌ Payment Confirmation Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to confirm payment',
            error: error.message
        });
    }
};

/**
 * Verify Razorpay Payment
 * POST /api/subscriptions/verify-payment
 * Authentication: Required (authenticateUser)
 */
export const verifyPayment = async (req, res) => {
    try {
        const { razorpay_payment_id, razorpay_subscription_id, razorpay_signature } = req.body;
        const userId = req.user.id;

        // Verify signature
        const generatedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(`${razorpay_payment_id}|${razorpay_subscription_id}`)
            .digest('hex');

        if (generatedSignature !== razorpay_signature) {
            console.error('❌ Payment signature verification failed');
            return res.status(400).json({
                success: false,
                message: 'Payment verification failed'
            });
        }

        // Fetch subscription details from Razorpay
        const razorpaySubscription = await razorpay.subscriptions.fetch(razorpay_subscription_id);

        // Find user
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check if subscription already exists
        const existingSubscription = await Subscription.findOne({
            razorpaySubscriptionId: razorpay_subscription_id
        });

        if (existingSubscription) {
            return res.json({
                success: true,
                message: 'Subscription already verified',
                subscription: existingSubscription
            });
        }

        // Calculate subscription end date (1 year from now)
        const currentPeriodEnd = new Date();
        currentPeriodEnd.setFullYear(currentPeriodEnd.getFullYear() + 1);

        // Create subscription in database
        const subscription = new Subscription({
            userId: user._id,
            razorpaySubscriptionId: razorpay_subscription_id,
            razorpayCustomerId: razorpaySubscription.customer_id,
            razorpayPaymentId: razorpay_payment_id,
            planName: 'Annual Pro Course Series',
            status: 'active',
            currentPeriodEnd: currentPeriodEnd,
            cancelAtPeriodEnd: false
        });

        await subscription.save();

        console.log(`✅ Subscription verified and created for user ${user.email}: ${razorpay_subscription_id}`);

        res.json({
            success: true,
            message: 'Payment verified successfully',
            subscription: {
                id: subscription._id,
                planName: subscription.planName,
                status: subscription.status,
                currentPeriodEnd: subscription.currentPeriodEnd
            }
        });

    } catch (error) {
        console.error('❌ Payment Verification Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to verify payment'
        });
    }
};

/**
 * Handle Razorpay Webhook Events
 * POST /api/subscriptions/webhook
 * Authentication: None (uses Razorpay signature verification)
 */
export const handleWebhook = async (req, res) => {
    const webhookSignature = req.headers['x-razorpay-signature'];
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    try {
        // Verify webhook signature
        const expectedSignature = crypto
            .createHmac('sha256', webhookSecret)
            .update(JSON.stringify(req.body))
            .digest('hex');

        if (webhookSignature !== expectedSignature) {
            console.error('❌ Webhook signature verification failed');
            return res.status(400).json({ error: 'Invalid signature' });
        }

        const event = req.body.event;
        const payload = req.body.payload;

        console.log(`📥 Received webhook event: ${event}`);

        // Handle the event
        switch (event) {
            case 'payment_link.paid':
                await handlePaymentLinkPaid(payload.payment_link.entity, payload.payment.entity);
                break;

            case 'subscription.activated':
                await handleSubscriptionActivated(payload.subscription.entity);
                break;

            case 'subscription.charged':
                await handleSubscriptionCharged(payload.subscription.entity, payload.payment.entity);
                break;

            case 'subscription.cancelled':
                await handleSubscriptionCancelled(payload.subscription.entity);
                break;

            case 'subscription.completed':
                await handleSubscriptionCompleted(payload.subscription.entity);
                break;

            case 'subscription.paused':
                await handleSubscriptionPaused(payload.subscription.entity);
                break;

            case 'subscription.resumed':
                await handleSubscriptionResumed(payload.subscription.entity);
                break;

            case 'payment.failed':
                await handlePaymentFailed(payload.payment.entity);
                break;

            default:
                console.log(`ℹ️ Unhandled event type: ${event}`);
        }

        // Return 200 to acknowledge receipt
        res.status(200).json({ status: 'ok' });

    } catch (error) {
        console.error('❌ Webhook handler error:', error);
        res.status(500).json({ error: 'Webhook processing failed' });
    }
};

/**
 * Handle payment_link.paid event
 */
async function handlePaymentLinkPaid(paymentLink, payment) {
    try {
        console.log(`📥 Payment link paid: ${paymentLink.id}, payment: ${payment.id}`);

        // Check if subscription already exists for this payment (idempotency)
        let subscription = await Subscription.findOne({
            razorpayPaymentId: payment.id
        });

        if (subscription) {
            console.log(`✅ Subscription already exists for payment: ${payment.id} (idempotent)`);
            return;
        }

        // Extract user info from payment link notes
        const userId = paymentLink.notes?.userId;
        const userEmail = paymentLink.notes?.userEmail;

        if (!userId) {
            console.error('❌ User ID not found in payment link notes');
            return;
        }

        // Find user
        const user = await User.findById(userId);
        if (!user) {
            console.error(`❌ User not found: ${userId}`);
            return;
        }

        // Calculate subscription dates
        const currentPeriodStart = new Date();
        const currentPeriodEnd = new Date(currentPeriodStart);
        currentPeriodEnd.setFullYear(currentPeriodEnd.getFullYear() + 1); // 1 year subscription

        // Create Razorpay subscription for the user
        let razorpaySubscription = null;
        try {
            // First, create or get customer
            let customerId = user.razorpayCustomerId || payment.customer_id;

            if (!customerId) {
                const customer = await razorpay.customers.create({
                    name: user.name,
                    email: user.email,
                    contact: user.phone || '',
                    notes: {
                        userId: user._id.toString()
                    }
                });
                customerId = customer.id;
                user.razorpayCustomerId = customerId;
                await user.save();
                console.log(`✅ Created Razorpay customer: ${customerId}`);
            }

            // Create subscription with the plan
            razorpaySubscription = await razorpay.subscriptions.create({
                plan_id: process.env.RAZORPAY_PLAN_ID,
                customer_id: customerId,
                quantity: 1,
                total_count: 1, // One-time yearly subscription
                start_at: Math.floor(currentPeriodStart.getTime() / 1000), // Unix timestamp
                notes: {
                    userId: user._id.toString(),
                    userEmail: user.email,
                    paymentLinkId: paymentLink.id,
                    paymentId: payment.id
                }
            });

            console.log(`✅ Created Razorpay subscription from webhook: ${razorpaySubscription.id}`);
        } catch (error) {
            console.error('⚠️ Error creating Razorpay subscription in webhook:', error.error || error.message);
            // Continue with database subscription even if Razorpay subscription fails
        }

        // Create subscription in database
        subscription = new Subscription({
            userId: user._id,
            razorpaySubscriptionId: razorpaySubscription?.id || paymentLink.id,
            razorpayCustomerId: razorpaySubscription?.customer_id || payment.customer_id || user.razorpayCustomerId || null,
            razorpayPaymentId: payment.id,
            planName: 'WordWise Vocabulary Course - Annual Access',
            amount: payment.amount,
            currency: payment.currency || 'INR',
            status: 'active',
            currentPeriodStart: currentPeriodStart,
            currentPeriodEnd: currentPeriodEnd,
            cancelAtPeriodEnd: false
        });

        await subscription.save();

        // Update user's isSubscribed field
        user.isSubscribed = true;
        await user.save();

        console.log(`✅ Subscription created from payment link webhook: ${payment.id} for user ${user.email}`);
        console.log(`📋 Razorpay Subscription ID: ${subscription.razorpaySubscriptionId}`);
        console.log(`📋 Plan ID: ${process.env.RAZORPAY_PLAN_ID}`);
        console.log(`📅 Subscription period: ${currentPeriodStart.toISOString()} to ${currentPeriodEnd.toISOString()}`);

    } catch (error) {
        console.error('❌ Error handling payment_link.paid:', error);
        throw error;
    }
}

/**
 * Handle subscription.activated event
 */
async function handleSubscriptionActivated(razorpaySubscription) {
    try {
        const subscription = await Subscription.findOne({
            razorpaySubscriptionId: razorpaySubscription.id
        });

        if (subscription) {
            subscription.status = 'active';
            await subscription.save();

            // Update user's isSubscribed field
            const user = await User.findById(subscription.userId);
            if (user) {
                user.isSubscribed = true;
                await user.save();
            }

            console.log(`✅ Subscription activated: ${razorpaySubscription.id}`);
        } else {
            console.log(`ℹ️ Subscription not found in DB, will be created on payment verification: ${razorpaySubscription.id}`);
        }

    } catch (error) {
        console.error('❌ Error handling subscription.activated:', error);
        throw error;
    }
}

/**
 * Handle subscription.charged event
 */
async function handleSubscriptionCharged(razorpaySubscription, payment) {
    try {
        let subscription = await Subscription.findOne({
            razorpaySubscriptionId: razorpaySubscription.id
        });

        if (subscription) {
            // Update existing subscription
            subscription.status = 'active';
            subscription.razorpayPaymentId = payment.id;

            // Update period dates from Razorpay
            if (razorpaySubscription.current_start) {
                subscription.currentPeriodStart = new Date(razorpaySubscription.current_start * 1000);
            }
            if (razorpaySubscription.current_end) {
                subscription.currentPeriodEnd = new Date(razorpaySubscription.current_end * 1000);
            } else {
                // Fallback: add 1 year from current period start
                const currentPeriodEnd = new Date(subscription.currentPeriodStart || new Date());
                currentPeriodEnd.setFullYear(currentPeriodEnd.getFullYear() + 1);
                subscription.currentPeriodEnd = currentPeriodEnd;
            }

            await subscription.save();

            // Update user's isSubscribed field
            const user = await User.findById(subscription.userId);
            if (user) {
                user.isSubscribed = true;
                await user.save();
            }

            console.log(`✅ Subscription charged and updated: ${razorpaySubscription.id}, payment: ${payment.id}`);
        } else {
            // Create new subscription if it doesn't exist
            console.log(`ℹ️ Subscription not found in DB, creating from webhook: ${razorpaySubscription.id}`);

            // Find user by customer ID
            const user = await User.findOne({
                razorpayCustomerId: razorpaySubscription.customer_id
            });

            if (!user) {
                console.error(`❌ User not found for customer: ${razorpaySubscription.customer_id}`);
                return;
            }

            // Calculate subscription dates
            let currentPeriodStart = new Date();
            let currentPeriodEnd = new Date();

            if (razorpaySubscription.current_start) {
                currentPeriodStart = new Date(razorpaySubscription.current_start * 1000);
            }

            if (razorpaySubscription.current_end) {
                currentPeriodEnd = new Date(razorpaySubscription.current_end * 1000);
            } else {
                currentPeriodEnd = new Date(currentPeriodStart);
                currentPeriodEnd.setFullYear(currentPeriodEnd.getFullYear() + 1);
            }

            // Create subscription
            subscription = new Subscription({
                userId: user._id,
                razorpaySubscriptionId: razorpaySubscription.id,
                razorpayCustomerId: razorpaySubscription.customer_id,
                razorpayPaymentId: payment.id,
                planName: 'Annual Pro Course Series',
                amount: payment.amount,
                currency: payment.currency || 'INR',
                status: 'active',
                currentPeriodStart: currentPeriodStart,
                currentPeriodEnd: currentPeriodEnd,
                cancelAtPeriodEnd: false
            });

            await subscription.save();

            // Update user's isSubscribed field
            user.isSubscribed = true;
            await user.save();

            console.log(`✅ Subscription created from webhook: ${razorpaySubscription.id} for user ${user.email}`);
        }

    } catch (error) {
        console.error('❌ Error handling subscription.charged:', error);
        throw error;
    }
}

/**
 * Handle subscription.cancelled event
 */
async function handleSubscriptionCancelled(razorpaySubscription) {
    try {
        const subscription = await Subscription.findOne({
            razorpaySubscriptionId: razorpaySubscription.id
        });

        if (!subscription) {
            console.error('❌ Subscription not found:', razorpaySubscription.id);
            return;
        }

        subscription.status = 'canceled';
        subscription.cancelAtPeriodEnd = true;
        subscription.canceledAt = new Date();
        await subscription.save();

        // Update user's isSubscribed field
        const user = await User.findById(subscription.userId);
        if (user) {
            user.isSubscribed = false;
            await user.save();
        }

        console.log(`✅ Subscription cancelled: ${razorpaySubscription.id}`);

    } catch (error) {
        console.error('❌ Error handling subscription.cancelled:', error);
        throw error;
    }
}

/**
 * Handle subscription.completed event
 */
async function handleSubscriptionCompleted(razorpaySubscription) {
    try {
        const subscription = await Subscription.findOne({
            razorpaySubscriptionId: razorpaySubscription.id
        });

        if (!subscription) {
            console.error('❌ Subscription not found:', razorpaySubscription.id);
            return;
        }

        subscription.status = 'expired';
        await subscription.save();

        // Update user's isSubscribed field
        const user = await User.findById(subscription.userId);
        if (user) {
            user.isSubscribed = false;
            await user.save();
        }

        console.log(`✅ Subscription completed/expired: ${razorpaySubscription.id}`);

    } catch (error) {
        console.error('❌ Error handling subscription.completed:', error);
        throw error;
    }
}

/**
 * Handle subscription.paused event
 */
async function handleSubscriptionPaused(razorpaySubscription) {
    try {
        const subscription = await Subscription.findOne({
            razorpaySubscriptionId: razorpaySubscription.id
        });

        if (!subscription) {
            console.error('❌ Subscription not found:', razorpaySubscription.id);
            return;
        }

        subscription.status = 'past_due';
        await subscription.save();

        // Update user's isSubscribed field
        const user = await User.findById(subscription.userId);
        if (user) {
            user.isSubscribed = false;
            await user.save();
        }

        console.log(`⚠️ Subscription paused: ${razorpaySubscription.id}`);

    } catch (error) {
        console.error('❌ Error handling subscription.paused:', error);
        throw error;
    }
}

/**
 * Handle subscription.resumed event
 */
async function handleSubscriptionResumed(razorpaySubscription) {
    try {
        const subscription = await Subscription.findOne({
            razorpaySubscriptionId: razorpaySubscription.id
        });

        if (!subscription) {
            console.error('❌ Subscription not found:', razorpaySubscription.id);
            return;
        }

        subscription.status = 'active';
        await subscription.save();

        console.log(`✅ Subscription resumed: ${razorpaySubscription.id}`);

    } catch (error) {
        console.error('❌ Error handling subscription.resumed:', error);
        throw error;
    }
}

/**
 * Handle payment.failed event
 */
async function handlePaymentFailed(payment) {
    try {
        if (!payment.subscription_id) {
            console.log('ℹ️ Payment failed for non-subscription payment');
            return;
        }

        const subscription = await Subscription.findOne({
            razorpaySubscriptionId: payment.subscription_id
        });

        if (!subscription) {
            console.error('❌ Subscription not found:', payment.subscription_id);
            return;
        }

        subscription.status = 'past_due';
        await subscription.save();

        console.log(`⚠️ Payment failed for subscription: ${payment.subscription_id}`);

    } catch (error) {
        console.error('❌ Error handling payment.failed:', error);
        throw error;
    }
}

/**
 * Admin: Get all subscriptions with pagination and filtering
 * GET /admin/subscriptions
 * Authentication: Required (authenticateAdmin)
 * Query params: page, limit, status
 */
export const getAllSubscriptions = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const status = req.query.status; // Optional filter by status
        const skip = (page - 1) * limit;

        // Build query
        const query = {};
        if (status) {
            query.status = status;
        }

        // Get total count for pagination
        const totalCount = await Subscription.countDocuments(query);

        // Fetch subscriptions with user details
        const subscriptions = await Subscription.find(query)
            .populate('userId', 'name email phone isSubscribed')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        // Format response
        const formattedSubscriptions = subscriptions.map(sub => ({
            id: sub._id,
            user: {
                id: sub.userId?._id,
                name: sub.userId?.name,
                email: sub.userId?.email,
                phone: sub.userId?.phone,
                isSubscribed: sub.userId?.isSubscribed
            },
            razorpaySubscriptionId: sub.razorpaySubscriptionId,
            razorpayPaymentId: sub.razorpayPaymentId,
            razorpayCustomerId: sub.razorpayCustomerId,
            planName: sub.planName,
            amount: sub.amount,
            currency: sub.currency,
            status: sub.status,
            currentPeriodStart: sub.currentPeriodStart,
            currentPeriodEnd: sub.currentPeriodEnd,
            cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
            canceledAt: sub.canceledAt,
            isValid: sub.isValid(),
            createdAt: sub.createdAt,
            updatedAt: sub.updatedAt
        }));

        res.json({
            success: true,
            subscriptions: formattedSubscriptions,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalCount / limit),
                totalCount: totalCount,
                limit: limit,
                hasNextPage: page < Math.ceil(totalCount / limit),
                hasPrevPage: page > 1
            }
        });

    } catch (error) {
        console.error('❌ Get All Subscriptions Error:', error);

        res.status(500).json({
            success: false,
            message: 'Failed to fetch subscriptions'
        });
    }
};

/**
 * Admin: Cancel subscription
 * POST /api/subscriptions/admin/:subscriptionId/cancel
 * Authentication: Required (authenticateAdmin)
 */
export const cancelSubscription = async (req, res) => {
    try {
        const { subscriptionId } = req.params;

        // Find subscription by MongoDB _id
        const subscription = await Subscription.findById(subscriptionId);

        if (!subscription) {
            return res.status(404).json({
                success: false,
                message: 'Subscription not found'
            });
        }

        // Cancel subscription in Razorpay
        await razorpay.subscriptions.cancel(subscription.razorpaySubscriptionId, {
            cancel_at_cycle_end: 1 // Cancel at the end of current billing cycle
        });

        // Update subscription in database
        subscription.cancelAtPeriodEnd = true;
        subscription.canceledAt = new Date();
        await subscription.save();

        // Update user's isSubscribed field if subscription is ending
        const user = await User.findById(subscription.userId);
        if (user) {
            user.isSubscribed = false;
            await user.save();
        }

        console.log(`✅ Admin canceled subscription: ${subscription.razorpaySubscriptionId} (will cancel at ${subscription.currentPeriodEnd})`);

        res.json({
            success: true,
            message: 'Subscription will be canceled at period end',
            periodEnd: subscription.currentPeriodEnd
        });

    } catch (error) {
        console.error('❌ Cancel Subscription Error:', error);

        res.status(500).json({
            success: false,
            message: 'Failed to cancel subscription'
        });
    }
};

