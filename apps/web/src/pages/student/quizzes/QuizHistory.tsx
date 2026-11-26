import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock,
  ArrowRight,
  CheckCircle2,
  XCircle,
  FileText,
  CalendarDays,
  Target,
  TrendingUp,
  Award,
  Globe,
  Search,
  X,
  PlayCircle,
  BookOpen,
} from "lucide-react";
import QuizService from "../../../services/QuizService";
import { getGradeDetails } from "../../../utils/gradeUtils";

type AttemptFilter = "all" | "passed" | "failed";

export default function QuizHistory() {
  const navigate = useNavigate();
  const [attempts, setAttempts] = useState<any[]>([]);
  const [publicQuizzes, setPublicQuizzes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<AttemptFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    let isMounted = true;
    const fetchHistory = async () => {
      try {
        const [response, publicRes] = await Promise.all([
          QuizService.getMyAttempts(),
          QuizService.getPublicQuizzes().catch(() => ({
            success: false,
            data: [],
          })),
        ]);
        if (isMounted) {
          if (response.success) setAttempts(response.data || []);
          if (publicRes?.success) setPublicQuizzes(publicRes.data || []);
        }
      } catch (error) {
        console.error("Failed to load quiz history", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchHistory();
    return () => {
      isMounted = false;
    };
  }, []);

  // Calculate Overall Analytics
  const analytics = useMemo(() => {
    if (attempts.length === 0) {
      return {
        avgScore: 0,
        passRate: 0,
        totalTime: 0,
        bestScore: 0,
        passedCount: 0,
        failedCount: 0,
      };
    }
    const totalScore = attempts.reduce(
      (acc, curr) => acc + (curr.percentageScore || 0),
      0
    );
    const passedCount = attempts.filter((a) => a.passed).length;
    const failedCount = attempts.length - passedCount;
    const time = attempts.reduce((acc, curr) => acc + (curr.timeTaken || 0), 0);
    const bestScore = Math.round(
      Math.max(...attempts.map((a) => a.percentageScore || 0))
    );

    return {
      avgScore: Math.round(totalScore / attempts.length),
      passRate: Math.round((passedCount / attempts.length) * 100),
      totalTime: Math.round(time / 60),
      bestScore,
      passedCount,
      failedCount,
    };
  }, [attempts]);

  // Filtered Attempts
  const filteredAttempts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return attempts.filter((attempt) => {
      if (filter === "passed" && !attempt.passed) return false;
      if (filter === "failed" && attempt.passed) return false;

      if (q) {
        const title = (attempt.quiz?.title || "").toLowerCase();
        const className =
          typeof attempt.quiz?.class === "object"
            ? (attempt.quiz.class.name || "").toLowerCase()
            : "";
        return title.includes(q) || className.includes(q);
      }
      return true;
    });
  }, [attempts, filter, searchQuery]);

  // --- LOADING SKELETON ---
  if (loading) {
    return (
      <div className="space-y-6 pb-24 animate-pulse">
        <div className="h-40 rounded-[2rem] bg-gray-200" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-32 rounded-3xl bg-white border border-gray-100"
            />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-72 rounded-3xl bg-white border border-gray-100"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24 sm:pb-10">
      {/* --- HERO BANNER --- */}
      <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-brand-prussian via-[#0d3a4b] to-brand-cerulean p-6 sm:p-8 text-white shadow-xl shadow-brand-prussian/15">
        <div className="pointer-events-none absolute -top-20 -right-16 w-72 h-72 rounded-full bg-brand-jasmine/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-1/3 w-64 h-64 rounded-full bg-white/10 blur-3xl" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-semibold text-brand-jasmine mb-3">
              <Award size={13} />
              <span>Assessment Center</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Performance Analytics
            </h1>
            <p className="text-white/75 text-sm sm:text-base mt-1 max-w-xl">
              Review your quiz results, track your pass rate, and take open
              public exams to sharpen your skills.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start lg:self-auto shrink-0">
            <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl px-4 py-3 text-center min-w-[96px]">
              <p className="text-[10px] font-bold uppercase tracking-wider text-white/65">
                Attempts
              </p>
              <p className="text-xl font-black text-brand-jasmine mt-0.5">
                {attempts.length}
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl px-4 py-3 text-center min-w-[96px]">
              <p className="text-[10px] font-bold uppercase tracking-wider text-white/65">
                Best Score
              </p>
              <p className="text-xl font-black text-emerald-300 mt-0.5">
                {analytics.bestScore}%
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* --- PUBLIC EXAMS SECTION --- */}
      {publicQuizzes.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Globe size={18} />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-extrabold text-brand-prussian leading-tight">
                  Public Exams
                </h2>
                <p className="text-xs text-gray-400">
                  Open to all registered students
                </p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 text-xs font-bold">
              {publicQuizzes.length} Available
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {publicQuizzes.map((q: any) => (
              <motion.article
                key={q._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="group relative bg-white rounded-3xl p-5 sm:p-6 border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-brand-prussian/8 hover:border-emerald-200 hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between gap-4 overflow-hidden"
              >
                <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500" />

                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                      <Globe size={11} />
                      Public Exam
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-gray-400">
                      <Clock size={12} />
                      {q.duration} mins
                    </span>
                  </div>

                  <h3 className="font-extrabold text-brand-prussian text-base sm:text-lg leading-snug line-clamp-2 group-hover:text-brand-cerulean transition-colors">
                    {q.title}
                  </h3>
                  {q.description && (
                    <p className="text-xs sm:text-sm text-gray-500 mt-1.5 line-clamp-2 leading-relaxed">
                      {q.description}
                    </p>
                  )}
                </div>

                <div className="pt-4 border-t border-gray-100">
                  <button
                    onClick={() =>
                      navigate(`/student/class/quizzes/start/${q._id}`)
                    }
                    className="w-full py-2.5 px-4 rounded-xl bg-brand-prussian hover:bg-brand-cerulean text-white text-xs sm:text-sm font-bold transition-all shadow-sm flex items-center justify-center gap-2 active:scale-[0.98]"
                  >
                    <PlayCircle size={16} />
                    <span>Start Exam</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </motion.article>
            ))}
          </div>
        </section>
      )}

      {/* --- ATTEMPTS & ANALYTICS --- */}
      {attempts.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 sm:p-16 text-center shadow-sm border border-dashed border-gray-200 flex flex-col items-center">
          <div className="w-16 h-16 bg-brand-aliceBlue text-brand-cerulean rounded-2xl flex items-center justify-center mb-4">
            <FileText size={30} />
          </div>
          <h3 className="text-lg sm:text-xl font-extrabold text-brand-prussian mb-1">
            No Assessment Data Yet
          </h3>
          <p className="text-gray-400 text-sm max-w-sm leading-relaxed">
            You haven't completed any quizzes yet. Once you finish an exam, your
            scores and grade analytics will appear here.
          </p>
        </div>
      ) : (
        <>
          {/* TOP ANALYTICS CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
            {/* Average Score */}
            <div className="relative overflow-hidden bg-white rounded-3xl p-5 sm:p-6 border border-gray-100 shadow-sm">
              <div className="absolute top-0 left-0 right-0 h-1 bg-brand-cerulean" />
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                    Average Score
                  </p>
                  <p className="text-3xl font-black text-brand-prussian mt-1.5">
                    {analytics.avgScore}%
                  </p>
                </div>
                <div className="w-11 h-11 rounded-2xl bg-brand-cerulean/10 text-brand-cerulean flex items-center justify-center shrink-0">
                  <Target size={22} />
                </div>
              </div>
              <div className="mt-4 h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand-cerulean rounded-full transition-all duration-500"
                  style={{ width: `${analytics.avgScore}%` }}
                />
              </div>
            </div>

            {/* Pass Rate */}
            <div className="relative overflow-hidden bg-white rounded-3xl p-5 sm:p-6 border border-gray-100 shadow-sm">
              <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500" />
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                    Pass Rate
                  </p>
                  <p className="text-3xl font-black text-brand-prussian mt-1.5">
                    {analytics.passRate}%
                  </p>
                </div>
                <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <TrendingUp size={22} />
                </div>
              </div>
              <div className="mt-4 h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${analytics.passRate}%` }}
                />
              </div>
            </div>

            {/* Total Time Spent */}
            <div className="relative overflow-hidden bg-white rounded-3xl p-5 sm:p-6 border border-gray-100 shadow-sm flex flex-col justify-between">
              <div className="absolute top-0 left-0 right-0 h-1 bg-amber-400" />
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                    Total Time Spent
                  </p>
                  <p className="text-3xl font-black text-brand-prussian mt-1.5">
                    {analytics.totalTime}{" "}
                    <span className="text-base font-bold text-gray-400">
                      mins
                    </span>
                  </p>
                </div>
                <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                  <Clock size={22} />
                </div>
              </div>
              <p className="text-xs font-medium text-gray-400 mt-4">
                Across {attempts.length} completed{" "}
                {attempts.length === 1 ? "assessment" : "assessments"}
              </p>
            </div>
          </div>

          {/* FILTER & SEARCH TOOLBAR */}
          <div className="bg-white rounded-2xl p-3 sm:p-4 border border-gray-100 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 bg-gray-100/80 p-1 rounded-xl overflow-x-auto scrollbar-hide">
              {(
                [
                  { key: "all", label: "All History", count: attempts.length },
                  {
                    key: "passed",
                    label: "Passed",
                    count: analytics.passedCount,
                  },
                  {
                    key: "failed",
                    label: "Failed",
                    count: analytics.failedCount,
                  },
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

            <div className="relative w-full md:w-72">
              <Search
                size={15}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search past quizzes..."
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

          {/* HISTORY GRID */}
          {filteredAttempts.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-gray-200">
              <p className="text-base font-bold text-brand-prussian mb-1">
                No matching attempts found
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
                {filteredAttempts.map((attempt, idx) => {
                  const quiz = attempt.quiz;
                  const isPassed = attempt.passed;
                  const date = new Date(
                    attempt.completedAt || attempt.createdAt
                  ).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  });

                  const gradeDetails = getGradeDetails(
                    attempt.percentageScore || 0
                  );

                  return (
                    <motion.article
                      layout
                      key={attempt._id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.96 }}
                      transition={{ delay: idx * 0.04, duration: 0.28 }}
                      className="group relative bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-brand-prussian/8 hover:border-brand-cerulean/25 hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col"
                    >
                      {/* Top Status Accent Bar */}
                      <div
                        className={`h-1.5 w-full ${isPassed ? "bg-emerald-500" : "bg-red-500"
                          }`}
                      />

                      <div className="p-5 sm:p-6 flex-1 flex flex-col">
                        {/* Status & Date */}
                        <div className="flex items-center justify-between gap-2 mb-3.5">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${isPassed
                                ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                                : "bg-red-50 text-red-600 border-red-100"
                              }`}
                          >
                            {isPassed ? (
                              <CheckCircle2 size={12} />
                            ) : (
                              <XCircle size={12} />
                            )}
                            {isPassed ? "Passed" : "Failed"}
                          </span>

                          <span className="text-[11px] font-semibold text-gray-400 flex items-center gap-1">
                            <CalendarDays size={12} />
                            {date}
                          </span>
                        </div>

                        {/* Title & Module */}
                        <h3 className="font-extrabold text-base sm:text-lg text-brand-prussian line-clamp-2 leading-snug group-hover:text-brand-cerulean transition-colors">
                          {quiz?.title || "Untitled Assessment"}
                        </h3>

                        {quiz?.class && (
                          <p className="inline-flex items-center gap-1.5 text-xs text-gray-500 font-medium mt-1.5 mb-4 line-clamp-1">
                            <BookOpen
                              size={12}
                              className="text-brand-cerulean shrink-0"
                            />
                            <span className="truncate">
                              {typeof quiz.class === "object"
                                ? quiz.class.name
                                : "Accounting Class"}
                            </span>
                          </p>
                        )}

                        {/* Grade Box */}
                        <div
                          className={`mt-2 mb-5 p-3.5 rounded-2xl border ${gradeDetails.bg} ${gradeDetails.border} flex flex-col gap-1`}
                        >
                          <div
                            className={`font-extrabold text-xs sm:text-sm ${gradeDetails.color}`}
                          >
                            Grade {gradeDetails.grade} • {gradeDetails.label}
                          </div>
                          <div
                            className={`text-xs italic font-medium ${gradeDetails.color} opacity-85 line-clamp-2`}
                          >
                            "{gradeDetails.quote}"
                          </div>
                        </div>

                        {/* Score & Time Tiles */}
                        <div className="grid grid-cols-2 gap-3 mb-5 mt-auto">
                          <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100 text-center">
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                              Score
                            </p>
                            <p
                              className={`font-black text-xl mt-0.5 ${isPassed ? "text-emerald-600" : "text-red-500"
                                }`}
                            >
                              {Math.round(attempt.percentageScore)}%
                            </p>
                          </div>

                          <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100 text-center">
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                              Time Taken
                            </p>
                            <p className="font-extrabold text-gray-700 text-sm mt-1.5">
                              {Math.floor(attempt.timeTaken / 60)}m{" "}
                              {attempt.timeTaken % 60}s
                            </p>
                          </div>
                        </div>

                        {/* CTA Button */}
                        <button
                          onClick={() =>
                            navigate(`/student/quizzes/result/${attempt._id}`)
                          }
                          className="w-full py-3 px-4 rounded-xl bg-brand-aliceBlue/75 text-brand-prussian font-bold hover:bg-brand-prussian hover:text-white transition-all flex items-center justify-center gap-2 text-xs sm:text-sm active:scale-[0.98]"
                        >
                          <span>Detailed Analysis</span>
                          <ArrowRight size={15} />
                        </button>
                      </div>
                    </motion.article>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </>
      )}
    </div>
  );
}