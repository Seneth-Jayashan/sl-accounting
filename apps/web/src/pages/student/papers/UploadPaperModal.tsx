import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Upload, FileText, Loader2 } from "lucide-react";
import { submitPaper } from "../../../services/PaperSubmissionService";

interface UploadPaperModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function UploadPaperModal({ isOpen, onClose, onSuccess }: UploadPaperModalProps) {
  const [paperName, setPaperName] = useState("");
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [examDetails, setExamDetails] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paperName || !year || !file) {
      setError("Paper Name, Year, and Document are required.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("paperName", paperName);
      formData.append("year", year);
      formData.append("examDetails", examDetails);
      formData.append("file", file);

      await submitPaper(formData);
      onSuccess();
      onClose();
      // Reset form
      setPaperName("");
      setYear(new Date().getFullYear().toString());
      setExamDetails("");
      setFile(null);
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-3xl w-full max-w-lg shadow-xl overflow-hidden"
          >
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-brand-prussian">Upload Essay Paper</h2>
              <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              {error && (
                <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100">
                  {error}
                </div>
              )}

              <div className="space-y-4 mb-8">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Paper Name *</label>
                  <input
                    type="text"
                    value={paperName}
                    onChange={(e) => setPaperName(e.target.value)}
                    placeholder="e.g. Accounting Model Paper 01"
                    className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-cerulean/20 focus:border-brand-cerulean outline-none transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Year *</label>
                    <input
                      type="number"
                      value={year}
                      onChange={(e) => setYear(e.target.value)}
                      placeholder="YYYY"
                      className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-cerulean/20 focus:border-brand-cerulean outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Exam Details</label>
                    <input
                      type="text"
                      value={examDetails}
                      onChange={(e) => setExamDetails(e.target.value)}
                      placeholder="e.g. English Medium"
                      className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-cerulean/20 focus:border-brand-cerulean outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Upload Document *</label>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${file ? "border-brand-cerulean bg-brand-cerulean/5" : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"}`}
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept=".pdf,.zip"
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                    />
                    {file ? (
                      <div className="flex flex-col items-center">
                        <FileText className="w-8 h-8 text-brand-cerulean mb-2" />
                        <span className="text-sm font-semibold text-brand-prussian">{file.name}</span>
                        <span className="text-xs text-gray-500 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center text-gray-500">
                        <Upload className="w-8 h-8 mb-2 text-gray-400" />
                        <span className="text-sm font-semibold text-brand-prussian mb-1">Click to browse</span>
                        <span className="text-xs text-gray-400">PDF or ZIP (Max 20MB)</span>
                      </div>
                    )}
                  </div>
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
                  disabled={loading || !paperName || !year || !file}
                  className="bg-brand-cerulean text-white px-8 py-2.5 rounded-xl font-bold shadow-md shadow-brand-cerulean/20 hover:bg-brand-prussian transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {loading && <Loader2 size={16} className="animate-spin" />}
                  Submit Paper
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
