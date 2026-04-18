// Subscription Page Handler
import { subscriptionService } from '../subscription-service.js';
import { authService } from '../auth-service.js';
import { APP_CONFIG } from '../config.js';

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', async () => {
    console.log('📄 Subscription page loaded');

    // Fetch and display plan details
    await fetchAndDisplayPlanDetails();

    // Get subscribe button
    const subscribeBtn = document.getElementById('subscribeBtn');

    if (!subscribeBtn) {
        console.error('❌ Subscribe button not found');
        return;
    }

    // Check if user is already subscribed
    if (authService.isAuthenticated()) {
        const status = await subscriptionService.getSubscriptionStatus();

        if (status.success && status.subscription && status.subscription.status === 'active') {
            // User already has active subscription
            subscribeBtn.innerHTML = '✅ Already Subscribed';
            subscribeBtn.disabled = true;
            subscribeBtn.classList.add('btn-success');

            // Show message
            const message = document.createElement('p');
            message.className = 'subscription-active-message';
            message.style.cssText = 'text-align: center; color: #10b981; font-weight: 600; margin-top: 1rem;';
            message.innerHTML = '🎉 You already have lifetime access! <a href="/dashboard.html" style="color: #10b981; text-decoration: underline;">Go to Dashboard</a>';
            subscribeBtn.parentElement.appendChild(message);

            return;
        }
    }

    // Handle subscribe button click - Direct checkout
    subscribeBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        console.log('🔘 Subscribe button clicked');

        // Check if user is authenticated
        if (!authService.isAuthenticated()) {
            console.log('⚠️ User not authenticated, redirecting to login...');

            // Store subscription page as redirect destination
            sessionStorage.setItem('redirect_after_login', '/subscription.html');
            sessionStorage.setItem('subscription_intent', 'true');

            // Show notification
            subscriptionService.showNotification('Please login or sign up to continue', 'info');

            // Redirect to login after short delay
            setTimeout(() => {
                window.location.href = '/login.html';
            }, 1500);

            return;
        }

        // User is authenticated, open Razorpay checkout directly
        console.log('✅ User authenticated, opening checkout...');
        await subscriptionService.handleSubscribeClick(subscribeBtn);
    });

    // Check if user just logged in with subscription intent
    const subscriptionIntent = sessionStorage.getItem('subscription_intent');
    if (subscriptionIntent === 'true' && authService.isAuthenticated()) {
        console.log('🎯 User logged in with subscription intent, opening checkout...');
        sessionStorage.removeItem('subscription_intent');

        // Open checkout directly
        const subscribeBtn = document.getElementById('subscribeBtn');
        if (subscribeBtn) {
            await subscriptionService.handleSubscribeClick(subscribeBtn);
        }
    }
});

/**
 * Fetch plan details from backend and display on page
 */
async function fetchAndDisplayPlanDetails() {
    try {
        console.log('📋 Fetching plan details...');

        const response = await fetch(`${APP_CONFIG.apiUrl}/subscriptions/plan-details`);
        const data = await response.json();

        if (data.success && data.plan) {
            const plan = data.plan;
            console.log('✅ Plan details fetched:', plan);

            // Format amount
            const currency = plan.currency === 'INR' ? '₹' : '$';
            const formattedAmount = `${currency}${plan.amount.toLocaleString('en-IN')}`;

            // Format period
            const periodText = plan.period === 'yearly' ? 'year' :
                              plan.period === 'monthly' ? 'month' :
                              plan.period;

            // Update all price displays
            const heroPriceEl = document.getElementById('heroPrice');
            const sectionPriceEl = document.getElementById('sectionPrice');
            const planNameEl = document.getElementById('planName');
            const planPriceEl = document.getElementById('planPrice');
            const planPeriodEl = document.getElementById('planPeriod');

            if (heroPriceEl) {
                heroPriceEl.textContent = formattedAmount;
            }

            if (sectionPriceEl) {
                sectionPriceEl.textContent = formattedAmount;
            }

            if (planNameEl) {
                planNameEl.textContent = plan.name || 'WordWise Premium';
            }

            if (planPriceEl) {
                planPriceEl.textContent = formattedAmount;
            }

            if (planPeriodEl) {
                planPeriodEl.textContent = ` /${periodText}`;
            }

            console.log('✅ UI updated with plan details:', {
                name: plan.name,
                amount: formattedAmount,
                period: periodText
            });
        } else {
            console.error('❌ Failed to fetch plan details:', data.message);
        }
    } catch (error) {
        console.error('❌ Error fetching plan details:', error);
    }
}

