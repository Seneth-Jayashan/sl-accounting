import express from "express";
import { protect, restrictTo } from "../middlewares/AuthMiddleware.js";
import { createDocumentUploader } from "../middlewares/UploadMiddleware.js";
import PaperSubmissionController from "../controllers/PaperSubmissionController.js";

const router = express.Router();

// Document uploader configuration
const uploadDocument = createDocumentUploader("essay-submissions", "file", 20);

// Student routes
router.post(
    "/",
    protect,
    restrictTo("student"),
    uploadDocument,
    PaperSubmissionController.submitPaper
);

router.get(
    "/student",
    protect,
    restrictTo("student"),
    PaperSubmissionController.getStudentSubmissions
);

// Admin routes
router.get(
    "/",
    protect,
    restrictTo("admin", "teacher"),
    PaperSubmissionController.getAllSubmissions
);

router.put(
    "/:id/grade",
    protect,
    restrictTo("admin", "teacher"),
    PaperSubmissionController.gradeSubmission
);

export default router;
