import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  Clock, AlertCircle, CheckCircle2, ChevronRight, 
  ChevronLeft, FileText, ShieldAlert, Loader2
} from "lucide-react";
import { toast } from "react-hot-toast";
import QuizService, { type Quiz, type QuizQuestion, type StudentAnswer } from "../../../services/QuizService";

// --- Fisher-Yates Shuffle (Generic) ---
function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// --- Shuffle Questions & Options based on settings ---
function applyShuffleToQuiz(
  quiz: Quiz,
  shuffleQ: boolean,
  shuffleOpts: boolean
): { shuffledQuestions: QuizQuestion[]; optionIndexMap: Record<string, number[]> } {
  // optionIndexMap: { [questionId]: [originalIndexAtPosition0, originalIndexAtPosition1, ...] }
  const optionIndexMap: Record<string, number[]> = {};

  let questions = quiz.questions.map((q) => {
    if (shuffleOpts && q.options && q.options.length > 0 && q.questionType !== "short-answer") {
      const originalIndices = q.options.map((_, i) => i);
      const shuffledIndices = shuffleArray(originalIndices);
      optionIndexMap[q._id!] = shuffledIndices; // position i => original index shuffledIndices[i]
      return {
        ...q,
        options: shuffledIndices.map((origIdx) => q.options[origIdx]),
      };
    } else {
      optionIndexMap[q._id!] = q.options.map((_, i) => i);
    }
    return q;
  });

  if (shuffleQ) {
    questions = shuffleArray(questions);
  }

  return { shuffledQuestions: questions, optionIndexMap };
}

