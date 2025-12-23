import Ticket from "../models/Ticket.js";
import User from "../models/User.js";
import Notification from "../models/Notification.js";
import Chat from "../models/Chat.js";
import { getIO } from "../config/socket.js";

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
    const ticket = await Ticket.findByIdAndDelete(req.params.id);

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    // Remove associated chat messages for this ticket
    try {
      await Chat.deleteMany({ ticket: ticket._id });
    } catch (chatErr) {
      console.error("Failed to delete related chats:", chatErr);
      // proceed even if chat deletion fails — ticket is already deleted
    }

    // Notify user
    await Notification.create({
      user: ticket.user_id,
      message: `Your ticket has been deleted. Ticket ID: ${ticket._id}`,
    });

    return res.status(200).json({ ticket });
  } catch (err) {
    console.error("Delete ticket error:", err);
    return res.status(500).json({ message: "Failed to delete ticket" });
  }
};

export default {
  getAllTickets,
  getTicketsByUserID,
  addTicket,
  getTicketByID,
  updateTicket,
  deleteTicket,
};
