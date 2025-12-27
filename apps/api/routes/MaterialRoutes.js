import express from "express";
import MaterialController from "../controllers/MaterialController.js";
import { protect, restrictTo } from "../middlewares/AuthMiddleware.js";
import { createDocumentUploader } from "../middlewares/UploadMiddleware.js";

const router = express.Router();

// Prepare the document uploader middleware
// Files will go to /uploads/materials
const uploadMiddleware = createDocumentUploader('materials', 'file', 25); // 25MB limit

// ==========================================
// ADMIN ROUTES
// ==========================================

/**
 * @route   POST /api/materials
 * @desc    Upload file to server and create DB record
 */
router.post(
    "/", 
    protect, 
    restrictTo("admin"), 
    uploadMiddleware, // This saves the file to the disk
    MaterialController.createMaterial
);

/**
 * @route   GET /api/materials
 * @desc    Get all materials (Admin view)
 */
router.get(
    "/", 
    protect, 
    restrictTo("admin"), 
    MaterialController.getAllMaterials
);

/**
 * @route   DELETE /api/materials/:id
 * @desc    Delete DB record and (optionally) file from server
 */
router.delete(
    "/:id", 
    protect, 
    restrictTo("admin"), 
    MaterialController.deleteMaterial
);

// ==========================================
// STUDENT ROUTES
// ==========================================

router.post(
    "/view-class", 
    protect, 
    MaterialController.getStudentMaterials
);

export default router;