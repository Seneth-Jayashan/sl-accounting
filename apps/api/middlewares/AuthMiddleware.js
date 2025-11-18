import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;

/**
 * 1. Protection Middleware (Verifies JWT)
 * This is the base function used to ensure the user is logged in.
 */
export const protect = async (req, res, next) => {
    let token;

    // 1. Check for token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Get token from header
            token = req.headers.authorization.split(' ')[1];

            // 2. Verify the Access Token
            const decoded = jwt.verify(token, ACCESS_SECRET);

            // 3. Find user and attach (The role field is crucial here)
            // We use .select('+role') to ensure the role is available, even if not explicitly selected by default.
            const user = await User.findById(decoded.id).select('+role'); 

            if (!user || user.isDeleted || !user.isActive) {
                return res.status(401).json({
                    success: false,
                    message: 'User not found, inactive, or token invalid'
                });
            }

            // 4. Attach user object to the request
            // req.user will contain the role (admin or student)
            req.user = user;
            next();

        } catch (error) {
            console.error('JWT Verification Error:', error.message);
            // Catches expired tokens, invalid signatures, etc.
            return res.status(401).json({
                success: false,
                message: 'Not authorized, token failed or expired'
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


export const restrictTo = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Forbidden: You do not have permission to perform this action'
            });
        }
        next();
    };
};