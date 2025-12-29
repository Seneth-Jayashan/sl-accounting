import React, { useState } from "react";
import DefaultRightSidebar from "../components/rightSidebar/DefaultRightSidebar"; 

export type SidebarComponent = React.ComponentType<{ collapsed?: boolean; onToggle?: () => void }>;
export type BottomNavComponent = React.ComponentType<{}>;

interface LayoutProps {
  Sidebar: SidebarComponent;
  BottomNav?: BottomNavComponent;
  rightSidebar?: React.ReactNode; 
  children: React.ReactNode;
}

export default function DashboardLayout({ 
  Sidebar, 
  BottomNav, 
  rightSidebar, 
  children 
}: LayoutProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen flex bg-[#E8EFF7] font-sans text-gray-900">
      
      <div className="flex-shrink-0 sticky top-0 h-screen overflow-hidden z-40 hidden lg:block shadow-xl">
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((prev) => !prev)} />
      </div>

      <div className="flex-1 flex flex-col min-w-0 relative">

        <main className="flex-1 flex gap-8 p-4 sm:p-6 lg:p-8 pb-28 lg:pb-8 overflow-x-hidden">
          
          <div className="flex-1 min-w-0">
            <div className="max-w-5xl mx-auto xl:mx-0 h-full">
              {children}
            </div>
          </div>

          {rightSidebar !== null && (
            <aside className="hidden xl:flex flex-col w-80 flex-shrink-0 gap-6 relative">
              <div className="sticky top-8 space-y-6">
                 {rightSidebar === undefined ? <DefaultRightSidebar /> : rightSidebar}
              </div>
            </aside>
          )}
          
        </main>
      </div>

      {BottomNav && <BottomNav />}
    </div>
  );
}