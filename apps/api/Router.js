import express from 'express';
import authRoutes from './routes/AuthRoutes.js';
import classRoutes from './routes/ClassRoutes.js';
import userRoutes from './routes/UserRoutes.js';
import adminRoutes from './routes/AdminRoutes.js';
import contactRoutes from './routes/ContactRoutes.js';
import batchRoutes from './routes/BatchRoutes.js';
import sessionRoutes from './routes/SessionRoutes.js';


const router = express.Router();

router.get('/', (req, res) => {
    res.json({ message: 'Welcome to the LMS API v1' });
});

// Authentication routes
router.use('/auth', authRoutes);

// User routes
router.use('/users', userRoutes);

// Admin routes
router.use('/admin', adminRoutes);

// Class routes
router.use('/classes', classRoutes);

//contact routes
router.use('/contact', contactRoutes);

// Batch routes
router.use('/batches', batchRoutes);

// Session routes
router.use('/sessions', sessionRoutes);

export default router;