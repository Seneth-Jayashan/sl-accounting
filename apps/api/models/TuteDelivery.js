import mongoose from "mongoose";

const tuteDeliverySchema = new mongoose.Schema(
  {
    enrollment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Enrollment",
      required: true,
      index: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true,
    },
    payment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payment",
    },
    // Which month's tute is this? (e.g., "2026-02")
    targetMonth: { type: String, required: true, index: true },

    status: {
      type: String,
      enum: ["pending", "shipped", "delivered"],
      default: "pending",
      index: true
    },
    
    // Delivery Details
    sentAt: { type: Date },
    trackingId: { type: String }, // SL Post Tracking Number
    courierService: { type: String, default: "SL Post" },
    
    // Snapshot of address at time of payment (in case they move)
    deliveryAddress: { type: String },
    receiverName: { type: String },
  },
  { timestamps: true }
);

// Prevent duplicate delivery records for the same student+class+month
tuteDeliverySchema.index({ enrollment: 1, targetMonth: 1 }, { unique: true });

export default mongoose.model("TuteDelivery", tuteDeliverySchema);