import { z } from "zod";
import { validate } from './AuthValidator.js'; // Ensure the common validate middleware is imported

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
    
    language: z.string().default("si"), 

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

// Re-export the existing validate middleware for convenience
export { validate };