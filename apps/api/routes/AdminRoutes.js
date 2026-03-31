import express from "express";
import {
  getDashboardSummary,

  getAllUsers,
  getUserById,
  createUser,

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
  createUserSchema,
  updateProfileSchema,
  updateEmailSchema,
  updatePasswordSchema,
} from "../validators/AdminValidator.js";
import {validate} from "../middlewares/ValidateMiddleware.js";
import createUploader from "../middlewares/UploadMiddleware.js";

const router = express.Router();

// =================================================================
// CONFIGURATION
// =================================================================

const profileUploadMiddleware = createUploader("images/profile", "profileImage");

router.use(protect);
router.use(restrictTo("admin"));

router.get("/users/:id", getUserById);
// =================================================================
// 1. DASHBOARD ROUTES
// =================================================================
router.get("/dashboard/summary", getDashboardSummary);


// =================================================================
// 2. USER MANAGEMENT (CRUD)
// =================================================================

router.get("/users", getAllUsers);

router.post("/users", validate(createUserSchema), createUser);




// =================================================================
// 3. PROFILE MANAGEMENT ROUTES
// =================================================================

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


// =================================================================
// 4. ACCOUNT STATUS ROUTES
// =================================================================

router.patch("/users/:id/lock", lockUserAccount);
router.patch("/users/:id/unlock", unlockUserAccount);

router.patch("/users/:id/activate", activateUserAccount);
router.patch("/users/:id/deactivate", deactivateUserAccount);


// =================================================================
// 5. DELETION & RESTORATION ROUTES
// =================================================================

router.delete("/users/:id", deleteUserAccount);

router.patch("/users/:id/restore", restoreUserAccount);

export default router;