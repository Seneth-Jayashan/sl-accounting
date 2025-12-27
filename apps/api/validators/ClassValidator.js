import { z } from "zod";

// --- HELPERS ---

// Sharp Helper: Only parses if it's actually a string
const jsonString = (schema) =>
  z.preprocess((val) => {
    if (typeof val === "string") {
      try {
        return JSON.parse(val);
      } catch (e) {
        return val; // Let Zod handle the type error
      }
    }
    return val; // It's already an object/array, return as is
  }, schema);

const numeric = () => z.number().or(z.string().transform((val) => Number(val)));
const boolean = () => z.boolean().or(z.string().transform((val) => val === "true"));
const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ID format");

// --- SCHEMAS ---

const timeScheduleSchema = z.object({
  day: numeric().pipe(z.number().int().min(0).max(6)),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Format HH:mm"),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Format HH:mm"),
  timezone: z.string().optional(),
});

export const createClassSchema = z.object({
  body: z.object({
    name: z.string().trim().min(3).max(100),
    description: z.string().trim().min(10),
    timeSchedules: jsonString(z.array(timeScheduleSchema).min(1, "At least one schedule required")),
    firstSessionDate: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid date"),
    recurrence: z.enum(["weekly", "daily", "none"]),
    totalSessions: numeric().pipe(z.number().int().min(1)),
    sessionDurationMinutes: numeric().pipe(z.number().int().min(15)),
    price: numeric().pipe(z.number().min(0)),
    level: z.enum(["general", "ordinary", "advanced"]).default("general"),
    type: z.enum(["theory", "revision", "paper"]).default("theory"),
    batch: objectIdSchema.optional().nullable(), // Allow null for independent classes
    tags: jsonString(z.array(z.string().trim()).optional().default([])),
    isPublished: boolean().default(false),
  }),
});

export const updateClassSchema = z.object({
  params: z.object({
    classId: objectIdSchema,
  }),
  body: createClassSchema.shape.body.partial().extend({
    isActive: boolean().optional(),
    isPublished: boolean().optional(),
    isDeleted: boolean().optional(),
  }),
});

export const classIdSchema = z.object({
  params: z.object({
    classId: objectIdSchema,
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

    // Safely assign parsed data back to request
    // Note: We use Object.assign for query/params to avoid breaking Express internals
    if (parsed.body) req.body = parsed.body;
    if (parsed.params) Object.assign(req.params, parsed.params);
    if (parsed.query) Object.assign(req.query, parsed.query);

    return next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Format errors nicely
      const formattedErrors = error.errors.map(e => ({
        field: e.path.join('.'),
        message: e.message
      }));

      return res.status(400).json({
        success: false,
        message: "Validation Error",
        errors: formattedErrors,
      });
    }

    console.error("Validation Middleware Error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};