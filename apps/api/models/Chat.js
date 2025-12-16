import mongoose from "mongoose";

const { Schema } = mongoose;

const chatSchema = new Schema(
  {
    ticket: { type: Schema.Types.ObjectId, ref: "Ticket", required: true, index: true },
    sender: { type: Schema.Types.ObjectId, ref: "User", required: true },
    senderRole: { type: String, enum: ["student", "admin"], required: true },
    // Optional denormalized display info for quick rendering
    senderName: { type: String },
    senderAvatar: { type: String },
    message: { type: String, required: true },
  },
  { timestamps: true }
);

chatSchema.index({ ticket: 1, createdAt: 1 });

const Chat = mongoose.model("Chat", chatSchema);
export default Chat;
