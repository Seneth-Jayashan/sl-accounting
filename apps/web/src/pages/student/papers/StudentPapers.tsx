import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, FileText, Loader2, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { getStudentSubmissions, type PaperSubmission } from "../../../services/PaperSubmissionService";
import UploadPaperModal from "./UploadPaperModal";

export default function StudentPapers() {
  const [submissions, setSubmissions] = useState<PaperSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const data = await getStudentSubmissions();
      setSubmissions(data);
    } catch (error) {
      console.error("Failed to fetch submissions", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, []);

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto pb-24 font-sans min-h-screen bg-gray-50/50">
      <header className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-brand-prussian tracking-tight">My Essay Papers</h1>
          <p className="text-sm text-gray-500 mt-1">Submit your completed essay papers for review and grading.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-brand-cerulean text-white px-6 py-3 rounded-xl font-bold shadow-md shadow-brand-cerulean/20 hover:bg-brand-prussian transition-all flex items-center justify-center gap-2"
        >
          <Plus size={20} />
          Submit Paper
        </button>
      </header>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center">
          <Loader2 className="w-10 h-10 text-brand-cerulean animate-spin mb-4" />
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Loading Submissions...</p>
        </div>
      ) : submissions.length === 0 ? (
        <div className="bg-white rounded-3xl p-16 text-center border border-dashed border-gray-200 flex flex-col items-center">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
            <FileText className="w-10 h-10 text-gray-300" />
          </div>
          <h3 className="text-xl font-bold text-brand-prussian mb-2">No Submissions Yet</h3>
          <p className="text-sm text-gray-500 max-w-sm mb-6">You haven't submitted any essay papers for review. Click the button above to upload your first paper.</p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="text-brand-cerulean font-bold hover:underline"
          >
            Upload a Paper
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {submissions.map((sub) => (
              <motion.div
                key={sub._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-xl hover:border-brand-cerulean/30 transition-all flex flex-col p-6"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 rounded-xl bg-brand-aliceBlue flex items-center justify-center text-brand-cerulean">
                    <FileText size={24} />
                  </div>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${sub.status === 'Graded' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                    {sub.status === 'Graded' ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                    {sub.status}
                  </span>
                </div>

                <h3 className="font-bold text-lg text-brand-prussian mb-1 line-clamp-1" title={sub.paperName}>
                  {sub.paperName}
                </h3>
                <p className="text-xs text-gray-500 mb-4 font-semibold uppercase tracking-wider">
                  {sub.year} {sub.examDetails && `• ${sub.examDetails}`}
                </p>

                <div className="mt-auto pt-4 border-t border-gray-50">
                  {sub.status === 'Graded' ? (
                    <div>
                      <div className="flex items-end gap-2 mb-2">
                        <span className="text-3xl font-black text-brand-cerulean">{sub.marks}</span>
                        <span className="text-sm font-bold text-gray-400 mb-1">Marks</span>
                      </div>
                      {sub.feedback && (
                        <div className="bg-gray-50 rounded-xl p-3 text-sm text-gray-600 mt-2">
                          <span className="font-bold text-gray-700 block mb-1">Feedback:</span>
                          {sub.feedback}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 p-3 rounded-xl">
                      <AlertCircle size={16} className="text-gray-400" />
                      Pending admin review.
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <UploadPaperModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchSubmissions}
      />
    </div>
  );
}
