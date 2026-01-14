import mongoose from "mongoose";
import Enrollment from "../models/Enrollment.js";
import User from "../models/User.js";
import Class from "../models/Class.js";
import { format } from "date-fns"; // Recommended for consistent formatting
import { sendEnrollmentConfirmationSms } from "../utils/sms/Template.js";

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
  let smsQueue = []; // To store SMS data outside the retry loop

  try {
    const { 
        class: classId, 
        subscriptionType,
        includeRevision = false, 
        includePaper = false 
    } = req.body;

    const studentId = req.user.role === 'admin' ? (req.body.student || req.user._id) : req.user._id;

    // --- START OF AUTOMATIC RETRY BLOCK ---
    const transactionResult = await session.withTransaction(async () => {
        // Reset SMS queue in case the transaction retries (prevents duplicate SMS data)
        smsQueue = []; 

        // 1. Fetch Main Class
        const mainClass = await Class.findById(classId)
            .populate('linkedRevisionClass')
            .populate('linkedPaperClass')
            .session(session);

        if (!mainClass) {
            throw new Error("CLASS_NOT_FOUND"); // Custom error to break transaction
        }

        // 2. Identify classes
        const classesToEnroll = [mainClass]; 
        if (includeRevision && mainClass.linkedRevisionClass) classesToEnroll.push(mainClass.linkedRevisionClass);
        if (includePaper && mainClass.linkedPaperClass) classesToEnroll.push(mainClass.linkedPaperClass);

        const processedEnrollments = [];

        // 3. Process Enrollments
        for (const cls of classesToEnroll) {
            let enrollment = await Enrollment.findOne({ 
                student: studentId, 
                class: cls._id 
            }).session(session);

            if (!enrollment) {
                enrollment = new Enrollment({
                    student: studentId,
                    class: cls._id,
                    subscriptionType: subscriptionType || 'monthly',
                    paymentStatus: "unpaid",
                    isActive: true,
                    accessStartDate: new Date(),
                    accessEndDate: getEndOfMonth(new Date()),
                    paidMonths: [], 
                });
                await enrollment.save({ session });

                // THE CONFLICT SOURCE: Updating the Class document
                await Class.findByIdAndUpdate(cls._id, { 
                    $addToSet: { students: studentId } 
                }).session(session);

                // Queue SMS (but don't send yet)
                smsQueue.push({
                    phone: req.user.phoneNumber,
                    className: cls.name
                });
            }
            processedEnrollments.push(enrollment);
        }

        // 4. Calculate Price
        let totalAmount = mainClass.price || 0; 
        if (includeRevision && includePaper) {
            totalAmount = mainClass.bundlePriceFull ?? (mainClass.price + (mainClass.linkedRevisionClass?.price || 0) + (mainClass.linkedPaperClass?.price || 0));
        } else if (includeRevision) {
            totalAmount = mainClass.bundlePriceRevision ?? (mainClass.price + (mainClass.linkedRevisionClass?.price || 0));
        } else if (includePaper) {
            totalAmount = mainClass.bundlePricePaper ?? (mainClass.price + (mainClass.linkedPaperClass?.price || 0));
        }

        // Return data needed for the response
        return {
            processedEnrollments,
            totalAmount,
            mainClassId: mainClass._id
        };
    });
    // --- END OF TRANSACTION BLOCK ---

    // End session immediately after success
    await session.endSession();

    // 5. Send SMS (Non-blocking, outside transaction)
    if (smsQueue.length > 0) {
        Promise.allSettled(smsQueue.map(item => 
            sendEnrollmentConfirmationSms(item.phone, item.className)
        )).catch(e => console.error("Background SMS Error:", e));
    }

    // 6. Prepare Response
    const { processedEnrollments, totalAmount, mainClassId } = transactionResult;
    const primaryEnrollment = processedEnrollments.find(e => e.class.toString() === mainClassId.toString());

    return res.status(200).json({ 
        success: true,
        message: "Enrollment processed successfully",
        enrollment: primaryEnrollment,
        allEnrollments: processedEnrollments,
        paidMonths: primaryEnrollment?.paidMonths || [], 
        totalAmount: totalAmount, 
        breakdown: {
            theory: true,
            revision: includeRevision,
            paper: includePaper
        }
    });

  } catch (err) {
    await session.endSession();
    
    // Handle Custom Errors
    if (err.message === "CLASS_NOT_FOUND") {
        return res.status(404).json({ message: "Class not found" });
    }

    console.error("Enrollment Error:", err);
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