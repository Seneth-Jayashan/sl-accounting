import express from "express";
import {
  getAllUsers,
  getUserById,
  updateUserProfile,
  updateUserEmail,
  updateUserPassword,
  deleteUserAccount,
} from "../controllers/UserController.js"; // Removed Auth controllers

import { protect, restrictTo } from "../middlewares/AuthMiddleware.js";
import {
  validate,
  updateProfileSchema,
  updateEmailSchema,
  updatePasswordSchema,
} from "../validators/UserValidator.js"; // Removed Auth validators

import createUploader from "../middlewares/UploadMiddleware.js";

const profileUploadMiddleware = createUploader(
  "images/profile",
  "profileImage"
);

const router = express.Router();

// ==========================================
// ADMIN ROUTES (Manage Users)
// ==========================================
router.get("/", protect, restrictTo("admin"), getAllUsers);
router.get("/:id", protect, restrictTo("admin"), getUserById);

// ==========================================
// PROFILE ROUTES (Self-Management)
// ==========================================

// Update Profile Info (with Image Upload)
router.put(
  "/profile",
  protect,
  profileUploadMiddleware,
  validate(updateProfileSchema),
  updateUserProfile
);

// Update Email (Triggers Re-verification)
router.put(
  "/email", 
  protect, 
  validate(updateEmailSchema), 
  updateUserEmail
);

// Update Password (Authenticated)
router.put(
  "/password",
  protect,
  validate(updatePasswordSchema),
  updateUserPassword
);

// Delete Account (Soft Delete)
router.delete("/delete-account", protect, deleteUserAccount);

export default router;