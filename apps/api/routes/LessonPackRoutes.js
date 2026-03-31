import express from "express";
import {
    createLessonPack,
    getAllLessonPacks,
    getLessonPackById,
    updateLessonPack,
    deleteLessonPack,
    togglePublishStatus
} from "../controllers/LessonPackController.js";

import { protect, restrictTo } from "../middlewares/AuthMiddleware.js";
import createUploader from "../middlewares/UploadMiddleware.js";

const router = express.Router();
const coverUploader = createUploader('images/lesson-packs', 'coverImage');

// ==========================================
// PUBLIC/STUDENT ROUTES
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

export default router;