import express from "express";
import { 
    getClassMessages, 
    saveMessage, 
    uploadAttachment,
    deleteMessage
} from "../controllers/ClassChatController.js";
import { protect } from "../middlewares/AuthMiddleware.js";
import { chatUploader } from "../middlewares/UploadMiddleware.js"; // <--- Import named export

const router = express.Router();

// @route   GET /api/chats/class/:classId
router.get("/class/:classId", protect, getClassMessages);

// @route   POST /api/chats/class
router.post("/class", protect, saveMessage);

// @route   POST /api/chats/upload
// @desc    Upload file for chat
router.post("/upload", protect, chatUploader, uploadAttachment);

// @route   DELETE /api/chats/class/:id
router.delete("/message/:id", protect, deleteMessage);

export default router;