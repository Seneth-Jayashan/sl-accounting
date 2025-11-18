import express from 'express';
import authRoutes from './routes/authRoutes.js';
import classRoutes from './routes/classRoutes.js';

const router = express.Router();

// Health check and simple info routes (already in app.js, but good to keep structure)
router.get('/', (req, res) => {
    res.json({ message: 'Welcome to the LMS API v1' });
});

// Authentication routes
router.use('/auth', authRoutes);

// Class management routes
router.use('/classes', classRoutes);

export default router;