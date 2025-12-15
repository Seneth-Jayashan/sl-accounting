import express from "express";
import {
  createPayment,
  getPaymentById,
  listPayments,
  payHereWebhook,
  createPayHereSignature // Import the new function
} from "../controllers/PaymentController.js"; // Adjust path matches your structure
import { protect, restrictTo } from "../middlewares/AuthMiddleware.js";

const router = express.Router();

// --- Public / Callback Routes ---
// PayHere sends data here (No auth middleware!)
router.post("/payhere-webhook", express.urlencoded({ extended: true }), payHereWebhook);

// --- Protected Routes ---

// Generate Hash for PayHere (Student clicking "Pay Now")
router.post("/initiate", protect, createPayHereSignature);

// Manual Bank Transfer Upload (Or Admin Manual Add)
router.post("/", protect, createPayment);

// Get Payment Details
router.get("/:id", protect, getPaymentById);

// List Payments (Admin Only)
router.get("/", protect, restrictTo("admin"), listPayments);

export default router;