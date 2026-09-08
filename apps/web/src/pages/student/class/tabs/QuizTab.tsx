import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ClipboardList, 
  Clock, 
  Calendar, 
  PlayCircle,
  FileText
} from "lucide-react";
import { toast } from "react-hot-toast";
import QuizService, { type Quiz } from "../../../../services/QuizService";
import { format } from "date-fns"; // For formatting scheduled dates

interface QuizzesTabProps {
  classId: string;
}

const QuizzesTab: React.FC<QuizzesTabProps> = ({ classId }) => {
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchClassQuizzes = async () => {
      try {
        setLoading(true);
        const response = await QuizService.getQuizzesByClass(classId);
        if (response.success) {
          setQuizzes(response.data);
        }
      } catch (error) {
        toast.error("Failed to load quizzes");
        console.error("Error fetching class quizzes:", error);
      } finally {
        setLoading(false);
      }
    };

    if (classId) {
      fetchClassQuizzes();
    }
  }, [classId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-brand-cerulean border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-gray-500 font-medium">Loading assessments...</p>
      </div>
    );
  }

  if (quizzes.length === 0) {
    return (
      <div className="bg-white p-12 rounded-[2rem] shadow-sm border border-brand-aliceBlue text-center flex flex-col items-center justify-center">
        <div className="w-20 h-20 bg-brand-cerulean/10 text-brand-cerulean rounded-3xl flex items-center justify-center mb-6 shadow-inner">
          <ClipboardList size={36} strokeWidth={1.5} />
        </div>
        <h3 className="text-2xl font-black text-brand-prussian mb-3 tracking-tight">No Quizzes Available</h3>
        <p className="text-gray-500 max-w-md mx-auto font-medium">
          There are currently no active assessments for this class. Your teacher will announce when a new quiz is published.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
      {quizzes.map((quiz) => {
        const isScheduled = quiz.quizType === "schedule";
        const isFuture = isScheduled && quiz.scheduledAt ? new Date(quiz.scheduledAt) > new Date() : false;
        const isLive = quiz.quizType === "live";
        
        // Premium card styling logic
        const cardBg = isLive ? 'bg-gradient-to-b from-red-50/50 to-white border-red-100 hover:border-red-200' :
                       isScheduled ? 'bg-gradient-to-b from-blue-50/50 to-white border-blue-100 hover:border-blue-200' : 
                       'bg-gradient-to-b from-brand-aliceBlue/30 to-white border-brand-aliceBlue hover:border-brand-cerulean/30';

        const iconBg = isLive ? 'bg-red-500 text-white shadow-red-200' : 
                       isScheduled ? 'bg-blue-500 text-white shadow-blue-200' : 
                       'bg-brand-cerulean text-white shadow-blue-100';

        const badgeStyle = isLive ? 'bg-red-100 text-red-700 border border-red-200' : 
                           isScheduled ? 'bg-blue-100 text-blue-700 border border-blue-200' : 
                           'bg-brand-aliceBlue text-brand-prussian border border-brand-cerulean/20';

        const buttonStyle = isFuture ? 'bg-gray-100 text-gray-400 cursor-not-allowed' :
                            isLive ? 'bg-red-500 text-white hover:bg-red-600 shadow-md hover:shadow-lg shadow-red-500/20' :
                            'bg-brand-prussian text-white hover:bg-brand-cerulean shadow-md hover:shadow-lg shadow-brand-prussian/20';

        return (
          <div 
            key={quiz._id} 
            className={`rounded-[2.5rem] border overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col group hover:-translate-y-1 ${cardBg}`}
          >
            {/* Card Header & Badge */}
            <div className="p-6 md:p-8 flex items-start gap-5 relative">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${iconBg}`}>
                <FileText size={24} strokeWidth={2} />
              </div>
              <div className="flex-1 pt-1">
                <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-3 ${badgeStyle}`}>
                  {quiz.quizType} Mode
                </span>
                <h3 className="text-xl font-bold text-brand-prussian line-clamp-2 leading-snug group-hover:text-brand-cerulean transition-colors">{quiz.title}</h3>
              </div>
            </div>

            {/* Card Body (Info) */}
            <div className="px-6 md:px-8 flex-1 space-y-4">
              {quiz.description && (
                <p className="text-sm text-gray-500 line-clamp-2 font-medium">
                  {quiz.description}
                </p>
              )}
              
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3 text-sm font-bold text-gray-700 bg-white/60 p-3 rounded-xl border border-white/80 shadow-sm backdrop-blur-sm">
                  <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500">
                    <Clock size={16} />
                  </div>
                  <span>{quiz.duration} Minutes Duration</span>
                </div>

                {isScheduled && quiz.scheduledAt && (
                  <div className="flex items-center gap-3 text-sm font-bold text-blue-700 bg-blue-50/80 p-3 rounded-xl border border-blue-100 shadow-sm backdrop-blur-sm">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                      <Calendar size={16} />
                    </div>
                    <span>Opens: {format(new Date(quiz.scheduledAt), "MMM do, h:mm a")}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Card Footer (Action) */}
            <div className="p-6 md:p-8 mt-4">
              <button
                onClick={() => navigate(`/student/class/quizzes/start/${quiz._id}`)}
                disabled={isFuture}
                className={`w-full py-4 text-sm font-black uppercase tracking-wider rounded-2xl transition-all flex items-center justify-center gap-2 transform active:scale-95 ${buttonStyle}`}
              >
                {isFuture ? <Clock size={20} /> : <PlayCircle size={20} />}
                {isFuture ? 'Not Yet Open' : 'Go to Exam'}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default QuizzesTab;