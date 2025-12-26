import express from 'express';

// Import Route Handlers
import authRoutes from './routes/AuthRoutes.js';
import userRoutes from './routes/UserRoutes.js';
import adminRoutes from './routes/AdminRoutes.js';
import classRoutes from './routes/ClassRoutes.js';
import batchRoutes from './routes/BatchRoutes.js';
import sessionRoutes from './routes/SessionRoutes.js';
import enrollmentRoutes from './routes/EnrollmentRoutes.js';
import paymentRoutes from './routes/PaymentRoutes.js';
import zoomRoutes from './routes/ZoomRoutes.js';
import chatRoutes from './routes/ChatRoutes.js';
import ticketRoutes from './routes/TicketRoutes.js';
import contactRoutes from './routes/ContactRoutes.js';

const router = express.Router();

// Health Check
router.get('/', (req, res) => {
    res.json({ 
        message: 'LMS API v1 is active', 
        timestamp: new Date().toISOString() 
    });
});

// --- ROUTE MOUNTING ---

// 1. Core System
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/admin', adminRoutes);

// 2. Academic Management
router.use('/classes', classRoutes);
router.use('/batches', batchRoutes);
router.use('/sessions', sessionRoutes);
router.use('/enrollments', enrollmentRoutes);

// 3. Finance
router.use('/payments', paymentRoutes);

// 4. Integrations & Tools
router.use('/zoom', zoomRoutes);
router.use('/chats', chatRoutes);
router.use('/tickets', ticketRoutes);
router.use('/contact', contactRoutes);

export default router;