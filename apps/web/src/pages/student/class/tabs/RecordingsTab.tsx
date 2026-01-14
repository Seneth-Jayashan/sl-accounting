import { useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { PlayCircle, Video, Calendar, Lock, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import EnrollmentService, { type EnrollmentResponse } from "../../../../services/EnrollmentService";

// Helper to format dates safely
const formatDate = (date: string) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

// Helper to get YYYY-MM from a date string
const getMonthString = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

export default function RecordingsTab({ sessions }: { sessions: any[] }) {
  const navigate = useNavigate();
  const [enrollment, setEnrollment] = useState<EnrollmentResponse | null>(null);
  const [loading, setLoading] = useState(true);

  // 1. Fetch Enrollment to get Paid History
  useEffect(() => {
    let isMounted = true;
    const fetchEnrollment = async () => {
      try {
        const myEnrollments = await EnrollmentService.getMyEnrollments();
        
        if (sessions.length > 0) {
            // Robustly find the matching enrollment ID
            const classId = typeof sessions[0].class === 'string' ? sessions[0].class : sessions[0].class._id;
            const match = myEnrollments.find((e: any) => 
                (typeof e.class === 'string' ? e.class : e.class._id) === classId
            );
            if (isMounted) setEnrollment(match || null);
        }
      } catch (err) {
        console.error("Failed to load enrollment rights", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    if (sessions.length > 0) fetchEnrollment();
    else setLoading(false);

    return () => { isMounted = false; };
  }, [sessions]);

  // 2. Filter & Sort Recordings
  const recordings = useMemo(() => {
    return sessions
      .filter(s => s.youtubeVideoId || s.recordingUrl)
      .sort((a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime());
  }, [sessions]);

  // 3. STRICT MONTHLY ACCESS LOGIC
  const getAccessStatus = (session: any) => {
    if (!enrollment) return { locked: true, reason: "Not Enrolled" };

    // A. Check Join Date (Optional: Prevent accessing content from before they joined at all)
    // You can disable this if you want back-payments to unlock old content regardless of join date.
    /*
    const sessionDate = new Date(session.startAt);
    const joinDate = new Date(enrollment.createdAt);
    if (sessionDate < joinDate) {
        return { locked: true, reason: "Session occurred before you joined" };
    }
    */

    // B. Check Payment for Specific Month
    const sessionMonth = getMonthString(session.startAt); // e.g. "2026-02"
    const paidMonths = enrollment.paidMonths || [];

    if (!paidMonths.includes(sessionMonth)) {
        // Format readable month name for the error message
        const monthName = new Date(session.startAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        return { locked: true, reason: `Payment required for ${monthName}` };
    }

    return { locked: false, reason: "" };
  };

  if (loading) {
    return <div className="py-20 text-center text-gray-400 animate-pulse">Verifying Access Rights...</div>;
  }

  if (recordings.length === 0) {
    return (
      <div className="text-center py-24 bg-white rounded-[2.5rem] border border-dashed border-brand-aliceBlue">
        <Video className="mx-auto text-brand-aliceBlue mb-4" size={48} strokeWidth={1.5} />
        <p className="text-gray-400 font-medium">No session recordings are available yet.</p>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
    >
      {recordings.map((session) => {
        const { locked, reason } = getAccessStatus(session);

        return (
            <div 
              key={session._id} 
              className={`group relative rounded-[2rem] p-6 border transition-all duration-300 ${
                  locked 
                  ? "bg-gray-50 border-gray-200" 
                  : "bg-white border-brand-aliceBlue shadow-sm hover:border-brand-cerulean/20 hover:shadow-md"
              }`}
            >
              <div className="flex items-start gap-4 mb-6">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 shrink-0 ${
                    locked 
                    ? "bg-gray-200 text-gray-400" 
                    : "bg-brand-aliceBlue text-brand-cerulean group-hover:bg-brand-cerulean group-hover:text-white"
                }`}>
                  {locked ? <Lock size={22} /> : <PlayCircle size={22} strokeWidth={2} />}
                </div>
                
                <div className="space-y-1">
                  <h4 className={`text-base font-semibold line-clamp-2 leading-snug transition-colors ${
                      locked ? "text-gray-400" : "text-brand-prussian group-hover:text-brand-cerulean"
                  }`}>
                    {session.title || `Session ${session.index}`}
                  </h4>
                  <div className="flex items-center gap-1.5 text-[11px] font-medium text-gray-400 uppercase tracking-wider">
                    <Calendar size={12} />
                    {formatDate(session.startAt)}
                  </div>
                </div>
              </div>
              
              {locked ? (
                <div className="flex flex-col gap-3">
                    <div className="w-full bg-gray-100 py-3.5 rounded-xl font-medium text-xs text-gray-500 flex items-center justify-center gap-2 border border-gray-200 cursor-not-allowed">
                        <AlertCircle size={14} /> {reason}
                    </div>
                    {/* Optional: Add Pay Button directly here */}
                    <button 
                        onClick={() => navigate(`/student/payment/create/${typeof session.class === 'string' ? session.class : session.class._id}`)}
                        className="text-xs font-bold text-brand-cerulean hover:underline text-center"
                    >
                        Pay Now to Unlock
                    </button>
                </div>
              ) : (
                <button 
                    onClick={() => navigate(`/student/class/recording/${session._id}`)}
                    className="w-full bg-brand-aliceBlue py-3.5 rounded-xl font-medium text-sm text-brand-prussian hover:bg-brand-prussian hover:text-white transition-all transform active:scale-[0.98]"
                >
                    Watch Session
                </button>
              )}
            </div>
        );
      })}
    </motion.div>
  );
}