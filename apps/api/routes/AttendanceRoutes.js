import express from 'express';
import { protect, restrictTo } from '../middlewares/AuthMiddleware.js';
import {
    markAttendanceStartController,
    markAttendanceEndController,
    getSessionAttendance,
    clearSessionAttendance,
    getClassAttendanceSummary,
    getMyClassAttendance
} from '../controllers/AttendanceController.js';

const router = express.Router();

// All attendance routes require authentication
router.use(protect);

router.post('/start', markAttendanceStartController);
router.post('/end', markAttendanceEndController);

// Class attendance routes
router.get('/class/:classId/summary', restrictTo('admin'), getClassAttendanceSummary);
router.get('/class/:classId/my-attendance', getMyClassAttendance);

// Single session routes
router.get('/:sessionId', restrictTo('admin'), getSessionAttendance);
router.delete('/:sessionId/clear', restrictTo('admin'), clearSessionAttendance);

export default router;
