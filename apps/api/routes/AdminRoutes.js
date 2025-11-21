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

const profileUploadMiddleware = createUploader(
  "images/profile",
  "profileImage"
);

const router = express.Router();

router.put(
  "/users/:id/profile",
  protect,
  restrictTo("admin"),
  profileUploadMiddleware,
  validate(updateProfileSchema),
  updateUserProfile
);

router.put(
  "/users/:id/email",
  protect,
  validate(updateEmailSchema),
  restrictTo("admin"),
  updateUserEmail
);

router.put(
  "/users/:id/password",
  protect,
  restrictTo("admin"),
  validate(updatePasswordSchema),
  updateUserPassword
);

router.put("/users/:id/lock", protect, restrictTo("admin"), lockUserAccount);

router.put(
  "/users/:id/unlock",
  protect,
  restrictTo("admin"),
  unlockUserAccount
);

router.put(
  "/users/:id/activate",
  protect,
  restrictTo("admin"),
  activateUserAccount
);

router.put(
  "/users/:id/deactivate",
  protect,
  restrictTo("admin"),
  deactivateUserAccount
);

router.delete("/users/:id", protect, restrictTo("admin"), deleteUserAccount);

router.put(
  "/users/:id/restore",
  protect,
  restrictTo("admin"),
  restoreUserAccount
);

export default router;
