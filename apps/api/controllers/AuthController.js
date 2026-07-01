import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { registerSchema } from "../validators/AuthValidator.js";
import Batch from "../models/Batch.js";
import { sendVerificationEmail, sendWelcomeEmail } from "../utils/email/Template.js";
import { sendVerificationSms, sendWelcomeSms } from "../utils/sms/Template.js";

// --- CONFIGURATION ---

const generateTokens = (userId) => {
  const accessToken = jwt.sign({ id: userId }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: "15m",
  });
  const refreshToken = jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: "7d",
  });
  return { accessToken, refreshToken };
};

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  // FIX: "strict" blocks cookies on cross-port requests in development.
  // Use "lax" in dev (localhost:5173 → localhost:3000) and "strict" in prod.
  sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

// ==========================================
// 1. CORE AUTHENTICATION
// ==========================================

export const register = async (req, res) => {
  try {
    const validatedData = registerSchema.parse({ body: req.body }).body;
    const normalizedEmail = validatedData.email.toLowerCase();

    const [emailExists, phoneExists] = await Promise.all([
      User.findOne({ email: normalizedEmail }),
      User.findOne({ phoneNumber: validatedData.phoneNumber }),
    ]);

    if (emailExists)
      return res.status(409).json({ success: false, message: "Email already taken" });
    if (phoneExists)
      return res.status(409).json({ success: false, message: "Phone already taken" });

    const profileImagePath = req.file ? req.file.path.replace(/\\/g, "/") : null;

    const newUser = new User({
      ...validatedData,
      email: normalizedEmail,
      profileImage: profileImagePath,
      role: "student",
      isVerified: false,
    });

    const otpCode = newUser.generateOtpCode();
    await newUser.save();

    const { batch, _id: studentId } = newUser;
    const BatchEnroll = await Batch.findById(batch);
    BatchEnroll.students.push(studentId);
    await BatchEnroll.save();

    try {
      await Promise.allSettled([
        sendVerificationEmail(newUser.email, otpCode),
        sendVerificationSms(newUser.phoneNumber, otpCode),
      ]);
    } catch (notificationErr) {
      console.error("Failed to send notifications:", notificationErr);
    }

    return res.status(201).json({
      success: true,
      message: "Registration successful. Please verify your email.",
    });
  } catch (error) {
    if (error.name === "ZodError") {
      return res
        .status(400)
        .json({ success: false, message: "Validation Error", errors: error.errors });
    }
    console.error("Register Error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() }).select(
      "+password +loginAttempts +isLocked +isDeleted +isActive +isVerified +refreshTokens"
    );

    if (!user)
      return res.status(401).json({ success: false, message: "Invalid credentials" });

    if (user.isDeleted || !user.isActive) {
      return res
        .status(403)
        .json({ success: false, message: "Account is disabled. Contact support." });
    }

    if (user.isLocked) {
      return res
        .status(403)
        .json({
          success: false,
          message: "This account is locked by admin. Please contact admin.",
        });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        message: "Please verify your email before logging in.",
      });
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      user.loginAttempts += 1;
      if (user.loginAttempts >= 5) {
        user.isLocked = true;
      }
      await user.save();
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    // FIX: Removed the "clear all tokens if >= 2" logic for students.
    // That was the hidden bug — on login it wiped tokens, making the
    // existing refresh cookie invalid and causing a 403 on next page load.
    // The 5-token cap below is sufficient to prevent token accumulation.

    user.loginAttempts = 0;
    user.isLocked = false;
    user.lastLogin = Date.now();

    const { accessToken, refreshToken } = generateTokens(user._id);

    user.refreshTokens.push({ token: refreshToken });

    // Keep only the 5 most recent tokens (sliding window, no hard wipe)
    if (user.refreshTokens.length > 5) {
      user.refreshTokens = user.refreshTokens.slice(-5);
    }

    await user.save();

    res.cookie("refreshToken", refreshToken, cookieOptions);

    return res.status(200).json({
      success: true,
      accessToken,
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        profileImage: user.profileImage,
        isLocked: user.isLocked,
      },
    });
  } catch (error) {
    console.error("Login Error:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const refresh = async (req, res) => {
  const incomingRefreshToken = req.cookies.refreshToken;

  if (!incomingRefreshToken)
    return res.status(401).json({ message: "No token provided" });

  try {
    const decoded = jwt.verify(incomingRefreshToken, process.env.JWT_REFRESH_SECRET);

    const user = await User.findById(decoded.id).select("+refreshTokens");
    if (!user) return res.status(401).json({ message: "User not found" });

    const tokenIndex = user.refreshTokens.findIndex(
      (t) => t.token === incomingRefreshToken
    );

    if (tokenIndex === -1) {
      // Token not found in DB — possible reuse attack or token was wiped.
      // Clear all tokens to force a full re-login.
      console.warn("Security: Refresh token reuse detected for user:", user._id);
      await User.updateOne({ _id: user._id }, { $set: { refreshTokens: [] } });
      return res
        .status(403)
        .json({ message: "Session expired. Please login again." });
    }

    // FIX: Rotate the refresh token on every use.
    // Previously the refresh token was never rotated — the cookie kept the
    // same token forever, making every subsequent browser open a potential
    // race condition. Now we replace the old token with a new one atomically.
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user._id);

    // Replace old token with new token in-place (atomic DB update)
    await User.findOneAndUpdate(
      { _id: user._id, "refreshTokens.token": incomingRefreshToken },
      { $set: { "refreshTokens.$": { token: newRefreshToken } } }
    );

    // Set the new rotated refresh token as the cookie
    res.cookie("refreshToken", newRefreshToken, cookieOptions);

    return res.status(200).json({ success: true, accessToken });
  } catch (err) {
    // JWT verify threw (expired / tampered token)
    return res.status(403).json({ message: "Invalid or expired token" });
  }
};

