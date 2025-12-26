import Enrollment from "../models/Enrollment.js";
import User from "../models/User.js";
import Class from "../models/Class.js";

// --- HELPERS ---

/**
 * Helper: Get end of month date
 * addMonths = 0 -> End of Current Month
 * addMonths = 1 -> End of Next Month
 */
function endOfMonth(date = new Date(), addMonths = 0) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + addMonths + 1, 0); // Day 0 of next month = Last day of target month
  d.setHours(23, 59, 59, 999);
  return d;
}

// --- CONTROLLERS ---

/**
 * CREATE ENROLLMENT
 * Security: Prevents students from enrolling others.
 */
export const createEnrollment = async (req, res) => {
  try {
    const { class: classId, subscriptionType } = req.body;

    // 1. Determine Student ID
    // If Admin: can use body.student OR fallback to themselves
    // If Student: MUST use req.user._id (ignore body.student)
    let studentId;
    if (req.user.role === 'admin') {
        studentId = req.body.student || req.user._id;
    } else {
        studentId = req.user._id;
    }

    // 2. Validate References
    const [studentExists, classExists] = await Promise.all([
        User.findById(studentId),
        Class.findById(classId)
    ]);

    if (!studentExists) return res.status(404).json({ message: "Student not found" });
    if (!classExists) return res.status(404).json({ message: "Class not found" });

    // 3. Prevent Duplicates
    const existing = await Enrollment.findOne({ student: studentId, class: classId });
    if (existing) {
      return res.status(409).json({ message: "Student already enrolled in this class" });
    }

    // 4. Calculate Access Date
    // Default: If monthly, give access until end of current month (or next if logic dictates)
    let accessEndDate = req.body.accessEndDate || null;
    if (subscriptionType === "monthly" && !accessEndDate) {
      accessEndDate = endOfMonth(new Date(), 0); 
    }

    const newEnrollment = new Enrollment({
      student: studentId,
      class: classId,
      subscriptionType,
      paymentStatus: "pending", // Default to pending until paid
      isActive: true, // or false depending on your logic (usually active but unpaid)
      accessStartDate: req.body.accessStartDate || new Date(),
      accessEndDate,
    });

    const saved = await newEnrollment.save();
    return res.status(201).json(saved);

  } catch (err) {
    console.error("Error creating enrollment:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * GET ENROLLMENT BY ID
 * Security: IDOR Protection (User can only see own data)
 */
export const getEnrollmentById = async (req, res) => {
  try {
    const enrollment = await Enrollment.findById(req.params.id)
      .populate("student", "firstName lastName email")
      .populate("class", "name grade subject price")
      .populate("lastPayment");

    if (!enrollment) {
      return res.status(404).json({ message: "Enrollment not found" });
    }

    // Authorization Check
    // Allow if Admin OR if the enrollment belongs to the requester
    const isOwner = enrollment.student._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
        return res.status(403).json({ message: "Not authorized to view this enrollment" });
    }

    res.json(enrollment);
  } catch (err) {
    console.error("Error fetching enrollment by ID:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * GET ALL ENROLLMENTS (Admin Only)
 */
export const getAllEnrollments = async (req, res) => {
  try {
    const { classId, studentId, paymentStatus } = req.query;

    let filter = {};
    if (studentId) filter.student = studentId; 
    if (classId) filter.class = classId;
    if (paymentStatus) filter.paymentStatus = paymentStatus;

    const enrollments = await Enrollment.find(filter)
      .populate("student", "firstName lastName email phoneNumber")
      .populate("class", "name price")
      .sort({ createdAt: -1 });

    res.json(enrollments);
  } catch (err) {
    console.error("Error fetching enrollments:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * GET MY ENROLLMENTS (Logged In User)
 */
export const getMyEnrollments = async (req, res) => {
  try {
    const enrollments = await Enrollment.find({ student: req.user._id })
      .populate("class", "name price coverImage description")
      .populate("lastPayment")
      .sort({ createdAt: -1 });

    res.json(enrollments);
  } catch (err) {
    console.error("Error fetching my enrollments:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * CHECK STATUS (Helper for UI Buttons)
 */
export const checkEnrollment = async (req, res) => {
  try {
    const { classId } = req.query;
    const studentId = req.user._id;

    if (!classId) return res.status(400).json({ message: "Class ID required" });

    const exists = await Enrollment.findOne({ student: studentId, class: classId });
    
    // Return explicit object
    return res.json({ 
        isEnrolled: !!exists, 
        enrollmentId: exists?._id || null,
        paymentStatus: exists?.paymentStatus || null
    });
  } catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
};

/**
 * UPDATE ENROLLMENT (Admin Only)
 */
export const updateEnrollment = async (req, res) => {
  try {
    const { paymentStatus, accessEndDate } = req.body;
    const updatePayload = { ...req.body };

    // Business Logic: If marking as paid, extend access
    if (paymentStatus === "paid") {
      updatePayload.lastPaymentDate = new Date();
      
      // If manual date not provided, calculate default (End of Next Month)
      if (!accessEndDate) {
          updatePayload.accessEndDate = endOfMonth(new Date(), 1); 
      }

      // Calculate next payment date (Day after access ends)
      const accessEnd = new Date(updatePayload.accessEndDate);
      const nextPay = new Date(accessEnd);
      nextPay.setDate(accessEnd.getDate() + 1);
      updatePayload.nextPaymentDate = nextPay;
    }

    const updatedEnrollment = await Enrollment.findByIdAndUpdate(
      req.params.id,
      updatePayload,
      { new: true }
    );

    if (!updatedEnrollment) {
      return res.status(404).json({ message: "Enrollment not found" });
    }

    return res.json(updatedEnrollment);
  } catch (err) {
    console.error("Error updating enrollment:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * DELETE ENROLLMENT (Admin Only)
 */
export const deleteEnrollment = async (req, res) => {
  try {
    const deletedEnrollment = await Enrollment.findByIdAndDelete(req.params.id);

    if (!deletedEnrollment) {
      return res.status(404).json({ message: "Enrollment not found" });
    }

    res.json({ message: "Enrollment deleted successfully" });
  } catch (err) {
    console.error("Error deleting enrollment:", err);
    res.status(500).json({ message: "Server error" });
  }
};