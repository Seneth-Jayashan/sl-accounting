import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import moment from "moment";
import {
  UserPlusIcon,
  BanknotesIcon,
  AcademicCapIcon,
  ArrowTrendingUpIcon,
  ClockIcon,
  ArrowPathIcon
} from "@heroicons/react/24/outline";

// Import Service & Type
import AdminService, { type AdminDashboardData } from "../../services/AdminService";

// --- Helper Components ---

interface StatCardProps {
  title: string;
  value: string | number;
  trend?: string;
  trendUp?: boolean;
  icon?: React.ElementType;
  color?: "blue" | "emerald" | "purple";
}

function StatCard({ title, value, trend, trendUp, icon: Icon, color = "blue" }: StatCardProps) {
  const colorClasses = {
    blue: "bg-blue-50 text-blue-600",
    emerald: "bg-emerald-50 text-emerald-600",
    purple: "bg-purple-50 text-purple-600",
  };

  return (
    <div className="bg-white rounded-2xl p-5 md:p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative overflow-hidden">
      <div className="flex justify-between items-start relative z-10">
        <div>
          <p className="text-xs md:text-sm font-medium text-gray-500 uppercase tracking-wide">{title}</p>
          <h3 className="text-2xl md:text-3xl font-bold text-brand-prussian mt-2 md:mt-3">{value}</h3>
        </div>
        {Icon && (
          <div className={`p-2 md:p-3 rounded-xl ${colorClasses[color]}`}>
            <Icon className="w-5 h-5 md:w-6 md:h-6" />
          </div>
        )}
      </div>
      {trend && (
        <div className="mt-4 flex items-center text-xs md:text-sm relative z-10">
          <span className={`flex items-center font-bold ${trendUp ? "text-green-600" : "text-red-600"}`}>
            <ArrowTrendingUpIcon className={`w-3 h-3 md:w-4 md:h-4 mr-1 ${!trendUp && "rotate-180"}`} />
            {trend}
          </span>
          <span className="text-gray-400 ml-2">vs last month</span>
        </div>
      )}
      
      {/* Background Decor for Mobile visual interest */}
      <div className={`absolute -bottom-4 -right-4 w-20 h-20 rounded-full opacity-10 ${colorClasses[color].split(' ')[0]}`} />
    </div>
  );
}

function QuickAction({ title, icon: Icon, onClick }: { title: string; icon: React.ElementType; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center justify-center p-4 bg-white border border-gray-100 rounded-xl hover:bg-gray-50 hover:border-brand-cerulean/30 transition-all group active:scale-95 shadow-sm"
    >
      <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-brand-aliceBlue text-brand-cerulean flex items-center justify-center mb-2 md:mb-3 group-hover:scale-110 transition-transform">
        <Icon className="w-5 h-5 md:w-6 md:h-6" />
      </div>
      <span className="text-xs md:text-sm font-semibold text-gray-700 text-center">{title}</span>
    </button>
  );
}

