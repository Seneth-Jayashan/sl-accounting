import User from '../models/User.js';
import bcrypt from 'bcryptjs';

export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
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
    const user = await User.findById(req.user._id);
    if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
    }
    const { name, email, password } = req.body;
    if (name) user.name = name;
    if (email) user.email = email.toLowerCase();
    if (password) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
    }
    await user.save();
    return res.status(200).json({ success: true, user });
  } catch (error) {
    console.error("Update User Profile Error:", error);
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

