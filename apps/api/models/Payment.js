// models/Payment.js
import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    enrollment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Enrollment",
      required: true,
      index: true,
    },
    targetMonth: { type: String }, // Format: "YYYY-MM"
    amount: { type: Number, required: true, min: 0 },

    // PayHere fields (optional; filled from IPN)
    payhere_order_id: { type: String, index: true }, // your order_id you sent to PayHere
    payhere_payment_id: { type: String, index: true }, // PayHere's internal id if provided
    payhere_currency: { type: String },
    payhere_status_code: { type: Number }, // PayHere status code (2 = success etc)
    payhere_md5sig: { type: String },

    paymentDate: { type: Date, required: true, default: Date.now },
    method: {
      type: String,
      enum: ["bank_transfer", "payhere", "manual"],
      required: true,
      default: "payhere",
    },
    transactionId: { type: String, unique: true, sparse: true }, // your txn id or Payhere txn
    status: {
      type: String,
      enum: ["completed", "pending", "failed"],
      default: "completed",
    },
    notes: { type: String },

    // store raw payload for troubleshooting & audit
    rawPayload: { type: mongoose.Schema.Types.Mixed },

    // mark whether IPN verification passed
    verified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

paymentSchema.index({ enrollment: 1, paymentDate: -1 });

export default mongoose.model("Payment", paymentSchema);
