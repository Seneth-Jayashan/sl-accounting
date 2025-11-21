import express from "express";
import {
  getAllUsers,
  getUserById,
  updateUserProfile,
  updateUserEmail,
  updateUserPassword,
  forgetUserPassword,
  resetUserPassword,
  verifyUserEmail,
  resendVerificationOtp,
  deleteUserAccount,
} from "../controllers/UserController.js";
import { protect, restrictTo } from "../middlewares/AuthMiddleware.js";
import {
  validate,
  updateProfileSchema,
  updateEmailSchema,
  updatePasswordSchema,
  forgetPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
  resendOtpSchema,
} from "../validators/UserValidator.js";
import createUploader from "../middlewares/UploadMiddleware.js";

const profileUploadMiddleware = createUploader(
  "images/profile",
  "profileImage"
);

const router = express.Router();

router.get("/", protect, restrictTo("admin"), getAllUsers);
router.get("/:id", protect, restrictTo("admin"), getUserById);
router.put(
  "/profile",
  protect,
  profileUploadMiddleware,
  validate(updateProfileSchema),
  updateUserProfile
);
router.put("/email", protect, validate(updateEmailSchema), updateUserEmail);
router.put(
  "/password",
  protect,
  validate(updatePasswordSchema),
  updateUserPassword
);
router.post(
  "/forget-password",
  validate(forgetPasswordSchema),
  forgetUserPassword
);
router.post(
  "/reset-password",
  validate(resetPasswordSchema),
  resetUserPassword
);
router.post("/verify-email", validate(verifyEmailSchema), verifyUserEmail);
router.post("/resend-otp", validate(resendOtpSchema), resendVerificationOtp);
router.delete("/delete-account", protect, deleteUserAccount);

export default router;
