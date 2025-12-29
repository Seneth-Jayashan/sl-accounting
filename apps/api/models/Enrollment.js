import mongoose from "mongoose";

// --- HELPER: Get End of Month ---
const getEndOfMonth = (date) => {
  const d = new Date(date);
  // Move to the next month, day 0 (which is the last day of the previous month)
  // Example: Input Jan 5 -> Month becomes Feb, Day 0 -> Jan 31
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
};

const attendanceSchema = new mongoose.Schema(
  {
    date: { type: Date, required: true },
    joinedAt: { type: Date },
    leftAt: { type: Date },
    durationMinutes: { type: Number },
  },
  { _id: false }
);

const enrollmentSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true,
      index: true,
    },

    // Payment & access
    paymentStatus: {
      type: String,
      enum: ["paid", "unpaid", "pending", "expired"],
      default: "unpaid",
    },
    lastPayment: { type: mongoose.Schema.Types.ObjectId, ref: "Payment" },
    lastPaymentDate: { type: Date },
    
    // accessStartDate: When they FIRST joined
    accessStartDate: { type: Date, default: Date.now },
    
    // accessEndDate: When their current access expires
    accessEndDate: { type: Date },

    // Enrollment state
    isActive: { type: Boolean, default: true },
    isBlocked: { type: Boolean, default: false },

    // Attendance & progress
    attendance: { type: [attendanceSchema], default: [] },

    notes: { type: String },
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true }, 
    toObject: { virtuals: true }
  }
);

// Prevent duplicate enrollments for same student-class pair
enrollmentSchema.index({ student: 1, class: 1 }, { unique: true });

// --- 1. VIRTUAL: Check Expiration ---
enrollmentSchema.virtual('isExpired').get(function() {
  if (!this.accessEndDate) return false;
  return new Date() > this.accessEndDate;
});

// --- 2. MIDDLEWARE: Lazy Status Update ---
// Automatically marks enrollment as inactive if accessEndDate has passed
enrollmentSchema.post(['find', 'findOne'], async function(docs) {
  if (!docs) return;
  
  // Normalizing input (findOne returns object, find returns array)
  const enrollments = Array.isArray(docs) ? docs : [docs];
  const now = new Date();
  const updates = [];

  for (const doc of enrollments) {
    // Check if it's active BUT should be expired
    if (doc.isActive && doc.accessEndDate && now > doc.accessEndDate) {
      console.log(`⏳ Auto-expiring enrollment: ${doc._id}`);
      
      // Update the document in memory so the user sees the correct status immediately
      doc.isActive = false;
      doc.paymentStatus = 'expired';

      // Queue a database update to persist this change
      updates.push(mongoose.model("Enrollment").updateOne(
        { _id: doc._id },
        { $set: { isActive: false, paymentStatus: 'expired' } }
      ));
    }
  }

  // Execute updates asynchronously (don't block the response)
  if (updates.length > 0) {
    Promise.all(updates).catch(err => console.error("Auto-expire update failed", err));
  }
});

// --- METHODS ---

/**
 * Marks the enrollment as paid and extends access to the end of the payment month.
 * @param {Date} paymentDate - The date the payment was made (default: now)
 * @param {ObjectId} paymentId - Optional reference to the Payment record
 */
enrollmentSchema.methods.markPaid = async function (
  paymentDate = new Date(),
  paymentId = null
) {
  // 1. Update Payment Info
  this.paymentStatus = "paid";
  this.isActive = true; // Reactivate account if it was expired
  this.lastPaymentDate = paymentDate;
  if (paymentId) this.lastPayment = paymentId;

  // 2. Calculate New Access End Date
  // Logic: Access ends at the end of the month of the payment date.
  // Ex: Paid Jan 5 -> End Jan 31. Paid Feb 20 -> End Feb 28.
  this.accessEndDate = getEndOfMonth(paymentDate);

  return this.save();
};

// Convenience: revoke access
enrollmentSchema.methods.revokeAccess = async function () {
  this.isActive = false;
  this.paymentStatus = "expired";
  return this.save();
};

export default mongoose.model("Enrollment", enrollmentSchema);