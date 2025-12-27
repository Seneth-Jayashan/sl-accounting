import express from "express";
import AnnouncementController from "../controllers/AnnouncementController.js";
import { protect, restrictTo } from "../middlewares/AuthMiddleware.js";

const router = express.Router();

// ==========================================
// STUDENT ROUTES
// ==========================================

// Changed to POST because student is sending classId in req.body
router.post(
    "/view-class", 
    protect, 
    AnnouncementController.getStudentAnnouncements
);

// ==========================================
// ADMIN ROUTES (Full CRUD)
// ==========================================

// Create a new announcement
router.post(
    "/", 
    protect, 
    restrictTo("admin"), 
    AnnouncementController.createAnnouncement
);

// Get all announcements (for Admin Dashboard)
router.get(
    "/", 
    protect, 
    restrictTo("admin"), 
    AnnouncementController.getAllAnnouncements
);

// Edit announcement content/title
router.put(
    "/:id", 
    protect, 
    restrictTo("admin"), 
    AnnouncementController.updateAnnouncement
);

// Toggle Publish/Unpublish status
router.patch(
    "/:id/visibility", 
    protect, 
    restrictTo("admin"), 
    AnnouncementController.toggleVisibility
);

// Delete announcement
router.delete(
    "/:id", 
    protect, 
    restrictTo("admin"), 
    AnnouncementController.deleteAnnouncement
);

export default router;