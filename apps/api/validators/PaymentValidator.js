import { z } from "zod";

// --- HELPERS ---

const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ID format");

// Allow either standard billing months OR our new one-time playlist bypass
const monthSchema = z.custom((val) => {
  if (typeof val !== "string") return false;
  if (val === "Lifetime Access") return true;
  // standard YYYY-MM regex
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(val);
}, "Invalid month format. Expected YYYY-MM or 'Lifetime Access'");

// --- SCHEMAS ---

export const initiatePayHereSchema = z.object({
  body: z.object({
    amount: z.coerce.number().positive("Amount must be positive"),
    order_id: z.string().min(1, "Order ID is required"),
    currency: z.string().default("LKR"),
  }),
});

export const uploadSlipSchema = z.object({
  body: z.object({
    enrollmentId: objectIdSchema,
    amount: z.coerce.number().positive("Paid amount must be positive"),
    notes: z.string().optional(),
    targetMonth: monthSchema.optional(), // Now safely accepts "Lifetime Access"
  }),
});

// Admin Manual Entry
export const createPaymentSchema = z.object({
  body: z.object({
    enrollment: objectIdSchema,
    amount: z.coerce.number().nonnegative("Amount cannot be negative"),
    transactionId: z.string().optional(),
    notes: z.string().optional(),
    method: z.enum(["manual", "bank_transfer", "payhere"]).default("payhere"),
    targetMonth: monthSchema.optional(), 
  }),
});

export const updatePaymentStatusSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
  body: z.object({
    status: z.enum(["completed", "failed", "pending"]),
  }),
});

export const paymentIdSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
});

// --- MIDDLEWARE ---
export const validate = (schema) => (req, res, next) => {
  try {
    const parsed = schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    if (parsed.body) req.body = parsed.body;
    if (parsed.params) Object.assign(req.params, parsed.params);
    if (parsed.query) Object.assign(req.query, parsed.query);

    return next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Validation Error",
        errors: error.errors.map(e => ({ 
            field: e.path.join('.'), 
            message: e.message 
        })),
      });
    }
    console.error("Validation Middleware Error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};