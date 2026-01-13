// models/Session.js
import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema({
  class: { type: mongoose.Schema.Types.ObjectId, ref: "Class", required: true, index: true },

  index: { type: Number, required: true },

  startAt: { type: Date, required: true, index: true },
  endAt: { type: Date, required: true },

  timezone: { type: String, default: process.env.DEFAULT_TIMEZONE || "UTC" },

  zoomMeetingId: { type: String },   
  zoomStartUrl: { type: String },    
  zoomJoinUrl: { type: String },     
  youtubeVideoId: { type: String },  
  recordingShared: { type: Boolean, default: false },

  attendance: [
    {
      student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User", // Assuming 'User' is the student model
        required: true
      },
      joinedAt: { type: Date, required: true },
      leftAt: { type: Date },
      durationMinutes: { type: Number, min: 0, default: 0 },
      _id: false
    }
  ],


  notes: { type: String },

  isCancelled: { type: Boolean, default: false },
  cancelledAt: { type: Date },
  cancellationReason: { type: String },

}, { timestamps: true });

sessionSchema.index({ class: 1, index: 1 }, { unique: true });


sessionSchema.methods.markAttendanceStart = async function (studentId, joinedAt = new Date()) {
  const exists = (this.attendance || []).some(a => a.student.toString() === studentId.toString());
  if (!exists) {
    this.attendance.push({ student: studentId, joinedAt });
    await this.save();
  }
  return this;
};

sessionSchema.methods.markAttendanceEnd = async function (studentId, leftAt = new Date()) {
  const record = (this.attendance || []).find(a => a.student.toString() === studentId.toString());
  if (!record) return this;
  record.leftAt = leftAt;
  if (record.joinedAt) {
    const diff = (new Date(leftAt).getTime() - new Date(record.joinedAt).getTime());
    record.durationMinutes = Math.max(0, Math.round(diff / (1000 * 60)));
  }
  await this.save();
  return this;
};

export default mongoose.model("Session", sessionSchema);
