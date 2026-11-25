import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  Edit,
  CheckCircle2,
  XCircle,
  Clock,
  Settings,
  HelpCircle,
  BookOpen,
  Award,
  FileDown,
  FileText,
  BarChart,
  Target,
  ListChecks,
  Check,
  AlertTriangle,
} from "lucide-react";
import { toast } from "react-hot-toast";
import QuizService, { type Quiz } from "../../../services/QuizService";
import { QuizDocumentGenerator } from "../../../utils/QuizDocumentGenerator";

// --- Skeleton Loader ---

function ViewQuizSkeleton() {
  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-pulse pb-16">
      <div className="flex justify-between">
        <div className="h-9 w-36 bg-slate-200 rounded-xl" />
        <div className="flex gap-2">
          <div className="h-9 w-20 bg-slate-100 rounded-xl" />
          <div className="h-9 w-20 bg-slate-100 rounded-xl" />
          <div className="h-9 w-28 bg-slate-200 rounded-xl" />
        </div>
      </div>
      <div className="h-40 bg-white rounded-2xl border border-slate-100" />
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
          <div key={i} className="h-56 bg-white rounded-2xl border border-slate-100" />
        ))}
      </div>
    </div>
  );
}

// --- Main Component ---

const ViewQuiz: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuizDetails = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const response = await QuizService.getQuizById(id);
        if (response.success && response.data) {
          setQuiz(response.data);
        }
      } catch (error) {
        toast.error("Failed to load quiz details");
        console.error("Error fetching quiz:", error);
        navigate("/admin/quizzes");
      } finally {
        setLoading(false);
      }
    };

    fetchQuizDetails();
  }, [id, navigate]);

  if (loading) return <ViewQuizSkeleton />;

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
          The quiz you are looking for may have been removed or does not exist.
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

  // Normalize target classes into an array of display names
  const classNames: string[] = Array.isArray(quiz.class)
    ? quiz.class.map((c: any) =>
      typeof c === "object" && c !== null ? c.name || c.className || c._id : c
    )
    : quiz.class
      ? [
        typeof quiz.class === "object" && quiz.class !== null
          ? (quiz.class as any).name ||
          (quiz.class as any).className ||
          "Unknown Class"
          : `Class #${String(quiz.class).slice(-4)}`,
      ]
      : ["General"];

  const rules = [
    {
      label: "Shuffle Questions",
      enabled: Boolean(quiz.settings?.shuffleQuestions),
    },
    {
      label: "Shuffle Options",
      enabled: Boolean(quiz.settings?.shuffleOptions),
    },
    {
      label: "Allow Backtracking",
      enabled: Boolean(quiz.settings?.allowBacktrack),
    },
    {
      label: "Instant Results",
      enabled: Boolean(quiz.settings?.showResultImmediately),
    },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6 md:space-y-8 pb-24 md:pb-12">
      {/* TOP ACTION BAR */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={() => navigate("/admin/quizzes")}
          className="group inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-brand-prussian bg-white px-3.5 py-2 rounded-xl border border-slate-200/80 shadow-sm transition-all"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
          Back to Quizzes
        </button>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() =>
              toast.promise(QuizDocumentGenerator.generateQuizPdf(quiz), {
                loading: "Generating PDF...",
                success: "PDF downloaded!",
                error: "Failed to generate PDF",
              })
            }
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200/80 text-slate-600 hover:text-emerald-700 hover:border-emerald-300 rounded-xl text-xs font-semibold shadow-sm transition-colors"
          >
            <FileDown className="w-4 h-4" />
            <span>PDF</span>
          </button>

          <button
            onClick={() =>
              toast.promise(QuizDocumentGenerator.generateQuizDocx(quiz), {
                loading: "Generating Word Doc...",
                success: "Word Doc downloaded!",
                error: "Failed to generate Word Doc",
              })
            }
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200/80 text-slate-600 hover:text-blue-700 hover:border-blue-300 rounded-xl text-xs font-semibold shadow-sm transition-colors"
          >
            <FileText className="w-4 h-4" />
            <span>Word</span>
          </button>

          <Link
            to={`/admin/quizzes/analytics/${quiz._id}`}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200/80 text-slate-600 hover:text-purple-700 hover:border-purple-300 rounded-xl text-xs font-semibold shadow-sm transition-colors"
          >
            <BarChart className="w-4 h-4" />
            <span>Analytics</span>
          </Link>

          <Link
            to={`/admin/quizzes/edit/${quiz._id}`}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-prussian hover:bg-brand-cerulean text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
          >
            <Edit className="w-4 h-4" />
            <span>Edit Quiz</span>
          </Link>
        </div>
      </div>

      {/* HERO QUIZ HEADER */}
      <header className="relative overflow-hidden bg-gradient-to-br from-brand-prussian via-[#07273D] to-[#02121E] rounded-2xl p-6 md:p-8 text-white shadow-lg shadow-brand-prussian/15">
        <div className="pointer-events-none absolute -top-16 -right-16 w-56 h-56 rounded-full bg-brand-cerulean/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 left-1/3 w-48 h-48 rounded-full bg-brand-jasmine/10 blur-3xl" />

        <div className="relative z-10 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${quiz.isPublished
                  ? "bg-emerald-500/20 text-emerald-200 border-emerald-400/30"
                  : "bg-white/10 text-slate-300 border-white/15"
                }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${quiz.isPublished ? "bg-emerald-400" : "bg-slate-400"
                  }`}
              />
              {quiz.isPublished ? "Published" : "Draft"}
            </span>

            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wide bg-white/10 text-brand-jasmine border border-white/15">
              {quiz.quizType} Exam
            </span>
          </div>

          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            {quiz.title}
          </h1>

          {/* Target Classes Pills */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {classNames.map((name, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-200 bg-white/10 px-3 py-1 rounded-lg border border-white/10"
              >
                <BookOpen className="w-3.5 h-3.5 text-brand-cerulean" />
                {name}
              </span>
            ))}
          </div>
        </div>
      </header>

      {/* KPI SUMMARY CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <div className="relative overflow-hidden bg-white p-5 rounded-2xl border border-slate-200/70 shadow-sm">
          <div className="pointer-events-none absolute -top-10 -right-10 w-24 h-24 rounded-full bg-blue-500/10 blur-2xl" />
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Questions
              </p>
              <h3 className="text-3xl font-bold text-brand-prussian mt-2 tabular-nums">
                {quiz.questions.length}
              </h3>
            </div>
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 ring-1 ring-blue-100">
              <ListChecks className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden bg-white p-5 rounded-2xl border border-slate-200/70 shadow-sm">
          <div className="pointer-events-none absolute -top-10 -right-10 w-24 h-24 rounded-full bg-emerald-500/10 blur-2xl" />
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Total Points
              </p>
              <h3 className="text-3xl font-bold text-brand-prussian mt-2 tabular-nums">
                {quiz.totalPoints}
              </h3>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
              <Award className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden bg-white p-5 rounded-2xl border border-slate-200/70 shadow-sm">
          <div className="pointer-events-none absolute -top-10 -right-10 w-24 h-24 rounded-full bg-purple-500/10 blur-2xl" />
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Duration
              </p>
              <h3 className="text-3xl font-bold text-brand-prussian mt-2 tabular-nums">
                {quiz.duration}
                <span className="text-xs font-medium text-slate-400 ml-1">min</span>
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
                Pass Mark
              </p>
              <h3 className="text-3xl font-bold text-brand-prussian mt-2 tabular-nums">
                {quiz.passingPercentage}%
              </h3>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 ring-1 ring-amber-100">
              <Target className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* EXAM RULES BAR */}
      <section className="bg-white p-5 rounded-2xl border border-slate-200/70 shadow-sm">
        <div className="flex items-center gap-2 mb-3.5">
          <Settings className="w-4 h-4 text-brand-cerulean" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Exam Configuration & Rules
          </h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {rules.map((rule) => (
            <div
              key={rule.label}
              className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border text-xs font-semibold ${rule.enabled
                  ? "bg-emerald-50/60 border-emerald-200/70 text-emerald-800"
                  : "bg-slate-50 border-slate-200/70 text-slate-400"
                }`}
            >
              {rule.enabled ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <XCircle className="w-4 h-4 text-slate-400 shrink-0" />
              )}
              <span className="truncate">{rule.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* QUESTIONS SECTION HEADER */}
      <div className="flex items-center justify-between pt-2">
        <div>
          <h2 className="text-lg font-bold text-brand-prussian tracking-tight">
            Answer Key & Questions
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Correct answers are highlighted in green below.
          </p>
        </div>
        <span className="text-xs font-semibold text-brand-cerulean bg-brand-aliceBlue px-3 py-1 rounded-full tabular-nums">
          {quiz.questions.length} Questions • {quiz.totalPoints} Pts
        </span>
      </div>

      {/* QUESTIONS LIST */}
      <div className="space-y-5">
        {quiz.questions.map((q, index) => (
          <article
            key={q._id || index}
            className="bg-white rounded-2xl shadow-sm border border-slate-200/70 overflow-hidden"
          >
            {/* Question Header */}
            <div className="px-5 sm:px-6 py-3.5 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-brand-prussian text-white text-xs font-bold tabular-nums shadow-sm">
                  Q{index + 1}
                </span>
                {q.questionType && (
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 bg-white px-2.5 py-1 rounded-lg border border-slate-200/70">
                    {q.questionType.replace("-", " ")}
                  </span>
                )}
              </div>

              <span className="text-xs font-bold text-brand-prussian bg-white px-3 py-1 rounded-lg border border-slate-200/80 shadow-sm tabular-nums">
                {q.points} {q.points === 1 ? "Pt" : "Pts"}
              </span>
            </div>

            {/* Question Body */}
            <div className="p-5 sm:p-6 space-y-5">
              {/* Rich Text Prompt */}
              <div
                className="tiptap text-base font-medium text-brand-prussian leading-relaxed"
                dangerouslySetInnerHTML={{ __html: q.questionText }}
              />

              {/* Options */}
              <div className="space-y-2.5">
                {q.options.map((opt, optIndex) => {
                  const letter = String.fromCharCode(65 + optIndex);
                  return (
                    <div
                      key={opt._id || optIndex}
                      className={`p-3.5 rounded-xl border flex items-center gap-3 transition-colors ${opt.isCorrect
                          ? "bg-emerald-50/70 border-emerald-400 text-emerald-950 ring-1 ring-emerald-400/25"
                          : "bg-slate-50/70 border-slate-200/70 text-slate-600"
                        }`}
                    >
                      <span
                        className={`w-7 h-7 rounded-lg border flex items-center justify-center text-xs font-bold shrink-0 ${opt.isCorrect
                            ? "bg-emerald-600 text-white border-emerald-600"
                            : "bg-white text-slate-500 border-slate-200"
                          }`}
                      >
                        {opt.isCorrect ? (
                          <Check className="w-4 h-4 stroke-[2.5]" />
                        ) : (
                          letter
                        )}
                      </span>
                      <span className="text-sm font-medium flex-1">
                        {opt.optionText}
                      </span>
                      {opt.isCorrect && (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-white px-2.5 py-0.5 rounded-md border border-emerald-200 shrink-0">
                          Correct
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Explanation */}
              {q.explanation && (
                <div className="p-4 sm:p-5 bg-brand-aliceBlue/50 border border-brand-cerulean/20 rounded-xl flex items-start gap-3">
                  <HelpCircle className="w-4 h-4 text-brand-cerulean shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-brand-cerulean mb-1">
                      Explanation / Working
                    </h4>
                    <p className="text-sm text-brand-prussian leading-relaxed whitespace-pre-wrap">
                      {q.explanation}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};

export default ViewQuiz;