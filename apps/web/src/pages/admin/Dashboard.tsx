import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import moment from "moment";
import {
  UserPlusIcon,
  BanknotesIcon,
  AcademicCapIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ClockIcon,
  ArrowPathIcon,
  DocumentArrowUpIcon,
  ChevronRightIcon,
  CalendarDaysIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";

// Import Service & Type
import AdminService, { type AdminDashboardData } from "../../services/AdminService";

// --- Helper Components ---

interface StatCardProps {
  title: string;
  value: string | number;
  trend?: string;
  trendUp?: boolean;
  trendLabel?: string;
  icon?: React.ElementType;
  color?: "blue" | "emerald" | "purple";
}

function StatCard({
  title,
  value,
  trend,
  trendUp = true,
  trendLabel = "vs last month",
  icon: Icon,
  color = "blue",
}: StatCardProps) {
  const styles = {
    blue: {
      iconBg: "bg-blue-50 text-blue-600 ring-blue-100",
      glow: "from-blue-500/10 to-transparent",
    },
    emerald: {
      iconBg: "bg-emerald-50 text-emerald-600 ring-emerald-100",
      glow: "from-emerald-500/10 to-transparent",
    },
    purple: {
      iconBg: "bg-purple-50 text-purple-600 ring-purple-100",
      glow: "from-purple-500/10 to-transparent",
    },
  }[color];

  return (
    <div className="group relative bg-white rounded-2xl p-6 border border-slate-200/70 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden">
      {/* Subtle Top-Right Ambient Glow */}
      <div
        className={`pointer-events-none absolute -top-10 -right-10 w-32 h-32 rounded-full bg-gradient-to-br ${styles.glow} blur-2xl opacity-70 group-hover:opacity-100 transition-opacity`}
      />

      <div className="flex items-start justify-between relative z-10">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            {title}
          </p>
          <h3 className="text-3xl font-bold text-brand-prussian mt-2 tracking-tight tabular-nums">
            {value}
          </h3>
        </div>
        {Icon && (
          <div className={`p-3 rounded-xl ring-1 ${styles.iconBg}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      {trend && (
        <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs relative z-10">
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-semibold ring-1 ${trendUp
                ? "bg-emerald-50 text-emerald-700 ring-emerald-600/15"
                : "bg-rose-50 text-rose-700 ring-rose-600/15"
              }`}
          >
            {trendUp ? (
              <ArrowTrendingUpIcon className="w-3.5 h-3.5" />
            ) : (
              <ArrowTrendingDownIcon className="w-3.5 h-3.5" />
            )}
            {trend}
          </span>
          <span className="text-slate-400 font-medium">{trendLabel}</span>
        </div>
      )}
    </div>
  );
}

interface QuickActionProps {
  title: string;
  subtitle: string;
  icon: React.ElementType;
  onClick?: () => void;
}

function QuickAction({ title, subtitle, icon: Icon, onClick }: QuickActionProps) {
  return (
    <button
      onClick={onClick}
      className="group flex flex-col items-start text-left p-4 bg-white border border-slate-200/70 rounded-2xl hover:border-brand-cerulean/40 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 active:scale-[0.98]"
    >
      <div className="w-full flex items-center justify-between mb-3">
        <div className="w-10 h-10 rounded-xl bg-brand-aliceBlue text-brand-cerulean flex items-center justify-center group-hover:bg-brand-cerulean group-hover:text-white transition-colors duration-200">
          <Icon className="w-5 h-5" />
        </div>
        <ChevronRightIcon className="w-4 h-4 text-slate-300 group-hover:text-brand-cerulean group-hover:translate-x-0.5 transition-all" />
      </div>
      <span className="text-sm font-semibold text-brand-prussian">{title}</span>
      <span className="text-xs text-slate-400 mt-0.5">{subtitle}</span>
    </button>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-pulse pb-12">
      <div className="flex justify-between items-end">
        <div className="space-y-2">
          <div className="h-7 w-56 bg-slate-200 rounded-lg" />
          <div className="h-4 w-72 bg-slate-100 rounded-md" />
        </div>
        <div className="h-9 w-40 bg-slate-100 rounded-full" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-36 bg-white rounded-2xl border border-slate-100 p-6">
            <div className="h-4 w-24 bg-slate-200 rounded mb-4" />
            <div className="h-8 w-32 bg-slate-200 rounded" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 bg-white rounded-2xl border border-slate-100" />
            ))}
          </div>
          <div className="h-72 bg-white rounded-2xl border border-slate-100" />
        </div>
        <div className="space-y-6">
          <div className="h-64 bg-white rounded-2xl border border-slate-100" />
          <div className="h-48 bg-slate-200 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

