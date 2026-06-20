// Google OAuth Configuration
export const GOOGLE_CLIENT_ID = '287458285838-c1noct3nue62klke4gjv0svhqa725l8p.apps.googleusercontent.com';

// Detect environment
const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
const baseUrl = isProduction
    ? (window.location.hostname === 'wordwise.in' ? 'https://wordwise.in' : 'https://wordwise.pages.dev')
    : window.location.origin;

// OAuth Configuration
export const OAUTH_CONFIG = {
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: isProduction
        ? 'https://wordwise.in/login'
        : window.location.origin + '/login.html',
    scope: 'openid email profile',
    response_type: 'token id_token',
    prompt: 'select_account'
};

// App Configuration
export const APP_CONFIG = {
    appName: 'WordWise',
    tokenKey: 'wordwise_token',
    userKey: 'wordwise_user',
    adminTokenKey: 'wordwise_admin_token',
    isProduction,
    baseUrl,
    apiUrl: import.meta.env.VITE_API_URL || 'http://127.0.0.1:3000/api'
};

// API Base URL for backend server
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:3000/api';

// Admin API versioned entrypoint
export const ADMIN_API_BASE_URL = import.meta.env.VITE_API_URL 
    ? `${import.meta.env.VITE_API_URL.replace(/\/api$/, '')}/api/v1/admin` 
    : 'http://127.0.0.1:3000/api/v1/admin';

