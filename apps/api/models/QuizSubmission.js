import mongoose from "mongoose";

const quizSchema = new mongoose.Schema(
    {
        quiz: { type: mongoose.Schema.Types.ObjectId, ref: "Quiz", required: true },
        student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        answers: [
            {
                questionId: { type: mongoose.Schema.Types.ObjectId, required: true },
                selectedOptions: [{ type: Number }], // For multi-select, store indices of selected options
                shortAnswer: { type: String }, // For short-answer questions
                isCorrect: { type: Boolean }, // Calculated after submission
                pointsEarned: { type: Number, default: 0 }, // Calculated after submission
            },
        ],
        totalPointsEarned: { type: Number, default: 0 }, // Calculated after submission
        percentageScore: { type: Number, default: 0 }, // Calculated after submission
        passed: { type: Boolean, default: false }, // Calculated after submission
        status: { type: String, enum: ["in-progress", "completed" , "time-out"], default: "in-progress", index: true },
        startedAt: { type: Date, default: Date.now },
        completedAt: { type: Date },
        timeTaken: { type: Number }, // In seconds, calculated after submission
    },
    { timestamps: true }
);

const QuizSubmission = mongoose.model("QuizSubmission", quizSchema);

export default QuizSubmission;