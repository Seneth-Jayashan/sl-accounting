// components/SidebarAdmin.tsx
import React, { useState, useEffect } from "react";
import {
  HomeIcon,
  UsersIcon,
  ClipboardDocumentCheckIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  Bars3Icon,
  ArrowRightOnRectangleIcon,
  ChatBubbleLeftRightIcon,
  AcademicCapIcon,
  CurrencyDollarIcon,
  BookOpenIcon,
  ChevronDownIcon,
  PhoneIcon 
} from "@heroicons/react/24/outline";
import {useAuth} from "../../contexts/AuthContext";


type Props = { collapsed?: boolean; onToggle?: () => void };

export default function SidebarAdmin({ collapsed = false, onToggle }: Props) {
  const { logout } = useAuth();
  const [kbOpen, setKbOpen] = useState(() => {
    try {
      return sessionStorage.getItem('admin_kb_open') === '1';
    } catch (e) {
      return false;
    }
  });

  useEffect(() => {
    try {
      sessionStorage.setItem('admin_kb_open', kbOpen ? '1' : '0');
    } catch (e) {}
  }, [kbOpen]);

  const nav = [
    { key: "overview", label: "Overview", href: "/admin/dashboard", Icon: HomeIcon },
    { key: "students", label: "Students", href: "/admin/students", Icon: UsersIcon },
    { key: "classes", label: "Classes", href: "/admin/classes", Icon: AcademicCapIcon },
    { key: "batches", label: "Batches", href: "/admin/batches", Icon: ClipboardDocumentCheckIcon },
    { key: "sessions", label: "Sessions", href: "/admin/sessions", Icon: CurrencyDollarIcon },
    { key: "payments", label: "Payments", href: "/admin/payments", Icon: BookOpenIcon },
    { key: "reports", label: "Reports", href: "/admin/reports", Icon: ChartBarIcon },
    { key: "Support", label: "Support", href: "/admin/support", Icon: PhoneIcon },
    { key : "chat", label: "Chat", href: "/admin/chat", Icon: ChatBubbleLeftRightIcon },
    { key: "settings", label: "Settings", href: "/admin/settings", Icon: Cog6ToothIcon },
  ];

  return (
    // Added 'hidden lg:flex' to hide on mobile
    <aside className={`hidden lg:flex flex-col h-full bg-[#0b2540] text-white ${collapsed ? "w-20" : "w-64"} transition-all duration-300`}>
      <div className="flex items-center gap-3 px-4 py-4 border-b border-white/10">
        <button onClick={onToggle} className="p-1 rounded-md hover:bg-white/10"><Bars3Icon className="w-6 h-6" /></button>
        {!collapsed && <div><div className="font-semibold">Instructor</div><div className="text-xs text-white/80">Admin Panel</div></div>}
      </div>

      <nav className="flex-1 px-2 py-4 overflow-auto custom-scrollbar">
        {nav.map((n) => (
          <React.Fragment key={n.key}>
            <a href={n.href} onClick={() => setKbOpen(false)} className="flex items-center gap-3 p-3 rounded-md hover:bg-white/10 transition-colors mb-1">
              <n.Icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span className="whitespace-nowrap">{n.label}</span>}
            </a>

            {/* Insert Materials dropdown right after Sessions */}
            {n.key === 'sessions' && (
              <div className="mt-2">
                <button onClick={() => setKbOpen((s) => !s)} className="w-full flex items-center gap-3 p-3 rounded-md hover:bg-white/10 transition-colors mb-1">
                  <BookOpenIcon className="w-5 h-5 flex-shrink-0" />
                  {!collapsed && <span className="whitespace-nowrap">Materials</span>}
                  {!collapsed && (
                    <ChevronDownIcon className={`w-4 h-4 transform transition-transform duration-150 ${kbOpen ? 'rotate-0' : '-rotate-90'}`} />
                  )}
                </button>

                {kbOpen && (
                  <div className="pl-10 pr-2 mt-1">
                    <a href="/admin/knowledge-base" className="flex items-center px-3 py-2 rounded-md hover:bg-white/10 focus:bg-white/10 transition-colors mb-1 text-sm font-medium text-white/90">
                      <span className="whitespace-nowrap">Add to Knowledge Base</span>
                    </a>
                    <a href="/admin/knowledge-list" className="flex items-center px-3 py-2 rounded-md hover:bg-white/10 focus:bg-white/10 transition-colors mb-1 text-sm font-medium text-white/90">
                      <span className="whitespace-nowrap">View Knowledge Base</span>
                    </a>
                  </div>
                )}
              </div>
            )}
          </React.Fragment>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center font-medium">K</div>
            {!collapsed && <div><div className="text-sm font-medium">Kalum</div><div className="text-xs">Instructor</div></div>}
          </div>
          {!collapsed && <button aria-label="Logout" className="p-1 rounded-md hover:bg-white/10" onClick={logout}><ArrowRightOnRectangleIcon className="w-5 h-5" /></button>}
        </div>
      </div>
    </aside>
  );
}