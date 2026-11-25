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
      required: false,
      index: true,
    },
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Session",
      default: null,
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

// A student can only have one progress record per video or session
videoProgressSchema.index(
  { student: 1, videoId: 1 },
  { unique: true, partialFilterExpression: { videoId: { $type: "string" } } }
);
videoProgressSchema.index(
  { student: 1, sessionId: 1 },
  { unique: true, partialFilterExpression: { sessionId: { $type: "objectId" } } }
);

export default mongoose.model("VideoProgress", videoProgressSchema);
