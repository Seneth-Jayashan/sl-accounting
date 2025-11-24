// layouts/DashboardLayout.tsx
import React, { useState } from "react";

export type SidebarComponent = React.ComponentType<{ collapsed?: boolean; onToggle?: () => void }>;

export default function DashboardLayout({ Sidebar, children }: { Sidebar: SidebarComponent; children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen flex bg-[#E8EFF7]">
      <div className="flex-shrink-0">
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(s => !s)} />
      </div>

      <div className="flex-1 flex flex-col">
        <header className="flex items-center justify-between px-6 py-4 bg-white border-b">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold">Dashboard</h1>
            <div className="hidden md:flex items-center gap-2 bg-gray-100 rounded-md px-2 py-1">
              <input placeholder="Search…" className="bg-transparent outline-none text-sm" />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-600">Welcome</div>
          </div>
        </header>

        <main className="p-6 overflow-auto">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>

      <aside className="w-80 hidden lg:flex flex-col p-4">
        {/* common right utilities */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">Quick utilities</div>
      </aside>
    </div>
  );
}
