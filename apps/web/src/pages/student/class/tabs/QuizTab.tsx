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
      <div className="bg-white p-12 rounded-2xl shadow-sm border border-gray-100 text-center">
        <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <ClipboardList size={32} />
        </div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">No Quizzes Available</h3>
        <p className="text-gray-500 max-w-md mx-auto">
          There are currently no active assessments for this class. Your teacher will announce when a new quiz is published.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {quizzes.map((quiz) => {
        const isScheduled = quiz.quizType === "schedule";
        const isFuture = isScheduled && quiz.scheduledAt ? new Date(quiz.scheduledAt) > new Date() : false;
        const isLive = quiz.quizType === "live";
        
        return (
          <div 
            key={quiz._id} 
            className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow flex flex-col"
          >
            {/* Card Header & Badge */}
            <div className="p-5 border-b border-gray-100 flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${
                  isLive ? 'bg-red-50 text-red-600' : 
                  isScheduled ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'
                }`}>
                  <FileText size={20} />
                </div>
                <h3 className="font-bold text-gray-800 line-clamp-2">{quiz.title}</h3>
              </div>
            </div>

            {/* Card Body (Info) */}
            <div className="p-5 flex-1 space-y-3">
              {quiz.description && (
                <p className="text-sm text-gray-500 line-clamp-2 mb-2">
                  {quiz.description}
                </p>
              )}
              
              <div className="flex items-center gap-2 text-sm text-gray-600 font-medium">
                <Clock size={16} className="text-gray-400" />
                <span>{quiz.duration} Minutes</span>
              </div>

              {/* Show start time only if it's a scheduled quiz */}
              {isScheduled && quiz.scheduledAt && (
                <div className="flex items-center gap-2 text-sm text-blue-600 font-medium bg-blue-50 px-3 py-2 rounded-lg mt-2">
                  <Calendar size={16} />
                  <span>Opens: {format(new Date(quiz.scheduledAt), "MMM do, h:mm a")}</span>
                </div>
              )}
              
              {/* Type Badge */}
              <div className="pt-2">
                <span className={`text-xs font-bold uppercase px-2.5 py-1 rounded-full ${
                  isLive ? 'bg-red-100 text-red-700' : 
                  isScheduled ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                }`}>
                  {quiz.quizType} Mode
                </span>
              </div>
            </div>

            {/* Card Footer (Action) */}
            <div className="p-4 bg-gray-50 mt-auto border-t border-gray-100">
              <button
                onClick={() => navigate(`/student/class/quizzes/start/${quiz._id}`)}
                disabled={isFuture}
                className={`w-full py-2.5 text-sm font-bold rounded-xl transition-colors flex items-center justify-center gap-2 ${
                    isFuture 
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                    : 'bg-brand-prussian text-white hover:bg-brand-cerulean'
                }`}
              >
                {isFuture ? <Clock size={18} /> : <PlayCircle size={18} />}
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