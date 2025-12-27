import mongoose from "mongoose";

const materialSchema = new mongoose.Schema({
    title: { 
        type: String, 
        required: [true, "Please provide a title for the material"], 
        trim: true 
    },
    description: { 
        type: String, 
        trim: true 
    },
    // The URL where the file is stored (e.g., Cloudinary or S3)
    fileUrl: { 
        type: String, 
        required: [true, "File URL is required"] 
    },
    // Helps the frontend identify the icon to show (pdf, doc, image, etc.)
    fileType: { 
        type: String, 
        required: true,
        enum: ["pdf", "pptx", "docx", "image", "other"]
    },
    fileSize: { 
        type: String // e.g., "2.4 MB"
    },
    // Linking to the Class
    class: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Class", 
        required: true,
        index: true 
    },
    isPublished: { 
        type: Boolean, 
        default: true 
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for class details if needed for Admin view
materialSchema.virtual("classDetails", {
    ref: "Class",
    localField: "class",
    foreignField: "_id",
    justOne: true
});

export default mongoose.model("Material", materialSchema);