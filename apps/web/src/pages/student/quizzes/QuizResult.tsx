import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  HelpCircle,
  AlertTriangle,
  Calendar,
  BookOpen,
  Target,
  Award,
  Check,
  X,
} from "lucide-react";
import QuizService from "../../../services/QuizService";
import { toast } from "react-hot-toast";
import { getGradeDetails } from "../../../utils/gradeUtils";

const OPTION_LETTERS = ["A", "B", "C", "D", "E", "F", "G", "H"];

export default function QuizResult() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [resultData, setResultData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "correct" | "incorrect">("all");

  useEffect(() => {
    let isMounted = true;
    const fetchResult = async () => {
      if (!id) return;
      try {
        const response = await QuizService.getDetailedReview(id);
        if (isMounted) {
          if (response.success) {
            setResultData(response);
          } else {
            toast.error("Failed to load result");
            navigate(-1);
          }
        }
      } catch (error: any) {
        if (isMounted) {
          toast.error(error.response?.data?.message || "Result not found");
          navigate(-1);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchResult();
    return () => {
      isMounted = false;
    };
  }, [id, navigate]);

  const indexedReview = useMemo(() => {
    if (!resultData?.review) return [];
    return resultData.review.map((q: any, idx: number) => ({
      ...q,
      originalIndex: idx,
    }));
  }, [resultData]);

  const filteredReview = useMemo(() => {
    if (filter === "correct") return indexedReview.filter((q: any) => q.isCorrect);
    if (filter === "incorrect") return indexedReview.filter((q: any) => !q.isCorrect);
    return indexedReview;
  }, [indexedReview, filter]);

  // --- LOADING SKELETON ---
  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] pb-24">
        <div className="h-16 bg-white border-b border-gray-200" />
        <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6 animate-pulse">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 h-60 rounded-3xl bg-white border border-gray-100" />
            <div className="h-60 rounded-3xl bg-gray-200" />
          </div>
          <div className="h-14 rounded-2xl bg-white border border-gray-100" />
          <div className="h-72 rounded-3xl bg-white border border-gray-100" />
        </div>
      </div>
    );
  }

  if (!resultData) return null;

  const { summary, review, quizTitle, message } = resultData;
  const isPassed = summary.passed;

  // Safe Date & Time Parsing
  const safeTimeTaken =
    isNaN(summary.timeTaken) || summary.timeTaken == null ? 0 : summary.timeTaken;
  const minutes = Math.floor(safeTimeTaken / 60);
  const seconds = safeTimeTaken % 60;

  const completedDate = summary.completedAt
    ? new Date(summary.completedAt)
    : new Date();
  const dateStr = completedDate.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const timeStr = completedDate.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  // Analytics Math
  const correctCount = review ? review.filter((q: any) => q.isCorrect).length : 0;
  const totalCount = review ? review.length : 0;
  const incorrectCount = totalCount - correctCount;

  // SVG Ring Math
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const safePercentage = isNaN(summary.percentage) ? 0 : summary.percentage;
  const strokeDashoffset = circumference - (safePercentage / 100) * circumference;

  const gradeDetails = getGradeDetails(safePercentage);

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-24 font-sans">
      {/* --- STICKY HEADER --- */}
      <header className="bg-white/95 backdrop-blur-md border-b border-gray-200/80 sticky top-0 z-40 shadow-2xs">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <button
              onClick={() => navigate(-1)}
              aria-label="Go Back"
              className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-brand-aliceBlue text-gray-600 hover:text-brand-cerulean flex items-center justify-center transition-colors shrink-0"
            >
              <ArrowLeft size={18} />
            </button>
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-extrabold text-brand-prussian truncate">
                {quizTitle || "Assessment Report"}
              </h1>
              <p className="text-xs text-gray-400 font-medium">
                Detailed Analysis & Corrections
              </p>
            </div>
          </div>

          <span
            className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border shrink-0 ${isPassed
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-red-50 text-red-600 border-red-200"
              }`}
          >
            {isPassed ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
            {isPassed ? "Passed" : "Needs Review"}
          </span>
        </div>
      </header>

      <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
        {/* --- TOP SUMMARY BENTO GRID --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Score & Grade Card */}
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-2 bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100 flex flex-col sm:flex-row items-center gap-6 sm:gap-8 relative overflow-hidden"
          >
            <div
              className={`absolute top-0 left-0 right-0 h-1.5 ${isPassed ? "bg-emerald-500" : "bg-red-500"
                }`}
            />

            {/* Animated Circular Progress */}
            <div className="relative w-32 h-32 shrink-0 flex items-center justify-center">
              <svg
                className="w-full h-full -rotate-90 drop-shadow-xs"
                viewBox="0 0 100 100"
              >
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  className="text-gray-100 stroke-current"
                  strokeWidth="8"
                  fill="transparent"
                />
                <motion.circle
                  cx="50"
                  cy="50"
                  r={radius}
                  className={`${isPassed ? "text-emerald-500" : "text-red-500"
                    } stroke-current`}
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={circumference}
                  initial={{ strokeDashoffset: circumference }}
                  animate={{ strokeDashoffset }}
                  transition={{ duration: 0.9, ease: "easeOut" }}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-black text-brand-prussian leading-none">
                  {Math.round(safePercentage)}%
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mt-1">
                  Score
                </span>
              </div>
            </div>

            {/* Grade & Metrics */}
            <div className="flex-1 text-center sm:text-left min-w-0 w-full">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-2">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border ${isPassed
                      ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                      : "bg-red-50 text-red-600 border-red-100"
                    }`}
                >
                  {isPassed ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                  {isPassed ? "Passed Successfully" : "Failed Attempt"}
                </span>
              </div>

              <h2 className="text-2xl font-extrabold text-brand-prussian tracking-tight">
                Assessment Complete
              </h2>

              <div
                className={`mt-3 mb-4 p-4 rounded-2xl border ${gradeDetails.bg} ${gradeDetails.border}`}
              >
                <div
                  className={`font-extrabold text-sm sm:text-base flex items-center justify-center sm:justify-start gap-1.5 ${gradeDetails.color}`}
                >
                  <Award size={16} />
                  <span>
                    Grade {gradeDetails.grade} • {gradeDetails.label}
                  </span>
                </div>
                <p
                  className={`text-xs sm:text-sm italic font-medium mt-1 ${gradeDetails.color} opacity-90`}
                >
                  "{gradeDetails.quote}"
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 text-xs font-bold text-gray-600">
                <span className="inline-flex items-center gap-1.5 bg-gray-50 px-3 py-2 rounded-xl border border-gray-100">
                  <Target size={14} className="text-brand-cerulean" />
                  {summary.totalPointsEarned} / {summary.totalQuizPoints} Points
                </span>
                <span className="inline-flex items-center gap-1.5 bg-gray-50 px-3 py-2 rounded-xl border border-gray-100">
                  <Clock size={14} className="text-brand-cerulean" />
                  {minutes}m {seconds}s
                </span>
              </div>
            </div>
          </motion.section>

          {/* Module Details Card */}
          <motion.aside
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-prussian via-[#0d3a4b] to-brand-cerulean p-6 text-white shadow-xl shadow-brand-prussian/15 flex flex-col justify-between gap-6"
          >
            <div className="pointer-events-none absolute -top-12 -right-12 w-40 h-40 rounded-full bg-brand-jasmine/20 blur-2xl" />
            <div className="pointer-events-none absolute -right-4 -bottom-4 opacity-10">
              <BookOpen size={110} />
            </div>

            <div className="relative z-10">
              <span className="inline-block text-[10px] font-bold uppercase tracking-widest text-brand-jasmine mb-2">
                Attempt Summary
              </span>
              <h3 className="font-extrabold text-lg leading-snug">
                {quizTitle || "Assessment"}
              </h3>
            </div>

            <div className="relative z-10 space-y-2.5 bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-4 text-xs sm:text-sm">
              <div className="flex items-center gap-2.5 text-white/90">
                <Calendar size={15} className="text-brand-jasmine shrink-0" />
                <span className="font-semibold">{dateStr}</span>
              </div>
              <div className="flex items-center gap-2.5 text-white/90">
                <Clock size={15} className="text-brand-jasmine shrink-0" />
                <span className="font-semibold">{timeStr}</span>
              </div>
              {review && (
                <div className="pt-2 mt-2 border-t border-white/15 flex items-center justify-between text-xs font-bold">
                  <span className="text-emerald-300">{correctCount} Correct</span>
                  <span className="text-red-300">{incorrectCount} Incorrect</span>
                </div>
              )}
            </div>
          </motion.aside>
        </div>

        {/* --- HIDDEN REVIEW NOTICE --- */}
        {message && !review && (
          <div className="bg-white border border-blue-100 rounded-3xl p-10 text-center flex flex-col items-center shadow-sm">
            <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center mb-4">
              <AlertTriangle size={30} />
            </div>
            <h3 className="text-lg sm:text-xl font-extrabold text-brand-prussian mb-1.5">
              Detailed Review Hidden
            </h3>
            <p className="text-sm text-gray-500 max-w-md leading-relaxed">
              {message}
            </p>
          </div>
        )}

        {/* --- QUESTION-BY-QUESTION REVIEW --- */}
        {review && (
          <div className="space-y-5 pt-2">
            {/* Filter Toolbar */}
            <div className="bg-white rounded-2xl p-3 border border-gray-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h3 className="text-sm font-extrabold text-brand-prussian px-2">
                Question Breakdown
              </h3>

              <div className="flex items-center gap-1.5 bg-gray-100/80 p-1 rounded-xl overflow-x-auto scrollbar-hide">
                {(
                  [
                    { key: "all", label: "All", count: totalCount },
                    { key: "correct", label: "Correct", count: correctCount },
                    { key: "incorrect", label: "Incorrect", count: incorrectCount },
                  ] as const
                ).map((tab) => {
                  const active = filter === tab.key;
                  return (
                    <button
                      key={tab.key}
                      onClick={() => setFilter(tab.key)}
                      className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${active
                          ? tab.key === "correct"
                            ? "bg-emerald-500 text-white shadow-sm"
                            : tab.key === "incorrect"
                              ? "bg-red-500 text-white shadow-sm"
                              : "bg-brand-prussian text-white shadow-sm"
                          : "text-gray-500 hover:text-gray-800"
                        }`}
                    >
                      <span>{tab.label}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-md ${active
                            ? "bg-white/20 text-white"
                            : "bg-gray-200/70 text-gray-500"
                          }`}
                      >
                        {tab.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Filtered Questions List */}
            {filteredReview.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-gray-200">
                <p className="text-sm font-bold text-brand-prussian mb-1">
                  No questions match this filter
                </p>
                <button
                  onClick={() => setFilter("all")}
                  className="mt-3 px-4 py-2 rounded-xl bg-gray-100 text-gray-700 text-xs font-bold hover:bg-gray-200 transition-colors"
                >
                  Show All Questions
                </button>
              </div>
            ) : (
              <div className="space-y-5">
                {filteredReview.map((q: any) => {
                  const isCorrect = q.isCorrect;
                  const hasImage = Boolean(q.questionImage);
                  const qNumber = q.originalIndex + 1;

                  return (
                    <motion.article
                      key={q.questionId || qNumber}
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, amount: 0.1 }}
                      className={`bg-white rounded-3xl shadow-sm overflow-hidden border ${isCorrect ? "border-emerald-100" : "border-red-100"
                        }`}
                    >
                      {/* Top Status Bar */}
                      <div
                        className={`px-5 sm:px-6 py-3.5 flex items-center justify-between gap-3 border-b ${isCorrect
                            ? "bg-emerald-50/60 border-emerald-100"
                            : "bg-red-50/60 border-red-100"
                          }`}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`flex items-center justify-center w-8 h-8 rounded-xl text-xs font-black text-white shadow-xs ${isCorrect ? "bg-emerald-500" : "bg-red-500"
                              }`}
                          >
                            Q{qNumber}
                          </span>
                          <span
                            className={`inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider ${isCorrect ? "text-emerald-700" : "text-red-700"
                              }`}
                          >
                            {isCorrect ? (
                              <CheckCircle2 size={14} />
                            ) : (
                              <XCircle size={14} />
                            )}
                            {isCorrect ? "Correct Answer" : "Incorrect Answer"}
                          </span>
                        </div>

                        <span className="text-[11px] font-extrabold text-gray-600 bg-white px-3 py-1 rounded-full border border-gray-200/80 shadow-2xs shrink-0">
                          {q.pointsEarned} / {q.maxPoints} PTS
                        </span>
                      </div>

                      {/* Question Body */}
                      <div className="p-5 sm:p-7">
                        <div
                          className="tiptap text-base sm:text-lg font-semibold text-gray-900 mb-5 leading-relaxed"
                          dangerouslySetInnerHTML={{ __html: q.questionText }}
                        />

                        {hasImage && (
                          <div className="mb-6 rounded-2xl border border-gray-200/80 overflow-hidden bg-gray-50 p-2.5 max-w-lg">
                            <img
                              src={q.questionImage}
                              alt="Reference"
                              className="w-full h-auto object-contain rounded-xl"
                            />
                          </div>
                        )}

                        {/* Options / Short Answer */}
                        <div className="space-y-2.5">
                          {q.options && q.options.length > 0 ? (
                            q.options.map((opt: any, optIdx: number) => {
                              const studentSelected =
                                q.studentSelection?.includes(optIdx);
                              const isActuallyCorrect = opt.isCorrect;

                              let containerStyle =
                                "border-gray-100 bg-gray-50/60 text-gray-600";
                              let badgeStyle =
                                "bg-white border-gray-200 text-gray-400";

                              if (isActuallyCorrect) {
                                containerStyle =
                                  "border-emerald-300 bg-emerald-50/70 text-emerald-950";
                                badgeStyle =
                                  "bg-emerald-500 border-emerald-500 text-white";
                              } else if (studentSelected && !isActuallyCorrect) {
                                containerStyle =
                                  "border-red-300 bg-red-50/70 text-red-950";
                                badgeStyle =
                                  "bg-red-500 border-red-500 text-white";
                              }

                              return (
                                <div
                                  key={optIdx}
                                  className={`p-3.5 sm:p-4 rounded-2xl border-2 flex items-center gap-3.5 transition-all ${containerStyle}`}
                                >
                                  <div
                                    className={`w-8 h-8 rounded-xl border flex items-center justify-center text-xs font-extrabold shrink-0 ${badgeStyle}`}
                                  >
                                    {isActuallyCorrect ? (
                                      <Check size={15} strokeWidth={3} />
                                    ) : studentSelected ? (
                                      <X size={15} strokeWidth={3} />
                                    ) : (
                                      OPTION_LETTERS[optIdx] || optIdx + 1
                                    )}
                                  </div>

                                  <span className="font-medium text-sm sm:text-base flex-1">
                                    {opt.optionText}
                                  </span>

                                  <div className="flex items-center gap-1.5 shrink-0">
                                    {studentSelected && (
                                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-600 bg-white px-2.5 py-1 rounded-lg border border-gray-200 shadow-2xs">
                                        Your Answer
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })
                          ) : (
                            <div className="space-y-3">
                              <div
                                className={`p-4 rounded-2xl border-2 ${isCorrect
                                    ? "border-emerald-200 bg-emerald-50/70"
                                    : "border-red-200 bg-red-50/70"
                                  }`}
                              >
                                <p
                                  className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${isCorrect
                                      ? "text-emerald-600"
                                      : "text-red-500"
                                    }`}
                                >
                                  Your Answer
                                </p>
                                <p
                                  className={`font-semibold text-sm sm:text-base ${isCorrect
                                      ? "text-emerald-950"
                                      : "text-red-950"
                                    }`}
                                >
                                  {q.studentShortAnswer || "No answer provided"}
                                </p>
                              </div>

                              {!isCorrect && q.options?.[0]?.optionText && (
                                <div className="p-4 rounded-2xl border-2 border-emerald-300 bg-emerald-50/70">
                                  <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-1 flex items-center gap-1">
                                    <CheckCircle2 size={12} />
                                    Correct Answer
                                  </p>
                                  <p className="font-semibold text-sm sm:text-base text-emerald-950">
                                    {q.options[0].optionText}
                                  </p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Teacher's Explanation */}
                        {q.explanation && (
                          <div className="mt-5 p-4 sm:p-5 bg-brand-aliceBlue/50 border border-brand-cerulean/20 rounded-2xl">
                            <h4 className="text-[11px] font-extrabold text-brand-cerulean uppercase tracking-wider mb-2 flex items-center gap-1.5">
                              <HelpCircle size={14} />
                              Teacher's Explanation / Working
                            </h4>
                            <p className="text-sm text-brand-prussian leading-relaxed whitespace-pre-wrap font-medium">
                              {q.explanation}
                            </p>
                          </div>
                        )}
                      </div>
                    </motion.article>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}