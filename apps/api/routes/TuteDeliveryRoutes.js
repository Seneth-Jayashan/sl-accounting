import express from "express";
import { protect, restrictTo } from "../middlewares/AuthMiddleware.js";
import {
    getPendingDeliveries,
    markTuteAsSent,
    markTuteAsDelivered,
    getMyDeliveries,
    getDeliveries
} from "../controllers/TuteDeliveryController.js";

const router = express.Router();

// --- TEACHER / ADMIN ROUTES ---

router.get("/", protect, restrictTo("admin"), getDeliveries);

// 1. Get Pending Deliveries (For Teacher Dashboard)
router.get("/pending", protect, restrictTo("admin"), getPendingDeliveries);

// 2. Mark Tute as Sent (Teacher Action)
router.put("/:id/mark-sent", protect, restrictTo("admin"), markTuteAsSent);


// --- STUDENT ROUTES ---

// 3. Get My Delivery History (For Student Dashboard)
// This was missing in your code!
router.get("/my-deliveries", protect, getMyDeliveries);

// 4. Mark Tute as Delivered (Student confirms receipt)
router.put("/:id/mark-delivered", protect, markTuteAsDelivered);

export default router;