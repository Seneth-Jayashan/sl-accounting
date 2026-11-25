import { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import {
  AlertCircle,
  Users,
  CalendarCheck,
  Trophy,
  RefreshCw,
  BookOpen,
  ChevronDown,
  BarChart3,
} from "lucide-react";
import moment from "moment";

import ClassService, { type ClassData } from "../../../services/ClassService";
import AttendanceService, {
  type ClassAttendanceSummary,
} from "../../../services/AttendanceService";

// --- Types ---

interface ChartPoint {
  name: string;
  date: string;
  title: string;
  Students: number;
}

// --- Custom Chart Tooltip ---

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: ChartPoint }>;
}) {
  if (!active || !payload || !payload.length) return null;
  const item = payload[0].payload;

  return (
    <div className="bg-brand-prussian text-white px-3.5 py-2.5 rounded-xl shadow-xl border border-white/10 text-xs">
      <p className="font-bold text-sm text-white">{item.title}</p>
      <p className="text-slate-300 mt-0.5">{item.date}</p>
      <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between gap-4">
        <span className="text-slate-300">Attendance</span>
        <span className="font-bold text-sky-300 tabular-nums">
          {item.Students} students
        </span>
      </div>
    </div>
  );
}

// --- Skeleton Loader ---

function AttendanceSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 bg-white rounded-2xl border border-slate-100 p-6">
            <div className="h-3 w-24 bg-slate-200 rounded mb-4" />
            <div className="h-7 w-28 bg-slate-200 rounded" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-96 bg-white rounded-2xl border border-slate-100 p-6" />
        <div className="h-96 bg-white rounded-2xl border border-slate-100 p-6 space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-14 bg-slate-50 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}

// --- Main Component ---