// --- Main Page Component ---

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AdminDashboardData | null>(null);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const dashboardData = await AdminService.getDashboardSummary();
      setData(dashboardData);
    } catch (error) {
      console.error("Failed to load dashboard:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center flex-col gap-4">
        <ArrowPathIcon className="w-8 h-8 text-brand-cerulean animate-spin opacity-50" />
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Loading Dashboard...</p>
      </div>
    );
  }

  if (!data) return <div className="p-10 text-center text-gray-500">Failed to load data.</div>;

  return (
    <div className="space-y-6 md:space-y-8 pb-20 md:pb-8"> 

      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-2 md:gap-0">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-brand-prussian">Dashboard Overview</h1>
          <p className="text-gray-500 text-xs md:text-sm mt-1">Welcome back, here's what's happening today.</p>
        </div>
        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-gray-100 shadow-sm w-fit">
          <ClockIcon className="w-3 h-3 text-brand-cerulean" />
          <p className="text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-widest">
            {moment().format("MMMM Do, YYYY")}
          </p>
        </div>
      </div>

      {/* STATS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        <StatCard
          title="Total Students"
          value={data.stats.totalStudents.toString()}
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
          value={data.stats.activeClasses.toString()}
          trend="Stable"
          trendUp={true}
          icon={AcademicCapIcon}
          color="purple"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">

        {/* LEFT COLUMN - MAIN CONTENT */}
        <div className="lg:col-span-2 space-y-6 md:space-y-8">

          {/* QUICK ACTIONS */}
          <section>
            <h2 className="text-base md:text-lg font-semibold text-brand-prussian mb-3 md:mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
              <QuickAction 
                title="Add Student" 
                icon={UserPlusIcon} 
                onClick={() => navigate('/admin/students')} 
              />
              <QuickAction 
                title="Record Payment" 
                icon={BanknotesIcon} 
                onClick={() => navigate('/admin/payments')} 
              />
              <QuickAction 
                title="Create Class" 
                icon={AcademicCapIcon} 
                onClick={() => navigate('/admin/classes/create')} 
              />
              <QuickAction 
                title="Upload Material" 
                icon={ClockIcon} 
                onClick={() => navigate('/admin/materials')} 
              />
            </div>
          </section>

          {/* RECENT ACTIVITY */}
          <section className="bg-white rounded-2xl p-5 md:p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-5 md:mb-6">
              <h2 className="text-base md:text-lg font-semibold text-brand-prussian">Recent Activity</h2>
              <button className="text-[10px] md:text-xs text-brand-cerulean hover:text-brand-prussian font-bold uppercase tracking-wide bg-brand-aliceBlue px-3 py-1 rounded-full">
                View All
              </button>
            </div>
            <div className="space-y-5 md:space-y-6">
              {data.recentActivity.length > 0 ? (
                data.recentActivity.map((item, index) => (
                  <div key={item._id || index} className="flex gap-3 md:gap-4">
                    <div className="relative mt-1">
                      <div className="w-2.5 h-2.5 rounded-full bg-brand-cerulean ring-4 ring-brand-aliceBlue"></div>
                      {/* Vertical Line */}
                      {index !== data.recentActivity.length - 1 && (
                        <div className="absolute top-3 left-[4px] w-[1px] h-full bg-gray-100 -z-10"></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {item.action} <span className="font-bold text-brand-prussian">{item.targetName}</span>
                      </p>
                      <p className="text-[10px] md:text-xs text-gray-400 mt-0.5">
                        {moment(item.createdAt).fromNow()}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-400 italic text-center py-4">No recent activity recorded.</p>
              )}
            </div>
          </section>

        </div>

        {/* RIGHT COLUMN - SIDE WIDGETS */}
        <div className="space-y-6 md:space-y-8">

          {/* TOP STUDENTS */}
          <section className="bg-white rounded-2xl p-5 md:p-6 shadow-sm border border-gray-100">
            <h2 className="text-base md:text-lg font-semibold text-brand-prussian mb-4">Top Contributors</h2>
            <div className="space-y-3">
              {data.topStudents.map((s) => (
                <div key={s._id} className="flex items-center justify-between p-2 md:p-3 rounded-xl hover:bg-brand-aliceBlue/30 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-cerulean to-brand-prussian flex items-center justify-center text-xs font-bold text-white shadow-sm shrink-0">
                      {s.firstName.charAt(0)}
                    </div>
                    <div className="truncate">
                      <div className="text-sm font-bold text-brand-prussian truncate">{s.firstName} {s.lastName}</div>
                      <div className="text-[10px] text-gray-500">{s.batch || "Student"}</div>
                    </div>
                  </div>
                  <div className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-lg shrink-0">
                    LKR {(s.totalPaid / 1000).toFixed(1)}k
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full mt-4 py-3 md:py-2 text-xs text-gray-400 hover:text-brand-cerulean font-bold border-t border-gray-100 uppercase tracking-widest transition-colors">
              View All Payments
            </button>
          </section>

          {/* UPCOMING CLASSES */}
          <section className="bg-gradient-to-br from-brand-prussian to-[#02121E] rounded-2xl p-5 md:p-6 text-white shadow-xl shadow-brand-prussian/20">
            <h2 className="text-base md:text-lg font-semibold mb-4 flex items-center gap-2">
              <AcademicCapIcon className="w-5 h-5 text-brand-jasmine" />
              Next Class
            </h2>
            {data.nextClass ? (
              <div className="bg-white/10 rounded-xl p-4 backdrop-blur-md border border-white/10">
                <div className="text-[10px] text-brand-jasmine mb-1 uppercase tracking-wider font-bold opacity-90">
                  {data.nextClass.subject}
                </div>
                <div className="text-lg md:text-xl font-bold tracking-tight mb-3 leading-tight">{data.nextClass.name}</div>
                <div className="flex items-center gap-2 text-xs md:text-sm text-gray-200 bg-black/30 px-3 py-2 rounded-lg w-fit">
                  <ClockIcon className="w-4 h-4 text-brand-cerulean" />
                  <span>{moment(data.nextClass.startTime).calendar()}</span>
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-400 italic bg-white/5 p-4 rounded-xl text-center">
                No upcoming classes scheduled.
              </div>
            )}
          </section>

        </div>
      </div>
    </div>
  );
}