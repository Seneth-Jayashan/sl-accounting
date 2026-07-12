import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft, CheckCircle2, XCircle, Clock,
  HelpCircle, AlertTriangle, Calendar,
  BookOpen, Target, ChevronDown,ChevronLeft
} from "lucide-react";
import QuizService from "../../../services/QuizService";
import { toast } from "react-hot-toast";

export default function QuizResult() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [resultData, setResultData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "correct" | "incorrect">("all");
  const [filterOpen, setFilterOpen] = useState(false);

  useEffect(() => {
    const fetchResult = async () => {
      if (!id) return;
      try {
        const response = await QuizService.getDetailedReview(id);
        if (response.success) {
          setResultData(response);
        } else {
          toast.error("Failed to load result");
          navigate(-1);
        }
      } catch (error: any) {
        toast.error(error.response?.data?.message || "Result not found");
        navigate(-1);
      } finally {
        setLoading(false);
      }
    };
    fetchResult();
  }, [id, navigate]);

  const filteredReview = useMemo(() => {
    if (!resultData?.review) return [];
    if (filter === "correct") return resultData.review.filter((q: any) => q.isCorrect);
    if (filter === "incorrect") return resultData.review.filter((q: any) => !q.isCorrect);
    return resultData.review;
  }, [resultData, filter]);

  const filterLabel = filter === "all" ? "All" : filter === "correct" ? "Correct" : "Incorrect";

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-brand-cerulean rounded-full animate-spin mb-4"></div>
        <p className="text-gray-400 font-semibold uppercase tracking-widest text-xs">Loading result...</p>
      </div>
    );
  }

  if (!resultData) return null;

  const { summary, review, quizTitle, message } = resultData;
  const isPassed = summary.passed;

  const safeTimeTaken = isNaN(summary.timeTaken) || summary.timeTaken == null ? 0 : summary.timeTaken;
  const minutes = Math.floor(safeTimeTaken / 60);
  const seconds = safeTimeTaken % 60;

  const completedDate = summary.completedAt ? new Date(summary.completedAt) : new Date();
  const dateStr = completedDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  const timeStr = completedDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  const correctCount = review ? review.filter((q: any) => q.isCorrect).length : 0;
  const totalCount = review ? review.length : 0;
  const incorrectCount = totalCount - correctCount;

  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const safePercentage = isNaN(summary.percentage) ? 0 : summary.percentage;
  const strokeDashoffset = circumference - (safePercentage / 100) * circumference;

  return (
    <div className="font-sans">

      {/* Compact breadcrumb header stays outside the container */}
      <div className="flex items-center gap-2 mb-1">
        <button
                            type="button"
                            onClick={() => navigate(-1)}
                            className="w-9 h-9 flex items-center justify-center rounded-full bg-white border border-gray-200 hover:bg-gray-50 transition flex-shrink-0"
                            title="Back"
                        >
                            <ChevronLeft className="w-5 h-5" style={{ color: "#0A5B70" }} />
                        </button>
        <h1 className="text-xl font-bold text-gray-800">Quiz detailed Analysis</h1>
      </div>
      <p className="text-sm text-gray-500 mb-6 ml-8">Track your assessment history and improvement over time.</p>

      {/* SINGLE CONTAINER wraps everything below */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6 space-y-5">

        <p className="text-sm font-bold text-brand-cerulean uppercase tracking-wide">{quizTitle || "Quiz"}</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="md:col-span-2 bg-gray-50/60 rounded-xl p-5 border border-gray-100 flex flex-col sm:flex-row items-center gap-6">

            <div className="relative w-28 h-28 shrink-0">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r={radius} className="text-gray-200 stroke-current" strokeWidth="6" fill="transparent" />
                <circle
                  cx="40" cy="40" r={radius}
                  className={`${isPassed ? 'text-green-500' : 'text-red-500'} stroke-current transition-all duration-1000 ease-out`}
                  strokeWidth="6" fill="transparent"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xl font-black text-gray-800">{Math.round(safePercentage)}%</span>
              </div>
            </div>

            <div className="flex-1 text-center sm:text-left">
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide mb-2 ${isPassed ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
                {isPassed ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
                {isPassed ? 'Passed' : 'Failed Attempt'}
              </span>
              <h2 className="text-xl font-bold text-gray-800 mb-2">Assessment Complete</h2>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs text-gray-500">
                <span className="bg-white px-2.5 py-1 rounded-md border border-gray-100">
                  {summary.totalPointsEarned} / {summary.totalQuizPoints} Points
                </span>
                <span className="bg-white px-2.5 py-1 rounded-md border border-gray-100">
                  {minutes}m {seconds}s
                </span>
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-brand-prussian rounded-xl p-5 text-white flex flex-col justify-between relative overflow-hidden">
            <div className="absolute -right-3 -bottom-3 opacity-10"><BookOpen size={90} /></div>
            <div>
              <p className="text-white/60 text-[10px] font-bold uppercase tracking-wide mb-1">Module Details</p>
              <h3 className="font-bold text-base leading-snug mb-3">{quizTitle}</h3>
            </div>
            <div className="space-y-2 relative z-10">
              <div className="flex items-center gap-2 text-xs text-white/90">
                <Calendar size={14} className="text-brand-cerulean shrink-0" />
                <span className="font-medium">{dateStr}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-white/90">
                <Clock size={14} className="text-brand-cerulean shrink-0" />
                <span className="font-medium">{timeStr}</span>
              </div>
            </div>
          </motion.div>
        </div>

        {message && !review && (
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-8 text-center flex flex-col items-center">
            <div className="w-12 h-12 bg-blue-100 text-blue-500 rounded-full flex items-center justify-center mb-3">
              <AlertTriangle size={24} />
            </div>
            <h3 className="text-base font-bold text-blue-900 mb-1">Detailed Review Hidden</h3>
            <p className="text-sm text-blue-700 max-w-md">{message}</p>
          </div>
        )}

        {review && (
          <div className="space-y-4">

            {/* Filter dropdown */}
            <div className="flex justify-end">
              <div className="relative">
                <button
                  onClick={() => setFilterOpen(!filterOpen)}
                  className="flex items-center gap-2 px-4 py-2 bg-brand-prussian text-white text-xs font-bold uppercase tracking-wide rounded-lg"
                >
                  {filterLabel} <ChevronDown size={14} className={`transition-transform ${filterOpen ? 'rotate-180' : ''}`} />
                </button>
                {filterOpen && (
                  <div className="absolute right-0 mt-1 w-32 bg-white border border-gray-100 rounded-lg shadow-md overflow-hidden z-10">
                    {(['all', 'correct', 'incorrect'] as const).map((f) => (
                      <button
                        key={f}
                        onClick={() => { setFilter(f); setFilterOpen(false); }}
                        className={`w-full text-left px-4 py-2 text-xs font-semibold capitalize hover:bg-gray-50 ${filter === f ? 'text-brand-cerulean' : 'text-gray-600'}`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {filteredReview.length === 0 ? (
              <div className="text-center py-10 text-gray-400 text-sm font-medium">No questions match this filter.</div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredReview.map((q: any, index: number) => {
                  const isCorrect = q.isCorrect;
                  const hasImage = !!q.questionImage;

                  return (
                    <motion.div
                      key={q.questionId || index}
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      className="py-5 first:pt-0 last:pb-0"
                    >
                      <div
                        className={`tiptap text-base font-semibold mb-4 ${isCorrect ? 'text-green-600' : 'text-red-500'}`}
                        dangerouslySetInnerHTML={{ __html: `Q${index + 1}) ${q.questionText}` }}
                      />

                      {hasImage && (
                        <div className="mb-4 rounded-lg border border-gray-200 overflow-hidden bg-gray-50 p-2 max-w-lg">
                          <img src={q.questionImage} alt="Reference" className="w-full h-auto object-contain rounded" />
                        </div>
                      )}

                      <div className="space-y-2">
                        {q.options && q.options.length > 0 ? (
                          q.options.map((opt: any, optIdx: number) => {
                            const studentSelected = q.studentSelection?.includes(optIdx);
                            const isActuallyCorrect = opt.isCorrect;

                            let style = "border-gray-200 bg-white text-gray-700";
                            if (isActuallyCorrect) {
                              style = "border-green-200 bg-green-50 text-green-800";
                            } else if (studentSelected && !isActuallyCorrect) {
                              style = "border-red-200 bg-red-50 text-red-700";
                            }

                            return (
                              <div key={optIdx} className={`px-4 py-3 rounded-lg border flex items-center gap-3 ${style}`}>
                                <span className="text-sm font-medium">{optIdx + 1}. {opt.optionText}</span>
                                {studentSelected && (
                                  <span className="ml-auto text-[10px] font-bold uppercase tracking-wide text-gray-400 bg-gray-50 px-2 py-0.5 rounded border border-gray-200 shrink-0">Your Answer</span>
                                )}
                              </div>
                            );
                          })
                        ) : (
                          <div className="space-y-3">
                            <div className="px-4 py-3 rounded-lg border border-red-200 bg-red-50">
                              <p className="text-[10px] font-bold text-red-400 uppercase tracking-wide mb-1">Your Answer</p>
                              <p className="text-sm font-medium text-red-800">{q.studentShortAnswer || "No answer provided"}</p>
                            </div>
                            {!isCorrect && (
                              <div className="px-4 py-3 rounded-lg border border-green-200 bg-green-50">
                                <p className="text-[10px] font-bold text-green-600 uppercase tracking-wide mb-1">Correct Answer</p>
                                <p className="text-sm font-medium text-green-800">{q.options[0]?.optionText}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {q.explanation && (
                        <div className="mt-4 p-4 bg-brand-aliceBlue/40 border border-brand-aliceBlue rounded-lg">
                          <h4 className="text-[10px] font-bold text-brand-cerulean uppercase tracking-wide mb-2 flex items-center gap-1.5">
                            <HelpCircle size={12} /> Teacher's Explanation
                          </h4>
                          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                            {q.explanation}
                          </p>
                        </div>
                      )}
                    </motion.div>
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