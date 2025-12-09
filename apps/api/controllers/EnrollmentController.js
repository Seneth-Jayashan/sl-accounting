import Enrollment from "../models/Enrollment.js";
import User from "../models/User.js";
import Class from "../models/Class.js";

function endOfMonth(date = new Date(), addMonths = 0) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + addMonths + 1, 0); // set to day 0 of next month -> last day of target month
  d.setHours(23, 59, 59, 999);
  return d;
}

/**
 * GET ENROLLMENT BY ID
 */
export const getEnrollmentById = async (req, res) => {
  try {
    const enrollment = await Enrollment.findById(req.params.id)
      .populate("student", "firstName lastName email")
      .populate("class", "name grade subject")
      .populate("lastPayment");

    if (!enrollment) {
      return res.status(404).json({ message: "Enrollment not found" });
    }

    res.json(enrollment);
  } catch (err) {
    console.error("Error fetching enrollment by ID:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const createEnrollment = async (req, res) => {
  try {
    const { student, class: classId, subscriptionType } = req.body;

    // Validate references
    const isStudent = await User.findById(student);
    const isClass = await Class.findById(classId);

    if (!isStudent) return res.status(400).json({ message: "Invalid student" });
    if (!isClass) return res.status(400).json({ message: "Invalid class" });

    // Prevent duplicate
    const exists = await Enrollment.findOne({ student, class: classId });
    if (exists)
      return res.status(409).json({ message: "Student already enrolled in this class" });

    // Decide accessEndDate
    let accessEndDate = req.body.accessEndDate || null;
    if (subscriptionType === "monthly") {
      accessEndDate = endOfMonth(new Date(), 0); // last day of this month
    }

    const newEnrollment = new Enrollment({
      ...req.body,
      accessEndDate,
      accessStartDate: req.body.accessStartDate || new Date(),
    });

    const saved = await newEnrollment.save();
    return res.status(201).json(saved);
  } catch (err) {
    console.error("Error creating enrollment:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * UPDATE ENROLLMENT
 * - If paymentStatus becomes "paid" => extend accessEndDate to last day of NEXT month
 */
export const updateEnrollment = async (req, res) => {
  try {
    const { paymentStatus } = req.body;

    const updatePayload = { ...req.body };

    if (paymentStatus === "paid") {
      updatePayload.lastPaymentDate = new Date();
      // For monthly subscriptions we extend to the last day of next month.
      updatePayload.accessEndDate = endOfMonth(new Date(), 1); // last day of next month
      // Set nextPaymentDate to first day after that (optional) or to last day accordingly
      const nextPay = new Date(updatePayload.accessEndDate);
      nextPay.setDate(nextPay.getDate() + 1); // first day after the access period
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
