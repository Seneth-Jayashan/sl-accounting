import crypto from "crypto";
import Payment from "../models/Payment.js";
import Enrollment from "../models/Enrollment.js";
import Class from "../models/Class.js";
import { sendAdminPaymentNotificationSms, sendPaymentReceiptSms, sendPaymentVerifiedSms } from "../utils/sms/Template.js";
const adminPhoneNumber = process.env.ADMIN_PHONE_NUMBER || "+94703999709";

// --- HELPERS ---

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

const formatPayHereAmount = (amount) => {
    return parseFloat(amount)
        .toLocaleString('en-us', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        .replace(/,/g, '');
};

/**
 * CORE LOGIC: Cascade Approval
 * When Primary Enrollment (Theory) is paid, update siblings (Revision/Paper).
 * Handles 'targetMonth' to correctly extend access dates.
 */
const approveBundleEnrollments = async (primaryEnrollmentId, paymentId, paymentDate, targetMonth) => {
    // 1. Fetch Primary Enrollment
    const primary = await Enrollment.findById(primaryEnrollmentId).populate('class');
    if (!primary) return;

    // 2. Mark Primary as Paid (Pass targetMonth)
    await primary.markPaid(paymentDate, paymentId, targetMonth);

    // 3. Identify Linked Bundles
    const classDoc = primary.class;
    const bundleClassIds = [];
    if (classDoc.linkedRevisionClass) bundleClassIds.push(classDoc.linkedRevisionClass);
    if (classDoc.linkedPaperClass) bundleClassIds.push(classDoc.linkedPaperClass);

    if (bundleClassIds.length === 0) return;

    // 4. Find Sibling Enrollments
    const siblings = await Enrollment.find({
        student: primary.student,
        class: { $in: bundleClassIds }
    });

    // 5. Mark Siblings as Paid (Pass targetMonth)
    for (const sibling of siblings) {
        await sibling.markPaid(paymentDate, paymentId, targetMonth);
    }
    
    console.log(`Bundle Approval: Paid Primary ${primary._id} and ${siblings.length} siblings for ${targetMonth || 'current month'}.`);
};


// --- CONTROLLERS ---

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

export const payHereWebhook = async (req, res) => {
  try {
    const {
      merchant_id,
      order_id,
      payhere_amount,
      payhere_currency,
      status_code,
      md5sig,
      custom_1, // Enrollment ID
      custom_2, // Target Month (YYYY-MM)
      payment_id
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
    const targetMonth = custom_2; 

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
        targetMonth: targetMonth 
      });
    }

    payment.status = paymentStatus;
    payment.payhere_status_code = Number(status_code);
    payment.payhere_payment_id = payment_id;
    payment.payhere_md5sig = md5sig;
    payment.rawPayload = req.body;

    if (!payment.enrollment && enrollmentId) payment.enrollment = enrollmentId;

    await payment.save();

    if (isSuccess && payment.enrollment) {
        try {
            await approveBundleEnrollments(payment.enrollment, payment._id, new Date(), targetMonth);
        } catch (e) {
            console.error("Failed to update bundle enrollments from webhook:", e.message);
        }
    }

    const enrollment = await Enrollment.findById(payment.enrollment)
      .populate('student', 'firstName phoneNumber') 
      .populate('class', 'name');;

    await sendPaymentReceiptSms(
        enrollment.student.phoneNumber,
        payment.amount,
        enrollment.class.name,
        order_id
    ).catch(err => console.error("Failed to send payment receipt SMS:", err));

    return res.status(200).send("OK");

  } catch (err) {
    console.error("PayHere Webhook Error:", err);
    return res.status(500).send("Server Error");
  }
};

