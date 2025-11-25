// src/pages/admin/Dashboard.tsx
import DashboardLayout from "../../layouts/DashboardLayout";
import SidebarAdmin from "../../components/sidebar/SidebarAdmin";
import {
  UserPlusIcon,
  BanknotesIcon,
  AcademicCapIcon,
  ArrowTrendingUpIcon,
  ClockIcon
} from "@heroicons/react/24/outline";

interface StatCardProps {
  title: string;
  value: string | number;
  trend?: string;
  trendUp?: boolean;
  icon?: React.ElementType;
  color?: string;
}

function StatCard({ title, value, trend, trendUp, icon: Icon, color = "blue" }: StatCardProps) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <h3 className="text-3xl font-bold text-gray-900 mt-2">{value}</h3>
        </div>
        {Icon && (
          <div className={`p-3 rounded-xl bg-${color}-50 text-${color}-600`}>
            <Icon className="w-6 h-6" />
          </div>
        )}
      </div>
      {trend && (
        <div className="mt-4 flex items-center text-sm">
          <span className={`flex items-center font-medium ${trendUp ? "text-green-600" : "text-red-600"}`}>
            {trendUp ? <ArrowTrendingUpIcon className="w-4 h-4 mr-1" /> : <ArrowTrendingUpIcon className="w-4 h-4 mr-1 rotate-180" />}
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
      className="flex flex-col items-center justify-center p-4 bg-white border border-gray-100 rounded-xl hover:bg-gray-50 hover:border-blue-200 transition-all group"
    >
      <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
        <Icon className="w-5 h-5" />
      </div>
      <span className="text-sm font-medium text-gray-700">{title}</span>
    </button>
  );
}

export default function AdminDashboardPage() {
  const recentActivity = [
    { id: 1, text: "New student registered: Tharindu", time: "2 hours ago", type: "student" },
    { id: 2, text: "Attendance marked for Nov 24 class", time: "5 hours ago", type: "class" },
    { id: 3, text: "Payment received from Kasun", time: "1 day ago", type: "payment" },
    { id: 4, text: "Uploaded new revision notes", time: "Yesterday", type: "material" },
  ];

  const topStudents = [
    { name: "S JAY", progress: 92, batch: "2024 A/L" },
    { name: "Bhashitha", progress: 88, batch: "2025 A/L" },
    { name: "Udesh", progress: 85, batch: "2024 A/L" },
    { name: "Nimal", progress: 82, batch: "2025 A/L" },
  ];

  return (
    <DashboardLayout Sidebar={SidebarAdmin}>
      <div className="space-y-8">

        {/* HEADER SECTION */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
          <p className="text-gray-500 mt-1">Welcome back, here's what's happening today.</p>
        </div>

        {/* STATS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            title="Total Students"
            value="320"
            trend="+12%"
            trendUp={true}
            icon={UserPlusIcon}
            color="blue"
          />
          <StatCard
            title="Total Revenue"
            value="LKR 450k"
            trend="+8%"
            trendUp={true}
            icon={BanknotesIcon}
            color="emerald"
          />
          <StatCard
            title="Active Classes"
            value="14"
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
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <QuickAction title="Add Student" icon={UserPlusIcon} />
                <QuickAction title="Record Payment" icon={BanknotesIcon} />
                <QuickAction title="Create Class" icon={AcademicCapIcon} />
                <QuickAction title="Upload Material" icon={ClockIcon} />
              </div>
            </section>

            {/* RECENT ACTIVITY */}
            <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
                <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">View All</button>
              </div>
              <div className="space-y-6">
                {recentActivity.map((item) => (
                  <div key={item.id} className="flex gap-4">
                    <div className="relative mt-1">
                      <div className="w-2 h-2 rounded-full bg-blue-500 ring-4 ring-blue-50"></div>
                      <div className="absolute top-3 left-1 w-px h-full bg-gray-100 -z-10 last:hidden"></div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{item.text}</p>
                      <p className="text-xs text-gray-500 mt-1">{item.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

          </div>

          {/* RIGHT COLUMN - SIDE WIDGETS */}
          <div className="space-y-8">

            {/* TOP STUDENTS */}
            <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Performers</h2>
              <div className="space-y-4">
                {topStudents.map((s, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                        {s.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{s.name}</div>
                        <div className="text-xs text-gray-500">{s.batch}</div>
                      </div>
                    </div>
                    <div className="text-sm font-bold text-emerald-600">{s.progress}%</div>
                  </div>
                ))}
              </div>
              <button className="w-full mt-4 py-2 text-sm text-gray-500 hover:text-gray-700 font-medium border-t border-gray-100">
                View Leaderboard
              </button>
            </section>

            {/* UPCOMING CLASSES (Placeholder) */}
            <section className="bg-gradient-to-br from-[#053A4E] to-[#02121E] rounded-2xl p-6 text-white">
              <h2 className="text-lg font-semibold mb-4">Next Class</h2>
              <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                <div className="text-sm text-blue-200 mb-1">Advanced Level Accounting</div>
                <div className="text-xl font-bold">Revision: Costing</div>
                <div className="mt-4 flex items-center gap-2 text-sm text-gray-300">
                  <ClockIcon className="w-4 h-4" />
                  <span>Today, 4:00 PM</span>
                </div>
              </div>
            </section>

          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
