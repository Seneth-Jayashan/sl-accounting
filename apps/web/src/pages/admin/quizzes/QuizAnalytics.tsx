import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  ArrowLeft, 
  Users, 
  Target, 
  TrendingUp, 
  Clock,
  Search,
  CheckCircle2,
  XCircle,
  Eye,
  FileText
} from "lucide-react";
import { toast } from "react-hot-toast";
import QuizService, { type Quiz, type QuizSubmission } from "../../../services/QuizService";

export default function QuizAnalytics() {
  const { id } = useParams<{ id: string }>(); // This is the quizId
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [submissions, setSubmissions] = useState<QuizSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        setLoading(true);
        // Fetch both the Quiz details and the Analytics data concurrently
        const [quizRes, analyticsRes] = await Promise.all([
          QuizService.getQuizById(id),
          QuizService.getQuizAnalytics(id)
        ]);

        if (quizRes.success && quizRes.data) {
          setQuiz(quizRes.data);
        }
        if (analyticsRes.success) {
          setSubmissions(analyticsRes.data as any);
        }
      } catch (error) {
        toast.error("Failed to load analytics data");
        console.error("Analytics fetch error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  // --- Calculate Overall Stats ---
  const stats = useMemo(() => {
    if (submissions.length === 0) return { avgScore: 0, passRate: 0, avgTime: 0 };
    
    const totalScore = submissions.reduce((acc, curr) => acc + (curr.percentageScore || 0), 0);
    const passed = submissions.filter(s => s.passed).length;
    const totalTime = submissions.reduce((acc, curr) => acc + (curr.timeTaken || 0), 0);

    return {
      avgScore: Math.round(totalScore / submissions.length),
      passRate: Math.round((passed / submissions.length) * 100),
      avgTime: Math.round(totalTime / submissions.length) // in seconds
    };
  }, [submissions]);

  // --- Filter Submissions ---
  const filteredSubmissions = useMemo(() => {
    if (!searchTerm.trim()) return submissions;
    const term = searchTerm.toLowerCase();
    return submissions.filter((sub: any) => {
      const name = `${sub.student?.name || sub.student?.firstName || ''} ${sub.student?.lastName || ''}`.toLowerCase();
      const email = (sub.student?.email || '').toLowerCase();
      return name.includes(term) || email.includes(term);
    });
  }, [submissions, searchTerm]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] bg-gray-50">
        <div className="w-10 h-10 border-4 border-gray-200 border-t-brand-cerulean rounded-full animate-spin mb-4"></div>
        <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Compiling Analytics...</p>
      </div>
    );
  }

  if (!quiz) {
    return <div className="p-6 text-center text-gray-500">Quiz not found.</div>;
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto pb-24 font-sans">
      
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <button onClick={() => navigate("/admin/quizzes")} className="flex items-center text-[10px] font-bold text-gray-400 hover:text-brand-cerulean transition-colors uppercase tracking-widest mb-2 group">
            <ArrowLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" /> Back to Quizzes
          </button>
          <h1 className="text-2xl sm:text-3xl font-black text-brand-prussian tracking-tight">Quiz Analytics</h1>
          <p className="text-sm text-gray-500 font-medium mt-1">
            Analyzing results for <span className="text-brand-cerulean font-bold">{quiz.title}</span>
          </p>
        </div>
      </header>

      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0"><Users size={24} /></div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Total Attempts</p>
            <p className="text-2xl font-black text-brand-prussian">{submissions.length}</p>
          </div>
        </div>
        
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center shrink-0"><Target size={24} /></div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Average Score</p>
            <p className="text-2xl font-black text-brand-prussian">{stats.avgScore}%</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-green-50 text-green-600 rounded-xl flex items-center justify-center shrink-0"><TrendingUp size={24} /></div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Pass Rate</p>
            <p className="text-2xl font-black text-brand-prussian">{stats.passRate}%</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center shrink-0"><Clock size={24} /></div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Avg. Time</p>
            <p className="text-2xl font-black text-brand-prussian">
              {Math.floor(stats.avgTime / 60)}m {stats.avgTime % 60}s
            </p>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
        {/* Table Header & Search */}
        <div className="p-4 sm:p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4 bg-gray-50/50">
          <h2 className="text-lg font-bold text-brand-prussian">Student Leaderboard</h2>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder="Search student..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-cerulean/20 focus:border-brand-cerulean transition-all"
            />
          </div>
        </div>

        {submissions.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-center">
             <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                <FileText size={32} className="text-gray-300" />
             </div>
             <h3 className="text-gray-900 font-bold mb-1">No Submissions Yet</h3>
             <p className="text-gray-500 text-sm">Students haven't taken this quiz yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-brand-aliceBlue/30 text-[10px] uppercase text-gray-500 font-bold tracking-widest border-b border-brand-aliceBlue">
                <tr>
                  <th className="px-6 py-4">Rank</th>
                  <th className="px-6 py-4">Student Details</th>
                  <th className="px-6 py-4">Score</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Time Taken</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredSubmissions.map((sub: any, index) => {
                  const studentName = `${sub.student?.firstName || ''} ${sub.student?.lastName || ''}`.trim() || 'Unknown Student';
                  const isPassed = sub.passed;
                  const isTimeOut = sub.status === "time-out";

                  return (
                    <motion.tr 
                      key={sub._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-gray-50 transition-colors group"
                    >
                      <td className="px-6 py-4">
                        <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                          index === 0 ? 'bg-yellow-100 text-yellow-700' : 
                          index === 1 ? 'bg-gray-200 text-gray-700' : 
                          index === 2 ? 'bg-orange-100 text-orange-800' : 'bg-gray-50 text-gray-500'
                        }`}>
                          #{index + 1}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-bold text-brand-prussian">{studentName}</p>
                        <p className="text-xs text-gray-500">{sub.student?.email || "No Email"}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-baseline gap-1">
                          <span className={`text-lg font-black ${isPassed ? 'text-green-600' : 'text-red-500'}`}>
                            {Math.round(sub.percentageScore)}%
                          </span>
                          <span className="text-[10px] text-gray-400 font-bold">({sub.totalPointsEarned}/{quiz.totalPoints})</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest border ${
                          isPassed ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
                        }`}>
                          {isPassed ? <CheckCircle2 size={12}/> : <XCircle size={12}/>}
                          {isPassed ? 'Passed' : 'Failed'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-gray-700">
                          {Math.floor(sub.timeTaken / 60)}m {sub.timeTaken % 60}s
                        </p>
                        {isTimeOut && <p className="text-[10px] text-red-500 font-bold mt-0.5">Timed Out</p>}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link 
                          to={`/admin/quizzes/submission/${sub._id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 text-brand-cerulean text-xs font-bold rounded-lg hover:bg-brand-aliceBlue hover:border-brand-cerulean/30 transition-all"
                        >
                          <Eye size={14} /> View Paper
                        </Link>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}