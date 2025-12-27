import { z } from "zod";

// --- REUSABLE SECURITY VALIDATORS (Match AuthValidator) ---

const gmailValidator = z
  .string()
  .trim()
  .toLowerCase()
  .email("Invalid email address format")
  .refine((val) => val.endsWith("@gmail.com"), {
    message: "Only Gmail addresses are allowed",
  });

const passwordValidator = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(100, "Password is too long")
  .regex(/[A-Z]/, "Must contain an uppercase letter")
  .regex(/[a-z]/, "Must contain a lowercase letter")
  .regex(/[0-9]/, "Must contain a number")
  .regex(/[^A-Za-z0-9]/, "Must contain a special character");

const phoneRegex = /^(\+94|0)?7\d{8}$/;

// --- SCHEMAS ---

export const updateProfileSchema = z.object({
  body: z.object({
    firstName: z.string().trim().min(1).max(50).optional(),
    lastName: z.string().trim().min(1).max(50).optional(),
    phoneNumber: z.string().trim().regex(phoneRegex, "Invalid SL phone number").optional(),
    address: z.string().optional().or(z.object({
        street: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        zipCode: z.string().optional(),
    }).optional()),
  }),
});

export const updateEmailSchema = z.object({
  body: z.object({
    email: gmailValidator, // Enforce Gmail
  }),
});

export const updatePasswordSchema = z.object({
  body: z.object({
    newPassword: passwordValidator, // Enforce Strong Password
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

    // Merge validated data safely
    if (parsed.body) req.body = parsed.body;
    if (parsed.query) Object.assign(req.query, parsed.query);
    if (parsed.params) Object.assign(req.params, parsed.params);

    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Admin Validation Error",
        errors: error.errors.map(e => ({ field: e.path.join('.'), message: e.message })),
      });
    }
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};