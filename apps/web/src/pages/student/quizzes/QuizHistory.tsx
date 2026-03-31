import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Clock, 
  ArrowRight, 
  CheckCircle2, 
  XCircle,
  FileText,
  CalendarDays,
  Target,
  TrendingUp
} from "lucide-react";
import QuizService from "../../../services/QuizService"; 

export default function QuizHistory() {
  const navigate = useNavigate();
  const [attempts, setAttempts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await QuizService.getMyAttempts();
        if (response.success) {
          setAttempts(response.data || []);
        }
      } catch (error) {
        console.error("Failed to load quiz history", error);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  // Calculate Overall Analytics
  const analytics = useMemo(() => {
    if (attempts.length === 0) return { avgScore: 0, passRate: 0, totalTime: 0 };
    const totalScore = attempts.reduce((acc, curr) => acc + (curr.percentageScore || 0), 0);
    const passed = attempts.filter(a => a.passed).length;
    const time = attempts.reduce((acc, curr) => acc + (curr.timeTaken || 0), 0);
    
    return {
      avgScore: Math.round(totalScore / attempts.length),
      passRate: Math.round((passed / attempts.length) * 100),
      totalTime: Math.round(time / 60) // in minutes
    };
  }, [attempts]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] bg-transparent">
        <div className="w-10 h-10 border-4 border-gray-200 border-t-brand-cerulean rounded-full animate-spin mb-4"></div>
        <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Loading Analytics...</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto pb-24">
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-brand-prussian tracking-tight">Performance Analytics</h1>
          <p className="text-sm text-gray-500 mt-1">Track your assessment history and improvement over time.</p>
        </div>
      </div>

      {attempts.length === 0 ? (
        <div className="bg-white rounded-[2rem] p-12 text-center shadow-sm border border-gray-100 flex flex-col items-center">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
            <FileText size={32} className="text-gray-300" />
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">No Assessment Data</h3>
          <p className="text-gray-500">You haven't completed any quizzes yet. Your analytics will appear here.</p>
        </div>
      ) : (
        <>
          {/* Top Analytics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="bg-brand-prussian rounded-2xl p-6 text-white relative overflow-hidden shadow-lg shadow-brand-prussian/20">
               <div className="absolute -right-4 -top-4 opacity-10"><Target size={100} /></div>
               <p className="text-brand-aliceBlue/70 text-xs font-bold uppercase tracking-widest mb-1">Average Score</p>
               <h3 className="text-4xl font-black">{analytics.avgScore}%</h3>
            </div>
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col justify-center">
               <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1 flex items-center gap-2"><TrendingUp size={14}/> Pass Rate</p>
               <h3 className="text-3xl font-black text-gray-800">{analytics.passRate}%</h3>
            </div>
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col justify-center">
               <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1 flex items-center gap-2"><Clock size={14}/> Total Time Spent</p>
               <h3 className="text-3xl font-black text-gray-800">{analytics.totalTime} mins</h3>
            </div>
          </div>

          {/* History Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {attempts.map((attempt, idx) => {
                const quiz = attempt.quiz;
                const isPassed = attempt.passed;
                const date = new Date(attempt.completedAt || attempt.createdAt).toLocaleDateString('en-US', {
                  month: 'short', day: 'numeric', year: 'numeric'
                });

                return (
                  <motion.div 
                    key={attempt._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden flex flex-col hover:shadow-xl hover:shadow-brand-cerulean/5 hover:-translate-y-1 transition-all duration-300 group"
                  >
                    <div className="p-6 flex-1 flex flex-col">
                      <div className="flex justify-between items-start mb-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${isPassed ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                          {isPassed ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                          {isPassed ? "Passed" : "Failed"}
                        </span>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                          <CalendarDays size={12} /> {date}
                        </span>
                      </div>

                      <h3 className="font-bold text-lg text-brand-prussian line-clamp-2 mb-2 group-hover:text-brand-cerulean transition-colors">
                        {quiz?.title || "Untitled Assessment"}
                      </h3>
                      
                      {quiz?.class && (
                        <p className="text-xs text-gray-500 font-medium mb-6 line-clamp-1">
                           Module: {typeof quiz.class === 'object' ? quiz.class.name : "Accounting Class"}
                        </p>
                      )}

                      <div className="grid grid-cols-2 gap-3 mb-6 mt-auto">
                        <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 flex flex-col items-center justify-center text-center">
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Score</p>
                          <p className={`font-black text-xl ${isPassed ? 'text-green-600' : 'text-red-500'}`}>
                            {Math.round(attempt.percentageScore)}%
                          </p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 flex flex-col items-center justify-center text-center">
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Time</p>
                          <p className="font-bold text-gray-700 text-sm mt-1">
                            {Math.floor(attempt.timeTaken / 60)}m {attempt.timeTaken % 60}s
                          </p>
                        </div>
                      </div>

                      <button 
                        onClick={() => navigate(`/student/quizzes/result/${attempt._id}`)}
                        className="w-full bg-brand-aliceBlue text-brand-prussian py-3.5 rounded-xl font-bold hover:bg-brand-prussian hover:text-white transition-colors flex items-center justify-center gap-2 text-sm"
                      >
                        Detailed Analysis <ArrowRight size={16} />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </>
      )}
    </div>
  );
}