import React, { useEffect, useState, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  Clock,
  BookOpen,
  BarChart,
  FileDown,
  FileText,
  RefreshCw,
  X,
  AlertTriangle,
  Loader2,
  FileEdit,
  Filter,
  ChevronDown,
} from "lucide-react";
import QuizService, { type Quiz } from "../../../services/QuizService";
import { QuizDocumentGenerator } from "../../../utils/QuizDocumentGenerator";
import { toast } from "react-hot-toast";

// --- Skeleton Loader ---

function QuizzesSkeleton() {
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

// --- Helpers ---

const getQuizTypeBadge = (type: string) => {
  switch (type) {
    case "live":
      return {
        pill: "bg-rose-50 text-rose-700 ring-rose-600/15",
        dot: "bg-rose-500 animate-pulse",
        label: "Live",
      };
    case "schedule":
      return {
        pill: "bg-blue-50 text-blue-700 ring-blue-600/15",
        dot: "bg-blue-500",
        label: "Scheduled",
      };
    default:
      return {
        pill: "bg-slate-100 text-slate-600 ring-slate-300/70",
        dot: "bg-slate-400",
        label: type || "Practice",
      };
  }
};

// --- Main Component ---

const Quizzes: React.FC = () => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft">("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  // Delete Confirmation Modal State
  const [deleteTarget, setDeleteTarget] = useState<Quiz | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const fetchQuizzes = useCallback(async () => {
    try {
      setLoading(true);
      const response = await QuizService.getAllQuizzes();
      if (response.success) {
        setQuizzes(response.data || []);
      }
    } catch (error) {
      toast.error("Failed to load quizzes");
      console.error("Error fetching quizzes:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQuizzes();
  }, [fetchQuizzes]);

  // Derived Stats
  const stats = useMemo(() => {
    const published = quizzes.filter((q) => q.isPublished).length;
    const liveOrScheduled = quizzes.filter((q) => q.quizType !== "practice").length;
    return {
      total: quizzes.length,
      published,
      drafts: quizzes.length - published,
      liveOrScheduled,
    };
  }, [quizzes]);

  // Filtered Quizzes
  const filteredQuizzes = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return quizzes.filter((quiz) => {
      if (statusFilter === "published" && !quiz.isPublished) return false;
      if (statusFilter === "draft" && quiz.isPublished) return false;
      if (typeFilter !== "all" && quiz.quizType !== typeFilter) return false;
      if (!q) return true;

      const className =
        typeof quiz.class === "object" && quiz.class !== null
          ? (quiz.class as any).name || ""
          : "";
      return (
        quiz.title.toLowerCase().includes(q) ||
        className.toLowerCase().includes(q)
      );
    });
  }, [quizzes, searchTerm, statusFilter, typeFilter]);

  // --- Handlers ---

  const handleTogglePublish = async (id: string) => {
    setTogglingId(id);
    try {
      const response = await QuizService.togglePublish(id);
      if (response.success) {
        setQuizzes((prev) =>
          prev.map((q) =>
            q._id === id ? { ...q, isPublished: !q.isPublished } : q
          )
        );
        toast.success(response.message || "Quiz status updated");
      }
    } catch (error) {
      toast.error("Error updating status");
      console.error("Error toggling publish status:", error);
    } finally {
      setTogglingId(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const response = await QuizService.deleteQuiz(deleteTarget._id);
      if (response.success) {
        setQuizzes((prev) => prev.filter((q) => q._id !== deleteTarget._id));
        toast.success(response.message || "Quiz deleted successfully");
        setDeleteTarget(null);
      }
    } catch (error) {
      toast.error("Failed to delete quiz");
      console.error("Error deleting quiz:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDownloadPdf = (quiz: Quiz) => {
    toast.promise(QuizDocumentGenerator.generateQuizPdf(quiz), {
      loading: "Generating PDF...",
      success: "PDF downloaded!",
      error: "Failed to generate PDF",
    });
  };

  const handleDownloadDocx = (quiz: Quiz) => {
    toast.promise(QuizDocumentGenerator.generateQuizDocx(quiz), {
      loading: "Generating Word document...",
      success: "Word document downloaded!",
      error: "Failed to generate Word document",
    });
  };

  return (
    <div className="space-y-6 md:space-y-8 pb-24 md:pb-12">
      {/* HEADER */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-brand-prussian tracking-tight">
            Quiz Management
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Create, publish, export, and analyze exams for SL Accounting batches.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={fetchQuizzes}
            disabled={loading}
            title="Refresh quizzes"
            className="p-2.5 bg-white rounded-xl border border-slate-200/80 shadow-sm text-slate-600 hover:text-brand-cerulean hover:border-brand-cerulean/40 transition-colors disabled:opacity-50"
          >
            <RefreshCw
              className={`w-4 h-4 ${loading ? "animate-spin text-brand-cerulean" : ""}`}
            />
          </button>

          <Link
            to="/admin/quizzes/create"
            className="inline-flex items-center gap-2 bg-brand-prussian hover:bg-brand-cerulean text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-sm hover:shadow-md active:scale-[0.98] transition-all"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Create Quiz</span>
          </Link>
        </div>
      </header>

      {/* LOADING SKELETON */}
      {loading && quizzes.length === 0 ? (
        <QuizzesSkeleton />
      ) : (
        <div className="space-y-6">
          {/* KPI SUMMARY CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="relative overflow-hidden bg-white p-6 rounded-2xl border border-slate-200/70 shadow-sm">
              <div className="pointer-events-none absolute -top-10 -right-10 w-24 h-24 rounded-full bg-blue-500/10 blur-2xl" />
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Total Quizzes
                  </p>
                  <h3 className="text-3xl font-bold text-brand-prussian mt-2 tabular-nums">
                    {stats.total}
                  </h3>
                </div>
                <div className="p-3 rounded-xl bg-blue-50 text-blue-600 ring-1 ring-blue-100">
                  <BookOpen className="w-5 h-5" />
                </div>
              </div>
            </div>

            <div className="relative overflow-hidden bg-white p-6 rounded-2xl border border-slate-200/70 shadow-sm">
              <div className="pointer-events-none absolute -top-10 -right-10 w-24 h-24 rounded-full bg-emerald-500/10 blur-2xl" />
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Published
                  </p>
                  <h3 className="text-3xl font-bold text-brand-prussian mt-2 tabular-nums">
                    {stats.published}
                  </h3>
                </div>
                <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
                  <CheckCircle className="w-5 h-5" />
                </div>
              </div>
            </div>

            <div className="relative overflow-hidden bg-white p-6 rounded-2xl border border-slate-200/70 shadow-sm">
              <div className="pointer-events-none absolute -top-10 -right-10 w-24 h-24 rounded-full bg-slate-500/10 blur-2xl" />
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Drafts
                  </p>
                  <h3 className="text-3xl font-bold text-brand-prussian mt-2 tabular-nums">
                    {stats.drafts}
                  </h3>
                </div>
                <div className="p-3 rounded-xl bg-slate-100 text-slate-600 ring-1 ring-slate-200">
                  <FileEdit className="w-5 h-5" />
                </div>
              </div>
            </div>

            <div className="relative overflow-hidden bg-white p-6 rounded-2xl border border-slate-200/70 shadow-sm">
              <div className="pointer-events-none absolute -top-10 -right-10 w-24 h-24 rounded-full bg-amber-500/10 blur-2xl" />
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Live / Scheduled
                  </p>
                  <h3 className="text-3xl font-bold text-brand-prussian mt-2 tabular-nums">
                    {stats.liveOrScheduled}
                  </h3>
                </div>
                <div className="p-3 rounded-xl bg-amber-50 text-amber-600 ring-1 ring-amber-100">
                  <Clock className="w-5 h-5" />
                </div>
              </div>
            </div>
          </div>

          {/* DIRECTORY CARD */}
          <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm overflow-hidden">
            {/* Toolbar */}
            <div className="p-4 sm:p-5 border-b border-slate-100 space-y-3.5">
              <div className="flex flex-col md:flex-row gap-3">
                {/* Search */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search by quiz title or class..."
                    className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-sm text-slate-700 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-cerulean/20 focus:border-brand-cerulean transition-all"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
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

                {/* Type Filter */}
                <div className="relative md:w-52">
                  <Filter className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="w-full appearance-none pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-sm font-medium text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-cerulean/20 focus:border-brand-cerulean cursor-pointer transition-all"
                  >
                    <option value="all">All Quiz Types</option>
                    <option value="live">Live</option>
                    <option value="schedule">Scheduled</option>
                    <option value="practice">Practice</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Status Filter Pills */}
              <div className="flex items-center gap-1.5">
                {(
                  [
                    { key: "all", label: "All", count: stats.total },
                    { key: "published", label: "Published", count: stats.published },
                    { key: "draft", label: "Drafts", count: stats.drafts },
                  ] as const
                ).map((tab) => {
                  const active = statusFilter === tab.key;
                  return (
                    <button
                      key={tab.key}
                      onClick={() => setStatusFilter(tab.key)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${active
                          ? "bg-brand-prussian text-white shadow-sm"
                          : "bg-slate-50 text-slate-600 hover:bg-brand-aliceBlue hover:text-brand-cerulean"
                        }`}
                    >
                      <span>{tab.label}</span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] tabular-nums ${active
                            ? "bg-white/20 text-white"
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
            {filteredQuizzes.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center py-16 px-4">
                <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mb-3 border border-slate-100">
                  <BookOpen className="w-7 h-7 text-slate-300" />
                </div>
                <h3 className="text-sm font-semibold text-brand-prussian">
                  No quizzes found
                </h3>
                <p className="text-xs text-slate-400 mt-1 max-w-xs">
                  {quizzes.length === 0
                    ? "Start by creating your first quiz or timed assessment."
                    : "Try adjusting your search query, quiz type, or status filter."}
                </p>
                {quizzes.length === 0 && (
                  <Link
                    to="/admin/quizzes/create"
                    className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-aliceBlue text-brand-cerulean text-xs font-semibold hover:bg-brand-cerulean hover:text-white transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Create First Quiz
                  </Link>
                )}
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50/80 text-[11px] uppercase tracking-wider text-slate-500 font-semibold border-b border-slate-100">
                      <tr>
                        <th className="px-6 py-3.5">Quiz & Class</th>
                        <th className="px-6 py-3.5">Type</th>
                        <th className="px-6 py-3.5">Questions</th>
                        <th className="px-6 py-3.5">Status</th>
                        <th className="px-6 py-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredQuizzes.map((quiz) => {
                        const typeBadge = getQuizTypeBadge(quiz.quizType);
                        const isToggling = togglingId === quiz._id;
                        const className =
                          typeof quiz.class === "object" && quiz.class !== null
                            ? (quiz.class as any).name
                            : "General";

                        return (
                          <tr
                            key={quiz._id}
                            className="hover:bg-slate-50/80 transition-colors"
                          >
                            <td className="px-6 py-4 max-w-sm">
                              <Link
                                to={`/admin/quizzes/view/${quiz._id}`}
                                className="font-semibold text-sm text-brand-prussian hover:text-brand-cerulean transition-colors line-clamp-1"
                              >
                                {quiz.title}
                              </Link>
                              <span className="inline-block mt-1 text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                                {className}
                              </span>
                            </td>

                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold capitalize ring-1 ${typeBadge.pill}`}
                              >
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${typeBadge.dot}`}
                                />
                                {typeBadge.label}
                              </span>
                            </td>

                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-brand-prussian tabular-nums">
                              {quiz.questions?.length || 0}{" "}
                              <span className="text-xs font-normal text-slate-400">
                                Qs
                              </span>
                            </td>

                            <td className="px-6 py-4 whitespace-nowrap">
                              <button
                                onClick={() => handleTogglePublish(quiz._id)}
                                disabled={isToggling}
                                title="Click to toggle publish status"
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ring-1 transition-all disabled:opacity-60 ${quiz.isPublished
                                    ? "bg-emerald-50 text-emerald-700 ring-emerald-600/15 hover:bg-emerald-100"
                                    : "bg-slate-100 text-slate-600 ring-slate-300/70 hover:bg-slate-200"
                                  }`}
                              >
                                {isToggling ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <span
                                    className={`w-1.5 h-1.5 rounded-full ${quiz.isPublished
                                        ? "bg-emerald-500"
                                        : "bg-slate-400"
                                      }`}
                                  />
                                )}
                                {quiz.isPublished ? "Published" : "Draft"}
                              </button>
                            </td>

                            <td className="px-6 py-4 text-right whitespace-nowrap">
                              <div className="inline-flex items-center gap-1">
                                {/* Export Group */}
                                <button
                                  onClick={() => handleDownloadPdf(quiz)}
                                  className="p-2 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                                  title="Download PDF"
                                >
                                  <FileDown className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDownloadDocx(quiz)}
                                  className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                  title="Download Word Doc"
                                >
                                  <FileText className="w-4 h-4" />
                                </button>

                                <span className="w-px h-4 bg-slate-200 mx-1" />

                                {/* Management Group */}
                                <Link
                                  to={`/admin/quizzes/view/${quiz._id}`}
                                  className="p-2 rounded-lg text-slate-400 hover:text-brand-cerulean hover:bg-brand-aliceBlue transition-colors"
                                  title="View Quiz Details"
                                >
                                  <Eye className="w-4 h-4" />
                                </Link>
                                <Link
                                  to={`/admin/quizzes/analytics/${quiz._id}`}
                                  className="p-2 rounded-lg text-slate-400 hover:text-purple-600 hover:bg-purple-50 transition-colors"
                                  title="View Analytics"
                                >
                                  <BarChart className="w-4 h-4" />
                                </Link>
                                <Link
                                  to={`/admin/quizzes/edit/${quiz._id}`}
                                  className="p-2 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                                  title="Edit Quiz"
                                >
                                  <Edit className="w-4 h-4" />
                                </Link>
                                <button
                                  onClick={() => setDeleteTarget(quiz)}
                                  className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                  title="Delete Quiz"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden divide-y divide-slate-100">
                  {filteredQuizzes.map((quiz) => {
                    const typeBadge = getQuizTypeBadge(quiz.quizType);
                    const isToggling = togglingId === quiz._id;
                    const className =
                      typeof quiz.class === "object" && quiz.class !== null
                        ? (quiz.class as any).name
                        : "General";

                    return (
                      <div key={quiz._id} className="p-4 bg-white space-y-3.5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <Link
                              to={`/admin/quizzes/view/${quiz._id}`}
                              className="font-semibold text-sm text-brand-prussian line-clamp-2"
                            >
                              {quiz.title}
                            </Link>
                            <p className="text-xs text-slate-400 mt-0.5">
                              {className} • {quiz.questions?.length || 0} Qs
                            </p>
                          </div>

                          <button
                            onClick={() => handleTogglePublish(quiz._id)}
                            disabled={isToggling}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ring-1 shrink-0 ${quiz.isPublished
                                ? "bg-emerald-50 text-emerald-700 ring-emerald-600/15"
                                : "bg-slate-100 text-slate-600 ring-slate-300/70"
                              }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${quiz.isPublished ? "bg-emerald-500" : "bg-slate-400"
                                }`}
                            />
                            {quiz.isPublished ? "Published" : "Draft"}
                          </button>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold capitalize ring-1 ${typeBadge.pill}`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${typeBadge.dot}`}
                            />
                            {typeBadge.label}
                          </span>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleDownloadPdf(quiz)}
                              className="p-2 rounded-lg text-slate-400 hover:text-emerald-600 bg-slate-50"
                              title="PDF"
                            >
                              <FileDown className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDownloadDocx(quiz)}
                              className="p-2 rounded-lg text-slate-400 hover:text-blue-600 bg-slate-50"
                              title="Word"
                            >
                              <FileText className="w-4 h-4" />
                            </button>
                            <Link
                              to={`/admin/quizzes/analytics/${quiz._id}`}
                              className="p-2 rounded-lg text-slate-400 hover:text-purple-600 bg-slate-50"
                              title="Analytics"
                            >
                              <BarChart className="w-4 h-4" />
                            </Link>
                            <Link
                              to={`/admin/quizzes/edit/${quiz._id}`}
                              className="p-2 rounded-lg text-slate-400 hover:text-amber-600 bg-slate-50"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </Link>
                            <button
                              onClick={() => setDeleteTarget(quiz)}
                              className="p-2 rounded-lg text-slate-400 hover:text-rose-600 bg-rose-50/70"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
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

      {/* DELETE CONFIRMATION MODAL */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl border border-slate-200/70">
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-brand-prussian">
                  Delete quiz?
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  Are you sure you want to delete{" "}
                  <strong className="text-brand-prussian">
                    "{deleteTarget.title}"
                  </strong>
                  ? This action can be reversed by an administrator later.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 mt-6">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={isDeleting}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors disabled:opacity-50"
              >
                {isDeleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{isDeleting ? "Deleting..." : "Delete Quiz"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Quizzes;