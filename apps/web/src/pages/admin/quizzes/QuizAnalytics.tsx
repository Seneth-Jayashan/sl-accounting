import { useEffect, useState, useMemo, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Users,
  Target,
  TrendingUp,
  Clock,
  Search,
  CheckCircle2,
  XCircle,
  Eye,
  FileText,
  RefreshCw,
  X,
  Trophy,
  AlertTriangle,
  Award,
} from "lucide-react";
import { toast } from "react-hot-toast";
import QuizService, {
  type Quiz,
  type QuizSubmission,
} from "../../../services/QuizService";

// --- Skeleton Loader ---

function AnalyticsSkeleton() {
  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-pulse pb-16">
      <div className="flex justify-between">
        <div className="h-9 w-36 bg-slate-200 rounded-xl" />
        <div className="h-9 w-24 bg-slate-200 rounded-xl" />
      </div>
      <div className="h-36 bg-white rounded-2xl border border-slate-100" />
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

const getRankBadgeStyle = (index: number) => {
  if (index === 0)
    return "bg-amber-50 text-amber-700 ring-1 ring-amber-300/80";
  if (index === 1)
    return "bg-slate-100 text-slate-700 ring-1 ring-slate-300/80";
  if (index === 2)
    return "bg-orange-50 text-orange-700 ring-1 ring-orange-300/80";
  return "bg-slate-50 text-slate-500 ring-1 ring-slate-200/70";
};

// --- Main Component ---

export default function QuizAnalytics() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [submissions, setSubmissions] = useState<QuizSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "passed" | "failed">("all");

  const fetchData = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const [quizRes, analyticsRes] = await Promise.all([
        QuizService.getQuizById(id),
        QuizService.getQuizAnalytics(id),
      ]);

      if (quizRes.success && quizRes.data) {
        setQuiz(quizRes.data);
      }
      if (analyticsRes.success) {
        setSubmissions((analyticsRes.data as any) || []);
      }
    } catch (error) {
      toast.error("Failed to load analytics data");
      console.error("Analytics fetch error:", error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- Calculate Overall Stats ---
  const stats = useMemo(() => {
    const total = submissions.length;
    if (total === 0) {
      return { avgScore: 0, passRate: 0, avgTime: 0, passed: 0, failed: 0 };
    }

    const totalScore = submissions.reduce(
      (acc, curr) => acc + (curr.percentageScore || 0),
      0
    );
    const passed = submissions.filter((s) => s.passed).length;
    const totalTime = submissions.reduce(
      (acc, curr) => acc + (curr.timeTaken || 0),
      0
    );

    return {
      avgScore: Math.round(totalScore / total),
      passRate: Math.round((passed / total) * 100),
      avgTime: Math.round(totalTime / total),
      passed,
      failed: total - passed,
    };
  }, [submissions]);

  // --- Filter Submissions ---
  const filteredSubmissions = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    return submissions.filter((sub: any) => {
      if (statusFilter === "passed" && !sub.passed) return false;
      if (statusFilter === "failed" && sub.passed) return false;
      if (!term) return true;

      const name = `${sub.student?.name || sub.student?.firstName || ""} ${sub.student?.lastName || ""
        }`.toLowerCase();
      const email = (sub.student?.email || "").toLowerCase();
      return name.includes(term) || email.includes(term);
    });
  }, [submissions, searchTerm, statusFilter]);

  if (loading && !quiz) return <AnalyticsSkeleton />;

  if (!quiz) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
        <div className="w-14 h-14 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mb-4">
          <AlertTriangle className="w-7 h-7" />
        </div>
        <h2 className="text-lg font-bold text-brand-prussian mb-1">
          Quiz Not Found
        </h2>
        <p className="text-sm text-slate-500 mb-6 max-w-sm">
          The quiz analytics you requested could not be found.
        </p>
        <button
          onClick={() => navigate("/admin/quizzes")}
          className="px-5 py-2.5 bg-brand-prussian text-white text-sm font-semibold rounded-xl hover:bg-brand-cerulean transition-colors"
        >
          Back to Quizzes
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 md:space-y-8 pb-24 md:pb-12">
      {/* TOP ACTION BAR */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={() => navigate("/admin/quizzes")}
          className="group inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-brand-prussian bg-white px-3.5 py-2 rounded-xl border border-slate-200/80 shadow-sm transition-all"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
          Back to Quizzes
        </button>

        <button
          onClick={fetchData}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-white rounded-xl border border-slate-200/80 shadow-sm text-xs font-semibold text-slate-600 hover:text-brand-cerulean hover:border-brand-cerulean/40 transition-colors disabled:opacity-50"
        >
          <RefreshCw
            className={`w-4 h-4 ${loading ? "animate-spin text-brand-cerulean" : ""}`}
          />
          <span>Refresh</span>
        </button>
      </div>

      {/* HERO QUIZ HEADER */}
      <header className="relative overflow-hidden bg-gradient-to-br from-brand-prussian via-[#07273D] to-[#02121E] rounded-2xl p-6 md:p-8 text-white shadow-lg shadow-brand-prussian/15">
        <div className="pointer-events-none absolute -top-16 -right-16 w-56 h-56 rounded-full bg-brand-cerulean/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 left-1/3 w-48 h-48 rounded-full bg-brand-jasmine/10 blur-3xl" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-2.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider bg-white/10 text-brand-jasmine border border-white/15">
              <Trophy className="w-3.5 h-3.5" />
              Quiz Analytics
            </span>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
              {quiz.title}
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300 tabular-nums">
              <span className="inline-flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-lg border border-white/10">
                <Award className="w-3.5 h-3.5 text-brand-jasmine" />
                {quiz.totalPoints || 0} Total Pts
              </span>
              <span className="inline-flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-lg border border-white/10">
                <Target className="w-3.5 h-3.5 text-emerald-300" />
                Pass Mark: {quiz.passingPercentage || 40}%
              </span>
              <span className="inline-flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-lg border border-white/10">
                <Clock className="w-3.5 h-3.5 text-sky-300" />
                {quiz.duration || 60} mins
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* KPI SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="relative overflow-hidden bg-white p-6 rounded-2xl border border-slate-200/70 shadow-sm">
          <div className="pointer-events-none absolute -top-10 -right-10 w-24 h-24 rounded-full bg-blue-500/10 blur-2xl" />
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Total Attempts
              </p>
              <h3 className="text-3xl font-bold text-brand-prussian mt-2 tabular-nums">
                {submissions.length}
              </h3>
            </div>
            <div className="p-3 rounded-xl bg-blue-50 text-blue-600 ring-1 ring-blue-100">
              <Users className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden bg-white p-6 rounded-2xl border border-slate-200/70 shadow-sm">
          <div className="pointer-events-none absolute -top-10 -right-10 w-24 h-24 rounded-full bg-amber-500/10 blur-2xl" />
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Average Score
              </p>
              <h3 className="text-3xl font-bold text-brand-prussian mt-2 tabular-nums">
                {stats.avgScore}%
              </h3>
            </div>
            <div className="p-3 rounded-xl bg-amber-50 text-amber-600 ring-1 ring-amber-100">
              <Target className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden bg-white p-6 rounded-2xl border border-slate-200/70 shadow-sm">
          <div className="pointer-events-none absolute -top-10 -right-10 w-24 h-24 rounded-full bg-emerald-500/10 blur-2xl" />
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Pass Rate
              </p>
              <h3 className="text-3xl font-bold text-brand-prussian mt-2 tabular-nums">
                {stats.passRate}%
              </h3>
            </div>
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden bg-white p-6 rounded-2xl border border-slate-200/70 shadow-sm">
          <div className="pointer-events-none absolute -top-10 -right-10 w-24 h-24 rounded-full bg-purple-500/10 blur-2xl" />
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Avg. Time
              </p>
              <h3 className="text-3xl font-bold text-brand-prussian mt-2 tabular-nums">
                {Math.floor(stats.avgTime / 60)}m {stats.avgTime % 60}s
              </h3>
            </div>
            <div className="p-3 rounded-xl bg-purple-50 text-purple-600 ring-1 ring-purple-100">
              <Clock className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* LEADERBOARD CARD */}
      <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-brand-prussian tracking-tight">
              Student Leaderboard
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Click "View Paper" to inspect individual answers and scoring.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Search */}
            <div className="relative sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search student or email..."
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
            <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200/60 self-start sm:self-auto">
              {(
                [
                  { key: "all", label: "All", count: submissions.length },
                  { key: "passed", label: "Passed", count: stats.passed },
                  { key: "failed", label: "Failed", count: stats.failed },
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
        </div>

        {/* Empty State */}
        {filteredSubmissions.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center text-center px-4">
            <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mb-3 border border-slate-100">
              <FileText className="w-7 h-7 text-slate-300" />
            </div>
            <h3 className="text-sm font-semibold text-brand-prussian">
              {submissions.length === 0
                ? "No submissions yet"
                : "No matching students"}
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-xs">
              {submissions.length === 0
                ? "Student attempts and scores will appear here once they complete the quiz."
                : "Try adjusting your search query or status filter."}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50/80 text-[11px] uppercase text-slate-500 font-semibold tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-3.5">Rank</th>
                    <th className="px-6 py-3.5">Student</th>
                    <th className="px-6 py-3.5">Score</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5">Time Taken</th>
                    <th className="px-6 py-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSubmissions.map((sub: any, index) => {
                    const studentName =
                      `${sub.student?.firstName || ""} ${sub.student?.lastName || ""
                        }`.trim() ||
                      sub.student?.name ||
                      "Unknown Student";
                    const initials = studentName.slice(0, 2).toUpperCase();
                    const isPassed = sub.passed;
                    const isTimeOut = sub.status === "time-out";
                    const pct = Math.round(sub.percentageScore || 0);

                    return (
                      <motion.tr
                        key={sub._id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="hover:bg-slate-50/80 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center justify-center w-8 h-8 rounded-xl text-xs font-bold tabular-nums ${getRankBadgeStyle(
                              index
                            )}`}
                          >
                            #{index + 1}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-brand-aliceBlue text-brand-cerulean ring-1 ring-brand-cerulean/20 flex items-center justify-center font-bold text-xs shrink-0">
                              {initials}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-brand-prussian truncate">
                                {studentName}
                              </p>
                              <p className="text-xs text-slate-400 truncate">
                                {sub.student?.email || "No Email"}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="w-32 space-y-1.5">
                            <div className="flex items-baseline justify-between gap-2 tabular-nums">
                              <span
                                className={`text-sm font-bold ${isPassed ? "text-emerald-600" : "text-rose-600"
                                  }`}
                              >
                                {pct}%
                              </span>
                              <span className="text-[11px] text-slate-400 font-medium">
                                {sub.totalPointsEarned}/{quiz.totalPoints} pts
                              </span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${isPassed ? "bg-emerald-500" : "bg-rose-500"
                                  }`}
                                style={{ width: `${Math.min(100, pct)}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ring-1 ${isPassed
                                ? "bg-emerald-50 text-emerald-700 ring-emerald-600/15"
                                : "bg-rose-50 text-rose-700 ring-rose-600/15"
                              }`}
                          >
                            {isPassed ? (
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            ) : (
                              <XCircle className="w-3.5 h-3.5" />
                            )}
                            {isPassed ? "Passed" : "Failed"}
                          </span>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          <p className="text-sm font-medium text-brand-prussian tabular-nums">
                            {Math.floor((sub.timeTaken || 0) / 60)}m{" "}
                            {(sub.timeTaken || 0) % 60}s
                          </p>
                          {isTimeOut && (
                            <span className="inline-block text-[10px] font-semibold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded mt-0.5">
                              Timed Out
                            </span>
                          )}
                        </td>

                        <td className="px-6 py-4 text-right whitespace-nowrap">
                          <Link
                            to={`/admin/quizzes/submission/${sub._id}`}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-50 hover:bg-brand-prussian text-brand-prussian hover:text-white border border-slate-200/80 hover:border-brand-prussian text-xs font-semibold rounded-xl transition-all"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View Paper</span>
                          </Link>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-slate-100">
              {filteredSubmissions.map((sub: any, index) => {
                const studentName =
                  `${sub.student?.firstName || ""} ${sub.student?.lastName || ""
                    }`.trim() ||
                  sub.student?.name ||
                  "Unknown Student";
                const isPassed = sub.passed;
                const pct = Math.round(sub.percentageScore || 0);

                return (
                  <div key={sub._id} className="p-4 bg-white space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          className={`inline-flex items-center justify-center w-8 h-8 rounded-xl text-xs font-bold shrink-0 tabular-nums ${getRankBadgeStyle(
                            index
                          )}`}
                        >
                          #{index + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-brand-prussian truncate">
                            {studentName}
                          </p>
                          <p className="text-xs text-slate-400 truncate">
                            {sub.student?.email || "No Email"}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ring-1 shrink-0 ${isPassed
                            ? "bg-emerald-50 text-emerald-700 ring-emerald-600/15"
                            : "bg-rose-50 text-rose-700 ring-rose-600/15"
                          }`}
                      >
                        {isPassed ? "Passed" : "Failed"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <div className="flex items-center gap-3 text-xs tabular-nums">
                        <span
                          className={`font-bold text-sm ${isPassed ? "text-emerald-600" : "text-rose-600"
                            }`}
                        >
                          {pct}%
                        </span>
                        <span className="text-slate-400">
                          ({sub.totalPointsEarned}/{quiz.totalPoints} pts)
                        </span>
                        <span className="text-slate-400">
                          • {Math.floor((sub.timeTaken || 0) / 60)}m{" "}
                          {(sub.timeTaken || 0) % 60}s
                        </span>
                      </div>

                      <Link
                        to={`/admin/quizzes/submission/${sub._id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-brand-aliceBlue text-brand-cerulean text-xs font-semibold rounded-lg"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Paper
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}