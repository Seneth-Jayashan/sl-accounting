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
