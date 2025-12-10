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
    const { ticket, sender, senderRole, message } = req.body;

    let senderName = undefined;
    let senderAvatar = undefined;

    // Fetch user for denormalized display fields
    const user = await User.findById(sender).lean();
    if (user) {
      senderName = `${user.firstName || ""} ${user.lastName || ""}`.trim();
      senderAvatar = user.profilePic || undefined;
    }

    const newChat = new Chat({
      ticket,
      sender,
      senderRole,
      senderName,
      senderAvatar,
      message,
    });

    await newChat.save();

    res.status(201).json(newChat);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
