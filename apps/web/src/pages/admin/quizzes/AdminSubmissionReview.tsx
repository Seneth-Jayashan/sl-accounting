import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  HelpCircle,
  User,
  Award,
  Clock,
  FileCheck,
  Target,
  Check,
} from "lucide-react";
import QuizService from "../../../services/QuizService";
import { toast } from "react-hot-toast";

// --- Skeleton Loader ---

function SubmissionSkeleton() {
  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-pulse pb-16">
      <div className="h-9 w-36 bg-slate-200 rounded-xl" />
      <div className="h-32 bg-white rounded-2xl border border-slate-100" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 bg-white rounded-2xl border border-slate-100 p-6">
            <div className="h-3 w-20 bg-slate-200 rounded mb-4" />
            <div className="h-7 w-16 bg-slate-200 rounded" />
          </div>
        ))}
      </div>
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-56 bg-white rounded-2xl border border-slate-100 p-6" />
        ))}
      </div>
    </div>
  );
}

// --- Main Component ---

export default function AdminSubmissionReview() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [submission, setSubmission] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [questionFilter, setQuestionFilter] = useState<"all" | "correct" | "incorrect">("all");

  useEffect(() => {
    const fetchResult = async () => {
      if (!id) return;
      try {
        const response = await QuizService.getAdminSubmissionView(id);
        if (response.success) {
          setSubmission(response.data);
        } else {
          toast.error("Failed to load student paper");
          navigate(-1);
        }
      } catch {
        toast.error("Paper not found");
        navigate(-1);
      } finally {
        setLoading(false);
      }
    };
    fetchResult();
  }, [id, navigate]);

  const questionStats = useMemo(() => {
    const questions = submission?.quiz?.questions || [];
    let correct = 0;
    let incorrect = 0;

    questions.forEach((q: any) => {
      const ans = submission?.answers?.find((a: any) => a.questionId === q._id);
      if (ans?.isCorrect) correct++;
      else incorrect++;
    });

    return { total: questions.length, correct, incorrect };
  }, [submission]);

  if (loading) return <SubmissionSkeleton />;
  if (!submission) return null;

  const quiz = submission.quiz;
  const studentName =
    submission.student?.name ||
    `${submission.student?.firstName || ""} ${submission.student?.lastName || ""}`.trim() ||
    "Unknown Student";
  const isPassed = submission.passed;

  const safeTimeTaken =
    isNaN(submission.timeTaken) || submission.timeTaken == null
      ? 0
      : submission.timeTaken;
  const minutes = Math.floor(safeTimeTaken / 60);
  const seconds = safeTimeTaken % 60;
  const safePercentage = isNaN(submission.percentageScore)
    ? 0
    : submission.percentageScore;

  const filteredQuestions = (quiz?.questions || [])
    .map((q: any, originalIndex: number) => {
      const studentAns = submission.answers?.find(
        (a: any) => a.questionId === q._id
      );
      const isCorrect = Boolean(studentAns?.isCorrect);
      return { q, originalIndex, studentAns, isCorrect };
    })
    .filter(({ isCorrect }: { isCorrect: boolean }) => {
      if (questionFilter === "correct") return isCorrect;
      if (questionFilter === "incorrect") return !isCorrect;
      return true;
    });

  return (
    <div className="max-w-5xl mx-auto space-y-6 md:space-y-8 pb-24 md:pb-12">
      {/* TOP NAVIGATION */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={() => navigate(-1)}
          className="group inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-brand-prussian bg-white px-3.5 py-2 rounded-xl border border-slate-200/80 shadow-sm transition-all"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
          Back to Results
        </button>

        <span className="inline-flex items-center px-3 py-1.5 rounded-xl bg-white border border-slate-200/80 text-xs font-semibold text-slate-500 shadow-sm">
          Admin Paper Review Mode
        </span>
      </div>

      {/* HERO STUDENT & QUIZ CARD */}
      <header className="relative overflow-hidden bg-gradient-to-br from-brand-prussian via-[#07273D] to-[#02121E] rounded-2xl p-6 md:p-8 text-white shadow-lg shadow-brand-prussian/15">
        <div className="pointer-events-none absolute -top-16 -right-16 w-56 h-56 rounded-full bg-brand-cerulean/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 left-1/3 w-48 h-48 rounded-full bg-brand-jasmine/10 blur-3xl" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center text-brand-jasmine shrink-0">
              <User className="w-7 h-7" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-jasmine">
                {quiz?.title || "Assessment Review"}
              </p>
              <h1 className="text-xl md:text-2xl font-bold text-white truncate mt-0.5">
                {studentName}
              </h1>
              {submission.student?.email && (
                <p className="text-xs text-slate-300 truncate mt-0.5">
                  {submission.student.email}
                </p>
              )}
            </div>
          </div>

          <div className="self-start sm:self-center shrink-0">
            <span
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border ${isPassed
                  ? "bg-emerald-500/20 text-emerald-200 border-emerald-400/30"
                  : "bg-rose-500/20 text-rose-200 border-rose-400/30"
                }`}
            >
              {isPassed ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <XCircle className="w-4 h-4" />
              )}
              {isPassed ? "Passed" : "Failed"}
            </span>
          </div>
        </div>
      </header>

      {/* KPI SUMMARY CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <div className="relative overflow-hidden bg-white p-5 rounded-2xl border border-slate-200/70 shadow-sm">
          <div
            className={`pointer-events-none absolute -top-10 -right-10 w-24 h-24 rounded-full blur-2xl ${isPassed ? "bg-emerald-500/10" : "bg-rose-500/10"
              }`}
          />
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Final Score
              </p>
              <h3
                className={`text-3xl font-bold mt-2 tabular-nums ${isPassed ? "text-emerald-600" : "text-rose-600"
                  }`}
              >
                {Math.round(safePercentage)}%
              </h3>
            </div>
            <div
              className={`p-2.5 rounded-xl ring-1 ${isPassed
                  ? "bg-emerald-50 text-emerald-600 ring-emerald-100"
                  : "bg-rose-50 text-rose-600 ring-rose-100"
                }`}
            >
              <Target className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden bg-white p-5 rounded-2xl border border-slate-200/70 shadow-sm">
          <div className="pointer-events-none absolute -top-10 -right-10 w-24 h-24 rounded-full bg-blue-500/10 blur-2xl" />
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Points Earned
              </p>
              <h3 className="text-2xl sm:text-3xl font-bold text-brand-prussian mt-2 tabular-nums">
                {submission.totalPointsEarned}
                <span className="text-sm font-medium text-slate-400 ml-1">
                  / {quiz?.totalPoints || 0}
                </span>
              </h3>
            </div>
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 ring-1 ring-blue-100">
              <Award className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden bg-white p-5 rounded-2xl border border-slate-200/70 shadow-sm">
          <div className="pointer-events-none absolute -top-10 -right-10 w-24 h-24 rounded-full bg-purple-500/10 blur-2xl" />
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Time Taken
              </p>
              <h3 className="text-2xl sm:text-3xl font-bold text-brand-prussian mt-2 tabular-nums">
                {minutes}m {seconds}s
              </h3>
            </div>
            <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600 ring-1 ring-purple-100">
              <Clock className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden bg-white p-5 rounded-2xl border border-slate-200/70 shadow-sm">
          <div className="pointer-events-none absolute -top-10 -right-10 w-24 h-24 rounded-full bg-amber-500/10 blur-2xl" />
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Submission
              </p>
              <h3 className="text-lg sm:text-xl font-bold text-brand-prussian mt-2.5 capitalize truncate">
                {submission.status?.replace("-", " ") || "Completed"}
              </h3>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 ring-1 ring-amber-100">
              <FileCheck className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* QUESTION BREAKDOWN HEADER & FILTERS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
        <div>
          <h2 className="text-lg font-bold text-brand-prussian tracking-tight">
            Question Breakdown
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Review each response against the answer key.
          </p>
        </div>

        <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200/70 shadow-sm self-start sm:self-auto">
          {(
            [
              { key: "all", label: "All", count: questionStats.total },
              { key: "correct", label: "Correct", count: questionStats.correct },
              { key: "incorrect", label: "Incorrect", count: questionStats.incorrect },
            ] as const
          ).map((tab) => {
            const active = questionFilter === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setQuestionFilter(tab.key)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${active
                    ? "bg-brand-prussian text-white shadow-sm"
                    : "text-slate-500 hover:text-brand-prussian hover:bg-slate-50"
                  }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] tabular-nums ${active
                      ? "bg-white/20 text-white"
                      : "bg-slate-100 text-slate-500"
                    }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* QUESTIONS LIST */}
      <div className="space-y-5">
        {filteredQuestions.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-12 text-center">
            <p className="text-sm font-semibold text-brand-prussian">
              No {questionFilter} questions to display
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Switch the filter above to view other questions.
            </p>
          </div>
        ) : (
          filteredQuestions.map(
            ({
              q,
              originalIndex,
              studentAns,
              isCorrect,
            }: {
              q: any;
              originalIndex: number;
              studentAns: any;
              isCorrect: boolean;
            }) => {
              const pointsEarned = studentAns ? studentAns.pointsEarned : 0;
              const hasImage = !!q.questionImage;

              return (
                <motion.article
                  key={q._id || originalIndex}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.18 }}
                  className={`bg-white rounded-2xl shadow-sm overflow-hidden border ${isCorrect
                      ? "border-emerald-200/70"
                      : "border-rose-200/70"
                    }`}
                >
                  {/* Question Header */}
                  <div
                    className={`px-5 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3 border-b ${isCorrect
                        ? "bg-emerald-50/50 border-emerald-100"
                        : "bg-rose-50/50 border-rose-100"
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`inline-flex items-center justify-center w-8 h-8 rounded-xl text-xs font-bold text-white shadow-sm tabular-nums ${isCorrect ? "bg-emerald-600" : "bg-rose-600"
                          }`}
                      >
                        Q{originalIndex + 1}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1.5 text-xs font-semibold ${isCorrect ? "text-emerald-700" : "text-rose-700"
                          }`}
                      >
                        {isCorrect ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : (
                          <XCircle className="w-4 h-4" />
                        )}
                        {isCorrect ? "Marked Correct" : "Marked Incorrect"}
                      </span>
                    </div>

                    <span className="text-xs font-bold text-brand-prussian bg-white px-3 py-1 rounded-lg border border-slate-200/80 shadow-sm tabular-nums">
                      {pointsEarned}{" "}
                      <span className="text-slate-400 font-medium">
                        / {q.points} PTS
                      </span>
                    </span>
                  </div>

                  {/* Question Body */}
                  <div className="p-5 sm:p-6 md:p-7 space-y-5">
                    <p className="text-base sm:text-lg font-semibold text-brand-prussian leading-relaxed">
                      {q.questionText}
                    </p>

                    {hasImage && (
                      <div className="rounded-xl border border-slate-200/80 overflow-hidden bg-slate-50 p-2 max-w-lg">
                        <img
                          src={q.questionImage}
                          alt={`Question ${originalIndex + 1} reference`}
                          className="w-full h-auto object-contain rounded-lg"
                        />
                      </div>
                    )}

                    {/* Options / Short Answer */}
                    <div className="space-y-2.5">
                      {q.options && q.options.length > 0 ? (
                        q.options.map((opt: any, optIdx: number) => {
                          const studentSelected =
                            studentAns?.selectedOptions?.includes(optIdx);
                          const isActuallyCorrect = opt.isCorrect;
                          const optionLetter = String.fromCharCode(65 + optIdx);

                          let containerStyle =
                            "border-slate-200/80 bg-slate-50/70 text-slate-600";
                          let badgeStyle = "bg-white text-slate-500 border-slate-200";

                          if (isActuallyCorrect) {
                            containerStyle =
                              "border-emerald-400 bg-emerald-50/70 text-emerald-950 ring-1 ring-emerald-400/30";
                            badgeStyle =
                              "bg-emerald-600 text-white border-emerald-600";
                          } else if (studentSelected && !isActuallyCorrect) {
                            containerStyle =
                              "border-rose-300 bg-rose-50/70 text-rose-950";
                            badgeStyle = "bg-rose-600 text-white border-rose-600";
                          }

                          return (
                            <div
                              key={optIdx}
                              className={`p-3.5 rounded-xl border flex items-center gap-3 transition-all ${containerStyle}`}
                            >
                              <span
                                className={`w-7 h-7 rounded-lg border flex items-center justify-center text-xs font-bold shrink-0 ${badgeStyle}`}
                              >
                                {isActuallyCorrect ? (
                                  <Check className="w-4 h-4 stroke-[2.5]" />
                                ) : studentSelected && !isActuallyCorrect ? (
                                  <XCircle className="w-4 h-4" />
                                ) : (
                                  optionLetter
                                )}
                              </span>

                              <span className="font-medium text-sm flex-1">
                                {opt.optionText}
                              </span>

                              {studentSelected && (
                                <span
                                  className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md border shrink-0 ${isActuallyCorrect
                                      ? "bg-white text-emerald-700 border-emerald-200"
                                      : "bg-white text-rose-700 border-rose-200"
                                    }`}
                                >
                                  Student Selection
                                </span>
                              )}
                            </div>
                          );
                        })
                      ) : (
                        /* Short Answer Handling */
                        <div className="space-y-3">
                          <div
                            className={`p-4 rounded-xl border ${isCorrect
                                ? "border-emerald-300 bg-emerald-50/60"
                                : "border-rose-300 bg-rose-50/60"
                              }`}
                          >
                            <p
                              className={`text-[11px] font-bold uppercase tracking-wider mb-1 ${isCorrect ? "text-emerald-700" : "text-rose-600"
                                }`}
                            >
                              Student's Typed Answer
                            </p>
                            <p
                              className={`text-sm font-semibold ${isCorrect ? "text-emerald-950" : "text-rose-950"
                                }`}
                            >
                              {studentAns?.shortAnswer || "No answer provided"}
                            </p>
                          </div>

                          {!isCorrect && q.options?.[0]?.optionText && (
                            <div className="p-4 rounded-xl border border-emerald-300 bg-emerald-50/60">
                              <p className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Target Correct Answer
                              </p>
                              <p className="text-sm font-semibold text-emerald-950">
                                {q.options[0].optionText}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Teacher's Explanation */}
                    {q.explanation && (
                      <div className="p-4 sm:p-5 bg-brand-aliceBlue/50 border border-brand-cerulean/20 rounded-xl">
                        <h4 className="text-[11px] font-bold text-brand-cerulean uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <HelpCircle className="w-4 h-4" />
                          Teacher's Explanation
                        </h4>
                        <p className="text-sm text-brand-prussian leading-relaxed whitespace-pre-wrap">
                          {q.explanation}
                        </p>
                      </div>
                    )}
                  </div>
                </motion.article>
              );
            }
          )
        )}
      </div>
    </div>
  );
}