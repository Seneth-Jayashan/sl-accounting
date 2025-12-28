import Ticket from "../models/Ticket.js";
import User from "../models/User.js";
import Notification from "../models/Notification.js";
import Chat from "../models/Chat.js";
import { getIO } from "../config/socket.js";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const getApiRootDir = () => path.resolve(__dirname, "..");
const getChatFilesDir = () => path.join(getApiRootDir(), "uploads", "chat-files");

const getSafeFileName = (value) => {
  if (!value || typeof value !== "string") return null;
  const base = path.basename(value);
  return base && base !== "." && base !== ".." ? base : null;
};

const extractChatAttachmentFileName = (attachment) => {
  if (!attachment) return null;

  // Preferred: server-stored filename
  const direct = getSafeFileName(attachment.fileName);
  if (direct) return direct;

  // Fallback: parse from url like /uploads/chat-files/<name>
  if (typeof attachment.url === "string" && attachment.url.includes("/uploads/chat-files/")) {
    const maybeName = attachment.url.split("/").pop();
    return getSafeFileName(maybeName);
  }

  return null;
};

const collectChatAttachmentFileNames = (chats) => {
  const names = new Set();
  for (const chat of chats || []) {
    const attachments = Array.isArray(chat.attachments) ? chat.attachments : [];
    for (const a of attachments) {
      const name = extractChatAttachmentFileName(a);
      if (name) names.add(name);
    }
  }
  return Array.from(names);
};

const deleteChatAttachmentFiles = async (fileNames) => {
  if (!Array.isArray(fileNames) || fileNames.length === 0) return;

  const chatFilesDir = getChatFilesDir();
  await Promise.allSettled(
    fileNames.map(async (fileName) => {
      const safe = getSafeFileName(fileName);
      if (!safe) return;
      const absolutePath = path.join(chatFilesDir, safe);
      try {
        await fs.unlink(absolutePath);
      } catch (err) {
        // ignore missing files
        if (err && (err.code === "ENOENT" || err.code === "ENOTDIR")) return;
        console.error("Failed to delete chat attachment:", absolutePath, err?.message || err);
      }
    })
  );
};

const broadcastTicketStatus = (ticket) => {
  try {
    const io = getIO();
    const payload = {
      _id: ticket._id?.toString?.() || ticket._id,
      user_id: ticket.user_id?.toString?.() || ticket.user_id,
      status: ticket.status,
      name: ticket.name,
      email: ticket.email,
      phoneNumber: ticket.phoneNumber,
      Categories: ticket.Categories,
      message: ticket.message,
      priority: ticket.priority,
      createdAt: ticket.createdAt,
      updatedAt: ticket.updatedAt,
    };

    io.to(`ticket_${payload._id}`).emit("ticket_status_updated", payload);
  } catch (err) {
    console.error("Failed to broadcast ticket status", err?.message || err);
  }
};

const broadcastTicketCreated = (ticket) => {
  try {
    const io = getIO();
    const payload = {
      _id: ticket._id?.toString?.() || ticket._id,
      user_id: ticket.user_id?.toString?.() || ticket.user_id,
      status: ticket.status,
      name: ticket.name,
      email: ticket.email,
      phoneNumber: ticket.phoneNumber,
      Categories: ticket.Categories,
      message: ticket.message,
      priority: ticket.priority,
      createdAt: ticket.createdAt,
      updatedAt: ticket.updatedAt,
    };

    io.emit("ticket_created", payload);
  } catch (err) {
    console.error("Failed to broadcast ticket creation", err?.message || err);
  }
};

// Get all tickets
const getAllTickets = async (req, res) => {
  try {
    const tickets = await Ticket.find();
    return res.status(200).json({ tickets });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to fetch tickets" });
  }
};

// Get tickets by user ID
const getTicketsByUserID = async (req, res) => {
  try {
    const tickets = await Ticket.find({ user_id: req.params.user_id });
    return res.status(200).json({ tickets });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to fetch user tickets" });
  }
};

// Add new ticket (NO ticket_id — MongoDB _id is used)
const addTicket = async (req, res) => {
  const { user_id, name, email, phoneNumber, Categories, message, priority } =
    req.body;

  try {
    const ticket = new Ticket({
      name,
      user_id,
      email,
      phoneNumber,
      Categories,
      message,
      priority,
    });

    await ticket.save();

    // Notify user (use `user` field as defined in Notification schema)
    await Notification.create({
      user: user_id,
      message: `Your ticket has been created successfully. Ticket ID: ${ticket._id}`,
    });

    // Notify all customer supporters
    const supporters = await User.find({ role: "customer_supporter" });
    const supporterNotifications = supporters.map((support) => ({
      user: support._id,
      message: `New support ticket requires attention. Ticket ID: ${ticket._id}`,
    }));

    await Notification.insertMany(supporterNotifications);

    broadcastTicketCreated(ticket);

    return res.status(200).json({ ticket });
  } catch (err) {
    console.error("Add ticket error:", err);
    return res.status(500).json({ message: "Failed to add ticket" });
  }
};

