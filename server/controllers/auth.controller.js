import User from '../models/user.model.js';
import bcrypt from 'bcryptjs';
import { generateToken, generateRefreshToken, verifyToken } from '../utils/jwt.js';
import ResetToken from '../models/resetToken.model.js';
import RefreshToken from '../models/RefreshToken.js';
import sendEmail from '../utils/email.js';
import crypto from 'crypto';

// Helper to set refresh token cookie
const setTokenCookie = (res, token) => {
    const cookieOptions = {
        httpOnly: true,
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        secure: process.env.NODE_ENV === 'production', // Only secure in production
        sameSite: 'strict'
    };
    res.cookie('refreshToken', token, cookieOptions);
};

// Helper to save refresh token to DB
const saveRefreshToken = async (userId, token, ipAddress) => {
    await new RefreshToken({
        userId,
        token,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdByIp: ipAddress
    }).save();
};

/**
 * @desc    Register a new user
 * @route   POST /api/auth/signup
 * @access  Public
 */
export const signup = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const ipAddress = req.ip;

        // Validation
        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Please add all fields' });
        }

        if (password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters' });
        }

        // Check if user exists
        const userExists = await User.findOne({ email });

        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user
        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            isSubscribed: false,
            createdAt: new Date()
        });

        if (user) {
            // Generate tokens
            const accessToken = generateToken({ userId: user._id, email: user.email });
            const refreshToken = generateRefreshToken({ userId: user._id });

            // Save refresh token
            await saveRefreshToken(user._id, refreshToken, ipAddress);

            // Set cookie
            setTokenCookie(res, refreshToken);

            res.status(201).json({
                message: 'Signup successful',
                _id: user.id,
                name: user.name,
                email: user.email,
                isSubscribed: user.isSubscribed,
                enrolledCourses: user.enrolledCourses,
                token: accessToken // Send Access Token
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        console.error('Signup Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * @desc    Authenticate user & get token
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const ipAddress = req.ip;

        // Check for user email
        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const isMatch = user.password ? await bcrypt.compare(password, user.password) : false;

        if (user && isMatch) {
            // Generate tokens
            const accessToken = generateToken({ userId: user._id, email: user.email });
            const refreshToken = generateRefreshToken({ userId: user._id });

            // Save refresh token
            await saveRefreshToken(user._id, refreshToken, ipAddress);

            // Set cookie
            setTokenCookie(res, refreshToken);

            res.json({
                _id: user.id,
                name: user.name,
                email: user.email,
                isSubscribed: user.isSubscribed,
                enrolledCourses: user.enrolledCourses,
                token: accessToken
            });
        } else {
            res.status(400).json({ message: 'Invalid credentials' });
        }
    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * @desc    Refresh Access Token
 * @route   POST /api/auth/refresh-token
 * @access  Public (Cookie based)
 */
export const refreshToken = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;
        const ipAddress = req.ip;

        if (!refreshToken) {
            return res.status(401).json({ message: 'Refresh Token is required' });
        }

        // Find token in DB
        const tokenDoc = await RefreshToken.findOne({ token: refreshToken });

        if (!tokenDoc) {
            return res.status(403).json({ message: 'Refresh token is not valid!' }); // Token not found or hijacked
        }

        // Verify token signatures
        let decoded;
        try {
            decoded = verifyToken(refreshToken);
        } catch (err) {
            // If token expired but exists in DB, we should remove it
            await RefreshToken.findByIdAndDelete(tokenDoc._id);
            return res.status(403).json({ message: 'Refresh token expired!' });
        }

        // Verify if token is revoked
        if (tokenDoc.revoked) {
            // Basic threat model: If revoked token is used, revoke all tokens for this user family?
            // For now just deny
            return res.status(403).json({ message: 'Token revoked!' });
        }

        const user = await User.findById(decoded.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Token Rotation: Revoke old token, issue new one
        // Optionally: We can delete the old one or mark as revoked/replaced
        // Here we'll delete the old one to keep DB clean, OR we can replace it.
        // Let's replace it (delete old, create new)
        await RefreshToken.findByIdAndDelete(tokenDoc._id);

        const newAccessToken = generateToken({ userId: user._id, email: user.email });
        const newRefreshToken = generateRefreshToken({ userId: user._id });

        await saveRefreshToken(user._id, newRefreshToken, ipAddress);
        setTokenCookie(res, newRefreshToken);

        res.json({
            token: newAccessToken,
            _id: user._id,
            name: user.name,
            email: user.email,
            isSubscribed: user.isSubscribed,
            enrolledCourses: user.enrolledCourses
        });

    } catch (error) {
        console.error('Refresh Token Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * @desc    Logout user / revoke token
 * @route   POST /api/auth/logout
 * @access  Public
 */
export const logout = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;

        if (refreshToken) {
            await RefreshToken.findOneAndDelete({ token: refreshToken });
        }

        res.clearCookie('refreshToken');
        res.json({ message: 'Logged out successfully' });
    } catch (error) {
        console.error('Logout Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * @desc    Get current user data
 * @route   GET /api/auth/me
 * @access  Private
 */
export const getMe = async (req, res) => {
    res.status(200).json(req.user);
};

// ... (forgotPassword and resetPassword remain same)
/**
 * @desc    Request password reset
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: 'No account associated with this email' });
        }

        // Generate Token
        let token = crypto.randomBytes(32).toString('hex');

        // Delete any existing token for this user
        await ResetToken.deleteMany({ userId: user._id });

        // Save new token
        await new ResetToken({
            userId: user._id,
            token: token
        }).save();

        // Create Reset Link
        const resetUrl = `http://localhost:5173/reset-password.html?token=${token}`;

        const message = `
            <h2>Password Reset Request</h2>
            <p>You requested a password reset. Please click the link below to reset your password:</p>
            <a href="${resetUrl}" clicktracking=off>${resetUrl}</a>
            <p>This link expires in 30 minutes.</p>
        `;

        await sendEmail(user.email, 'Password Reset Request', message);

        res.status(200).json({ message: 'Reset link sent to your email' });
    } catch (error) {
        console.error('Forgot Password Error:', error);
        res.status(500).json({ message: 'Email could not be sent' });
    }
};

/**
 * @desc    Reset Password
 * @route   POST /api/auth/reset-password/:token
 * @access  Public
 */
export const resetPassword = async (req, res) => {
    try {
        const { token } = req.params;
        const { password } = req.body;

        if (!password || password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters' });
        }

        // Find token
        const resetToken = await ResetToken.findOne({ token });

        if (!resetToken) {
            return res.status(400).json({ message: 'Token expired or invalid' });
        }

        // Find user
        const user = await User.findById(resetToken.userId);
        if (!user) {
            return res.status(400).json({ message: 'User not found' });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        await user.save();

        // Delete token
        await ResetToken.deleteOne({ _id: resetToken._id });

        res.status(200).json({ message: 'Password has been updated successfully' });

    } catch (error) {
        console.error('Reset Password Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
