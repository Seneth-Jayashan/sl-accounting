import express from "express";
import { 
    getStudentDashboardResults, 
    getDetailedResult 
} from "../controllers/QuizResultController.js";
import { protect } from "../middlewares/AuthMiddleware.js";

const router = express.Router();

// ==========================================
// STUDENT RESULT ROUTES
// ==========================================

/**
 * @route   GET /api/results/my-results
 * @desc    Get a list of all quizzes a student has completed (History)
 * @access  Private (Student)
 */
router.get(
    "/my-results", 
    protect, 
    getStudentDashboardResults
);

/**
 * @route   GET /api/results/:submissionId
 * @desc    Get detailed breakdown of a specific attempt (Review Paper)
 * @access  Private (Student)
 */
router.get(
    "/:submissionId", 
    protect, 
    getDetailedResult
);

export default router;