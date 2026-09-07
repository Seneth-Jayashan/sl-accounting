import express from 'express';
import { protect } from '../middlewares/AuthMiddleware.js';
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
router.get('/class/:classId/summary', getClassAttendanceSummary); // Usually restrictTo('admin') in future, but based on user prompt, maybe they want it
router.get('/class/:classId/my-attendance', getMyClassAttendance);

// Single session routes
router.get('/:sessionId', getSessionAttendance);
router.delete('/:sessionId/clear', clearSessionAttendance);

export default router;
