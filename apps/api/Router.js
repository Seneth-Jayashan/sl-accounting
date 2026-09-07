import express from 'express';

// Import Route Handlers
import authRoutes from './routes/AuthRoutes.js';
import userRoutes from './routes/UserRoutes.js';
import adminRoutes from './routes/AdminRoutes.js';
import classRoutes from './routes/ClassRoutes.js';
import classChatRoutes from './routes/ClassChatRoutes.js';
import batchRoutes from './routes/BatchRoutes.js';
import sessionRoutes from './routes/SessionRoutes.js';
import enrollmentRoutes from './routes/EnrollmentRoutes.js';
import announcementRoutes from './routes/AnnouncementRoutes.js';
import MaterialRoutes from './routes/MaterialRoutes.js';
import QuizRoutes from './routes/QuizRoutes.js';
import QuizSubmissionRoutes from './routes/QuizSubmissionRoutes.js';
import QuizResultRoutes from './routes/QuizResultRoutes.js';
import paymentRoutes from './routes/PaymentRoutes.js';
import knowledgeRoutes from './routes/KnowledgeRoutes.js';
import zoomRoutes from './routes/ZoomRoutes.js';
import chatRoutes from './routes/ChatRoutes.js';
import ticketRoutes from './routes/TicketRoutes.js';
import contactRoutes from './routes/ContactRoutes.js';
import tuteDeliveryRoutes from './routes/TuteDeliveryRoutes.js';
import lessonPackRoutes from './routes/LessonPackRoutes.js';
import videoProgressRoutes from './routes/VideoProgressRoutes.js';
import paperSubmissionRoutes from './routes/PaperSubmissionRoutes.js';
import settingRoutes from './routes/SettingRoutes.js';
import newsRoutes from './routes/NewsRoutes.js';
import reviewRoutes from './routes/ReviewRoutes.js';
import attendanceRoutes from './routes/AttendanceRoutes.js';
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
router.use('/announcements', announcementRoutes);
router.use('/materials', MaterialRoutes);
router.use('/class-chats', classChatRoutes);
router.use('/quizzes', QuizRoutes);
router.use('/submissions', QuizSubmissionRoutes);
router.use('/results', QuizResultRoutes);
router.use('/lesson-packs', lessonPackRoutes);
router.use('/video-progress', videoProgressRoutes);
router.use('/paper-submissions', paperSubmissionRoutes);

// 3. Finance
router.use('/payments', paymentRoutes);
router.use('/tute-delivery', tuteDeliveryRoutes);

// 4. Integrations & Tools
router.use('/zoom', zoomRoutes);
router.use('/chats', chatRoutes);
router.use('/tickets', ticketRoutes);
router.use('/contact', contactRoutes);

// Knowledge base routes
router.use('/knowledge', knowledgeRoutes);

// Settings
router.use('/settings', settingRoutes);

// News and Updates
router.use('/news', newsRoutes);

// Reviews
router.use('/reviews', reviewRoutes);

// Attendance
router.use('/attendance', attendanceRoutes);

export default router;