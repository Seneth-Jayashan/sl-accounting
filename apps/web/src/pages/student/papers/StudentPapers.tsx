import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  FileText,
  CheckCircle2,
  Clock,
  Search,
  X,
  Award,
  MessageSquare,
  Calendar,
  Hourglass,
  Sparkles,
} from "lucide-react";
import {
  getStudentSubmissions,
  type PaperSubmission,
} from "../../../services/PaperSubmissionService";
import UploadPaperModal from "./UploadPaperModal";

type SubmissionFilter = "all" | "graded" | "pending";

export default function StudentPapers() {
  const [submissions, setSubmissions] = useState<PaperSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filter, setFilter] = useState<SubmissionFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const data = await getStudentSubmissions();
      setSubmissions(data || []);
    } catch (error) {
      console.error("Failed to fetch submissions", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, []);

  // Stats & Counts
  const stats = useMemo(() => {
    const graded = submissions.filter((s) => s.status === "Graded").length;
    const pending = submissions.length - graded;
    return { all: submissions.length, graded, pending };
  }, [submissions]);

  // Filtered Submissions
  const filteredSubmissions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return submissions.filter((sub) => {
      const isGraded = sub.status === "Graded";
      if (filter === "graded" && !isGraded) return false;
      if (filter === "pending" && isGraded) return false;

      if (q) {
        return (
          (sub.paperName || "").toLowerCase().includes(q) ||
          String(sub.year || "").toLowerCase().includes(q) ||
          (sub.examDetails || "").toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [submissions, filter, searchQuery]);

  return (
    <div className="space-y-6 pb-24 sm:pb-10">
      {/* --- HERO BANNER --- */}
      <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-brand-prussian via-[#0d3a4b] to-brand-cerulean p-6 sm:p-8 text-white shadow-xl shadow-brand-prussian/15">
        <div className="pointer-events-none absolute -top-20 -right-16 w-72 h-72 rounded-full bg-brand-jasmine/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-1/3 w-64 h-64 rounded-full bg-white/10 blur-3xl" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-semibold text-brand-jasmine mb-3">
              <Sparkles size={13} />
              <span>Essay Assessments</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              My Essay Papers
            </h1>
            <p className="text-white/75 text-sm sm:text-base mt-1 max-w-xl">
              Upload your completed essay papers, track grading status, and
              review instructor feedback.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 self-start lg:self-auto shrink-0">
            <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl px-4 py-2.5 text-center min-w-[84px]">
              <p className="text-[10px] font-bold uppercase tracking-wider text-white/65">
                Graded
              </p>
              <p className="text-xl font-black text-emerald-300 mt-0.5">
                {stats.graded}
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl px-4 py-2.5 text-center min-w-[84px]">
              <p className="text-[10px] font-bold uppercase tracking-wider text-white/65">
                Pending
              </p>
              <p className="text-xl font-black text-brand-jasmine mt-0.5">
                {stats.pending}
              </p>
            </div>

            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 bg-brand-jasmine hover:bg-white text-brand-prussian px-5 py-3.5 rounded-2xl text-sm font-extrabold transition-all shadow-lg active:scale-95"
            >
              <Plus size={18} strokeWidth={2.5} />
              <span>Submit Paper</span>
            </button>
          </div>
        </div>
      </section>

      {/* --- FILTER & SEARCH TOOLBAR --- */}
      {submissions.length > 0 && (
        <div className="bg-white rounded-2xl p-3 sm:p-4 border border-gray-100 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Filter Tabs */}
          <div className="flex items-center gap-1.5 bg-gray-100/80 p-1 rounded-xl overflow-x-auto scrollbar-hide">
            {(
              [
                { key: "all", label: "All Papers", count: stats.all },
                { key: "graded", label: "Graded", count: stats.graded },
                { key: "pending", label: "Pending", count: stats.pending },
              ] as const
            ).map((tab) => {
              const active = filter === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key)}
                  className={`flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-bold rounded-lg whitespace-nowrap transition-all ${active
                      ? "bg-white text-brand-prussian shadow-sm ring-1 ring-black/5"
                      : "text-gray-500 hover:text-gray-800"
                    }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-md ${active
                        ? "bg-brand-cerulean/10 text-brand-cerulean"
                        : "bg-gray-200/70 text-gray-500"
                      }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-72">
            <Search
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search paper, year, exam..."
              className="w-full pl-9 pr-8 py-2.5 text-sm bg-gray-50 border border-gray-200/80 rounded-xl focus:outline-none focus:bg-white focus:border-brand-cerulean focus:ring-2 focus:ring-brand-cerulean/15 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* --- CONTENT AREA --- */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4 h-64 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-gray-100" />
                  <div className="w-20 h-6 rounded-full bg-gray-100" />
                </div>
                <div className="h-5 bg-gray-200 rounded-lg w-3/4" />
                <div className="h-4 bg-gray-100 rounded-lg w-1/2" />
              </div>
              <div className="h-16 bg-gray-50 rounded-2xl" />
            </div>
          ))}
        </div>
      ) : submissions.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 sm:p-16 text-center border border-dashed border-gray-200 shadow-sm flex flex-col items-center">
          <div className="w-16 h-16 bg-brand-aliceBlue text-brand-cerulean rounded-2xl flex items-center justify-center mb-4">
            <FileText size={30} />
          </div>
          <h3 className="text-lg sm:text-xl font-extrabold text-brand-prussian mb-1">
            No Submissions Yet
          </h3>
          <p className="text-sm text-gray-400 max-w-sm mb-6 leading-relaxed">
            You haven't submitted any essay papers for review yet. Upload your
            first completed paper to receive marks and feedback.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 bg-brand-prussian hover:bg-brand-cerulean text-white px-6 py-3 rounded-2xl text-sm font-bold shadow-md transition-all active:scale-95"
          >
            <Plus size={17} />
            <span>Upload Your First Paper</span>
          </button>
        </div>
      ) : filteredSubmissions.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-gray-200">
          <p className="text-base font-bold text-brand-prussian mb-1">
            No matching submissions found
          </p>
          <p className="text-sm text-gray-400 mb-5">
            Try clearing your search or switching the status filter.
          </p>
          <button
            onClick={() => {
              setSearchQuery("");
              setFilter("all");
            }}
            className="px-5 py-2 rounded-xl bg-gray-100 text-gray-700 text-xs font-bold hover:bg-gray-200 transition-colors"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          <AnimatePresence mode="popLayout">
            {filteredSubmissions.map((sub, idx) => {
              const isGraded = sub.status === "Graded";

              return (
                <motion.article
                  layout
                  key={sub._id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ delay: idx * 0.04, duration: 0.25 }}
                  className="group relative bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-xl hover:shadow-brand-prussian/8 hover:border-brand-cerulean/30 hover:-translate-y-1 transition-all duration-300 flex flex-col"
                >
                  {/* Top Status Accent Bar */}
                  <div
                    className={`h-1.5 w-full ${isGraded ? "bg-emerald-500" : "bg-amber-400"
                      }`}
                  />

                  <div className="p-5 sm:p-6 flex-1 flex flex-col">
                    {/* Header Row: Icon & Status Pill */}
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-105 ${isGraded
                            ? "bg-emerald-50 text-emerald-600"
                            : "bg-brand-cerulean/10 text-brand-cerulean"
                          }`}
                      >
                        <FileText size={22} />
                      </div>

                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${isGraded
                            ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                            : "bg-amber-50 text-amber-700 border-amber-100"
                          }`}
                      >
                        {isGraded ? (
                          <CheckCircle2 size={12} />
                        ) : (
                          <Clock size={12} />
                        )}
                        {sub.status}
                      </span>
                    </div>

                    {/* Title & Meta */}
                    <h3
                      className="font-extrabold text-base sm:text-lg text-brand-prussian leading-snug line-clamp-2 group-hover:text-brand-cerulean transition-colors"
                      title={sub.paperName}
                    >
                      {sub.paperName}
                    </h3>

                    <div className="flex flex-wrap items-center gap-2 mt-2 mb-5">
                      {sub.year && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-brand-aliceBlue text-brand-prussian text-[11px] font-bold">
                          <Calendar size={11} className="text-brand-cerulean" />
                          {sub.year}
                        </span>
                      )}
                      {sub.examDetails && (
                        <span className="text-xs font-semibold text-gray-500 truncate">
                          {sub.examDetails}
                        </span>
                      )}
                    </div>

                    {/* Footer: Marks & Feedback OR Pending Status */}
                    <div className="mt-auto pt-4 border-t border-gray-100">
                      {isGraded ? (
                        <div className="space-y-3">
                          {/* Score Tile */}
                          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-100">
                            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-700">
                              <Award size={16} className="text-emerald-600" />
                              <span>Final Marks</span>
                            </div>
                            <div className="flex items-baseline gap-1">
                              <span className="text-2xl font-black text-emerald-700">
                                {sub.marks}
                              </span>
                              <span className="text-[11px] font-bold text-emerald-600/80">
                                pts
                              </span>
                            </div>
                          </div>

                          {/* Teacher Feedback */}
                          {sub.feedback && (
                            <div className="bg-gray-50 rounded-2xl p-3.5 border border-gray-100">
                              <p className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 flex items-center gap-1.5 mb-1.5">
                                <MessageSquare
                                  size={12}
                                  className="text-brand-cerulean"
                                />
                                Instructor Feedback
                              </p>
                              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                                {sub.feedback}
                              </p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-amber-50/60 border border-amber-100/80 text-amber-800">
                          <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center text-amber-500 shadow-2xs shrink-0">
                            <Hourglass size={15} />
                          </div>
                          <div>
                            <p className="text-xs font-bold leading-tight">
                              Under Review
                            </p>
                            <p className="text-[11px] text-amber-700/80 mt-0.5">
                              Your paper is queued for instructor grading.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Upload Modal */}
      <UploadPaperModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchSubmissions}
      />
    </div>
  );
}