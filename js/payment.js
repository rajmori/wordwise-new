import { authService } from '../auth-service.js';
import { API_BASE_URL } from '../config.js';

class PaymentPage {
    constructor() {
        this.apiUrl = API_BASE_URL;
        this.subscriptionData = null;
        this.planDetails = null;
        this.init();
    }

    async init() {
        // Check if user is authenticated
        if (!authService.isAuthenticated()) {
            sessionStorage.setItem('redirect_after_login', window.location.href);
            window.location.href = '/login.html';
            return;
        }

        // Fetch plan details first
        await this.fetchPlanDetails();

        // Check if user already has active subscription
        await this.checkExistingSubscription();

        // Create subscription and load payment details
        await this.createSubscription();

        // Setup payment button
        this.setupPaymentButton();
    }

    async fetchPlanDetails() {
        try {
            console.log('📋 Fetching plan details...');

            const response = await fetch(`${this.apiUrl}/subscriptions/plan-details`);
            const data = await response.json();

            if (data.success && data.plan) {
                this.planDetails = data.plan;
                console.log('✅ Plan details fetched:', this.planDetails);

                // Update UI with plan details
                this.updatePlanUI();
            } else {
                console.error('❌ Failed to fetch plan details:', data.message);
            }
        } catch (error) {
            console.error('❌ Error fetching plan details:', error);
        }
    }

    updatePlanUI() {
        if (!this.planDetails) return;

        const amount = this.planDetails.amount;
        const currency = this.planDetails.currency === 'INR' ? '₹' : '$';
        const formattedAmount = `${currency}${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

        // Format plan name with period
        const periodText = this.planDetails.period === 'yearly' ? 'Annual' :
                          this.planDetails.period === 'monthly' ? 'Monthly' :
                          this.planDetails.period;
        const planDisplayName = `${this.planDetails.name || 'WordWise Premium'} (${periodText})`;

        // Update all displays
        const planNameEl = document.getElementById('planName');
        const planAmountEl = document.getElementById('planAmount');
        const totalAmountEl = document.getElementById('totalAmount');
        const payNowBtn = document.getElementById('payNowBtn');

        if (planNameEl) {
            planNameEl.textContent = planDisplayName;
        }

        if (planAmountEl) {
            planAmountEl.textContent = formattedAmount;
        }

        if (totalAmountEl) {
            totalAmountEl.textContent = formattedAmount;
        }

        if (payNowBtn) {
            payNowBtn.textContent = `Pay ${formattedAmount} Now`;
        }

        console.log('✅ UI updated with plan details:', {
            name: planDisplayName,
            amount: formattedAmount
        });
    }

    async checkExistingSubscription() {
        try {
            const token = authService.getBackendToken();
            const response = await fetch(`${this.apiUrl}/subscriptions/my-subscription`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (data.success && data.subscription && data.subscription.status === 'active') {
                // User already has active subscription, redirect to dashboard
                window.location.href = '/dashboard.html';
            }
        } catch (error) {
            console.error('Error checking subscription:', error);
        }
    }

    async createSubscription() {
        try {
            const token = authService.getBackendToken();

            console.log('🔄 Creating Razorpay payment link...');

            // Use payment link instead of subscription for instant one-time payment
            const response = await fetch(`${this.apiUrl}/subscriptions/create-payment-link`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();
            console.log('📦 Backend response:', data);

            if (data.success && data.paymentUrl) {
                this.subscriptionData = data;
                console.log('✅ Payment link created successfully');
                console.log('🔗 Payment URL:', data.paymentUrl);

                // Show payment details
                this.showPaymentDetails();
            } else {
                console.error('❌ Failed to create payment link:', data.message);
                this.showError(data.message || 'Failed to create payment link. Please try again.');
            }
        } catch (error) {
            console.error('❌ Error creating payment link:', error);
            this.showError('Failed to create payment link. Please try again.');
        }
    }

    showPaymentDetails() {
        // Update UI with plan details one more time to ensure it's displayed
        this.updatePlanUI();

        document.getElementById('loadingState').style.display = 'none';
        document.getElementById('paymentDetails').style.display = 'block';
    }

    showError(message) {
        document.getElementById('loadingState').style.display = 'none';
        document.getElementById('errorState').style.display = 'block';
        document.getElementById('errorMessage').textContent = message;
    }

    setupPaymentButton() {
        const payNowBtn = document.getElementById('payNowBtn');
        if (payNowBtn) {
            payNowBtn.addEventListener('click', () => this.redirectToPaymentGateway());
        }
    }

    redirectToPaymentGateway() {
        if (!this.subscriptionData) {
            this.showError('Subscription data not available. Please try again.');
            return;
        }

        // Check if payment URL is available
        if (this.subscriptionData.paymentUrl) {
            console.log('🔗 Redirecting to Razorpay payment page:', this.subscriptionData.paymentUrl);

            // Show loading state on button
            const payNowBtn = document.getElementById('payNowBtn');
            if (payNowBtn) {
                payNowBtn.disabled = true;
                payNowBtn.innerHTML = '<span class="loader"></span> Redirecting to payment gateway...';
            }

            // Redirect to Razorpay hosted payment page
            window.location.href = this.subscriptionData.paymentUrl;
        } else {
            console.error('❌ Payment URL not available');
            this.showError('Payment link not available. Please try again.');
        }
    }

    async verifyPayment(paymentData) {
        try {
            const token = authService.getBackendToken();

            const response = await fetch(`${this.apiUrl}/subscriptions/verify-payment`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(paymentData)
            });

            const data = await response.json();

            if (data.success) {
                // Redirect to success page
                window.location.href = `/subscription/success?subscription_id=${this.subscriptionData.subscriptionId}`;
            } else {
                this.showError('Payment verification failed. Please contact support.');
            }
        } catch (error) {
            console.error('❌ Error verifying payment:', error);
            this.showError('Failed to verify payment. Please contact support.');
        }
    }
}

// Initialize payment page
new PaymentPage();

