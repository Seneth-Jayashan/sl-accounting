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

  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (attendanceRate / 100) * circumference;
  const circleColor = attendanceRate >= 80 ? 'text-green-500' : attendanceRate >= 50 ? 'text-yellow-500' : 'text-red-500';

  return (
    <div className="space-y-8">
      {/* Premium Summary Card */}
      <div className="bg-gradient-to-br from-brand-prussian to-blue-900 rounded-[2.5rem] p-8 md:p-10 shadow-2xl relative overflow-hidden">
        {/* Abstract Background Elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-cerulean/20 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-[40px] translate-y-1/3 -translate-x-1/4"></div>

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="text-center md:text-left">
            <h3 className="text-2xl md:text-3xl font-black text-white tracking-tight">My Attendance</h3>
            <p className="text-brand-aliceBlue/70 mt-2 font-medium max-w-sm">
              Keep up the great work! Consistent attendance is the key to mastering your subjects.
            </p>
          </div>
          
          <div className="flex items-center gap-6 bg-white/10 backdrop-blur-md p-6 rounded-3xl border border-white/20">
            <div className="text-center px-2">
              <p className="text-xs text-brand-aliceBlue/60 uppercase tracking-widest font-bold mb-1">Sessions</p>
              <p className="text-3xl font-black text-white">{attendedCount} <span className="text-lg text-white/50">/ {totalCount}</span></p>
            </div>
            
            <div className="w-px h-16 bg-white/20"></div>
            
            <div className="relative w-24 h-24 flex items-center justify-center">
              <svg className="absolute inset-0 w-full h-full transform -rotate-90 drop-shadow-lg">
                <circle cx="48" cy="48" r={radius} stroke="currentColor" strokeWidth="8" fill="transparent" className="text-white/10" />
                <circle 
                  cx="48" cy="48" r={radius} 
                  stroke="currentColor" 
                  strokeWidth="8" 
                  fill="transparent" 
                  strokeDasharray={circumference} 
                  strokeDashoffset={strokeDashoffset} 
                  strokeLinecap="round"
                  className={`${circleColor} transition-all duration-1000 ease-out`} 
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-xl font-black text-white">{attendanceRate}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modern Attendance List */}
      <div>
        <h4 className="text-xl font-bold text-brand-prussian mb-6 ml-2">Session History</h4>
        
        {attendances.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {attendances.map((record, index) => (
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                key={record.sessionId} 
                className="bg-white border border-brand-aliceBlue p-6 rounded-[2rem] shadow-sm hover:shadow-xl transition-all duration-300 relative overflow-hidden group hover:-translate-y-1"
              >
                {/* Status Indicator Bar */}
                <div className={`absolute top-0 left-0 w-full h-1.5 ${record.isPresent ? 'bg-green-500' : 'bg-red-500'}`}></div>

                <div className="flex justify-between items-start mb-5 mt-2">
                  <div>
                    <span className="inline-block px-3 py-1 rounded-full bg-brand-aliceBlue text-brand-prussian text-[10px] font-black uppercase tracking-widest mb-3">
                      Session {record.index}
                    </span>
                    <h5 className="font-bold text-brand-prussian text-lg line-clamp-1">{record.title || `Class Session`}</h5>
                  </div>
                  <div className={`p-2.5 rounded-2xl ${record.isPresent ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
                    {record.isPresent ? <CheckCircle2 size={24} strokeWidth={2.5} /> : <XCircle size={24} strokeWidth={2.5} />}
                  </div>
                </div>

                <div className="flex items-center gap-3 text-sm font-bold text-gray-500 bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm text-brand-cerulean">
                    <Calendar size={16} />
                  </div>
                  <span>{moment(record.startAt).format("MMM DD, YYYY • hh:mm A")}</span>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="bg-white p-12 rounded-[2.5rem] shadow-sm border border-brand-aliceBlue text-center flex flex-col items-center justify-center">
            <div className="w-20 h-20 bg-brand-cerulean/10 text-brand-cerulean rounded-3xl flex items-center justify-center mb-6 shadow-inner">
              <Calendar size={36} strokeWidth={1.5} />
            </div>
            <h3 className="text-2xl font-black text-brand-prussian mb-3 tracking-tight">No Attendance History</h3>
            <p className="text-gray-500 max-w-md mx-auto font-medium">
              You haven't attended any sessions yet, or the class hasn't started. Your attendance records will appear here automatically.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
