import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { format } from "date-fns";
import {
  LayoutDashboard,
  PlayCircle,
  FolderOpen,
  MessageSquare,
  Megaphone,
  ArrowLeft,
  CreditCard,
  ClipboardList,
  CheckCircle2,
  Lock,
  Calendar,
  ShieldCheck,
} from "lucide-react";

// Services & Context
import ClassService, { type ClassData } from "../../../services/ClassService";
import SessionService, { type SessionData } from "../../../services/SessionService";
import EnrollmentService from "../../../services/EnrollmentService";
import { useAuth } from "../../../contexts/AuthContext";

// Tab Components
import OverviewTab from "./tabs/OverviewTab";
import RecordingsTab from "./tabs/RecordingsTab";
import ResourcesTab from "./tabs/ResourcesTab";
import AnnouncementsTab from "./tabs/ClassAnnouncementsTab";
import ChatTab from "./tabs/ChatTab";
import QuizTab from "./tabs/QuizTab";
import AttendanceTab from "./tabs/AttendanceTab";

const TABS = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "announcements", label: "News", icon: Megaphone },
  { id: "recordings", label: "Recordings", icon: PlayCircle },
  { id: "resources", label: "Resources", icon: FolderOpen },
  { id: "quizzes", label: "Quizzes", icon: ClipboardList },
  { id: "attendance", label: "Attendance", icon: CheckCircle2 },
  { id: "chat", label: "Chat", icon: MessageSquare },
] as const;

