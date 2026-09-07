import express from "express";
import {
  createOrUpdateReview,
  getMyReview,
  deleteMyReview,
  getApprovedReviews,
  getAllReviews,
  updateReviewStatus,
  deleteReview,
} from "../controllers/ReviewController.js";
import { protect, restrictTo } from "../middlewares/AuthMiddleware.js";

const router = express.Router();

// Public routes
router.get("/approved", getApprovedReviews);

// Student routes
router.post("/", protect, restrictTo("student"), createOrUpdateReview);
router.get("/me", protect, restrictTo("student"), getMyReview);
router.delete("/me", protect, restrictTo("student"), deleteMyReview);

// Admin routes
router.get("/", protect, restrictTo("admin"), getAllReviews);
router.put("/:id/status", protect, restrictTo("admin"), updateReviewStatus);
router.delete("/:id", protect, restrictTo("admin"), deleteReview);

export default router;
