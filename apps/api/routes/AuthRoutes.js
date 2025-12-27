import express from "express";
import {
  register,
  login,
  me,
  refresh,
  logout,
  verifyUserEmail,
  resendVerificationOtp,
  forgetUserPassword,
  resetUserPassword
} from "../controllers/AuthController.js";

import { protect } from "../middlewares/AuthMiddleware.js";
import createUploader from "../middlewares/UploadMiddleware.js";

// Validation Middleware & Schemas
import { validate, registerSchema, loginSchema } from "../validators/AuthValidator.js";
import { 
  verifyEmailSchema, 
  resendOtpSchema, 
  forgetPasswordSchema, 
  resetPasswordSchema 
} from "../validators/UserValidator.js"; 

const profileUploadMiddleware = createUploader('images/profile', 'profileImage');

const router = express.Router();

// ==========================================
// CORE AUTH
// ==========================================
router.post("/register", profileUploadMiddleware, validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);
router.post("/refresh", refresh);
router.post("/logout", logout); // Note: 'protect' is often optional for logout if relying on cookie clearing
router.get("/me", protect, me);

// ==========================================
// EMAIL VERIFICATION
// ==========================================
router.post("/verify-email", validate(verifyEmailSchema), verifyUserEmail);
router.post("/resend-otp", validate(resendOtpSchema), resendVerificationOtp);

// ==========================================
// PASSWORD RECOVERY
// ==========================================
router.post("/forget-password", validate(forgetPasswordSchema), forgetUserPassword);
router.post("/reset-password", validate(resetPasswordSchema), resetUserPassword);

export default router;