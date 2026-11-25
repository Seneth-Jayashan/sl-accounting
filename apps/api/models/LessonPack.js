import mongoose from "mongoose";

const videoSchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true },
    youtubeUrl: { type: String, required: true },
    youtubeId: { type: String, required: true },
    durationMinutes: { type: Number, default: 0 },
    order: { type: Number, default: 0 } // For sorting videos in the playlist
});

// Feature 2: Downloadable file attachments (PDF, Word, etc.)
const attachmentSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },   // Display name
    fileUrl: { type: String, required: true },            // /uploads/lesson-pack-files/...
    mimeType: { type: String },                           // e.g. application/pdf
    sizeBytes: { type: Number, default: 0 },
    order: { type: Number, default: 0 },
});

const lessonPackSchema = new mongoose.Schema({
    title: { 
        type: String, 
        required: [true, "Please provide a title"], 
        trim: true 
    },
    // Feature 3: Multiple batches — changed from single ObjectId to array
    batches: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Batch",
    }],
    // Keep legacy single-batch field for backward compat (will mirror batches[0])
    batch: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Batch",
    },
    description: { 
        type: String, 
        trim: true 
    },
    price: { 
        type: Number, 
        required: true,
        min: 0
    },
    coverImage: { 
        type: String,
        default: null 
    },
    // The Playlist
    videos: [videoSchema],

    // Feature 2: Downloadable files for students
    attachments: [attachmentSchema],
    
    // Status
    isPublished: { 
        type: Boolean, 
        default: false,
        index: true
    }
}, { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

export default mongoose.model("LessonPack", lessonPackSchema);