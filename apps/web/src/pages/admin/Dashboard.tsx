// src/admin/Dashboard.tsx
import React from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import SidebarAdmin from "../../components/sidebar/SidebarAdmin";

function StatCard({
  title,
  value,
  hint,
}: {
  title: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm">
      <div className="text-sm text-gray-500">{title}</div>
      <div className="mt-2 text-2xl font-semibold text-[#053A4E]">{value}</div>
      {hint && <div className="text-xs text-gray-400 mt-1">{hint}</div>}
    </div>
  );
}

export default function AdminDashboardPage() {
  const recentActivity = [
    { id: 1, text: "New student registered: Tharindu", time: "2 hours ago" },
    { id: 2, text: "Attendance marked for Nov 24 class", time: "5 hours ago" },
    { id: 3, text: "Uploaded new revision notes", time: "Yesterday" },
  ];

  const topStudents = [
    { name: "S JAY", progress: 92 },
    { name: "Bhashitha", progress: 88 },
    { name: "Udesh", progress: 85 },
  ];

  return (
    <DashboardLayout Sidebar={SidebarAdmin}>
      <div className="space-y-6">

        {/* ADMIN STATS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard title="Total Students" value={320} hint="Active this month" />
          <StatCard title="Classes Held" value={14} hint="This month" />
          <StatCard title="Pending Payments" value={27} hint="Students to follow up" />
        </div>

        {/* RECENT ACTIVITY */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h2 className="font-semibold text-lg text-[#02121E]">Recent Activity</h2>
          <ul className="mt-3 space-y-3">
            {recentActivity.map((item) => (
              <li key={item.id} className="flex justify-between border-b pb-3 last:border-none last:pb-0">
                <div className="text-sm">{item.text}</div>
                <div className="text-xs text-gray-400">{item.time}</div>
              </li>
            ))}
          </ul>
        </div>

        {/* TOP STUDENTS */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h2 className="font-semibold text-lg text-[#02121E]">Top Performing Students</h2>
          <div className="mt-3 space-y-3">
            {topStudents.map((s, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="font-medium text-sm">{s.name}</div>
                <div className="w-40 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-[#05668A] h-2 rounded-full"
                    style={{ width: `${s.progress}%` }}
                  />
                </div>
                <div className="text-sm font-semibold ml-2">{s.progress}%</div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
