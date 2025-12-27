import express from "express";
import {
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

// Apply Global Admin Protection to all routes in this file
// This prevents repeating protect/restrictTo on every line
router.use(protect);
router.use(restrictTo("admin"));

// --- USER MANAGEMENT ---

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

router.put("/users/:id/lock", lockUserAccount);
router.put("/users/:id/unlock", unlockUserAccount);
router.put("/users/:id/activate", activateUserAccount);
router.put("/users/:id/deactivate", deactivateUserAccount);

// --- DELETION ---

router.delete("/users/:id", deleteUserAccount);
router.put("/users/:id/restore", restoreUserAccount);

export default router;