import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;

/**
 * Middleware to protect routes.
 * Verifies JWT Access Token and attaches user to req.user.
 */
export const protect = async (req, res, next) => {
    let token;

    // 1. Check for token in headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Get token from header
            token = req.headers.authorization.split(' ')[1];

            // 2. Verify Token
            const decoded = jwt.verify(token, ACCESS_SECRET);

            // 3. Get User from Token
            // Security: Select only fields needed for authorization.
            // Explicitly exclude password or large arrays.
            const user = await User.findById(decoded.id)
                .select('_id role isDeleted isActive isLocked batch'); 

            // 4. Check if user still exists and is active
            if (!user) {
                return res.status(401).json({ success: false, message: 'User no longer exists.' });
            }

            if (user.isDeleted) {
                return res.status(403).json({ success: false, message: 'Account has been deleted.' });
            }

            if (!user.isActive) {
                return res.status(403).json({ success: false, message: 'Account is deactivated. Please contact support.' });
            }

            if (user.isLocked) {
                return res.status(403).json({ success: false, message: 'Account is locked due to security reasons.' });
            }

            req.user = user;
            next();

        } catch (error) {
            // Specific Error Handling for better frontend debugging
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({ 
                    success: false, 
                    message: 'Session expired', 
                    code: 'TOKEN_EXPIRED' // Frontend can listen for this to trigger refresh
                });
            }
            
            console.error('JWT Verification Error:', error.message);
            return res.status(401).json({ 
                success: false, 
                message: 'Not authorized, token invalid' 
            });
        }
    }

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Not authorized, no token provided'
        });
    }
};

/**
 * Middleware to restrict access based on user roles.
 * Must be placed AFTER 'protect'.
 * Usage: restrictTo('admin', 'instructor')
 */
export const restrictTo = (...allowedRoles) => {
    return (req, res, next) => {
        // req.user is set by the 'protect' middleware
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Forbidden: You do not have permission to perform this action'
            });
        }
        next();
    };
};