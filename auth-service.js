// Authentication Service using Google Identity Services
import { GOOGLE_CLIENT_ID, APP_CONFIG } from './config.js';

class AuthService {
    constructor() {
        this.googleClient = null;
        this.initialized = false;
    }

    /**
     * Initialize Google Identity Services
     */
    async init() {
        if (this.initialized) return;

        return new Promise((resolve, reject) => {
            // Load Google Identity Services script
            const script = document.createElement('script');
            script.src = 'https://accounts.google.com/gsi/client';
            script.async = true;
            script.defer = true;

            script.onload = () => {
                this.initialized = true;
                console.log('Google Identity Services loaded');
                resolve();
            };

            script.onerror = () => {
                reject(new Error('Failed to load Google Identity Services'));
            };

            document.head.appendChild(script);
        });
    }

    /**
     * Initialize Google Sign-In button
     * @param {string} buttonId - ID of the button element
     * @param {Function} callback - Callback function to handle the response
     */
    initGoogleButton(buttonId, callback) {
        if (!this.initialized || !window.google) {
            console.error('Google Identity Services not initialized');
            return;
        }

        const button = document.getElementById(buttonId);
        if (!button) {
            console.error(`Button with ID ${buttonId} not found`);
            return;
        }

        // Initialize Google Sign-In
        window.google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: (response) => this.handleCredentialResponse(response, callback),
            auto_select: false,
            cancel_on_tap_outside: true
        });

        // Render the button
        window.google.accounts.id.renderButton(
            button,
            {
                theme: 'outline',
                size: 'large',
                width: button.offsetWidth,
                text: 'continue_with',
                shape: 'rectangular'
            }
        );
    }

    /**
     * Handle custom Google Sign-In button click
     * @param {Function} callback - Callback function to handle the response
     */
    async signInWithGoogle(callback) {
        if (!this.initialized || !window.google) {
            console.error('Google Identity Services not initialized');
            callback({ error: 'Google Sign-In not initialized' });
            return;
        }

        try {
            // Use Google One Tap or redirect flow
            window.google.accounts.id.initialize({
                client_id: GOOGLE_CLIENT_ID,
                callback: (response) => this.handleCredentialResponse(response, callback),
                auto_select: false
            });

            // Prompt the user to sign in
            window.google.accounts.id.prompt((notification) => {
                if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
                    // Fallback to OAuth 2.0 flow
                    this.initiateOAuthFlow(callback);
                }
            });
        } catch (error) {
            console.error('Sign-in error:', error);
            callback({ error: error.message });
        }
    }

    /**
     * Initiate OAuth 2.0 flow (fallback)
     * @param {Function} callback - Callback function
     */
    initiateOAuthFlow(callback) {
        const oauth2Endpoint = 'https://accounts.google.com/o/oauth2/v2/auth';
        const params = new URLSearchParams({
            client_id: GOOGLE_CLIENT_ID,
            redirect_uri: window.location.origin + window.location.pathname,
            response_type: 'token id_token',
            scope: 'openid email profile',
            nonce: this.generateNonce(),
            prompt: 'select_account'
        });

        // Store callback for later
        sessionStorage.setItem('oauth_callback', 'pending');

        // Redirect to Google OAuth
        window.location.href = `${oauth2Endpoint}?${params.toString()}`;
    }

    /**
     * Handle OAuth redirect callback
     */
    async handleOAuthCallback() {
        const hash = window.location.hash.substring(1);
        const params = new URLSearchParams(hash);

        const idToken = params.get('id_token');
        const accessToken = params.get('access_token');

        if (idToken && accessToken) {
            try {
                // Send the Google ID token to backend for verification
                const response = await fetch(`${APP_CONFIG.apiUrl}/users/auth/google`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        idToken: idToken
                    })
                });

                const data = await response.json();

                if (data.success && data.token) {
                    // Store the backend JWT token
                    this.storeBackendToken(data.token);
                    this.storeUser(data.user);

                    // Clear the hash
                    window.history.replaceState(null, null, window.location.pathname);

                    return { success: true, user: data.user, message: data.message };
                } else {
                    throw new Error(data.message || 'Authentication failed');
                }
            } catch (error) {
                console.error('OAuth callback error:', error);
                return { success: false, error: error.message };
            }
        }

        return null;
    }

    /**
     * Handle credential response from Google
     * @param {Object} response - Google credential response
     * @param {Function} callback - Callback function
     */
    async handleCredentialResponse(response, callback) {
        if (response.credential) {
            try {
                console.log('🔐 Google credential received, sending to backend...');
                console.log('📡 Backend URL:', `${APP_CONFIG.apiUrl}/users/auth/google`);

                // Send the Google ID token to backend for verification
                const backendResponse = await fetch(`${APP_CONFIG.apiUrl}/users/auth/google`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        idToken: response.credential
                    })
                });

                console.log('📥 Backend response status:', backendResponse.status);

                if (!backendResponse.ok) {
                    const errorText = await backendResponse.text();
                    console.error('❌ Backend error:', errorText);
                    throw new Error(`Backend returned ${backendResponse.status}`);
                }

                const data = await backendResponse.json();
                console.log('✅ Backend response:', data);

                if (data.success && data.token) {
                    // Store the backend JWT token (24-hour session)
                    this.storeBackendToken(data.token);
                    this.storeUser(data.user);

                    console.log('✅ User authenticated:', data.user.email);

                    // Call the callback with user info
                    if (callback) {
                        callback({ success: true, user: data.user, message: data.message });
                    }
                } else {
                    throw new Error(data.message || 'Authentication failed');
                }
            } catch (error) {
                console.error('❌ Backend authentication error:', error);
                if (callback) {
                    callback({ success: false, error: error.message || 'Authentication failed' });
                }
            }
        } else {
            console.error('❌ No credential in response');
            if (callback) {
                callback({ success: false, error: 'Authentication failed' });
            }
        }
    }

    /**
     * Decode JWT token
     * @param {string} token - JWT token
     * @returns {Object} Decoded token payload
     */
    decodeJWT(token) {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));

            return JSON.parse(jsonPayload);
        } catch (error) {
            console.error('Error decoding JWT:', error);
            return null;
        }
    }

    /**
     * Store authentication tokens (legacy - for OAuth flow)
     * @param {string} idToken - ID token
     * @param {string} accessToken - Access token
     */
    storeTokens(idToken, accessToken) {
        localStorage.setItem(APP_CONFIG.tokenKey, JSON.stringify({
            idToken,
            accessToken,
            timestamp: Date.now()
        }));
    }

    /**
     * Store backend JWT token (24-hour session)
     * @param {string} token - Backend JWT token
     */
    storeBackendToken(token) {
        const loginTime = Date.now();
        localStorage.setItem('wordwise_user_token', token);
        localStorage.setItem('wordwise_user_session', 'authenticated');
        localStorage.setItem('wordwise_user_login_time', loginTime.toString());
    }

    /**
     * Store user information
     * @param {Object} userInfo - User information from backend or token
     */
    storeUser(userInfo) {
        // Handle both backend response format and Google token format
        const user = {
            id: userInfo.id || userInfo.sub,
            email: userInfo.email,
            name: userInfo.name,
            picture: userInfo.picture,
            emailVerified: userInfo.emailVerified !== undefined ? userInfo.emailVerified : userInfo.email_verified,
            subscription: userInfo.subscription,
            preferences: userInfo.preferences,
            enrolledCourses: userInfo.enrolledCourses
        };

        console.log('💾 Storing user in localStorage:', user);
        localStorage.setItem(APP_CONFIG.userKey, JSON.stringify(user));
    }

    /**
     * Get current user
     * @returns {Object|null} User object or null
     */
    getCurrentUser() {
        const userStr = localStorage.getItem(APP_CONFIG.userKey);
        const user = userStr ? JSON.parse(userStr) : null;
        console.log('📖 Getting current user from localStorage:', user);
        return user;
    }

    /**
     * Get authentication tokens (legacy)
     * @returns {Object|null} Tokens object or null
     */
    getTokens() {
        const tokensStr = localStorage.getItem(APP_CONFIG.tokenKey);
        return tokensStr ? JSON.parse(tokensStr) : null;
    }

    /**
     * Get backend JWT token
     * @returns {string|null} Backend token or null
     */
    getBackendToken() {
        const token = localStorage.getItem('wordwise_user_token');
        const loginTimestamp = localStorage.getItem('wordwise_user_login_time');
        const session = localStorage.getItem('wordwise_user_session');

        if (!token || session !== 'authenticated' || !loginTimestamp) {
            return null;
        }

        // Check if session expired (24 hours)
        const loginTime = new Date(parseInt(loginTimestamp));
        const currentTime = new Date();
        const hoursDifference = (currentTime - loginTime) / (1000 * 60 * 60);

        if (hoursDifference >= 24) {
            this.logout();
            return null;
        }

        return token;
    }

    /**
     * Check if user is authenticated
     * @returns {boolean} True if authenticated
     */
    isAuthenticated() {
        const token = this.getBackendToken();
        const user = this.getCurrentUser();

        return !!(token && user);
    }

    /**
     * Sign out the user
     */
    logout() {
        // Clear local storage (both legacy and new tokens)
        localStorage.removeItem(APP_CONFIG.tokenKey);
        localStorage.removeItem(APP_CONFIG.userKey);
        localStorage.removeItem('wordwise_user_token');
        localStorage.removeItem('wordwise_user_session');
        localStorage.removeItem('wordwise_user_login_time');

        // Sign out from Google
        if (this.initialized && window.google) {
            window.google.accounts.id.disableAutoSelect();
        }

        console.log('User logged out');
    }

    /**
     * Generate a random nonce for OAuth
     * @returns {string} Random nonce
     */
    generateNonce() {
        return Math.random().toString(36).substring(2, 15) +
            Math.random().toString(36).substring(2, 15);
    }

    /**
     * Require authentication - redirect to login if not authenticated
     * @param {string} redirectUrl - URL to redirect to after login
     */
    requireAuth(redirectUrl = '/login.html') {
        if (!this.isAuthenticated()) {
            // Store the current URL to redirect back after login
            sessionStorage.setItem('redirect_after_login', window.location.href);
            window.location.href = redirectUrl;
            return false;
        }
        return true;
    }

    /**
     * Check if user has active access (subscription or enrolled courses)
     * @returns {boolean} True if user has access
     */
    hasActiveAccess() {
        const user = this.getCurrentUser();
        if (!user) return false;

        const hasActiveSubscription = user.subscription &&
            user.subscription.status === 'active' &&
            new Date(user.subscription.currentPeriodEnd) > new Date();

        const hasEnrolledCourses = user.enrolledCourses && user.enrolledCourses.length > 0;
        const isSubscribedFlag = user.isSubscribed === true || user.isSubscribed === 'true';

        return !!(hasActiveSubscription || hasEnrolledCourses || isSubscribedFlag);
    }

    /**
     * Sign up with email and password
     * @param {string} name
     * @param {string} email
     * @param {string} password
     * @returns {Promise<Object>} Response data
     */
    async signup(name, email, password) {
        try {
            console.log('📝 Sending signup request to:', `${APP_CONFIG.apiUrl}/auth/signup`);
            const response = await fetch(`${APP_CONFIG.apiUrl}/auth/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password })
            });

            const data = await response.json();
            console.log('📥 Signup response:', data);

            if (!response.ok) {
                // Return success: false with the error message as expected by the frontend
                return { success: false, error: data.message || 'Signup failed' };
            }

            if (data.token) {
                this.storeBackendToken(data.token);
                this.storeUser({ ...data, id: data._id });
                return { success: true, user: data };
            }

            return { success: true, message: data.message };
        } catch (error) {
            console.error('❌ Signup error:', error);
            return { success: false, error: error.message || 'Network error occurred' };
        }
    }

    /**
     * Login with email and password
     * @param {string} email
     * @param {string} password
     * @returns {Promise<Object>} Response data
     */
    async login(email, password) {
        try {
            console.log('🔑 Sending login request to:', `${APP_CONFIG.apiUrl}/auth/login`);
            const response = await fetch(`${APP_CONFIG.apiUrl}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();
            console.log('📥 Login response:', data);

            if (!response.ok) {
                return { success: false, error: data.message || 'Login failed' };
            }

            if (data.token) {
                this.storeBackendToken(data.token);
                this.storeUser({ ...data, id: data._id });
                return { success: true, user: data };
            }

            return { success: false, error: 'No token received' };
        } catch (error) {
            console.error('❌ Login error:', error);
            return { success: false, error: error.message || 'Network error occurred' };
        }
    }

    /**
     * Handle post-login redirect
     */
    handlePostLoginRedirect() {
        const redirectUrl = sessionStorage.getItem('redirect_after_login');
        sessionStorage.removeItem('redirect_after_login');

        if (redirectUrl) {
            window.location.href = redirectUrl;
        } else {
            window.location.href = '/dashboard.html';
        }
    }
}

// Export singleton instance
export const authService = new AuthService();
