import User from "../models/User.js";
import jwt from "jsonwebtoken";
import { registerSchema } from "../validators/AuthValidator.js";
import {sendVerificationEmail} from "../utils/email/Template.js";

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
    const validatedData = registerSchema.parse({ body: req.body }).body;
    const normalizedEmail = validatedData.email.toLowerCase();

    const [userEmail, userPhone] = await Promise.all([
        User.findOne({ email: normalizedEmail }),
        User.findOne({ phoneNumber: validatedData.phoneNumber })
    ]);

    if (userEmail) return res.status(409).json({ success: false, message: "Email already taken" });
    if (userPhone) return res.status(409).json({ success: false, message: "Phone already taken" });

    const profileImagePath = req.file 
        ? req.file.path.replace(/\\/g, "/") 
        : null;

    const newUser = new User({
      ...validatedData,
      email: normalizedEmail,
      profileImage: profileImagePath, 
      role: "student" 
    });

    await newUser.save();


    //TODO : Send Whatapp Verification Message 

    await sendVerificationEmail(
      newUser.email,
      newUser.generateOtpCode()
    );

    await newUser.save();

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

    const user = await User.findOne({ email: email.toLowerCase() }).select("+password +loginAttempts +isLocked +isDeleted +isActive");
    
    if (!user) return res.status(401).json({ success: false, message: "Invalid credentials" });

    if (user.isDeleted || !user.isActive) {
        return res.status(403).json({ success: false, message: "Account is disabled or deleted. Contact support." });
    }

    if (user.isLocked) {
      return res.status(403).json({ success: false, message: "Account is locked. Contact support." });
    }

    if (user.loginAttempts >= 5) {
        user.isLocked = true;
        await user.save();
        return res.status(403).json({ success: false, message: "Account is locked due to too many failed login attempts. Contact support." });
    }

    if (!user.isVerified) {
        return res.status(403).json({ success: false, message: "Please verify your email before logging in." });
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

    user.loginAttempts = 0;
    user.isLocked = false;
    user.lastLogin = Date.now();
    
    const { accessToken, refreshToken } = generateTokens(user._id);

    user.refreshTokens.push({ token: refreshToken });
    if(user.refreshTokens.length > 5) user.refreshTokens.shift(); 
    await user.save();

    res.cookie("refreshToken", refreshToken, cookieOptions);

    return res.status(200).json({
      success: true,
      accessToken, 
      user 
    });

  } catch (error) {
    console.error("Login Error:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// apps/api/controllers/AuthController.js

export const refresh = async (req, res) => {
  const incomingRefreshToken = req.cookies.refreshToken;

  if (!incomingRefreshToken) return res.status(401).json({ message: "No token provided" });

  try {
    const decoded = jwt.verify(incomingRefreshToken, process.env.JWT_REFRESH_SECRET);
    
    // 1. Find user (Verification step)
    const user = await User.findById(decoded.id).select('+refreshTokens');
    if (!user) return res.status(401).json({ message: "User not found" });

    // 2. Reuse Detection
    const tokenExists = user.refreshTokens.find(t => t.token === incomingRefreshToken);

    if (!tokenExists) {
      console.log("Token reuse detected for user:", user._id);
      // Clear all tokens if reuse detected
      await User.updateOne({ _id: user._id }, { $set: { refreshTokens: [] } });
      return res.status(403).json({ message: "Token reuse detected. Please login again." });
    }

    // 3. Generate New Tokens
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user._id);
    
    // 4. 🟢 THE FIX: Atomic Swap (In-Place Update) 

    // [Image of MongoDB array update]

    // We search for the user AND the specific old token.
    // Then we use '$set' on 'refreshTokens.$' (the matched index) to replace it.
    const updateResult = await User.findOneAndUpdate(
      { 
        _id: user._id, 
        "refreshTokens.token": incomingRefreshToken // Filter: Find the specific old token
      },
      { 
        $set: { "refreshTokens.$": { token: newRefreshToken } } // Action: Replace ONLY that token
      },
      { new: true } 
    );

    // RACE CONDITION HANDLE: 
    // If updateResult is null, it means the old token was ALREADY rotated by a parallel request.
    // In this case, we can't rotate it again.
    if (!updateResult) {
       console.log("Race condition: Token already rotated.");
       // Ideally, stop here. But returning 403 might confuse the frontend.
       // Returning the accessToken generated above is safe, 
       // but the refreshToken in the cookie will be rejected next time.
    }

    // 5. Send Response
    res.cookie("refreshToken", newRefreshToken, cookieOptions);
    
    return res.status(200).json({ success: true, accessToken });

  } catch (err) {
    console.error("Refresh Token Error:", err);
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

export const logout = async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken;
    if (!incomingRefreshToken) return res.status(204).end();
    try {
      const decoded = jwt.verify(incomingRefreshToken, process.env.JWT_REFRESH_SECRET);
      const user = await User.findById(decoded.id).select('+refreshTokens');
      if (user) {
        user.refreshTokens = user.refreshTokens.filter(t => t.token !== incomingRefreshToken);
        await user.save();
      }
      res.clearCookie("refreshToken", cookieOptions);
      return res.status(204).end();
    } catch (err) {
      res.clearCookie("refreshToken", cookieOptions);
      return res.status(204).end();
    }
};