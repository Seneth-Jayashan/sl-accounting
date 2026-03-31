import { z } from "zod";

// --- REUSABLE SECURITY VALIDATORS ---

const gmailValidator = z
  .string()
  .trim()
  .toLowerCase()
  .email("Invalid email address format")
  .refine((val) => val.endsWith("@gmail.com"), {
    message: "Only Gmail addresses are allowed (e.g., user@gmail.com)",
  });

const passwordValidator = z
  .string()
  .min(8, "Password must be at least 8 characters long")
  .max(100, "Password is too long")
  .regex(/[A-Z]/, "Must contain at least one uppercase letter")
  .regex(/[a-z]/, "Must contain at least one lowercase letter")
  .regex(/[0-9]/, "Must contain at least one number")
  .regex(/[^A-Za-z0-9]/, "Must contain at least one special character (@$!%*?&)");

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
      
    email: gmailValidator,
      
    phoneNumber: z.string()
      .trim()
      .regex(phoneRegex, "Invalid SL phone number (Expected: 07XXXXXXXX or +947XXXXXXXX)"),
      
    password: passwordValidator,
      
    address: addressSchema.optional(),
    
    batch: z.string().length(24, "Invalid Batch ID format"),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: gmailValidator,
    password: z.string().min(1, "Password is required"), 
  }),
});