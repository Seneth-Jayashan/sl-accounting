import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from "recharts";
import { Loader2, AlertCircle } from "lucide-react";

import ClassService, { type ClassData } from "../../../services/ClassService";
import AttendanceService, { type ClassAttendanceSummary } from "../../../services/AttendanceService";
import moment from "moment";

export default function AttendanceReport() {
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [attendanceData, setAttendanceData] = useState<ClassAttendanceSummary | null>(null);
  
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState("");

  // Fetch all classes on mount
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const response = await ClassService.getAllClasses();
        const data: ClassData[] = Array.isArray(response) ? response : (response as any).classes || [];
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
  useEffect(() => {
    if (!selectedClassId) return;

    const fetchAttendance = async () => {
      setLoadingData(true);
      setError("");
      try {
        const data = await AttendanceService.getClassAttendanceSummary(selectedClassId);
        setAttendanceData(data);
      } catch (err) {
        console.error("Failed to fetch attendance summary:", err);
        setError("Failed to load attendance report for the selected class.");
      } finally {
        setLoadingData(false);
      }
    };

    fetchAttendance();
  }, [selectedClassId]);

  // Transform data for recharts
  const chartData = attendanceData?.sessionSummary.map(session => ({
    name: `S${session.index}`,
    date: moment(session.startAt).format("MMM DD"),
    title: session.title || `Session ${session.index}`,
    Students: session.attendanceCount || 0
  })) || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-brand-prussian">Attendance Report</h2>
          <p className="text-gray-500">View attendance trends for your classes</p>
        </div>
      </div>

      {loadingClasses ? (
        <div className="flex justify-center items-center h-40">
          <Loader2 className="animate-spin text-brand-cerulean w-8 h-8" />
        </div>
      ) : classes.length === 0 ? (
        <div className="bg-yellow-50 text-yellow-700 p-4 rounded-xl flex items-center gap-3">
          <AlertCircle size={20} />
          <p>No classes available to report on.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Controls */}
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 items-end">
            <div className="w-full md:w-1/3">
              <label className="block text-sm font-semibold text-brand-prussian mb-1">Select Class</label>
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-cerulean"
              >
                {classes.map(c => (
                  <option key={c._id} value={c._id}>
                    {typeof c.batch === 'object' && c.batch !== null ? c.batch.name || 'Unknown Batch' : c.batch} - {c.name} ({c.level})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Chart & Data */}
          {error ? (
            <div className="bg-red-50 text-red-500 p-4 rounded-xl border border-red-100">
              {error}
            </div>
          ) : loadingData ? (
            <div className="flex justify-center items-center h-64 bg-white rounded-2xl border border-gray-100">
              <Loader2 className="animate-spin text-brand-cerulean w-8 h-8" />
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Chart Section */}
              <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <h3 className="text-lg font-bold text-brand-prussian mb-6">Attendance Trend</h3>
                {chartData.length > 0 ? (
                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                        <XAxis 
                          dataKey="name" 
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: '#6b7280', fontSize: 12 }}
                          dy={10}
                        />
                        <YAxis 
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: '#6b7280', fontSize: 12 }}
                        />
                        <RechartsTooltip 
                          cursor={{ fill: '#f9fafb' }}
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Legend wrapperStyle={{ paddingTop: '20px' }}/>
                        <Bar 
                          dataKey="Students" 
                          fill="#38bdf8" 
                          radius={[4, 4, 0, 0]}
                          barSize={32}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-80 text-gray-400">
                    <AlertCircle size={48} className="mb-4 opacity-50" />
                    <p>No sessions found for this class yet.</p>
                  </div>
                )}
              </div>

              {/* Data Table Section */}
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <h3 className="text-lg font-bold text-brand-prussian mb-4">Summary Table</h3>
                
                <div className="space-y-3 max-h-[320px] overflow-y-auto pr-2">
                  {chartData.length > 0 ? (
                    chartData.map((d, idx) => (
                      <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        key={idx} 
                        className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100"
                      >
                        <div>
                          <p className="font-bold text-brand-prussian text-sm">{d.name}</p>
                          <p className="text-xs text-gray-500">{d.date}</p>
                        </div>
                        <div className="bg-white px-3 py-1 rounded-lg border border-gray-100 shadow-sm font-bold text-brand-cerulean">
                          {d.Students} <span className="text-xs text-gray-400 font-normal">present</span>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-4">No data to display</p>
                  )}
                </div>
              </div>

            </div>
          )}
        </div>
      )}
    </div>
  );
}