const TakeQuiz: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Data State
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  // Shuffled questions (display order)
  const [displayQuestions, setDisplayQuestions] = useState<QuizQuestion[]>([]);
  // optionIndexMap: { [questionId]: [origIdx at pos 0, origIdx at pos 1, ...] }
  const [optionIndexMap, setOptionIndexMap] = useState<Record<string, number[]>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submissionId, setSubmissionId] = useState<string | null>(null);

  // Exam State
  const [isStarted, setIsStarted] = useState(false);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [answers, setAnswers] = useState<StudentAnswer[]>([]);
  const [timeLeft, setTimeLeft] = useState<number>(0);

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
          const fetchedQuiz = response.data;
          setQuiz(fetchedQuiz);

          // Auto-Recovery Check
          const savedSessionStr = localStorage.getItem(`quiz_session_${id}`);
          if (savedSessionStr) {
            const savedSession = JSON.parse(savedSessionStr);
            const now = new Date().getTime();
            if (now < savedSession.endTime) {
              setSubmissionId(savedSession.submissionId);
              setAnswers(savedSession.answers);
              setTimeLeft(Math.floor((savedSession.endTime - now) / 1000));

              // Shuffled order recover
              if (savedSession.displayQuestionIds && savedSession.optionIndexMap) {
                const qMap = new Map(fetchedQuiz.questions.map((q) => [q._id!, q]));
                const recovered = savedSession.displayQuestionIds
                  .map((qid: string) => {
                    const origQ = qMap.get(qid);
                    if (!origQ) return null;
                    const idxMap: number[] = savedSession.optionIndexMap[qid] || origQ.options.map((_: any, i: number) => i);
                    return { ...origQ, options: idxMap.map((origIdx: number) => origQ.options[origIdx]) };
                  })
                  .filter(Boolean) as QuizQuestion[];
                setDisplayQuestions(recovered);
                setOptionIndexMap(savedSession.optionIndexMap);
              } else {
                setDisplayQuestions(fetchedQuiz.questions);
                setOptionIndexMap(
                  Object.fromEntries(fetchedQuiz.questions.map((q) => [q._id!, q.options.map((_, i) => i)]))
                );
              }

              setIsStarted(true);
              toast.success("Exam session recovered.");
              setLoading(false);
              return;
            } else {
              localStorage.removeItem(`quiz_session_${id}`);
            }
          }

          // Initialize empty answers array
          const initialAnswers = fetchedQuiz.questions.map((q: any) => ({
            questionId: q._id!,
            selectedOptions: [],
            shortAnswer: "",
          }));
          setAnswers(initialAnswers);
          setDisplayQuestions(fetchedQuiz.questions);
        }
      } catch (error: any) {
        toast.error(error.response?.data?.message || "Failed to load exam details");
        navigate(-1);
      } finally {
        setLoading(false);
      }
    };
    fetchQuiz();
  }, [id, navigate]);

  // 2. Submit Exam Handler
  const handleFinalSubmit = useCallback(
    async (isTimeOut = false) => {
      if (!submissionId) return;
      if (isSubmittingRef.current) return;

      if (!isTimeOut) {
        const confirmSubmit = window.confirm(
          "Are you sure you want to submit your exam? You cannot change your answers after this."
        );
        if (!confirmSubmit) return;
      }

      try {
        isSubmittingRef.current = true;
        setSubmitting(true);

        // Shuffled option indices => original indices convert 
        const mappedAnswers: StudentAnswer[] = answersRef.current.map((ans) => {
          const idxMap = optionIndexMap[ans.questionId];
          if (!idxMap || ans.selectedOptions === undefined || ans.selectedOptions.length === 0) {
            return ans;
          }
          // selectedOptions[i] is the displayed position -> idxMap[displayedPos] is original index
          const originalSelectedOptions = ans.selectedOptions.map((displayedPos) => idxMap[displayedPos]);
          return { ...ans, selectedOptions: originalSelectedOptions };
        });

        const response = await QuizService.submitQuiz(submissionId, mappedAnswers, isTimeOut);

        if (response.success) {
          if (quiz) localStorage.removeItem(`quiz_session_${quiz._id}`);
          toast.success(isTimeOut ? "Time's up! Exam submitted automatically." : "Exam submitted successfully!");
          navigate(`/student/quizzes/result/${submissionId}`, { replace: true });
        }
      } catch (error: any) {
        toast.error(error.response?.data?.message || "Failed to submit exam.");
        isSubmittingRef.current = false;
        setSubmitting(false);
      }
    },
    [submissionId, navigate, quiz, optionIndexMap]
  );

  // 3. Timer Logic & Anti-Cheat
  useEffect(() => {
    if (!isStarted) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "You have an active exam. Are you sure you want to leave?";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          if (!isSubmittingRef.current) {
            handleFinalSubmit(true);
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
  }, [isStarted, handleFinalSubmit]);

  // 4. Start Exam Handler — Shuffle here so each student gets unique order
  const handleStartExam = async () => {
    if (!quiz) return;
    try {
      setLoading(true);
      const response = await QuizService.startQuiz(quiz._id);
      if (response.success) {
        const durationSeconds = quiz.duration * 60;
        const endTime = new Date().getTime() + durationSeconds * 1000;

        const { shuffledQuestions, optionIndexMap: newOptMap } = applyShuffleToQuiz(
          quiz,
          quiz.settings.shuffleQuestions,
          quiz.settings.shuffleOptions
        );

        setDisplayQuestions(shuffledQuestions);
        setOptionIndexMap(newOptMap);
        setSubmissionId(response.submissionId);
        setTimeLeft(durationSeconds);
        setIsStarted(true);

        localStorage.setItem(
          `quiz_session_${quiz._id}`,
          JSON.stringify({
            submissionId: response.submissionId,
            endTime: endTime,
            answers: answers,
            displayQuestionIds: shuffledQuestions.map((q) => q._id),
            optionIndexMap: newOptMap,
          })
        );
      }
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Could not start exam. You may have already attempted it."
      );
    } finally {
      setLoading(false);
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

  const handleOptionSelect = (qId: string, displayedOptIdx: number, type: string) => {
    setAnswers((prev) => {
      const newAns = prev.map((ans) => {
        if (ans.questionId === qId) {
          if (type === "mcq" || type === "true-false") {
            return { ...ans, selectedOptions: [displayedOptIdx] };
          } else if (type === "multi-select") {
            const exists = ans.selectedOptions?.includes(displayedOptIdx);
            const newOpts = exists
              ? ans.selectedOptions?.filter((i) => i !== displayedOptIdx)
              : [...(ans.selectedOptions || []), displayedOptIdx];
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
    if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  if (loading && !isStarted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-brand-aliceBlue/30">
        <Loader2 className="animate-spin text-brand-cerulean mb-4" size={48} />
        <p className="text-gray-500 font-bold uppercase tracking-widest">Preparing Exam...</p>
      </div>
    );
  }

  if (!quiz) return <div className="p-6 text-center">Quiz not found.</div>;

  // VIEW 1: PRE-EXAM LANDING PAGE
  if (!isStarted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white max-w-2xl w-full rounded-3xl shadow-xl overflow-hidden">
          <div className="bg-brand-prussian p-8 text-center text-white">
            <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
              <FileText size={40} className="text-blue-200" />
            </div>
            <h1 className="text-3xl font-black mb-2">{quiz.title}</h1>
            <p className="text-blue-100">{quiz.description}</p>
          </div>

          <div className="p-8">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
              <div className="bg-gray-50 p-4 rounded-2xl text-center border border-gray-100">
                <p className="text-xs text-gray-500 uppercase font-bold mb-1">Questions</p>
                <p className="text-xl font-black text-gray-800">{quiz.questions.length}</p>
              </div>
              <div className="bg-blue-50 p-4 rounded-2xl text-center border border-blue-100">
                <p className="text-xs text-blue-500 uppercase font-bold mb-1">Duration</p>
                <p className="text-xl font-black text-blue-800">{quiz.duration}m</p>
              </div>
              <div className="bg-green-50 p-4 rounded-2xl text-center border border-green-100">
                <p className="text-xs text-green-500 uppercase font-bold mb-1">Pass Mark</p>
                <p className="text-xl font-black text-green-800">{quiz.passingPercentage}%</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-2xl text-center border border-purple-100">
                <p className="text-xs text-purple-500 uppercase font-bold mb-1">Attempts</p>
                <p className="text-xl font-black text-purple-800">{quiz.settings.maxAttempts}</p>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-4 mb-8">
              <ShieldAlert className="text-amber-500 flex-shrink-0 mt-1" size={24} />
              <div>
                <h3 className="font-bold text-amber-800 mb-1">Important Instructions</h3>
                <ul className="text-sm text-amber-700 space-y-1 list-disc ml-4">
                  <li>Do not refresh the page once the exam begins.</li>
                  <li>Ensure you have a stable internet connection.</li>
                  <li>The exam will automatically submit when the timer reaches zero.</li>
                  <li>Keep your calculator and rough paper ready for accounting calculations.</li>
                </ul>
              </div>
            </div>

            <button
              onClick={handleStartExam}
              className="w-full bg-brand-cerulean hover:bg-blue-600 text-white font-bold text-lg py-4 rounded-xl transition-all shadow-lg hover:shadow-xl active:scale-95"
            >
              Start Attempt Now
            </button>
          </div>
        </div>
      </div>
    );
  }

  // VIEW 2: ACTIVE EXAM INTERFACE
  const currentQ = displayQuestions[currentQIndex];
  if (!currentQ) return null;
  const currentAns = answers.find((a) => a.questionId === currentQ._id);
  const isTimeRunningOut = timeLeft < 300;

  return (
    <div
      className="min-h-screen bg-gray-50 flex flex-col select-none"
      onContextMenu={(e) => e.preventDefault()}
      onCopy={(e) => e.preventDefault()}
    >
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 px-6 py-4 flex items-center justify-between shadow-sm">
        <h1 className="text-xl font-bold text-brand-prussian hidden md:block">{quiz.title}</h1>

        <div
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-xl font-bold tracking-wider ${
            isTimeRunningOut ? "bg-red-100 text-red-600 animate-pulse" : "bg-gray-100 text-gray-800"
          }`}
        >
          <Clock size={20} className={isTimeRunningOut ? "text-red-500" : "text-gray-500"} />
          {formatTime(timeLeft)}
        </div>

        <button
          onClick={() => handleFinalSubmit(false)}
          disabled={submitting}
          className="bg-brand-prussian text-white px-6 py-2 rounded-lg font-bold hover:bg-brand-cerulean transition disabled:opacity-50"
        >
          {submitting ? "Submitting..." : "Finish Exam"}
        </button>
      </header>

      <div className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 flex flex-col lg:flex-row gap-6">
        {/* Left Area: Question Display */}
        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <span className="text-sm font-bold text-gray-400 uppercase tracking-widest">
              Question {currentQIndex + 1} of {displayQuestions.length}
            </span>
            <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-md text-sm font-bold">
              {currentQ.points} Points
            </span>
          </div>

          <div
            className="tiptap text-xl md:text-2xl font-medium text-gray-800 mb-6 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: currentQ.questionText }}
          />
          {currentQ.questionImage && (
            <div className="mb-6 rounded-xl border border-gray-200 overflow-hidden bg-gray-50 p-2">
              <img
                src={currentQ.questionImage}
                alt="Reference material"
                className="max-w-full h-auto mx-auto object-contain max-h-96"
              />
            </div>
          )}

          {/* Answer Options */}
          <div className="space-y-3 mt-auto mb-8">
            {currentQ.questionType === "short-answer" ? (
              <textarea
                value={currentAns?.shortAnswer || ""}
                onChange={(e) => handleShortAnswer(currentQ._id!, e.target.value)}
                placeholder="Type your answer here..."
                className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-cerulean outline-none resize-y min-h-[120px]"
              />
            ) : (
              // Displayed options iterate 
              currentQ.options.map((opt, displayedIdx) => {
                const isSelected = currentAns?.selectedOptions?.includes(displayedIdx);
                return (
                  <label
                    key={displayedIdx}
                    className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      isSelected
                        ? "border-brand-cerulean bg-blue-50/50"
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <div
                      className={`w-6 h-6 flex items-center justify-center rounded-full border-2 flex-shrink-0 ${
                        isSelected ? "border-brand-cerulean bg-brand-cerulean text-white" : "border-gray-300"
                      }`}
                    >
                      {isSelected && <CheckCircle2 size={16} />}
                    </div>
                    <input
                      type={currentQ.questionType === "multi-select" ? "checkbox" : "radio"}
                      name={`q-${currentQ._id}`}
                      className="hidden"
                      checked={!!isSelected}
                      onChange={() => handleOptionSelect(currentQ._id!, displayedIdx, currentQ.questionType)}
                    />
                    <span className="text-gray-700 text-lg">{opt.optionText}</span>
                  </label>
                );
              })
            )}
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center justify-between border-t border-gray-100 pt-6 mt-auto">
            <button
              onClick={() => setCurrentQIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentQIndex === 0 || !quiz.settings.allowBacktrack}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition disabled:opacity-30"
            >
              <ChevronLeft size={20} /> Previous
            </button>

            {currentQIndex < displayQuestions.length - 1 ? (
              <button
                onClick={() => setCurrentQIndex((prev) => Math.min(displayQuestions.length - 1, prev + 1))}
                className="flex items-center gap-2 px-6 py-2 bg-gray-100 text-gray-800 font-bold hover:bg-gray-200 rounded-lg transition"
              >
                Next <ChevronRight size={20} />
              </button>
            ) : (
              <button
                onClick={() => handleFinalSubmit(false)}
                disabled={submitting}
                className="flex items-center gap-2 px-6 py-2 bg-green-500 text-white font-bold hover:bg-green-600 rounded-lg transition shadow-md disabled:opacity-50"
              >
                <CheckCircle2 size={20} /> Submit Exam
              </button>
            )}
          </div>
        </div>

        {/* Right Area: Question Navigator */}
        <div className="w-full lg:w-72 bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col h-fit">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <AlertCircle size={18} className="text-gray-400" />
            Question Palette
          </h3>

          <div className="grid grid-cols-5 gap-2">
            {displayQuestions.map((q, idx) => {
              const ans = answers.find((a) => a.questionId === q._id);
              const isAnswered =
                ans &&
                ((ans.selectedOptions && ans.selectedOptions.length > 0) ||
                  (ans.shortAnswer && ans.shortAnswer.trim() !== ""));
              const isCurrent = currentQIndex === idx;

              return (
                <button
                  key={idx}
                  onClick={() => setCurrentQIndex(idx)}
                  disabled={!quiz.settings.allowBacktrack && idx < currentQIndex}
                  className={`w-10 h-10 flex items-center justify-center rounded-lg text-sm font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed ${
                    isCurrent
                      ? "ring-2 ring-brand-cerulean ring-offset-2 bg-brand-cerulean text-white"
                      : isAnswered
                      ? "bg-green-100 text-green-700 border border-green-200"
                      : "bg-gray-50 text-gray-500 border border-gray-200 hover:bg-gray-100"
                  }`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          <div className="mt-8 space-y-2 text-sm">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded bg-green-100 border border-green-200"></div>
              <span className="text-gray-600">Answered</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded bg-gray-50 border border-gray-200"></div>
              <span className="text-gray-600">Not Answered</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TakeQuiz;