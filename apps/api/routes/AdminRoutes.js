import express from "express";
import {
  getDashboardSummary, // <--- Import the new function
  updateUserProfile,
  updateUserEmail,
  updateUserPassword,
  lockUserAccount,
  unlockUserAccount,
  activateUserAccount,
  deactivateUserAccount,
  deleteUserAccount,
  restoreUserAccount,
} from "../controllers/AdminController.js";

import { protect, restrictTo } from "../middlewares/AuthMiddleware.js";
import {
  validate,
  updateProfileSchema,
  updateEmailSchema,
  updatePasswordSchema,
} from "../validators/AdminValidator.js";

import createUploader from "../middlewares/UploadMiddleware.js";

const profileUploadMiddleware = createUploader("images/profile", "profileImage");

const router = express.Router();

// Apply Global Admin Protection
router.use(protect);
router.use(restrictTo("admin"));

// ==========================================
// 1. DASHBOARD
// ==========================================
router.get("/dashboard/summary", getDashboardSummary); // <--- NEW ROUTE


// ==========================================
// 2. USER MANAGEMENT
// ==========================================

router.put(
  "/users/:id/profile",
  profileUploadMiddleware,
  validate(updateProfileSchema),
  updateUserProfile
);

router.put(
  "/users/:id/email",
  validate(updateEmailSchema),
  updateUserEmail
);

router.put(
  "/users/:id/password",
  validate(updatePasswordSchema),
  updateUserPassword
);

// --- STATUS MANAGEMENT ---

router.patch("/users/:id/lock", lockUserAccount); // Changed to PATCH (best practice)
router.patch("/users/:id/unlock", unlockUserAccount);
router.patch("/users/:id/activate", activateUserAccount);
router.patch("/users/:id/deactivate", deactivateUserAccount);

// --- DELETION ---

router.delete("/users/:id", deleteUserAccount);
router.patch("/users/:id/restore", restoreUserAccount);

export default router;