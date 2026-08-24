import mongoose from "mongoose";

const videoProgressSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    videoId: {
      type: String,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["started", "completed"],
      default: "started",
    },
  },
  { timestamps: true }
);

// A student can only have one progress record per video
videoProgressSchema.index({ student: 1, videoId: 1 }, { unique: true });

export default mongoose.model("VideoProgress", videoProgressSchema);