export const uploadPaymentSlip = async (req, res) => {
  try {
    const { enrollmentId, amount, notes, targetMonth } = req.body;

    // 1. Input Validation
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });
    if (!enrollmentId) return res.status(400).json({ message: "Enrollment ID required" });
    if (!amount) return res.status(400).json({ message: "Paid Amount required" });

    // 2. Check if Enrollment exists BEFORE saving payment
    // Using distinct populate syntax: path first, then select fields
    const enrollment = await Enrollment.findById(enrollmentId)
      .populate('student', 'firstName phoneNumber') 
      .populate('class', 'name');

    if (!enrollment) {
      return res.status(404).json({ message: "Enrollment not found" });
    }

    const filePath = `/uploads/images/payments/${req.file.filename}`;

    // 3. Create Payment Record
    const payment = new Payment({
      enrollment: enrollmentId,
      amount: amount,
      method: "bank_transfer",
      status: "pending",
      verified: false,
      paymentDate: new Date(),
      notes: notes,
      targetMonth: targetMonth,
      rawPayload: { slipUrl: filePath }
    });

    await payment.save();

    enrollment.paymentStatus = "pending";
    await enrollment.save();

    try {
        await sendAdminPaymentNotificationSms(
            adminPhoneNumber,
            enrollment.student.firstName, // Ensure student is populated
            amount,
            enrollment.class.name,        // Ensure class is populated
            payment._id
        );
    } catch (smsError) {
        console.error("Failed to send Admin SMS:", smsError);
    }

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

export const createPayment = async (req, res) => {
  try {
    const { enrollment, amount, transactionId, notes, targetMonth } = req.body;
    
    if (!enrollment || amount === undefined) {
      return res.status(400).json({ message: "Enrollment and Amount required" });
    }

    const payment = new Payment({
      enrollment,
      amount,
      method: "manual",
      transactionId,
      notes,
      targetMonth, 
      gateway: "manual",
      status: "completed",
      verified: true, 
      paymentDate: new Date(),
    });

    await payment.save();

    if (enrollment) {
        await approveBundleEnrollments(enrollment, payment._id, new Date(), targetMonth);
    }

    return res.status(201).json({ success: true, payment });

  } catch (err) {
    console.error("Create Payment Error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

export const updatePaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; 

    // 1. Validation
    if (!["completed", "failed", "pending"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    // 2. Find and Populate
    // We must populate enrollment -> student AND enrollment -> class to get phone/names
    const payment = await Payment.findById(id).populate({
      path: 'enrollment',
      populate: { path: 'student class' } 
    });

    if (!payment) return res.status(404).json({ message: "Payment not found" });

    // 3. Update Status
    payment.status = status;
    payment.verified = (status === "completed");
    
    // 4. Save Changes FIRST (Before sending SMS)
    await payment.save();

    // 5. Handle "Completed" Logic (SMS + Bundle Unlock)
    if (status === "completed" && payment.enrollment) {
        
        // A. Trigger Bundle Logic
        // payment.enrollment is now an Object (due to populate). 
        // If approveBundleEnrollments expects an ID, pass payment.enrollment._id
        await approveBundleEnrollments(
            payment.enrollment._id, 
            payment._id, 
            payment.paymentDate, 
            payment.targetMonth
        );

        // B. Send SMS (Non-blocking)
        sendPaymentVerifiedSms(
            payment.enrollment.student.phoneNumber,
            payment.amount,
            payment.enrollment.class.name
        ).catch(err => console.error("Failed to send payment verified SMS:", err));
    }

    res.json({ success: true, payment });

  } catch (err) {
    console.error("Update Status Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ... (getPaymentById, listPayments, getMyPayments remain same)
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
  
export const getMyPayments = async (req, res) => {
    try {
      const userId = req.user._id;
      const myEnrollments = await Enrollment.find({ student: userId }).select('_id');
      const enrollmentIds = myEnrollments.map(e => e._id);
  
      if (enrollmentIds.length === 0) {
          return res.json([]); 
      }
  
      const payments = await Payment.find({ enrollment: { $in: enrollmentIds } })
        .sort({ createdAt: -1 })
        .populate({
          path: "enrollment",
          select: "class", 
          populate: { path: "class", select: "name" } 
        });
  
      res.json(payments);
  
    } catch (err) {
      console.error("Get My Payments Error:", err);
      res.status(500).json({ message: "Server error fetching payment history" });
    }
};