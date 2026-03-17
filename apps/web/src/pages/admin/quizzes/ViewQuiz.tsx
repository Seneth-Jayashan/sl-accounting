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
  Loader2,
  BookOpen,
  Award
} from "lucide-react";
import { toast } from "react-hot-toast";
import QuizService, { type Quiz } from "../../../services/QuizService";

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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <Loader2 className="animate-spin text-blue-600 mb-4" size={48} />
        <p className="text-gray-500 font-medium">Loading Quiz Preview...</p>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="p-6 text-center text-gray-500">
        Quiz not found.
      </div>
    );
  }

  // Handle populated class object safely
  const classNameDisplay = typeof quiz.class === 'object' && quiz.class !== null 
    ? (quiz.class as any).name || (quiz.class as any).className || "Unknown Class"
    : "Class ID: " + quiz.class;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-5xl mx-auto">
        
        {/* Header Actions */}
        <div className="flex items-center justify-between mb-8 sticky top-0 bg-gray-50 z-10 py-4 border-b border-gray-200">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <button 
                onClick={() => navigate("/admin/quizzes")}
                className="text-gray-400 hover:text-gray-700 transition"
              >
                <ArrowLeft size={20} />
              </button>
              <h1 className="text-2xl font-bold text-gray-800">Quiz Preview</h1>
            </div>
            <p className="text-gray-500 text-sm ml-8">Review the assessment details and correct answers</p>
          </div>
          <div className="flex gap-3">
            <Link 
              to={`/admin/quizzes/edit/${quiz._id}`}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
            >
              <Edit size={18} /> Edit Quiz
            </Link>
          </div>
        </div>

        {/* Top Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* General Details */}
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 md:col-span-2">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <BookOpen size={18} className="text-blue-600"/> {quiz.title}
              </h2>
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                quiz.isPublished ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
              }`}>
                {quiz.isPublished ? 'Published' : 'Draft'}
              </span>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-gray-500 mb-1">Target Class</p>
                <p className="font-medium text-gray-800">{classNameDisplay}</p>
              </div>
              <div>
                <p className="text-gray-500 mb-1">Type</p>
                <p className="font-medium text-gray-800 capitalize">{quiz.quizType}</p>
              </div>
              <div>
                <p className="text-gray-500 mb-1 flex items-center gap-1"><Clock size={14}/> Duration</p>
                <p className="font-medium text-gray-800">{quiz.duration} mins</p>
              </div>
              <div>
                <p className="text-gray-500 mb-1 flex items-center gap-1"><Award size={14}/> Pass Mark</p>
                <p className="font-medium text-gray-800">{quiz.passingPercentage}%</p>
              </div>
            </div>
          </div>

          {/* Settings */}
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
              <Settings size={18} className="text-gray-600"/> Rules
            </h2>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2 text-gray-700">
                {quiz.settings?.shuffleQuestions ? <CheckCircle2 size={16} className="text-green-500"/> : <XCircle size={16} className="text-red-400"/>} 
                Shuffle Questions
              </li>
              <li className="flex items-center gap-2 text-gray-700">
                {quiz.settings?.shuffleOptions ? <CheckCircle2 size={16} className="text-green-500"/> : <XCircle size={16} className="text-red-400"/>} 
                Shuffle Options
              </li>
              <li className="flex items-center gap-2 text-gray-700">
                {quiz.settings?.allowBacktrack ? <CheckCircle2 size={16} className="text-green-500"/> : <XCircle size={16} className="text-red-400"/>} 
                Allow Backtracking
              </li>
              <li className="flex items-center gap-2 text-gray-700">
                {quiz.settings?.showResultImmediately ? <CheckCircle2 size={16} className="text-green-500"/> : <XCircle size={16} className="text-red-400"/>} 
                Show Results Instantly
              </li>
            </ul>
          </div>
        </div>

        {/* Questions Summary */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800">Questions ({quiz.questions.length})</h2>
          <span className="text-sm font-medium text-gray-500 bg-gray-200 px-3 py-1 rounded-full">
            Total Points: {quiz.totalPoints}
          </span>
        </div>

        {/* Questions List */}
        <div className="space-y-6">
          {quiz.questions.map((q, index) => (
            <div key={q._id || index} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex justify-between items-start mb-4">
                <div className="flex gap-3">
                  <span className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold">
                    {index + 1}
                  </span>
                  <p className="text-gray-800 font-medium text-lg pt-1">{q.questionText}</p>
                </div>
                <span className="flex-shrink-0 bg-gray-100 text-gray-600 text-xs font-bold px-2 py-1 rounded">
                  {q.points} {q.points === 1 ? 'Point' : 'Points'}
                </span>
              </div>

              {/* Options */}
              <div className="ml-11 space-y-2 mb-4">
                {q.options.map((opt, optIndex) => (
                  <div 
                    key={opt._id || optIndex} 
                    className={`p-3 rounded-lg border ${
                      opt.isCorrect 
                      ? 'bg-green-50 border-green-200 text-green-800' 
                      : 'bg-gray-50 border-gray-100 text-gray-600'
                    } flex items-center gap-3`}
                  >
                    {opt.isCorrect ? (
                      <CheckCircle2 size={18} className="text-green-600 flex-shrink-0" />
                    ) : (
                      <div className="w-[18px] h-[18px] rounded-full border-2 border-gray-300 flex-shrink-0"></div>
                    )}
                    <span className="text-sm">{opt.optionText}</span>
                  </div>
                ))}
              </div>

              {/* Accounting Explanation */}
              {q.explanation && (
                <div className="ml-11 mt-4 p-4 bg-blue-50/50 border border-blue-100 rounded-lg flex gap-3">
                  <HelpCircle size={18} className="text-blue-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-blue-900 mb-1">Explanation / Working</h4>
                    <p className="text-sm text-blue-800 whitespace-pre-wrap">{q.explanation}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};

export default ViewQuiz;