import express from "express";
import {
  createPayment,
  getPaymentById,
  listPayments,
  payHereWebhook,
  createPayHereSignature,
  uploadPaymentSlip,
  updatePaymentStatus
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
// No validation middleware here; PayHere sends specific form-data we manually verify in controller
router.post("/payhere-webhook", express.urlencoded({ extended: true }), payHereWebhook);

// ==========================================
// 2. PROTECTED ROUTES
// ==========================================
router.use(protect);

// PayHere: Step 1 (Student clicks "Pay Now")
router.post("/initiate", validate(initiatePayHereSchema), createPayHereSignature);

// Bank Transfer: Step 1 (Student uploads slip)
// NOTE: Uploader MUST run before Validator to parse the FormData body
router.post("/upload-slip", PaymentSlipUploader, validate(uploadSlipSchema), uploadPaymentSlip);

// View Payment Details
router.get("/:id", validate(paymentIdSchema), getPaymentById);

// ==========================================
// 3. ADMIN ROUTES
// ==========================================
router.use(restrictTo("admin"));

router.get("/", listPayments); // Query params validation optional, usually safe

// Manual "Cash" payment entry
router.post("/", validate(createPaymentSchema), createPayment);

// Approve/Reject slips
router.put("/:id", validate(updatePaymentStatusSchema), updatePaymentStatus);

export default router;