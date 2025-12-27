import express from 'express';
import { protect, restrictTo } from '../middlewares/AuthMiddleware.js';
import {
    createSessionForClass,
    getSessionById,
    getAllSessions,
    updateSession,
    deleteSession,
    cancelSession
} from '../controllers/SessionController.js';

const router = express.Router();

// Apply authentication to all session routes
router.use(protect);

// ==========================================
// 1. READ OPERATIONS (Available to Students & Admin)
// ==========================================
router.get('/', getAllSessions);
router.get('/:id', getSessionById);

// ==========================================
// 2. WRITE OPERATIONS (Admin ONLY)
// ==========================================

// Create a session for a specific class
router.post('/class/:classId', restrictTo('admin'), createSessionForClass);

router.route('/:id')
    .put(restrictTo('admin'), updateSession)
    .delete(restrictTo('admin'), deleteSession);

router.post('/:id/cancel', restrictTo('admin'), cancelSession);

export default router;