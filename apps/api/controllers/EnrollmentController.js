import Enrollment from "../models/Enrollment.js";
import User from "../models/User.js";
import Class from "../models/Class.js";

// --- HELPERS ---

/**
 * Get the end of the month for a specific date.
 * Example: Input Jan 5th -> Returns Jan 31st 23:59:59
 */
const getEndOfMonth = (date) => {
  const d = new Date(date);
  // Year, Month + 1, Day 0 gets the last day of the current month
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
};

// --- CONTROLLERS ---

/**
 * CREATE ENROLLMENT
 * Logic: Initial enrollment gives access until the end of the CURRENT month.
 */
export const createEnrollment = async (req, res) => {
  try {
    const { class: classId, subscriptionType } = req.body;

    // 1. Determine Student ID
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

    // 4. Calculate Access Date (End of Current Month)
    // Even if joining on Dec 25, access ends Dec 31 (requires renewal for Jan)
    let accessEndDate = req.body.accessEndDate;
    if (subscriptionType === "monthly" && !accessEndDate) {
      accessEndDate = getEndOfMonth(new Date()); 
    }

    const newEnrollment = new Enrollment({
      student: studentId,
      class: classId,
      subscriptionType,
      paymentStatus: "unpaid", // Default
      isActive: true, // Active initially so they can access free materials or waiting for payment
      accessStartDate: req.body.accessStartDate || new Date(),
      accessEndDate,
    });

    // Add student to Class array
    await classExists.enrollStudent(studentId);

    const saved = await newEnrollment.save();
    return res.status(201).json(saved);

  } catch (err) {
    console.error("Error creating enrollment:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * GET ENROLLMENT BY ID
 */
export const getEnrollmentById = async (req, res) => {
  try {
    // NOTE: 'findById' triggers the 'post find' middleware in your Model
    // which automatically checks and updates isExpired/isActive status.
    const enrollment = await Enrollment.findById(req.params.id)
      .populate("student", "firstName lastName email")
      .populate("class", "name grade subject price")
      .populate("lastPayment");

    if (!enrollment) {
      return res.status(404).json({ message: "Enrollment not found" });
    }

    // Authorization
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
 * GET ALL ENROLLMENTS (Admin)
 */
export const getAllEnrollments = async (req, res) => {
  try {
    const { classId, studentId, paymentStatus } = req.query;

    let filter = {};
    if (studentId) filter.student = studentId; 
    if (classId) filter.class = classId;
    if (paymentStatus) filter.paymentStatus = paymentStatus;

    // Triggers lazy update middleware for all docs found
    const enrollments = await Enrollment.find(filter)
      .populate("student", "firstName lastName email phoneNumber")
      .populate("class", "name price coverImage description ")
      .sort({ createdAt: -1 });

    res.json(enrollments);
  } catch (err) {
    console.error("Error fetching enrollments:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * GET MY ENROLLMENTS
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
 * CHECK STATUS
 */
export const checkEnrollment = async (req, res) => {
  try {
    const { classId } = req.query;
    const studentId = req.user._id;

    if (!classId) return res.status(400).json({ message: "Class ID required" });

    const exists = await Enrollment.findOne({ student: studentId, class: classId });
    
    return res.json({ 
        isEnrolled: !!exists, 
        enrollmentId: exists?._id || null,
        paymentStatus: exists?.paymentStatus || null,
        isActive: exists?.isActive || false
    });
  } catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
};

/**
 * UPDATE ENROLLMENT (Admin)
 * Handles Payment Approvals & Extensions
 */
export const updateEnrollment = async (req, res) => {
  try {
    const { paymentStatus, accessEndDate } = req.body;
    
    // 1. Fetch the document first (Crucial for Methods & Middleware)
    const enrollment = await Enrollment.findById(req.params.id);

    if (!enrollment) {
      return res.status(404).json({ message: "Enrollment not found" });
    }

    // 2. Handle Payment Approval
    if (paymentStatus === "paid") {
        const paymentDate = new Date();
        
        // Use Model Method if available, or manual logic
        // Logic: Payment Date -> End of THAT Month
        enrollment.paymentStatus = "paid";
        enrollment.isActive = true;
        enrollment.lastPaymentDate = paymentDate;

        // If admin provided a specific date, use it. Otherwise, calc end of current month.
        if (accessEndDate) {
            enrollment.accessEndDate = new Date(accessEndDate);
        } else {
            // FIXED LOGIC: Get end of CURRENT month (Jan 05 -> Jan 31)
            enrollment.accessEndDate = getEndOfMonth(paymentDate);
        }

        // Set Next Payment Date (1st of Next Month)
        const nextPay = new Date(enrollment.accessEndDate);
        nextPay.setDate(nextPay.getDate() + 1); // Feb 1st
        enrollment.nextPaymentDate = nextPay;
    } 
    // 3. Handle Revocation / Expiry
    else if (paymentStatus === "expired" || paymentStatus === "unpaid") {
        enrollment.paymentStatus = paymentStatus;
        enrollment.isActive = false;
        // Optionally set accessEndDate to yesterday to force expiry logic
    }

    // 4. Handle other updates (notes, etc.)
    if (req.body.notes) enrollment.notes = req.body.notes;
    if (req.body.isBlocked !== undefined) enrollment.isBlocked = req.body.isBlocked;

    // 5. Save (Triggers validations and hooks)
    await enrollment.save();

    return res.json(enrollment);
  } catch (err) {
    console.error("Error updating enrollment:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * DELETE ENROLLMENT
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