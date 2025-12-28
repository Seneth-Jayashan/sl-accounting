import mongoose from "mongoose";

const classChatSchema = new mongoose.Schema({
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Class",
    required: true,
    index: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  senderRole: {
    type: String,
    enum: ["student", "admin", "instructor"],
    required: true
  },
  senderName: String,
  senderAvatar: String,
  
  message: {
    type: String,
    trim: true // Can be empty if sending only a file
  },
  
  // NEW: Store attachments
  attachments: [{
    url: { type: String, required: true },
    fileType: { type: String, enum: ['image', 'video', 'file'], default: 'file' },
    originalName: String
  }]
}, {
  timestamps: true 
});

const ClassChat = mongoose.model("ClassChat", classChatSchema);
export default ClassChat;