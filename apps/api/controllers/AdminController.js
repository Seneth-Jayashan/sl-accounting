import User from "../models/User";
import { sendVerificationEmail } from "../utils/email/Template";

export const updateUserProfile = async (req, res) => {
  try {
    const { id } = req.params;
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
    const { id } = req.params;
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
    const { id } = req.params;
    const user = await User.findById(id).select('+password');
    if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
    }
    const { newPassword } = req.body;

    user.password = newPassword;
    await user.save();
    return res.status(200).json({ success: true, message: "Password updated successfully" });
  } catch (error) {
    console.error("Update User Password Error:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const lockUserAccount = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
    } 
    user.isLocked = true;
    await user.save();
    return res.status(200).json({ success: true, message: "User account locked successfully" });
  } catch (error) {
    console.error("Lock User Account Error:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const unlockUserAccount = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
    }
    user.isLocked = false;
    user.loginAttempts = 0;
    await user.save();
    return res.status(200).json({ success: true, message: "User account unlocked successfully" });
  } catch (error) {
    console.error("Unlock User Account Error:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const activateUserAccount = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
    } 
    user.isActive = true;
    await user.save();
    return res.status(200).json({ success: true, message: "User account activated successfully" });
  } catch (error) {
    console.error("Activate User Account Error:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const deactivateUserAccount = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
    }
    user.isActive = false;
    await user.save();
    return res.status(200).json({ success: true, message: "User account deactivated successfully" });
  } catch (error) {
    console.error("Deactivate User Account Error:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const deleteUserAccount = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
    }
    user.isDeleted = true;
    await user.save();
    return res.status(200).json({ success: true, message: "User account deleted successfully" });
  } catch (error) {
    console.error("Admin Delete User Account Error:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const restoreUserAccount = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
    }
    user.isDeleted = false;
    await user.save();
    return res.status(200).json({ success: true, message: "User account restored successfully" });
  } catch (error) {
    console.error("Restore User Account Error:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