// Get ticket by _id
const getTicketByID = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    return res.status(200).json({ ticket });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to fetch ticket" });
  }
};

// Update ticket by _id
const updateTicket = async (req, res) => {
  const { name, email, phoneNumber, Categories, message, status, priority } =
    req.body;

  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: "Ticket not found" });

    if (!req.user)
      return res.status(401).json({ message: "Not authenticated" });
    const isAdmin = req.user.role === "admin";
    const isOwner = ticket.user_id?.toString() === req.user._id.toString();
    if (!isAdmin && !isOwner) {
      return res
        .status(403)
        .json({ message: "Forbidden: cannot update this ticket" });
    }

    const isClosing =
      typeof status === "string" && status.toLowerCase() === "closed";
    if (isClosing && !isAdmin) {
      return res
        .status(403)
        .json({ message: "Forbidden: only admins can close tickets" });
    }

    // Admin can close only after user resolves
    if (isClosing && isAdmin) {
      const current = String(ticket.status || "").toLowerCase();
      if (current !== "resolved") {
        return res.status(400).json({
          message: "Ticket must be Resolved before it can be Closed",
        });
      }
    }

    ticket.name = name ?? ticket.name;
    ticket.email = email ?? ticket.email;
    ticket.phoneNumber = phoneNumber ?? ticket.phoneNumber;
    ticket.Categories = Categories ?? ticket.Categories;
    ticket.message = message ?? ticket.message;
    ticket.priority = priority ?? ticket.priority;
    if (typeof status === "string") ticket.status = status;

    await ticket.save();

    if (typeof status === "string") {
      await Notification.create({
        user: ticket.user_id,
        message: `Your ticket status has been updated to ${ticket.status}. Ticket ID: ${ticket._id}`,
      });

      broadcastTicketStatus(ticket);
    }

    return res.status(200).json({ ticket });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to update ticket" });
  }
};

// Delete ticket by _id
const deleteTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) return res.status(404).json({ message: "Ticket not found" });

    // Remove associated chat messages + attached media for this ticket
    try {
      const chats = await Chat.find({ ticket: ticket._id })
        .select("attachments")
        .lean();
      const fileNames = collectChatAttachmentFileNames(chats);
      await deleteChatAttachmentFiles(fileNames);
      await Chat.deleteMany({ ticket: ticket._id });
    } catch (chatErr) {
      console.error("Failed to delete related chats/media:", chatErr);
    }

    await ticket.deleteOne();

    // Notify user (best-effort)
    try {
      await Notification.create({
        user: ticket.user_id,
        message: `Your ticket has been deleted. Ticket ID: ${ticket._id}`,
      });
    } catch (notifyErr) {
      console.error("Failed to create delete notification:", notifyErr);
    }

    return res.status(200).json({ ticket });
  } catch (err) {
    console.error("Delete ticket error:", err);
    return res.status(500).json({ message: "Failed to delete ticket" });
  }
};

// Bulk delete tickets by ids (admin only)
const deleteTicketsBulk = async (req, res) => {
  try {
    const idsRaw = req.body?.ids || req.body?.ticketIds || req.body?.ticket_ids;
    const ids = Array.isArray(idsRaw)
      ? [...new Set(idsRaw.map((x) => String(x)).filter(Boolean))]
      : [];

    if (!ids.length) {
      return res.status(400).json({ message: "No ticket ids provided" });
    }

    // Fetch tickets first (for notifications + to know what we're deleting)
    const tickets = await Ticket.find({ _id: { $in: ids } }).lean();
    if (!tickets.length) {
      return res.status(404).json({ message: "No matching tickets found" });
    }

    const deletedIds = tickets.map((t) => t._id?.toString?.() || String(t._id));

    // Delete related chats + attached media
    try {
      const chats = await Chat.find({ ticket: { $in: deletedIds } })
        .select("attachments")
        .lean();
      const fileNames = collectChatAttachmentFileNames(chats);
      await deleteChatAttachmentFiles(fileNames);
      await Chat.deleteMany({ ticket: { $in: deletedIds } });
    } catch (chatErr) {
      console.error("Failed to delete related chats/media (bulk):", chatErr);
    }

    // Delete tickets
    const ticketDeleteResult = await Ticket.deleteMany({ _id: { $in: deletedIds } });

    // Notify affected users (best-effort)
    try {
      const notifications = tickets
        .filter((t) => t.user_id)
        .map((t) => ({
          user: t.user_id,
          message: `Your ticket has been deleted. Ticket ID: ${t._id}`,
        }));
      if (notifications.length) await Notification.insertMany(notifications);
    } catch (notifyErr) {
      console.error("Failed to create notifications (bulk):", notifyErr);
    }

    return res.status(200).json({
      deletedIds,
      deletedCount: ticketDeleteResult?.deletedCount || deletedIds.length,
    });
  } catch (err) {
    console.error("Bulk delete tickets error:", err);
    return res.status(500).json({ message: "Failed to bulk delete tickets" });
  }
};

export default {
  getAllTickets,
  getTicketsByUserID,
  addTicket,
  getTicketByID,
  updateTicket,
  deleteTicket,
  deleteTicketsBulk,
};
