import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import pkg from 'google-auth-library';
const { OAuth2Client } = pkg;
import User from '../models/user.model.js';
import Subscription from '../models/Subscription.js';
import LoginLog from '../models/LoginLog.js';
import { UAParser } from 'ua-parser-js';
import dotenv from 'dotenv';

dotenv.config();

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * Helper function to track login logs using ip-api.com
 */
const recordLoginLog = async (req, userId, loginMethod) => {
    try {
        const rawIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip || 'Unknown';
        const ip = rawIp.split(',')[0].trim();
        const userAgentString = req.headers['user-agent'] || '';
        
        const parser = new UAParser(userAgentString);
        const result = parser.getResult();
        
        const device = {
            os: result.os.name || 'Unknown',
            browser: result.browser.name || 'Unknown',
            platform: result.device.type || result.os.name || 'desktop'
        };

        let location = { country: 'Localhost', city: 'Localhost', isp: 'Localhost' };
        
        // Skip ip-api call for localhost/private IPs
        if (ip && !ip.includes('127.0.0.1') && !ip.includes('::1') && ip !== 'localhost' && ip !== 'Unknown') {
            try {
                // native node fetch
                const ipRes = await fetch(`http://ip-api.com/json/${ip}`);
                const ipData = await ipRes.json();
                if (ipData.status === 'success') {
                    location = {
                        country: ipData.country || 'Unknown',
                        city: ipData.city || 'Unknown',
                        isp: ipData.isp || 'Unknown'
                    };
                }
            } catch (err) {
                console.error('Error fetching IP location:', err.message);
            }
        }

        const log = new LoginLog({
            userId,
            ip,
            location,
            device,
            loginMethod
        });
        await log.save();
    } catch (e) {
        console.error('Failed to save login log:', e.message);
    }
};

/**
 * Helper function to verify Google ID token
 */
const verifyGoogleToken = async (idToken) => {
    const ticket = await client.verifyIdToken({
        idToken: idToken,
        audience: process.env.GOOGLE_CLIENT_ID
    });
    return ticket.getPayload();
};

/**
 * Helper function to generate JWT token (4 hours expiry)
 */
const generateJWT = (user) => {
    return jwt.sign(
        {
            id: user._id,
            googleId: user.googleId,
            email: user.email,
            name: user.name
        },
        process.env.JWT_SECRET,
        { expiresIn: '4h' } // 4 hours as per requirements
    );
};

/**
 * Google OAuth Signup (Registration)
 * Creates a new user account if user doesn't exist
 */
export const googleSignup = async (req, res) => {
    try {
        const { idToken } = req.body;

        if (!idToken) {
            return res.status(400).json({
                success: false,
                message: 'ID token is required'
            });
        }

        // Verify the Google ID token
        const payload = await verifyGoogleToken(idToken);
        const googleId = payload['sub'];
        const email = payload['email'];
        const name = payload['name'];
        const picture = payload['picture'];
        const emailVerified = payload['email_verified'];

        // Check if user already exists
        const existingUser = await User.findOne({ googleId });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: 'Account already exists. Please use the sign-in option.'
            });
        }

        // Create new user
        const newUser = new User({
            googleId,
            email,
            name,
            picture,
            emailVerified,
            loginCount: 1,
            lastLogin: new Date()
        });

        await newUser.save();

        // Generate JWT Access Token (4 hours)
        const accessToken = generateJWT(newUser);

        // Set HttpOnly cookie
        res.cookie('token', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 4 * 60 * 60 * 1000,
            sameSite: 'strict'
        });

        console.log('✅ New user registered:', email);
        
        // Log Login Asynchronously Without Blocking
        recordLoginLog(req, newUser._id, 'google');

        res.status(201).json({
            success: true,
            message: 'Account created successfully',
            token: accessToken,
            user: {
                id: newUser._id,
                googleId: newUser.googleId,
                email: newUser.email,
                name: newUser.name,
                picture: newUser.picture,
                emailVerified: newUser.emailVerified,
                subscription: newUser.subscription,
                enrolledCourses: newUser.enrolledCourses,
                preferences: newUser.preferences,
                lastLogin: newUser.lastLogin,
                createdAt: newUser.createdAt
            }
        });

    } catch (error) {
        console.error('Google Signup Error:', error);

        if (error.message && error.message.includes('Token used too late')) {
            return res.status(401).json({
                success: false,
                message: 'Token expired. Please try again.'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Registration failed. Please try again.'
        });
    }
};

/**
 * Google OAuth Signin (Login)
 * Only allows login if user exists in database
 */
