import { z } from "zod";

// ==========================================
// 1. REUSABLE VALIDATORS
// ==========================================

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

// ==========================================
// 2. SCHEMAS
// ==========================================

// Create User Schema (For Admin "Add Student")
export const createUserSchema = z.object({
  body: z.object({
    firstName: z.string().trim().min(1, "First name is required").max(50),
    lastName: z.string().trim().min(1, "Last name is required").max(50),
    email: gmailValidator,
    password: passwordValidator,
    phoneNumber: z.string().trim().regex(phoneRegex, "Invalid SL phone number"),
    role: z.enum(["student", "admin", "instructor"]).optional(),
    
    // Optional fields (Backend handles auto-generation/defaults)
    regNo: z.string().optional(),
    batch: z.string().optional(),
    
    // Address can be string or object
    address: z.union([
        z.string(), 
        z.object({ 
            street: z.string().optional(),
            city: z.string().optional(),
            state: z.string().optional(),
            zipCode: z.string().optional(),
        })
    ]).optional(),
  }),
});

// Update Profile Schema
export const updateProfileSchema = z.object({
  body: z.object({
    firstName: z.string().trim().min(1).max(50).optional(),
    lastName: z.string().trim().min(1).max(50).optional(),
    phoneNumber: z.string().trim().regex(phoneRegex, "Invalid SL phone number").optional(),
    address: z.union([
      z.string(), 
      z.object({
        street: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        zipCode: z.string().optional(),
      })
    ]).optional(),
    batch: z.string().optional(),
  }),
});

// Security Update Schemas
export const updateEmailSchema = z.object({
  body: z.object({
    email: gmailValidator,
  }),
});

export const updatePasswordSchema = z.object({
  body: z.object({
    newPassword: passwordValidator,
  }),
});

// ==========================================
// 3. ROBUST MIDDLEWARE (Fixes the crash)
// ==========================================

export const validate = (schema) => (req, res, next) => {
  try {
    // 1. Safe Parse
    const result = schema.safeParse({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    // 2. Handle Failure
    if (!result.success) {
      
      // Safety Check: Ensure 'errors' array exists
      const zodErrors = result.error.errors || [];

      const formattedErrors = zodErrors.map((e) => {
        // e.path is like ['body', 'password']. slice(1) removes 'body'.
        const fieldPath = e.path.length > 1 ? e.path.slice(1).join(".") : e.path.join(".");
        
        return {
          field: fieldPath,
          message: e.message,
        };
      });

      // Log for debugging on server console
      // console.log("Validation Failed:", formattedErrors);

      return res.status(400).json({
        success: false,
        // Show the first error message as the main alert message
        message: formattedErrors.length > 0 ? formattedErrors[0].message : "Validation Error",
        errors: formattedErrors,
      });
    }

    // 3. Handle Success (Assign cleaned data)
    if (result.data.body) req.body = result.data.body;
    if (result.data.query) req.query = result.data.query;
    if (result.data.params) req.params = result.data.params;

    next();

  } catch (err) {
    console.error("Validator System Error:", err);
    return res.status(500).json({ success: false, message: "Internal Validator Error" });
  }
};