import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { FileText, Loader2, Download, CheckCircle2, Clock, Search, Filter } from "lucide-react";
import { getAllSubmissions, type PaperSubmission } from "../../../services/PaperSubmissionService";
import GradePaperModal from "./GradePaperModal";

export default function AdminPapers() {
  const [submissions, setSubmissions] = useState<PaperSubmission[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtering and Searching
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | "Pending" | "Graded">("All");

  // Grading Modal State
  const [isGradeModalOpen, setIsGradeModalOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<PaperSubmission | null>(null);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const data = await getAllSubmissions();
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

  const handleGradeClick = (sub: PaperSubmission) => {
    setSelectedSubmission(sub);
    setIsGradeModalOpen(true);
  };

  const filteredSubmissions = useMemo(() => {
    return submissions.filter(sub => {
      const matchesSearch =
        sub.paperName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sub.student?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sub.student?.lastName?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === "All" || sub.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [submissions, searchTerm, statusFilter]);

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto pb-24 font-sans bg-gray-50/50 min-h-screen">
      <header className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-black text-brand-prussian tracking-tight">Essay Submissions</h1>
        <p className="text-sm text-gray-500 mt-1">Review, download, and grade student paper submissions.</p>
      </header>

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-8 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by student or paper name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-cerulean/20 outline-none transition-all"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter size={18} className="text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="w-full md:w-auto p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-cerulean/20 outline-none"
          >
            <option value="All">All Statuses</option>
            <option value="Pending">Pending Review</option>
            <option value="Graded">Graded</option>
          </select>
        </div>
      </div>

      {/* Submissions List */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center">
          <Loader2 className="w-10 h-10 text-brand-cerulean animate-spin mb-4" />
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Loading Submissions...</p>
        </div>
      ) : filteredSubmissions.length === 0 ? (
        <div className="bg-white rounded-3xl p-16 text-center border border-dashed border-gray-200 flex flex-col items-center">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
            <FileText className="w-10 h-10 text-gray-300" />
          </div>
          <h3 className="text-xl font-bold text-brand-prussian mb-2">No Submissions Found</h3>
          <p className="text-sm text-gray-500 max-w-sm mb-6">Try adjusting your search or filters.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Student</th>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Paper Details</th>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Marks</th>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSubmissions.map((sub, idx) => (
                  <motion.tr
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    key={sub._id}
                    className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors group"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-brand-aliceBlue flex items-center justify-center text-brand-cerulean font-bold text-sm">
                          {sub.student?.firstName?.[0] || 'S'}
                        </div>
                        <div>
                          <p className="font-bold text-brand-prussian text-sm">
                            {sub.student?.firstName} {sub.student?.lastName}
                          </p>
                          <p className="text-xs text-gray-500">{sub.student?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="font-bold text-brand-prussian text-sm">{sub.paperName}</p>
                      <p className="text-xs text-gray-500">Year: {sub.year} {sub.examDetails && `| ${sub.examDetails}`}</p>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider items-center gap-1 ${sub.status === 'Graded' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                        }`}>
                        {sub.status === 'Graded' ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                        {sub.status}
                      </span>
                    </td>
                    <td className="p-4">
                      {sub.status === 'Graded' ? (
                        <span className="font-black text-brand-cerulean text-lg">{sub.marks}</span>
                      ) : (
                        <span className="text-gray-400 text-sm">-</span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <a
                          href={`${import.meta.env.VITE_API_BASE_URL}${sub.fileUrl}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 rounded-xl text-gray-500 hover:text-brand-cerulean hover:bg-brand-aliceBlue transition-colors"
                          title="Download Document"
                        >
                          <Download size={18} />
                        </a>
                        <button
                          onClick={() => handleGradeClick(sub)}
                          className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-colors ${sub.status === 'Pending'
                              ? 'bg-brand-cerulean text-white hover:bg-brand-prussian shadow-sm shadow-brand-cerulean/20'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                        >
                          {sub.status === 'Pending' ? 'Grade' : 'Edit Grade'}
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Grading Modal */}
      <GradePaperModal
        isOpen={isGradeModalOpen}
        onClose={() => setIsGradeModalOpen(false)}
        submission={selectedSubmission}
        onSuccess={fetchSubmissions}
      />
    </div>
  );
}
