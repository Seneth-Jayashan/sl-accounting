import mongoose from "mongoose";

const quizSchema = new mongoose.Schema(
    {
        title: { type: String, required: true, trim: true },
        description: { type: String, trim: true },
        class: { type: mongoose.Schema.Types.ObjectId, ref: "Class", required: true },
        
        // 1. ADVANCED QUESTION STRUCTURE
        questions: [
            {
                questionText: { type: String, required: true },
                questionImage: { type: String }, // For Accounting tables/charts
                questionType: { 
                    type: String, 
                    enum: ["mcq", "multi-select", "true-false", "short-answer"], 
                    default: "mcq" 
                },
                options: [
                    {
                        optionText: { type: String, required: true },
                        isCorrect: { type: Boolean, default: false },
                    },
                ],
                explanation: { type: String }, // Shown after quiz completion
                points: { type: Number, default: 1 }
            },
        ],

        // 2. TIMING & AVAILABILITY
        quizType: { type: String, enum: ["live", "schedule", "practice"], default: "live", index: true },
        scheduledAt: { type: Date, index: true },
        expiresAt: { type: Date }, // When the link becomes invalid
        duration: { type: Number, required: true }, // Minutes
        
        // 3. EXAM INTEGRITY & RULES
        settings: {
            shuffleQuestions: { type: Boolean, default: true },
            shuffleOptions: { type: Boolean, default: true },
            allowBacktrack: { type: Boolean, default: true }, // Can they go back to previous Qs?
            maxAttempts: { type: Number, default: 1 },
            showResultImmediately: { type: Boolean, default: false }, // Critical for exam security
            requirePassword: { type: String, default: null }, // Private exams
        },

        // 4. METRICS & STATUS
        totalPoints: { type: Number, default: 0 },
        passingPercentage: { type: Number, default: 40 },
        isActive: { type: Boolean, default: true },
        isPublished: { type: Boolean, default: false },
        isDeleted: { type: Boolean, default: false },
        deletedDate: { type: Date },
    },
    { timestamps: true }
);

// Pre-save hook to calculate total points automatically
quizSchema.pre("save", function (next) {
    this.totalPoints = this.questions.reduce((acc, q) => acc + q.points, 0);
    next();
});

// Delete quiz after 30 days of being marked as deleted (soft delete)
quizSchema.index({ deletedDate: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

const Quiz = mongoose.model("Quiz", quizSchema);
export default Quiz;