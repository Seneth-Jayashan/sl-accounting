import mongoose from "mongoose";

export const batchSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    description: { type: String },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    classes: [{ type: mongoose.Schema.Types.ObjectId, ref: "Class" }],
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);
export default mongoose.model("Batch", batchSchema);