export default function ViewClass() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [classData, setClassData] = useState<ClassData | null>(null);
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);

  const currentMonthLabel = format(new Date(), "MMMM yyyy");

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      if (!id || !user) return;

      try {
        // 1. Check Payment Status First
        const enrollmentRes = await EnrollmentService.enrollInClass(id, user._id);
        const paidMonths = enrollmentRes.enrollment.paidMonths || [];
        const currentMonth = format(new Date(), "yyyy-MM");

        if (!paidMonths.includes(currentMonth)) {
          if (isMounted) {
            setAccessDenied(true);
            setLoading(false);
          }
          return;
        }

        // 2. If Paid, Load Class Content
        const [classRes, sessionsRes] = await Promise.all([
          ClassService.getClassById(id),
          SessionService.getSessionsByClassId(id),
        ]);

        if (isMounted) {
          const cls = Array.isArray(classRes) ? classRes[0] : classRes;
          setClassData(cls);

          const sess = Array.isArray(sessionsRes)
            ? sessionsRes
            : (sessionsRes as any)?.data || [];
          setSessions(sess);
        }
      } catch (err) {
        console.error("Failed to load class data", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();
    return () => {
      isMounted = false;
    };
  }, [id, user, navigate]);

  if (loading) return <LoadingState />;

  // --- RESTRICTED ACCESS VIEW ---
  if (accessDenied) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4 sm:p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="relative overflow-hidden bg-white rounded-[2rem] shadow-xl shadow-brand-prussian/10 border border-gray-100 max-w-md w-full text-center"
        >
          {/* Top Accent Banner */}
          <div className="bg-gradient-to-br from-brand-prussian to-brand-cerulean px-6 pt-8 pb-12 text-white relative">
            <div className="pointer-events-none absolute -top-12 -right-12 w-36 h-36 bg-brand-jasmine/20 rounded-full blur-2xl" />
            <div className="w-16 h-16 bg-white/15 backdrop-blur-md border border-white/20 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
              <Lock className="w-7 h-7 text-brand-jasmine" />
            </div>
          </div>

          {/* Card Body */}
          <div className="px-6 sm:px-8 pb-8 -mt-6 relative z-10">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-red-50 border border-red-100 text-red-600 text-xs font-bold uppercase tracking-wider mb-4 shadow-sm">
              <span>{currentMonthLabel} Fee Pending</span>
            </div>

            <h1 className="text-2xl font-extrabold text-brand-prussian tracking-tight mb-2">
              Class Access Locked
            </h1>
            <p className="text-gray-500 text-sm leading-relaxed mb-7">
              Please settle your monthly fee for{" "}
              <strong className="text-gray-800">{currentMonthLabel}</strong> to unlock
              live sessions, recordings, resources, and quizzes.
            </p>

            <button
              onClick={() => navigate(`/student/payment/create/${id}`)}
              className="w-full py-3.5 px-5 rounded-2xl font-bold text-sm text-white bg-brand-prussian hover:bg-brand-cerulean shadow-lg shadow-brand-prussian/20 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              <CreditCard size={18} />
              <span>Pay Now to Unlock</span>
            </button>

            <button
              onClick={() => navigate(-1)}
              className="mt-4 inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-brand-prussian font-semibold transition-colors"
            >
              <ArrowLeft size={15} />
              <span>Go Back</span>
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 space-y-6">
      {/* --- CLASS HERO BANNER --- */}
      <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-brand-prussian via-[#0d3a4b] to-brand-cerulean p-5 sm:p-7 text-white shadow-xl shadow-brand-prussian/15">
        <div className="pointer-events-none absolute -top-20 -right-16 w-72 h-72 rounded-full bg-brand-jasmine/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-1/4 w-64 h-64 rounded-full bg-white/10 blur-3xl" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          {/* Left: Back + Title + Badges */}
          <div className="flex items-start gap-3.5 min-w-0">
            <button
              onClick={() => navigate(-1)}
              aria-label="Go Back"
              className="mt-0.5 w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 flex items-center justify-center text-white transition-colors shrink-0 backdrop-blur-md"
            >
              <ArrowLeft size={18} />
            </button>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-400/20 border border-emerald-300/25 text-emerald-200 text-[11px] font-bold">
                  <ShieldCheck size={12} />
                  <span>{currentMonthLabel} Active</span>
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 border border-white/15 text-white/85 text-[11px] font-semibold">
                  <Calendar size={12} className="text-brand-jasmine" />
                  <span>{sessions.length} Sessions</span>
                </span>
              </div>

              <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight leading-snug truncate">
                {classData?.name || "Class Room"}
              </h1>
            </div>
          </div>

          {/* Right: Payment Action */}
          <button
            onClick={() => navigate(`/student/payment/create/${classData?._id || id}`)}
            className="inline-flex items-center justify-center gap-2 bg-brand-jasmine text-brand-prussian px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-white transition-all shadow-md active:scale-95 shrink-0 self-start md:self-center"
          >
            <CreditCard size={16} />
            <span>Payments</span>
          </button>
        </div>
      </section>

      {/* --- STICKY FLOATING TAB BAR --- */}
      <div className="sticky top-3 z-30">
        <div className="bg-white/90 backdrop-blur-md border border-gray-200/80 shadow-sm rounded-2xl p-1.5">
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              const Icon = tab.icon;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-colors outline-none shrink-0 ${isActive
                    ? "text-white"
                    : "text-gray-500 hover:text-brand-prussian hover:bg-gray-100/70"
                    }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="view-class-active-tab"
                      transition={{ type: "spring", stiffness: 380, damping: 32 }}
                      className="absolute inset-0 rounded-xl bg-brand-prussian shadow-sm"
                    />
                  )}
                  <Icon
                    size={16}
                    className={`relative z-10 ${isActive ? "text-brand-jasmine" : "text-gray-400"
                      }`}
                  />
                  <span className="relative z-10">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* --- TAB CONTENT AREA --- */}
      <div>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            {activeTab === "overview" && (
              <OverviewTab classData={classData} sessions={sessions} />
            )}
            {activeTab === "announcements" && <AnnouncementsTab classId={id!} />}
            {activeTab === "recordings" && <RecordingsTab sessions={sessions} />}
            {activeTab === "resources" && <ResourcesTab classId={id!} />}
            {activeTab === "quizzes" && <QuizTab classId={id!} />}
            {activeTab === "attendance" && <AttendanceTab classId={id!} />}
            {activeTab === "chat" && <ChatTab />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

const LoadingState = () => (
  <div className="space-y-6 animate-pulse pb-20">
    {/* Hero Skeleton */}
    <div className="h-36 rounded-[2rem] bg-gray-200" />
    {/* Tabs Skeleton */}
    <div className="h-14 rounded-2xl bg-white border border-gray-100 p-2 flex gap-2">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="h-full w-28 rounded-xl bg-gray-100" />
      ))}
    </div>
    {/* Content Skeleton */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 h-72 rounded-3xl bg-white border border-gray-100" />
      <div className="h-72 rounded-3xl bg-white border border-gray-100" />
    </div>
  </div>
);