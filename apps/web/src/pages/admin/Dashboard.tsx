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

import DashboardService, { type DashboardData } from "../../services/DashboardService";

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
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <h3 className="text-3xl font-bold text-brand-prussian mt-2">{value}</h3>
        </div>
        {Icon && (
          <div className={`p-3 rounded-xl ${colorClasses[color]}`}>
            <Icon className="w-6 h-6" />
          </div>
        )}
      </div>
      {trend && (
        <div className="mt-4 flex items-center text-sm">
          <span className={`flex items-center font-medium ${trendUp ? "text-green-600" : "text-red-600"}`}>
            <ArrowTrendingUpIcon className={`w-4 h-4 mr-1 ${!trendUp && "rotate-180"}`} />
            {trend}
          </span>
          <span className="text-gray-400 ml-2">vs last month</span>
        </div>
      )}
    </div>
  );
}

function QuickAction({ title, icon: Icon, onClick }: { title: string; icon: React.ElementType; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center justify-center p-4 bg-white border border-gray-100 rounded-xl hover:bg-gray-50 hover:border-brand-cerulean/30 transition-all group active:scale-95"
    >
      <div className="w-10 h-10 rounded-full bg-brand-aliceBlue text-brand-cerulean flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
        <Icon className="w-5 h-5" />
      </div>
      <span className="text-sm font-medium text-gray-700">{title}</span>
    </button>
  );
}

// --- Main Page Component ---

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      // In a real app, this fetches from the service created above
      const dashboardData = await DashboardService.getDashboardSummary();
      setData(dashboardData);
    } catch (error) {
      console.error("Failed to load dashboard:", error);
      // Optional: Add mock data fallback here if API fails during dev
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center flex-col gap-4">
        <ArrowPathIcon className="w-10 h-10 text-brand-cerulean animate-spin opacity-50" />
        <p className="text-sm font-medium text-gray-400 uppercase tracking-widest">Loading Overview...</p>
      </div>
    );
  }

  // Fallback if data is null (API error)
  if (!data) return <div className="p-10 text-center text-gray-500">Failed to load data.</div>;

  return (
    <div className="space-y-8 pb-20"> {/* REMOVED DashboardLayout Wrapper */}

      {/* HEADER SECTION */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-brand-prussian">Dashboard Overview</h1>
          <p className="text-gray-500 mt-1 text-sm">Welcome back, here's what's happening today.</p>
        </div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
          {moment().format("MMMM Do, YYYY")}
        </p>
      </div>

      

      {/* STATS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* LEFT COLUMN - MAIN CONTENT */}
        <div className="lg:col-span-2 space-y-8">

          {/* QUICK ACTIONS */}
          <section>
            <h2 className="text-lg font-semibold text-brand-prussian mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <QuickAction 
                title="Add Student" 
                icon={UserPlusIcon} 
                onClick={() => navigate('/admin/students/create')} 
              />
              <QuickAction 
                title="Record Payment" 
                icon={BanknotesIcon} 
                onClick={() => navigate('/admin/payments/create')} 
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
          <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-brand-prussian">Recent Activity</h2>
              <button className="text-xs text-brand-cerulean hover:text-brand-prussian font-bold uppercase tracking-wide">View All</button>
            </div>
            <div className="space-y-6">
              {data.recentActivity.length > 0 ? (
                data.recentActivity.map((item, index) => (
                  <div key={item._id || index} className="flex gap-4">
                    <div className="relative mt-1">
                      <div className="w-2 h-2 rounded-full bg-brand-cerulean ring-4 ring-brand-aliceBlue"></div>
                      {/* Vertical Line */}
                      {index !== data.recentActivity.length - 1 && (
                        <div className="absolute top-3 left-1 w-px h-full bg-gray-100 -z-10"></div>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {item.action} <span className="font-bold">{item.targetName}</span>
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {moment(item.createdAt).fromNow()}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-400 italic">No recent activity recorded.</p>
              )}
            </div>
          </section>

        </div>

        {/* RIGHT COLUMN - SIDE WIDGETS */}
        <div className="space-y-8">

          {/* TOP STUDENTS */}
          <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-brand-prussian mb-4">Top Performers</h2>
            <div className="space-y-4">
              {data.topStudents.map((s) => (
                <div key={s._id} className="flex items-center justify-between p-3 rounded-xl hover:bg-brand-aliceBlue/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-cerulean to-brand-prussian flex items-center justify-center text-xs font-bold text-white">
                      {s.firstName.charAt(0)}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-brand-prussian">{s.firstName} {s.lastName}</div>
                      <div className="text-xs text-gray-500">{s.batch}</div>
                    </div>
                  </div>
                  <div className="text-sm font-bold text-emerald-600">{s.averageScore}%</div>
                </div>
              ))}
            </div>
            <button className="w-full mt-4 py-2 text-xs text-gray-400 hover:text-brand-cerulean font-bold border-t border-gray-100 uppercase tracking-widest transition-colors">
              View Leaderboard
            </button>
          </section>

          {/* UPCOMING CLASSES */}
          <section className="bg-gradient-to-br from-brand-prussian to-[#02121E] rounded-2xl p-6 text-white shadow-xl shadow-brand-prussian/20">
            <h2 className="text-lg font-semibold mb-4">Next Class</h2>
            {data.nextClass ? (
              <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm border border-white/10">
                <div className="text-xs text-brand-jasmine mb-1 uppercase tracking-wider font-bold opacity-80">
                  {data.nextClass.subject}
                </div>
                <div className="text-xl font-bold tracking-tight mb-4">{data.nextClass.name}</div>
                <div className="flex items-center gap-2 text-sm text-gray-300 bg-black/20 p-2 rounded-lg w-fit">
                  <ClockIcon className="w-4 h-4" />
                  <span>{moment(data.nextClass.startTime).calendar()}</span>
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-400 italic bg-white/5 p-4 rounded-xl">
                No upcoming classes scheduled.
              </div>
            )}
          </section>

        </div>
      </div>
    </div>
  );
}