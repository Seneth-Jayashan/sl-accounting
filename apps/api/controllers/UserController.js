import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import { sendVerificationEmail } from '../utils/email/Template.js';

export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).select('-password');
    if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
    }
    return res.status(200).json({ success: true, user });
  } catch (error) {
    console.error("Get User Profile Error:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ isDeleted: false }).select('-password');
    return res.status(200).json({ success: true, users });
  } catch (error) {
    console.error("Get All Users Error:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const updateUserProfile = async (req, res) => {
  try {
    const { id } = req.user._id;
    const user = await User.findById(id);
    if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
    }
    const { firstName, lastName, phoneNumber, address } = req.body;
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (address) user.address = address;
    if (phoneNumber) user.phoneNumber = phoneNumber;

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
    const { id } = req.user._id;
    const user = await User.findById(id);
    if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
    }
    const { email } = req.body;
    if (email) {
      const emailExists = await User.findOne({ email: email.toLowerCase() });
      if (emailExists) {
        return res.status(400).json({ success: false, message: "Email already in use" });
      } 
      user.email = email.toLowerCase();
      user.isVerified = false; 
    }
    await user.save();

    //TODO : Send Whatapp Verification Message 

    await sendVerificationEmail(
      user.email,
      user.generateOtpCode()
    );
    
    return res.status(200).json({ success: true, user , message: "Email updated. Please verify your new email." });
  } catch (error) {
    console.error("Update User Email Error:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const updateUserPassword = async (req, res) => {
  try {
    const { id } = req.user._id;
    const user = await User.findById(id).select('+password');
    if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
    }
    const { currentPassword, newPassword } = req.body;
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Current password is incorrect" });
    }
    user.password = newPassword;
    await user.save();
    return res.status(200).json({ success: true, message: "Password updated successfully" });
  } catch (error) {
    console.error("Update User Password Error:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const forgetUserPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      // For security, it's often better to return success even if user not found 
      // to prevent email enumeration, but for now we keep your 404 logic.
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // 1. Generate a 6-digit OTP string
    const resetOtp = Math.floor(100000 + Math.random() * 900000).toString();

    // 2. Save to the specific RESET fields (Expires in 10 minutes)
    user.resetPasswordToken = resetOtp;
    user.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // 10 Minutes from now

    await user.save();

    // 3. Send the email (Pass the resetOtp)
    // Ensure your sendVerificationEmail function accepts the subject or type
    await sendVerificationEmail(user.email, resetOtp);

    return res.status(200).json({ success: true, message: "Password reset code sent to email" });
  } catch (error) {
    console.error("Forget User Password Error:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const resetUserPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    // 1. Find user and select the hidden reset fields
    const user = await User.findOne({ email: email.toLowerCase() })
      .select('+resetPasswordToken +resetPasswordExpires');

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // 2. Verify Token Existence
    if (!user.resetPasswordToken || !user.resetPasswordExpires) {
      return res.status(400).json({ success: false, message: "No password reset requested" });
    }

    // 3. Check if OTP matches
    // Note: If you hash tokens in the DB, you need to hash 'otp' here before comparing
    if (user.resetPasswordToken !== otp) {
      return res.status(400).json({ success: false, message: "Invalid reset code" });
    }

    // 4. Check if Token has expired
    if (user.resetPasswordExpires < Date.now()) {
      return res.status(400).json({ success: false, message: "Reset code has expired" });
    }

    // 5. Update Password and Clear Tokens
    user.password = newPassword; // Mongoose pre-save hook should handle hashing
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    return res.status(200).json({ success: true, message: "Password reset successfully" });
  } catch (error) {
    console.error("Reset User Password Error:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const verifyUserEmail = async (req, res) => {
  try {
    const { email, otpCode } = req.body; 
    const user = await User.findOne({ email: email.toLowerCase() })
      .select('+otp +otpExpiresAt +otpAttempts +isVerified');

    if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
    }

    const otpResult = await user.verifyOtpCode(otpCode); 
    if (!otpResult.ok) {
      return res.status(400).json({ 
        success: false, 
        message: otpResult.reason === "expired" ? "OTP has expired" : "Invalid OTP code" 
      });
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
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
    }
    const otpCode = user.generateOtpCode();
    await user.save();
    await sendVerificationEmail(user.email, otpCode);
    return res.status(200).json({ success: true, message: "OTP code resent to email" });
  } catch (error) {
    console.error("Resend Verification OTP Error:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};


export const deleteUserAccount = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
    }
    user.isDeleted = true;
    await user.save();
    return res.status(200).json({ success: true, message: "User account deleted successfully" });
  } catch (error) {
    console.error("Delete User Account Error:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

