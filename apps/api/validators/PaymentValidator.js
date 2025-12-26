import { z } from "zod";

// --- HELPERS ---
const numeric = () => z.number().or(z.string().transform((val) => Number(val)));
const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ID format");

// --- SCHEMAS ---

export const initiatePayHereSchema = z.object({
  body: z.object({
    // PayHere requires strictly 2 decimal formatting, but input should be valid number
    amount: numeric().pipe(z.number().positive("Amount must be positive")),
    order_id: z.string().min(1, "Order ID is required"),
    currency: z.string().default("LKR"),
  }),
});

export const uploadSlipSchema = z.object({
  body: z.object({
    enrollmentId: objectIdSchema,
    notes: z.string().optional(),
  }),
});

// Admin Manual Entry
export const createPaymentSchema = z.object({
  body: z.object({
    enrollment: objectIdSchema,
    amount: numeric().pipe(z.number().nonnegative("Amount cannot be negative")),
    transactionId: z.string().optional(),
    notes: z.string().optional(),
    // Allow admin to specify method, default to manual
    method: z.enum(["manual", "bank_transfer", "payhere"]).default("manual"),
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
        message: "Payment Validation Error",
        errors: error.errors.map(e => ({ field: e.path.join('.'), message: e.message })),
      });
    }
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};