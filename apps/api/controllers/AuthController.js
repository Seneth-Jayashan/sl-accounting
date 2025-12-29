import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { registerSchema } from "../validators/AuthValidator.js";
import Batch from "../models/Batch.js";
import { sendVerificationEmail , sendWelcomeEmail } from "../utils/email/Template.js";
import { sendVerificationSms, sendWelcomeSms } from "../utils/sms/Template.js";

// --- CONFIGURATION ---

const generateTokens = (userId) => {
  const accessToken = jwt.sign({ id: userId }, process.env.JWT_ACCESS_SECRET, { expiresIn: "15m" });
  const refreshToken = jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, { expiresIn: "7d" });
  return { accessToken, refreshToken };
};

const cookieOptions = {
  httpOnly: true, 
  secure: process.env.NODE_ENV === "production", // HTTPS only in prod
  sameSite: "strict", 
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
};

// ==========================================
// 1. CORE AUTHENTICATION
// ==========================================

export const register = async (req, res) => {
  try {
    // 1. Validate Input (Zod)
    const validatedData = registerSchema.parse({ body: req.body }).body;
    const normalizedEmail = validatedData.email.toLowerCase();

    // 2. Check Duplicates (Parallel)
    const [emailExists, phoneExists] = await Promise.all([
        User.findOne({ email: normalizedEmail }),
        User.findOne({ phoneNumber: validatedData.phoneNumber })
    ]);

    if (emailExists) return res.status(409).json({ success: false, message: "Email already taken" });
    if (phoneExists) return res.status(409).json({ success: false, message: "Phone already taken" });

    // 3. Handle File Upload
    const profileImagePath = req.file 
        ? req.file.path.replace(/\\/g, "/") 
        : null;

    // 4. Create User (Unverified)
    const newUser = new User({
      ...validatedData,
      email: normalizedEmail,
      profileImage: profileImagePath, 
      role: "student",
      isVerified: false
    });

    // 5. Generate OTP & Save
    const otpCode = newUser.generateOtpCode();
    await newUser.save();

    const BatchEnroll = await Batch.findById(batch);
    BatchEnroll.students.push(studentId);
    await BatchEnroll.save();

    // 6. Send Email (Non-blocking usually, but await here for simplicity)
    try {
        await sendVerificationEmail(newUser.email, otpCode) && await sendVerificationSms(newUser.phoneNumber, otpCode);
    } catch (emailErr) {
        console.error("Failed to send verification email:", emailErr);
    }

    return res.status(201).json({
      success: true,
      message: "Registration successful. Please verify your email."
    });

  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ success: false, message: "Validation Error", errors: error.errors });
    }
    console.error("Register Error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Find User (Include security fields)
    const user = await User.findOne({ email: email.toLowerCase() })
        .select("+password +loginAttempts +isLocked +isDeleted +isActive +isVerified");
    
    // Security: Generic error to prevent enumeration, unless locked
    if (!user) return res.status(401).json({ success: false, message: "Invalid credentials" });

    // 2. Check Status
    if (user.isDeleted || !user.isActive) {
        return res.status(403).json({ success: false, message: "Account is disabled. Contact support." });
    }

    if (user.isLocked) {
      return res.status(403).json({ success: false, message: "Account is locked. Contact support." });
    }

    if (!user.isVerified) {
        return res.status(403).json({ success: false, message: "Please verify your email before logging in." });
    }

    // 3. Verify Password
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
        // Increment Login Attempts
        user.loginAttempts += 1;
        if (user.loginAttempts >= 5) {
          user.isLocked = true;
        }
        await user.save();
        return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    // 4. Successful Login Reset
    user.loginAttempts = 0;
    user.isLocked = false;
    user.lastLogin = Date.now();
    
    // 5. Token Generation
    const { accessToken, refreshToken } = generateTokens(user._id);

    // Add new refresh token (Keep max 5 devices)
    user.refreshTokens.push({ token: refreshToken });
    if(user.refreshTokens.length > 5) user.refreshTokens.shift(); 
    await user.save();

    // 6. Send Response
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
        profileImage: user.profileImage
      }
    });

  } catch (error) {
    console.error("Login Error:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const refresh = async (req, res) => {
  const incomingRefreshToken = req.cookies.refreshToken;

  if (!incomingRefreshToken) return res.status(401).json({ message: "No token provided" });

  try {
    const decoded = jwt.verify(incomingRefreshToken, process.env.JWT_REFRESH_SECRET);
    
    const user = await User.findById(decoded.id).select('+refreshTokens');
    if (!user) return res.status(401).json({ message: "User not found" });

    // Reuse Detection
    const tokenExists = user.refreshTokens.find(t => t.token === incomingRefreshToken);

    if (!tokenExists) {
      console.log("Security: Token reuse detected for user:", user._id);
      await User.updateOne({ _id: user._id }, { $set: { refreshTokens: [] } });
      return res.status(403).json({ message: "Session expired. Please login again." });
    }

    // Generate New Tokens
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user._id);
    
    // Atomic Swap (Race-condition safe)
    // 
    const updateResult = await User.findOneAndUpdate(
      { _id: user._id, "refreshTokens.token": incomingRefreshToken },
      { $set: { "refreshTokens.$": { token: newRefreshToken } } },
      { new: true } 
    );

    // If updateResult is null, the token was rotated by a parallel request.
    // We return the generated access token (valid for 15m) but the client 
    // won't have the new refresh token cookie. This is acceptable fallback behavior.
    
    res.cookie("refreshToken", newRefreshToken, cookieOptions);
    
    return res.status(200).json({ success: true, accessToken });

  } catch (err) {
    return res.status(403).json({ message: "Invalid token" });
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
    } catch (err) {
      // Ignore invalid tokens during logout
    } finally {
      res.clearCookie("refreshToken", cookieOptions);
      return res.status(204).end();
    }
};

