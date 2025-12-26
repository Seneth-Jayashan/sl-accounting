import User from '../models/User.js';
import { sendVerificationEmail } from '../utils/email/Template.js';

// --- HELPER: Escape Regex Characters ---
// Prevents server crashes if user searches for symbols like "(", "[", "*"
const escapeRegex = (text) => {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
};

// ==========================================
// PUBLIC / PROTECTED ROUTES
// ==========================================

export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    // Security: Ensure we don't return soft-deleted users
    const user = await User.findOne({ _id: id, isDeleted: false }).select('-password').populate('batch', 'name');
    
    if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
    }
    return res.status(200).json({ success: true, user });
  } catch (error) {
    console.error("Get User Profile Error:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const updateUserProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    // Security: Check isDeleted to prevent updates to deactivated accounts
    const user = await User.findOne({ _id: userId, isDeleted: false });

    if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
    }

    const { firstName, lastName, phoneNumber, address } = req.body;

    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (address) user.address = address;
    if (phoneNumber) user.phoneNumber = phoneNumber;

    // Handle File Upload (Multer middleware usually adds req.file)
    if (req.file) {
      user.profileImage = req.file.path;
    }

    await user.save();
    return res.status(200).json({ success: true, user });
  } catch (error) {
    console.error("Update User Profile Error:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const updateUserEmail = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findOne({ _id: userId, isDeleted: false });

    if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
    }

    const { email } = req.body;

    if (email && email.toLowerCase() !== user.email) {
      const emailExists = await User.findOne({ email: email.toLowerCase() });
      if (emailExists) {
        return res.status(400).json({ success: false, message: "Email already in use" });
      } 
      
      // Update email and reset verification status
      user.email = email.toLowerCase();
      user.isVerified = false; 
      
      // Generate OTP using Model Method (Consistency)
      const otpCode = user.generateOtpCode(); 
      await user.save();

      // Send Verification Email
      await sendVerificationEmail(user.email, otpCode);
      
      return res.status(200).json({ 
        success: true, 
        user, 
        message: "Email updated. Verification code sent." 
      });
    }

    return res.status(400).json({ success: false, message: "No changes made to email" });

  } catch (error) {
    console.error("Update User Email Error:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const updateUserPassword = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findOne({ _id: userId, isDeleted: false }).select('+password');

    if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
    }

    const { currentPassword, newPassword } = req.body;

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Current password is incorrect" });
    }

    user.password = newPassword; // Mongoose pre-save hook will hash this
    await user.save();

    return res.status(200).json({ success: true, message: "Password updated successfully" });
  } catch (error) {
    console.error("Update User Password Error:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const deleteUserAccount = async (req, res) => {
  try {
    // Soft Delete: We don't actually remove the record, just hide it.
    const user = await User.findById(req.user._id);
    if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
    }
    user.isDeleted = true;
    await user.save();
    return res.status(200).json({ success: true, message: "User account deactivated successfully" });
  } catch (error) {
    console.error("Delete User Account Error:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// ==========================================
// ADMIN ROUTES (Ideally)
// ==========================================

export const getAllUsers = async (req, res) => {
  try {
    const { search, batch, role } = req.query;

    // 1. Base Query: Hide deleted users
    const query = { isDeleted: false };

    // 2. Filters
    if (role) query.role = role;
    if (batch && batch !== "All") query.batch = batch;

    // 3. Search Logic with SAFETY ESCAPE
    if (search) {
      const safeSearch = escapeRegex(search); // <--- FIXED: Prevents Regex Crashes
      const searchRegex = new RegExp(safeSearch, 'i'); 
      
      query.$or = [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { email: searchRegex },
        { regNo: searchRegex },      
        { phoneNumber: searchRegex } 
      ];
    }

    // 4. Execute
    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .populate('batch', 'name');

    return res.status(200).json({ success: true, users });

  } catch (error) {
    console.error("Get All Users Error:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// ==========================================
// AUTH / RECOVERY ROUTES
// ==========================================

export const forgetUserPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email.toLowerCase(), isDeleted: false });

    // SECURITY: Prevent Email Enumeration
    // Even if user not found, we return 200 OK.
    if (!user) {
      return res.status(200).json({ 
        success: true, 
        message: "If an account exists with this email, a reset code has been sent." 
      });
    }

    // 1. Generate OTP (Reuse consistent logic)
    // If you don't have this method on User model, use: Math.floor(100000 + Math.random() * 900000).toString();
    // But it's better to reuse the Model logic.
    const resetOtp = Math.floor(100000 + Math.random() * 900000).toString();

    user.resetPasswordToken = resetOtp;
    user.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // 10 Minutes

    await user.save();

    // 2. Send Email
    await sendVerificationEmail(user.email, resetOtp);

    return res.status(200).json({ 
      success: true, 
      message: "If an account exists with this email, a reset code has been sent." 
    });

  } catch (error) {
    console.error("Forget User Password Error:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
