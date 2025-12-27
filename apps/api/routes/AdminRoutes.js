import express from "express";
import {
  // 1. Dashboard
  getDashboardSummary,

  // 2. User Management (CRUD)
  getAllUsers,
  getUserById,
  createUser,

  // 3. Profile Management
  updateUserProfile,
  updateUserEmail,
  updateUserPassword,

  // 4. Status Management
  lockUserAccount,
  unlockUserAccount,
  activateUserAccount,
  deactivateUserAccount,

  // 5. Deletion & Restoration
  deleteUserAccount,
  restoreUserAccount,
} from "../controllers/AdminController.js";

import { protect, restrictTo } from "../middlewares/AuthMiddleware.js";
import {
  validate,
  createUserSchema, // Ensure this exists in your validator file
  updateProfileSchema,
  updateEmailSchema,
  updatePasswordSchema,
} from "../validators/AdminValidator.js";

import createUploader from "../middlewares/UploadMiddleware.js";

const router = express.Router();

// =================================================================
// CONFIGURATION
// =================================================================

// 1. Profile Image Uploader
// Saves files to 'uploads/images/profile' and expects field name 'profileImage'
const profileUploadMiddleware = createUploader("images/profile", "profileImage");

// 2. Global Guard (Admin Only)
// All routes defined below this line require authentication and 'admin' role
router.use(protect);
router.use(restrictTo("admin"));


// =================================================================
// 1. DASHBOARD ROUTES
// =================================================================
router.get("/dashboard/summary", getDashboardSummary);


// =================================================================
// 2. USER MANAGEMENT (CRUD)
// =================================================================

// Get all users (with pagination & search)
router.get("/users", getAllUsers);

// Create a new user manually
router.post("/users", validate(createUserSchema), createUser);

// Get a specific user by ID
router.get("/users/:id", getUserById);


// =================================================================
// 3. PROFILE MANAGEMENT ROUTES
// =================================================================

// Update Profile Info (Name, Phone, Address, Profile Pic)
router.put(
  "/users/:id/profile",
  profileUploadMiddleware,
  validate(updateProfileSchema),
  updateUserProfile
);

// Update Email
router.put(
  "/users/:id/email",
  validate(updateEmailSchema),
  updateUserEmail
);

// Update Password
router.put(
  "/users/:id/password",
  validate(updatePasswordSchema),
  updateUserPassword
);


// =================================================================
// 4. ACCOUNT STATUS ROUTES
// =================================================================

// Lock/Unlock (Prevent Login)
router.patch("/users/:id/lock", lockUserAccount);
router.patch("/users/:id/unlock", unlockUserAccount);

// Activate/Deactivate (Soft Disable)
router.patch("/users/:id/activate", activateUserAccount);
router.patch("/users/:id/deactivate", deactivateUserAccount);


// =================================================================
// 5. DELETION & RESTORATION ROUTES
// =================================================================

// Soft Delete (isDeleted = true)
router.delete("/users/:id", deleteUserAccount);

// Restore (isDeleted = false)
router.patch("/users/:id/restore", restoreUserAccount);

export default router;