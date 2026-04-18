import { APP_CONFIG } from './config.js';

/**
 * Contact Form Service
 * Handles sending contact form submissions to the backend
 */
class ContactService {
    constructor() {
        this.apiUrl = `${APP_CONFIG.apiUrl}/contact`;
    }

    /**
     * Send contact form data to backend
     * @param {Object} formData - Contact form data
     * @param {string} formData.name - Sender's name
     * @param {string} formData.email - Sender's email
     * @param {string} formData.message - Message content
     * @param {string} formData.honeypot - Honeypot field for bot detection
     * @returns {Promise<Object>} Response from server
     */
    async sendContactForm(formData) {
        try {
            console.log('📧 Sending contact form to:', this.apiUrl);
            console.log('📝 Form data:', { 
                name: formData.name, 
                email: formData.email, 
                messageLength: formData.message?.length 
            });

            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to send message');
            }

            console.log('✅ Contact form sent successfully:', data);
            return data;

        } catch (error) {
            console.error('❌ Contact form error:', error);
            throw error;
        }
    }
}

// Export singleton instance
export const contactService = new ContactService();

