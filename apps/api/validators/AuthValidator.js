import { z } from "zod";

// --- REUSABLE SECURITY VALIDATORS ---

// 1. Gmail Only Validator
const gmailValidator = z
  .string()
  .trim()
  .toLowerCase()
  .email("Invalid email address format")
  .refine((val) => val.endsWith("@gmail.com"), {
    message: "Only Gmail addresses are allowed (e.g., user@gmail.com)",
  });

// 2. Strong Password Validator (Min 8 chars, Upper, Lower, Number, Special)
const passwordValidator = z
  .string()
  .min(8, "Password must be at least 8 characters long")
  .max(100, "Password is too long")
  .regex(/[A-Z]/, "Must contain at least one uppercase letter")
  .regex(/[a-z]/, "Must contain at least one lowercase letter")
  .regex(/[0-9]/, "Must contain at least one number")
  .regex(/[^A-Za-z0-9]/, "Must contain at least one special character (@$!%*?&)");

// 3. Sri Lankan Mobile Regex
// Matches: 0771234567 or +94771234567
const phoneRegex = /^(\+94|0)?7\d{8}$/;

// --- SCHEMAS ---

const addressSchema = z.object({
  street: z.string().trim().optional(),
  city: z.string().trim().optional(),
  state: z.string().trim().optional(),
  zipCode: z.string().trim().optional(),
});

export const registerSchema = z.object({
  body: z.object({
    firstName: z.string()
      .trim()
      .min(2, "First name must be at least 2 characters")
      .max(50, "First name is too long"),
      
    lastName: z.string()
      .trim()
      .min(2, "Last name must be at least 2 characters")
      .max(50, "Last name is too long"),
      
    email: gmailValidator, // <--- Enforces Gmail
      
    phoneNumber: z.string()
      .trim()
      .regex(phoneRegex, "Invalid SL phone number (Expected: 07XXXXXXXX or +947XXXXXXXX)"),
      
    password: passwordValidator, // <--- Enforces Strong Password
      
    address: addressSchema.optional(),
    
    // Validates MongoDB ObjectId length (24 hex chars)
    batch: z.string().length(24, "Invalid Batch ID format"),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: gmailValidator, // <--- Enforces Gmail on Login too
    password: z.string().min(1, "Password is required"), // Keep login password validation simple to prevent enumeration timing attacks
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

    // Replace request data with sanitized/validated data
    if (parsed.body) req.body = parsed.body;
    if (parsed.query) Object.assign(req.query, parsed.query);
    if (parsed.params) Object.assign(req.params, parsed.params);

    next(); 
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Format errors for easier frontend consumption
      const formattedErrors = error.errors.map((err) => ({
        field: err.path.join("."), // e.g., "body.email"
        message: err.message,
      }));

      return res.status(400).json({
        success: false,
        message: "Validation Error",
        errors: formattedErrors,
      });
    }
    
    console.error("Internal Validation Error:", error);
    return res.status(500).json({
        success: false,
        message: "Internal Server Error during validation"
    });
  }
};