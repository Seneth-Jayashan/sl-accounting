import express from "express";
import {
    createLessonPack,
    getAllLessonPacks,
    getLessonPackById,
    updateLessonPack,
    deleteLessonPack,
    togglePublishStatus,
    getAllPublicLessonPacks,
    getPublicById,
    uploadAttachment,
    deleteAttachment
} from "../controllers/LessonPackController.js";

import { protect, restrictTo } from "../middlewares/AuthMiddleware.js";
import createUploader, { createDocumentUploader } from "../middlewares/UploadMiddleware.js";

const router = express.Router();
const coverUploader = createUploader('images/lesson-packs', 'coverImage');
const attachmentUploader = createDocumentUploader('lesson-pack-files', 'attachment', 20);

// ==========================================
// PUBLIC ROUTES
// ==========================================
router.get("/public", getAllPublicLessonPacks);  // <-- NEW
router.get("/public/:id", getPublicById);  // <-- NEW


// ==========================================
// STUDENT ROUTES
// ==========================================
router.get("/", protect, getAllLessonPacks);
router.get("/:id", protect, getLessonPackById); // <-- NEW

// ==========================================
// ADMIN & TEACHER ROUTES
// ==========================================
router.use(protect);
router.use(restrictTo("admin", "teacher"));

router.post("/", coverUploader, createLessonPack);
router.put("/:id", coverUploader, updateLessonPack);
router.delete("/:id", deleteLessonPack);
router.patch("/:id/publish", togglePublishStatus);
router.post("/:id/attachments", attachmentUploader, uploadAttachment);
router.delete("/:id/attachments/:attachmentId", deleteAttachment);

export default router;