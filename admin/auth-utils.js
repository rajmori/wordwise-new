/**
 * Admin Authentication Utility
 * Shared authentication functions for all admin pages
 * Validates 24-hour session and manages token lifecycle
 */

// Session duration in hours
const SESSION_DURATION_HOURS = 24;

/**
 * Clear all admin session data from localStorage
 */
export const clearAdminSession = () => {
    localStorage.removeItem('wordwise_admin_session');
    localStorage.removeItem('wordwise_admin_token');
    localStorage.removeItem('wordwise_admin_info');
    localStorage.removeItem('wordwise_admin_login_time');
};

/**
 * Check if admin is authenticated with valid 24-hour session
 * @returns {boolean} - True if authenticated and session is valid
 */
export const isAdminAuthenticated = () => {
    const adminSession = localStorage.getItem('wordwise_admin_session');
    const loginTimestamp = localStorage.getItem('wordwise_admin_login_time');
    const token = localStorage.getItem('wordwise_admin_token');
    
    // Check if session exists
    if (adminSession !== 'authenticated' || !token) {
        return false;
    }
    
    // Check if login timestamp exists
    if (!loginTimestamp) {
        clearAdminSession();
        return false;
    }
    
    // Calculate time difference
    const loginTime = new Date(parseInt(loginTimestamp));
    const currentTime = new Date();
    const hoursDifference = (currentTime - loginTime) / (1000 * 60 * 60);
    
    // Check if session has expired
    if (hoursDifference >= SESSION_DURATION_HOURS) {
        clearAdminSession();
        return false;
    }
    
    return true;
};

/**
 * Get the current admin token
 * Validates session before returning token
 * @returns {string|null} - Token if valid, null otherwise
 */
export const getAdminToken = () => {
    if (!isAdminAuthenticated()) {
        return null;
    }
    return localStorage.getItem('wordwise_admin_token');
};

/**
 * Get admin info from localStorage
 * @returns {object|null} - Admin info object or null
 */
export const getAdminInfo = () => {
    const adminInfo = localStorage.getItem('wordwise_admin_info');
    if (!adminInfo) return null;
    
    try {
        return JSON.parse(adminInfo);
    } catch (error) {
        console.error('Error parsing admin info:', error);
        return null;
    }
};

/**
 * Require authentication - redirect to login if not authenticated
 * Call this at the start of every admin page
 * @param {boolean} showAlert - Whether to show alert on session expiry
 */
export const requireAuth = (showAlert = false) => {
    if (!isAdminAuthenticated()) {
        if (showAlert) {
            alert('Your session has expired. Please login again.');
        }
        clearAdminSession();
        window.location.href = './login.html';
        return false;
    }
    return true;
};

/**
 * Logout admin user
 * Clears session and redirects to login
 */
export const logout = () => {
    clearAdminSession();
    window.location.href = './login.html';
};

/**
 * Save login session
 * Call this after successful login
 * @param {string} token - JWT token
 * @param {object} adminInfo - Admin user information
 */
export const saveLoginSession = (token, adminInfo = null) => {
    const loginTime = Date.now();
    localStorage.setItem('wordwise_admin_token', token);
    localStorage.setItem('wordwise_admin_session', 'authenticated');
    localStorage.setItem('wordwise_admin_login_time', loginTime.toString());
    
    if (adminInfo) {
        localStorage.setItem('wordwise_admin_info', JSON.stringify(adminInfo));
    }
};

/**
 * Get remaining session time in hours
 * @returns {number} - Hours remaining in session
 */
export const getRemainingSessionTime = () => {
    const loginTimestamp = localStorage.getItem('wordwise_admin_login_time');
    if (!loginTimestamp) return 0;
    
    const loginTime = new Date(parseInt(loginTimestamp));
    const currentTime = new Date();
    const hoursPassed = (currentTime - loginTime) / (1000 * 60 * 60);
    const hoursRemaining = SESSION_DURATION_HOURS - hoursPassed;
    
    return Math.max(0, hoursRemaining);
};

