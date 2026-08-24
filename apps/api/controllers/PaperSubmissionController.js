import PaperSubmission from "../models/PaperSubmission.js";
import fs from "fs";
import path from "path";

class PaperSubmissionController {
    // Student: Submit a new paper
    async submitPaper(req, res) {
        try {
            if (!req.file) {
                return res.status(400).json({ success: false, message: "Please upload a document (PDF or ZIP)." });
            }

            const { paperName, year, examDetails } = req.body;
            const studentId = req.user.id;

            const fileUrl = `/uploads/essay-submissions/${req.file.filename}`;

            const submission = await PaperSubmission.create({
                student: studentId,
                paperName,
                year,
                examDetails,
                fileUrl
            });

            res.status(201).json({ success: true, data: submission });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    // Student: Get their own submissions
    async getStudentSubmissions(req, res) {
        try {
            const studentId = req.user.id;
            const submissions = await PaperSubmission.find({ student: studentId }).sort("-createdAt");
            res.status(200).json({ success: true, data: submissions });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    // Admin: Get all submissions (optionally filtered by status)
    async getAllSubmissions(req, res) {
        try {
            const { status } = req.query;
            const filter = status ? { status } : {};

            const submissions = await PaperSubmission.find(filter)
                .populate("student", "firstName lastName email")
                .sort("-createdAt");

            res.status(200).json({ success: true, count: submissions.length, data: submissions });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    // Admin: Grade a submission
    async gradeSubmission(req, res) {
        try {
            const { marks, feedback } = req.body;
            const submission = await PaperSubmission.findById(req.params.id);

            if (!submission) {
                return res.status(404).json({ success: false, message: "Submission not found" });
            }

            submission.marks = marks;
            submission.feedback = feedback;
            submission.status = "Graded";
            await submission.save();

            res.status(200).json({ success: true, data: submission });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}

export default new PaperSubmissionController();
