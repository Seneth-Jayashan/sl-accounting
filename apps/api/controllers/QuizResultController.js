import QuizSubmission from "../models/QuizSubmission.js";

/**
 * @desc    Get List of All Quiz Results for a Student
 * @route   GET /api/results/my-results
 */
export const getStudentDashboardResults = async (req, res) => {
    try {
        const studentId = req.user.id; // From Auth Middleware

        const results = await QuizSubmission.find({ student: studentId })
            .populate("quiz", "title description totalPoints duration")
            .sort({ createdAt: -1 })
            .lean();

        res.status(200).json({
            success: true,
            count: results.length,
            data: results
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Get Detailed Result for a Specific Submission
 * @route   GET /api/results/:submissionId
 */
export const getDetailedResult = async (req, res) => {
    try {
        const { submissionId } = req.params;
        const studentId = req.user.id;

        // Populate the Quiz data to compare answers and show explanations
        const submission = await QuizSubmission.findOne({ 
            _id: submissionId, 
            student: studentId 
        }).populate({
            path: "quiz",
            select: "title questions settings passingPercentage totalPoints"
        });

        if (!submission) {
            return res.status(404).json({ success: false, message: "Result record not found." });
        }

        // FEATURE: Security Check
        // If the teacher has disabled 'showResultImmediately', hide the detailed breakdown
        if (!submission.quiz.settings.showResultImmediately) {
            return res.status(200).json({
                success: true,
                message: "Detailed review is hidden by the instructor.",
                summary: {
                    title: submission.quiz.title,
                    score: submission.totalPointsEarned,
                    total: submission.quiz.totalPoints,
                    percentage: submission.percentageScore,
                    passed: submission.passed,
                    status: submission.status
                }
            });
        }

        // Map the quiz questions with the student's saved answers for the UI
        const reviewData = submission.quiz.questions.map((question) => {
            const studentAns = submission.answers.find(
                (a) => a.questionId.toString() === question._id.toString()
            );

            return {
                questionText: question.questionText,
                questionImage: question.questionImage,
                options: question.options, // Contains isCorrect for review
                explanation: question.explanation, // Essential for Accounting adjustments
                studentSelection: studentAns ? studentAns.selectedOptions : [],
                studentShortAnswer: studentAns ? studentAns.shortAnswer : "",
                isCorrect: studentAns ? studentAns.isCorrect : false,
                pointsEarned: studentAns ? studentAns.pointsEarned : 0,
                maxPoints: question.points
            };
        });

        res.status(200).json({
            success: true,
            quizTitle: submission.quiz.title,
            summary: {
                totalPointsEarned: submission.totalPointsEarned,
                totalQuizPoints: submission.quiz.totalPoints,
                percentage: submission.percentageScore,
                passed: submission.passed,
                timeTaken: submission.timeTaken,
                completedAt: submission.completedAt
            },
            review: reviewData
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};