export default function AttendanceReport() {
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [attendanceData, setAttendanceData] =
    useState<ClassAttendanceSummary | null>(null);

  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState("");

  // Fetch all classes on mount
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const response = await ClassService.getAllClasses();
        const data: ClassData[] = Array.isArray(response)
          ? response
          : (response as any).classes || [];
        setClasses(data);
        if (data.length > 0) {
          setSelectedClassId(data[0]._id);
        }
      } catch (err) {
        console.error("Failed to fetch classes:", err);
        setError("Failed to load classes.");
      } finally {
        setLoadingClasses(false);
      }
    };
    fetchClasses();
  }, []);

  // Fetch attendance data when class is selected
  const fetchAttendance = useCallback(async () => {
    if (!selectedClassId) return;
    setLoadingData(true);
    setError("");
    try {
      const data = await AttendanceService.getClassAttendanceSummary(
        selectedClassId
      );
      setAttendanceData(data);
    } catch (err) {
      console.error("Failed to fetch attendance summary:", err);
      setError("Failed to load attendance report for the selected class.");
    } finally {
      setLoadingData(false);
    }
  }, [selectedClassId]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  // Transform data for Recharts
  const chartData: ChartPoint[] = useMemo(() => {
    return (
      attendanceData?.sessionSummary.map((session) => ({
        name: `S${session.index}`,
        date: moment(session.startAt).format("MMM DD"),
        title: session.title || `Session ${session.index}`,
        Students: session.attendanceCount || 0,
      })) || []
    );
  }, [attendanceData]);

  // Computed KPI metrics
  const stats = useMemo(() => {
    if (chartData.length === 0) {
      return { totalSessions: 0, avgAttendance: 0, peakCount: 0, peakSession: "-" };
    }
    const total = chartData.reduce((sum, d) => sum + d.Students, 0);
    const peak = chartData.reduce(
      (max, d) => (d.Students > max.Students ? d : max),
      chartData[0]
    );
    return {
      totalSessions: chartData.length,
      avgAttendance: Math.round(total / chartData.length),
      peakCount: peak.Students,
      peakSession: `${peak.name} (${peak.date})`,
    };
  }, [chartData]);

  return (
    <div className="space-y-6 md:space-y-8 pb-20 md:pb-10">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-brand-prussian tracking-tight">
            Attendance Report
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Analyze student turnout and session-by-session engagement.
          </p>
        </div>

        {selectedClassId && (
          <button
            onClick={fetchAttendance}
            disabled={loadingData}
            className="inline-flex items-center gap-2 self-start sm:self-auto px-4 py-2.5 bg-white rounded-xl border border-slate-200/80 shadow-sm text-xs font-semibold text-slate-600 hover:text-brand-cerulean hover:border-brand-cerulean/40 transition-colors disabled:opacity-50"
          >
            <RefreshCw
              className={`w-4 h-4 ${loadingData ? "animate-spin text-brand-cerulean" : ""
                }`}
            />
            <span>Refresh</span>
          </button>
        )}
      </div>

      {/* INITIAL CLASS LOADING */}
      {loadingClasses ? (
        <AttendanceSkeleton />
      ) : classes.length === 0 ? (
        <div className="bg-amber-50 border border-amber-200/70 text-amber-800 p-5 rounded-2xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 text-amber-600" />
          <div>
            <p className="font-semibold text-sm">No classes available</p>
            <p className="text-xs text-amber-700/80 mt-0.5">
              Create a class and record attendance to view analytics here.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* CLASS SELECTOR BAR */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/70 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1 max-w-md">
              <div className="w-10 h-10 rounded-xl bg-brand-aliceBlue text-brand-cerulean flex items-center justify-center shrink-0">
                <BookOpen className="w-5 h-5" />
              </div>
              <div className="relative flex-1">
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-0.5">
                  Selected Class
                </label>
                <div className="relative">
                  <select
                    value={selectedClassId}
                    onChange={(e) => setSelectedClassId(e.target.value)}
                    className="w-full appearance-none bg-transparent pr-8 py-0.5 text-sm font-bold text-brand-prussian focus:outline-none cursor-pointer"
                  >
                    {classes.map((c) => (
                      <option key={c._id} value={c._id}>
                        {typeof c.batch === "object" && c.batch !== null
                          ? c.batch.name || "Unknown Batch"
                          : c.batch}{" "}
                        — {c.name} ({c.level})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            </div>

            {chartData.length > 0 && (
              <div className="text-xs text-slate-500 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-100 self-start sm:self-auto">
                Tracking{" "}
                <strong className="text-brand-prussian tabular-nums">
                  {chartData.length}
                </strong>{" "}
                recorded sessions
              </div>
            )}
          </div>

          {/* ERROR STATE */}
          {error ? (
            <div className="bg-rose-50 border border-rose-200/70 text-rose-700 p-5 rounded-2xl flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 shrink-0 text-rose-500" />
                <p className="text-sm font-medium">{error}</p>
              </div>
              <button
                onClick={fetchAttendance}
                className="px-3.5 py-1.5 bg-white text-rose-600 text-xs font-semibold rounded-lg border border-rose-200 hover:bg-rose-50 transition-colors"
              >
                Retry
              </button>
            </div>
          ) : loadingData ? (
            <AttendanceSkeleton />
          ) : (
            <div className="space-y-6">
              {/* KPI SUMMARY CARDS */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div className="relative overflow-hidden bg-white p-6 rounded-2xl border border-slate-200/70 shadow-sm">
                  <div className="pointer-events-none absolute -top-10 -right-10 w-28 h-28 rounded-full bg-blue-500/10 blur-2xl" />
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Total Sessions
                      </p>
                      <h3 className="text-3xl font-bold text-brand-prussian mt-2 tabular-nums">
                        {stats.totalSessions}
                      </h3>
                      <p className="text-xs text-slate-400 mt-2">
                        Completed classes
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-blue-50 text-blue-600 ring-1 ring-blue-100">
                      <CalendarCheck className="w-5 h-5" />
                    </div>
                  </div>
                </div>

                <div className="relative overflow-hidden bg-white p-6 rounded-2xl border border-slate-200/70 shadow-sm">
                  <div className="pointer-events-none absolute -top-10 -right-10 w-28 h-28 rounded-full bg-emerald-500/10 blur-2xl" />
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Avg. Attendance
                      </p>
                      <h3 className="text-3xl font-bold text-brand-prussian mt-2 tabular-nums">
                        {stats.avgAttendance}
                      </h3>
                      <p className="text-xs text-emerald-600 font-medium mt-2">
                        Students per session
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
                      <Users className="w-5 h-5" />
                    </div>
                  </div>
                </div>

                <div className="relative overflow-hidden bg-white p-6 rounded-2xl border border-slate-200/70 shadow-sm">
                  <div className="pointer-events-none absolute -top-10 -right-10 w-28 h-28 rounded-full bg-amber-500/10 blur-2xl" />
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Peak Turnout
                      </p>
                      <h3 className="text-3xl font-bold text-brand-prussian mt-2 tabular-nums">
                        {stats.peakCount}
                      </h3>
                      <p className="text-xs text-amber-600 font-medium mt-2">
                        Best: {stats.peakSession}
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-amber-50 text-amber-600 ring-1 ring-amber-100">
                      <Trophy className="w-5 h-5" />
                    </div>
                  </div>
                </div>
              </div>

              {/* CHART & SESSION LIST */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Bar Chart Card */}
                <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/70 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-base font-bold text-brand-prussian tracking-tight">
                        Attendance Trend
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Student headcount across recent sessions
                      </p>
                    </div>
                    {stats.avgAttendance > 0 && (
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span className="w-3 h-0.5 border-t-2 border-dashed border-amber-500 inline-block" />
                        <span>Avg ({stats.avgAttendance})</span>
                      </div>
                    )}
                  </div>

                  {chartData.length > 0 ? (
                    <div className="h-80 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={chartData}
                          margin={{ top: 10, right: 12, left: -20, bottom: 0 }}
                        >
                          <defs>
                            <linearGradient
                              id="attendanceBarGradient"
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop
                                offset="0%"
                                stopColor="#0ea5e9"
                                stopOpacity={0.95}
                              />
                              <stop
                                offset="100%"
                                stopColor="#0284c7"
                                stopOpacity={0.65}
                              />
                            </linearGradient>
                          </defs>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            vertical={false}
                            stroke="#f1f5f9"
                          />
                          <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: "#64748b", fontSize: 12, fontWeight: 500 }}
                            dy={10}
                          />
                          <YAxis
                            axisLine={false}
                            tickLine={false}
                            allowDecimals={false}
                            tick={{ fill: "#64748b", fontSize: 12 }}
                          />
                          <RechartsTooltip
                            content={<CustomTooltip />}
                            cursor={{ fill: "#f8fafc", radius: 8 }}
                          />
                          {stats.avgAttendance > 0 && (
                            <ReferenceLine
                              y={stats.avgAttendance}
                              stroke="#f59e0b"
                              strokeDasharray="4 4"
                              strokeWidth={1.5}
                            />
                          )}
                          <Bar
                            dataKey="Students"
                            fill="url(#attendanceBarGradient)"
                            radius={[8, 8, 2, 2]}
                            maxBarSize={36}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-80 text-center bg-slate-50/60 rounded-xl border border-dashed border-slate-200">
                      <BarChart3 className="w-10 h-10 text-slate-300 mb-3" />
                      <p className="text-sm font-semibold text-brand-prussian">
                        No sessions recorded yet
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        Attendance bars will appear here once sessions are logged.
                      </p>
                    </div>
                  )}
                </div>

                {/* Session Breakdown Card */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200/70 shadow-sm flex flex-col">
                  <div className="mb-4">
                    <h3 className="text-base font-bold text-brand-prussian tracking-tight">
                      Session Breakdown
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Individual turnout vs. peak
                    </p>
                  </div>

                  <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1 flex-1">
                    {chartData.length > 0 ? (
                      chartData.map((d, idx) => {
                        const pct =
                          stats.peakCount > 0
                            ? Math.round((d.Students / stats.peakCount) * 100)
                            : 0;
                        return (
                          <motion.div
                            key={`${d.name}-${idx}`}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: Math.min(idx * 0.04, 0.3) }}
                            className="p-3 rounded-xl bg-slate-50/80 hover:bg-brand-aliceBlue/40 border border-slate-100 transition-colors"
                          >
                            <div className="flex items-center justify-between gap-2 mb-2">
                              <div className="min-w-0">
                                <p className="font-semibold text-brand-prussian text-sm truncate">
                                  {d.title}
                                </p>
                                <p className="text-[11px] text-slate-400">
                                  {d.name} • {d.date}
                                </p>
                              </div>
                              <div className="bg-white px-2.5 py-1 rounded-lg border border-slate-200/70 shadow-sm text-xs font-bold text-brand-cerulean tabular-nums shrink-0">
                                {d.Students}{" "}
                                <span className="text-[10px] text-slate-400 font-normal">
                                  present
                                </span>
                              </div>
                            </div>
                            {/* Mini Relative Bar */}
                            <div className="h-1.5 w-full bg-slate-200/70 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-brand-cerulean rounded-full transition-all duration-500"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </motion.div>
                        );
                      })
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full py-10 text-center">
                        <p className="text-sm text-slate-400">No session data yet.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}