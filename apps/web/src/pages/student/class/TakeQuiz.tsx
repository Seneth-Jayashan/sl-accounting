import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  FileText,
  ShieldAlert,
  Loader2,
  ArrowLeft,
  HelpCircle,
  Award,
  RotateCcw,
  Send,
  AlertTriangle,
  LayoutGrid,
  Check,
} from "lucide-react";
import { toast } from "react-hot-toast";
import QuizService, {
  type Quiz,
  type StudentAnswer,
} from "../../../services/QuizService";

const OPTION_LETTERS = ["A", "B", "C", "D", "E", "F", "G", "H"];

const getQuestionTypeLabel = (type: string) => {
  switch (type) {
    case "mcq":
      return "Single Choice";
    case "multi-select":
      return "Multiple Choice";
    case "true-false":
      return "True / False";
    case "short-answer":
      return "Short Answer";
    default:
      return "Question";
  }
};

const TakeQuiz: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Data State
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submissionId, setSubmissionId] = useState<string | null>(null);

  // Exam State
  const [isStarted, setIsStarted] = useState(false);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [answers, setAnswers] = useState<StudentAnswer[]>([]);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  // Refs for escaping React closure loop
  const isSubmittingRef = useRef(false);
  const answersRef = useRef<StudentAnswer[]>([]);

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  // 1. Fetch Quiz Details & Auto-Recovery
  useEffect(() => {
    const fetchQuiz = async () => {
      if (!id) {
        toast.error("Quiz ID is missing from the URL!");
        navigate(-1);
        return;
      }

      try {
        const response = await QuizService.getQuizById(id);
        if (response.success && response.data) {
          setQuiz(response.data);

          // Auto-Recovery Check
          const savedSessionStr = localStorage.getItem(`quiz_session_${id}`);
          if (savedSessionStr) {
            const savedSession = JSON.parse(savedSessionStr);
            const now = new Date().getTime();
            if (now < savedSession.endTime) {
              setSubmissionId(savedSession.submissionId);
              setAnswers(savedSession.answers);
              setTimeLeft(Math.floor((savedSession.endTime - now) / 1000));
              setIsStarted(true);
              toast.success("Exam session recovered.");
              setLoading(false);
              return;
            } else {
              localStorage.removeItem(`quiz_session_${id}`);
            }
          }

          const initialAnswers = response.data.questions.map((q: any) => ({
            questionId: q._id!,
            selectedOptions: [],
            shortAnswer: "",
          }));
          setAnswers(initialAnswers);
        }
      } catch (error: any) {
        toast.error(
          error.response?.data?.message || "Failed to load exam details"
        );
        navigate(-1);
      } finally {
        setLoading(false);
      }
    };
    fetchQuiz();
  }, [id, navigate]);

  // 2. Submit Exam Handler (Memoized & Protected against Race Conditions)
  const executeSubmit = useCallback(
    async (isTimeOut = false) => {
      if (!submissionId) return;
      if (isSubmittingRef.current) return;

      try {
        isSubmittingRef.current = true;
        setSubmitting(true);
        setShowSubmitModal(false);

        const response = await QuizService.submitQuiz(
          submissionId,
          answersRef.current,
          isTimeOut
        );

        if (response.success) {
          if (quiz) localStorage.removeItem(`quiz_session_${quiz._id}`);
          toast.success(
            isTimeOut
              ? "Time's up! Exam submitted automatically."
              : "Exam submitted successfully!"
          );
          navigate(`/student/quizzes/result/${submissionId}`, { replace: true });
        }
      } catch (error: any) {
        toast.error(error.response?.data?.message || "Failed to submit exam.");
        isSubmittingRef.current = false;
        setSubmitting(false);
      }
    },
    [submissionId, navigate, quiz]
  );

  // 3. Timer Logic & Anti-Cheat
  useEffect(() => {
    if (!isStarted) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue =
        "You have an active exam. Are you sure you want to leave?";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          if (!isSubmittingRef.current) {
            executeSubmit(true);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timer);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isStarted, executeSubmit]);

  // 4. Start Exam Handler
  const handleStartExam = async () => {
    if (!quiz || starting) return;
    try {
      setStarting(true);
      const response = await QuizService.startQuiz(quiz._id);
      if (response.success) {
        const durationSeconds = quiz.duration * 60;
        const endTime = new Date().getTime() + durationSeconds * 1000;

        setSubmissionId(response.submissionId);
        setTimeLeft(durationSeconds);
        setIsStarted(true);

        localStorage.setItem(
          `quiz_session_${quiz._id}`,
          JSON.stringify({
            submissionId: response.submissionId,
            endTime,
            answers,
          })
        );
      }
    } catch (error: any) {
      toast.error(
        error.response?.data?.message ||
        "Could not start exam. You may have already attempted it."
      );
    } finally {
      setStarting(false);
    }
  };

  // 5. Answer Input Handlers
  const syncStorage = (newAnswers: StudentAnswer[]) => {
    if (!quiz || !submissionId) return;
    const savedSessionStr = localStorage.getItem(`quiz_session_${quiz._id}`);
    if (savedSessionStr) {
      const session = JSON.parse(savedSessionStr);
      session.answers = newAnswers;
      localStorage.setItem(`quiz_session_${quiz._id}`, JSON.stringify(session));
    }
  };

  const handleOptionSelect = (qId: string, optIndex: number, type: string) => {
    setAnswers((prev) => {
      const newAns = prev.map((ans) => {
        if (ans.questionId === qId) {
          if (type === "mcq" || type === "true-false") {
            return { ...ans, selectedOptions: [optIndex] };
          } else if (type === "multi-select") {
            const exists = ans.selectedOptions?.includes(optIndex);
            const newOpts = exists
              ? ans.selectedOptions?.filter((i) => i !== optIndex)
              : [...(ans.selectedOptions || []), optIndex];
            return { ...ans, selectedOptions: newOpts };
          }
        }
        return ans;
      });
      syncStorage(newAns);
      return newAns;
    });
  };

  const handleShortAnswer = (qId: string, text: string) => {
    setAnswers((prev) => {
      const newAns = prev.map((ans) =>
        ans.questionId === qId ? { ...ans, shortAnswer: text } : ans
      );
      syncStorage(newAns);
      return newAns;
    });
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, "0")}:${s
        .toString()
        .padStart(2, "0")}`;
    }
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const answeredCount = useMemo(() => {
    return answers.filter(
      (ans) =>
        (ans.selectedOptions && ans.selectedOptions.length > 0) ||
        (ans.shortAnswer && ans.shortAnswer.trim() !== "")
    ).length;
  }, [answers]);

  // --- LOADING STATE ---
  if (loading && !isStarted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#f8fafc] gap-4">
        <div className="w-14 h-14 rounded-2xl bg-brand-cerulean/10 border border-brand-cerulean/20 flex items-center justify-center">
          <Loader2 className="animate-spin text-brand-cerulean" size={28} />
        </div>
        <div className="text-center">
          <p className="text-sm font-extrabold text-brand-prussian">
            Preparing Exam Environment
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            Loading questions & verifying session...
          </p>
        </div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] p-6">
        <div className="bg-white rounded-3xl p-8 text-center border border-gray-100 shadow-sm max-w-sm w-full">
          <p className="text-base font-bold text-brand-prussian mb-4">
            Quiz not found.
          </p>
          <button
            onClick={() => navigate(-1)}
            className="px-5 py-2.5 rounded-xl bg-brand-prussian text-white text-sm font-bold"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // --- VIEW 1: PRE-EXAM BRIEFING ---
  if (!isStarted) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4 sm:p-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="bg-white max-w-2xl w-full rounded-[2rem] shadow-xl shadow-brand-prussian/10 border border-gray-100 overflow-hidden"
        >
          {/* Hero Header */}
          <div className="relative bg-gradient-to-br from-brand-prussian via-[#0d3a4b] to-brand-cerulean p-7 sm:p-9 text-white overflow-hidden">
            <div className="pointer-events-none absolute -top-16 -right-16 w-56 h-56 rounded-full bg-brand-jasmine/20 blur-3xl" />

            <button
              onClick={() => navigate(-1)}
              className="relative z-10 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-bold text-white/90 transition-colors mb-6"
            >
              <ArrowLeft size={14} />
              <span>Back</span>
            </button>

            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-white/15 border border-white/20 rounded-2xl flex items-center justify-center mb-4 backdrop-blur-md shadow-lg">
                <FileText size={30} className="text-brand-jasmine" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-snug">
                {quiz.title}
              </h1>
              {quiz.description && (
                <p className="text-white/75 text-sm sm:text-base mt-2 max-w-lg leading-relaxed">
                  {quiz.description}
                </p>
              )}
            </div>
          </div>

          {/* Body */}
          <div className="p-6 sm:p-8 space-y-6">
            {/* 4 Stat Tiles */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 text-center">
                <HelpCircle
                  size={18}
                  className="mx-auto text-brand-cerulean mb-1.5"
                />
                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">
                  Questions
                </p>
                <p className="text-xl font-black text-brand-prussian mt-0.5">
                  {quiz.questions.length}
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 text-center">
                <Clock size={18} className="mx-auto text-blue-600 mb-1.5" />
                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">
                  Duration
                </p>
                <p className="text-xl font-black text-brand-prussian mt-0.5">
                  {quiz.duration}m
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 text-center">
                <Award size={18} className="mx-auto text-emerald-600 mb-1.5" />
                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">
                  Pass Mark
                </p>
                <p className="text-xl font-black text-brand-prussian mt-0.5">
                  {quiz.passingPercentage}%
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 text-center">
                <RotateCcw
                  size={18}
                  className="mx-auto text-purple-600 mb-1.5"
                />
                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">
                  Attempts
                </p>
                <p className="text-xl font-black text-brand-prussian mt-0.5">
                  {quiz.settings.maxAttempts}
                </p>
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-5 flex gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                <ShieldAlert size={20} />
              </div>
              <div>
                <h3 className="font-extrabold text-amber-900 text-sm mb-1.5">
                  Before You Begin
                </h3>
                <ul className="text-xs sm:text-sm text-amber-800/90 space-y-1.5 list-disc ml-4 leading-relaxed">
                  <li>Do not refresh or close the browser tab once started.</li>
                  <li>Ensure you have a stable internet connection.</li>
                  <li>
                    Your answers are saved automatically and submitted when time
                    expires.
                  </li>
                  <li>
                    Keep your calculator and rough paper ready for accounting
                    workings.
                  </li>
                </ul>
              </div>
            </div>

            {/* Start Button */}
            <button
              onClick={handleStartExam}
              disabled={starting}
              className="w-full bg-brand-prussian hover:bg-brand-cerulean text-white font-extrabold text-base py-4 rounded-2xl transition-all shadow-lg shadow-brand-prussian/20 active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {starting ? (
                <>
                  <Loader2 size={19} className="animate-spin" />
                  <span>Starting Attempt...</span>
                </>
              ) : (
                <>
                  <span>Start Attempt Now</span>
                  <ChevronRight size={19} />
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // --- VIEW 2: ACTIVE EXAM INTERFACE ---
  const currentQ = quiz.questions[currentQIndex];
  const currentAns = answers.find((a) => a.questionId === currentQ._id);
  const isTimeRunningOut = timeLeft < 300;
  const totalQuestions = quiz.questions.length;
  const progressPercent =
    totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;
  const unansweredCount = totalQuestions - answeredCount;

  return (
    <div
      className="min-h-screen bg-[#f8fafc] flex flex-col select-none"
      onContextMenu={(e) => e.preventDefault()}
      onCopy={(e) => e.preventDefault()}
    >
      {/* --- STICKY EXAM HEADER --- */}
      <header className="bg-white/95 backdrop-blur-md border-b border-gray-200/80 sticky top-0 z-40 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          {/* Left: Title & Progress */}
          <div className="min-w-0 flex-1 hidden md:block">
            <h1 className="text-base font-extrabold text-brand-prussian truncate">
              {quiz.title}
            </h1>
            <p className="text-xs text-gray-400 font-medium">
              {answeredCount} of {totalQuestions} answered ({progressPercent}%)
            </p>
          </div>

          {/* Center: Timer */}
          <div
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl font-mono text-base sm:text-lg font-extrabold tracking-wider border transition-colors ${isTimeRunningOut
                ? "bg-red-50 text-red-600 border-red-200 animate-pulse"
                : "bg-brand-aliceBlue/60 text-brand-prussian border-brand-cerulean/20"
              }`}
          >
            <Clock
              size={18}
              className={
                isTimeRunningOut ? "text-red-500" : "text-brand-cerulean"
              }
            />
            <span>{formatTime(timeLeft)}</span>
          </div>

          {/* Right: Finish Button */}
          <button
            onClick={() => setShowSubmitModal(true)}
            disabled={submitting}
            className="inline-flex items-center gap-2 bg-brand-prussian text-white px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold hover:bg-brand-cerulean transition-all shadow-sm active:scale-95 disabled:opacity-50 shrink-0"
          >
            <Send size={15} />
            <span>{submitting ? "Submitting..." : "Finish Exam"}</span>
          </button>
        </div>

        {/* Top Progress Bar */}
        <div className="h-1 w-full bg-gray-100">
          <div
            className="h-full bg-gradient-to-r from-brand-cerulean to-emerald-500 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </header>

      {/* --- MAIN EXAM WORKSPACE --- */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 flex flex-col lg:flex-row gap-6">
        {/* LEFT: QUESTION CARD */}
        <div className="flex-1 bg-white rounded-3xl shadow-sm border border-gray-100 p-5 sm:p-8 flex flex-col">
          {/* Question Meta Row */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-5 mb-6 border-b border-gray-100">
            <div className="flex items-center gap-2.5">
              <span className="px-3 py-1 rounded-full bg-brand-prussian text-white text-xs font-extrabold">
                Q{currentQIndex + 1} / {totalQuestions}
              </span>
              <span className="px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 text-[11px] font-bold uppercase tracking-wider">
                {getQuestionTypeLabel(currentQ.questionType)}
              </span>
            </div>

            <span className="px-3 py-1 rounded-full bg-brand-aliceBlue text-brand-cerulean text-xs font-extrabold">
              {currentQ.points} {currentQ.points === 1 ? "Point" : "Points"}
            </span>
          </div>

          {/* Animated Question Body */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentQ._id || currentQIndex}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="flex-1 flex flex-col"
            >
              <div
                className="tiptap text-lg sm:text-xl font-semibold text-gray-900 mb-6 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: currentQ.questionText }}
              />

              {currentQ.questionImage && (
                <div className="mb-6 rounded-2xl border border-gray-200/80 overflow-hidden bg-gray-50 p-3">
                  <img
                    src={currentQ.questionImage}
                    alt="Reference material"
                    className="max-w-full h-auto mx-auto object-contain max-h-96 rounded-xl"
                  />
                </div>
              )}

              {/* Answer Input Area */}
              <div className="space-y-3 mt-auto mb-8">
                {currentQ.questionType === "short-answer" ? (
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                      Your Answer
                    </label>
                    <textarea
                      value={currentAns?.shortAnswer || ""}
                      onChange={(e) =>
                        handleShortAnswer(currentQ._id!, e.target.value)
                      }
                      placeholder="Type your answer clearly here..."
                      className="w-full p-4 text-sm sm:text-base text-gray-800 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:border-brand-cerulean focus:ring-2 focus:ring-brand-cerulean/15 outline-none resize-y min-h-[140px] transition-all"
                    />
                  </div>
                ) : (
                  currentQ.options.map((opt, idx) => {
                    const isSelected = currentAns?.selectedOptions?.includes(idx);
                    const isMulti = currentQ.questionType === "multi-select";

                    return (
                      <label
                        key={idx}
                        className={`group flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 ${isSelected
                            ? "border-brand-cerulean bg-brand-aliceBlue/45 shadow-sm"
                            : "border-gray-100 bg-gray-50/50 hover:border-gray-200 hover:bg-white"
                          }`}
                      >
                        <input
                          type={isMulti ? "checkbox" : "radio"}
                          name={`q-${currentQ._id}`}
                          className="hidden"
                          checked={Boolean(isSelected)}
                          onChange={() =>
                            handleOptionSelect(
                              currentQ._id!,
                              idx,
                              currentQ.questionType
                            )
                          }
                        />

                        {/* Letter / Check Badge */}
                        <div
                          className={`w-9 h-9 flex items-center justify-center font-extrabold text-sm shrink-0 transition-colors ${isMulti ? "rounded-xl" : "rounded-full"
                            } ${isSelected
                              ? "bg-brand-cerulean text-white shadow-sm"
                              : "bg-white border border-gray-200 text-gray-500 group-hover:border-brand-cerulean/40 group-hover:text-brand-cerulean"
                            }`}
                        >
                          {isSelected ? (
                            <Check size={17} strokeWidth={3} />
                          ) : (
                            OPTION_LETTERS[idx] || idx + 1
                          )}
                        </div>

                        <span
                          className={`text-sm sm:text-base leading-snug ${isSelected
                              ? "font-bold text-brand-prussian"
                              : "font-medium text-gray-700"
                            }`}
                        >
                          {opt.optionText}
                        </span>
                      </label>
                    );
                  })
                )}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Pagination Footer */}
          <div className="flex items-center justify-between border-t border-gray-100 pt-5 mt-auto gap-3">
            <button
              onClick={() => setCurrentQIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentQIndex === 0 || !quiz.settings.allowBacktrack}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-35 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={18} />
              <span>Previous</span>
            </button>

            {currentQIndex < totalQuestions - 1 ? (
              <button
                onClick={() =>
                  setCurrentQIndex((prev) =>
                    Math.min(totalQuestions - 1, prev + 1)
                  )
                }
                className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl text-sm font-bold bg-brand-prussian text-white hover:bg-brand-cerulean transition-all shadow-sm active:scale-95"
              >
                <span>Next Question</span>
                <ChevronRight size={18} />
              </button>
            ) : (
              <button
                onClick={() => setShowSubmitModal(true)}
                disabled={submitting}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold bg-emerald-500 text-white hover:bg-emerald-600 transition-all shadow-md shadow-emerald-500/20 active:scale-95 disabled:opacity-50"
              >
                <CheckCircle2 size={18} />
                <span>Submit Exam</span>
              </button>
            )}
          </div>
        </div>

        {/* RIGHT: QUESTION NAVIGATOR */}
        <aside className="w-full lg:w-76 xl:w-80 bg-white rounded-3xl shadow-sm border border-gray-100 p-5 sm:p-6 flex flex-col h-fit lg:sticky lg:top-24">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-extrabold text-brand-prussian text-sm flex items-center gap-2">
              <LayoutGrid size={16} className="text-brand-cerulean" />
              <span>Question Palette</span>
            </h3>
            <span className="text-xs font-bold text-brand-cerulean bg-brand-aliceBlue px-2.5 py-0.5 rounded-full">
              {answeredCount}/{totalQuestions}
            </span>
          </div>

          <div className="grid grid-cols-5 sm:grid-cols-8 lg:grid-cols-5 gap-2">
            {quiz.questions.map((q, idx) => {
              const ans = answers.find((a) => a.questionId === q._id);
              const isAnswered = Boolean(
                ans &&
                ((ans.selectedOptions && ans.selectedOptions.length > 0) ||
                  (ans.shortAnswer && ans.shortAnswer.trim() !== ""))
              );
              const isCurrent = currentQIndex === idx;

              return (
                <button
                  key={q._id || idx}
                  onClick={() => setCurrentQIndex(idx)}
                  disabled={!quiz.settings.allowBacktrack && idx < currentQIndex}
                  className={`h-10 rounded-xl text-xs font-extrabold transition-all disabled:opacity-30 disabled:cursor-not-allowed ${isCurrent
                      ? "bg-brand-prussian text-white ring-2 ring-brand-cerulean ring-offset-2 shadow-sm"
                      : isAnswered
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                        : "bg-gray-50 text-gray-500 border border-gray-200/80 hover:bg-gray-100"
                    }`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-6 pt-5 border-t border-gray-100 grid grid-cols-2 gap-3 text-xs font-semibold text-gray-500">
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-md bg-emerald-100 border border-emerald-300 shrink-0" />
              <span>Answered ({answeredCount})</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-md bg-gray-100 border border-gray-300 shrink-0" />
              <span>Left ({unansweredCount})</span>
            </div>
          </div>
        </aside>
      </div>

      {/* --- SUBMIT CONFIRMATION MODAL --- */}
      <AnimatePresence>
        {showSubmitModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
            onClick={() => !submitting && setShowSubmitModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-gray-100 text-center space-y-5"
            >
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto ${unansweredCount > 0
                    ? "bg-amber-50 text-amber-500"
                    : "bg-emerald-50 text-emerald-500"
                  }`}
              >
                {unansweredCount > 0 ? (
                  <AlertTriangle size={28} />
                ) : (
                  <CheckCircle2 size={28} />
                )}
              </div>

              <div>
                <h3 className="text-xl font-extrabold text-brand-prussian">
                  Submit Your Exam?
                </h3>
                <p className="text-sm text-gray-500 mt-1.5 leading-relaxed">
                  {unansweredCount > 0
                    ? `You still have ${unansweredCount} unanswered ${unansweredCount === 1 ? "question" : "questions"
                    }. You cannot change your answers after submitting.`
                    : "You have answered all questions! Once submitted, your attempt will be graded immediately."}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-gray-50 p-3.5 rounded-2xl border border-gray-100 text-xs">
                <div>
                  <p className="text-gray-400 font-bold uppercase">Answered</p>
                  <p className="text-lg font-black text-emerald-600 mt-0.5">
                    {answeredCount}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 font-bold uppercase">Remaining</p>
                  <p className="text-lg font-black text-amber-600 mt-0.5">
                    {unansweredCount}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => setShowSubmitModal(false)}
                  className="py-3 rounded-xl text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  Review Answers
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => executeSubmit(false)}
                  className="py-3 rounded-xl text-sm font-bold text-white bg-brand-prussian hover:bg-brand-cerulean transition-colors shadow-md flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {submitting ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Send size={15} />
                  )}
                  <span>Confirm Submit</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TakeQuiz;