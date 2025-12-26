import crypto from "crypto";
import Payment from "../models/Payment.js";
import Enrollment from "../models/Enrollment.js";

// --- HELPERS ---

/**
 * Compute PayHere md5sig for verification
 */
function computePayHereMd5sig({ merchant_id, order_id, payhere_amount, payhere_currency, status_code, merchant_secret }) {
  const secretHash = crypto.createHash("md5")
    .update(merchant_secret)
    .digest("hex")
    .toUpperCase();

  const payload = `${merchant_id}${order_id}${payhere_amount}${payhere_currency}${status_code}${secretHash}`;
  
  return crypto.createHash("md5")
    .update(payload)
    .digest("hex")
    .toUpperCase();
}

/**
 * Helper to ensure amount is always "1000.00" format
 */
const formatPayHereAmount = (amount) => {
    return parseFloat(amount)
        .toLocaleString('en-us', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        .replace(/,/g, '');
};

// --- CONTROLLERS ---

/**
 * 1. Generate PayHere Hash (Student Side)
 * Called before opening the PayHere popup
 */
export const createPayHereSignature = async (req, res) => {
    try {
        const { amount, order_id, currency = "LKR" } = req.body;
        const merchantId = process.env.PAYHERE_MERCHANT_ID;
        const merchantSecret = process.env.PAYHERE_MERCHANT_SECRET;

        if (!merchantId || !merchantSecret) {
            return res.status(500).json({ error: "Server misconfiguration: PayHere credentials missing" });
        }

        // 1. Strict Formatting (Crucial for Hash Matching)
        const amountFormatted = formatPayHereAmount(amount);

        // 2. Hash Secret
        const hashedSecret = crypto.createHash('md5')
            .update(merchantSecret)
            .digest('hex')
            .toUpperCase();

        // 3. Create String: merchant_id + order_id + amount + currency + hashed_secret
        const mainString = merchantId + order_id + amountFormatted + currency + hashedSecret;

        // 4. Final Hash
        const hash = crypto.createHash('md5')
            .update(mainString)
            .digest('hex')
            .toUpperCase();

        // Return exact data needed by frontend PayHere SDK
        res.json({
            merchant_id: merchantId,
            hash: hash,
            amount: amountFormatted,
            order_id: order_id,
            currency: currency
        });

    } catch (err) {
        console.error("Signature Generation Error:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

/**
 * 2. PayHere Webhook (Server-to-Server)
 * Validates payment and updates DB
 */
export const payHereWebhook = async (req, res) => {
  // console.log("🔔 PayHere Webhook:", req.body); // Uncomment for debugging
  try {
    const {
      merchant_id,
      order_id,
      payhere_amount,
      payhere_currency,
      status_code,
      md5sig,
      custom_1, // We assume custom_1 holds 'enrollment_id'
      payhere_payment_id
    } = req.body;

    // 1. Validate Payload
    if (!merchant_id || !md5sig) {
      return res.status(400).send("Invalid Payload");
    }

    // 2. Verify Signature
    const computedSig = computePayHereMd5sig({
      merchant_id,
      order_id,
      payhere_amount,
      payhere_currency,
      status_code,
      merchant_secret: process.env.PAYHERE_MERCHANT_SECRET,
    });

    if (computedSig !== md5sig.toUpperCase()) {
      console.error(`PayHere Signature Mismatch! Order: ${order_id}`);
      return res.status(400).send("Signature verification failed");
    }

    // 3. Determine Payment Status
    // 2 = Success, 0 = Pending, -1 = Canceled, -2 = Failed
    const isSuccess = Number(status_code) === 2;
    const paymentStatus = isSuccess ? "completed" : Number(status_code) === 0 ? "pending" : "failed";

    // 4. Find or Create Payment
    let payment = await Payment.findOne({ payhere_order_id: order_id });
    const enrollmentId = custom_1 || req.body.enrollment_id;

    if (!payment) {
      payment = new Payment({
        enrollment: enrollmentId || undefined,
        amount: Number(payhere_amount),
        gateway: "payhere",
        payhere_order_id: order_id,
        payhere_currency,
        paymentDate: new Date(),
        method: "payhere",
        verified: isSuccess, // Auto-verify if success
      });
    }

    // Update fields
    payment.status = paymentStatus;
    payment.payhere_status_code = Number(status_code);
    payment.payhere_payment_id = payhere_payment_id;
    payment.payhere_md5sig = md5sig;
    payment.rawPayload = req.body;

    // Attach enrollment if found late
    if (!payment.enrollment && enrollmentId) payment.enrollment = enrollmentId;

    await payment.save();

    // 5. Update Enrollment Access (If Success)
    if (isSuccess && payment.enrollment) {
        try {
            const enrollment = await Enrollment.findById(payment.enrollment);
            if (enrollment) {
                await enrollment.markPaid(new Date(), payment.paymentDate);
            }
        } catch (e) {
            console.error("Failed to update enrollment from webhook:", e.message);
        }
    }

    return res.status(200).send("OK");

  } catch (err) {
    console.error("PayHere Webhook Error:", err);
    return res.status(500).send("Server Error");
  }
};

/**
 * 3. Upload Bank Slip (Student Side)
 */
export const uploadPaymentSlip = async (req, res) => {
  try {
    const { enrollmentId, notes } = req.body;
    
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });
    if (!enrollmentId) return res.status(400).json({ message: "Enrollment ID required" });

    // Path relative to public/uploads
    const filePath = `/uploads/images/payments/${req.file.filename}`;

    const payment = new Payment({
        enrollment: enrollmentId,
        amount: 0, // Amount is unknown until admin verifies slip
        method: "bank_transfer",
        status: "pending", 
        verified: false,
        paymentDate: new Date(),
        notes: notes,
        rawPayload: { slipUrl: filePath } // Storing slip path here
    });

    await payment.save();

    res.status(201).json({ 
        success: true, 
        message: "Slip uploaded. Pending Admin approval.", 
        payment 
    });

  } catch (err) {
    console.error("Upload Slip Error:", err);
    res.status(500).json({ message: "Upload failed" });
  }
};

/**
 * 4. Create Manual Payment (Admin Only)
 * Used for Cash payments or manual overrides
 */
export const createPayment = async (req, res) => {
  try {
    const { enrollment, amount, transactionId, notes } = req.body;
    
    // Validate
    if (!enrollment || amount === undefined) {
      return res.status(400).json({ message: "Enrollment and Amount required" });
    }

    const payment = new Payment({
      enrollment,
      amount,
      method: "manual",
      transactionId,
      notes,
      gateway: "manual",
      status: "completed",
      verified: true, // Admin created = Verified
      paymentDate: new Date(),
    });

    await payment.save();

    // Auto-update enrollment
    const enrollmentDoc = await Enrollment.findById(enrollment);
    if (enrollmentDoc) {
        await enrollmentDoc.markPaid(new Date(), null);
    }

    return res.status(201).json({ success: true, payment });

  } catch (err) {
    console.error("Create Payment Error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * 5. Update Payment Status (Admin Only)
 * Used to Approve/Reject Bank Slips
 */
export const updatePaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // "completed" or "failed"

    if (!["completed", "failed", "pending"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const payment = await Payment.findById(id);
    if (!payment) return res.status(404).json({ message: "Payment not found" });

    payment.status = status;
    payment.verified = (status === "completed");
    
    await payment.save();

    // If Approved -> Grant Access
    if (status === "completed" && payment.enrollment) {
        const enrollment = await Enrollment.findById(payment.enrollment);
        if (enrollment) {
            await enrollment.markPaid(new Date(), payment.paymentDate);
        }
    }

    res.json({ success: true, payment });

  } catch (err) {
    console.error("Update Status Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * 6. Get Payment By ID
 */
export const getPaymentById = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
        .populate({
            path: "enrollment",
            select: "student class",
            populate: { path: "class", select: "name price" }
        });

    if (!payment) return res.status(404).json({ message: "Payment not found" });
    res.json(payment);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * 7. List Payments (Admin Only)
 */
export const listPayments = async (req, res) => {
  try {
    const filter = {};
    if (req.query.enrollment) filter.enrollment = req.query.enrollment;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.gateway) filter.gateway = req.query.gateway;

    const payments = await Payment.find(filter)
      .sort({ createdAt: -1 })
      .limit(200)
      .populate({
        path: "enrollment",
        populate: [
          { path: "student", select: "firstName lastName email" },
          { path: "class", select: "name" }
        ]
      });

    res.json(payments);
  } catch (err) {
    console.error("List Payments Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};