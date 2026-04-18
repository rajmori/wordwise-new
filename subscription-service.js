// Subscription Service for Razorpay Integration
import { APP_CONFIG } from './config.js';
import { authService } from './auth-service.js';

class SubscriptionService {
    constructor() {
        this.apiUrl = APP_CONFIG.apiUrl;
        this.razorpayKeyId = import.meta.env.VITE_RAZORPAY_KEY_ID;
    }

    /**
     * Check if user is authenticated
     */
    isAuthenticated() {
        return authService.isAuthenticated();
    }

    /**
     * Get current user's subscription status
     */
    async getSubscriptionStatus() {
        try {
            const token = authService.getBackendToken();
            if (!token) {
                return { success: false, message: 'Not authenticated' };
            }

            const response = await fetch(`${this.apiUrl}/subscriptions/my-subscription`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('❌ Error fetching subscription status:', error);
            return { success: false, message: 'Failed to fetch subscription status' };
        }
    }

    /**
     * Create Razorpay subscription and open payment modal
     */
    async createSubscription() {
        try {
            // Check if user is authenticated
            if (!this.isAuthenticated()) {
                // Store current page for redirect after login
                sessionStorage.setItem('redirect_after_login', window.location.href);
                window.location.href = '/login.html';
                return { success: false, message: 'Please login first' };
            }

            const token = authService.getBackendToken();
            if (!token) {
                sessionStorage.setItem('redirect_after_login', window.location.href);
                window.location.href = '/login.html';
                return { success: false, message: 'Please login first' };
            }

            console.log('🔄 Creating Razorpay subscription...');

            const response = await fetch(`${this.apiUrl}/subscriptions/create-subscription`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();
            console.log('📦 Backend response:', data);

            if (data.success && data.subscriptionId) {
                console.log('✅ Subscription created, opening Razorpay payment...');
                console.log('📋 Subscription data:', {
                    subscriptionId: data.subscriptionId,
                    razorpayKeyId: data.razorpayKeyId,
                    status: data.status
                });

                // Open Razorpay payment modal
                try {
                    await this.openRazorpayPayment(data);
                    return { success: true };
                } catch (razorpayError) {
                    console.error('❌ Razorpay modal error:', razorpayError);
                    return { success: false, message: 'Failed to open payment window. Please try again.' };
                }
            } else {
                console.error('❌ Failed to create subscription:', data.message);
                return { success: false, message: data.message || 'Failed to create subscription' };
            }
        } catch (error) {
            console.error('❌ Error creating subscription:', error);
            return { success: false, message: 'Failed to create subscription. Please try again.' };
        }
    }

    /**
     * Open Razorpay payment modal
     */
    async openRazorpayPayment(subscriptionData) {
        return new Promise((resolve, reject) => {
            // Check if Razorpay is loaded
            if (typeof window.Razorpay === 'undefined') {
                console.error('❌ Razorpay script not loaded');
                this.showNotification('Payment system not loaded. Please refresh the page.', 'error');
                reject(new Error('Razorpay not loaded'));
                return;
            }

            console.log('🔑 Opening Razorpay with:', {
                key: subscriptionData.razorpayKeyId,
                subscription_id: subscriptionData.subscriptionId
            });

            const options = {
                key: subscriptionData.razorpayKeyId || this.razorpayKeyId,
                subscription_id: subscriptionData.subscriptionId,
                name: 'WordWise',
                description: 'Annual Subscription - WordWise Premium',
                image: '/logo.png', // Add your logo path
                notes: {
                    subscription_type: 'annual',
                    platform: 'web'
                },
                handler: async (response) => {
                    console.log('✅ Payment successful:', response);

                    // Verify payment on backend
                    const verified = await this.verifyPayment(response);

                    if (verified.success) {
                        // Redirect to success page
                        window.location.href = `/subscription/success?subscription_id=${subscriptionData.subscriptionId}`;
                        resolve(verified);
                    } else {
                        this.showNotification('Payment verification failed. Please contact support.', 'error');
                        reject(new Error('Payment verification failed'));
                    }
                },
                prefill: {
                    name: authService.getCurrentUser()?.name || '',
                    email: authService.getCurrentUser()?.email || '',
                },
                theme: {
                    color: '#6366f1'
                },
                modal: {
                    ondismiss: () => {
                        console.log('❌ Payment cancelled by user');
                        window.location.href = '/subscription/cancel';
                        reject(new Error('Payment cancelled'));
                    }
                }
            };

            try {
                const razorpay = new window.Razorpay(options);
                razorpay.open();
            } catch (error) {
                console.error('❌ Error opening Razorpay:', error);
                this.showNotification('Failed to open payment window. Please try again.', 'error');
                reject(error);
            }
        });
    }

    /**
     * Verify payment on backend
     */
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
            return data;
        } catch (error) {
            console.error('❌ Error verifying payment:', error);
            return { success: false, message: 'Failed to verify payment' };
        }
    }

    /**
     * Handle subscription button click
     */
    async handleSubscribeClick(buttonElement) {
        // Disable button and show loading state
        const originalText = buttonElement.innerHTML;
        buttonElement.disabled = true;
        buttonElement.innerHTML = '<span class="loader"></span> Processing...';

        try {
            const result = await this.createSubscription();

            if (!result.success && result.message) {
                // Show error message
                this.showNotification(result.message, 'error');

                // Re-enable button
                buttonElement.disabled = false;
                buttonElement.innerHTML = originalText;
            }
            // If success, Razorpay modal will open
        } catch (error) {
            console.error('❌ Error:', error);
            this.showNotification('Something went wrong. Please try again.', 'error');

            // Re-enable button
            buttonElement.disabled = false;
            buttonElement.innerHTML = originalText;
        }
    }

    /**
     * Show notification to user
     */
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">${type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️'}</span>
                <span class="notification-message">${message}</span>
            </div>
        `;

        // Add to body
        document.body.appendChild(notification);

        // Show notification
        setTimeout(() => notification.classList.add('show'), 100);

        // Remove after 5 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 5000);
    }
}

// Export singleton instance
export const subscriptionService = new SubscriptionService();