export const logout = async (req, res) => {
  const incomingRefreshToken = req.cookies.refreshToken;

  try {
    if (incomingRefreshToken) {
      const decoded = jwt.verify(incomingRefreshToken, process.env.JWT_REFRESH_SECRET);
      await User.updateOne(
        { _id: decoded.id },
        { $pull: { refreshTokens: { token: incomingRefreshToken } } }
      );
    }
  } catch {
    // Ignore — always clear the cookie regardless
  } finally {
    res.clearCookie("refreshToken", cookieOptions);
    return res.status(204).end();
  }
};

export const me = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user)
      return res.status(404).json({ success: false, message: "User not found" });
    return res.status(200).json({ success: true, user });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// ==========================================
// 2. EMAIL VERIFICATION
// ==========================================

export const verifyUserEmail = async (req, res) => {
  try {
    const { email, otpCode } = req.body;

    const user = await User.findOne({ email: email.toLowerCase(), isDeleted: false }).select(
      "+otp +otpExpiresAt +otpAttempts +isVerified"
    );

    if (!user)
      return res.status(404).json({ success: false, message: "User not found" });

    const otpResult = await user.verifyOtpCode(otpCode);

    if (!otpResult.ok) {
      return res.status(400).json({
        success: false,
        message: otpResult.reason === "expired" ? "OTP has expired" : "Invalid OTP code",
      });
    }

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpiresAt = undefined;
    user.otpAttempts = 0;

    await user.save();

    try {
      await Promise.allSettled([
        sendWelcomeEmail(user.email, user.firstName),
        sendWelcomeSms(user.phoneNumber, user.firstName),
      ]);
    } catch (notificationErr) {
      console.error("Failed to send notifications:", notificationErr);
    }

    return res.status(200).json({ success: true, message: "Email verified successfully" });
  } catch (error) {
    console.error("Verify User Email Error:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const resendVerificationOtp = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email.toLowerCase(), isDeleted: false });

    if (!user) {
      return res.status(200).json({ success: true, message: "If account exists, OTP sent." });
    }

    if (user.isVerified) {
      return res
        .status(400)
        .json({ success: false, message: "Account already verified." });
    }

    const otpCode = user.generateOtpCode();
    await user.save();

    try {
      await Promise.allSettled([
        sendVerificationEmail(user.email, otpCode),
        sendVerificationSms(user.phoneNumber, otpCode),
      ]);
    } catch (notificationErr) {
      console.error("Failed to send notifications:", notificationErr);
    }

    return res.status(200).json({ success: true, message: "OTP code resent to email" });
  } catch (error) {
    console.error("Resend Verification OTP Error:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// ==========================================
// 3. PASSWORD RECOVERY
// ==========================================

export const forgetUserPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email.toLowerCase(), isDeleted: false });

    if (!user) {
      return res
        .status(200)
        .json({ success: true, message: "If account exists, reset code sent." });
    }

    const resetOtp = Math.floor(100000 + Math.random() * 900000).toString();

    user.resetPasswordToken = resetOtp;
    user.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

    await user.save();

    try {
      await Promise.allSettled([
        sendVerificationEmail(user.email, resetOtp),
        sendVerificationSms(user.phoneNumber, resetOtp),
      ]);
    } catch (notificationErr) {
      console.error("Failed to send notifications:", notificationErr);
    }

    return res
      .status(200)
      .json({ success: true, message: "If account exists, reset code sent." });
  } catch (error) {
    console.error("Forget User Password Error:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const resetUserPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    const user = await User.findOne({
      email: email.toLowerCase(),
      isDeleted: false,
    }).select("+resetPasswordToken +resetPasswordExpires");

    if (!user)
      return res.status(400).json({ success: false, message: "Invalid request" });

    if (!user.resetPasswordToken || !user.resetPasswordExpires) {
      return res
        .status(400)
        .json({ success: false, message: "No password reset requested" });
    }

    if (user.resetPasswordToken !== otp) {
      return res.status(400).json({ success: false, message: "Invalid reset code" });
    }

    if (user.resetPasswordExpires < Date.now()) {
      return res.status(400).json({ success: false, message: "Reset code has expired" });
    }

    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    return res
      .status(200)
      .json({ success: true, message: "Password reset successfully" });
  } catch (error) {
    console.error("Reset User Password Error:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};