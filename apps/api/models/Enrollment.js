import mongoose from "mongoose";

// --- HELPER: Get End of Month ---
const getEndOfMonth = (date) => {
  const d = new Date(date);
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
};

// --- HELPER: Get End of Specific Target Month string (YYYY-MM) ---
const getEndOfTargetMonth = (monthString) => {
    // "2026-02" -> split -> [2026, 2]
    const [year, month] = monthString.split('-').map(Number);
    // Date constructor (year, monthIndex, 0) -> Last day of previous month index
    // month is 2 (Feb). Index 2 is March. Day 0 of March is Last day of Feb.
    return new Date(year, month, 0, 23, 59, 59, 999);
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

    // --- NEW: Track history of paid months ---
    paidMonths: [{ type: String }],

    paymentStatus: {
      type: String,
      enum: ["paid", "unpaid", "pending", "expired"],
      default: "unpaid",
    },
    lastPayment: { type: mongoose.Schema.Types.ObjectId, ref: "Payment" },
    lastPaymentDate: { type: Date },
    
    accessStartDate: { type: Date, default: Date.now },
    accessEndDate: { type: Date },

    isActive: { type: Boolean, default: true },
    isBlocked: { type: Boolean, default: false },

    attendance: { type: [attendanceSchema], default: [] },
    notes: { type: String },
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true }, 
    toObject: { virtuals: true }
  }
);

enrollmentSchema.index({ student: 1, class: 1 }, { unique: true });

// --- VIRTUALS & MIDDLEWARE ---
enrollmentSchema.virtual('isExpired').get(function() {
  if (!this.accessEndDate) return false;
  return new Date() > this.accessEndDate;
});

enrollmentSchema.post(['find', 'findOne'], async function(docs) {
  if (!docs) return;
  const enrollments = Array.isArray(docs) ? docs : [docs];
  const now = new Date();
  const updates = [];

  for (const doc of enrollments) {
    if (doc.isActive && doc.accessEndDate && now > doc.accessEndDate) {
      doc.isActive = false;
      doc.paymentStatus = 'expired';
      updates.push(mongoose.model("Enrollment").updateOne(
        { _id: doc._id },
        { $set: { isActive: false, paymentStatus: 'expired' } }
      ));
    }
  }
  if (updates.length > 0) Promise.all(updates).catch(e => console.error("Auto-expire failed", e));
});

// --- METHODS ---

/**
 * Marks enrollment as paid.
 * IF targetMonth is provided, extends access to the end of THAT month.
 */
enrollmentSchema.methods.markPaid = async function (
  paymentDate = new Date(),
  paymentId = null,
  targetMonth = null // <--- NEW PARAM
) {
  this.paymentStatus = "paid";
  this.isActive = true;
  this.lastPaymentDate = paymentDate;
  if (paymentId) this.lastPayment = paymentId;

  // --- LOGIC: Access End Date ---
  if (targetMonth) {
      // 1. Add to paid history if unique
      if (!this.paidMonths.includes(targetMonth)) {
          this.paidMonths.push(targetMonth);
          this.paidMonths.sort(); // Keep sorted
      }

      // 2. Extend Access
      // If paying for a future month, extend expiration to end of that month.
      const targetEndDate = getEndOfTargetMonth(targetMonth);
      
      // Only extend if the new date is further in the future than current
      if (!this.accessEndDate || targetEndDate > this.accessEndDate) {
          this.accessEndDate = targetEndDate;
      }
  } else {
      // Fallback: End of current month of payment date
      const currentMonthEnd = getEndOfMonth(paymentDate);
      if (!this.accessEndDate || currentMonthEnd > this.accessEndDate) {
          this.accessEndDate = currentMonthEnd;
      }
  }

  return this.save();
};

enrollmentSchema.methods.revokeAccess = async function () {
  this.isActive = false;
  this.paymentStatus = "expired";
  return this.save();
};

export default mongoose.model("Enrollment", enrollmentSchema);