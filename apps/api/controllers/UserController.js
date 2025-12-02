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

export  const forgetUserPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
    }
    const otpCode = user.generateOtpCode();
    await user.save();
    await sendVerificationEmail(user.email, otpCode);
    return res.status(200).json({ success: true, message: "OTP code sent to email" });
  } catch (error) {
    console.error("Forget User Password Error:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const resetUserPassword = async (req, res) => {
  try {
    const { email, otpCode, newPassword } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() }).select('+otp +otpExpiresAt +otpAttempts');
    if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
    }
    const otpResult = user.verifyOtpCode(otpCode);
    if (!otpResult.ok) {
      return res.status(400).json({ success: false, message: "Invalid or expired OTP code" });
    }
    user.password = newPassword;
    user.clearOtp();
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

