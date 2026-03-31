import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  ArrowLeft, CheckCircle2, XCircle, Clock, 
  HelpCircle, AlertTriangle, Calendar, 
  BookOpen, Target
} from "lucide-react";
import QuizService from "../../../services/QuizService"; 
import { toast } from "react-hot-toast";

export default function QuizResult() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [resultData, setResultData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "correct" | "incorrect">("all");

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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <div className="w-10 h-10 border-4 border-gray-200 border-t-brand-cerulean rounded-full animate-spin mb-4"></div>
        <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Compiling Report...</p>
      </div>
    );
  }

  if (!resultData) return null;

  const { summary, review, quizTitle, message } = resultData;
  const isPassed = summary.passed;
  
  // --- SAFE PARSING FOR DATES AND TIMES ---
  const safeTimeTaken = isNaN(summary.timeTaken) || summary.timeTaken == null ? 0 : summary.timeTaken;
  const minutes = Math.floor(safeTimeTaken / 60);
  const seconds = safeTimeTaken % 60;

  const completedDate = summary.completedAt ? new Date(summary.completedAt) : new Date();
  const dateStr = completedDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  const timeStr = completedDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  // Analytics Math
  const correctCount = review ? review.filter((q: any) => q.isCorrect).length : 0;
  const totalCount = review ? review.length : 0;
  const incorrectCount = totalCount - correctCount;
  
  // SVG Ring Math
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const safePercentage = isNaN(summary.percentage) ? 0 : summary.percentage;
  const strokeDashoffset = circumference - (safePercentage / 100) * circumference;

  return (
    <div className="min-h-screen bg-gray-50/50 pb-24 font-sans">
      
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 px-4 sm:px-6 py-4 flex items-center shadow-sm">
        <button onClick={() => navigate(-1)} className="mr-4 p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-brand-prussian">{quizTitle || "Assessment Report"}</h1>
          <p className="text-xs text-gray-500 font-medium tracking-wide">Detailed Analysis & Corrections</p>
        </div>
      </header>

      <div className="max-w-5xl mx-auto p-4 sm:p-6 mt-4 space-y-6">
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="md:col-span-2 bg-white rounded-[2rem] p-6 sm:p-8 shadow-sm border border-gray-100 relative overflow-hidden flex flex-col sm:flex-row items-center gap-8">
              
              {/* Circular Progress */}
              <div className="relative w-32 h-32 shrink-0">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 80 80">
                  <circle cx="40" cy="40" r={radius} className="text-gray-100 stroke-current" strokeWidth="6" fill="transparent" />
                  <circle 
                    cx="40" cy="40" r={radius} 
                    className={`${isPassed ? 'text-green-500' : 'text-red-500'} stroke-current transition-all duration-1000 ease-out`} 
                    strokeWidth="6" fill="transparent" 
                    strokeDasharray={circumference} 
                    strokeDashoffset={strokeDashoffset} 
                    strokeLinecap="round" 
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-black text-brand-prussian">{Math.round(safePercentage)}%</span>
                </div>
              </div>

              <div className="flex-1 text-center sm:text-left">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest mb-3 ${isPassed ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                   {isPassed ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                   {isPassed ? 'Passed Successfully' : 'Failed Attempt'}
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-brand-prussian mb-2">Assessment Complete</h2>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-sm text-gray-500 mt-4">
                   <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                     <Target size={16} className="text-brand-cerulean"/> {summary.totalPointsEarned} / {summary.totalQuizPoints} Points
                   </div>
                   <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                     <Clock size={16} className="text-brand-cerulean"/> {minutes}m {seconds}s
                   </div>
                </div>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-brand-prussian rounded-[2rem] p-6 shadow-lg text-white flex flex-col justify-between relative overflow-hidden">
               <div className="absolute -right-4 -bottom-4 opacity-10"><BookOpen size={120} /></div>
               <div>
                 <p className="text-brand-aliceBlue/60 text-[10px] font-bold uppercase tracking-widest mb-1">Module Details</p>
                 <h3 className="font-bold text-lg leading-snug mb-4">{quizTitle}</h3>
               </div>
               <div className="space-y-3 relative z-10">
                  <div className="flex items-center gap-3 text-sm text-brand-aliceBlue/90">
                     <Calendar size={16} className="text-brand-cerulean shrink-0"/>
                     <span className="font-medium">{dateStr}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-brand-aliceBlue/90">
                     <Clock size={16} className="text-brand-cerulean shrink-0"/>
                     <span className="font-medium">{timeStr}</span>
                  </div>
               </div>
            </motion.div>
        </div>

        {message && !review && (
          <div className="bg-blue-50 border border-blue-200 rounded-[2rem] p-10 text-center flex flex-col items-center shadow-sm">
            <div className="w-16 h-16 bg-blue-100 text-blue-500 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle size={32} />
            </div>
            <h3 className="text-xl font-bold text-blue-900 mb-2">Detailed Review Hidden</h3>
            <p className="text-sm text-blue-700 max-w-md">{message}</p>
          </div>
        )}

        {review && (
          <div className="space-y-6 pt-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-2 rounded-2xl shadow-sm border border-gray-100">
               <div className="flex gap-1 overflow-x-auto w-full sm:w-auto p-1">
                  <button onClick={() => setFilter('all')} className={`px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${filter === 'all' ? 'bg-brand-prussian text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}>All ({totalCount})</button>
                  <button onClick={() => setFilter('correct')} className={`px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${filter === 'correct' ? 'bg-green-500 text-white shadow-md' : 'text-gray-500 hover:bg-green-50 hover:text-green-600'}`}>Correct ({correctCount})</button>
                  <button onClick={() => setFilter('incorrect')} className={`px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${filter === 'incorrect' ? 'bg-red-500 text-white shadow-md' : 'text-gray-500 hover:bg-red-50 hover:text-red-600'}`}>Incorrect ({incorrectCount})</button>
               </div>
            </div>
            
            {filteredReview.length === 0 ? (
               <div className="text-center py-12 text-gray-400 font-medium">No questions match this filter.</div>
            ) : (
                <div className="space-y-6">
                  {filteredReview.map((q: any, index: number) => {
                    const isCorrect = q.isCorrect;
                    const hasImage = !!q.questionImage;

                    return (
                      <motion.div 
                        key={q.questionId || index}
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className={`bg-white rounded-[2rem] shadow-sm overflow-hidden border-2 transition-colors ${
                          isCorrect ? 'border-green-100' : 'border-red-100'
                        }`}
                      >
                        <div className={`px-6 py-4 flex justify-between items-center border-b ${isCorrect ? 'bg-green-50/50 border-green-50' : 'bg-red-50/50 border-red-50'}`}>
                          <div className="flex items-center gap-3">
                            <span className={`flex items-center justify-center w-8 h-8 rounded-xl text-sm font-black text-white shadow-sm ${isCorrect ? 'bg-green-500' : 'bg-red-500'}`}>
                              Q{index + 1}
                            </span>
                            <span className={`text-xs font-bold uppercase tracking-widest ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                              {isCorrect ? 'Correct Answer' : 'Incorrect Answer'}
                            </span>
                          </div>
                          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm">
                            {q.pointsEarned} / {q.maxPoints} PTS
                          </span>
                        </div>

                        <div className="p-6 md:p-8">
                          <p className="text-lg md:text-xl font-medium text-gray-800 mb-6 leading-relaxed">
                            {q.questionText}
                          </p>
                          
                          {hasImage && (
                            <div className="mb-6 rounded-xl border border-gray-200 overflow-hidden bg-gray-50 p-2 max-w-lg">
                              <img src={q.questionImage} alt="Reference" className="w-full h-auto object-contain rounded-lg" />
                            </div>
                          )}

                          <div className="space-y-3">
                            {q.options && q.options.length > 0 ? (
                              q.options.map((opt: any, optIdx: number) => {
                                const studentSelected = q.studentSelection?.includes(optIdx);
                                const isActuallyCorrect = opt.isCorrect;

                                let style = "border-gray-200 bg-gray-50 text-gray-600";
                                let icon = null;

                                if (isActuallyCorrect) {
                                  style = "border-green-400 bg-green-50 text-green-900 ring-1 ring-green-400 shadow-sm";
                                  icon = <CheckCircle2 size={18} className="text-green-600 shrink-0" />;
                                } else if (studentSelected && !isActuallyCorrect) {
                                  style = "border-red-300 bg-red-50 text-red-900";
                                  icon = <XCircle size={18} className="text-red-500 shrink-0" />;
                                }

                                return (
                                  <div key={optIdx} className={`p-4 rounded-xl border-2 flex items-center gap-3 transition-all ${style}`}>
                                    {icon || <div className="w-[18px] h-[18px] shrink-0" />}
                                    <span className="font-medium text-sm sm:text-base">{opt.optionText}</span>
                                    {studentSelected && (
                                      <span className="ml-auto text-[10px] font-bold uppercase tracking-wider text-gray-500 bg-white px-2.5 py-1 rounded-md shadow-sm border border-gray-200 shrink-0">Your Answer</span>
                                    )}
                                  </div>
                                );
                              })
                            ) : (
                              <div className="space-y-4">
                                <div className="p-4 rounded-xl border-2 border-red-200 bg-red-50">
                                  <p className="text-xs font-bold text-red-400 uppercase tracking-widest mb-1">Your Answer</p>
                                  <p className="font-medium text-red-900">{q.studentShortAnswer || "No answer provided"}</p>
                                </div>
                                {!isCorrect && (
                                  <div className="p-4 rounded-xl border-2 border-green-400 bg-green-50">
                                    <p className="text-xs font-bold text-green-600 uppercase tracking-widest mb-1 flex items-center gap-1"><CheckCircle2 size={12}/> Correct Answer</p>
                                    <p className="font-medium text-green-900">{q.options[0]?.optionText}</p>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          {q.explanation && (
                            <div className="mt-6 p-5 sm:p-6 bg-brand-aliceBlue/40 border border-brand-aliceBlue rounded-2xl">
                              <h4 className="text-[11px] font-bold text-brand-cerulean uppercase tracking-widest mb-3 flex items-center gap-1.5">
                                <HelpCircle size={14} /> Teacher's Explanation / Working
                              </h4>
                              <p className="text-sm text-brand-prussian leading-relaxed whitespace-pre-wrap font-medium">
                                {q.explanation}
                              </p>
                            </div>
                          )}
                        </div>
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