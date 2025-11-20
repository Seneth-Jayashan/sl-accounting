import mongoose from "mongoose";

const announcementSchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true },

    class: { type: mongoose.Schema.Types.ObjectId, ref: "Class", index: true },

    isPublished: { type: Boolean, default: false },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

announcementSchema.virtual("classDetails", {
    ref: "Class",
    localField: "class",
    foreignField: "_id",
    justOne: true
});

export default mongoose.model("Announcement", announcementSchema);
