// layouts/DashboardLayout.tsx
import React, { useState } from "react";
import DefaultRightSidebar from "../components/DefaultRightSidebar"; // Import default

export type SidebarComponent = React.ComponentType<{ collapsed?: boolean; onToggle?: () => void }>;
export type BottomNavComponent = React.ComponentType<{}>;

interface LayoutProps {
  Sidebar: SidebarComponent;
  BottomNav?: BottomNavComponent;
  rightSidebar?: React.ReactNode; // <--- NEW PROP
  showHeader?: boolean;
  children: React.ReactNode;
}

export default function DashboardLayout({ Sidebar, BottomNav, rightSidebar, children = true }: LayoutProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen flex bg-[#E8EFF7]">
      {/* ... Sidebar Code ... */}
      <div className="flex-shrink-0 sticky top-0 h-screen overflow-hidden z-40 hidden lg:block">
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(s => !s)} />
      </div>

      <div className="flex-1 flex flex-col min-w-0">


        <main className="p-4 lg:p-6 pb-24 lg:pb-6 flex gap-6 overflow-x-hidden">
          
          <div className="flex-1 min-w-0">
            <div className="max-w-5xl mx-auto xl:mx-0">
              {children}
            </div>
          </div>

          {/* Quick Utilities Sidebar */}
          <aside className="hidden xl:flex flex-col w-80 flex-shrink-0 gap-6">
            <div className="sticky top-6">
              {/* If rightSidebar prop exists, show it. Otherwise show Default */}
              {rightSidebar ? rightSidebar : <DefaultRightSidebar />}
            </div>
          </aside>
          
        </main>
      </div>

      {BottomNav && <BottomNav />}
    </div>
  );
}