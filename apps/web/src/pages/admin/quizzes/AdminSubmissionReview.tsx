import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  ArrowLeft, CheckCircle2, XCircle, 
  HelpCircle, User
} from "lucide-react";
import QuizService from "../../../services/QuizService"; 
import { toast } from "react-hot-toast";

export default function AdminSubmissionReview() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [submission, setSubmission] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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
      } catch (error: any) {
        toast.error("Paper not found");
        navigate(-1);
      } finally {
        setLoading(false);
      }
    };
    fetchResult();
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] bg-gray-50">
        <div className="w-10 h-10 border-4 border-gray-200 border-t-brand-cerulean rounded-full animate-spin mb-4"></div>
        <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Loading Paper...</p>
      </div>
    );
  }

  if (!submission) return null;

  const quiz = submission.quiz; // Populated by backend
  const studentName = submission.student?.name || `${submission.student?.firstName || ''} ${submission.student?.lastName || ''}`.trim() || 'Unknown Student';
  const isPassed = submission.passed;
  
  // Safe parsing
  const safeTimeTaken = isNaN(submission.timeTaken) || submission.timeTaken == null ? 0 : submission.timeTaken;
  const minutes = Math.floor(safeTimeTaken / 60);
  const seconds = safeTimeTaken % 60;
  
  const safePercentage = isNaN(submission.percentageScore) ? 0 : submission.percentageScore;

  return (
    <div className="min-h-screen bg-gray-50/50 pb-24 font-sans">
      
      {/* Sticky Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 px-4 sm:px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-brand-prussian">{quiz?.title || "Assessment Review"}</h1>
            <p className="text-xs text-gray-500 font-medium tracking-wide uppercase mt-0.5">Admin Paper Review Mode</p>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-4 sm:p-6 mt-4 space-y-6">
        
        {/* --- STUDENT IDENTITY CARD --- */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-brand-aliceBlue flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
             <User size={24} />
          </div>
          <div className="flex-1">
             <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Student Under Review</p>
             <h2 className="text-xl font-bold text-brand-prussian">{studentName}</h2>
          </div>
          <div className="text-right">
             <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Status</p>
             <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider border ${isPassed ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                {isPassed ? 'Passed' : 'Failed'}
             </span>
          </div>
        </div>

        {/* --- TOP ANALYTICS DASHBOARD --- */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm text-center flex flex-col items-center justify-center">
               <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-2">Final Score</p>
               <p className={`text-3xl font-black ${isPassed ? 'text-green-600' : 'text-red-500'}`}>{Math.round(safePercentage)}%</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm text-center flex flex-col items-center justify-center">
               <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-2">Points Earned</p>
               <p className="text-2xl font-black text-brand-prussian">{submission.totalPointsEarned} <span className="text-sm text-gray-400">/ {quiz?.totalPoints || 0}</span></p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm text-center flex flex-col items-center justify-center">
               <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-2">Time Taken</p>
               <p className="text-2xl font-black text-brand-prussian">{minutes}m {seconds}s</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm text-center flex flex-col items-center justify-center">
               <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-2">Submission</p>
               <p className="text-sm font-bold text-brand-prussian capitalize">{submission.status.replace("-", " ")}</p>
            </div>
        </div>

        {/* --- DETAILED REVIEW --- */}
        <div className="space-y-6 pt-4">
          <h3 className="text-xl font-bold text-brand-prussian px-2">Question Breakdown</h3>
          
          {quiz?.questions?.map((q: any, index: number) => {
            // Find the student's answer for this question
            const studentAns = submission.answers?.find((a: any) => a.questionId === q._id);
            const isCorrect = studentAns ? studentAns.isCorrect : false;
            const pointsEarned = studentAns ? studentAns.pointsEarned : 0;
            const hasImage = !!q.questionImage;

            return (
              <motion.div 
                key={q._id || index}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className={`bg-white rounded-[2rem] shadow-sm overflow-hidden border-2 transition-colors ${
                  isCorrect ? 'border-green-100' : 'border-red-100'
                }`}
              >
                {/* Q Header */}
                <div className={`px-6 py-4 flex justify-between items-center border-b ${isCorrect ? 'bg-green-50/50 border-green-50' : 'bg-red-50/50 border-red-50'}`}>
                  <div className="flex items-center gap-3">
                    <span className={`flex items-center justify-center w-8 h-8 rounded-xl text-sm font-black text-white shadow-sm ${isCorrect ? 'bg-green-500' : 'bg-red-500'}`}>
                      Q{index + 1}
                    </span>
                    <span className={`text-xs font-bold uppercase tracking-widest ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                      {isCorrect ? 'Marked Correct' : 'Marked Incorrect'}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm">
                    {pointsEarned} / {q.points} PTS
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

                  {/* Options Mapping */}
                  <div className="space-y-3">
                    {q.options && q.options.length > 0 ? (
                      q.options.map((opt: any, optIdx: number) => {
                        const studentSelected = studentAns?.selectedOptions?.includes(optIdx);
                        const isActuallyCorrect = opt.isCorrect;

                        // Styling logic
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
                              <span className="ml-auto text-[10px] font-bold uppercase tracking-wider text-gray-500 bg-white px-2.5 py-1 rounded-md shadow-sm border border-gray-200 shrink-0">Student Selection</span>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      // Short Answer Handling
                      <div className="space-y-4">
                        <div className="p-4 rounded-xl border-2 border-red-200 bg-red-50">
                          <p className="text-xs font-bold text-red-400 uppercase tracking-widest mb-1">Student's Typed Answer</p>
                          <p className="font-medium text-red-900">{studentAns?.shortAnswer || "No answer provided"}</p>
                        </div>
                        {!isCorrect && (
                          <div className="p-4 rounded-xl border-2 border-green-400 bg-green-50">
                            <p className="text-xs font-bold text-green-600 uppercase tracking-widest mb-1 flex items-center gap-1"><CheckCircle2 size={12}/> Target Correct Answer</p>
                            <p className="font-medium text-green-900">{q.options[0]?.optionText}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Teacher's Explanation Reference */}
                  {q.explanation && (
                    <div className="mt-6 p-5 sm:p-6 bg-brand-aliceBlue/40 border border-brand-aliceBlue rounded-2xl">
                      <h4 className="text-[11px] font-bold text-brand-cerulean uppercase tracking-widest mb-3 flex items-center gap-1.5">
                        <HelpCircle size={14} /> Teacher's Explanation Attached to this Question
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

      </div>
    </div>
  );
}