export const me = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ success: false, message: "User not found" });
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
    
    const user = await User.findOne({ email: email.toLowerCase(), isDeleted: false })
      .select('+otp +otpExpiresAt +otpAttempts +isVerified');

    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    // Verify OTP Logic (Expiry + Max Attempts)
    const otpResult = await user.verifyOtpCode(otpCode); 
    
    if (!otpResult.ok) {
      return res.status(400).json({ 
        success: false, 
        message: otpResult.reason === "expired" ? "OTP has expired" : "Invalid OTP code" 
      });
    }

    // Mark Verified
    user.isVerified = true;
    user.otp = undefined;
    user.otpExpiresAt = undefined;
    user.otpAttempts = 0;
    
    await user.save();
    await sendWelcomeEmail(user.email, user.firstName) && await sendWelcomeSms(user.phoneNumber, user.firstName);
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
    
    // Security: Prevent Email Enumeration (Return success even if not found)
    if (!user) {
        return res.status(200).json({ success: true, message: "If account exists, OTP sent." });
    }

    if (user.isVerified) {
        return res.status(400).json({ success: false, message: "Account already verified." });
    }

    const otpCode = user.generateOtpCode();
    await user.save();
    
    await sendVerificationEmail(user.email, otpCode) && await sendVerificationSms(user.phoneNumber, otpCode);
    
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

    // Security: Prevent Email Enumeration
    if (!user) {
      return res.status(200).json({ success: true, message: "If account exists, reset code sent." });
    }

    // Generate specific reset OTP (distinct from verification OTP)
    // Using a simple 6-digit generator or reusing a helper
    const resetOtp = Math.floor(100000 + Math.random() * 900000).toString();

    user.resetPasswordToken = resetOtp;
    user.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // 10 Minutes

    await user.save();

    await sendVerificationEmail(user.email, resetOtp) && await sendVerificationSms(user.phoneNumber, resetOtp);

    return res.status(200).json({ success: true, message: "If account exists, reset code sent." });
  } catch (error) {
    console.error("Forget User Password Error:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const resetUserPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    const user = await User.findOne({ email: email.toLowerCase(), isDeleted: false })
      .select('+resetPasswordToken +resetPasswordExpires');

    if (!user) return res.status(400).json({ success: false, message: "Invalid request" });

    // Check Token Existence
    if (!user.resetPasswordToken || !user.resetPasswordExpires) {
      return res.status(400).json({ success: false, message: "No password reset requested" });
    }

    // Validate Match
    if (user.resetPasswordToken !== otp) {
      return res.status(400).json({ success: false, message: "Invalid reset code" });
    }

    // Validate Expiry
    if (user.resetPasswordExpires < Date.now()) {
      return res.status(400).json({ success: false, message: "Reset code has expired" });
    }

    // Reset Password
    user.password = newPassword; // Hashed by Mongoose pre-save
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    return res.status(200).json({ success: true, message: "Password reset successfully" });
  } catch (error) {
    console.error("Reset User Password Error:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};