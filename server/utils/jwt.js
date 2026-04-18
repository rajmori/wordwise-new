import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Generate JWT token
 * @param {Object} payload - Data to embed in token (userId, email)
 * @returns {string} - JWT token
 */
export const generateToken = (payload) => {
    return jwt.sign(
        payload,
        process.env.JWT_SECRET,
        { expiresIn: '15m' } // Short-lived access token
    );
};

/**
 * Generate Refresh Token (long-lived)
 * @param {Object} payload - Data to embed (userId)
 * @returns {string} - JWT refresh token
 */
export const generateRefreshToken = (payload) => {
    return jwt.sign(
        payload,
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
    );
};

/**
 * Verify JWT token
 * @param {string} token - JWT token to verify
 * @returns {Object} - Decoded token payload
 */
export const verifyToken = (token) => {
    try {
        return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
        throw new Error('Invalid token');
    }
};
