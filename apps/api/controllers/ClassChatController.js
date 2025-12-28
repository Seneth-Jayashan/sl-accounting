import ClassChat from "../models/ClassChat.js";
import Class from "../models/Class.js";
import fs from 'fs'; // Import File System
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// @desc    Get chat history for a specific class
// @route   GET /api/chats/class/:classId
export const getClassMessages = async (req, res) => {
  try {
    const { classId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    // 1. SECURITY: Verify Enrollment (If Student)
    if (req.user.role === "student") {
      const targetClass = await Class.findById(classId).select("batch");
      
      if (!targetClass) {
        return res.status(404).json({ success: false, message: "Class not found" });
      }

      // Handle cases where batch might be an object (populated) or a string ID
      const studentBatchId = req.user.batch.toString() || req.user.batch?.toString();
      const classBatchId = targetClass.batch?.toString();

      if (!studentBatchId || studentBatchId !== classBatchId) {
        console.log("Unauthorized chat access attempt by user:", req.user._id);
        return res.status(403).json({ success: false, message: "Unauthorized: You are not enrolled in this class." });
      }
    }

    // 2. Fetch Messages
    const messages = await ClassChat.find({ classId })
      .sort({ createdAt: -1 }) // Newest first
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();

    // Reverse to show Oldest -> Newest
    res.status(200).json({
      success: true,
      messages: messages.reverse(),
      page: Number(page)
    });

  } catch (error) {
    console.error("Chat History Error:", error);
    res.status(500).json({ success: false, message: "Failed to load messages" });
  }
};

// @desc    Save message (REST Fallback)
// @route   POST /api/chats/class
export const saveMessage = async (req, res) => {
  try {
    const { classId, message, attachments } = req.body;

    // Validation: Must have classId AND (message text OR attachments)
    if (!classId || (!message && (!attachments || attachments.length === 0))) {
      return res.status(400).json({ success: false, message: "Message or attachment required" });
    }

    const newChat = await ClassChat.create({
      classId,
      sender: req.user._id,
      senderRole: req.user.role,
      senderName: `${req.user.firstName} ${req.user.lastName}`,
      senderAvatar: req.user.profileImage,
      message: message || "", // Default to empty string if sending only file
      attachments: attachments || [] // Save attachments array
    });

    res.status(201).json({ success: true, message: newChat });
  } catch (error) {
    console.error("Save Message Error:", error);
    res.status(500).json({ success: false, message: "Failed to send message" });
  }
};

// @desc    Upload attachment for chat
// @route   POST /api/chats/upload
export const uploadAttachment = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    // Construct File URL (Adjust based on your server setup/static folder)
    // If you serve 'uploads' statically:
    const fileUrl = `/uploads/chat-files/${req.file.filename}`; 
    
    // Determine type
    const isImage = req.file.mimetype.startsWith('image/');
    const fileType = isImage ? 'image' : 'file';

    res.status(200).json({
      success: true,
      attachment: {
        url: fileUrl,
        fileType,
        originalName: req.file.originalname
      }
    });
  } catch (error) {
    console.error("Upload Error:", error);
    res.status(500).json({ success: false, message: "File upload failed" });
  }
};

export const deleteMessage = async (req, res) => {
  try {
    const { id } = req.params;

    const chat = await ClassChat.findById(id);

    if (!chat) {
      return res.status(404).json({ success: false, message: "Message not found" });
    }

    // Security: Only Admins can delete
    if (req.user.role !== 'admin') {
         return res.status(403).json({ success: false, message: "Not authorized to delete messages" });
    }

    // --- NEW: Delete Physical Files ---
    if (chat.attachments && chat.attachments.length > 0) {
        chat.attachments.forEach((file) => {
            try {
                // 1. Get the relative path stored in DB (e.g., "/uploads/chat-files/image.png")
                // Remove the leading slash to join correctly
                const relativePath = file.url.startsWith('/') ? file.url.slice(1) : file.url;
                
                // 2. Resolve to absolute server path
                // Assumes 'uploads' folder is at 'apps/api/uploads' and this controller is in 'apps/api/controllers'
                const absolutePath = path.join(__dirname, '..', relativePath);

                // 3. Delete File
                if (fs.existsSync(absolutePath)) {
                    fs.unlinkSync(absolutePath);
                    console.log(`Deleted file: ${absolutePath}`);
                }
            } catch (err) {
                console.error(`Failed to delete attachment file: ${file.url}`, err);
                // Continue deleting the message even if file deletion fails
            }
        });
    }

    // Delete Database Record
    await chat.deleteOne();

    // Notify Socket Room
    const { getIO } = await import("../config/socket.js");
    const io = getIO();
    io.to(`class_${chat.classId}`).emit("message_deleted", { messageId: id });

    res.status(200).json({ success: true, message: "Message and attachments deleted successfully" });

  } catch (error) {
    console.error("Delete Error:", error);
    res.status(500).json({ success: false, message: "Failed to delete message" });
  }
};