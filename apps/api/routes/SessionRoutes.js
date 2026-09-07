import express from 'express';
import { protect, restrictTo } from '../middlewares/AuthMiddleware.js';
import {
    createSessionForClass,
    getSessionById,
    getSessionsByClassId,
    getAllSessions,
    updateSession,
    deleteSession,
    cancelSession
} from '../controllers/SessionController.js';

const router = express.Router();

// Apply authentication to all session routes
router.use(protect);

// ==========================================
// SPECIFIC CLASS ROUTES (Must come BEFORE /:id)
// ==========================================
// (Attendance routes moved to AttendanceRoutes.js)

// Create a session for a specific class
router.post('/class/:classId', restrictTo('admin'), createSessionForClass);

// Get sessions by class ID
router.get('/class/:classId', getSessionsByClassId);

// ==========================================
// SPECIFIC SESSION ROUTES (After /class routes)
// ==========================================
router.get('/', getAllSessions);

// (Single session attendance route moved to AttendanceRoutes.js)

// Session CRUD operations
router.get('/:id', getSessionById);

router.route('/:id')
    .put(restrictTo('admin'), updateSession)
    .delete(restrictTo('admin'), deleteSession);

router.post('/:id/cancel', restrictTo('admin'), cancelSession);

export default router;