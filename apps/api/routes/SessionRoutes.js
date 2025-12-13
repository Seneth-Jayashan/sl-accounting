import express from 'express';
import { protect, restrictTo } from '../middlewares/AuthMiddleware.js';
import {
    createSessionForClass,
    getAllSessions,
    updateSession,
    deleteSession,
    cancelSession
} from '../controllers/SessionController.js';

const router = express.Router();

// Apply authentication to all session routes
router.use(protect);

// ---------------------------------------------------------
// 1. General Session Operations
// ---------------------------------------------------------

// GET /api/v1/sessions
// Supports query params: ?classId=...&from=...&to=...
router.get('/', getAllSessions);

// Operations on specific Session ID
router.route('/:id')
    .put(restrictTo('admin', 'instructor'), updateSession)   // Update details/zoom
    .delete(restrictTo('admin', 'instructor'), deleteSession); // Hard delete

// Special Action: Cancel Session
router.post('/:id/cancel', restrictTo('admin', 'instructor'), cancelSession);


// ---------------------------------------------------------
// 2. Creation (Class Scoped)
// ---------------------------------------------------------

// POST /api/v1/sessions/class/:classId
// Create a manual/extra session for a specific class
router.post('/class/:classId', restrictTo('admin', 'instructor'), createSessionForClass);

export default router;