import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema({
  session: { type: mongoose.Schema.Types.ObjectId, ref: "Session", required: true, index: true },
  class: { type: mongoose.Schema.Types.ObjectId, ref: "Class", required: true, index: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  joinedAt: { type: Date, required: true, default: Date.now }
}, { timestamps: true });

// Prevent duplicate attendance records for the same student in the same session
attendanceSchema.index({ session: 1, student: 1 }, { unique: true });

export default mongoose.model("Attendance", attendanceSchema);
