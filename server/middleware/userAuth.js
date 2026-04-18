import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Middleware to authenticate user requests
 */
export const authenticateUser = async (req, res, next) => {
    try {
        // Get token from header
        const authHeader = req.headers.authorization;
        console.log('🔍 Auth header received:', authHeader ? 'Header exists' : 'No header');

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            console.log('❌ No Bearer token in header');
            return res.status(401).json({
                success: false,
                message: 'No token provided. Please login.'
            });
        }

        const token = authHeader.split(' ')[1];
        console.log('🔑 Token extracted:', token ? `${token.substring(0, 20)}...` : 'No token');

        if (!token || token === 'null' || token === 'undefined') {
            console.log('❌ Invalid token value');
            return res.status(401).json({
                success: false,
                message: 'Invalid token. Please login.'
            });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('🔓 Decoded token:', decoded);

        // Check if user exists and is active
        // Support both 'id' and 'userId' in token payload
        const userId = decoded.id || decoded.userId;

        if (!userId) {
            console.log('❌ No user ID in token payload');
            return res.status(401).json({
                success: false,
                message: 'Invalid token structure. Please login again.'
            });
        }

        const user = await User.findById(userId);

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User not found. Please login again.'
            });
        }

        if (!user.isActive) {
            return res.status(403).json({
                success: false,
                message: 'Account is inactive. Please contact support.'
            });
        }

        // Attach user info to request
        req.user = {
            id: user._id,
            googleId: user.googleId,
            email: user.email,
            name: user.name,
            subscription: user.subscription,
            enrolledCourses: user.enrolledCourses
        };

        next();

    } catch (error) {
        console.error('Auth Middleware Error:', error);

        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Invalid token. Please login again.'
            });
        }

        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Session expired. Please login again.'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Authentication failed'
        });
    }
};

/**
 * Optional authentication - doesn't fail if no token
 */
export const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            req.user = null;
            return next();
        }

        const token = authHeader.split(' ')[1];

        if (!token || token === 'null' || token === 'undefined') {
            req.user = null;
            return next();
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);

        if (user && user.isActive) {
            req.user = {
                id: user._id,
                googleId: user.googleId,
                email: user.email,
                name: user.name,
                subscription: user.subscription
            };
        } else {
            req.user = null;
        }

        next();

    } catch (error) {
        req.user = null;
        next();
    }
};

