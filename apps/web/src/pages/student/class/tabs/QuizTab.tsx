import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ClipboardList,
  Clock,
  Calendar,
  PlayCircle,
  FileText,
  Search,
  X,
  Radio,
  Lock,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { toast } from "react-hot-toast";
import QuizService, { type Quiz } from "../../../../services/QuizService";
import { format } from "date-fns";

interface QuizzesTabProps {
  classId: string;
}

type QuizFilter = "all" | "live" | "schedule" | "practice";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] as const },
  },
};

const QuizzesTab: React.FC<QuizzesTabProps> = ({ classId }) => {
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [modeFilter, setModeFilter] = useState<QuizFilter>("all");

  useEffect(() => {
    let isMounted = true;
    const fetchClassQuizzes = async () => {
      try {
        setLoading(true);
        const response = await QuizService.getQuizzesByClass(classId);
        if (isMounted && response.success) {
          setQuizzes(response.data || []);
        }
      } catch (error) {
        toast.error("Failed to load quizzes");
        console.error("Error fetching class quizzes:", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    if (classId) {
      fetchClassQuizzes();
    } else {
      setLoading(false);
    }

    return () => {
      isMounted = false;
    };
  }, [classId]);

  const filteredQuizzes = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return quizzes.filter((quiz) => {
      const type = (quiz.quizType || "").toLowerCase();
      if (modeFilter === "live" && type !== "live") return false;
      if (modeFilter === "schedule" && type !== "schedule") return false;
      if (modeFilter === "practice" && (type === "live" || type === "schedule")) {
        return false;
      }

      if (q) {
        return (
          quiz.title?.toLowerCase().includes(q) ||
          quiz.description?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [quizzes, searchQuery, modeFilter]);

  // --- LOADING SKELETON ---
  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-20 bg-white rounded-3xl border border-gray-100" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white rounded-3xl p-6 border border-gray-100 space-y-4 h-72 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-gray-100" />
                  <div className="w-20 h-6 rounded-full bg-gray-100" />
                </div>
                <div className="h-5 bg-gray-200 rounded-lg w-3/4" />
                <div className="h-4 bg-gray-100 rounded-lg w-full" />
              </div>
              <div className="h-12 bg-gray-100 rounded-2xl" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // --- EMPTY STATE (NO QUIZZES AT ALL) ---
  if (quizzes.length === 0) {
    return (
      <div className="bg-white p-12 sm:p-20 rounded-3xl shadow-sm border border-dashed border-gray-200 text-center flex flex-col items-center justify-center">
        <div className="w-16 h-16 bg-brand-aliceBlue text-brand-cerulean rounded-2xl flex items-center justify-center mb-4">
          <ClipboardList size={30} />
        </div>
        <h3 className="text-lg sm:text-xl font-extrabold text-brand-prussian mb-1">
          No Quizzes Available Yet
        </h3>
        <p className="text-gray-400 max-w-sm mx-auto text-sm leading-relaxed">
          There are currently no active assessments for this class. Your teacher will
          announce when a new quiz is published.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* --- TOP TOOLBAR --- */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-gray-100 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-brand-cerulean/10 text-brand-cerulean flex items-center justify-center shrink-0">
            <ClipboardList size={21} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-extrabold text-brand-prussian tracking-tight">
                Class Quizzes
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-brand-aliceBlue text-brand-cerulean text-xs font-bold">
                {quizzes.length} {quizzes.length === 1 ? "Quiz" : "Quizzes"}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              Live exams, scheduled tests & practice assessments
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          {/* Mode Filter Pills */}
          <div className="flex items-center bg-gray-100/90 p-1 rounded-xl overflow-x-auto scrollbar-hide">
            {(
              [
                { key: "all", label: "All" },
                { key: "live", label: "Live" },
                { key: "schedule", label: "Scheduled" },
                { key: "practice", label: "Practice" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.key}
                onClick={() => setModeFilter(tab.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${modeFilter === tab.key
                    ? "bg-white text-brand-prussian shadow-sm"
                    : "text-gray-500 hover:text-gray-800"
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-60">
            <Search
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search quizzes..."
              className="w-full pl-9 pr-8 py-2 text-sm bg-gray-50 border border-gray-200/80 rounded-xl focus:outline-none focus:bg-white focus:border-brand-cerulean focus:ring-2 focus:ring-brand-cerulean/15 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* --- NO FILTER MATCHES --- */}
      {filteredQuizzes.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-gray-200">
          <p className="text-base font-bold text-brand-prussian mb-1">
            No matching quizzes found
          </p>
          <p className="text-sm text-gray-400 mb-5">
            Try clearing your search or switching the quiz mode filter.
          </p>
          <button
            onClick={() => {
              setSearchQuery("");
              setModeFilter("all");
            }}
            className="px-5 py-2 rounded-xl bg-gray-100 text-gray-700 text-xs font-bold hover:bg-gray-200 transition-colors"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        /* --- QUIZZES GRID --- */
        <motion.div
          key={`${modeFilter}-${searchQuery}`}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6"
        >
          {filteredQuizzes.map((quiz) => {
            const isScheduled = quiz.quizType === "schedule";
            const isFuture =
              isScheduled && quiz.scheduledAt
                ? new Date(quiz.scheduledAt) > new Date()
                : false;
            const isLive = quiz.quizType === "live";

            const topBarClass = isLive
              ? "bg-red-500"
              : isScheduled
                ? "bg-blue-500"
                : "bg-brand-cerulean";

            const iconBoxClass = isLive
              ? "bg-red-50 text-red-500"
              : isScheduled
                ? "bg-blue-50 text-blue-600"
                : "bg-brand-cerulean/10 text-brand-cerulean";

            const badgeClass = isLive
              ? "bg-red-50 text-red-600 border-red-100"
              : isScheduled
                ? "bg-blue-50 text-blue-600 border-blue-100"
                : "bg-brand-aliceBlue text-brand-prussian border-brand-cerulean/15";

            return (
              <motion.article
                key={quiz._id}
                variants={cardVariants}
                className="group relative bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-brand-prussian/8 hover:border-brand-cerulean/30 hover:-translate-y-1 transition-all duration-300 flex flex-col overflow-hidden"
              >
                {/* Top Accent Bar */}
                <div className={`h-1.5 w-full ${topBarClass}`} />

                {/* Card Body */}
                <div className="p-5 sm:p-6 flex-1 flex flex-col">
                  {/* Header Row: Icon & Mode Badge */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-105 ${iconBoxClass}`}
                    >
                      {isLive ? (
                        <Radio size={22} />
                      ) : isScheduled ? (
                        <Calendar size={22} />
                      ) : (
                        <FileText size={22} />
                      )}
                    </div>

                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${badgeClass}`}
                    >
                      {isLive && (
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                      )}
                      {!isLive && !isScheduled && <Sparkles size={10} />}
                      {quiz.quizType || "Practice"} Mode
                    </span>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-lg font-extrabold text-brand-prussian line-clamp-2 leading-snug group-hover:text-brand-cerulean transition-colors">
                    {quiz.title}
                  </h3>

                  {quiz.description && (
                    <p className="text-xs sm:text-sm text-gray-500 line-clamp-2 mt-2 leading-relaxed">
                      {quiz.description}
                    </p>
                  )}

                  {/* Metadata Tiles */}
                  <div className="mt-5 space-y-2.5">
                    <div className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50 border border-gray-100">
                      <div className="w-8 h-8 rounded-xl bg-white shadow-xs flex items-center justify-center text-brand-cerulean shrink-0">
                        <Clock size={15} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                          Duration
                        </p>
                        <p className="text-xs sm:text-sm font-bold text-gray-800">
                          {quiz.duration} Minutes
                        </p>
                      </div>
                    </div>

                    {isScheduled && quiz.scheduledAt && (
                      <div className="flex items-center gap-3 p-3 rounded-2xl bg-blue-50/60 border border-blue-100/80">
                        <div className="w-8 h-8 rounded-xl bg-white shadow-xs flex items-center justify-center text-blue-600 shrink-0">
                          <Calendar size={15} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-blue-500">
                            {isFuture ? "Opens At" : "Opened At"}
                          </p>
                          <p className="text-xs sm:text-sm font-bold text-blue-900 truncate">
                            {format(new Date(quiz.scheduledAt), "MMM do, h:mm a")}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Footer */}
                  <div className="mt-6 pt-4 border-t border-gray-100">
                    <button
                      onClick={() =>
                        navigate(`/student/class/quizzes/start/${quiz._id}`)
                      }
                      disabled={isFuture}
                      className={`w-full py-3.5 px-5 text-xs sm:text-sm font-bold rounded-2xl transition-all flex items-center justify-center gap-2 active:scale-[0.98] ${isFuture
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                          : isLive
                            ? "bg-red-500 text-white hover:bg-red-600 shadow-md shadow-red-500/20"
                            : "bg-brand-prussian text-white hover:bg-brand-cerulean shadow-md shadow-brand-prussian/15"
                        }`}
                    >
                      {isFuture ? (
                        <>
                          <Lock size={16} />
                          <span>Not Yet Open</span>
                        </>
                      ) : (
                        <>
                          <PlayCircle size={17} />
                          <span>{isLive ? "Join Live Exam" : "Start Assessment"}</span>
                          <ArrowRight
                            size={15}
                            className="ml-0.5 transition-transform group-hover:translate-x-0.5"
                          />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </motion.article>
            );
          })}
        </motion.div>
      )}
    </div>
  );
};

export default QuizzesTab;