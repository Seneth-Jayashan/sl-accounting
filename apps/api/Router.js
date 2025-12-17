import express from 'express';
import authRoutes from './routes/AuthRoutes.js';
import classRoutes from './routes/ClassRoutes.js';
import userRoutes from './routes/UserRoutes.js';
import adminRoutes from './routes/AdminRoutes.js';
import contactRoutes from './routes/ContactRoutes.js';
import ticketRoutes from './routes/TicketRoutes.js';
import chatRoutes from './routes/ChatRoutes.js';
import batchRoutes from './routes/BatchRoutes.js';
import sessionRoutes from './routes/SessionRoutes.js';
import enrollmentRoutes from './routes/EnrollmentRoutes.js';
import paymentRoutes from './routes/PaymentRoutes.js';
import knowledgeRoutes from './routes/KnowledgeRoutes.js';

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

// Ticket routes
router.use('/tickets', ticketRoutes);

// Chat routes
router.use('/chats', chatRoutes);
// Batch routes
router.use('/batches', batchRoutes);

// Session routes
router.use('/sessions', sessionRoutes);

// Enrollment routes
router.use('/enrollments', enrollmentRoutes);

// Payment routes
router.use('/payments', paymentRoutes); 

// Knowledge base routes
router.use('/knowledge', knowledgeRoutes);

export default router;