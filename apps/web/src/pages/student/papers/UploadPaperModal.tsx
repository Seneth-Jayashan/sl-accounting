import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  UploadCloud,
  FileText,
  Loader2,
  Calendar,
  Tag,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Send,
} from "lucide-react";
import { submitPaper } from "../../../services/PaperSubmissionService";

interface UploadPaperModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024; // 20MB

export default function UploadPaperModal({
  isOpen,
  onClose,
  onSuccess,
}: UploadPaperModalProps) {
  const [paperName, setPaperName] = useState("");
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [examDetails, setExamDetails] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !loading) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, loading, onClose]);

  const validateAndSetFile = (selected: File | null) => {
    if (!selected) return;
    const ext = selected.name.split(".").pop()?.toLowerCase();
    if (!ext || !["pdf", "zip"].includes(ext)) {
      setError("Only PDF or ZIP files are supported.");
      return;
    }
    if (selected.size > MAX_FILE_SIZE_BYTES) {
      setError("File exceeds the 20MB maximum size limit.");
      return;
    }
    setError("");
    setFile(selected);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files?.[0] || null;
    validateAndSetFile(droppedFile);
  };

  const clearFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paperName.trim() || !year.trim() || !file) {
      setError("Paper Name, Year, and Document are required.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("paperName", paperName.trim());
      formData.append("year", year.trim());
      formData.append("examDetails", examDetails.trim());
      formData.append("file", file);

      await submitPaper(formData);
      onSuccess();
      onClose();

      // Reset form
      setPaperName("");
      setYear(new Date().getFullYear().toString());
      setExamDetails("");
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to submit paper.");
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
          onClick={() => !loading && onClose()}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-xs"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 12 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 12 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-gray-100 overflow-hidden"
          >
            {/* --- MODAL HEADER --- */}
            <div className="relative bg-gradient-to-r from-brand-prussian via-[#0d3a4b] to-brand-cerulean px-6 py-5 text-white flex items-center justify-between gap-4 overflow-hidden">
              <div className="pointer-events-none absolute -top-12 -right-12 w-36 h-36 bg-brand-jasmine/20 rounded-full blur-2xl" />

              <div className="relative z-10 flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-white/15 border border-white/15 backdrop-blur-md flex items-center justify-center shrink-0">
                  <UploadCloud size={20} className="text-brand-jasmine" />
                </div>
                <div>
                  <h2 className="text-lg font-extrabold tracking-tight leading-tight">
                    Upload Essay Paper
                  </h2>
                  <p className="text-xs text-white/75 mt-0.5">
                    Submit your answer script for instructor grading
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                aria-label="Close modal"
                className="relative z-10 w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white/85 hover:text-white flex items-center justify-center transition-colors disabled:opacity-50"
              >
                <X size={18} />
              </button>
            </div>

            {/* --- FORM BODY --- */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Error Banner */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="p-3.5 bg-red-50 text-red-700 rounded-2xl text-xs sm:text-sm font-medium border border-red-100 flex items-center justify-between gap-2.5"
                  >
                    <div className="flex items-center gap-2">
                      <AlertCircle size={16} className="text-red-500 shrink-0" />
                      <span>{error}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setError("")}
                      className="p-1 rounded-lg hover:bg-red-100 text-red-500"
                    >
                      <X size={14} />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Paper Name */}
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-500 mb-1.5">
                  Paper Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <FileText
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                  />
                  <input
                    type="text"
                    value={paperName}
                    onChange={(e) => setPaperName(e.target.value)}
                    placeholder="e.g. Accounting Model Paper 01"
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200/90 rounded-xl text-sm text-gray-800 placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-brand-cerulean/15 focus:border-brand-cerulean outline-none transition-all"
                  />
                </div>
              </div>

              {/* Year & Exam Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-500 mb-1.5">
                    Year <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Calendar
                      size={16}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                    />
                    <input
                      type="number"
                      value={year}
                      onChange={(e) => setYear(e.target.value)}
                      placeholder="YYYY"
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200/90 rounded-xl text-sm text-gray-800 placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-brand-cerulean/15 focus:border-brand-cerulean outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-500 mb-1.5">
                    Exam Details
                  </label>
                  <div className="relative">
                    <Tag
                      size={16}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                    />
                    <input
                      type="text"
                      value={examDetails}
                      onChange={(e) => setExamDetails(e.target.value)}
                      placeholder="e.g. English Medium"
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200/90 rounded-xl text-sm text-gray-800 placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-brand-cerulean/15 focus:border-brand-cerulean outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Drag & Drop File Upload */}
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-500 mb-1.5">
                  Upload Document <span className="text-red-500">*</span>
                </label>

                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept=".pdf,.zip"
                  onChange={(e) => validateAndSetFile(e.target.files?.[0] || null)}
                />

                {file ? (
                  <div className="p-4 rounded-2xl border-2 border-brand-cerulean/30 bg-brand-aliceBlue/35 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-xl bg-white text-brand-cerulean border border-brand-cerulean/20 flex items-center justify-center shrink-0 shadow-2xs">
                        <FileText size={20} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-brand-prussian truncate">
                          {file.name}
                        </p>
                        <p className="text-xs text-gray-500 font-medium flex items-center gap-1.5 mt-0.5">
                          <CheckCircle2 size={12} className="text-emerald-500" />
                          <span>
                            {(file.size / 1024 / 1024).toFixed(2)} MB • Ready to
                            upload
                          </span>
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={clearFile}
                      disabled={loading}
                      title="Remove file"
                      aria-label="Remove file"
                      className="p-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0"
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-2xl p-7 text-center cursor-pointer transition-all ${isDragging
                        ? "border-brand-cerulean bg-brand-aliceBlue/50 scale-[1.01]"
                        : "border-gray-200 bg-gray-50/60 hover:border-brand-cerulean/50 hover:bg-brand-aliceBlue/20"
                      }`}
                  >
                    <div className="w-12 h-12 rounded-2xl bg-white border border-gray-100 shadow-xs text-brand-cerulean flex items-center justify-center mx-auto mb-3">
                      <UploadCloud size={22} />
                    </div>
                    <p className="text-sm font-bold text-brand-prussian">
                      Click to browse or drag & drop
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      PDF or ZIP archive up to 20MB
                    </p>
                  </div>
                )}
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="px-5 py-2.5 rounded-xl text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !paperName.trim() || !year.trim() || !file}
                  className="inline-flex items-center gap-2 bg-brand-prussian hover:bg-brand-cerulean text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-md shadow-brand-prussian/15 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <Send size={15} />
                      <span>Submit Paper</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}