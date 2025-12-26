import { z } from "zod";

// --- HELPERS ---

// Robust numeric coercion: 
// Accepts Number or String, converts String to Number, checks for NaN
const numeric = () => z.union([z.number(), z.string()])
  .transform((val) => {
    const num = Number(val);
    if (isNaN(num)) {
      throw new z.ZodError([{ 
        code: z.ZodIssueCode.custom, 
        message: "Invalid number format", 
        path: [] 
      }]);
    }
    return num;
  });

const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ID format");

// --- SCHEMAS ---

export const initiatePayHereSchema = z.object({
  body: z.object({
    // PayHere needs a valid number; checks positivity
    amount: numeric().pipe(z.number().positive("Amount must be positive")),
    order_id: z.string().min(1, "Order ID is required"),
    currency: z.string().default("LKR"),
  }),
});

export const uploadSlipSchema = z.object({
  body: z.object({
    enrollmentId: objectIdSchema,
    // FIX: Renamed 'paidAmount' -> 'amount' to match Controller & FormData
    amount: numeric().pipe(z.number().positive("Paid amount must be positive")),
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
    // Parse verifies AND transforms data (string -> number)
    const parsed = schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    // Update req with the transformed values
    if (parsed.body) req.body = parsed.body;
    if (parsed.params) Object.assign(req.params, parsed.params);
    if (parsed.query) Object.assign(req.query, parsed.query);

    return next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Return a clean error format to the frontend
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