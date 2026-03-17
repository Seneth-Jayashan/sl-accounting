import z from "zod";

// Validates the initial "Start Quiz" request
export const startQuizSchema = z.object({
  body: z.object({
    quizId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid Quiz ID"),
  }),
});

// Validates the final "Submit Quiz" request
export const submitQuizSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid Submission ID"),
  }),
  body: z.object({
    answers: z.array(
      z.object({
        questionId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid Question ID"),
        selectedOptions: z.array(z.number()).optional(), // For MCQs/Multi-select
        shortAnswer: z.string().trim().optional(), // For structured text answers
      })
    ).min(1, "You must provide at least one answer"),
    isTimeOut: z.boolean().optional().default(false),
  }),
});

// Validates admin filtering of results
export const getAnalyticsSchema = z.object({
  params: z.object({
    quizId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid Quiz ID"),
  }),
});

// --- Reuse your existing Validate Middleware ---
export const validate = (schema) => (req, res, next) => {
  try {
    const parsed = schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    if (parsed.body) req.body = parsed.body;
    if (parsed.query) Object.assign(req.query, parsed.query);
    if (parsed.params) Object.assign(req.params, parsed.params);

    next();
  } catch (error) {
    // Check if it's a ZodError
    if (error instanceof z.ZodError || error.name === "ZodError") {
      // Safely fallback to error.issues or an empty array if undefined
      const issues = error.errors || error.issues || [];
      
      return res.status(400).json({
        success: false,
        message: "Validation Failed: " + issues.map((e) => e.message).join(", "),
        errors: issues,
      });
    }
    
    // If it's a completely different error, log it and send a 500
    console.error("Validation Middleware Error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};