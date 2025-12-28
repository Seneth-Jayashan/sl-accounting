import z from "zod";

export const updateProfileSchema = z.object({
  body: z.object({
    firstName: z
      .string()
      .trim()
      .min(1, "First name is required")
      .max(50, "First name is too long")
      .optional(),
    lastName: z
      .string()
      .trim()
      .min(1, "Last name is required")
      .max(50, "Last name is too long")
      .optional(),
    phoneNumber: z
      .string()
      .trim()
      .regex(
        /^(?:\+94|0)?7\d{8}$|^(\+?\d{10,15})$/,
        "Invalid phone number format (Expected: 07XXXXXXXX or +947XXXXXXXX)"
      )
      .optional(),
    
    // --- FIX: Use preprocess to parse JSON string from FormData ---
    address: z.preprocess((val) => {
      // If it comes as a string (common in FormData), try to parse it
      if (typeof val === "string") {
        try {
          return JSON.parse(val);
        } catch (e) {
          return val; // If parse fails, return as string (Zod will catch type mismatch)
        }
      }
      return val;
    }, z.object({
        street: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        zipCode: z.string().optional(),
    }).optional()),

  }),
});

export const updateEmailSchema = z.object({
  body: z.object({
    email: z
      .string()
      .trim()
      .toLowerCase()
      .email("Invalid email address format"),
  }),
});

export const updatePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(6, "New password must be at least 6 characters long")
      .max(100, "New password is too long"),
  }),
});

export const forgetPasswordSchema = z.object({
  body: z.object({
    email: z
      .string()
      .trim()
      .toLowerCase()
      .email("Invalid email address format"),
  }),
});

export const resetPasswordSchema = z.object({
  body: z.object({
    email: z
      .string()
      .trim()
      .toLowerCase()
      .email("Invalid email address format"),
    otp: z.string().trim().length(6, "OTP must be 6 characters long"),
    newPassword: z
      .string()
      .min(6, "New password must be at least 6 characters long")
      .max(100, "New password is too long"),
  }),
});

export const verifyEmailSchema = z.object({
  body: z.object({
    email: z
      .string()
      .trim()
      .toLowerCase()
      .email("Invalid email address format"),
    otpCode: z.string().trim().length(6, "OTP must be 6 characters long"),
  }),
});

export const resendOtpSchema = z.object({
  body: z.object({
    email: z
      .string()
      .trim()
      .toLowerCase()
      .email("Invalid email address format"),
  }),
});

export const validate = (schema) => (req, res, next) => {
  try {
    const parsed = schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    if (parsed.body) {
      req.body = parsed.body;
    }

    if (parsed.query) {
       Object.assign(req.query, parsed.query);
    }
    
    if (parsed.params) {
       Object.assign(req.params, parsed.params);
    }

    next();
  } catch (error) {
    if (error.name === "ZodError") {
      console.log("Validation Error:", JSON.stringify(error.errors, null, 2));
      return res.status(400).json({
        success: false,
        message: "Validation Failed: " + error.errors.map(e => e.message).join(", "),
        errors: error.errors,
      });
    }
    console.error("User Validation Middleware Error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};