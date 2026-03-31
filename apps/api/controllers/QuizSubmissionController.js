import Quiz from "../models/Quiz.js";
import QuizSubmission from "../models/QuizSubmission.js";


export const startQuiz = async (req, res) => {
    try {
        const { quizId } = req.body;
        const studentId = req.user.id; 

        const existingSubmission = await QuizSubmission.findOne({
            quiz: quizId,
            student: studentId,
            status: { $in: ["in-progress", "completed"] }
        });

        const quiz = await Quiz.findById(quizId);
        if (!quiz) return res.status(404).json({ message: "Quiz not found" });

        if (existingSubmission && quiz.settings.maxAttempts <= 1) {
            return res.status(403).json({ message: "You have already attempted this quiz." });
        }

        const newSubmission = new QuizSubmission({
            quiz: quizId,
            student: studentId,
            status: "in-progress",
            startedAt: new Date()
        });

        await newSubmission.save();
        res.status(201).json({ success: true, submissionId: newSubmission._id });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};


export const submitQuiz = async (req, res) => {
    try {
        const { id } = req.params;
        const { answers } = req.body; 
        
        const submission = await QuizSubmission.findById(id).populate("quiz");
        if (!submission || submission.status === "completed") {
            return res.status(400).json({ message: "Invalid or already completed submission." });
        }

        const quiz = submission.quiz;
        let totalPointsEarned = 0;

        const gradedAnswers = quiz.questions.map((question) => {
            const studentAnswer = answers.find(a => a.questionId.toString() === question._id.toString());
            let isCorrect = false;
            let pointsEarned = 0;

            if (studentAnswer) {
                if (question.questionType === "mcq" || question.questionType === "true-false") {
                    const correctOptionIndex = question.options.findIndex(opt => opt.isCorrect);
                    isCorrect = studentAnswer.selectedOptions[0] === correctOptionIndex;
                } 
                else if (question.questionType === "multi-select") {
                    const correctIndices = question.options
                        .map((opt, idx) => opt.isCorrect ? idx : null)
                        .filter(idx => idx !== null);
                    
                    const studentSelections = studentAnswer.selectedOptions || [];
                    
                    isCorrect = JSON.stringify([...studentSelections].sort()) === JSON.stringify([...correctIndices].sort());
                }
                else if (question.questionType === "short-answer") {
                    const correctText = question.options.find(opt => opt.isCorrect)?.optionText.toLowerCase().trim();
                    isCorrect = studentAnswer.shortAnswer?.toLowerCase().trim() === correctText;
                }

                if (isCorrect) {
                    pointsEarned = question.points || 1;
                    totalPointsEarned += pointsEarned;
                }
            }

            return {
                questionId: question._id,
                selectedOptions: studentAnswer?.selectedOptions || [],
                shortAnswer: studentAnswer?.shortAnswer || "",
                isCorrect,
                pointsEarned
            };
        });

        const percentageScore = (totalPointsEarned / quiz.totalPoints) * 100;
        const passed = percentageScore >= quiz.passingPercentage;
        const completedAt = new Date();
        const timeTaken = Math.round((completedAt - submission.startedAt) / 1000); // Seconds

        submission.answers = gradedAnswers;
        submission.totalPointsEarned = totalPointsEarned;
        submission.percentageScore = percentageScore;
        submission.passed = passed;
        submission.status = req.body.isTimeOut ? "time-out" : "completed";
        submission.completedAt = completedAt;
        submission.timeTaken = timeTaken;

        await submission.save();

        res.status(200).json({
            success: true,
            data: {
                score: totalPointsEarned,
                total: quiz.totalPoints,
                percentage: percentageScore,
                passed
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};


export const getSubmissionResult = async (req, res) => {
    try {
        const submission = await QuizSubmission.findById(req.params.id)
            .populate("quiz", "title description questions settings")
            .populate("student", "firstName lastName email")
            .lean();


        if (!submission) return res.status(404).json({ message: "Result not found" });

        if (!submission.quiz.settings.showResultImmediately && req.user.role !== 'admin') {
            return res.status(200).json({ 
                success: true, 
                message: "Results will be released by the teacher later.",
                summary: { score: submission.totalPointsEarned, passed: submission.passed } 
            });
        }

        res.status(200).json({ success: true, data: submission });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getQuizAnalytics = async (req, res) => {
    try {
        const submissions = await QuizSubmission.find({ quiz: req.params.quizId })
            .populate("student", "firstName lastName email")
            .sort({ totalPointsEarned: -1 });

        res.status(200).json({ success: true, count: submissions.length, data: submissions });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};