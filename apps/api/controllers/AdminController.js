import User from "../models/User.js";
import Class from "../models/Class.js";
import Payment from "../models/Payment.js"; // Required for Dashboard Revenue & Top Students
import Enrollment from "../models/Enrollment.js";
import { sendVerificationEmail } from "../utils/email/Template.js";
import { sendVerificationSms } from "../utils/sms/Template.js";
import Batch from "../models/Batch.js";

const findActiveUser = async (id) => {
  return await User.findOne({ _id: id, isDeleted: false })
    .populate("batch", "name")
    .select("-password");
};

// ==========================================
// 1. DASHBOARD ANALYTICS
// ==========================================

export const getDashboardSummary = async (req, res) => {
  try {
    const totalStudents = await User.countDocuments({ role: "student", isDeleted: false });
    const activeClasses = await Class.countDocuments({ isPublished: true });

    const revenueAgg = await Payment.aggregate([
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);
    const totalRevenue = revenueAgg[0]?.total || 0;

    const recentUsers = await User.find({ role: "student", isDeleted: false })
      .sort({ createdAt: -1 })
      .limit(5)
      .select("firstName lastName createdAt");

    const recentActivity = recentUsers.map((u) => ({
      _id: u._id,
      action: "New student registered",
      targetName: `${u.firstName} ${u.lastName}`,
      type: "student",
      createdAt: u.createdAt,
    }));

    const topStudents = await Payment.aggregate([
      { $group: { _id: "$student", totalPaid: { $sum: "$amount" } } },
      { $sort: { totalPaid: -1 } },
      { $limit: 5 },
      { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "studentInfo" } },
      { $unwind: "$studentInfo" },
      { 
        $project: { 
          _id: 1, 
          totalPaid: 1, 
          firstName: "$studentInfo.firstName", 
          lastName: "$studentInfo.lastName",
          batch: "$studentInfo.batch"
        } 
      }
    ]);

    const nextClassObj = await Class.findOne({ isPublished: true }).select("name type timeSchedules");
    
    let nextClass = null;
    if (nextClassObj && nextClassObj.timeSchedules?.length > 0) {
      nextClass = {
        _id: nextClassObj._id,
        name: nextClassObj.name,
        subject: nextClassObj.type,
        startTime: new Date().toISOString() 
      };
    }

    return res.status(200).json({
      success: true,
      stats: {
        totalStudents,
        totalRevenue,
        activeClasses,
        studentGrowth: 12, 
        revenueGrowth: 8, 
      },
      recentActivity,
      topStudents,
      nextClass,
    });

  } catch (error) {
    console.error("Dashboard Summary Error:", error);
    return res.status(500).json({ success: false, message: "Failed to load dashboard data" });
  }
};

// ==========================================
// 2. USER READ OPERATIONS (For Student List)
// ==========================================

