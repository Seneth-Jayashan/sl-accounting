import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    enrollment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Enrollment",
      required: true,
      index: true,
    },
    
    // NEW: Which month is this payment covering? (e.g. "2026-02")
    targetMonth: { type: String }, 

    amount: { type: Number, required: true, min: 0 },

    // PayHere fields
    payhere_order_id: { type: String, index: true },
    payhere_payment_id: { type: String, index: true },
    payhere_currency: { type: String },
    payhere_status_code: { type: Number }, 
    payhere_md5sig: { type: String },

    paymentDate: { type: Date, required: true, default: Date.now },
    method: {
      type: String,
      enum: ["bank_transfer", "payhere", "manual"],
      required: true,
      default: "payhere",
    },
    transactionId: { type: String, unique: true, sparse: true }, 
    status: {
      type: String,
      enum: ["completed", "pending", "failed"],
      default: "completed",
    },
    notes: { type: String },
    rawPayload: { type: mongoose.Schema.Types.Mixed },
    verified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

paymentSchema.index({ enrollment: 1, paymentDate: -1 });

export default mongoose.model("Payment", paymentSchema);