export const googleSignin = async (req, res) => {
    try {
        const { idToken } = req.body;

        if (!idToken) {
            return res.status(400).json({
                success: false,
                message: 'ID token is required'
            });
        }

        // Verify the Google ID token
        const payload = await verifyGoogleToken(idToken);
        const googleId = payload['sub'];
        const email = payload['email'];
        const name = payload['name'];
        const picture = payload['picture'];
        const emailVerified = payload['email_verified'];

        // Check if user exists
        const user = await User.findOne({ googleId });

        // CRUCIAL LOGIC: If user NOT found, return 401 Unauthorized
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Update user information and last login
        user.email = email;
        user.name = name;
        user.picture = picture;
        user.emailVerified = emailVerified;
        await user.updateLastLogin();

        // Generate JWT Access Token (4 hours)
        const accessToken = generateJWT(user);

        // Set HttpOnly cookie
        res.cookie('token', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 4 * 60 * 60 * 1000,
            sameSite: 'strict'
        });

        console.log('✅ User signed in:', email);

        recordLoginLog(req, user._id, 'google');

        res.json({
            success: true,
            message: 'Login successful',
            token: accessToken,
            user: {
                id: user._id,
                googleId: user.googleId,
                email: user.email,
                name: user.name,
                picture: user.picture,
                emailVerified: user.emailVerified,
                subscription: user.subscription,
                enrolledCourses: user.enrolledCourses,
                preferences: user.preferences,
                lastLogin: user.lastLogin,
                createdAt: user.createdAt
            }
        });

    } catch (error) {
        console.error('Google Signin Error:', error);

        if (error.message && error.message.includes('Token used too late')) {
            return res.status(401).json({
                success: false,
                message: 'Token expired. Please try again.'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Login failed. Please try again.'
        });
    }
};

/**
 * Legacy endpoint - kept for backward compatibility
 * Combines signup and signin logic
 */
export const googleAuth = async (req, res) => {
    try {
        const { idToken } = req.body;

        if (!idToken) {
            return res.status(400).json({
                success: false,
                message: 'ID token is required'
            });
        }

        // Verify the Google ID token
        const payload = await verifyGoogleToken(idToken);
        const googleId = payload['sub'];
        const email = payload['email'];
        const name = payload['name'];
        const picture = payload['picture'];
        const emailVerified = payload['email_verified'];

        // Check if user exists
        let user = await User.findOne({ googleId });
        let isNewUser = false;

        if (user) {
            // Update existing user
            user.email = email;
            user.name = name;
            user.picture = picture;
            user.emailVerified = emailVerified;
            await user.updateLastLogin();
        } else {
            // Create new user
            isNewUser = true;
            user = new User({
                googleId,
                email,
                name,
                picture,
                emailVerified,
                loginCount: 1,
                lastLogin: new Date()
            });
            await user.save();
        }

        // Generate JWT token for session (4 hours)
        const sessionToken = generateJWT(user);

        // Set HttpOnly cookie
        res.cookie('token', sessionToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 4 * 60 * 60 * 1000,
            sameSite: 'strict'
        });
        
        recordLoginLog(req, user._id, 'google');

        res.json({
            success: true,
            message: isNewUser ? 'Account created successfully' : 'Login successful',
            token: sessionToken,
            user: {
                id: user._id,
                googleId: user.googleId,
                email: user.email,
                name: user.name,
                picture: user.picture,
                emailVerified: user.emailVerified,
                subscription: user.subscription,
                enrolledCourses: user.enrolledCourses,
                preferences: user.preferences,
                lastLogin: user.lastLogin,
                createdAt: user.createdAt
            }
        });

    } catch (error) {
        console.error('Google Auth Error:', error);

        if (error.message && error.message.includes('Token used too late')) {
            return res.status(401).json({
                success: false,
                message: 'Token expired. Please sign in again.'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Authentication failed. Please try again.'
        });
    }
};

/**
 * Get current user profile
 */
export const getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id)
            .populate('enrolledCourses.courseId', 'title description thumbnail');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            user: user
        });

    } catch (error) {
        console.error('Get Profile Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch user profile'
        });
    }
};

/**
 * Update user profile
 */
export const updateUserProfile = async (req, res) => {
    try {
        const { firstName, lastName, preferences } = req.body;

        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Update fields
        if (firstName !== undefined) user.firstName = firstName;
        if (lastName !== undefined) user.lastName = lastName;
        if (preferences) {
            user.preferences = { ...user.preferences, ...preferences };
        }

        await user.save();

        res.json({
            success: true,
            message: 'Profile updated successfully',
            user: user
        });

    } catch (error) {
        console.error('Update Profile Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update profile'
        });
    }
};

/**
 * Email/Password Signup (Registration)
 * POST /api/users/auth/signup
 */
