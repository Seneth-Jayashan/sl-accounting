import crypto from "crypto";
import Payment from "../models/Payment.js";
import Enrollment from "../models/Enrollment.js";
import Class from "../models/Class.js";
import TuteDelivery from "../models/TuteDelivery.js";
import moment from "moment";
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

const createTuteDeliveryRecord = async (payment, enrollmentId, targetMonth) => {
    try {
        if (!targetMonth) return; // Only physical tutes for monthly payments
        
        // Check if delivery record already exists for this month
        const exists = await TuteDelivery.findOne({ 
            enrollment: enrollmentId, 
            targetMonth: targetMonth 
        });

        if (exists) return;

        // Fetch student details for address snapshot
        const enrollment = await Enrollment.findById(enrollmentId).populate('student');
        if (!enrollment) return;

        const delivery = new TuteDelivery({
            enrollment: enrollmentId,
            student: enrollment.student._id,
            class: enrollment.class,
            payment: payment._id,
            targetMonth: targetMonth,
            status: "pending"
        });

        await delivery.save();
        console.log(`Tute Delivery Queued: ${enrollment.student.firstName} for ${targetMonth}`);

    } catch (err) {
        console.error("Failed to create Tute Delivery record:", err);
    }
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
            console.log(`Webhook: Approved enrollments for Payment ${payment._id} and Enrollment ${payment.enrollment} for ${targetMonth || 'current month'}.`);
            await createTuteDeliveryRecord(payment, payment.enrollment, targetMonth);
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

        await createTuteDeliveryRecord(payment, payment.enrollment._id, payment.targetMonth);

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


export const getPaymentReport = async (req, res) => {
  try {
    const { filterType, startDate, endDate, classId } = req.query;
    
    let query = { status: "completed" };
    if (classId) {
        const enrollments = await Enrollment.find({ class: classId }).select('_id');
        query.enrollment = { $in: enrollments.map(e => e._id) };
    }

    // --- Date Filtering Logic ---
    const now = new Date();
    let start, end;

    // Only apply date filters if NOT 'all_time'
    if (filterType !== 'all_time') {
        switch (filterType) {
            case "today":
                start = new Date(now.setHours(0,0,0,0));
                end = new Date(now.setHours(23,59,59,999));
                break;
            case "this_week":
                const day = now.getDay() || 7; 
                if(day !== 1) now.setHours(-24 * (day - 1)); 
                start = new Date(now.setHours(0,0,0,0));
                end = new Date(); 
                break;
            case "last_week":
                start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7); // Simplified
                end = now;
                break;
            case "this_month":
                start = new Date(now.getFullYear(), now.getMonth(), 1);
                end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                break;
            case "last_month":
                start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                end = new Date(now.getFullYear(), now.getMonth(), 0);
                break;
            case "custom":
                if (startDate && endDate) {
                    start = new Date(startDate);
                    end = new Date(endDate);
                    end.setHours(23, 59, 59, 999); 
                }
                break;
            default:
                // If no filter provided, default to 'this_month' to be safe, 
                // BUT if frontend sends 'all_time', we skip this switch entirely.
                start = new Date(now.getFullYear(), now.getMonth(), 1);
                end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        }
    }

    // Apply Date Query only if start/end exist
    if (start && end) {
        query.paymentDate = { $gte: start, $lte: end };
    }

    // --- Execute Query ---
    const payments = await Payment.find(query)
        .populate({
            path: "enrollment",
            select: "student class",
            populate: [
                { path: "student", select: "firstName lastName phoneNumber email" },
                { path: "class", select: "name" }
            ]
        })
        .sort({ paymentDate: -1 });

    // --- Summarize Data ---
    const totalAmount = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
    
    // For 'all_time', we might not have a precise start/end, so we can send null or the range of data found
    const periodStart = start || (payments.length > 0 ? payments[payments.length-1].paymentDate : new Date());
    const periodEnd = end || (payments.length > 0 ? payments[0].paymentDate : new Date());

    res.json({
        period: { start: periodStart, end: periodEnd },
        count: payments.length,
        totalAmount,
        data: payments
    });

  } catch (err) {
    console.error("Report Error:", err);
    res.status(500).json({ message: "Failed to generate report" });
  }
};