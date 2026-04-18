import mongoose from "mongoose";

const videoSchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true },
    youtubeUrl: { type: String, required: true },
    youtubeId: { type: String, required: true },
    durationMinutes: { type: Number, default: 0 },
    order: { type: Number, default: 0 } // For sorting videos in the playlist
});

const lessonPackSchema = new mongoose.Schema({
    title: { 
        type: String, 
        required: [true, "Please provide a title"], 
        trim: true 
    },
    batch: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Batch", 
        required: [true, "Please specify the batch"]
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