export const emailPasswordSignup = async (req, res) => {
    try {
        const { email, password, name, phone } = req.body;

        // Validate required fields
        if (!email || !password || !name) {
            return res.status(400).json({
                success: false,
                message: 'Email, password, and name are required'
            });
        }

        // Validate password strength (minimum 6 characters)
        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters long'
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email: email.toLowerCase() });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: 'Email already registered. Please use the sign-in option.'
            });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new user
        const newUser = new User({
            email: email.toLowerCase(),
            password: hashedPassword,
            name,
            phone: phone || '',
            emailVerified: false,
            loginCount: 1,
            lastLogin: new Date()
        });

        await newUser.save();

        // Generate JWT Access Token (4 hours)
        const accessToken = generateJWT(newUser);

        // Set HttpOnly cookie
        res.cookie('token', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 4 * 60 * 60 * 1000,
            sameSite: 'strict'
        });

        console.log('✅ New user registered with email/password:', email);
        
        recordLoginLog(req, newUser._id, 'form');

        res.status(201).json({
            success: true,
            message: 'Account created successfully',
            token: accessToken,
            user: {
                id: newUser._id,
                email: newUser.email,
                name: newUser.name,
                phone: newUser.phone,
                emailVerified: newUser.emailVerified,
                subscription: newUser.subscription,
                enrolledCourses: newUser.enrolledCourses,
                preferences: newUser.preferences,
                lastLogin: newUser.lastLogin,
                createdAt: newUser.createdAt
            }
        });

    } catch (error) {
        console.error('Email/Password Signup Error:', error);

        res.status(500).json({
            success: false,
            message: 'Registration failed. Please try again.'
        });
    }
};

/**
 * Email/Password Login
 * POST /api/users/auth/login
 */
export const emailPasswordLogin = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate required fields
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }

        // Find user by email (include password field)
        const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Check if user has a password (not OAuth-only user)
        if (!user.password) {
            return res.status(401).json({
                success: false,
                message: 'This account uses Google Sign-In. Please sign in with Google.'
            });
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Check if account is active
        if (!user.isActive) {
            return res.status(403).json({
                success: false,
                message: 'Account is inactive. Please contact support.'
            });
        }

        // Update last login
        await user.updateLastLogin();

        // Generate JWT Access Token (4 hours)
        const accessToken = generateJWT(user);

        // Set HttpOnly cookie
        res.cookie('token', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 4 * 60 * 60 * 1000,
            sameSite: 'strict'
        });

        console.log('✅ User signed in with email/password:', email);
        
        recordLoginLog(req, user._id, 'form');

        res.json({
            success: true,
            message: 'Login successful',
            token: accessToken,
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                phone: user.phone,
                emailVerified: user.emailVerified,
                subscription: user.subscription,
                enrolledCourses: user.enrolledCourses,
                preferences: user.preferences,
                lastLogin: user.lastLogin,
                createdAt: user.createdAt
            }
        });

    } catch (error) {
        console.error('Email/Password Login Error:', error);

        res.status(500).json({
            success: false,
            message: 'Login failed. Please try again.'
        });
    }
};

/**
 * Get Subscription Expiry Banner
 * GET /api/user/subscription-banner
 * Authentication: Required (authenticateUser)
 * Returns banner message if subscription expires within 15 days
 */
export const getSubscriptionBanner = async (req, res) => {
    try {
        const userId = req.user.id;

        // Find user's active subscription
        const subscription = await Subscription.findOne({
            userId: userId,
            status: 'active'
        }).sort({ currentPeriodEnd: -1 }); // Get the latest active subscription

        if (!subscription) {
            return res.json({
                success: true,
                showBanner: false,
                message: null
            });
        }

        // Check if subscription is valid
        if (!subscription.isValid()) {
            return res.json({
                success: true,
                showBanner: false,
                message: null
            });
        }

        // Calculate days until expiry
        const now = new Date();
        const expiryDate = new Date(subscription.currentPeriodEnd);
        const daysUntilExpiry = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));

        // Show banner if subscription expires within 15 days
        if (daysUntilExpiry > 0 && daysUntilExpiry <= 15) {
            const formattedDate = expiryDate.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });

            return res.json({
                success: true,
                showBanner: true,
                message: `Your subscription expires in ${daysUntilExpiry} day${daysUntilExpiry !== 1 ? 's' : ''} on ${formattedDate}. Renew now to continue your learning journey!`,
                daysUntilExpiry: daysUntilExpiry,
                expiryDate: expiryDate,
                subscriptionId: subscription._id
            });
        }

        // No banner needed
        res.json({
            success: true,
            showBanner: false,
            message: null
        });

    } catch (error) {
        console.error('Get Subscription Banner Error:', error);

        res.status(500).json({
            success: false,
            message: 'Failed to fetch subscription banner'
        });
    }
};

