import { z } from "zod";

// Helper Zod schema for a single schedule entry (matching Mongoose timeSchedule schema)
const timeScheduleSchema = z.object({
  // Mongoose day type is Number (0=Sunday to 6=Saturday)
  day: z.number()
    .int("Day must be an integer (0-6)")
    .min(0, "Day must be between 0 (Sunday) and 6 (Saturday)")
    .max(6, "Day must be between 0 (Sunday) and 6 (Saturday)"),
    
  // Time validation using regex for HH:mm format
  startTime: z.string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Start time must be in HH:mm format (24-hour)"),
    
  endTime: z.string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "End time must be in HH:mm format (24-hour)"),
    
  timezone: z.string().optional(),
});


export const createClassSchema = z.object({
  body: z.object({
    name: z.string() // Updated from className
      .trim()
      .min(3, "Class name must be at least 3 characters long")
      .max(100, "Class name is too long"),
      
    description: z.string()
      .trim()
      .min(10, "Description must be at least 10 characters long"),
      
    // New complex schedule array validation
    timeSchedules: z.array(timeScheduleSchema)
      .min(1, "At least one schedule (day/time) is required"),
      
    firstSessionDate: z.string() // Use string for validation, convert to Date in controller
      .refine((val) => !isNaN(Date.parse(val)), { message: "Invalid first session date format" }),
      
    recurrence: z.enum(["weekly", "daily", "none"]),
    
    totalSessions: z.number()
      .int("Total sessions must be an integer")
      .min(1, "Total sessions must be at least 1"),

    sessionDurationMinutes: z.number()
      .int("Duration must be an integer")
      .min(15, "Session duration must be at least 15 minutes"),
      
    price: z.number().min(0, "Price cannot be negative").default(0),
    
    level: z.enum(["general", "ordinary", "advanced"]).default("general"),
    
    batch: z.string().min(24).max(24, "Invalid Batch ID format (must be 24 hex characters)").optional(),

    tags: z.array(z.string().trim().min(1)).optional(),
    
    isPublished: z.boolean().default(false),
  }),
});

export const updateClassSchema = z.object({
  params: z.object({
    classId: z.string().min(24).max(24, "Invalid Class ID format (must be 24 hex characters)"),
  }),
  body: createClassSchema.shape.body.partial().extend({
    // Explicitly allow changes to isActive, isPublished, and isDeleted
    isActive: z.boolean().optional(),
    isPublished: z.boolean().optional(),
    isDeleted: z.boolean().optional(),
  }),
});


export const classIdSchema = z.object({
  params: z.object({
    classId: z.string().min(24).max(24, "Invalid Class ID format (must be 24 hex characters)"),
  }),
});

export const validate = (schema) => (req, res, next) => {
  try {
    const parsed = schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    // Only overwrite things that actually exist on the schema

    // body
    if ("body" in schema.shape && parsed.body !== undefined) {
      req.body = parsed.body;
    }

    // params
    if ("params" in schema.shape && parsed.params !== undefined) {
      req.params = parsed.params;
    }

    // query – DO NOT reassign, just merge into existing object
    if ("query" in schema.shape && parsed.query !== undefined) {
      // req.query is usually an object already created by the framework
      Object.assign(req.query, parsed.query);
    }

    return next();
  } catch (error) {
    if (error.name === "ZodError") {
      return res.status(400).json({
        success: false,
        message: "Class Validation Error: " + error.message,
        errors: error.errors,
      });
    }

    console.error("Class Validation Middleware Error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};
