import express from "express";
import { getChatsByTicketId, addChatMessage } from "../controllers/ChatController.js";

const router = express.Router();

// Get chats for a specific ticket
router.get("/:ticketId", getChatsByTicketId);

// Add new chat message
router.post("/", addChatMessage);

export default router;
