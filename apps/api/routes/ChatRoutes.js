import express from "express";
import { getChatsByTicketId, addChatMessage, uploadTicketAttachment } from "../controllers/ChatController.js";
import { protect } from "../middlewares/AuthMiddleware.js";
import { chatUploader } from "../middlewares/UploadMiddleware.js";

const router = express.Router();

// Get chats for a specific ticket
router.get("/:ticketId", protect, getChatsByTicketId);

// Upload attachment for ticket chat
router.post("/upload", protect, chatUploader, uploadTicketAttachment);

// Add new chat message
router.post("/", protect, addChatMessage);

export default router;
