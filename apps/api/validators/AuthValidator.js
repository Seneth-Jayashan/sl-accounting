import { z } from "zod";

const addressSchema = z.object({
  street: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
});


const phoneRegex = /^(?:\+94|0)?7\d{8}$|^(\+?\d{10,15})$/; 


export const registerSchema = z.object({
  body: z.object({
    firstName: z.string()
      .trim()
      .min(1, "First name is required")
      .max(50, "First name is too long"),
      
    lastName: z.string()
      .trim()
      .min(1, "Last name is required")
      .max(50, "Last name is too long"),
      
    email: z.string()
      .trim()
      .toLowerCase()
      .email("Invalid email address format"),
      
    phoneNumber: z.string()
      .trim()
      .regex(phoneRegex, "Invalid phone number format (Expected: 07XXXXXXXX or +947XXXXXXXX)"),
      
    password: z.string()
      .min(6, "Password must be at least 6 characters long")
      .max(100, "Password is too long"),
      
    address: addressSchema.optional(),
    batch: z.string().length(24, "Invalid batch ID"),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string()
      .trim()
      .toLowerCase()
      .email("Invalid email address"),
      
    password: z.string()
      .min(1, "Password is required"),
  }),
});

export const validate = (schema) => (req, res, next) => {
  try {
    const parsed = schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
    });
    req.body = parsed.body;
    next(); 
  } catch (error) {
    if (error instanceof z.ZodError) {
      const formattedErrors = error.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));

      return res.status(400).json({
        success: false,
        message: "Auth Validation Error",
        errors: formattedErrors,
      });
    }
    
    return res.status(500).json({
        success: false,
        message: "Internal Validation Error"
    });
  }
};