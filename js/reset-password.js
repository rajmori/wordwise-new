import { APP_CONFIG } from '../config.js';

class ResetPasswordManager {
    constructor() {
        this.form = document.getElementById('reset-password-form');
        this.passwordInput = document.getElementById('password');
        this.confirmInput = document.getElementById('confirm-password');
        this.messageEl = document.getElementById('status-message');
        this.submitBtn = document.querySelector('.btn-submit');
        this.backLink = document.querySelector('.back-link');

        // Get token from URL
        const urlParams = new URLSearchParams(window.location.search);
        this.token = urlParams.get('token');

        this.init();
    }

    init() {
        if (!this.token) {
            this.showMessage('Invalid or missing reset token.', 'error');
            this.submitBtn.disabled = true;
            return;
        }

        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
    }

    async handleSubmit(e) {
        e.preventDefault();
        this.showMessage('', ''); // Clear messages

        const password = this.passwordInput.value;
        const confirm = this.confirmInput.value;

        if (password !== confirm) {
            this.showMessage('Passwords do not match.', 'error');
            return;
        }

        if (password.length < 6) {
            this.showMessage('Password must be at least 6 characters.', 'error');
            return;
        }

        const originalBtnText = this.submitBtn.textContent;
        this.submitBtn.textContent = 'Resetting...';
        this.submitBtn.disabled = true;

        try {
            const response = await fetch(`${APP_CONFIG.apiUrl}/auth/reset-password/${this.token}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ password })
            });

            const data = await response.json();

            if (response.ok) {
                this.showMessage('Password reset successfully! Redirecting...', 'success');
                this.form.reset();
                this.backLink.style.display = 'block'; // Show login link

                // Optional: Auto redirect
                setTimeout(() => {
                    window.location.href = '/login.html';
                }, 3000);
            } else {
                this.showMessage(data.message || 'Failed to reset password', 'error');
                this.submitBtn.textContent = originalBtnText; // Allow retry if possible, or maybe token expired
                // If token expired, probably should keep disabled and tell user to request new one
                if (data.message.includes('expired')) {
                    this.submitBtn.disabled = true;
                } else {
                    this.submitBtn.disabled = false;
                }
            }
        } catch (error) {
            console.error('Error:', error);
            this.showMessage('An error occurred. Please try again.', 'error');
            this.submitBtn.textContent = originalBtnText;
            this.submitBtn.disabled = false;
        }
    }

    showMessage(text, type) {
        this.messageEl.className = 'message ' + type;
        this.messageEl.textContent = text;
    }
}

new ResetPasswordManager();
