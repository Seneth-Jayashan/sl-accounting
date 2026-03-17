import Quiz from "../models/Quiz.js";

/**
 * @desc    Create a New Quiz
 * @route   POST /api/quizzes
 */
export const createQuiz = async (req, res) => {
    try {
        const { title, class: classId, duration, questions } = req.body;

        // Basic validation
        if (!title || !classId || !duration) {
            return res.status(400).json({ success: false, message: "Missing required fields" });
        }

        const quiz = new Quiz(req.body);
        const savedQuiz = await quiz.save();

        res.status(201).json({ success: true, data: savedQuiz });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Get All Quizzes (Admin View - includes all metadata)
 * @route   GET /api/quizzes
 */
export const getAllQuizzes = async (req, res) => {
    try {
        const quizzes = await Quiz.find({ isDeleted: false })
            .populate("class", "className") // Assuming 'className' exists in your Class model
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, count: quizzes.length, data: quizzes });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Get Single Quiz by ID (Admin/Edit View)
 * @route   GET /api/quizzes/:id
 */
export const getQuizById = async (req, res) => {
    try {
        const quiz = await Quiz.findOne({ _id: req.params.id, isDeleted: false });

        if (!quiz) {
            return res.status(404).json({ success: false, message: "Quiz not found" });
        }

        res.status(200).json({ success: true, data: quiz });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Update Quiz Details & Questions
 * @route   PUT /api/quizzes/:id
 */
export const updateQuiz = async (req, res) => {
    try {
        const updatedQuiz = await Quiz.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true, runValidators: true }
        );

        if (!updatedQuiz) {
            return res.status(404).json({ success: false, message: "Quiz not found" });
        }

        res.status(200).json({ success: true, data: updatedQuiz });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Soft Delete Quiz
 * @route   DELETE /api/quizzes/:id
 */
export const deleteQuiz = async (req, res) => {
    try {
        const quiz = await Quiz.findByIdAndUpdate(
            req.params.id,
            { isDeleted: true, isActive: false },
            { new: true }
        );

        if (!quiz) {
            return res.status(404).json({ success: false, message: "Quiz not found" });
        }

        res.status(200).json({ success: true, message: "Quiz deleted successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Toggle Publish Status (Make visible to students)
 * @route   PATCH /api/quizzes/:id/publish
 */
export const togglePublish = async (req, res) => {
    try {
        const quiz = await Quiz.findById(req.params.id);
        if (!quiz) return res.status(404).json({ message: "Quiz not found" });

        quiz.isPublished = !quiz.isPublished;
        await quiz.save();

        res.status(200).json({ 
            success: true, 
            message: `Quiz ${quiz.isPublished ? 'Published' : 'Unpublished'}`,
            isPublished: quiz.isPublished 
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Toggle Active Status (Enable/Disable Quiz)
 * @route   PATCH /api/quizzes/:id/active
 */
export const toggleActive = async (req, res) => {
    try {
        const quiz = await Quiz.findById(req.params.id);
        if (!quiz) return res.status(404).json({ message: "Quiz not found" });

        quiz.isActive = !quiz.isActive;
        await quiz.save();

        res.status(200).json({ 
            success: true, 
            isActive: quiz.isActive 
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Get Quizzes by Class (For Student Course View)
 * @route   GET /api/quizzes/class/:classId
 */
export const getQuizzesByClass = async (req, res) => {
    try {
        const quizzes = await Quiz.find({ 
            class: req.params.classId, 
            isDeleted: false, 
            isPublished: true 
        }).select("title description duration quizType scheduledAt expiresAt");

        res.status(200).json({ success: true, data: quizzes });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};