import User from "../models/User.js";
import { sendVerificationEmail } from "../utils/email/Template.js";
import { sendVerificationSms } from "../utils/sms/Template.js";

// Helper to find valid users (Not deleted)
const findActiveUser = async (id) => {
  return User.findOne({ _id: id, isDeleted: false });
};

// ==========================================
// 1. PROFILE MANAGEMENT
// ==========================================

export const updateUserProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await findActiveUser(id);

    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const { firstName, lastName, phoneNumber, address } = req.body;
    
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (phoneNumber) user.phoneNumber = phoneNumber;

    // --- FIX START ---
    if (address) {
      try {
        // FormData sends address as a JSON string. We must parse it back to an Object.
        user.address = typeof address === 'string' ? JSON.parse(address) : address;
      } catch (e) {
        console.error("Address parsing error:", e);
        return res.status(400).json({ success: false, message: "Invalid address format" });
      }
    }
    // --- FIX END ---

    if (req.file) {
      // Normalize path separators for Windows compatibility
      user.profileImage = req.file.path.replace(/\\/g, "/");
    }

    await user.save();
    return res.status(200).json({ success: true, user });
  } catch (error) {
    // Check if it's still a validation error after parsing
    if (error.name === 'ValidationError') {
        return res.status(400).json({ success: false, message: error.message });
    }
    console.error("Admin Update Profile Error:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const updateUserEmail = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await findActiveUser(id);

    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const { email } = req.body;
    
    // Check if email is actually changing
    if (email && email.toLowerCase() !== user.email) {
      const emailExists = await User.findOne({ email: email.toLowerCase() });
      if (emailExists) {
        return res.status(400).json({ success: false, message: "Email already in use" });
      } 
      
      user.email = email.toLowerCase();
      user.isVerified = false; // Reset verification
      
      // Generate OTP
      const otpCode = user.generateOtpCode();
      await user.save();

      // Send Verification
      try {
        await sendVerificationEmail(user.email, otpCode) && await sendVerificationSms(user.phoneNumber, otpCode);
      } catch (err) {
        console.error("Failed to send verification email:", err);
      }
      
      return res.status(200).json({ 
        success: true, 
        user, 
        message: "Email updated. Verification code sent to user." 
      });
    }

    return res.status(400).json({ success: false, message: "No changes made to email." });

  } catch (error) {
    console.error("Admin Update Email Error:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const updateUserPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await findActiveUser(id).select('+password');

    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const { newPassword } = req.body;

    user.password = newPassword; // Hashed by pre-save hook
    
    // Security: Invalidate existing sessions (Optional but recommended)
    user.refreshTokens = []; 
    
    await user.save();
    return res.status(200).json({ success: true, message: "User password updated successfully" });
  } catch (error) {
    console.error("Admin Update Password Error:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// ==========================================
// 2. ACCOUNT STATUS MANAGEMENT
// ==========================================

export const lockUserAccount = async (req, res) => {
  try {
    const user = await findActiveUser(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    
    user.isLocked = true;
    await user.save();
    return res.status(200).json({ success: true, message: "Account locked" });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const unlockUserAccount = async (req, res) => {
  try {
    const user = await findActiveUser(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    user.isLocked = false;
    user.loginAttempts = 0; // Reset attempts
    await user.save();
    return res.status(200).json({ success: true, message: "Account unlocked" });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const activateUserAccount = async (req, res) => {
  try {
    const user = await findActiveUser(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    user.isActive = true;
    await user.save();
    return res.status(200).json({ success: true, message: "Account activated" });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const deactivateUserAccount = async (req, res) => {
  try {
    const user = await findActiveUser(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    user.isActive = false;
    // Security: Kill active sessions immediately
    user.refreshTokens = [];
    
    await user.save();
    return res.status(200).json({ success: true, message: "Account deactivated" });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// ==========================================
// 3. DELETION & RESTORATION
// ==========================================

export const deleteUserAccount = async (req, res) => {
  try {
    const user = await findActiveUser(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    user.isDeleted = true;
    user.refreshTokens = []; // Kill sessions
    await user.save();
    
    return res.status(200).json({ success: true, message: "Account deleted (soft)" });
  } catch (error) {
    console.error("Admin Delete User Error:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const restoreUserAccount = async (req, res) => {
  try {
    // Note: Here we explicitly look for deleted users
    const user = await User.findOne({ _id: req.params.id, isDeleted: true });
    
    if (!user) return res.status(404).json({ success: false, message: "Deleted user not found" });

    user.isDeleted = false;
    await user.save();
    
    return res.status(200).json({ success: true, message: "Account restored" });
  } catch (error) {
    console.error("Admin Restore User Error:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};