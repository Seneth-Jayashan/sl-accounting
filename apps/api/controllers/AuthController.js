import User from "../models/User.js";
import jwt from "jsonwebtoken";
import { registerSchema } from "../validators/AuthValidator.js";
import path from 'path'; // Added for file path normalization

// Helper function to generate tokens
const generateTokens = (userId) => {
  const accessToken = jwt.sign({ id: userId }, process.env.JWT_ACCESS_SECRET, { expiresIn: "15m" });
  const refreshToken = jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, { expiresIn: "7d" });
  return { accessToken, refreshToken };
};

const cookieOptions = {
  httpOnly: true, 
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict", 
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
};

export const register = async (req, res) => {
  try {
    // 1. Zod Validation (Multer has already populated req.body and req.file)
    // We use .parse({ body: req.body }) because registerSchema wraps the fields in a 'body' object
    const validatedData = registerSchema.parse({ body: req.body }).body;
    const normalizedEmail = validatedData.email.toLowerCase();

    // 2. Check Duplicates (Parallel)
    const [userEmail, userPhone] = await Promise.all([
        User.findOne({ email: normalizedEmail }),
        User.findOne({ phoneNumber: validatedData.phoneNumber })
    ]);

    if (userEmail) return res.status(409).json({ success: false, message: "Email already taken" });
    if (userPhone) return res.status(409).json({ success: false, message: "Phone already taken" });

    // 3. Normalize file path and Create User
    // CRITICAL FIX: Save file path, normalizing slashes for cross-OS compatibility
    const profileImagePath = req.file 
        ? req.file.path.replace(/\\/g, "/") 
        : null;

    const newUser = new User({
      ...validatedData,
      email: normalizedEmail,
      profileImage: profileImagePath, // <-- SAVING THE FILE PATH
      role: "student" // Force role
    });

    await newUser.save();

    // Optional: Send Verification Email here (don't wait for it to complete request)
    // emailQueue.add({ type: 'verify', email: newUser.email });

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

    // 1. Find User
    const user = await User.findOne({ email: email.toLowerCase() }).select("+password +loginAttempts +isLocked +isDeleted +isActive");
    
    if (!user) return res.status(401).json({ success: false, message: "Invalid credentials" });

    // NEW SECURITY CHECK: Check for soft-deletion or inactivation
    if (user.isDeleted || !user.isActive) {
        return res.status(403).json({ success: false, message: "Account is disabled or deleted. Contact support." });
    }

    // 2. Check Lockout
    if (user.isLocked) {
      return res.status(403).json({ success: false, message: "Account is locked. Contact support." });
    }

    // 3. Compare Password
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
        // Increment attempts
        user.loginAttempts += 1;
        if (user.loginAttempts >= 5) {
          user.isLocked = true;
        }
        await user.save();
        return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    // 4. Reset Login Attempts on Success
    user.loginAttempts = 0;
    user.isLocked = false;
    user.lastLogin = Date.now();
    
    // 5. Generate Tokens
    const { accessToken, refreshToken } = generateTokens(user._id);

    // 6. Store Refresh Token in DB (for rotation/revocation)
    user.refreshTokens.push({ token: refreshToken });
    // Keep array size manageable, e.g., last 5 devices
    if(user.refreshTokens.length > 5) user.refreshTokens.shift(); 
    await user.save();

    // 7. Send Response (Token in JSON, Refresh in Cookie)
    res.cookie("refreshToken", refreshToken, cookieOptions);

    return res.status(200).json({
      success: true,
      accessToken, // Frontend stores this in memory/state
      user // calls toJSON() automatically removing password
    });

  } catch (error) {
    console.error("Login Error:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// NEW: Refresh Token Endpoint (Essential for JWT)
export const refresh = async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken;
    if (!incomingRefreshToken) return res.status(401).json({ message: "No token provided" });

    try {
      // Verify token
      const decoded = jwt.verify(incomingRefreshToken, process.env.JWT_REFRESH_SECRET);
      
      // Ensure we fetch the user's tokens to check for rotation logic
      const user = await User.findById(decoded.id).select('+refreshTokens');
      if (!user) return res.status(401).json({ message: "User not found" });

      // Check if token is in DB (Reuse Detection)
      const tokenExists = user.refreshTokens.find(t => t.token === incomingRefreshToken);
      if (!tokenExists) {
            // If valid signature but not in DB, it might be a reused token used by a hacker.
            // Panic mode: Delete all tokens for this user
            user.refreshTokens = [];
            await user.save();
            return res.status(403).json({ message: "Token reuse detected. Please login again." });
      }

      // Remove old token, add new one (Rotation)
      user.refreshTokens = user.refreshTokens.filter(t => t.token !== incomingRefreshToken);
      
      const { accessToken, refreshToken: newRefreshToken } = generateTokens(user._id);
      
      user.refreshTokens.push({ token: newRefreshToken });
      await user.save();

      res.cookie("refreshToken", newRefreshToken, cookieOptions);
      
      return res.status(200).json({ success: true, accessToken });

    } catch (err) {
        return res.status(403).json({ message: "Invalid token" });
    }
};

export const me = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ success: false, message: "User not found" });
        return res.status(200).json({ success: true, user });
    } catch (error) {
        console.error("Me Endpoint Error:", error);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};