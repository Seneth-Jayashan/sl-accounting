import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  X,
  TrendingUp,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import AttendanceService, {
  type MyAttendanceRecord,
} from "../../../../services/AttendanceService";
import moment from "moment";

interface AttendanceTabProps {
  classId: string;
}

type AttendanceFilter = "all" | "present" | "absent";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] as const },
  },
};

export default function AttendanceTab({ classId }: AttendanceTabProps) {
  const [attendances, setAttendances] = useState<MyAttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<AttendanceFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    let isMounted = true;
    const fetchAttendance = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await AttendanceService.getMyClassAttendance(classId);
        if (isMounted) setAttendances(data || []);
      } catch (err) {
        console.error("Failed to fetch my attendance:", err);
        if (isMounted) setError("Failed to load attendance history.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    if (classId) fetchAttendance();
    else setLoading(false);

    return () => {
      isMounted = false;
    };
  }, [classId]);

  const stats = useMemo(() => {
    const total = attendances.length;
    const present = attendances.filter((a) => a.isPresent).length;
    const absent = total - present;
    const rate = total === 0 ? 0 : Math.round((present / total) * 100);
    return { total, present, absent, rate };
  }, [attendances]);

  const filteredAttendances = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return attendances.filter((record) => {
      if (filter === "present" && !record.isPresent) return false;
      if (filter === "absent" && record.isPresent) return false;

      if (q) {
        const title = (record.title || `Session ${record.index}`).toLowerCase();
        const dateStr = moment(record.startAt).format("MMM DD, YYYY").toLowerCase();
        return (
          title.includes(q) ||
          `session ${record.index}`.includes(q) ||
          dateStr.includes(q)
        );
      }
      return true;
    });
  }, [attendances, filter, searchQuery]);

  // --- LOADING SKELETON ---
  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-44 rounded-[2rem] bg-gray-200" />
        <div className="h-16 rounded-2xl bg-white border border-gray-100" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-44 rounded-3xl bg-white border border-gray-100 p-6 space-y-4"
            >
              <div className="flex justify-between">
                <div className="h-5 w-20 bg-gray-200 rounded-full" />
                <div className="h-6 w-16 bg-gray-100 rounded-full" />
              </div>
              <div className="h-5 w-3/4 bg-gray-200 rounded-lg" />
              <div className="h-10 w-full bg-gray-100 rounded-xl" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // --- ERROR STATE ---
  if (error) {
    return (
      <div className="bg-white rounded-3xl p-10 border border-red-100 shadow-sm text-center flex flex-col items-center">
        <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center mb-4">
          <AlertCircle size={26} />
        </div>
        <h3 className="text-lg font-extrabold text-brand-prussian mb-1">
          Unable to Load Attendance
        </h3>
        <p className="text-sm text-gray-500">{error}</p>
      </div>
    );
  }

  // SVG Ring Metrics
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (stats.rate / 100) * circumference;

  const ringColor =
    stats.rate >= 80
      ? "text-emerald-400"
      : stats.rate >= 50
        ? "text-brand-jasmine"
        : "text-red-400";

  const standingLabel =
    stats.total === 0
      ? "No Sessions Yet"
      : stats.rate >= 80
        ? "Excellent Standing"
        : stats.rate >= 50
          ? "On Track"
          : "Needs Attention";

  return (
    <div className="space-y-6">
      {/* --- HERO SUMMARY CARD --- */}
      <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-brand-prussian via-[#0d3a4b] to-brand-cerulean p-6 sm:p-8 text-white shadow-xl shadow-brand-prussian/15">
        <div className="pointer-events-none absolute -top-20 -right-16 w-72 h-72 rounded-full bg-brand-jasmine/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-1/4 w-64 h-64 rounded-full bg-white/10 blur-3xl" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Left Text */}
          <div className="space-y-3 text-center lg:text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-bold text-brand-jasmine">
              <TrendingUp size={13} />
              <span>{standingLabel}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              My Attendance Overview
            </h2>
            <p className="text-white/75 text-sm sm:text-base max-w-md mx-auto lg:mx-0 leading-relaxed">
              Consistent attendance helps you stay ahead with live discussions,
              practice problems, and exam prep.
            </p>
          </div>

          {/* Right Metrics Glass Card */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-5 bg-white/10 backdrop-blur-md border border-white/15 p-5 sm:p-6 rounded-3xl shrink-0">
            {/* Present / Absent Counts */}
            <div className="flex sm:flex-col gap-4 sm:gap-3 text-left">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-400/20 text-emerald-300 flex items-center justify-center">
                  <CheckCircle2 size={16} />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-white/60 font-bold">
                    Present
                  </p>
                  <p className="text-lg font-extrabold leading-tight">
                    {stats.present}{" "}
                    <span className="text-xs font-medium text-white/50">
                      / {stats.total}
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-red-400/20 text-red-300 flex items-center justify-center">
                  <XCircle size={16} />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-white/60 font-bold">
                    Absent
                  </p>
                  <p className="text-lg font-extrabold leading-tight">
                    {stats.absent}
                  </p>
                </div>
              </div>
            </div>

            <div className="hidden sm:block w-px h-20 bg-white/15" />

            {/* Circular Progress Ring */}
            <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
              <svg
                className="w-full h-full -rotate-90 drop-shadow-md"
                viewBox="0 0 96 96"
              >
                <circle
                  cx="48"
                  cy="48"
                  r={radius}
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  className="text-white/15"
                />
                <motion.circle
                  cx="48"
                  cy="48"
                  r={radius}
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={circumference}
                  initial={{ strokeDashoffset: circumference }}
                  animate={{ strokeDashoffset }}
                  transition={{ duration: 0.9, ease: "easeOut" }}
                  strokeLinecap="round"
                  className={ringColor}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-black text-white leading-none">
                  {stats.rate}%
                </span>
                <span className="text-[9px] uppercase tracking-wider text-white/60 font-bold mt-0.5">
                  Rate
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- TOOLBAR: FILTER PILLS & SEARCH --- */}
      {attendances.length > 0 && (
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 bg-gray-100/90 p-1 rounded-xl overflow-x-auto scrollbar-hide">
            {(
              [
                { key: "all", label: "All Sessions", count: stats.total },
                { key: "present", label: "Present", count: stats.present },
                { key: "absent", label: "Absent", count: stats.absent },
              ] as const
            ).map((tab) => {
              const active = filter === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${active
                      ? "bg-white text-brand-prussian shadow-sm"
                      : "text-gray-500 hover:text-gray-800"
                    }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-md ${active
                        ? "bg-brand-cerulean/10 text-brand-cerulean"
                        : "bg-gray-200/70 text-gray-500"
                      }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="relative w-full md:w-64">
            <Search
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search sessions..."
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
      )}

      {/* --- SESSION HISTORY GRID --- */}
      {attendances.length === 0 ? (
        <div className="bg-white p-12 sm:p-16 rounded-3xl shadow-sm border border-dashed border-gray-200 text-center flex flex-col items-center">
          <div className="w-16 h-16 bg-brand-aliceBlue text-brand-cerulean rounded-2xl flex items-center justify-center mb-4">
            <Calendar size={30} />
          </div>
          <h3 className="text-lg sm:text-xl font-extrabold text-brand-prussian mb-1">
            No Attendance History Yet
          </h3>
          <p className="text-gray-400 max-w-sm text-sm leading-relaxed">
            Your attendance records will appear here automatically once you join
            live sessions.
          </p>
        </div>
      ) : filteredAttendances.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-gray-200">
          <p className="text-base font-bold text-brand-prussian mb-1">
            No matching sessions found
          </p>
          <p className="text-sm text-gray-400 mb-5">
            Try clearing your search or switching the filter.
          </p>
          <button
            onClick={() => {
              setSearchQuery("");
              setFilter("all");
            }}
            className="px-5 py-2 rounded-xl bg-gray-100 text-gray-700 text-xs font-bold hover:bg-gray-200 transition-colors"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <motion.div
          key={`${filter}-${searchQuery}`}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          {filteredAttendances.map((record) => (
            <motion.article
              key={record.sessionId}
              variants={cardVariants}
              className="group relative bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-lg hover:shadow-brand-prussian/5 hover:border-brand-cerulean/25 hover:-translate-y-0.5 transition-all duration-300 overflow-hidden flex flex-col justify-between"
            >
              {/* Top Status Accent Bar */}
              <div
                className={`h-1.5 w-full ${record.isPresent ? "bg-emerald-500" : "bg-red-500"
                  }`}
              />

              <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between gap-4">
                <div>
                  {/* Top Badges Row */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-brand-aliceBlue text-brand-prussian text-[10px] font-bold uppercase tracking-wider">
                      <Sparkles size={10} className="text-brand-cerulean" />
                      Session {record.index}
                    </span>

                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${record.isPresent
                          ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                          : "bg-red-50 text-red-600 border-red-100"
                        }`}
                    >
                      {record.isPresent ? (
                        <>
                          <CheckCircle2 size={12} />
                          Present
                        </>
                      ) : (
                        <>
                          <XCircle size={12} />
                          Absent
                        </>
                      )}
                    </span>
                  </div>

                  {/* Session Title */}
                  <h4 className="font-extrabold text-brand-prussian text-base sm:text-lg line-clamp-2 leading-snug group-hover:text-brand-cerulean transition-colors">
                    {record.title || `Class Session ${record.index}`}
                  </h4>
                </div>

                {/* Date & Time Footer Tile */}
                <div className="flex items-center justify-between gap-2 p-3 rounded-2xl bg-gray-50 border border-gray-100 text-xs font-semibold text-gray-600">
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar size={14} className="text-brand-cerulean" />
                    {moment(record.startAt).format("MMM DD, YYYY")}
                  </span>
                  <span className="inline-flex items-center gap-1 text-gray-500">
                    <Clock size={13} className="text-gray-400" />
                    {moment(record.startAt).format("hh:mm A")}
                  </span>
                </div>
              </div>
            </motion.article>
          ))}
        </motion.div>
      )}
    </div>
  );
}