import { useEffect, useState, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import moment from "moment";
import {
  CalendarIcon,
  BanknotesIcon,
  VideoCameraIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowPathIcon,
  ClockIcon,
  ArrowUpRightIcon,
} from "@heroicons/react/24/outline";

// Context & Services
import { useAuth } from "../../contexts/AuthContext";
import SessionService from "../../services/SessionService";
import PaymentService from "../../services/PaymentService";

interface ActivityItem {
  id: string;
  type: "payment" | "session";
  title: string;
  subtitle: string;
  date: Date;
  amount?: number;
  link: string;
}

interface CalendarSession {
  id: string;
  title: string;
  time: string;
}

const BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/+$/, "");

const formatAvatarUrl = (path?: string) => {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  const cleanPath = path.replace(/\\/g, "/").replace(/^\/+/, "");
  return `${BASE_URL}/${cleanPath}`;
};

export default function AdminRightSidebar() {
  const { user } = useAuth();

  // Data State
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [sessionsByDate, setSessionsByDate] = useState<
    Record<string, CalendarSession[]>
  >({});
  const [loading, setLoading] = useState(true);

  // Interactive UI State
  const [currentMonth, setCurrentMonth] = useState(() =>
    moment().startOf("month")
  );
  const [selectedDate, setSelectedDate] = useState<string>(() =>
    moment().format("YYYY-MM-DD")
  );
  const [activityFilter, setActivityFilter] = useState<
    "all" | "payment" | "session"
  >("all");

  // --- 1. Fetch Data ---
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [sessions, payments] = await Promise.all([
        SessionService.getAllSessions(),
        PaymentService.getAllPayments("completed"),
      ]);

      // A. Group Sessions by Date for Interactive Calendar
      const grouped: Record<string, CalendarSession[]> = {};
      (sessions || []).forEach((s: any) => {
        if (!s.startAt || s.isCancelled) return;
        const key = moment(s.startAt).format("YYYY-MM-DD");
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push({
          id: s._id,
          title: s.title || `Session ${s.index || ""}`.trim(),
          time: moment(s.startAt).format("h:mm A"),
        });
      });
      setSessionsByDate(grouped);

      // B. Merge Data for Activity Feed
      const sessionActivities: ActivityItem[] = (sessions || []).map(
        (s: any) => ({
          id: `session-${s._id}`,
          type: "session",
          title: s.title || "Class Session",
          subtitle: moment(s.startAt).format("MMM DD • h:mm A"),
          date: new Date(s.startAt),
          link: "/admin/sessions",
        })
      );

      const paymentActivities: ActivityItem[] = (payments || []).map(
        (p: any) => ({
          id: `payment-${p._id}`,
          type: "payment",
          title: "Payment Settled",
          subtitle: `${p.enrollment?.student?.firstName || "Student"
            } • ${String(p.method || "Manual").replace("_", " ")}`,
          date: new Date(p.paymentDate),
          amount: p.amount,
          link: "/admin/payments",
        })
      );

      const combined = [...sessionActivities, ...paymentActivities].sort(
        (a, b) => b.date.getTime() - a.date.getTime()
      );

      setActivities(combined);
    } catch (error) {
      console.error("Sidebar data fetch error", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- 2. Filtered Activities ---
  const visibleActivities = useMemo(() => {
    const list =
      activityFilter === "all"
        ? activities
        : activities.filter((a) => a.type === activityFilter);
    return list.slice(0, 4);
  }, [activities, activityFilter]);

  // --- 3. Calendar Grid ---
  const calendarDays = useMemo(() => {
    const startOfMonth = currentMonth.clone().startOf("month");
    const daysInMonth = currentMonth.daysInMonth();
    const startDay = startOfMonth.day();
    const todayStr = moment().format("YYYY-MM-DD");

    const cells: React.ReactNode[] = [];

    for (let i = 0; i < startDay; i++) {
      cells.push(<div key={`empty-${i}`} />);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = currentMonth.clone().date(d).format("YYYY-MM-DD");
      const isToday = dateStr === todayStr;
      const isSelected = dateStr === selectedDate;
      const hasSession = Boolean(sessionsByDate[dateStr]?.length);

      cells.push(
        <button
          key={dateStr}
          type="button"
          onClick={() => setSelectedDate(dateStr)}
          className={`relative flex flex-col items-center justify-center h-8 w-8 mx-auto rounded-xl text-xs font-semibold tabular-nums transition-all ${isSelected
              ? "bg-brand-prussian text-white shadow-sm"
              : isToday
                ? "bg-brand-aliceBlue text-brand-cerulean ring-1 ring-brand-cerulean/30"
                : "text-slate-700 hover:bg-slate-100"
            }`}
        >
          <span>{d}</span>
          {hasSession && (
            <span
              className={`w-1 h-1 rounded-full absolute bottom-1 ${isSelected ? "bg-brand-jasmine" : "bg-brand-cerulean"
                }`}
            />
          )}
        </button>
      );
    }

    return cells;
  }, [currentMonth, selectedDate, sessionsByDate]);

  const selectedDaySessions = sessionsByDate[selectedDate] || [];
  const avatarUrl = formatAvatarUrl(user?.profileImage);
  const initials = `${user?.firstName?.[0] || "A"}${user?.lastName?.[0] || ""
    }`.toUpperCase();

  return (
    <aside className="hidden xl:flex flex-col w-80 max-h-[calc(100vh-2rem)] sticky top-4 gap-4 overflow-y-auto pb-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
      {/* --- 1. USER PROFILE CARD --- */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/70 flex items-center gap-3.5 shrink-0">
        <div className="relative shrink-0">
          <div className="w-11 h-11 rounded-xl bg-brand-aliceBlue flex items-center justify-center text-brand-cerulean font-bold text-sm ring-1 ring-brand-cerulean/20 overflow-hidden">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              initials
            )}
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full ring-2 ring-white" />
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-sm text-brand-prussian truncate">
            {user?.firstName} {user?.lastName}
          </h4>
          <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">
            {user?.role || "Admin"}
          </p>
        </div>

        <button
          type="button"
          onClick={fetchData}
          disabled={loading}
          title="Refresh sidebar data"
          className="p-2 text-slate-400 hover:text-brand-cerulean hover:bg-brand-aliceBlue rounded-xl transition-colors disabled:opacity-50 shrink-0"
        >
          <ArrowPathIcon
            className={`w-4 h-4 ${loading ? "animate-spin text-brand-cerulean" : ""
              }`}
          />
        </button>
      </div>

      {/* --- 2. INTERACTIVE CALENDAR WIDGET --- */}
      <section className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/70 shrink-0 space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-brand-cerulean" />
            <h3 className="font-bold text-brand-prussian text-sm">
              {currentMonth.format("MMMM YYYY")}
            </h3>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() =>
                setCurrentMonth((m) => m.clone().subtract(1, "month"))
              }
              className="p-1.5 rounded-lg text-slate-400 hover:text-brand-prussian hover:bg-slate-100 transition-colors"
              title="Previous month"
            >
              <ChevronLeftIcon className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                setCurrentMonth(moment().startOf("month"));
                setSelectedDate(moment().format("YYYY-MM-DD"));
              }}
              className="px-2 py-1 rounded-lg text-[10px] font-semibold text-brand-cerulean hover:bg-brand-aliceBlue transition-colors"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => setCurrentMonth((m) => m.clone().add(1, "month"))}
              className="p-1.5 rounded-lg text-slate-400 hover:text-brand-prussian hover:bg-slate-100 transition-colors"
              title="Next month"
            >
              <ChevronRightIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Days Header */}
        <div className="grid grid-cols-7 text-center">
          {["S", "M", "T", "W", "T", "F", "S"].map((day, i) => (
            <span
              key={i}
              className="text-[10px] font-bold uppercase text-slate-400 pb-1"
            >
              {day}
            </span>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-y-1">{calendarDays}</div>

        {/* Selected Day Sessions Preview */}
        <div className="pt-3 border-t border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500">
              {moment(selectedDate).isSame(moment(), "day")
                ? "Today's Sessions"
                : moment(selectedDate).format("MMM DD, YYYY")}
            </span>
            <Link
              to="/admin/sessions"
              className="text-[11px] font-semibold text-brand-cerulean hover:underline"
            >
              Schedule
            </Link>
          </div>

          {selectedDaySessions.length === 0 ? (
            <p className="text-xs text-slate-400 bg-slate-50 rounded-xl px-3 py-2 text-center">
              No sessions scheduled
            </p>
          ) : (
            <div className="space-y-1.5">
              {selectedDaySessions.map((s) => (
                <Link
                  key={s.id}
                  to="/admin/sessions"
                  className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-brand-aliceBlue/50 hover:bg-brand-aliceBlue border border-brand-cerulean/15 transition-colors"
                >
                  <span className="text-xs font-semibold text-brand-prussian truncate">
                    {s.title}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-brand-cerulean shrink-0 tabular-nums">
                    <ClockIcon className="w-3 h-3" />
                    {s.time}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* --- 3. RECENT ACTIVITY FEED --- */}
      <section className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/70 shrink-0">
        <div className="flex items-center justify-between mb-3.5">
          <h3 className="font-bold text-sm text-brand-prussian">
            Recent Activity
          </h3>
          <Link
            to="/admin/reports"
            className="inline-flex items-center gap-0.5 text-xs font-semibold text-brand-cerulean hover:text-brand-prussian transition-colors"
          >
            <span>View All</span>
            <ArrowUpRightIcon className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200/60 mb-3.5">
          {(
            [
              { key: "all", label: "All" },
              { key: "payment", label: "Payments" },
              { key: "session", label: "Sessions" },
            ] as const
          ).map((tab) => {
            const active = activityFilter === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActivityFilter(tab.key)}
                className={`flex-1 py-1 rounded-lg text-[11px] font-semibold transition-all ${active
                    ? "bg-white text-brand-prussian shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                  }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Feed List */}
        <div className="space-y-2">
          {loading ? (
            <div className="space-y-3 animate-pulse">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-100 shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 w-2/3 bg-slate-100 rounded" />
                    <div className="h-2.5 w-1/2 bg-slate-50 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : visibleActivities.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400">
              No recent activity to display.
            </div>
          ) : (
            visibleActivities.map((item) => (
              <Link
                key={item.id}
                to={item.link}
                className="flex gap-3 items-start p-2 rounded-xl hover:bg-slate-50 transition-colors group"
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ring-1 ${item.type === "payment"
                      ? "bg-emerald-50 text-emerald-600 ring-emerald-100"
                      : "bg-blue-50 text-blue-600 ring-blue-100"
                    }`}
                >
                  {item.type === "payment" ? (
                    <BanknotesIcon className="w-4 h-4" />
                  ) : (
                    <VideoCameraIcon className="w-4 h-4" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-2">
                    <p className="text-xs font-semibold text-brand-prussian group-hover:text-brand-cerulean truncate transition-colors">
                      {item.title}
                    </p>
                    <span className="text-[10px] text-slate-400 whitespace-nowrap tabular-nums">
                      {moment(item.date).fromNow(true)}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5 capitalize">
                    {item.subtitle}
                  </p>
                  {item.amount !== undefined && (
                    <p className="text-[11px] font-bold text-emerald-600 mt-1 tabular-nums">
                      + LKR {Number(item.amount).toLocaleString()}
                    </p>
                  )}
                </div>
              </Link>
            ))
          )}
        </div>
      </section>
    </aside>
  );
}