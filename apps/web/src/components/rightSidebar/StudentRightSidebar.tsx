import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import moment from "moment";
import { 
  BellIcon, 
  CalendarIcon, 
  VideoCameraIcon, 
  BanknotesIcon,
  ClockIcon
} from "@heroicons/react/24/outline";

// Context & Services
import { useAuth } from "../../contexts/AuthContext";
import SessionService from "../../services/SessionService";
import PaymentService from "../../services/PaymentService";
import EnrollmentService from "../../services/EnrollmentService";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

interface TimelineItem {
  id: string;
  type: 'session' | 'payment';
  title: string;
  subtitle: string;
  date: Date;
  status?: string; // for payments
  link?: string;   // for zoom/session start
}

export default function StudentRightSidebar() {
  const { user } = useAuth();
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [sessionDates, setSessionDates] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  // --- 1. Fetch Student Data ---
  useEffect(() => {
    async function fetchData() {
      if (!user?._id) return;

      try {
        // Parallel Fetch: Enrollments (to know which classes), Sessions, Payments
        // Note: Assuming SessionService.getAllSessions() filters by user or we filter manually based on enrollments.
        // For safety, we often fetch all relevant data. 
        
        // 1. Get My Enrollments to filter relevant sessions
        const enrollments = await EnrollmentService.getAllEnrollments(); // Assuming this returns logged-in user's enrollments by default or filterable
        const myClassIds = new Set(
            (Array.isArray(enrollments) ? enrollments : (enrollments as any).enrollments || [])
            .map((e: any) => typeof e.class === 'object' ? e.class._id : e.class)
        );

        // 2. Get Sessions & Payments
        const [allSessions, myPayments] = await Promise.all([
          SessionService.getAllSessions(),
          PaymentService.getMyPayments() // Assuming this exists, or use getAllPayments and filter
        ]);

        // 3. Filter Sessions for My Classes
        const mySessions = allSessions.filter((s: any) => myClassIds.has(s.class));

        // --- Prepare Calendar Data ---
        const dates = new Set<string>();
        mySessions.forEach((s: any) => {
          dates.add(moment(s.startAt).format("YYYY-MM-DD"));
        });
        setSessionDates(dates);

        // --- Prepare Timeline Data ---
        const now = new Date();

        // A. Future Sessions (Up Next)
        const futureSessions: TimelineItem[] = mySessions
          .filter((s: any) => new Date(s.startAt) > now)
          .map((s: any) => ({
            id: s._id,
            type: 'session',
            title: s.title || "Class Session",
            subtitle: moment(s.startAt).format("ddd, MMM DD • hh:mm A"),
            date: new Date(s.startAt),
            link: s.zoomStartUrl
          }));

        // B. Recent Payments
        const recentPayments: TimelineItem[] = (Array.isArray(myPayments) ? myPayments : [])
          .map((p: any) => ({
            id: p._id,
            type: 'payment',
            title: "Payment " + (p.status === 'completed' ? "Successful" : "Pending"),
            subtitle: `LKR ${p.amount.toLocaleString()} • ${p.method}`,
            date: new Date(p.paymentDate),
            status: p.status
          }));

        // Combine: Upcoming Sessions first, then Recent Payments
        // Sort sessions ASC (soonest first), payments DESC (newest first)
        futureSessions.sort((a, b) => a.date.getTime() - b.date.getTime());
        recentPayments.sort((a, b) => b.date.getTime() - a.date.getTime());

        // Take top 3 sessions and top 2 payments
        setTimeline([...futureSessions.slice(0, 3), ...recentPayments.slice(0, 2)]);

      } catch (error) {
        console.error("Student sidebar fetch error", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [user?._id]);

  // --- 2. Calendar Logic ---
  const calendarGrid = useMemo(() => {
    const startOfMonth = moment().startOf('month');
    const daysInMonth = moment().daysInMonth();
    const startDay = Number(startOfMonth.format('d')); 
    
    const days = [];
    for (let i = 0; i < startDay; i++) days.push(<div key={`empty-${i}`} />);

    for (let d = 1; d <= daysInMonth; d++) {
      const currentDayStr = moment().date(d).format("YYYY-MM-DD");
      const isToday = moment().isSame(currentDayStr, 'day');
      const hasSession = sessionDates.has(currentDayStr);

      days.push(
        <div key={d} className="flex flex-col items-center justify-center h-8 relative group cursor-default">
          <span className={`
            text-xs font-medium w-7 h-7 flex items-center justify-center rounded-full transition-all
            ${isToday ? "bg-brand-prussian text-white shadow-md" : "text-gray-700 group-hover:bg-brand-aliceBlue"}
            ${hasSession && !isToday ? "font-bold text-brand-cerulean" : ""}
          `}>
            {d}
          </span>
          {hasSession && !isToday && (
            <span className="w-1 h-1 bg-brand-cerulean rounded-full absolute bottom-1"></span>
          )}
        </div>
      );
    }
    return days;
  }, [sessionDates]);

  return (
    <aside className="hidden xl:flex flex-col w-80 h-[calc(100vh-2rem)] sticky top-4 gap-6 overflow-y-auto pb-4 scrollbar-hide">
      
      {/* --- User Profile Snippet --- */}
      <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-cerulean to-brand-prussian flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-brand-cerulean/20 overflow-hidden">
          {user?.profileImage ? (
             <img src={BASE_URL+'/'+user.profileImage} alt="Profile" className="w-full h-full object-cover" />
          ) : (
             user?.firstName?.charAt(0).toUpperCase() || "S"
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-brand-prussian truncate">Hi, {user?.firstName}!</h4>
          <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Student</p>
        </div>
        <Link to="/student/notifications" className="p-2 hover:bg-brand-aliceBlue rounded-full transition-colors relative group">
          <BellIcon className="w-6 h-6 text-gray-400 group-hover:text-brand-cerulean transition-colors" />
          <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </Link>
      </div>

      {/* --- Calendar Widget --- */}
      <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-brand-cerulean" />
            {moment().format("MMMM YYYY")}
          </h3>
        </div>
        
        <div className="grid grid-cols-7 mb-3 text-center">
          {['S','M','T','W','T','F','S'].map((day, i) => (
            <span key={i} className="text-[10px] font-bold text-gray-400 uppercase">{day}</span>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-y-1">
          {calendarGrid}
        </div>
      </div>

      {/* --- Up Next / Timeline --- */}
      <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-bold text-gray-800">Up Next</h3>
          <Link to="/student/schedule" className="text-xs font-bold text-brand-cerulean hover:underline">View All</Link>
        </div>

        <div className="space-y-6">
          {loading ? (
             <div className="flex flex-col items-center justify-center py-10 text-gray-400 gap-2">
                <div className="w-6 h-6 border-2 border-brand-cerulean/30 border-t-brand-cerulean rounded-full animate-spin"></div>
                <span className="text-xs">Loading schedule...</span>
             </div>
          ) : timeline.length === 0 ? (
             <div className="text-center py-8 bg-brand-aliceBlue/30 rounded-2xl border border-dashed border-brand-aliceBlue">
                <p className="text-xs text-gray-400 font-medium">No upcoming activities.</p>
             </div>
          ) : (
            timeline.map((item) => (
              <div key={`${item.type}-${item.id}`} className="flex gap-4 relative">
                {/* Connector Line */}
                <div className="absolute top-8 bottom-[-24px] left-4 w-px bg-gray-100 last:hidden"></div>

                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 border-2 border-white shadow-sm ${
                    item.type === 'session' ? 'bg-brand-cerulean text-white' : 
                    item.status === 'completed' ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'
                }`}>
                  {item.type === 'session' ? <VideoCameraIcon className="w-4 h-4"/> : <BanknotesIcon className="w-4 h-4"/>}
                </div>
                
                <div className="flex-1 min-w-0 pb-1">
                  <p className="text-xs font-bold text-brand-prussian truncate">{item.title}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5 font-medium">{item.subtitle}</p>
                  
                  {item.type === 'session' && (
                      <div className="flex items-center gap-1 mt-2 text-[10px] text-brand-cerulean font-bold bg-brand-aliceBlue w-fit px-2 py-1 rounded-md">
                          <ClockIcon className="w-3 h-3" />
                          {moment(item.date).fromNow()}
                      </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

    </aside>
  );
}