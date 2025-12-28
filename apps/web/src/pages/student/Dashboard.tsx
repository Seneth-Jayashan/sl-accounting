// student/Dashboard.tsx


function StatCard({ title, value, hint }: { title: string; value: string | number; hint?: string }) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm">
      <div className="text-sm text-gray-500">{title}</div>
      <div className="mt-2 text-2xl font-semibold text-[#053A4E]">{value}</div>
      {hint && <div className="text-xs text-gray-400 mt-1">{hint}</div>}
    </div>
  );
}

export default function StudentDashboardPage() {
  // Dummy data — replace with your data fetching hooks
  const upcoming = [
    { id: 1, title: "Accounting - Ratio Analysis", start: "2025-11-26 6:00 PM", zoom: true },
    { id: 2, title: "Trial Balance Practice", start: "2025-11-28 4:00 PM", zoom: true },
  ];

  const materials = [
    { id: 1, title: "Revision Notes - Chapter 4", type: "PDF" },
    { id: 2, title: "Lecture Recording - 2025-11-20", type: "Video" },
  ];

  return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard title="Active Classes" value={3} hint="This month" />
            <StatCard title="Pending Payments" value={"1"} hint="Due: Dec 1, 2025" />
            <StatCard title="Progress" value={"78%"} hint="Average score" />
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <h2 className="font-semibold text-lg text-[#02121E]">Upcoming Classes</h2>
            <ul className="mt-3 divide-y">
              {upcoming.map((u) => (
                <li key={u.id} className="py-3 flex items-center justify-between">
                  <div>
                    <div className="font-medium">{u.title}</div>
                    <div className="text-sm text-gray-500">{u.start}</div>
                  </div>
                  <div className="text-sm">
                    {u.zoom ? <a href="#" className="text-[#05668A] underline">Join</a> : <span className="text-gray-400">Offline</span>}
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <h2 className="font-semibold text-lg text-[#02121E]">Recent Materials</h2>
            <ul className="mt-3 space-y-2">
              {materials.map((m) => (
                <li key={m.id} className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{m.title}</div>
                    <div className="text-xs text-gray-500">{m.type}</div>
                  </div>
                  <div>
                    <a href="#" className="text-sm underline">Open</a>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <aside className="space-y-6">
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <h3 className="font-semibold">Attendance</h3>
            <div className="mt-3 text-2xl font-bold text-[#679436]">92%</div>
            <div className="text-xs text-gray-400">Last 30 days</div>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <h3 className="font-semibold">Next Assignment</h3>
            <div className="mt-2 text-sm">Practice Journal Entries — Submit by Nov 30, 2025</div>
            <a className="mt-3 block text-center py-2 rounded-md bg-[#FFE787] text-[#02121E] font-semibold" href="/student/assignments">Open</a>
          </div>
        </aside>
      </div>
  );
}
