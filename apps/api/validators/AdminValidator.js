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
    address: z
      .object({
        street: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        zipCode: z.string().optional(),
      })
      .optional(),
  }),
});
export const updateEmailSchema = z.object({
  body: z.object({
    email: z.string().trim().toLowerCase().email("Invalid email address"),
  }),
});

export const updatePasswordSchema = z.object({
  body: z.object({
    newPassword: z
      .string()
      .min(6, "New password must be at least 6 characters long")
      .max(100, "New password is too long"),
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
    req.query = parsed.query;
    req.params = parsed.params;
    next();
  } catch (error) {
    if (error.name === "ZodError") {
      return res
        .status(400)
        .json({
          success: false,
          message: "Admin Validation Error",
          errors: error.errors,
        });
    }
    console.error("Admin Validation Middleware Error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};
