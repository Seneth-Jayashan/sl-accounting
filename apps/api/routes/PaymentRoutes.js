import express from "express";
import {
  createPayment,
  getPaymentById,
  listPayments,
  payHereWebhook,
  createPayHereSignature,
  uploadPaymentSlip,
  updatePaymentStatus,
  getPaymentReport,
  getMyPayments
} from "../controllers/PaymentController.js"; 
import { protect, restrictTo } from "../middlewares/AuthMiddleware.js";
import createUploader from "../middlewares/UploadMiddleware.js";
import { 
  validate, 
  initiatePayHereSchema, 
  uploadSlipSchema, 
  createPaymentSchema, 
  updatePaymentStatusSchema,
  paymentIdSchema
} from "../validators/PaymentValidator.js";

const PaymentSlipUploader = createUploader('images/payments', 'slip');

const router = express.Router();

// ==========================================
// 1. PUBLIC / CALLBACKS
// ==========================================
router.post("/payhere-webhook", express.urlencoded({ extended: true }), payHereWebhook);

// ==========================================
// 2. PROTECTED ROUTES (Logged In Users)
// ==========================================
router.use(protect);

// --- My Payments ---
router.get("/my-payments", getMyPayments);

// --- PayHere Initiate ---
router.post("/initiate", validate(initiatePayHereSchema), createPayHereSignature);

// --- Upload Slip ---
router.post("/upload-slip", PaymentSlipUploader, validate(uploadSlipSchema), uploadPaymentSlip);

// ==========================================
// 3. ADMIN ROUTES (Specific Paths First)
// ==========================================

// Report Route (MUST be before /:id)
// We apply restrictTo("admin") inline here to keep route ordering clean
router.get("/report/summary", restrictTo("admin"), getPaymentReport);

// List All Payments (Admin)
router.get("/", restrictTo("admin"), listPayments);

// Create Manual Payment (Admin)
router.post("/", restrictTo("admin"), validate(createPaymentSchema), createPayment);

// ==========================================
// 4. DYNAMIC ROUTES (Must be Last)
// ==========================================

// Get Payment Details by ID
// (If this was above /report/summary, "report" would be treated as an ID)
router.get("/:id", validate(paymentIdSchema), getPaymentById);

// Verify/Reject Payment (Admin)
router.put("/:id", restrictTo("admin"), validate(updatePaymentStatusSchema), updatePaymentStatus);

export default router;