export const getAllUsers = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search, 
      role, 
      batch, 
      isDeleted,
      isLocked
    } = req.query;

    const query = {};

    if (role) {
      query.role = role;
    }

    if (batch && batch !== "All") {
      query.batch = batch;
    }

    if (isDeleted !== undefined) {
      query.isDeleted = isDeleted === 'true';
    }

    if (isLocked !== undefined) {
      query.isLocked = isLocked === 'true';
    }

    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;

    const users = await User.find(query)
      .populate("batch", "name") 
      .limit(limitNum)
      .skip((pageNum - 1) * limitNum)
      .select("-password")
      .sort({ createdAt: -1 }); 

    const count = await User.countDocuments(query);

    return res.status(200).json({
      success: true,
      users,
      totalPages: Math.ceil(count / limit),
      currentPage: Number(page),
      totalUsers: count,
    });
  } catch (error) {
    console.error("Error in getAllUsers:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getUserById = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await findActiveUser(id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const enrollments = await Enrollment.find({ student: id })
      .populate("class", "name coverImage price type level")
      .populate("lastPayment", "amount status paymentDate method targetMonth")
      .sort({ createdAt: -1 })
      .lean();

    const enrollmentIds = enrollments.map((enr) => enr._id);

    const payments = enrollmentIds.length
      ? await Payment.find({ enrollment: { $in: enrollmentIds } })
          .populate({
            path: "enrollment",
            select: "class paymentStatus accessStartDate accessEndDate paidMonths",
            populate: { path: "class", select: "name coverImage price type level" },
          })
          .sort({ paymentDate: -1, createdAt: -1 })
          .lean()
      : [];

    const paidByClass = new Map();

    for (const payment of payments) {
      if (payment.status !== "completed") continue;

      const classData = payment.enrollment?.class;
      if (!classData?._id) continue;

      const classId = String(classData._id);
      if (!paidByClass.has(classId)) {
        paidByClass.set(classId, {
          class: {
            _id: classData._id,
            name: classData.name,
            coverImage: classData.coverImage || null,
            type: classData.type || null,
            level: classData.level || null,
            price: classData.price || 0,
          },
          totalPaidAmount: 0,
          paymentCount: 0,
          paidMonths: new Set(),
          lastPaidAt: null,
        });
      }

      const item = paidByClass.get(classId);
      item.totalPaidAmount += Number(payment.amount || 0);
      item.paymentCount += 1;

      if (payment.targetMonth) item.paidMonths.add(payment.targetMonth);

      const paidAt = payment.paymentDate || payment.createdAt;
      if (!item.lastPaidAt || new Date(paidAt) > new Date(item.lastPaidAt)) {
        item.lastPaidAt = paidAt;
      }
    }

    const lifetimePaidClasses = Array.from(paidByClass.values())
      .map((item) => ({
        ...item,
        paidMonths: Array.from(item.paidMonths).sort(),
      }))
      .sort((a, b) => Number(b.totalPaidAmount || 0) - Number(a.totalPaidAmount || 0));

    const stats = {
      totalEnrollments: enrollments.length,
      activeEnrollments: enrollments.filter((enr) => enr.isActive).length,
      totalPayments: payments.length,
      completedPayments: payments.filter((p) => p.status === "completed").length,
      lifetimePaidAmount: lifetimePaidClasses.reduce((sum, item) => sum + Number(item.totalPaidAmount || 0), 0),
      totalPaidClasses: lifetimePaidClasses.length,
    };

    return res.status(200).json({
      success: true,
      user,
      enrollments,
      payments,
      lifetimePaidClasses,
      stats,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// 3. USER CREATE OPERATION
// ==========================================

export const createUser = async (req, res) => {
  try {
    const { firstName, lastName, email, password, phoneNumber, role , batch , address } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ success: false, message: "Email already exists" });

    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      phoneNumber,
      batch,
      role: role || "student",
      isVerified: true, 
      address: {
        street: address?.street || "",
        city: address?.city || "",
        state: address?.state || "",
        zipCode: address?.zipCode || "",
      }, 
    });

    return res.status(201).json({ success: true, user });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// 4. PROFILE UPDATE OPERATIONS
// ==========================================

export const updateUserProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await findActiveUser(id);

    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const { firstName, lastName, phoneNumber, address ,batch } = req.body;
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (phoneNumber) user.phoneNumber = phoneNumber;

    if (batch){
      if(!user.batch){
        user.batch = batch;
      }else{
        const OldBatch = await Batch.findById(user.batch);
        if(OldBatch){
          OldBatch.students.pull(user._id);
          await OldBatch.save();
        }
        user.batch = batch;
        const NewBatch = await Batch.findById(batch);
        if(NewBatch){
          NewBatch.students.push(user._id);
          await NewBatch.save();
        }
      }
    }

    if (address) {
      try {
        user.address = typeof address === 'string' ? JSON.parse(address) : address;
      } catch (e) {
        return res.status(400).json({ success: false, message: "Invalid address format" });
      }
    }

    if (req.file) {
      user.profileImage = req.file.path.replace(/\\/g, "/");
    }

    await user.save();
    return res.status(200).json({ success: true, user });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: error.message });
    }
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const updateUserEmail = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await findActiveUser(id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const { email } = req.body;

    if (email && email.toLowerCase() !== user.email) {
      const emailExists = await User.findOne({ email: email.toLowerCase() });
      if (emailExists) return res.status(400).json({ success: false, message: "Email already in use" });

      user.email = email.toLowerCase();
      user.isVerified = false;
      const otpCode = user.generateOtpCode();
      await user.save();

      try {
        await Promise.all([
          sendVerificationEmail(user.email, otpCode),
          sendVerificationSms(user.phoneNumber, otpCode)
        ]);
      } catch (err) {
        console.error("Verification send failed:", err);
      }

      return res.status(200).json({ 
        success: true, 
        user, 
        message: "Email updated. Verification code sent." 
      });
    }

    return res.status(400).json({ success: false, message: "No changes made to email." });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateUserPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await findActiveUser(id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const { newPassword } = req.body;
    user.password = newPassword; 
    user.refreshTokens = [];
    
    await user.save();
    return res.status(200).json({ success: true, message: "User password updated successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// 5. ACCOUNT STATUS MANAGEMENT
// ==========================================

export const lockUserAccount = async (req, res) => {
  try {
    const user = await findActiveUser(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    user.isLocked = true;
    await user.save();
    return res.status(200).json({ success: true, message: "Account locked" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const unlockUserAccount = async (req, res) => {
  try {
    const user = await findActiveUser(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    user.isLocked = false;
    user.loginAttempts = 0;
    await user.save();
    return res.status(200).json({ success: true, message: "Account unlocked" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
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
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const deactivateUserAccount = async (req, res) => {
  try {
    const user = await findActiveUser(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    user.isActive = false;
    user.refreshTokens = [];
    await user.save();
    return res.status(200).json({ success: true, message: "Account deactivated" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// 6. DELETION & RESTORATION
// ==========================================

export const deleteUserAccount = async (req, res) => {
  try {
    const user = await findActiveUser(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    user.isDeleted = true;
    user.isActive = false;
    user.refreshTokens = [];
    await user.save();
    
    return res.status(200).json({ success: true, message: "Account deleted (soft)" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const restoreUserAccount = async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.params.id, isDeleted: true });
    
    if (!user) return res.status(404).json({ success: false, message: "Deleted user not found" });

    user.isDeleted = false;
    await user.save();
    
    return res.status(200).json({ success: true, message: "Account restored" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};