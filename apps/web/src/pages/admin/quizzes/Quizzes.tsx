import React, { useEffect, useRef, useState } from "react";
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
  GraduationCap,
  Users,
  BarChart,
  ChevronRight,
} from "lucide-react";
import QuizService, { type Quiz } from "../../../services/QuizService";
import { toast } from "react-hot-toast";

const Quizzes: React.FC = () => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    fetchQuizzes();
  }, []);

  // Close the actions dropdown when clicking outside of it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
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
        setQuizzes((prev) =>
          prev.map((q) => (q._id === id ? { ...q, isPublished: !q.isPublished } : q))
        );
        toast.success(response.message || `Quiz status updated`);
      }
    } catch (error) {
      toast.error("Error updating status");
      console.error("Error toggling publish status:", error);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (
      window.confirm(
        `Are you sure you want to delete the quiz "${title}"? This action can be reversed by an administrator later.`
      )
    ) {
      try {
        const response = await QuizService.deleteQuiz(id);
        if (response.success) {
          // Remove the deleted quiz from the current state
          setQuizzes((prev) => prev.filter((q) => q._id !== id));
          toast.success(response.message || "Quiz deleted successfully");
        }
      } catch (error) {
        toast.error("Failed to delete quiz");
        console.error("Error deleting quiz:", error);
      }
    }
  };

  const filteredQuizzes = quizzes.filter((quiz) =>
    quiz.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 min-h-screen">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Quiz Management</h1>
          <p className="text-gray-500 text-sm">Create and manage exams for SL Accounting batches</p>
        </div>
        <Link
          to="/admin/quizzes/create"
          className="flex items-center justify-center gap-2 bg-[#0A5B70] font-bold hover:bg-[#08475A] text-white px-4 py-2.5 rounded-lg transition-colors shadow-sm"
        >
          <Plus size={20} />
          Create New Quiz
        </Link>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-3 bg-[#0A5B70]/10 text-[#0A5B70] rounded-lg">
            <GraduationCap size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Quizzes</p>
            <p className="text-xl font-bold">{quizzes.length}</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-3 bg-[#0A5B70]/10 text-[#0A5B70] rounded-lg">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500">Published</p>
            <p className="text-xl font-bold">{quizzes.filter((q) => q.isPublished).length}</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
         <div className="p-3 bg-[#0A5B70]/10 text-[#0A5B70] rounded-lg">
            <Users size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500">Live/Scheduled</p>
            <p className="text-xl font-bold">
              {quizzes.filter((q) => q.quizType !== "practice").length}
            </p>
          </div>
        </div>
      </div>

      {/* Filter & Search */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-6">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search by quiz title..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0A5B70]/20 focus:border-[#0A5B70]"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Quizzes Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-600 uppercase text-xs font-bold tracking-wide">
                <th className="px-6 py-4">Title</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">No.Questions</th>
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
                      <p className="font-normal text-gray-800">{quiz.title}</p>
                      <p className="text-xs text-gray-500 uppercase">
                        {typeof quiz.class === "object" && quiz.class !== null
                          ? (quiz.class as any).name
                          : "General"}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize inline-flex items-center gap-1.5 ${
                          quiz.quizType === "live"
                            ? "bg-red-100 text-red-600"
                            : quiz.quizType === "schedule"
                            ? "bg-blue-100 text-blue-600"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            quiz.quizType === "live"
                              ? "bg-red-500"
                              : quiz.quizType === "schedule"
                              ? "bg-blue-500"
                              : "bg-gray-500"
                          }`}
                        />
                        {quiz.quizType}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {quiz.questions?.length || 0}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleTogglePublish(quiz._id)}
                        title={quiz.isPublished ? "Click to unpublish" : "Click to publish"}
                        className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-colors ${
                          quiz.isPublished
                            ? "bg-[#0A5B70] text-white hover:bg-[#08475A]"
                            : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                        }`}
                      >
                        {quiz.isPublished ? <CheckCircle size={14} /> : <XCircle size={14} />}
                        {quiz.isPublished ? "Published" : "Draft"}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="relative inline-block" ref={openMenuId === quiz._id ? menuRef : null}>
                        <button
                          onClick={() =>
                            setOpenMenuId((prev) => (prev === quiz._id ? null : quiz._id))
                          }
                          title="Actions"
                          className="p-2 text-gray-400 hover:text-[#0A5B70] hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <ChevronRight
                            size={18}
                            className={`transition-transform ${
                              openMenuId === quiz._id ? "rotate-90" : ""
                            }`}
                          />
                        </button>

                        {openMenuId === quiz._id && (
                          <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-gray-200 rounded-xl shadow-lg z-10 overflow-hidden">
                            <Link
                              to={`/admin/quizzes/view/${quiz._id}`}
                              onClick={() => setOpenMenuId(null)}
                              title="View Quiz Details"
                              className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                            >
                              <Eye size={16} className="text-gray-500" />
                              View Details
                            </Link>
                            <Link
                              to={`/admin/quizzes/analytics/${quiz._id}`}
                              onClick={() => setOpenMenuId(null)}
                              title="View Analytics"
                              className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                            >
                              <BarChart size={16} className="text-gray-500" />
                              Analytics
                            </Link>
                            <Link
                              to={`/admin/quizzes/edit/${quiz._id}`}
                              onClick={() => setOpenMenuId(null)}
                              title="Edit Quiz"
                              className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                            >
                              <Edit size={16} className="text-gray-500" />
                              Edit Quiz
                            </Link>
                            <button
                              onClick={() => {
                                setOpenMenuId(null);
                                handleDelete(quiz._id, quiz.title);
                              }}
                              title="Delete Quiz"
                              className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 border-t border-gray-100"
                            >
                              <Trash2 size={16} />
                              Delete Quiz
                            </button>
                          </div>
                        )}
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
    </div>
  );
};

export default Quizzes;