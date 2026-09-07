import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Calendar, CheckCircle2, XCircle } from "lucide-react";
import AttendanceService, { type MyAttendanceRecord } from "../../../../services/AttendanceService";
import moment from "moment";

interface AttendanceTabProps {
  classId: string;
}

export default function AttendanceTab({ classId }: AttendanceTabProps) {
  const [attendances, setAttendances] = useState<MyAttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;
    const fetchAttendance = async () => {
      try {
        const data = await AttendanceService.getMyClassAttendance(classId);
        if (isMounted) setAttendances(data);
      } catch (err) {
        console.error("Failed to fetch my attendance:", err);
        if (isMounted) setError("Failed to load attendance history.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchAttendance();
    return () => {
      isMounted = false;
    };
  }, [classId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-cerulean"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-500 p-4 rounded-xl border border-red-100 flex items-center justify-center">
        {error}
      </div>
    );
  }

  const attendedCount = attendances.filter(a => a.isPresent).length;
  const totalCount = attendances.length;
  const attendanceRate = totalCount === 0 ? 0 : Math.round((attendedCount / totalCount) * 100);

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <h3 className="text-xl font-bold text-brand-prussian">My Attendance</h3>
          <p className="text-gray-500 mt-1">Track your presence across all live sessions for this class.</p>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="text-center">
            <p className="text-sm text-gray-500 uppercase tracking-widest font-bold">Attended</p>
            <p className="text-3xl font-black text-brand-prussian mt-1">{attendedCount} / {totalCount}</p>
          </div>
          <div className="w-px h-12 bg-gray-200"></div>
          <div className="text-center">
            <p className="text-sm text-gray-500 uppercase tracking-widest font-bold">Rate</p>
            <p className={`text-3xl font-black mt-1 ${attendanceRate >= 80 ? 'text-green-500' : attendanceRate >= 50 ? 'text-yellow-500' : 'text-red-500'}`}>
              {attendanceRate}%
            </p>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-brand-aliceBlue/50 text-brand-prussian font-bold text-xs uppercase tracking-widest">
                <th className="px-6 py-4">Session</th>
                <th className="px-6 py-4">Date & Time</th>
                <th className="px-6 py-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {attendances.length > 0 ? (
                attendances.map((record, index) => (
                  <motion.tr 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    key={record.sessionId} 
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <p className="font-bold text-brand-prussian">Session {record.index}</p>
                      {record.title && <p className="text-xs text-gray-500 mt-0.5">{record.title}</p>}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar size={16} className="text-brand-cerulean/60" />
                        {moment(record.startAt).format("DD MMM YYYY, hh:mm A")}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center">
                        {record.isPresent ? (
                          <div className="flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1.5 rounded-lg text-sm font-bold">
                            <CheckCircle2 size={18} /> Present
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 bg-red-50 text-red-600 px-3 py-1.5 rounded-lg text-sm font-bold opacity-80">
                            <XCircle size={18} /> Absent
                          </div>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center text-gray-500">
                    No sessions have been scheduled yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