// --- Main Page Component ---

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<AdminDashboardData | null>(null);

  const greeting = useMemo(() => {
    const hour = moment().hour();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  }, []);

  const fetchDashboardData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const dashboardData = await AdminService.getDashboardSummary();
      setData(dashboardData);
    } catch (error) {
      console.error("Failed to load dashboard:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (loading) return <DashboardSkeleton />;

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center px-4">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center mb-4">
          <ExclamationTriangleIcon className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-brand-prussian">Unable to load dashboard</h2>
        <p className="text-sm text-slate-500 mt-1 max-w-sm">
          We ran into an issue fetching your latest metrics. Please check your connection and try again.
        </p>
        <button
          onClick={() => fetchDashboardData()}
          className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-prussian text-white text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          <ArrowPathIcon className="w-4 h-4" />
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20 md:pb-10">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-brand-prussian tracking-tight">
            {greeting}, Admin
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Here is a live snapshot of your students, classes, and revenue.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <div className="flex items-center gap-2 bg-white px-3.5 py-2 rounded-xl border border-slate-200/70 shadow-sm">
            <CalendarDaysIcon className="w-4 h-4 text-brand-cerulean" />
            <span className="text-xs font-semibold text-slate-600">
              {moment().format("ddd, MMM Do, YYYY")}
            </span>
          </div>
          <button
            onClick={() => fetchDashboardData(true)}
            disabled={refreshing}
            title="Refresh dashboard"
            className="p-2 bg-white rounded-xl border border-slate-200/70 shadow-sm text-slate-500 hover:text-brand-cerulean hover:border-brand-cerulean/40 transition-colors disabled:opacity-50"
          >
            <ArrowPathIcon className={`w-4 h-4 ${refreshing ? "animate-spin text-brand-cerulean" : ""}`} />
          </button>
        </div>
      </div>

      {/* STATS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
        <StatCard
          title="Total Students"
          value={data.stats.totalStudents.toLocaleString()}
          trend={`${data.stats.studentGrowth > 0 ? "+" : ""}${data.stats.studentGrowth}%`}
          trendUp={data.stats.studentGrowth >= 0}
          icon={UserPlusIcon}
          color="blue"
        />
        <StatCard
          title="Total Revenue"
          value={`LKR ${(data.stats.totalRevenue / 1000).toFixed(1)}k`}
          trend={`${data.stats.revenueGrowth > 0 ? "+" : ""}${data.stats.revenueGrowth}%`}
          trendUp={data.stats.revenueGrowth >= 0}
          icon={BanknotesIcon}
          color="emerald"
        />
        <StatCard
          title="Active Classes"
          value={data.stats.activeClasses.toLocaleString()}
          trend="On Track"
          trendUp={true}
          trendLabel="Current term"
          icon={AcademicCapIcon}
          color="purple"
        />
      </div>

      {/* MAIN BENTO GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        {/* LEFT COLUMN */}
        <div className="lg:col-span-2 space-y-6 md:space-y-8">
          {/* QUICK ACTIONS */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-brand-prussian tracking-tight">
                Quick Actions
              </h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 md:gap-4">
              <QuickAction
                title="Add Student"
                subtitle="Enroll new profile"
                icon={UserPlusIcon}
                onClick={() => navigate("/admin/students")}
              />
              <QuickAction
                title="Payment"
                subtitle="Log tuition fee"
                icon={BanknotesIcon}
                onClick={() => navigate("/admin/payments")}
              />
              <QuickAction
                title="New Class"
                subtitle="Schedule session"
                icon={AcademicCapIcon}
                onClick={() => navigate("/admin/classes/create")}
              />
              <QuickAction
                title="Materials"
                subtitle="Upload resources"
                icon={DocumentArrowUpIcon}
                onClick={() => navigate("/admin/materials")}
              />
            </div>
          </section>

          {/* RECENT ACTIVITY */}
          <section className="bg-white rounded-2xl p-6 border border-slate-200/70 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-base font-bold text-brand-prussian tracking-tight">
                  Recent Activity
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Latest actions across your institution
                </p>
              </div>
              <button
                onClick={() => navigate("/admin/activity")}
                className="text-xs font-semibold text-brand-cerulean hover:text-brand-prussian bg-brand-aliceBlue/80 hover:bg-brand-aliceBlue px-3.5 py-1.5 rounded-full transition-colors"
              >
                View All
              </button>
            </div>

            {data.recentActivity.length > 0 ? (
              <div className="relative space-y-1">
                {data.recentActivity.map((item, index) => (
                  <div
                    key={item._id || index}
                    className="group relative flex gap-4 p-2.5 -mx-2.5 rounded-xl hover:bg-slate-50/80 transition-colors"
                  >
                    <div className="relative flex flex-col items-center mt-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-brand-cerulean ring-4 ring-brand-aliceBlue z-10" />
                      {index !== data.recentActivity.length - 1 && (
                        <span className="w-px flex-1 bg-slate-200/80 my-1" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 pb-2">
                      <p className="text-sm text-slate-700 leading-snug">
                        {item.action}{" "}
                        <span className="font-semibold text-brand-prussian">
                          {item.targetName}
                        </span>
                      </p>
                      <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                        <ClockIcon className="w-3.5 h-3.5" />
                        {moment(item.createdAt).fromNow()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 bg-slate-50/60 rounded-xl border border-dashed border-slate-200">
                <p className="text-sm text-slate-400">No recent activity recorded yet.</p>
              </div>
            )}
          </section>
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-6 md:space-y-8">
          {/* NEXT CLASS HERO CARD */}
          <section className="relative overflow-hidden bg-gradient-to-br from-brand-prussian via-[#07273D] to-[#02121E] rounded-2xl p-6 text-white shadow-lg shadow-brand-prussian/20">
            {/* Decorative Blur Orbs */}
            <div className="pointer-events-none absolute -top-12 -right-12 w-36 h-36 rounded-full bg-brand-cerulean/25 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-brand-jasmine/15 blur-2xl" />

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-sm font-semibold tracking-wide flex items-center gap-2 text-white/90">
                  <SparklesIcon className="w-4 h-4 text-brand-jasmine" />
                  Up Next
                </h2>
                {data.nextClass && (
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold bg-white/10 text-brand-jasmine px-2.5 py-1 rounded-full border border-white/10">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-jasmine animate-pulse" />
                    Scheduled
                  </span>
                )}
              </div>

              {data.nextClass ? (
                <div className="bg-white/[0.07] rounded-xl p-4 backdrop-blur-md border border-white/10">
                  <div className="text-[11px] text-brand-jasmine uppercase tracking-wider font-bold mb-1">
                    {data.nextClass.subject}
                  </div>
                  <div className="text-lg font-bold tracking-tight leading-snug mb-4">
                    {data.nextClass.name}
                  </div>
                  <div className="flex items-center justify-between gap-2 pt-3 border-t border-white/10">
                    <div className="flex items-center gap-2 text-xs text-slate-200">
                      <ClockIcon className="w-4 h-4 text-brand-cerulean shrink-0" />
                      <span>{moment(data.nextClass.startTime).calendar()}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-slate-300 bg-white/5 p-5 rounded-xl border border-white/10 text-center">
                  No upcoming classes scheduled.
                </div>
              )}
            </div>
          </section>

          {/* TOP CONTRIBUTORS */}
          <section className="bg-white rounded-2xl p-6 border border-slate-200/70 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-base font-bold text-brand-prussian tracking-tight">
                  Top Contributors
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">Highest tuition paid</p>
              </div>
            </div>

            {data.topStudents.length > 0 ? (
              <div className="space-y-2">
                {data.topStudents.map((s, idx) => (
                  <div
                    key={s._id}
                    className="flex items-center justify-between p-2.5 -mx-2 rounded-xl hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative shrink-0">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-brand-cerulean to-brand-prussian flex items-center justify-center text-xs font-bold text-white shadow-sm">
                          {s.firstName.charAt(0)}
                        </div>
                        <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-white text-[10px] font-bold text-slate-600 ring-1 ring-slate-200 flex items-center justify-center">
                          {idx + 1}
                        </span>
                      </div>
                      <div className="truncate">
                        <div className="text-sm font-semibold text-brand-prussian truncate">
                          {s.firstName} {s.lastName}
                        </div>
                        <div className="text-xs text-slate-400 truncate">
                          {s.batch || "Student"}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs font-bold text-emerald-700 bg-emerald-50 ring-1 ring-emerald-600/15 px-2.5 py-1 rounded-lg shrink-0 tabular-nums">
                      LKR {(s.totalPaid / 1000).toFixed(1)}k
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400 text-center py-6">No payment data yet.</p>
            )}

            <button
              onClick={() => navigate("/admin/payments")}
              className="w-full mt-5 py-2.5 text-xs font-semibold text-brand-prussian bg-slate-50 hover:bg-brand-aliceBlue hover:text-brand-cerulean rounded-xl transition-colors flex items-center justify-center gap-1"
            >
              View All Payments
              <ChevronRightIcon className="w-3.5 h-3.5" />
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}