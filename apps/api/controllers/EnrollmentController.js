import mongoose from "mongoose";
import Enrollment from "../models/Enrollment.js";
import User from "../models/User.js";
import Class from "../models/Class.js";
import { format } from "date-fns"; // Recommended for consistent formatting

// --- HELPERS ---

const getEndOfMonth = (date) => {
  const d = new Date(date);
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
};

// --- CONTROLLERS ---

/**
 * CREATE OR RETRIEVE ENROLLMENT (Supports Bundles & Month Selection)
 */
export const createEnrollment = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { 
        class: classId, 
        subscriptionType,
        // New flags from Frontend
        includeRevision = false, 
        includePaper = false 
    } = req.body;

    const studentId = req.user.role === 'admin' ? (req.body.student || req.user._id) : req.user._id;

    // 1. Fetch Main Class with Variants populated
    const mainClass = await Class.findById(classId)
        .populate('linkedRevisionClass')
        .populate('linkedPaperClass')
        .session(session);

    if (!mainClass) {
        await session.abortTransaction();
        return res.status(404).json({ message: "Class not found" });
    }

    // 2. Identify all classes to enroll in
    const classesToEnroll = [mainClass]; // Always include Theory
    
    if (includeRevision && mainClass.linkedRevisionClass) {
        classesToEnroll.push(mainClass.linkedRevisionClass);
    }
    if (includePaper && mainClass.linkedPaperClass) {
        classesToEnroll.push(mainClass.linkedPaperClass);
    }

    // 3. Process Enrollments (Get Existing OR Create New)
    const processedEnrollments = [];
    
    for (const cls of classesToEnroll) {
        let enrollment = await Enrollment.findOne({ 
            student: studentId, 
            class: cls._id 
        }).session(session);

        if (!enrollment) {
            // Create New
            enrollment = new Enrollment({
                student: studentId,
                class: cls._id,
                subscriptionType: subscriptionType || 'monthly',
                paymentStatus: "unpaid",
                isActive: true, // Allow initial access or pending state
                accessStartDate: new Date(),
                accessEndDate: getEndOfMonth(new Date()),
                paidMonths: [], // Initialize empty history
                // Optional: Link siblings via a group ID if needed, or rely on logic
            });
            await enrollment.save({ session });

            // Update Class Student List
            // Note: We use $addToSet to avoid duplicates at DB level safely
            await Class.findByIdAndUpdate(cls._id, { 
                $addToSet: { students: studentId } 
            }).session(session);
        }

        processedEnrollments.push(enrollment);
    }

    // 4. CALCULATE TOTAL PRICE (Server Side Logic)
    let totalAmount = mainClass.price || 0; 

    if (includeRevision && includePaper) {
        if (mainClass.bundlePriceFull != null) {
            totalAmount = mainClass.bundlePriceFull;
        } else {
            const revPrice = mainClass.linkedRevisionClass?.price || 0;
            const papPrice = mainClass.linkedPaperClass?.price || 0;
            totalAmount = mainClass.price + revPrice + papPrice;
        }
    } 
    else if (includeRevision) {
        if (mainClass.bundlePriceRevision != null) {
            totalAmount = mainClass.bundlePriceRevision;
        } else {
            const revPrice = mainClass.linkedRevisionClass?.price || 0;
            totalAmount = mainClass.price + revPrice;
        }
    } 
    else if (includePaper) {
        if (mainClass.bundlePricePaper != null) {
            totalAmount = mainClass.bundlePricePaper;
        } else {
            const papPrice = mainClass.linkedPaperClass?.price || 0;
            totalAmount = mainClass.price + papPrice;
        }
    }

    await session.commitTransaction();
    session.endSession();

    // 5. Return Response
    // Find Primary Enrollment to return as main reference
    const primaryEnrollment = processedEnrollments.find(e => e.class.toString() === mainClass._id.toString());

    return res.status(200).json({ // Changed to 200 as it might be a retrieval
        success: true,
        message: "Enrollment processed successfully",
        enrollment: primaryEnrollment,
        allEnrollments: processedEnrollments,
        // Return paid history so frontend knows which months to disable
        paidMonths: primaryEnrollment.paidMonths || [], 
        totalAmount: totalAmount, 
        breakdown: {
            theory: true,
            revision: includeRevision,
            paper: includePaper
        }
    });

  } catch (err) {
    if (session.inTransaction()) {
        await session.abortTransaction();
    }
    session.endSession();
    console.error("Error creating enrollment:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

/**
 * GET ENROLLMENT BY ID
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
        isActive: exists?.isActive || false,
        paidMonths: exists?.paidMonths || [] // Include history here too
    });
  } catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
};

/**
 * UPDATE ENROLLMENT (Admin)
 */
export const updateEnrollment = async (req, res) => {
  try {
    const { paymentStatus, accessEndDate } = req.body;
    
    const enrollment = await Enrollment.findById(req.params.id);

    if (!enrollment) {
      return res.status(404).json({ message: "Enrollment not found" });
    }

    // 1. Handle Payment Approval
    if (paymentStatus === "paid") {
        const paymentDate = new Date();
        
        enrollment.paymentStatus = "paid";
        enrollment.isActive = true;
        enrollment.lastPaymentDate = paymentDate;

        if (accessEndDate) {
            enrollment.accessEndDate = new Date(accessEndDate);
        } else {
            enrollment.accessEndDate = getEndOfMonth(paymentDate);
        }

        // Logic: Add paid month to history
        // If admin manually approves, we assume it's for the month of the accessEndDate
        const monthString = format(enrollment.accessEndDate, "yyyy-MM");
        if (!enrollment.paidMonths.includes(monthString)) {
            enrollment.paidMonths.push(monthString);
        }

        const nextPay = new Date(enrollment.accessEndDate);
        nextPay.setDate(nextPay.getDate() + 1); 
        enrollment.nextPaymentDate = nextPay;
    } 
    // 2. Handle Revocation / Expiry
    else if (paymentStatus === "expired" || paymentStatus === "unpaid") {
        enrollment.paymentStatus = paymentStatus;
        enrollment.isActive = false;
    }

    if (req.body.notes) enrollment.notes = req.body.notes;
    if (req.body.isBlocked !== undefined) enrollment.isBlocked = req.body.isBlocked;

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