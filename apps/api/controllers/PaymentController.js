// controllers/paymentController.js
import crypto from "crypto";
import Payment from "../models/Payment.js";
import Enrollment from "../models/Enrollment.js";

/**
 * Helper: compute PayHere md5sig verification string
 * Formula from PayHere docs:
 * md5sig = strtoupper(
 *   md5 (
 *     merchant_id +
 *     order_id +
 *     payhere_amount +
 *     payhere_currency +
 *     status_code +
 *     strtoupper(md5(merchant_secret))
 *   )
 * )
 *
 * Make sure to cast numbers/strings exactly as PayHere sends them (strings)
 */
function computePayHereMd5sig({ merchant_id, order_id, payhere_amount, payhere_currency, status_code, merchant_secret }) {
  const secretHash = crypto.createHash("md5").update(merchant_secret).digest("hex").toUpperCase();
  const payload = `${merchant_id}${order_id}${payhere_amount}${payhere_currency}${status_code}${secretHash}`;
  const md5 = crypto.createHash("md5").update(payload).digest("hex").toUpperCase();
  return md5;
}

/**
 * PayHere IPN / notify_url handler
 * Endpoint: POST /api/payments/payhere-webhook
 *
 * Notes:
 * - PayHere sends urlencoded form data.
 * - Use express.urlencoded() middleware on the route.
 * - The function verifies md5sig, creates (or updates) a Payment record,
 *   and updates Enrollment (markPaid) when appropriate.
 *
 * Important: ensure process.env.PAYHERE_MERCHANT_ID and process.env.PAYHERE_MERCHANT_SECRET are configured.
 *
 * Documentation reference: PayHere md5sig & IPN verification. :contentReference[oaicite:2]{index=2}
 */


