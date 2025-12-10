// components/SidebarStudent.tsx
import { HomeIcon, CalendarIcon, BookOpenIcon, CreditCardIcon, UserGroupIcon, Bars3Icon, ArrowRightOnRectangleIcon } from "@heroicons/react/24/outline";
import {useAuth} from "../../contexts/AuthContext";
import { GiHelp } from "react-icons/gi";

type Props = { collapsed?: boolean; onToggle?: () => void };

export default function SidebarStudent({ collapsed = false, onToggle }: Props) {
  const { logout } = useAuth();

  const nav = [
    { key: "overview", label: "Overview", href: "/student/dashboard", Icon: HomeIcon },
    { key: "classes", label: "Classes", href: "/student/classes", Icon: CalendarIcon },
    { key: "materials", label: "Materials", href: "/student/materials", Icon: BookOpenIcon },
    { key: "payments", label: "Payments", href: "/student/payments", Icon: CreditCardIcon },
    { key: "community", label: "Community", href: "/student/community", Icon: UserGroupIcon },
    { key: "tickets", label: "Support Tickets", href: "/student/tickets", Icon: GiHelp }
  ];

  return (
    <aside className={`flex flex-col h-full bg-gradient-to-b from-[#053A4E] to-[#05668A] text-white ${collapsed ? "w-20" : "w-64"} transition-all duration-300`}>
      {/* Header */}
      <div className={`flex items-center ${collapsed ? "justify-center" : "gap-3"} px-4 py-4 border-b border-white/10`}>
        <button onClick={onToggle} className="p-1 rounded-md hover:bg-white/10">
          <Bars3Icon className="w-6 h-6" />
        </button>
        {!collapsed && (
          <div>
            <div className="font-semibold">SL Accounting</div>
            <div className="text-xs text-white/80">Student Portal</div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 overflow-auto">
        {nav.map((n) => (
          <a 
            key={n.key} 
            href={n.href} 
            className={`flex items-center gap-3 p-3 rounded-md hover:bg-white/10 ${collapsed ? "justify-center" : ""}`}
            title={collapsed ? n.label : ""} // Tooltip when collapsed
          >
            <n.Icon className="w-5 h-5" />
            {!collapsed && <span>{n.label}</span>}
          </a>
        ))}
      </nav>

      {/* Footer / User Profile */}
      <div className="px-3 py-4 border-t border-white/10">
        <div className={`flex items-center ${collapsed ? "flex-col gap-4 justify-center" : "justify-between"}`}>
          
          {/* User Avatar & Info */}
          <div className={`flex items-center gap-2 ${collapsed ? "justify-center" : ""}`}>
            <div className="w-10 h-10 rounded-full bg-[#FFE787] flex items-center justify-center text-[#02121E] font-bold shrink-0">
              SJ
            </div>
            {!collapsed && (
              <div className="overflow-hidden">
                <div className="text-sm font-medium truncate">S JAY</div>
                <div className="text-xs truncate">Class 12 - A/L</div>
              </div>
            )}
          </div>

          {/* Logout Button - NOW VISIBLE IN BOTH STATES */}
          <button 
            aria-label="Logout" 
            className="p-1 rounded-md hover:bg-white/10 transition-colors" 
            onClick={logout}
            title="Logout"
          >
            <ArrowRightOnRectangleIcon className="w-5 h-5" />
          </button>
          
        </div>
      </div>
    </aside>
  );
}