import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  ChevronRight, 
  ChevronLeft,
  FileText,
  ShieldAlert,
  Loader2
} from "lucide-react";
import { toast } from "react-hot-toast";
import QuizService, { type Quiz, type StudentAnswer } from "../../../services/QuizService";

const TakeQuiz: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Data State
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submissionId, setSubmissionId] = useState<string | null>(null);

  // Exam State
  const [isStarted, setIsStarted] = useState(false);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [answers, setAnswers] = useState<StudentAnswer[]>([]);
  const [timeLeft, setTimeLeft] = useState<number>(0);

  // 1. Fetch Quiz Details (Pre-Exam)
  useEffect(() => {
    const fetchQuiz = async () => {
      // FIX: Handle missing ID properly so it doesn't spin forever
      if (!id) {
        toast.error("Quiz ID is missing from the URL!");
        setLoading(false);
        navigate(-1);
        return; 
      }

      try {
        const response = await QuizService.getQuizById(id);
        if (response.success && response.data) {
          setQuiz(response.data);
          // Initialize empty answers array
          const initialAnswers = response.data.questions.map((q: any) => ({
            questionId: q._id!,
            selectedOptions: [],
            shortAnswer: ""
          }));
          setAnswers(initialAnswers);
        }
      } catch (error: any) {
        toast.error(error.response?.data?.message || "Failed to load exam details");
        navigate(-1);
      } finally {
        setLoading(false); // This will now always run!
      }
    };
    fetchQuiz();
  }, [id, navigate]);

  // 2. Timer Logic & Anti-Cheat Prevent Close
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    
    if (isStarted && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);

      // Prevent accidental tab closing during exam
      const handleBeforeUnload = (e: BeforeUnloadEvent) => {
        e.preventDefault();
        e.returnValue = '';
      };
      window.addEventListener('beforeunload', handleBeforeUnload);

      return () => {
        clearInterval(timer);
        window.removeEventListener('beforeunload', handleBeforeUnload);
      };
    } else if (isStarted && timeLeft === 0) {
      // Auto-submit when time is up
      handleFinalSubmit(true);
    }
    
    return () => clearInterval(timer);
  }, [isStarted, timeLeft]);

  // 3. Start Exam Handler
  const handleStartExam = async () => {
    if (!quiz) return;
    try {
      setLoading(true);
      const response = await QuizService.startQuiz(quiz._id);
      if (response.success) {
        setSubmissionId(response.submissionId);
        setTimeLeft(quiz.duration * 60); // Convert minutes to seconds
        setIsStarted(true);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Could not start exam. You may have already attempted it.");
    } finally {
      setLoading(false);
    }
  };

  // 4. Answer Input Handlers
  const handleOptionSelect = (qId: string, optIndex: number, type: string) => {
    setAnswers(prev => prev.map(ans => {
      if (ans.questionId === qId) {
        if (type === "mcq" || type === "true-false") {
          return { ...ans, selectedOptions: [optIndex] };
        } else if (type === "multi-select") {
          const exists = ans.selectedOptions?.includes(optIndex);
          const newOpts = exists 
            ? ans.selectedOptions?.filter(i => i !== optIndex) 
            : [...(ans.selectedOptions || []), optIndex];
          return { ...ans, selectedOptions: newOpts };
        }
      }
      return ans;
    }));
  };

  const handleShortAnswer = (qId: string, text: string) => {
    setAnswers(prev => prev.map(ans => 
      ans.questionId === qId ? { ...ans, shortAnswer: text } : ans
    ));
  };

  // 5. Submit Exam Handler
  const handleFinalSubmit = useCallback(async (isTimeOut = false) => {
    if (!submissionId) return;
    
    if (!isTimeOut) {
      const confirmSubmit = window.confirm("Are you sure you want to submit your exam? You cannot change your answers after this.");
      if (!confirmSubmit) return;
    }

    try {
      setSubmitting(true);
      const response = await QuizService.submitQuiz(submissionId, answers, isTimeOut);
      if (response.success) {
        toast.success(isTimeOut ? "Time's up! Exam submitted automatically." : "Exam submitted successfully!");
        // Navigate to the Detailed Review/Result page
        navigate(`/student/quizzes/result/${submissionId}`, { replace: true });
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to submit exam.");
      setSubmitting(false);
    }
  }, [submissionId, answers, navigate]);

  // Utility: Format Time
  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
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

  // ==========================================
  // VIEW 1: PRE-EXAM LANDING PAGE
  // ==========================================
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

  // ==========================================
  // VIEW 2: ACTIVE EXAM INTERFACE
  // ==========================================
  const currentQ = quiz.questions[currentQIndex];
  const currentAns = answers.find(a => a.questionId === currentQ._id);
  const isTimeRunningOut = timeLeft < 300; // Less than 5 mins

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      
      {/* Sticky Header with Timer */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 px-6 py-4 flex items-center justify-between shadow-sm">
        <h1 className="text-xl font-bold text-brand-prussian hidden md:block">{quiz.title}</h1>
        
        <div className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-xl font-bold tracking-wider ${
          isTimeRunningOut ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-gray-100 text-gray-800'
        }`}>
          <Clock size={20} className={isTimeRunningOut ? 'text-red-500' : 'text-gray-500'} />
          {formatTime(timeLeft)}
        </div>
        
        <button 
          onClick={() => handleFinalSubmit(false)}
          disabled={submitting}
          className="bg-brand-prussian text-white px-6 py-2 rounded-lg font-bold hover:bg-brand-cerulean transition disabled:opacity-50"
        >
          {submitting ? 'Submitting...' : 'Finish Exam'}
        </button>
      </header>

      <div className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 flex flex-col lg:flex-row gap-6">
        
        {/* Left Area: Question Display */}
        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8 flex flex-col">
          
          <div className="flex justify-between items-center mb-6">
            <span className="text-sm font-bold text-gray-400 uppercase tracking-widest">
              Question {currentQIndex + 1} of {quiz.questions.length}
            </span>
            <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-md text-sm font-bold">
              {currentQ.points} Points
            </span>
          </div>

          {/* Question Text & Image */}
          <h2 className="text-xl md:text-2xl font-medium text-gray-800 mb-6 leading-relaxed">
            {currentQ.questionText}
          </h2>
          {currentQ.questionImage && (
            <div className="mb-6 rounded-xl border border-gray-200 overflow-hidden bg-gray-50 p-2">
              <img src={currentQ.questionImage} alt="Reference material" className="max-w-full h-auto mx-auto object-contain max-h-96" />
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
              currentQ.options.map((opt, idx) => {
                const isSelected = currentAns?.selectedOptions?.includes(idx);
                return (
                  <label 
                    key={idx} 
                    className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      isSelected ? 'border-brand-cerulean bg-blue-50/50' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className={`w-6 h-6 flex items-center justify-center rounded-full border-2 flex-shrink-0 ${
                      isSelected ? 'border-brand-cerulean bg-brand-cerulean text-white' : 'border-gray-300'
                    }`}>
                      {isSelected && <CheckCircle2 size={16} />}
                    </div>
                    <input 
                      type={currentQ.questionType === "multi-select" ? "checkbox" : "radio"}
                      name={`q-${currentQ._id}`}
                      className="hidden"
                      checked={isSelected}
                      onChange={() => handleOptionSelect(currentQ._id!, idx, currentQ.questionType)}
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
              onClick={() => setCurrentQIndex(prev => Math.max(0, prev - 1))}
              disabled={currentQIndex === 0}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition disabled:opacity-30"
            >
              <ChevronLeft size={20} /> Previous
            </button>
            
            {currentQIndex < quiz.questions.length - 1 ? (
              <button 
                onClick={() => setCurrentQIndex(prev => Math.min(quiz.questions.length - 1, prev + 1))}
                className="flex items-center gap-2 px-6 py-2 bg-gray-100 text-gray-800 font-bold hover:bg-gray-200 rounded-lg transition"
              >
                Next <ChevronRight size={20} />
              </button>
            ) : (
              <button 
                onClick={() => handleFinalSubmit(false)}
                className="flex items-center gap-2 px-6 py-2 bg-green-500 text-white font-bold hover:bg-green-600 rounded-lg transition shadow-md"
              >
                <CheckCircle2 size={20} /> Submit Exam
              </button>
            )}
          </div>
        </div>

        {/* Right Area: Question Navigator */}
        <div className="w-full lg:w-72 bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col h-fit">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <AlertCircle size={18} className="text-gray-400"/> 
            Question Palette
          </h3>
          
          <div className="grid grid-cols-5 gap-2">
            {quiz.questions.map((q, idx) => {
              const ans = answers.find(a => a.questionId === q._id);
              const isAnswered = ans && (
                (ans.selectedOptions && ans.selectedOptions.length > 0) || 
                (ans.shortAnswer && ans.shortAnswer.trim() !== "")
              );
              const isCurrent = currentQIndex === idx;

              return (
                <button
                  key={idx}
                  onClick={() => setCurrentQIndex(idx)}
                  className={`w-10 h-10 flex items-center justify-center rounded-lg text-sm font-bold transition-all ${
                    isCurrent 
                      ? 'ring-2 ring-brand-cerulean ring-offset-2 bg-brand-cerulean text-white' 
                      : isAnswered 
                        ? 'bg-green-100 text-green-700 border border-green-200' 
                        : 'bg-gray-50 text-gray-500 border border-gray-200 hover:bg-gray-100'
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