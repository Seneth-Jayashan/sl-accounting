import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import moment from "moment";
import {
  UserPlusIcon,
  BanknotesIcon,
  AcademicCapIcon,
  ArrowUpTrayIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  BookOpenIcon,
  ArrowPathIcon
} from "@heroicons/react/24/outline";

// Import Service & Type
import AdminService, { type AdminDashboardData } from "../../services/AdminService";

// --- Helper Components ---

interface StatCardProps {
  title: string;
  value: string | number;
  trend: string;
  icon: React.ElementType;
}

function StatCard({ title, value, trend, icon: Icon }: StatCardProps) {
  return (
    <div className="bg-white rounded-[1.25rem] p-5 shadow-sm border border-gray-100 flex flex-col min-h-[120px] hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            {title}
          </p>
          <h3 className="text-3xl font-black text-[#0d4b5b] mt-1">
            {value}
          </h3>
        </div>

        <div className="p-2 bg-[#f4f7f9] rounded-xl text-[#0d4b5b]">
          <Icon className="w-6 h-6 stroke-[1.5]" />
        </div>
      </div>

      <div className="text-[11px] text-gray-400 font-medium mt-auto pt-3">
        <span className="text-[#0d4b5b] font-bold">{trend}</span> vs last month
      </div>
    </div>
  );
}

function QuickAction({ title, icon: Icon, onClick }: { title: string; icon: React.ElementType; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center justify-center p-4 bg-white border border-gray-100 rounded-[1.25rem] hover:bg-gray-50 transition-all active:scale-95 shadow-sm w-full h-[110px]"
    >
      <div className="w-10 h-10 rounded-full border border-gray-100 flex items-center justify-center mb-2 bg-[#f4f7f9] text-[#0d4b5b]">
        <Icon className="w-5 h-5 stroke-2" />
      </div>
      <span className="text-[11px] font-bold text-gray-700 text-center leading-tight">{title}</span>
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
        <ArrowPathIcon className="w-8 h-8 text-[#0d4b5b] animate-spin opacity-50" />
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Loading Dashboard...</p>
      </div>
    );
  }

  if (!data) return <div className="p-10 text-center text-gray-500">Failed to load data.</div>;

  return (
    <div className="w-full space-y-6">

      {/* HEADER SECTION */}
      <div className="pt-2">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
        <p className="text-gray-500 text-sm mt-1">Welcome back, here's what's happening today.</p>
      </div>

      {/* STATS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          title="Total Students"
          value={data.stats.totalStudents.toString()}
          trend={`${Math.abs(data.stats.studentGrowth)}%`}
          icon={UserGroupIcon}
        />
        <StatCard
          title="Total Revenue"
          value={`LKR ${(data.stats.totalRevenue / 1000).toFixed(1)}k`}
          trend={`${Math.abs(data.stats.revenueGrowth)}%`}
          icon={CurrencyDollarIcon}
        />
        <StatCard
          title="Active Classes"
          value={data.stats.activeClasses.toString()}
          trend="Stable"
          icon={BookOpenIcon}
        />
      </div>

      {/* QUICK ACTIONS ROW */}
      <div className="flex flex-col">
        <h2 className="text-[15px] font-bold text-[#0d4b5b] mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
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
            icon={BookOpenIcon}
            onClick={() => navigate('/admin/classes/create')}
          />
          <QuickAction
            title="Upload Material"
            icon={ArrowUpTrayIcon}
            onClick={() => navigate('/admin/materials')}
          />
          {/* Stacked Action Buttons (Replaces the old Top Contributors list) */}
          <div className="flex flex-col gap-3 h-[110px] col-span-2 sm:col-span-1 md:col-span-1">
            <button className="flex-1 bg-white border border-gray-100 rounded-xl px-2 flex items-center justify-center text-[11px] font-bold text-gray-900 shadow-sm hover:bg-gray-50 transition-colors whitespace-nowrap">
              Top Contributors
            </button>
            <button className="flex-1 bg-white border border-gray-100 rounded-xl px-2 flex items-center justify-center text-[11px] font-bold text-[#0d4b5b] shadow-sm hover:bg-gray-50 transition-colors whitespace-nowrap">
              View All Payments
            </button>
          </div>
        </div>
      </div>

      {/* BOTTOM ROW (Recent Activity & Next Class) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Recent Activity */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col h-full min-h-[280px]">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-[15px] font-bold text-gray-900">Recent Activity</h2>
            <button className="text-[11px] font-bold text-[#0d4b5b] bg-[#eef2f6] px-3 py-1 rounded-full hover:bg-gray-200 transition-colors">
              View All
            </button>
          </div>
          <div className="space-y-4 flex-1">
            {data.recentActivity.slice(0, 5).map((item, index) => (
              <div key={item._id || index} className="flex gap-4 items-start">
                <div className="mt-1">
                  <div className="w-3.5 h-3.5 rounded-full border-[3px] border-[#0d4b5b] bg-white"></div>
                </div>
                <div className="flex-1 leading-tight">
                  <p className="text-xs text-gray-800 font-medium">
                    New student registered <span className="font-bold">{item.targetName}</span>
                  </p>
                  <p className="text-[10px] text-gray-400 mt-1">
                    {moment(item.createdAt).fromNow()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Next Class Widget */}
        <div className="bg-[#155e75] rounded-2xl p-6 shadow-sm flex flex-col items-center justify-center text-center h-full min-h-[280px] border border-[#164e63]/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10 pointer-events-none"></div>

          <div className="flex items-center gap-3 mb-6 relative z-10">
            <AcademicCapIcon className="w-7 h-7 text-[#facc15]" />
            <h2 className="text-[15px] font-bold text-white tracking-widest uppercase">Next Class</h2>
          </div>

          <div className="bg-white w-full rounded-2xl p-5 shadow-sm border border-gray-100 relative z-10">
            <div className="text-[#0d4b5b] font-bold text-xs tracking-widest mb-1.5 uppercase">
              {data.nextClass?.subject || "REVISION"}
            </div>
            <div className="text-gray-900 font-black text-lg mb-4">
              {data.nextClass?.name || "No Upcoming Class"}
            </div>
            <div className="bg-[#eef2f6] text-[#0d4b5b] text-xs font-bold py-2 px-4 rounded-lg inline-block border border-gray-200">
              {data.nextClass ? moment(data.nextClass.startTime).calendar() : "TBA"}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}