import mongoose from "mongoose";

const newsSchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    category: { type: String, enum: ["News", "Update"], default: "News" },
    coverImage: { type: String }, // Path to the uploaded image
    isPublished: { type: Boolean, default: true },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

export default mongoose.model("News", newsSchema);
