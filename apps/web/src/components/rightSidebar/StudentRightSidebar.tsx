import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import moment from "moment";
import {
  Bell,
  Calendar,
  Video,
  CreditCard,
  Clock,
  ChevronRight,
  ExternalLink,
  Sparkles,
} from "lucide-react";

// Context & Services
import { useAuth } from "../../contexts/AuthContext";
import SessionService from "../../services/SessionService";
import PaymentService from "../../services/PaymentService";
import EnrollmentService from "../../services/EnrollmentService";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

interface TimelineItem {
  id: string;
  type: "session" | "payment";
  title: string;
  subtitle: string;
  date: Date;
  status?: string;
  link?: string;
}

const getAvatarUrl = (path?: string) => {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  const cleanPath = path.replace(/\\/g, "/").replace(/^\/+/, "");
  return `${BASE_URL}/${cleanPath}`;
};

export default function StudentRightSidebar() {
  const { user } = useAuth();
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [sessionDates, setSessionDates] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  // --- 1. Fetch Student Data ---
  useEffect(() => {
    let isMounted = true;

    async function fetchData() {
      if (!user?._id) return;

      try {
        const enrollments = await EnrollmentService.getMyEnrollments();
        const myClassIds = new Set(
          (Array.isArray(enrollments)
            ? enrollments
            : (enrollments as any).enrollments || []
          ).map((e: any) =>
            typeof e.class === "object" ? e.class._id : e.class
          )
        );

        const [allSessions, myPayments] = await Promise.all([
          SessionService.getAllSessions(),
          PaymentService.getMyPayments(),
        ]);

        if (!isMounted) return;

        const mySessions = allSessions.filter((s: any) =>
          myClassIds.has(s.class)
        );

        // Prepare Calendar Data
        const dates = new Set<string>();
        mySessions.forEach((s: any) => {
          dates.add(moment(s.startAt).format("YYYY-MM-DD"));
        });
        setSessionDates(dates);

        // Prepare Timeline Data
        const now = new Date();

        const futureSessions: TimelineItem[] = mySessions
          .filter((s: any) => new Date(s.startAt) > now)
          .map((s: any) => ({
            id: s._id,
            type: "session",
            title: s.title || "Class Session",
            subtitle: moment(s.startAt).format("ddd, MMM DD • hh:mm A"),
            date: new Date(s.startAt),
            link: s.zoomStartUrl,
          }));

        const recentPayments: TimelineItem[] = (
          Array.isArray(myPayments) ? myPayments : []
        ).map((p: any) => ({
          id: p._id,
          type: "payment",
          title:
            "Payment " + (p.status === "completed" ? "Successful" : "Pending"),
          subtitle: `LKR ${Number(p.amount).toLocaleString()} • ${p.method === "bank_transfer" ? "Bank Slip" : "Online"
            }`,
          date: new Date(p.paymentDate),
          status: p.status,
        }));

        futureSessions.sort((a, b) => a.date.getTime() - b.date.getTime());
        recentPayments.sort((a, b) => b.date.getTime() - a.date.getTime());

        setTimeline([
          ...futureSessions.slice(0, 3),
          ...recentPayments.slice(0, 2),
        ]);
      } catch (error) {
        console.error("Student sidebar fetch error", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchData();
    return () => {
      isMounted = false;
    };
  }, [user?._id]);

  // --- 2. Calendar Logic ---
  const { calendarGrid, sessionsThisMonth } = useMemo(() => {
    const startOfMonth = moment().startOf("month");
    const daysInMonth = moment().daysInMonth();
    const startDay = Number(startOfMonth.format("d"));

    const days = [];
    let monthSessionCount = 0;

    for (let i = 0; i < startDay; i++) {
      days.push(<div key={`empty-${i}`} />);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const currentDayStr = moment().date(d).format("YYYY-MM-DD");
      const isToday = moment().isSame(currentDayStr, "day");
      const hasSession = sessionDates.has(currentDayStr);

      if (hasSession) monthSessionCount++;

      days.push(
        <div
          key={d}
          className="flex flex-col items-center justify-center h-8 relative group cursor-default"
          title={hasSession ? "Class scheduled" : undefined}
        >
          <span
            className={`text-xs w-7 h-7 flex items-center justify-center rounded-xl transition-all ${isToday
                ? "bg-brand-prussian text-white font-extrabold shadow-sm ring-2 ring-brand-cerulean/30"
                : hasSession
                  ? "bg-brand-aliceBlue text-brand-cerulean font-extrabold"
                  : "text-gray-600 font-medium group-hover:bg-gray-100"
              }`}
          >
            {d}
          </span>
          {hasSession && (
            <span
              className={`w-1 h-1 rounded-full absolute bottom-0.5 ${isToday ? "bg-brand-jasmine" : "bg-brand-cerulean"
                }`}
            />
          )}
        </div>
      );
    }

    return { calendarGrid: days, sessionsThisMonth: monthSessionCount };
  }, [sessionDates]);

  return (
    <aside className="hidden xl:flex flex-col w-80 h-[calc(100vh-2rem)] sticky top-4 gap-5 overflow-y-auto pb-4 scrollbar-hide">
      {/* --- 1. USER PROFILE SNIPPET --- */}
      <div className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100 flex items-center gap-3.5">
        <Link
          to="/student/profile"
          className="flex items-center gap-3.5 flex-1 min-w-0 group"
        >
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-brand-cerulean to-brand-prussian flex items-center justify-center text-white font-extrabold text-base shadow-md shadow-brand-cerulean/20 overflow-hidden shrink-0 ring-2 ring-brand-aliceBlue group-hover:ring-brand-cerulean/40 transition-all">
            {user?.profileImage ? (
              <img
                src={getAvatarUrl(user.profileImage)}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              user?.firstName?.charAt(0).toUpperCase() || "S"
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h4 className="font-extrabold text-sm text-brand-prussian group-hover:text-brand-cerulean truncate transition-colors">
              Hi, {user?.firstName || "Student"}!
            </h4>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold mt-0.5">
              Student Portal
            </p>
          </div>
        </Link>

        <Link
          to="/student/notifications"
          aria-label="Notifications"
          className="w-10 h-10 rounded-xl bg-gray-50 hover:bg-brand-aliceBlue text-gray-500 hover:text-brand-cerulean flex items-center justify-center transition-colors relative shrink-0"
        >
          <Bell size={18} />
          <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
        </Link>
      </div>

      {/* --- 2. CALENDAR WIDGET --- */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-extrabold text-brand-prussian text-sm flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-brand-cerulean/10 text-brand-cerulean flex items-center justify-center">
              <Calendar size={14} />
            </span>
            <span>{moment().format("MMMM YYYY")}</span>
          </h3>

          {sessionsThisMonth > 0 && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-aliceBlue text-brand-cerulean">
              {sessionsThisMonth} {sessionsThisMonth === 1 ? "Day" : "Days"}
            </span>
          )}
        </div>

        <div className="grid grid-cols-7 mb-2 text-center">
          {["S", "M", "T", "W", "T", "F", "S"].map((day, i) => (
            <span
              key={i}
              className="text-[10px] font-extrabold text-gray-400 uppercase"
            >
              {day}
            </span>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-y-1">{calendarGrid}</div>

        {/* Mini Legend */}
        <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-[10px] font-semibold text-gray-400">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-brand-prussian" />
            Today
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-brand-cerulean" />
            Class Scheduled
          </span>
        </div>
      </div>

      {/* --- 3. UP NEXT / TIMELINE --- */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Sparkles size={15} className="text-brand-cerulean" />
            <h3 className="font-extrabold text-sm text-brand-prussian">
              Up Next
            </h3>
          </div>
          <Link
            to="/student/schedule"
            className="inline-flex items-center gap-0.5 text-xs font-bold text-brand-cerulean hover:text-brand-prussian transition-colors"
          >
            <span>View All</span>
            <ChevronRight size={13} />
          </Link>
        </div>

        <div className="space-y-4 flex-1">
          {loading ? (
            <div className="space-y-4 animate-pulse">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-3 items-start">
                  <div className="w-8 h-8 rounded-xl bg-gray-100 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3.5 bg-gray-200 rounded w-3/4" />
                    <div className="h-2.5 bg-gray-100 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : timeline.length === 0 ? (
            <div className="text-center py-8 px-4 bg-gray-50/70 rounded-2xl border border-dashed border-gray-200">
              <Calendar size={22} className="mx-auto text-gray-300 mb-2" />
              <p className="text-xs font-bold text-gray-500">
                All caught up!
              </p>
              <p className="text-[11px] text-gray-400 mt-0.5">
                No upcoming sessions or recent activity.
              </p>
            </div>
          ) : (
            timeline.map((item, idx) => {
              const isLast = idx === timeline.length - 1;
              const isSession = item.type === "session";

              return (
                <motion.div
                  key={`${item.type}-${item.id}`}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  className="flex gap-3 relative"
                >
                  {/* Connector Line */}
                  {!isLast && (
                    <div className="absolute top-9 bottom-[-16px] left-4 w-px bg-gray-100" />
                  )}

                  {/* Icon Node */}
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 z-10 shadow-2xs ${isSession
                        ? "bg-brand-cerulean text-white"
                        : item.status === "completed"
                          ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                          : "bg-amber-50 text-amber-600 border border-amber-100"
                      }`}
                  >
                    {isSession ? (
                      <Video size={14} />
                    ) : (
                      <CreditCard size={14} />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 pb-1">
                    <p className="text-xs font-extrabold text-brand-prussian truncate leading-snug">
                      {item.title}
                    </p>
                    <p className="text-[11px] text-gray-400 mt-0.5 font-medium truncate">
                      {item.subtitle}
                    </p>

                    {isSession && (
                      <div className="flex items-center justify-between gap-2 mt-2">
                        <span className="inline-flex items-center gap-1 text-[10px] text-brand-cerulean font-bold bg-brand-aliceBlue/80 px-2 py-0.5 rounded-lg">
                          <Clock size={10} />
                          {moment(item.date).fromNow()}
                        </span>

                        {item.link && (
                          <a
                            href={item.link}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[10px] font-bold text-white bg-brand-prussian hover:bg-brand-cerulean px-2 py-0.5 rounded-lg transition-colors"
                          >
                            <span>Join</span>
                            <ExternalLink size={9} />
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>
    </aside>
  );
}