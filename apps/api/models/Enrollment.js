import mongoose from "mongoose";

const getEndOfMonth = (date) => {
  const d = new Date(date);
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
};

const getEndOfTargetMonth = (monthString) => {
    // "2026-02" -> split -> [2026, 2]
    const [year, month] = monthString.split('-').map(Number);
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
      index: true,
    },
    lessonPack: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "LessonPack",
      index: true,
    },

    paidMonths: [{ type: String }],

    paymentStatus: {
      type: String,
      enum: ["paid", "unpaid", "pending", "expired"],
      default: "unpaid",
    },
    lastPayment: { type: mongoose.Schema.Types.ObjectId, ref: "Payment" },
    lastPaymentDate: { type: Date },
    
    accessStartDate: { type: Date, default: Date.now },
    accessEndDate: { type: Date }, // Will remain null for lifetime lesson packs

    isActive: { type: Boolean, default: true },
    isBlocked: { type: Boolean, default: false },

    attendance: { type: [attendanceSchema], default: [] },
    notes: { type: String },

    // Differentiates the logic flows
    subscriptionType: {
        type: String,
        enum: ["monthly", "one-time", "lifetime"],
        default: "monthly"
    }
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true }, 
    toObject: { virtuals: true }
  }
);

// --- FIX 1: Sparse Unique Indexes ---
// By adding `sparse: true`, MongoDB ignores null/undefined values in the unique check.
// This allows multiple students to have `class: null` (when buying lesson packs)
// and `lessonPack: null` (when buying classes) without throwing duplicate key errors.
enrollmentSchema.index(
  { student: 1, class: 1 }, 
  { 
    unique: true, 
    partialFilterExpression: { class: { $type: "objectId" } } 
  }
);

enrollmentSchema.index(
  { student: 1, lessonPack: 1 }, 
  { 
    unique: true, 
    partialFilterExpression: { lessonPack: { $type: "objectId" } } 
  }
);

enrollmentSchema.virtual('isExpired').get(function() {
  if (!this.accessEndDate) return false;
  return new Date() > this.accessEndDate;
});

enrollmentSchema.methods.markPaid = async function (
  paymentDate = new Date(),
  paymentId = null,
  targetMonth = null 
) {
  this.paymentStatus = "paid";
  this.isActive = true;
  this.lastPaymentDate = paymentDate;
  if (paymentId) this.lastPayment = paymentId;

  // --- FIX 2: Lifetime Access Bypass ---
  // If this is a lifetime lesson pack, we don't calculate end dates.
  if (this.subscriptionType === "lifetime" || this.subscriptionType === "one-time" || targetMonth === "Lifetime Access") {
      // Just save and return, no end date needed
      return this.save();
  }

  // --- Normal Monthly Class Logic ---
  if (targetMonth) {
      if (!this.paidMonths.includes(targetMonth)) {
          this.paidMonths.push(targetMonth);
          this.paidMonths.sort(); 
      }

      const targetEndDate = getEndOfTargetMonth(targetMonth);
      
      if (!this.accessEndDate || targetEndDate > this.accessEndDate) {
          this.accessEndDate = targetEndDate;
      }
  } else {
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