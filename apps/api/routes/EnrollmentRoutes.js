import express from "express";
import {
  createEnrollment,
  getEnrollmentById,
  updateEnrollment,
  deleteEnrollment,
  checkEnrollment,
  getAllEnrollments,
  getMyEnrollments
} from "../controllers/EnrollmentController.js";
import { protect, restrictTo } from "../middlewares/AuthMiddleware.js";

const router = express.Router();

// Apply authentication to all routes
router.use(protect);

// ==========================================
// 1. STATIC ROUTES (Must come before /:id)
// ==========================================

// Check if current user is enrolled in a specific class
// GET /api/v1/enrollments/check/status?classId=...
router.get("/check/status", checkEnrollment);

// Get logged-in user's history
// GET /api/v1/enrollments/my-enrollments
router.get("/my-enrollments", getMyEnrollments);

// Get All Enrollments (Admin Only)
router.get("/", restrictTo("admin"), getAllEnrollments);


// ==========================================
// 2. DYNAMIC ROUTES
// ==========================================

// Create Enrollment
// POST /api/v1/enrollments
// (Students enroll themselves; Admins can enroll others)
router.post("/", createEnrollment);

// Get Single Enrollment (IDOR Protected)
router.get("/:id", getEnrollmentById);

// Update Enrollment (Admin Only)
router.put("/:id", restrictTo("admin"), updateEnrollment);

// Delete Enrollment (Admin Only)
router.delete("/:id", restrictTo("admin"), deleteEnrollment);

export default router;