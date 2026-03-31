import express from "express";
import {
  updateUserProfile,
  updateUserEmail,
  updateUserPassword,
  deleteUserAccount,
  getStudentDashboard,
} from "../controllers/UserController.js";

import { protect, restrictTo } from "../middlewares/AuthMiddleware.js";
import {
  updateProfileSchema,
  updateEmailSchema,
  updatePasswordSchema,
} from "../validators/UserValidator.js";
import {validate} from "../middlewares/ValidateMiddleware.js";
import createUploader from "../middlewares/UploadMiddleware.js";

const profileUploadMiddleware = createUploader(
  "images/profile",
  "profileImage"
);

const router = express.Router();

// ==========================================
// PROFILE ROUTES (Self-Management)
// ==========================================

router.put(
  "/profile",
  protect,
  profileUploadMiddleware,
  validate(updateProfileSchema),
  updateUserProfile
);

router.put(
  "/email", 
  protect, 
  validate(updateEmailSchema), 
  updateUserEmail
);

router.put(
  "/password",
  protect,
  validate(updatePasswordSchema),
  updateUserPassword
);

router.delete("/delete-account", protect, deleteUserAccount);

router.get('/student/dashboard', protect, getStudentDashboard);

export default router;