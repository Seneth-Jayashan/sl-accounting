import { z } from "zod";

const jsonString = (schema) => z.preprocess((val) => typeof val === "string" ? JSON.parse(val) : val, schema);
const numeric = () => z.number().or(z.string().transform((val) => Number(val)));
const boolean = () => z.boolean().or(z.string().transform((val) => val === "true"));
const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ID format");

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
    level: z.enum(["general", "ordinary", "advanced"]).optional(),
    type: z.enum(["theory", "revision", "paper"]).optional(),
    batch: objectIdSchema.optional().nullable(),
    tags: jsonString(z.array(z.string().trim()).optional()),
    isPublished: boolean().optional(),
    
    // Linking
    parentTheoryClass: objectIdSchema.optional(), // <--- NEW

    // Variants Flags
    createRevision: boolean().optional(),
    createPaper: boolean().optional(),

    // Variants Config
    revisionDay: numeric().optional(),
    revisionStartTime: z.string().optional(),
    revisionEndTime: z.string().optional(),
    revisionPrice: numeric().optional(),
    
    paperDay: numeric().optional(),
    paperStartTime: z.string().optional(),
    paperEndTime: z.string().optional(),
    paperPrice: numeric().optional(),

    bundlePriceRevision: numeric().optional(),
    bundlePricePaper: numeric().optional(),
    bundlePriceFull: numeric().optional(),
  }),
});

export const updateClassSchema = z.object({
  params: z.object({ classId: objectIdSchema }),
  body: createClassSchema.shape.body.partial().extend({
    isActive: boolean().optional(),
    isPublished: boolean().optional(),
    isDeleted: boolean().optional(),
  }),
});

export const classIdSchema = z.object({
  params: z.object({ classId: objectIdSchema }),
});

export const validate = (schema) => (req, res, next) => {
  try {
    const parsed = schema.parse({ body: req.body, query: req.query, params: req.params });
    if (parsed.body) req.body = parsed.body;
    if (parsed.params) Object.assign(req.params, parsed.params);
    if (parsed.query) Object.assign(req.query, parsed.query);
    return next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: "Validation Error", errors: error.errors });
    }
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};