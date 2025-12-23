import mongoose from "mongoose";

const knowledgeSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String },
    filePath: { type: String },
    fileName: { type: String },
    fileMime: { type: String },
    publishAt: { type: Date },
    category: { type: String },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    isPublished: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

export default mongoose.model("KnowledgeBase", knowledgeSchema);
