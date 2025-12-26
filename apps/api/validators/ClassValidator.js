import { z } from "zod";

// --- HELPERS ---

// Helper to parse JSON strings from FormData (e.g. "[{'day':1...}]")
const jsonString = (schema) =>
  z.preprocess((val) => {
    if (typeof val === "string") {
      try { return JSON.parse(val); } catch (e) { return val; }
    }
    return val;
  }, schema);

// Helper to parse Numbers from FormData strings (e.g. "1500")
const numeric = () => z.number().or(z.string().transform((val) => Number(val)));

// Helper to parse Booleans from FormData strings (e.g. "true")
const boolean = () => z.boolean().or(z.string().transform((val) => val === "true"));

// Strict MongoDB ObjectId Regex
const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ID format");


// --- SUB-SCHEMAS ---

const timeScheduleSchema = z.object({
  day: numeric().pipe(z.number().int().min(0).max(6)), // 0-6
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Format HH:mm"),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Format HH:mm"),
  timezone: z.string().optional(),
});


// --- MAIN SCHEMAS ---

export const createClassSchema = z.object({
  body: z.object({
    name: z.string().trim().min(3).max(100),
    description: z.string().trim().min(10),
    
    // Handle complex array parsing from FormData
    timeSchedules: jsonString(z.array(timeScheduleSchema).min(1, "At least one schedule required")),
    
    firstSessionDate: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid date"),
    recurrence: z.enum(["weekly", "daily", "none"]),
    
    // Handle numeric conversion
    totalSessions: numeric().pipe(z.number().int().min(1)),
    sessionDurationMinutes: numeric().pipe(z.number().int().min(15)),
    price: numeric().pipe(z.number().min(0)),
    
    level: z.enum(["general", "ordinary", "advanced"]).default("general"),
    
    batch: objectIdSchema.optional(), // Strict ID check

    // Handle tags array (JSON string in FormData)
    tags: jsonString(z.array(z.string().trim()).optional()),
    
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