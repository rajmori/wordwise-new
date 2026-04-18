import { APP_CONFIG } from '../config.js';

class ForgotPasswordManager {
    constructor() {
        this.form = document.getElementById('forgot-password-form');
        this.emailInput = document.getElementById('email');
        this.messageEl = document.getElementById('status-message');
        this.submitBtn = document.querySelector('.btn-submit');

        this.init();
    }

    init() {
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
    }

    async handleSubmit(e) {
        e.preventDefault();
        this.showMessage('', ''); // Clear messages

        const email = this.emailInput.value.trim();
        if (!email) return;

        const originalBtnText = this.submitBtn.textContent;
        this.submitBtn.textContent = 'Sending...';
        this.submitBtn.disabled = true;

        try {
            const response = await fetch(`${APP_CONFIG.apiUrl}/auth/forgot-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email })
            });

            const data = await response.json();

            if (response.ok) {
                this.showMessage(data.message || 'Reset link sent to your email!', 'success');
                this.form.reset();
            } else {
                this.showMessage(data.message || 'Failed to send reset link', 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            this.showMessage('An error occurred. Please try again.', 'error');
        } finally {
            this.submitBtn.textContent = originalBtnText;
            this.submitBtn.disabled = false;
        }
    }

    showMessage(text, type) {
        this.messageEl.className = 'message ' + type;
        this.messageEl.textContent = text;
    }
}

new ForgotPasswordManager();
