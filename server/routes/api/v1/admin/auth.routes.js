import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import prisma from '../../../../config/db.prisma.js';

const router = express.Router();

// Google Client setup using env variables
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// JWT token generation configuration
const generateTokens = (adminPayload) => {
    const accessToken = jwt.sign(
        { ...adminPayload },
        process.env.JWT_SECRET || 'fallback-jwt-secret-key-change-me',
        { expiresIn: '15m' } // short-lived access JWT
    );
    const refreshToken = jwt.sign(
        { id: adminPayload.id },
        process.env.JWT_SECRET || 'fallback-jwt-secret-key-change-me',
        { expiresIn: '7d' } // secure rotating refresh token
    );
    return { accessToken, refreshToken };
};

// Set HttpOnly Secure SameSite Cookie
const setRefreshTokenCookie = (res, token) => {
    res.cookie('admin_refresh_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
};

/**
 * Admin Login via Email and Password
 */
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase() },
            include: {
                userRoles: {
                    include: { role: true }
                }
            }
        });

        if (!user || !user.isActive) {
            return res.status(401).json({ success: false, message: 'Invalid credentials or account deactivated.' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ success: false, message: 'Invalid credentials.' });
        }

        const adminRoles = user.userRoles.map(ur => ur.role.name);
        const isAdmin = adminRoles.some(role => 
            ['super_admin', 'content_admin', 'support_admin', 'finance_admin', 'analyst', 'readonly_admin'].includes(role)
        );

        if (!isAdmin) {
            return res.status(403).json({ success: false, message: 'Access denied. Admin privileges required.' });
        }

        // Log the successful login attempt
        await prisma.loginLog.create({
            data: {
                userId: user.id,
                ipAddress: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1',
                device: req.headers['sec-ch-ua'] || 'Unknown Device',
                userAgent: req.headers['user-agent']
            }
        });

        // Update last login timestamp
        await prisma.user.update({
            where: { id: user.id },
            data: { lastLogin: new Date() }
        });

        const { accessToken, refreshToken } = generateTokens({
            id: user.id,
            email: user.email,
            name: user.name,
            roles: adminRoles
        });

        setRefreshTokenCookie(res, refreshToken);

        res.json({
            success: true,
            accessToken,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                roles: adminRoles
            }
        });
    } catch (error) {
        console.error('Admin Login Error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

/**
 * Google OIDC OAuth authentication endpoint
 */
router.post('/google', async (req, res) => {
    const { idToken } = req.body;
    if (!idToken) {
        return res.status(400).json({ success: false, message: 'Google ID token is required' });
    }

    try {
        const ticket = await googleClient.verifyIdToken({
            idToken,
            audience: process.env.GOOGLE_CLIENT_ID
        });
        const payload = ticket.getPayload();
        const { email } = payload;

        const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase() },
            include: {
                userRoles: {
                    include: { role: true }
                }
            }
        });

        if (!user || !user.isActive) {
            return res.status(401).json({ success: false, message: 'Google OAuth failed. Admin account not found or deactivated.' });
        }

        const adminRoles = user.userRoles.map(ur => ur.role.name);
        const isAdmin = adminRoles.some(role => 
            ['super_admin', 'content_admin', 'support_admin', 'finance_admin', 'analyst', 'readonly_admin'].includes(role)
        );

        if (!isAdmin) {
            return res.status(403).json({ success: false, message: 'Access denied. Admin credentials required.' });
        }

        // Ingest login logs
        await prisma.loginLog.create({
            data: {
                userId: user.id,
                ipAddress: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1',
                device: req.headers['sec-ch-ua'] || 'Unknown Device',
                userAgent: req.headers['user-agent']
            }
        });

        await prisma.user.update({
            where: { id: user.id },
            data: { lastLogin: new Date() }
        });

        const { accessToken, refreshToken } = generateTokens({
            id: user.id,
            email: user.email,
            name: user.name,
            roles: adminRoles
        });

        setRefreshTokenCookie(res, refreshToken);

        res.json({
            success: true,
            accessToken,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                roles: adminRoles
            }
        });
    } catch (error) {
        console.error('Google OAuth verification failed:', error);
        res.status(401).json({ success: false, message: 'Invalid Google token' });
    }
});

/**
 * Token Refresh endpoint - secure rotating refresh flow
 */
router.post('/refresh', async (req, res) => {
    const refreshToken = req.cookies.admin_refresh_token;
    if (!refreshToken) {
        return res.status(401).json({ success: false, message: 'Session expired' });
    }

    try {
        const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET || 'fallback-jwt-secret-key-change-me');
        const user = await prisma.user.findUnique({
            where: { id: decoded.id },
            include: {
                userRoles: {
                    include: { role: true }
                }
            }
        });

        if (!user || !user.isActive) {
            return res.status(401).json({ success: false, message: 'Invalid session or deactivated account.' });
        }

        const adminRoles = user.userRoles.map(ur => ur.role.name);
        const { accessToken, refreshToken: newRefreshToken } = generateTokens({
            id: user.id,
            email: user.email,
            name: user.name,
            roles: adminRoles
        });

        setRefreshTokenCookie(res, newRefreshToken);

        res.json({
            success: true,
            accessToken
        });
    } catch (error) {
        res.status(401).json({ success: false, message: 'Invalid session' });
    }
});

/**
 * Logout - clear cookie state
 */
router.post('/logout', (req, res) => {
    res.clearCookie('admin_refresh_token');
    res.json({ success: true, message: 'Logged out successfully' });
});

export default router;
