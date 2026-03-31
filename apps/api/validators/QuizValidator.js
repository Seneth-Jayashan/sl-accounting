import z from "zod";

// --- Helper Schemas ---
const optionSchema = z.object({
  optionText: z.string().trim().min(1, "Option text is required"),
  isCorrect: z.boolean().default(false),
});

const questionSchema = z.object({
  questionText: z.string().trim().min(1, "Question text is required"),
  questionImage: z.string().url("Invalid image URL").optional().nullable(),
  questionType: z.enum(["mcq", "multi-select", "true-false", "short-answer"]).default("mcq"),
  options: z.array(optionSchema).min(1, "At least one option is required"),
  explanation: z.string().trim().optional(),
  points: z.number().positive().default(1),
});

// --- Main Schemas ---

export const createQuizSchema = z.object({
  body: z.object({
    title: z.string().trim().min(3, "Title must be at least 3 characters"),
    description: z.string().trim().optional(),
    class: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid Class ID"),
    questions: z.array(questionSchema).min(1, "Quiz must have at least one question"),
    quizType: z.enum(["live", "schedule", "practice"]).default("live"),
    scheduledAt: z.preprocess((arg) => (typeof arg === "string" ? new Date(arg) : arg), z.date().optional()),
    expiresAt: z.preprocess((arg) => (typeof arg === "string" ? new Date(arg) : arg), z.date().optional()),
    duration: z.number().min(1, "Duration must be at least 1 minute"),
    settings: z.object({
      shuffleQuestions: z.boolean().default(true),
      shuffleOptions: z.boolean().default(true),
      allowBacktrack: z.boolean().default(true),
      maxAttempts: z.number().min(1).default(1),
      showResultImmediately: z.boolean().default(false),
      requirePassword: z.string().nullable().optional(),
    }).optional(),
    passingPercentage: z.number().min(0).max(100).default(40),
    isPublished: z.boolean().default(false),
  }),
});

export const updateQuizSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid Quiz ID"),
  }),
  body: createQuizSchema.shape.body.partial(), // Makes all fields optional for updates
});

export const submitQuizSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid Submission ID"),
  }),
  body: z.object({
    answers: z.array(z.object({
      questionId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid Question ID"),
      selectedOptions: z.array(z.number()).optional(),
      shortAnswer: z.string().optional(),
    })),
    isTimeOut: z.boolean().optional().default(false),
  }),
});
