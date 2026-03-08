import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { 
  Plus, 
  Search, 
  Eye, 
  Edit, 
  Trash2, 
  CheckCircle, 
  XCircle,
  Clock,
  BookOpen,
  BarChart
} from "lucide-react";
import QuizService, { type Quiz } from "../../../services/QuizService";
import { toast } from "react-hot-toast";

const Quizzes: React.FC = () => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const fetchQuizzes = async () => {
    try {
      setLoading(true);
      const response = await QuizService.getAllQuizzes(); 
      if (response.success) {
        setQuizzes(response.data);
      }
    } catch (error) {
      toast.error("Failed to load quizzes");
      console.error("Error fetching quizzes:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePublish = async (id: string) => {
    try {
      const response = await QuizService.togglePublish(id);
      if (response.success) {
        // Optimistically update the UI
        setQuizzes(prev => prev.map(q => q._id === id ? { ...q, isPublished: !q.isPublished } : q));
        toast.success(response.message || `Quiz status updated`);
      }
    } catch (error) {
      toast.error("Error updating status");
      console.error("Error toggling publish status:", error);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (window.confirm(`Are you sure you want to delete the quiz "${title}"? This action can be reversed by an administrator later.`)) {
      try {
        const response = await QuizService.deleteQuiz(id);
        if (response.success) {
          // Remove the deleted quiz from the current state
          setQuizzes(prev => prev.filter(q => q._id !== id));
          toast.success(response.message || "Quiz deleted successfully");
        }
      } catch (error) {
        toast.error("Failed to delete quiz");
        console.error("Error deleting quiz:", error);
      }
    }
  };

  const filteredQuizzes = quizzes.filter(quiz => 
    quiz.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Quiz Management</h1>
          <p className="text-gray-500 text-sm">Create and manage exams for SL Accounting batches</p>
        </div>
        <Link 
          to="/admin/quizzes/create" 
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors font-medium"
        >
          <Plus size={20} />
          Create New Quiz
        </Link>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-lg"><BookOpen size={24} /></div>
          <div>
            <p className="text-sm text-gray-500">Total Quizzes</p>
            <p className="text-xl font-bold">{quizzes.length}</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-3 bg-green-100 text-green-600 rounded-lg"><CheckCircle size={24} /></div>
          <div>
            <p className="text-sm text-gray-500">Published</p>
            <p className="text-xl font-bold">{quizzes.filter(q => q.isPublished).length}</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-3 bg-amber-100 text-amber-600 rounded-lg"><Clock size={24} /></div>
          <div>
            <p className="text-sm text-gray-500">Live/Scheduled</p>
            <p className="text-xl font-bold">{quizzes.filter(q => q.quizType !== 'practice').length}</p>
          </div>
        </div>
      </div>

      {/* Filter & Search */}
      <div className="bg-white p-4 rounded-t-xl border border-gray-200 border-b-0">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search by quiz title..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Quizzes Table */}
      <div className="bg-white rounded-b-xl shadow-sm border border-gray-200 overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 text-gray-600 uppercase text-xs font-semibold">
              <th className="px-6 py-4">Title</th>
              <th className="px-6 py-4">Type</th>
              <th className="px-6 py-4">Questions</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              [...Array(3)].map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td colSpan={5} className="px-6 py-4 bg-gray-50/50 h-16"></td>
                </tr>
              ))
            ) : filteredQuizzes.length > 0 ? (
              filteredQuizzes.map((quiz) => (
                <tr key={quiz._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-semibold text-gray-800">{quiz.title}</p>
                    <p className="text-xs text-gray-500 uppercase">
                      {typeof quiz.class === 'object' && quiz.class !== null ? (quiz.class as any).name : 'General'}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${
                      quiz.quizType === 'live' ? 'bg-red-100 text-red-600' : 
                      quiz.quizType === 'schedule' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {quiz.quizType}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {quiz.questions?.length || 0} Qs
                  </td>
                  <td className="px-6 py-4">
                    <button 
                      onClick={() => handleTogglePublish(quiz._id)}
                      className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full border ${
                        quiz.isPublished 
                        ? 'border-green-200 bg-green-50 text-green-700' 
                        : 'border-gray-200 bg-gray-50 text-gray-500'
                      }`}
                    >
                      {quiz.isPublished ? <CheckCircle size={14} /> : <XCircle size={14} />}
                      {quiz.isPublished ? 'PUBLISHED' : 'DRAFT'}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-1">
                      <Link to={`/admin/quizzes/view/${quiz._id}`} className="p-2 text-gray-400 hover:text-blue-600 transition-colors" title="View Quiz Details">
                        <Eye size={18} />
                      </Link>
                      <Link to={`/admin/quizzes/analytics/${quiz._id}`} className="p-2 text-gray-400 hover:text-purple-600 transition-colors" title="View Analytics">
                        <BarChart size={18} />
                      </Link>
                      <Link to={`/admin/quizzes/edit/${quiz._id}`} className="p-2 text-gray-400 hover:text-amber-600 transition-colors" title="Edit Quiz">
                        <Edit size={18} />
                      </Link>
                      <button 
                        onClick={() => handleDelete(quiz._id, quiz.title)}
                        className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                        title="Delete Quiz"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                  No quizzes found. Start by creating one!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Quizzes;