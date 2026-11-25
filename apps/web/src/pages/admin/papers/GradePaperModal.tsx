import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Loader2,
  CheckCircle2,
  FileText,
  Download,
  AlertTriangle,
  Award,
} from "lucide-react";
import {
  gradeSubmission,
  type PaperSubmission,
} from "../../../services/PaperSubmissionService";

interface GradePaperModalProps {
  isOpen: boolean;
  onClose: () => void;
  submission: PaperSubmission | null;
  onSuccess: () => void;
}

export default function GradePaperModal({
  isOpen,
  onClose,
  submission,
  onSuccess,
}: GradePaperModalProps) {
  const [marks, setMarks] = useState<number | "">(submission?.marks ?? "");
  const [feedback, setFeedback] = useState(submission?.feedback || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (submission && isOpen) {
      setMarks(submission.marks ?? "");
      setFeedback(submission.feedback || "");
      setError("");
    }
  }, [submission, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submission) return;
    if (marks === "" || Number(marks) < 0 || Number(marks) > 100) {
      setError("Please enter valid marks between 0 and 100.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await gradeSubmission(submission._id, Number(marks), feedback.trim());
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to submit grades.");
    } finally {
      setLoading(false);
    }
  };

  const numericMarks = marks === "" ? 0 : Math.min(100, Math.max(0, Number(marks)));
  const isEditing = submission?.status === "Graded";

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !loading && onClose()}
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
          />

          {/* Modal Dialog */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            transition={{ duration: 0.18 }}
            className="relative z-10 bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200/70 overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-brand-aliceBlue text-brand-cerulean flex items-center justify-center shrink-0">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-brand-prussian">
                    {isEditing ? "Edit Essay Grade" : "Grade Essay Paper"}
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Assign marks and optional feedback for the student.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => !loading && onClose()}
                disabled={loading}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <form
              id="grade-paper-form"
              onSubmit={handleSubmit}
              className="p-6 space-y-5 overflow-y-auto flex-1"
            >
              {error && (
                <div className="p-3.5 bg-rose-50 text-rose-700 rounded-xl text-xs font-semibold border border-rose-200/80 flex items-center gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Submission Context */}
              {submission && (
                <div className="p-4 bg-slate-50/90 rounded-xl border border-slate-200/70 flex items-center justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-white border border-slate-200/80 text-brand-cerulean flex items-center justify-center shrink-0 mt-0.5">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-sm text-brand-prussian truncate">
                        {submission.paperName}{" "}
                        <span className="text-slate-400 font-semibold">
                          ({submission.year})
                        </span>
                      </p>
                      <p className="text-xs text-slate-500 truncate mt-0.5">
                        {submission.student?.firstName}{" "}
                        {submission.student?.lastName}
                      </p>
                    </div>
                  </div>

                  {submission.fileUrl && (
                    <a
                      href={`${import.meta.env.VITE_API_BASE_URL}${submission.fileUrl}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200/80 text-xs font-semibold text-brand-prussian hover:text-brand-cerulean hover:border-brand-cerulean/40 shadow-sm transition-colors shrink-0"
                      title="Open submitted paper"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Paper</span>
                    </a>
                  )}
                </div>
              )}

              {/* Marks Input */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Marks <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    required
                    value={marks}
                    onChange={(e) => {
                      setMarks(
                        e.target.value === "" ? "" : Number(e.target.value)
                      );
                      if (error) setError("");
                    }}
                    min={0}
                    max={100}
                    placeholder="e.g., 85"
                    className="w-full pl-4 pr-16 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-sm font-bold text-brand-prussian tabular-nums placeholder:font-normal placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-brand-cerulean/20 focus:border-brand-cerulean outline-none transition-all"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 pointer-events-none">
                    / 100
                  </span>
                </div>

                {/* Live Score Bar */}
                {marks !== "" && (
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-200 ${numericMarks >= 75
                          ? "bg-emerald-500"
                          : numericMarks >= 40
                            ? "bg-brand-cerulean"
                            : "bg-rose-500"
                        }`}
                      style={{ width: `${numericMarks}%` }}
                    />
                  </div>
                )}
              </div>

              {/* Feedback Textarea */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Feedback{" "}
                  <span className="text-slate-400 font-normal normal-case">
                    (Optional)
                  </span>
                </label>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Provide constructive feedback, areas to improve, or working notes..."
                  rows={4}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200/80 rounded-xl text-sm text-slate-700 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-brand-cerulean/20 focus:border-brand-cerulean outline-none transition-all resize-none"
                />
              </div>
            </form>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/60 flex justify-end gap-2.5 shrink-0">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="grade-paper-form"
                disabled={loading || marks === ""}
                className="inline-flex items-center gap-2 bg-brand-prussian hover:bg-brand-cerulean text-white px-6 py-2.5 rounded-xl text-xs font-semibold shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                <span>{loading ? "Saving..." : "Save Grades"}</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}