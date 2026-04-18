import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import Admin from '../models/Admin.js';

dotenv.config();

export const authenticateAdmin = (req, res, next) => {
    try {
        let token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token && req.cookies && req.cookies.token) {
            token = req.cookies.token;
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Access denied. No token provided.'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (decoded.role !== 'admin' && decoded.role !== 'super_admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin privileges required.'
            });
        }

        req.admin = decoded;
        next();
    } catch (error) {
        res.status(401).json({
            success: false,
            message: 'Invalid or expired token.'
        });
    }
};

// Admin login endpoint helper - now uses MongoDB
export const adminLogin = async (email, password) => {
    try {
        // Find admin by email
        const admin = await Admin.findOne({ email: email.toLowerCase() });

        if (!admin) {
            return { success: false, message: 'Invalid credentials' };
        }

        // Check if admin is active
        if (!admin.isActive) {
            return { success: false, message: 'Account is deactivated' };
        }

        // Compare password
        const isPasswordValid = await admin.comparePassword(password);

        if (!isPasswordValid) {
            return { success: false, message: 'Invalid credentials' };
        }

        // Update last login
        admin.lastLogin = new Date();
        await admin.save();

        // Generate JWT token
        const token = jwt.sign(
            {
                id: admin._id,
                email: admin.email,
                role: admin.role,
                name: admin.name
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        return {
            success: true,
            token,
            admin: {
                id: admin._id,
                email: admin.email,
                name: admin.name,
                role: admin.role
            }
        };
    } catch (error) {
        console.error('Login error:', error);
        return { success: false, message: 'Login failed. Please try again.' };
    }
};
