import User from '../models/User.js';
import Enrollment from '../models/Enrollment.js';
import Payment from '../models/Payment.js';
import Class from '../models/Class.js';
import Material from '../models/Material.js';

import { sendVerificationEmail } from '../utils/email/Template.js';
import { sendVerificationSms } from '../utils/sms/Template.js';

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
      await sendVerificationEmail(user.email, otpCode) && await sendVerificationSms(user.phoneNumber, otpCode);
      
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
    await sendVerificationEmail(user.email, resetOtp) && await sendVerificationSms(user.phoneNumber, resetOtp);

    return res.status(200).json({ 
      success: true, 
      message: "If an account exists with this email, a reset code has been sent." 
    });

  } catch (error) {
    console.error("Forget User Password Error:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};


const getNextSessionDate = (dayOfWeek, timeStr) => {
    const now = new Date();
    const result = new Date(now);
    
    // Parse time (e.g. "14:30")
    const [hours, minutes] = timeStr.split(':').map(Number);
    result.setHours(hours, minutes, 0, 0);

    // Calculate day difference
    const currentDay = now.getDay();
    let diff = dayOfWeek - currentDay;

    // If day is today but time passed, or day is in past, add 7 days
    if (diff < 0 || (diff === 0 && result <= now)) {
        diff += 7;
    }
    
    result.setDate(now.getDate() + diff);
    return result;
};

export const getStudentDashboard = async (req, res) => {
  try {
    const studentId = req.user._id;

    // 1. Fetch Active Enrollments
    const enrollments = await Enrollment.find({ student: studentId, isActive: true })
      .populate('class', 'name subject timeSchedules coverImage')
      .lean();

    const enrollmentIds = enrollments.map(e => e._id);
    const enrolledClassIds = enrollments.map(e => e.class?._id);

    // 2. Calculate Next Session (Across all classes)
    let nextSession = null;
    const allUpcomingSessions = [];

    enrollments.forEach(enroll => {
        const cls = enroll.class;
        if (cls && cls.timeSchedules && cls.timeSchedules.length > 0) {
            cls.timeSchedules.forEach(sched => {
                const sessionDate = getNextSessionDate(sched.day, sched.startTime);
                allUpcomingSessions.push({
                    classId: cls._id,
                    className: cls.name,
                    subject: cls.subject,
                    startTime: sessionDate,
                    day: sched.day
                });
            });
        }
    });

    // Sort by date (earliest first)
    allUpcomingSessions.sort((a, b) => a.startTime - b.startTime);
    if (allUpcomingSessions.length > 0) {
        nextSession = allUpcomingSessions[0];
    }

    // 3. Pending Payments & Next Payment Date
    // FIX: Find payments where 'enrollment' is in the list of the student's enrollment IDs
    const pendingPayments = await Payment.find({ 
        enrollment: { $in: enrollmentIds }, 
        status: { $in: ['pending', 'failed'] } // Removed 'unpaid' as it's not in your Schema enum
    })
    .populate({
        path: 'enrollment',
        select: 'class',
        populate: { path: 'class', select: 'name' } // Deep populate to get class name
    })
    .sort({ paymentDate: -1 }) // Sort by most recent
    .lean();

    const nextPayment = pendingPayments.length > 0 ? pendingPayments[0] : null;

    // 4. Fetch Recent Materials
    const recentMaterials = await Material.find({ 
        classId: { $in: enrolledClassIds },
        isPublished: true 
    })
    .sort({ createdAt: -1 })
    .limit(5)
    .select('title fileType fileUrl createdAt')
    .lean();

    // 5. Construct Response
    const data = {
        stats: {
            activeClasses: enrollments.length,
            pendingPaymentsCount: pendingPayments.length,
            attendancePercentage: 92, // Placeholder
        },
        nextSession: nextSession ? {
            title: nextSession.className,
            subject: nextSession.subject,
            startTime: nextSession.startTime.toISOString(),
        } : null,
        nextPayment: nextPayment ? {
            amount: nextPayment.amount,
            // Schema doesn't have dueDate, using createdAt or paymentDate as reference
            date: nextPayment.paymentDate || nextPayment.createdAt,
            // Construct title dynamically since Schema doesn't have title
            title: nextPayment.notes || `Fee for ${nextPayment.enrollment?.class?.name || 'Class'}`,
            status: nextPayment.status
        } : null,
        recentMaterials,
        // Return top 3 upcoming sessions for the list view
        upcomingSessions: allUpcomingSessions.slice(0, 3).map(s => ({
            _id: s.classId,
            title: s.className,
            startTime: s.startTime.toISOString(),
            subject: s.subject,
            isOnline: true 
        }))
    };

    return res.status(200).json({ success: true, data });

  } catch (error) {
    console.error("Dashboard Error:", error);
    return res.status(500).json({ success: false, message: "Failed to load dashboard" });
  }
};