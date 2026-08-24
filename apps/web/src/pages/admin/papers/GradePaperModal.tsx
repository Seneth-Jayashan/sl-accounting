import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, CheckCircle2 } from "lucide-react";
import { gradeSubmission, type PaperSubmission } from "../../../services/PaperSubmissionService";

interface GradePaperModalProps {
  isOpen: boolean;
  onClose: () => void;
  submission: PaperSubmission | null;
  onSuccess: () => void;
}

export default function GradePaperModal({ isOpen, onClose, submission, onSuccess }: GradePaperModalProps) {
  const [marks, setMarks] = useState<number | "">(submission?.marks || "");
  const [feedback, setFeedback] = useState(submission?.feedback || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Update local state if submission changes
  React.useEffect(() => {
    if (submission) {
      setMarks(submission.marks ?? "");
      setFeedback(submission.feedback || "");
    }
  }, [submission]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submission) return;
    if (marks === "") {
      setError("Please enter marks.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await gradeSubmission(submission._id, Number(marks), feedback);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to submit grades.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-3xl w-full max-w-lg shadow-xl overflow-hidden"
          >
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h2 className="text-xl font-bold text-brand-prussian">Grade Essay Paper</h2>
              <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-white transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              {error && (
                <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100">
                  {error}
                </div>
              )}

              {submission && (
                <div className="mb-6 p-4 bg-blue-50 rounded-xl text-sm border border-blue-100 flex items-start gap-3">
                  <div className="mt-0.5">
                    <CheckCircle2 size={18} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="font-bold text-blue-900">{submission.paperName} ({submission.year})</p>
                    <p className="text-blue-700">Student: {submission.student?.firstName} {submission.student?.lastName}</p>
                  </div>
                </div>
              )}

              <div className="space-y-4 mb-8">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Marks (Out of 100) *</label>
                  <input
                    type="number"
                    value={marks}
                    onChange={(e) => setMarks(e.target.value === "" ? "" : Number(e.target.value))}
                    min="0"
                    max="100"
                    placeholder="e.g. 85"
                    className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-cerulean/20 focus:border-brand-cerulean outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Feedback (Optional)</label>
                  <textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Provide constructive feedback for the student..."
                    rows={4}
                    className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-cerulean/20 focus:border-brand-cerulean outline-none transition-all resize-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-xl font-bold text-gray-500 hover:bg-gray-100 transition-colors"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || marks === ""}
                  className="bg-brand-cerulean text-white px-8 py-2.5 rounded-xl font-bold shadow-md shadow-brand-cerulean/20 hover:bg-brand-prussian transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {loading && <Loader2 size={16} className="animate-spin" />}
                  Save Grades
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
