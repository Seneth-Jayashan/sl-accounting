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

export const createUserSchema = z.object({
  body: z.object({
    firstName: z.string().trim().min(1, "First name is required").max(50),
    lastName: z.string().trim().min(1, "Last name is required").max(50),
    email: gmailValidator,
    password: passwordValidator,
    phoneNumber: z.string().trim().regex(phoneRegex, "Invalid SL phone number"),
    role: z.enum(["student", "admin"]).optional(),
    
    regNo: z.string().optional(),
    batch: z.string().optional(),
    
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
