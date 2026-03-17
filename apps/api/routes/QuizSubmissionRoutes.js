import express from "express";
import {
  startQuiz,
  submitQuiz,
  getSubmissionResult,
  getQuizAnalytics,
} from "../controllers/QuizSubmissionController.js";

import {
  getStudentDashboardResults,
  getDetailedResult
} from "../controllers/QuizResultController.js";

import { protect, restrictTo } from "../middlewares/AuthMiddleware.js";
import { 
  validate, 
  startQuizSchema, 
  submitQuizSchema,
  getAnalyticsSchema 
} from "../validators/QuizSubmissionValidator.js";

const router = express.Router();

// ==========================================
// STUDENT ACTIONS (Exam Flow)
// ==========================================

// 1. Initialize an attempt (Creates the 'In-Progress' record)
router.post(
  "/start",
  protect,
  validate(startQuizSchema),
  startQuiz
);

// 2. Finalize an attempt (Calculates marks and closes the session)
router.post(
  "/:id/submit",
  protect,
  validate(submitQuizSchema),
  submitQuiz
);

// 3. Get my personal results list
router.get(
  "/my-attempts",
  protect,
  getStudentDashboardResults
);

// 4. View detailed marked paper (with explanations)
router.get(
  "/review/:submissionId",
  protect,
  getDetailedResult
);


// ==========================================
// ADMIN / TEACHER ACTIONS (Analytics)
// ==========================================

// 5. Get all student submissions for a specific quiz
router.get(
  "/analytics/:quizId",
  protect,
  restrictTo("admin", "teacher"),
  validate(getAnalyticsSchema),
  getQuizAnalytics
);

// 6. View a specific student's paper (for manual marking/review)
router.get(
  "/admin/view/:id",
  protect,
  restrictTo("admin", "teacher"),
  getSubmissionResult
);

export default router;