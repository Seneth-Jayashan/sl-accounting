import mongoose from "mongoose";

const { Schema } = mongoose;

const chatAttachmentSchema = new Schema(
  {
    url: { type: String, required: true },
    fileType: { type: String, enum: ["image", "file"], required: true },
    originalName: { type: String },
    fileName: { type: String },
    fileSize: { type: Number },
    mimeType: { type: String },
  },
  { _id: false }
);

const chatSchema = new Schema(
  {
    ticket: { type: Schema.Types.ObjectId, ref: "Ticket", required: true, index: true },
    sender: { type: Schema.Types.ObjectId, ref: "User", required: true },
    senderRole: { type: String, enum: ["student", "admin"], required: true },
    // Optional denormalized display info for quick rendering
    senderName: { type: String },
    senderAvatar: { type: String },
    clientMessageId: { type: String, index: true },
    message: { type: String, default: "" },
    attachments: { type: [chatAttachmentSchema], default: [] },
  },
  { timestamps: true }
);

chatSchema.pre("validate", function (next) {
  const hasMessage = typeof this.message === "string" && this.message.trim().length > 0;
  const hasAttachments = Array.isArray(this.attachments) && this.attachments.length > 0;

  if (!hasMessage && !hasAttachments) {
    this.invalidate("message", "Message or attachment required");
  }
  next();
});

chatSchema.index({ ticket: 1, createdAt: 1 });

const Chat = mongoose.model("Chat", chatSchema);
export default Chat;
