import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    enrollment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Enrollment",
      required: true,
      index: true,
    },
    amount: { type: Number, required: true, min: 0 },
    paymentDate: { type: Date, required: true, default: Date.now },
    method: {
      type: String,
      enum: ["credit_card", "bank_transfer", "cash", "paypal"],
      required: true,
    },
    transactionId: { type: String, unique: true, sparse: true },
    status: {
      type: String,
      enum: ["completed", "pending", "failed"],
      default: "completed",
    },
    notes: { type: String },
  },
  { timestamps: true }
);

paymentSchema.index({ enrollment: 1, paymentDate: -1 });

export default mongoose.model("Payment", paymentSchema);
