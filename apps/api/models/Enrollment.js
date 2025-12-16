import mongoose from "mongoose";

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
      enum: ["paid", "unpaid", "pending"],
      default: "unpaid",
    },
    lastPayment: { type: mongoose.Schema.Types.ObjectId, ref: "Payment" },
    lastPaymentDate: { type: Date },
    nextPaymentDate: { type: Date },
    accessStartDate: { type: Date, default: Date.now },
    accessEndDate: { type: Date },

    // Enrollment state
    isActive: { type: Boolean, default: true },
    isBlocked: { type: Boolean, default: false },

    // Attendance & progress
    attendance: { type: [attendanceSchema], default: [] },


    notes: { type: String },
  },
  { timestamps: true }
);

// Prevent duplicate enrollments for same student-class pair
enrollmentSchema.index({ student: 1, class: 1 }, { unique: true });

// Convenience method: mark payment
enrollmentSchema.methods.markPaid = async function (
  date = new Date(),
  nextDate = null
) {
  this.paymentStatus = "paid";
  this.lastPaymentDate = date;
  if (nextDate) this.nextPaymentDate = nextDate;
  return this.save();
};

// Convenience: revoke access
enrollmentSchema.methods.revokeAccess = async function () {
  this.isActive = false;
  return this.save();
};

export default mongoose.model("Enrollment", enrollmentSchema);
