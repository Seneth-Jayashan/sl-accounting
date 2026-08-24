import mongoose from "mongoose";

const paperSubmissionSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    paperName: { type: String, required: true, trim: true },
    year: { type: Number, required: true },
    examDetails: { type: String, trim: true },
    fileUrl: { type: String, required: true },
    status: { type: String, enum: ["Pending", "Graded"], default: "Pending" },
    marks: { type: Number, default: null },
    feedback: { type: String, trim: true, default: "" }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

export default mongoose.model("PaperSubmission", paperSubmissionSchema);
