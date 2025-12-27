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
 */
export const createPayHereSignature = async (req, res) => {
    try {
        const { amount, order_id, currency = "LKR" } = req.body;
        const merchantId = process.env.PAYHERE_MERCHANT_ID;
        const merchantSecret = process.env.PAYHERE_MERCHANT_SECRET;

        if (!merchantId || !merchantSecret) {
            return res.status(500).json({ error: "Server misconfiguration: PayHere credentials missing" });
        }

        const amountFormatted = formatPayHereAmount(amount);

        const hashedSecret = crypto.createHash('md5')
            .update(merchantSecret)
            .digest('hex')
            .toUpperCase();

        const mainString = merchantId + order_id + amountFormatted + currency + hashedSecret;

        const hash = crypto.createHash('md5')
            .update(mainString)
            .digest('hex')
            .toUpperCase();

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
 */
export const payHereWebhook = async (req, res) => {
  try {
    const {
      merchant_id,
      order_id,
      payhere_amount,
      payhere_currency,
      status_code,
      md5sig,
      custom_1, 
      payhere_payment_id
    } = req.body;

    if (!merchant_id || !md5sig) {
      return res.status(400).send("Invalid Payload");
    }

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

    const isSuccess = Number(status_code) === 2;
    const paymentStatus = isSuccess ? "completed" : Number(status_code) === 0 ? "pending" : "failed";

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
        verified: isSuccess, 
      });
    }

    payment.status = paymentStatus;
    payment.payhere_status_code = Number(status_code);
    payment.payhere_payment_id = payhere_payment_id;
    payment.payhere_md5sig = md5sig;
    payment.rawPayload = req.body;

    if (!payment.enrollment && enrollmentId) payment.enrollment = enrollmentId;

    await payment.save();

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
    const { enrollmentId, amount, notes } = req.body;
    
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });
    if (!enrollmentId) return res.status(400).json({ message: "Enrollment ID required" });
    if (!amount) return res.status(400).json({ message: "Paid Amount required" });

    const filePath = `/uploads/images/payments/${req.file.filename}`;

    const payment = new Payment({
        enrollment: enrollmentId,
        amount: amount, 
        method: "bank_transfer",
        status: "pending", 
        verified: false,
        paymentDate: new Date(),
        notes: notes,
        rawPayload: { slipUrl: filePath } 
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
 */
export const createPayment = async (req, res) => {
  try {
    const { enrollment, amount, transactionId, notes } = req.body;
    
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
      verified: true, 
      paymentDate: new Date(),
    });

    await payment.save();

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
 */
export const updatePaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; 

    if (!["completed", "failed", "pending"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const payment = await Payment.findById(id);
    if (!payment) return res.status(404).json({ message: "Payment not found" });

    payment.status = status;
    payment.verified = (status === "completed");
    
    await payment.save();

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

// ==========================================
// 8. NEW: Get My Payments (Logged In User)
// ==========================================
export const getMyPayments = async (req, res) => {
  try {
    const userId = req.user._id;

    // 1. Find all Enrollments belonging to the user
    const myEnrollments = await Enrollment.find({ student: userId }).select('_id');
    const enrollmentIds = myEnrollments.map(e => e._id);

    if (enrollmentIds.length === 0) {
        return res.json([]); // No enrollments = No payments
    }

    // 2. Find Payments linked to those enrollments
    const payments = await Payment.find({ enrollment: { $in: enrollmentIds } })
      .sort({ createdAt: -1 })
      .populate({
        path: "enrollment",
        select: "class", 
        populate: { path: "class", select: "name" } // Show class name in history
      });

    res.json(payments);

  } catch (err) {
    console.error("Get My Payments Error:", err);
    res.status(500).json({ message: "Server error fetching payment history" });
  }
};