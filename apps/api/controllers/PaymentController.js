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
    
    if (!amount || !order_id) {
        return res.status(400).json({ message: "Amount and Order ID required" });
    }

    const merchantId = process.env.PAYHERE_MERCHANT_ID;
    const merchantSecret = process.env.PAYHERE_MERCHANT_SECRET; // Ensure this is in your .env

    if (!merchantId || !merchantSecret) {
        return res.status(500).json({ message: "PayHere config missing on server" });
    }

    // Format amount to 2 decimal places exactly
    const formattedAmount = Number(amount).toFixed(2);

    // Hashing Logic: md5(merchant_id + order_id + amount + currency + strtoupper(md5(merchant_secret))) 
    // *Note: PayHere hash generation for the REQUEST is different from the RESPONSE verification.*
    
    // 1. Hash the secret
    const hashedSecret = crypto.createHash("md5").update(merchantSecret).digest("hex").toUpperCase();

    // 2. Create the string
    const hashString = `${merchantId}${order_id}${formattedAmount}${currency}${hashedSecret}`;

    // 3. Final Hash
    const hash = crypto.createHash("md5").update(hashString).digest("hex").toUpperCase();

    res.json({
        merchant_id: merchantId,
        hash: hash,
        amount: formattedAmount,
        currency: currency
    });

  } catch (err) {
    console.error("Error generating signature:", err);
    res.status(500).json({ message: "Server error" });
  }
};


export const payHereWebhook = async (req, res) => {
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
      .populate("enrollment");

    res.json(payments);
  } catch (err) {
    console.error("Error listing payments:", err);
    res.status(500).json({ message: "Server error" });
  }
};
