import express from 'express';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import Admin from '../../../../models/Admin.js';

const router = express.Router();

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const getJwtSecret = () => {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET is not configured');
    return secret;
};

const generateTokens = (payload) => {
    const secret = getJwtSecret();
    const accessToken = jwt.sign(payload, secret, { expiresIn: '15m' });
    const refreshToken = jwt.sign({ id: payload.id }, secret, { expiresIn: '7d' });
    return { accessToken, refreshToken };
};

const setRefreshTokenCookie = (res, token) => {
    res.cookie('admin_refresh_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000
    });
};

/**
 * POST /login — Email + password login
 */
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    try {
        const admin = await Admin.findOne({ email: email.toLowerCase() });

        if (!admin || !admin.isActive) {
            return res.status(401).json({ success: false, message: 'Invalid credentials or account deactivated.' });
        }

        const isPasswordValid = await admin.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({ success: false, message: 'Invalid credentials.' });
        }

        admin.lastLogin = new Date();
        await admin.save();

        const tokenPayload = {
            id: admin._id.toString(),
            email: admin.email,
            name: admin.name,
            role: admin.role,
            roles: [admin.role]
        };

        const { accessToken, refreshToken } = generateTokens(tokenPayload);
        setRefreshTokenCookie(res, refreshToken);

        res.json({
            success: true,
            accessToken,
            user: {
                id: admin._id,
                email: admin.email,
                name: admin.name,
                role: admin.role,
                roles: [admin.role]
            }
        });
    } catch (error) {
        console.error('Admin Login Error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

/**
 * POST /google — Google OIDC login
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
        const { email } = ticket.getPayload();

        const admin = await Admin.findOne({ email: email.toLowerCase() });

        if (!admin || !admin.isActive) {
            return res.status(401).json({ success: false, message: 'Admin account not found or deactivated.' });
        }

        admin.lastLogin = new Date();
        await admin.save();

        const tokenPayload = {
            id: admin._id.toString(),
            email: admin.email,
            name: admin.name,
            role: admin.role,
            roles: [admin.role]
        };

        const { accessToken, refreshToken } = generateTokens(tokenPayload);
        setRefreshTokenCookie(res, refreshToken);

        res.json({
            success: true,
            accessToken,
            user: {
                id: admin._id,
                email: admin.email,
                name: admin.name,
                role: admin.role,
                roles: [admin.role]
            }
        });
    } catch (error) {
        console.error('Google OAuth Error:', error);
        res.status(401).json({ success: false, message: 'Invalid Google token' });
    }
});

/**
 * POST /refresh — Rotate refresh token
 */
router.post('/refresh', async (req, res) => {
    const refreshToken = req.cookies.admin_refresh_token;
    if (!refreshToken) {
        return res.status(401).json({ success: false, message: 'Session expired' });
    }

    try {
        const decoded = jwt.verify(refreshToken, getJwtSecret());
        const admin = await Admin.findById(decoded.id);

        if (!admin || !admin.isActive) {
            return res.status(401).json({ success: false, message: 'Invalid session or deactivated account.' });
        }

        const tokenPayload = {
            id: admin._id.toString(),
            email: admin.email,
            name: admin.name,
            role: admin.role,
            roles: [admin.role]
        };

        const { accessToken, refreshToken: newRefreshToken } = generateTokens(tokenPayload);
        setRefreshTokenCookie(res, newRefreshToken);

        res.json({ success: true, accessToken });
    } catch (error) {
        res.status(401).json({ success: false, message: 'Invalid or expired session' });
    }
});

/**
 * POST /logout — Clear refresh token cookie
 */
router.post('/logout', (req, res) => {
    res.clearCookie('admin_refresh_token');
    res.json({ success: true, message: 'Logged out successfully' });
});

export default router;
