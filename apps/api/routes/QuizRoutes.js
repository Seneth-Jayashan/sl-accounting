import express from "express";
import {
    createQuiz,
    getAllQuizzes,
    getQuizById,
    updateQuiz,
    deleteQuiz,
    togglePublish,
    toggleActive,
    getQuizzesByClass
} from "../controllers/QuizController.js";


import { protect, restrictTo } from "../middlewares/AuthMiddleware.js";
import {
    createQuizSchema,
    updateQuizSchema,
    submitQuizSchema
} from "../validators/QuizValidator.js";
import {validate} from "../middlewares/ValidateMiddleware.js";

const router = express.Router();

// ==========================================
// ADMIN / TEACHER ROUTES (Management)
// ==========================================

// Create a new Quiz
router.post(
    "/",
    protect,
    restrictTo("admin", "teacher"),
    validate(createQuizSchema),
    createQuiz
);

// Get all quizzes (Management view)
router.get(
    "/all",
    protect,
    restrictTo("admin", "teacher"),
    getAllQuizzes
);

// Update Quiz details
router.put(
    "/:id",
    protect,
    restrictTo("admin", "teacher"),
    validate(updateQuizSchema),
    updateQuiz
);

// Soft Delete Quiz
router.delete(
    "/:id",
    protect,
    restrictTo("admin", "teacher"),
    deleteQuiz
);

// Status Toggles
router.patch("/:id/publish", protect, restrictTo("admin", "teacher"), togglePublish);
router.patch("/:id/active", protect, restrictTo("admin", "teacher"), toggleActive);


// ==========================================
// STUDENT ROUTES (Participation & Results)
// ==========================================

// Get Quizzes available for a specific class
router.get("/class/:classId", protect, getQuizzesByClass);

// Get Quiz details (to show "Start Quiz" screen)
router.get("/:id", protect, getQuizById);


export default router;