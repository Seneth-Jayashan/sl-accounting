import { useEffect, useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import {
  FileText,
  Download,
  CheckCircle2,
  Clock,
  Search,
  RefreshCw,
  X,
  Award,
  Pencil,
} from "lucide-react";
import {
  getAllSubmissions,
  type PaperSubmission,
} from "../../../services/PaperSubmissionService";
import GradePaperModal from "./GradePaperModal";

// --- Skeleton Loader ---

function PapersSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 bg-white rounded-2xl border border-slate-100 p-6">
            <div className="h-3 w-24 bg-slate-200 rounded mb-4" />
            <div className="h-7 w-16 bg-slate-200 rounded" />
          </div>
        ))}
      </div>
      <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4">
        <div className="h-10 w-72 bg-slate-100 rounded-xl" />
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-16 bg-slate-50 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

// --- Main Component ---

export default function AdminPapers() {
  const [submissions, setSubmissions] = useState<PaperSubmission[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtering and Searching
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | "Pending" | "Graded">("All");

  // Grading Modal State
  const [isGradeModalOpen, setIsGradeModalOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] =
    useState<PaperSubmission | null>(null);

  const fetchSubmissions = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAllSubmissions();
      setSubmissions(data || []);
    } catch (error) {
      console.error("Failed to fetch submissions", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  const handleGradeClick = (sub: PaperSubmission) => {
    setSelectedSubmission(sub);
    setIsGradeModalOpen(true);
  };

  // Derived KPI Stats
  const stats = useMemo(() => {
    const total = submissions.length;
    const gradedList = submissions.filter((s) => s.status === "Graded");
    const pending = total - gradedList.length;
    const numericMarks = gradedList
      .map((s) => Number(s.marks))
      .filter((m) => !isNaN(m));
    const avgMarks =
      numericMarks.length > 0
        ? Math.round(
          numericMarks.reduce((sum, m) => sum + m, 0) / numericMarks.length
        )
        : 0;

    return {
      total,
      pending,
      graded: gradedList.length,
      avgMarks,
    };
  }, [submissions]);

  // Filtered Submissions
  const filteredSubmissions = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return submissions.filter((sub) => {
      const matchesStatus =
        statusFilter === "All" || sub.status === statusFilter;
      if (!matchesStatus) return false;
      if (!q) return true;

      const studentName = `${sub.student?.firstName || ""} ${sub.student?.lastName || ""
        }`.toLowerCase();
      const email = (sub.student?.email || "").toLowerCase();
      const year = String(sub.year || "").toLowerCase();

      return (
        sub.paperName.toLowerCase().includes(q) ||
        studentName.includes(q) ||
        email.includes(q) ||
        year.includes(q)
      );
    });
  }, [submissions, searchTerm, statusFilter]);

  return (
    <div className="space-y-6 md:space-y-8 pb-24 md:pb-12">
      {/* HEADER */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-brand-prussian tracking-tight">
            Essay Submissions
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Review, download, and grade student essay paper submissions.
          </p>
        </div>

        <button
          onClick={fetchSubmissions}
          disabled={loading}
          className="inline-flex items-center gap-2 self-start sm:self-auto px-4 py-2.5 bg-white rounded-xl border border-slate-200/80 shadow-sm text-xs font-semibold text-slate-600 hover:text-brand-cerulean hover:border-brand-cerulean/40 transition-colors disabled:opacity-50"
        >
          <RefreshCw
            className={`w-4 h-4 ${loading ? "animate-spin text-brand-cerulean" : ""
              }`}
          />
          <span>Refresh</span>
        </button>
      </header>

      {/* LOADING SKELETON */}
      {loading && submissions.length === 0 ? (
        <PapersSkeleton />
      ) : (
        <div className="space-y-6">
          {/* KPI SUMMARY CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="relative overflow-hidden bg-white p-6 rounded-2xl border border-slate-200/70 shadow-sm">
              <div className="pointer-events-none absolute -top-10 -right-10 w-24 h-24 rounded-full bg-blue-500/10 blur-2xl" />
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Total Papers
                  </p>
                  <h3 className="text-3xl font-bold text-brand-prussian mt-2 tabular-nums">
                    {stats.total}
                  </h3>
                </div>
                <div className="p-3 rounded-xl bg-blue-50 text-blue-600 ring-1 ring-blue-100">
                  <FileText className="w-5 h-5" />
                </div>
              </div>
            </div>

            <div className="relative overflow-hidden bg-white p-6 rounded-2xl border border-slate-200/70 shadow-sm">
              <div className="pointer-events-none absolute -top-10 -right-10 w-24 h-24 rounded-full bg-amber-500/10 blur-2xl" />
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Pending Review
                  </p>
                  <h3 className="text-3xl font-bold text-brand-prussian mt-2 tabular-nums">
                    {stats.pending}
                  </h3>
                </div>
                <div className="p-3 rounded-xl bg-amber-50 text-amber-600 ring-1 ring-amber-100">
                  <Clock className="w-5 h-5" />
                </div>
              </div>
            </div>

            <div className="relative overflow-hidden bg-white p-6 rounded-2xl border border-slate-200/70 shadow-sm">
              <div className="pointer-events-none absolute -top-10 -right-10 w-24 h-24 rounded-full bg-emerald-500/10 blur-2xl" />
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Graded
                  </p>
                  <h3 className="text-3xl font-bold text-brand-prussian mt-2 tabular-nums">
                    {stats.graded}
                  </h3>
                </div>
                <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              </div>
            </div>

            <div className="relative overflow-hidden bg-white p-6 rounded-2xl border border-slate-200/70 shadow-sm">
              <div className="pointer-events-none absolute -top-10 -right-10 w-24 h-24 rounded-full bg-purple-500/10 blur-2xl" />
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Avg. Marks
                  </p>
                  <h3 className="text-3xl font-bold text-brand-prussian mt-2 tabular-nums">
                    {stats.graded > 0 ? stats.avgMarks : "—"}
                  </h3>
                </div>
                <div className="p-3 rounded-xl bg-purple-50 text-purple-600 ring-1 ring-purple-100">
                  <Award className="w-5 h-5" />
                </div>
              </div>
            </div>
          </div>

          {/* DIRECTORY CARD */}
          <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm overflow-hidden">
            {/* Toolbar */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search by student, paper name, or year..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-9 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-sm text-slate-700 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-cerulean/20 focus:border-brand-cerulean transition-all"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Status Filter Pills */}
              <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200/60 self-start lg:self-auto">
                {(
                  [
                    { key: "All", label: "All", count: stats.total },
                    { key: "Pending", label: "Pending", count: stats.pending },
                    { key: "Graded", label: "Graded", count: stats.graded },
                  ] as const
                ).map((tab) => {
                  const active = statusFilter === tab.key;
                  return (
                    <button
                      key={tab.key}
                      onClick={() => setStatusFilter(tab.key)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${active
                          ? "bg-white text-brand-prussian shadow-sm"
                          : "text-slate-500 hover:text-slate-700"
                        }`}
                    >
                      <span>{tab.label}</span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] tabular-nums ${active
                            ? "bg-brand-aliceBlue text-brand-cerulean"
                            : "bg-slate-200/70 text-slate-500"
                          }`}
                      >
                        {tab.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Empty State */}
            {filteredSubmissions.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center py-16 px-4">
                <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mb-3 border border-slate-100">
                  <FileText className="w-7 h-7 text-slate-300" />
                </div>
                <h3 className="text-sm font-semibold text-brand-prussian">
                  No submissions found
                </h3>
                <p className="text-xs text-slate-400 mt-1 max-w-xs">
                  {submissions.length === 0
                    ? "Student essay paper submissions will appear here once uploaded."
                    : "Try adjusting your search query or status filter."}
                </p>
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50/80 text-[11px] uppercase tracking-wider text-slate-500 font-semibold border-b border-slate-100">
                      <tr>
                        <th className="px-6 py-3.5">Student</th>
                        <th className="px-6 py-3.5">Paper Details</th>
                        <th className="px-6 py-3.5">Status</th>
                        <th className="px-6 py-3.5">Marks</th>
                        <th className="px-6 py-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredSubmissions.map((sub, idx) => {
                        const isGraded = sub.status === "Graded";
                        const initials = `${sub.student?.firstName?.[0] || "S"}${sub.student?.lastName?.[0] || ""
                          }`.toUpperCase();

                        return (
                          <motion.tr
                            key={sub._id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: Math.min(idx * 0.03, 0.2) }}
                            className="hover:bg-slate-50/80 transition-colors"
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-brand-aliceBlue text-brand-cerulean ring-1 ring-brand-cerulean/20 flex items-center justify-center font-bold text-xs shrink-0">
                                  {initials}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-semibold text-brand-prussian text-sm truncate">
                                    {sub.student?.firstName} {sub.student?.lastName}
                                  </p>
                                  <p className="text-xs text-slate-400 truncate">
                                    {sub.student?.email}
                                  </p>
                                </div>
                              </div>
                            </td>

                            <td className="px-6 py-4">
                              <p className="font-semibold text-brand-prussian text-sm">
                                {sub.paperName}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md tabular-nums">
                                  Year {sub.year}
                                </span>
                                {sub.examDetails && (
                                  <span className="text-xs text-slate-400 truncate max-w-xs">
                                    {sub.examDetails}
                                  </span>
                                )}
                              </div>
                            </td>

                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ring-1 ${isGraded
                                    ? "bg-emerald-50 text-emerald-700 ring-emerald-600/15"
                                    : "bg-amber-50 text-amber-700 ring-amber-600/15"
                                  }`}
                              >
                                {isGraded ? (
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                ) : (
                                  <Clock className="w-3.5 h-3.5" />
                                )}
                                {sub.status}
                              </span>
                            </td>

                            <td className="px-6 py-4 whitespace-nowrap">
                              {isGraded ? (
                                <span className="text-base font-bold text-brand-cerulean tabular-nums">
                                  {sub.marks}
                                </span>
                              ) : (
                                <span className="text-slate-300 text-sm">—</span>
                              )}
                            </td>

                            <td className="px-6 py-4 text-right whitespace-nowrap">
                              <div className="inline-flex items-center justify-end gap-2">
                                <a
                                  href={`${import.meta.env.VITE_API_BASE_URL}${sub.fileUrl}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="p-2 rounded-xl text-slate-400 hover:text-brand-cerulean hover:bg-brand-aliceBlue border border-slate-200/70 transition-colors"
                                  title="Download submission"
                                >
                                  <Download className="w-4 h-4" />
                                </a>

                                <button
                                  onClick={() => handleGradeClick(sub)}
                                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${isGraded
                                      ? "bg-slate-50 text-brand-prussian border border-slate-200/80 hover:bg-brand-aliceBlue hover:text-brand-cerulean"
                                      : "bg-brand-prussian text-white hover:bg-brand-cerulean shadow-sm"
                                    }`}
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                  <span>{isGraded ? "Edit Grade" : "Grade"}</span>
                                </button>
                              </div>
                            </td>
                          </motion.tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden divide-y divide-slate-100">
                  {filteredSubmissions.map((sub) => {
                    const isGraded = sub.status === "Graded";
                    return (
                      <div key={sub._id} className="p-4 bg-white space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-semibold text-sm text-brand-prussian truncate">
                              {sub.paperName}
                            </p>
                            <p className="text-xs text-slate-400 truncate mt-0.5">
                              {sub.student?.firstName} {sub.student?.lastName} • Year{" "}
                              {sub.year}
                            </p>
                          </div>

                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ring-1 shrink-0 ${isGraded
                                ? "bg-emerald-50 text-emerald-700 ring-emerald-600/15"
                                : "bg-amber-50 text-amber-700 ring-amber-600/15"
                              }`}
                          >
                            {sub.status}
                          </span>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                          <div className="text-xs text-slate-500">
                            Marks:{" "}
                            <strong className="text-brand-cerulean tabular-nums">
                              {isGraded ? sub.marks : "Pending"}
                            </strong>
                          </div>

                          <div className="flex items-center gap-2">
                            <a
                              href={`${import.meta.env.VITE_API_BASE_URL}${sub.fileUrl}`}
                              target="_blank"
                              rel="noreferrer"
                              className="p-2 rounded-lg bg-slate-50 text-slate-500 hover:text-brand-cerulean border border-slate-200/70"
                              title="Download"
                            >
                              <Download className="w-4 h-4" />
                            </a>
                            <button
                              onClick={() => handleGradeClick(sub)}
                              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold ${isGraded
                                  ? "bg-slate-100 text-brand-prussian"
                                  : "bg-brand-prussian text-white"
                                }`}
                            >
                              {isGraded ? "Edit Grade" : "Grade"}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
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