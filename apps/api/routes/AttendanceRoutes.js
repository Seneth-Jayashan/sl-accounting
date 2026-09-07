import express from 'express';
import { protect } from '../middlewares/AuthMiddleware.js';
import {
    markAttendanceStartController,
    markAttendanceEndController,
    getSessionAttendance,
    clearSessionAttendance
} from '../controllers/AttendanceController.js';

const router = express.Router();

// All attendance routes require authentication
router.use(protect);

router.post('/start', markAttendanceStartController);
router.post('/end', markAttendanceEndController);
router.get('/:sessionId', getSessionAttendance);
router.delete('/:sessionId/clear', clearSessionAttendance);

export default router;
