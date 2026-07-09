import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import moment from "moment";
import {
  BellIcon,
  CalendarIcon,
  BanknotesIcon,
  VideoCameraIcon,
  ChevronLeftIcon,
  ChevronRightIcon
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

  // State for Calendar Month/Year navigation
  const [currentDate, setCurrentDate] = useState(moment());

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

  // --- Calendar Navigation Handlers ---
  const prevMonth = () => setCurrentDate(moment(currentDate).subtract(1, 'months'));
  const nextMonth = () => setCurrentDate(moment(currentDate).add(1, 'months'));

  // --- 2. Dynamic Calendar Logic ---
  const calendarGrid = useMemo(() => {
    const startOfMonth = moment(currentDate).startOf('month');
    const daysInMonth = moment(currentDate).daysInMonth();
    const startDay = Number(startOfMonth.format('d')); // 0 (Sun) - 6 (Sat)

    const days = [];

    // Empty slots for days before start of month
    for (let i = 0; i < startDay; i++) {
      days.push(<div key={`empty-${i}`} />);
    }

    // Actual days
    for (let d = 1; d <= daysInMonth; d++) {
      const currentDayStr = moment(currentDate).date(d).format("YYYY-MM-DD");
      // Check if the rendered day is the actual today's date
      const isToday = moment().isSame(currentDayStr, 'day');
      const hasSession = sessionDates.has(currentDayStr);

      days.push(
        <div key={d} className="flex flex-col items-center justify-center h-8 relative mt-1">
          <span className={`
            text-[11px] font-medium w-7 h-7 flex items-center justify-center rounded-full transition-colors cursor-pointer
            ${isToday ? "bg-[#0d4b5b] text-white font-bold shadow-md" : "text-gray-800 hover:bg-gray-100"}
          `}>
            {d}
          </span>
          {/* Dot for session */}
          {hasSession && !isToday && (
            <span className="w-1 h-1 bg-[#f88f89] rounded-full absolute -bottom-0.5"></span>
          )}
        </div>
      );
    }
    return days;
  }, [currentDate, sessionDates]);

  return (
    <aside className="hidden xl:flex flex-col w-[320px] h-[calc(100vh-2rem)] sticky top-4 gap-6 overflow-y-auto pb-4 custom-scrollbar">

      {/* --- User Profile Widget --- */}
      <div className="bg-white rounded-[1rem] p-3 pr-4 shadow-sm border border-gray-100 flex items-center justify-between mt-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#f4f7f9] flex items-center justify-center text-[#0d4b5b] font-bold text-lg overflow-hidden shrink-0">
            {user?.profileImage ? (
              <img src={BASE_URL + '/' + user.profileImage} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              user?.firstName?.charAt(0).toUpperCase() || "A"
            )}
          </div>
          <div className="leading-tight min-w-0">
            <h4 className="text-[13px] font-bold text-gray-900 truncate">{user?.firstName} {user?.lastName}</h4>
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">{user?.role || "Admin"}</p>
          </div>
        </div>
        <div className="pl-3 border-l border-gray-100 relative shrink-0">
          <button className="p-1.5 hover:bg-gray-50 rounded-lg transition-colors">
            <BellIcon className="w-5 h-5 text-gray-400" />
            {/* Notification Dot */}
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#f88f89] rounded-full border border-white"></span>
          </button>
        </div>
      </div>

      {/* --- Interactive Calendar Widget --- */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">

        {/* Calendar Header with Navigation */}
        <div className="flex justify-between items-center mb-6 px-1">
          <ChevronLeftIcon
            className="w-4 h-4 text-gray-400 cursor-pointer hover:text-gray-900 transition-colors"
            onClick={prevMonth}
          />
          <div className="text-sm font-bold text-gray-800">
            {currentDate.format("MMMM YYYY")}
          </div>
          <ChevronRightIcon
            className="w-4 h-4 text-gray-400 cursor-pointer hover:text-gray-900 transition-colors"
            onClick={nextMonth}
          />
        </div>

        {/* Days Header */}
        <div className="grid grid-cols-7 mb-3 text-center">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
            <span key={i} className="text-[10px] font-medium text-gray-400">{day}</span>
          ))}
        </div>

        {/* Dynamic Days Grid */}
        <div className="grid grid-cols-7 gap-y-2">
          {calendarGrid}
        </div>
      </div>

      {/* --- Recent Activity --- */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex-1 flex flex-col min-h-[300px]">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-[15px] font-bold text-gray-900">Recent Activity</h3>
          <Link to="/admin/reports" className="text-[11px] font-bold text-[#0d4b5b] hover:text-[#093946] transition-colors">View All</Link>
        </div>

        <div className="space-y-4 flex-1">
          {loading ? (
            <div className="text-center py-10 text-xs font-medium text-gray-400">Loading updates...</div>
          ) : activities.length === 0 ? (
            <div className="text-center py-10 text-xs font-medium text-gray-400">No recent activity.</div>
          ) : (
            activities.map((item) => (
              <div key={item.id} className="flex items-center justify-between group">
                <div className="flex items-center gap-4 min-w-0">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border border-gray-50 ${item.type === 'payment' ? 'bg-emerald-50 text-emerald-600' : 'bg-[#f4f7f9] text-[#0d4b5b]'
                    }`}>
                    {item.type === 'payment' ? <BanknotesIcon className="w-5 h-5 stroke-[1.5]" /> : <VideoCameraIcon className="w-5 h-5 stroke-[1.5]" />}
                  </div>
                  <div className="truncate">
                    <p className="text-xs font-bold text-gray-900 truncate">{item.title}</p>
                    <p className="text-[10px] text-gray-500 truncate mt-0.5">{item.subtitle}</p>
                  </div>
                </div>

                <div className="flex flex-col items-end shrink-0 ml-2">
                  <span className="text-[10px] text-gray-400">{moment(item.date).fromNow(true)}</span>
                  {item.amount && (
                    <span className="text-[10px] font-bold text-emerald-600 mt-1">+LKR {item.amount >= 1000 ? (item.amount / 1000).toFixed(1) + 'k' : item.amount}</span>
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