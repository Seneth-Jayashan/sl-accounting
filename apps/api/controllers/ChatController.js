import Chat from "../models/Chat.js";
import User from "../models/User.js";

// Get all chat messages for a specific ticket
export const getChatsByTicketId = async (req, res) => {
  try {
    const chats = await Chat.find({ ticket: req.params.ticketId })
      .sort({ createdAt: 1 });

    res.status(200).json(chats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Add a new chat message
export const addChatMessage = async (req, res) => {
  try {
    const { ticket, sender, senderRole, message, attachments, clientMessageId } = req.body;

    // Prefer authenticated user if middleware is applied
    const effectiveSender = req.user?._id?.toString?.() ? req.user._id : sender;
    const effectiveRole = req.user?.role || senderRole;

    let senderName = undefined;
    let senderAvatar = undefined;

    // Fetch user for denormalized display fields
    const user = effectiveSender ? await User.findById(effectiveSender).lean() : null;
    if (user) {
      senderName = `${user.firstName || ""} ${user.lastName || ""}`.trim();
      senderAvatar = user.profilePic || undefined;
    }

    const newChat = new Chat({
      ticket,
      sender: effectiveSender,
      senderRole: effectiveRole,
      senderName,
      senderAvatar,
      clientMessageId,
      message: message || "",
      attachments: Array.isArray(attachments) ? attachments : [],
    });

    await newChat.save();

    res.status(201).json(newChat);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Upload attachment for ticket chat
// POST /api/v1/chats/upload
export const uploadTicketAttachment = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    const fileUrl = `/uploads/chat-files/${req.file.filename}`;
    const isImage = req.file.mimetype?.startsWith("image/");

    res.status(200).json({
      success: true,
      attachment: {
        url: fileUrl,
        fileType: isImage ? "image" : "file",
        originalName: req.file.originalname,
        fileName: req.file.filename,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
      },
    });
  } catch (error) {
    console.error("Ticket chat upload error:", error);
    res.status(500).json({ success: false, message: "File upload failed" });
  }
};
