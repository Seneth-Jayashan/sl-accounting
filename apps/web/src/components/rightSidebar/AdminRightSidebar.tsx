import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import moment from "moment";
import { 
  BellIcon, 
  CalendarIcon, 
  BanknotesIcon, 
  VideoCameraIcon 
} from "@heroicons/react/24/outline";

// Context & Services
import { useAuth } from "../../contexts/AuthContext";
import SessionService from "../../services/SessionService";
import PaymentService from "../../services/PaymentService";

// Helper Interface for the Activity Feed
interface ActivityItem {
  id: string;
  type: 'payment' | 'session';
  title: string;
  subtitle: string;
  date: Date;
  amount?: number;
}

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

export default function AdminRightSidebar() {
  const { user } = useAuth();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [sessionDates, setSessionDates] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  // --- 1. Fetch Data ---
  useEffect(() => {
    async function fetchData() {
      try {
        const [sessions, payments] = await Promise.all([
          SessionService.getAllSessions(),
          PaymentService.getAllPayments('completed') // Only show completed/recent
        ]);

        // A. Parse Session Dates for Calendar
        const dates = new Set<string>();
        sessions.forEach((s: any) => {
          dates.add(moment(s.startAt).format("YYYY-MM-DD"));
        });
        setSessionDates(dates);

        // B. Merge Data for Activity Feed
        const sessionActivities: ActivityItem[] = sessions.map((s: any) => ({
          id: s._id,
          type: 'session',
          title: "Class Session",
          subtitle: moment(s.startAt).format("MMM DD @ hh:mm A"),
          date: new Date(s.startAt)
        }));

        const paymentActivities: ActivityItem[] = payments.map((p: any) => ({
          id: p._id,
          type: 'payment',
          title: "Payment Received",
          subtitle: `${p.enrollment?.student?.firstName || 'Student'} - ${p.method}`,
          date: new Date(p.paymentDate),
          amount: p.amount
        }));

        // Combine, Sort (Newest First), and Slice
        const combined = [...sessionActivities, ...paymentActivities]
          .sort((a, b) => b.date.getTime() - a.date.getTime())
          .slice(0, 5); // Limit to top 5

        setActivities(combined);

      } catch (error) {
        console.error("Sidebar data fetch error", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // --- 2. Calendar Logic ---
  const calendarGrid = useMemo(() => {
    const startOfMonth = moment().startOf('month');
    const daysInMonth = moment().daysInMonth();
    const startDay = Number(startOfMonth.format('d')); // 0 (Sun) - 6 (Sat)
    
    const days = [];
    
    // Empty slots for days before start of month
    for (let i = 0; i < startDay; i++) {
      days.push(<div key={`empty-${i}`} />);
    }

    // Actual days
    for (let d = 1; d <= daysInMonth; d++) {
      const currentDayStr = moment().date(d).format("YYYY-MM-DD");
      const isToday = moment().isSame(currentDayStr, 'day');
      const hasSession = sessionDates.has(currentDayStr);

      days.push(
        <div key={d} className="flex flex-col items-center justify-center h-8 relative">
          <span className={`
            text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full
            ${isToday ? "bg-brand-prussian text-white shadow-md" : "text-gray-700"}
          `}>
            {d}
          </span>
          {/* Dot for session */}
          {hasSession && !isToday && (
            <span className="w-1 h-1 bg-brand-cerulean rounded-full absolute bottom-0.5"></span>
          )}
        </div>
      );
    }
    return days;
  }, [sessionDates]);

  return (
    <aside className="hidden xl:flex flex-col w-80 h-[calc(100vh-2rem)] sticky top-4 gap-6 overflow-y-auto pb-4">
      
      {/* --- User Profile --- */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-brand-aliceBlue flex items-center justify-center text-brand-prussian font-bold text-lg border border-brand-aliceBlue overflow-hidden">
          {user?.profileImage ? (
             <img src={BASE_URL+'/'+user.profileImage} alt="Profile" className="w-full h-full object-cover" />
          ) : (
             user?.firstName?.charAt(0).toUpperCase() || "A"
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-brand-prussian truncate">{user?.firstName} {user?.lastName}</h4>
          <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">{user?.role || "Admin"}</p>
        </div>
        <button className="p-2 hover:bg-gray-50 rounded-full transition-colors relative">
          <BellIcon className="w-6 h-6 text-gray-400" />
          <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>
      </div>

      {/* --- Calendar Widget --- */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-bold text-gray-800 text-sm">{moment().format("MMMM YYYY")}</h3>
          <CalendarIcon className="w-5 h-5 text-gray-400" />
        </div>
        
        {/* Days Header */}
        <div className="grid grid-cols-7 mb-2 text-center">
          {['S','M','T','W','T','F','S'].map((day, i) => (
            <span key={i} className="text-[10px] font-bold text-gray-400">{day}</span>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-y-2">
          {calendarGrid}
        </div>
      </div>

      {/* --- Recent Activity --- */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex-1">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-bold text-gray-800">Recent Activity</h3>
          <Link to="/admin/reports" className="text-xs font-bold text-brand-cerulean hover:underline">View All</Link>
        </div>

        <div className="space-y-5">
          {loading ? (
             <div className="text-center py-10 text-xs text-gray-400">Loading updates...</div>
          ) : activities.length === 0 ? (
             <div className="text-center py-10 text-xs text-gray-400">No recent activity.</div>
          ) : (
            activities.map((item) => (
              <div key={item.id} className="flex gap-4 items-start group cursor-default">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    item.type === 'payment' ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'
                }`}>
                  {item.type === 'payment' ? <BanknotesIcon className="w-4 h-4"/> : <VideoCameraIcon className="w-4 h-4"/>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <p className="text-xs font-bold text-brand-prussian truncate">{item.title}</p>
                    <span className="text-[10px] text-gray-400 whitespace-nowrap ml-2">{moment(item.date).fromNow(true)}</span>
                  </div>
                  <p className="text-xs text-gray-500 truncate mt-0.5">{item.subtitle}</p>
                  {item.amount && (
                      <p className="text-[10px] font-bold text-green-600 mt-1">+ LKR {item.amount.toLocaleString()}</p>
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