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

// --- Routes ---

router.get("/", protect, restrictTo("admin"), getAllEnrollments);
router.get("/my-enrollments", protect, getMyEnrollments);
// 1. Create Enrollment
// POST /api/v1/enrollments
// Access: Authenticated Users (Students enrolling themselves)
router.post("/", protect, createEnrollment);

// 2. Get Single Enrollment
// GET /api/v1/enrollments/:id
// Access: Authenticated Users (Own enrollment or Admin)
router.get("/:id", protect, getEnrollmentById);

// 3. Update Enrollment (e.g., Mark Paid)
// PUT /api/v1/enrollments/:id
// Access: Admin Only (Students shouldn't mark their own payments as paid)
router.put("/:id", protect, restrictTo("admin"), updateEnrollment);

// 4. Delete Enrollment
// DELETE /api/v1/enrollments/:id
// Access: Admin Only
router.delete("/:id", protect, restrictTo("admin"), deleteEnrollment);

router.get("/check/status", protect, checkEnrollment);

export default router;