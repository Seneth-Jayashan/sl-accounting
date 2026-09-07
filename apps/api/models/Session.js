// models/Session.js
import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema({
  class: { type: mongoose.Schema.Types.ObjectId, ref: "Class", required: true, index: true },

  index: { type: Number, required: true },
  title: { type: String, trim: true },

  startAt: { type: Date, required: true, index: true },
  endAt: { type: Date, required: true },

  timezone: { type: String, default: process.env.DEFAULT_TIMEZONE || "UTC" },

  zoomMeetingId: { type: String },   
  zoomStartUrl: { type: String },    
  zoomJoinUrl: { type: String },     
  youtubeVideoId: { type: String },  
  recordingTitle: { type: String, trim: true },
  recordingCategory: { type: String, trim: true },
  recordingShared: { type: Boolean, default: false },


  notes: { type: String },

  isCancelled: { type: Boolean, default: false },
  cancelledAt: { type: Date },
  cancellationReason: { type: String },

}, { timestamps: true });

sessionSchema.index({ class: 1, index: 1 }, { unique: true });




export default mongoose.model("Session", sessionSchema);