export const createPayHereSignature = async (req, res) => {
    try {
        const { amount, order_id, currency } = req.body;
        const merchantId = process.env.PAYHERE_MERCHANT_ID;
        const merchantSecret = process.env.PAYHERE_MERCHANT_SECRET;
        console.log("Generating PayHere signature for:", { amount, order_id, currency });
        console.log("Using Merchant ID:", merchantId);
        console.log("Using Merchant Secret:", merchantSecret);

        if (!merchantId || !merchantSecret) {
            return res.status(500).json({ error: "PayHere merchant credentials not configured" });
        }
        // Step 1: Format Amount to exactly 2 decimal places (No commas)
        // Example: 2500 -> "2500.00"
        const amountFormatted = parseFloat(amount)
            .toLocaleString('en-us', { minimumFractionDigits: 2 })
            .replace(/,/g, '');

        // Step 2: Generate the UPPERCASE MD5 of the Merchant Secret
        const hashedSecret = crypto.createHash('md5')
            .update(merchantSecret)
            .digest('hex')
            .toUpperCase();

        // Step 3: Concatenate exactly as per docs: ID + ORDER + AMOUNT + CURRENCY + HASHED_SECRET
        const mainString = merchantId + order_id + amountFormatted + currency + hashedSecret;

        // Step 4: Generate final UPPERCASE MD5 hash
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
export const payHereWebhook = async (req, res) => {
  console.log("🔔 PayHere Webhook Hit!", req.body); // <--- ADD THIS
  try {
    const body = req.body; // payhere posts urlencoded body
    // Example fields from PayHere: merchant_id, order_id, payhere_amount, payhere_currency, status_code, md5sig, etc.
    const {
      merchant_id,
      order_id,
      payhere_amount,
      payhere_currency,
      status_code, // integer code
      md5sig,
      // optional fields PayHere may include:
      payhere_payment_id,
      custom_1, // if you passed custom fields (useful to include enrollment id)
      custom_2,
    } = body;

    // minimal validation
    if (!merchant_id || !order_id || !payhere_amount || !payhere_currency || typeof status_code === "undefined" || !md5sig) {
      console.warn("PayHere: missing required fields in IPN", body);
      return res.status(400).send("Missing fields");
    }

    // compute expected md5sig (uses your merchant secret)
    const computed = computePayHereMd5sig({
      merchant_id,
      order_id,
      payhere_amount,
      payhere_currency,
      status_code,
      merchant_secret: process.env.PAYHERE_MERCHANT_SECRET,
    });

    const verified = computed === md5sig.toUpperCase();

    // find payment by payhere_order_id OR create new
    let payment = await Payment.findOne({ payhere_order_id: order_id });

    const enrollmentId = custom_1 || body.enrollment_id || null; // if you included enrollment_id in the form
    const amount = Number(payhere_amount);

    if (!payment) {
      payment = new Payment({
        enrollment: enrollmentId, // may be null; we try to attach later
        amount,
        gateway: "payhere",
        payhere_order_id: order_id,
        payhere_payment_id: payhere_payment_id || undefined,
        payhere_currency,
        payhere_status_code: Number(status_code),
        payhere_md5sig: md5sig,
        paymentDate: new Date(),
        method: "payhere",
        status: Number(status_code) === 2 ? "completed" : Number(status_code) === 0 ? "pending" : "failed",
        rawPayload: body,
        verified,
      });
    } else {
      // update existing
      payment.payhere_payment_id = payhere_payment_id || payment.payhere_payment_id;
      payment.payhere_currency = payhere_currency;
      payment.payhere_status_code = Number(status_code);
      payment.payhere_md5sig = md5sig;
      payment.status = Number(status_code) === 2 ? "completed" : Number(status_code) === 0 ? "pending" : "failed";
      payment.rawPayload = body;
      payment.verified = verified;
      payment.amount = amount || payment.amount;
    }

    // If enrollment not attached, try to find by order_id mapping:
    if ((!payment.enrollment || !payment.enrollment.toString()) && enrollmentId) {
      // attach observed enrollment
      payment.enrollment = enrollmentId;
    }

    await payment.save();

    // If verified and successful (status_code === 2) -> mark enrollment as paid
    // (this uses your Enrollment model method markPaid which you provided earlier)
    if (verified && Number(status_code) === 2) {
      try {
        if (payment.enrollment) {
          const enrollment = await Enrollment.findById(payment.enrollment);
          if (enrollment) {
            // use the convenience method markPaid you added to the Enrollment model
            // set nextPaymentDate to end of next month logic or however you wish
            await enrollment.markPaid(new Date(), payment.paymentDate);
          } else {
            console.warn("PayHere webhook: enrollment id attached to payment not found:", payment.enrollment);
          }
        } else {
          console.warn("PayHere webhook: payment has no enrollment attached (order_id => %s)", order_id);
        }
      } catch (e) {
        console.error("Error updating enrollment after payment:", e);
      }
    }

    // Always return 200 to PayHere so they won't retry (unless you want PayHere to retry)
    // But only mark verified payments as trusted in DB. Non-verified saved for audit.
    return res.status(200).send("OK");
  } catch (err) {
    console.error("Error in PayHere webhook:", err);
    // respond 500 so PayHere may retry depending on configuration
    return res.status(500).send("Server error");
  }
};


/**
 * Create payment (admin/manual)
 * POST /api/payments
 */
export const createPayment = async (req, res) => {
  try {
    const { enrollment, amount, method = "manual", transactionId, notes } = req.body;
    if (!enrollment || typeof amount === "undefined") {
      return res.status(400).json({ message: "enrollment and amount are required" });
    }

    const p = new Payment({
      enrollment,
      amount,
      method,
      transactionId,
      notes,
      gateway: method === "payhere" ? "payhere" : "manual",
      status: "completed",
      verified: method !== "payhere", // manual payments considered verified by admin
      paymentDate: new Date(),
    });

    const saved = await p.save();

    // update Enrollment if needed
    try {
      const enrollmentDoc = await Enrollment.findById(enrollment);
      if (enrollmentDoc) {
        await enrollmentDoc.markPaid(new Date(), null);
      }
    } catch (e) {
      // log but don't fail response
      console.warn("Failed to update enrollment after manual payment:", e);
    }

    return res.status(201).json(saved);
  } catch (err) {
    console.error("Error creating payment:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * GET /api/payments/:id
 */
export const getPaymentById = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id).populate("enrollment");
    if (!payment) return res.status(404).json({ message: "Payment not found" });
    res.json(payment);
  } catch (err) {
    console.error("Error fetching payment:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * GET /api/payments
 * Query params: ?enrollment=...&status=completed&gateway=payhere
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
      // FIX: Use nested population to get Student AND Class details inside Enrollment
      .populate({
        path: "enrollment",
        populate: [
          { path: "student", select: "firstName lastName email" }, // Get Student Info
          { path: "class", select: "name" }                        // Get Class Name
        ]
      });

    res.json(payments);
  } catch (err) {
    console.error("Error listing payments:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const uploadPaymentSlip = async (req, res) => {
  try {
    const { enrollmentId, notes } = req.body;
    
    // 1. Check if file exists
    if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
    }

    if (!enrollmentId) {
        return res.status(400).json({ message: "Enrollment ID is required" });
    }

    // 2. Construct File Path (Store relative path)
    // Assuming you serve the 'uploads' folder statically
    const filePath = `/uploads/images/payments/${req.file.filename}`;

    // 3. Create Payment Record (Pending Verification)
    const payment = new Payment({
        enrollment: enrollmentId,
        amount: 0, // Admin will verify amount from slip
        method: "bank_transfer",
        status: "pending", // Pending admin approval
        verified: false,
        paymentDate: new Date(),
        notes: notes,
        // You might need to add a 'slipImage' field to your Payment Model
        // Or store it in 'rawPayload' if you don't want to change schema yet
        rawPayload: { slipUrl: filePath } 
    });

    await payment.save();

    res.status(201).json({ 
        success: true, 
        message: "Slip uploaded successfully", 
        payment 
    });

  } catch (err) {
    console.error("Error uploading slip:", err);
    res.status(500).json({ message: "Server error during upload" });
  }
};

/**
 * Update Payment Status (Admin Verify)
 * PUT /api/v1/payments/:id
 * Body: { status: "completed" | "failed" }
 */
export const updatePaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["completed", "failed", "pending"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const payment = await Payment.findById(id);
    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    // Update status
    payment.status = status;
    payment.verified = status === "completed"; // Mark verified if completed
    await payment.save();

    // IF APPROVED: Update Enrollment to "Paid"
    if (status === "completed" && payment.enrollment) {
        try {
            const enrollment = await Enrollment.findById(payment.enrollment);
            if (enrollment) {
                // Use your existing markPaid logic
                await enrollment.markPaid(new Date(), payment.paymentDate);
            }
        } catch (err) {
            console.error("Error updating enrollment status:", err);
            // Don't fail the response, just log the error
        }
    }

    res.json({ success: true, payment });
  } catch (err) {
    console.error("Error updating payment:", err);
    res.status(500).json({ message: "Server error" });
  }
};