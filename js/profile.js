import { authService } from '../auth-service.js';
import { APP_CONFIG } from '../config.js';

class ProfileManager {
    constructor() {
        this.form = document.getElementById('profile-form');
        this.nameInput = document.getElementById('name');
        this.emailInput = document.getElementById('email');
        this.messageEl = document.getElementById('status-message');
        this.submitBtn = document.querySelector('.btn-save');

        // New elements
        this.memberSinceEl = document.getElementById('member-since');
        this.subscriptionStatusEl = document.getElementById('subscription-status');
        this.lastLoginEl = document.getElementById('last-login');

        this.init();
    }

    async init() {
        if (!authService.isAuthenticated()) {
            window.location.href = '/login.html';
            return;
        }

        await this.loadProfile();
        this.setupEventListeners();
    }

    async loadProfile() {
        try {
            const token = authService.getBackendToken();
            const response = await fetch(`${APP_CONFIG.apiUrl}/profile`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) throw new Error('Failed to load profile');

            const data = await response.json();

            this.nameInput.value = data.name || '';
            this.emailInput.value = data.email || '';

            this.updateAccountOverview(data);

        } catch (error) {
            console.error('Error loading profile:', error);
            this.showMessage('Failed to load profile data', 'error');
        }
    }

    setupEventListeners() {
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
    }

    async handleSubmit(e) {
        e.preventDefault();
        this.showMessage('', ''); // Clear messages

        const originalBtnText = this.submitBtn.textContent;
        this.submitBtn.textContent = 'Saving...';
        this.submitBtn.disabled = true;

        try {
            const token = authService.getBackendToken();
            const updateData = {
                name: this.nameInput.value,
                email: this.emailInput.value
            };

            const response = await fetch(`${APP_CONFIG.apiUrl}/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(updateData)
            });

            const data = await response.json();

            if (response.ok) {
                this.showMessage('Profile updated successfully!', 'success');

                // Update local storage user data if name changed
                const currentUser = authService.getCurrentUser();
                if (currentUser) {
                    const updatedUser = { ...currentUser, name: data.name, email: data.email };
                    authService.storeUser(updatedUser);
                    // Reload page to update header after short delay
                    setTimeout(() => window.location.reload(), 1500);
                }
            } else {
                this.showMessage(data.message || 'Failed to update profile', 'error');
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            this.showMessage('An error occurred. Please try again.', 'error');
        } finally {
            this.submitBtn.textContent = originalBtnText;
            this.submitBtn.disabled = false;
        }
    }

    updateAccountOverview(data) {
        // Member Since
        if (data.createdAt) {
            const date = new Date(data.createdAt);
            this.memberSinceEl.textContent = date.toLocaleDateString('en-US', {
                year: 'numeric', month: 'short', day: 'numeric'
            });
        }

        // Last Login
        if (data.lastLogin) {
            const date = new Date(data.lastLogin);
            this.lastLoginEl.textContent = date.toLocaleDateString('en-US', {
                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
            });
        } else {
            this.lastLoginEl.textContent = 'Just now';
        }

        // Subscription Status
        let statusHtml = '<span class="status-badge inactive">Free Plan</span>';
        if (data.isSubscribed) {
            const plan = data.subscription?.plan || 'premium';
            const planName = plan.charAt(0).toUpperCase() + plan.slice(1);
            const badgeClass = plan === 'premium' ? 'premium' : 'basic';
            statusHtml = `<span class="status-badge ${badgeClass}">${planName} Member</span>`;

            if (data.subscription?.endDate) {
                const endDate = new Date(data.subscription.endDate);
                statusHtml += `<div style="font-size: 0.8rem; margin-top: 4px; color: #64748b;">Expires: ${endDate.toLocaleDateString()}</div>`;
            }
        }
        this.subscriptionStatusEl.innerHTML = statusHtml;
    }

    showMessage(text, type) {
        this.messageEl.className = 'message ' + type;
        this.messageEl.textContent = text;
    }
}

new ProfileManager();
