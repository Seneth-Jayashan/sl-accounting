import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  CalendarDays,
  BookOpen,
  CreditCard,
  Users,
  HelpCircle,
  LogOut,
  ChevronLeft,
  GraduationCap,
  Menu
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

type Props = {
  collapsed?: boolean;
  onToggle?: () => void;
};

// Define structure for clarity, easily extensible
const STUDENT_MENU = [
  { key: "overview", label: "Overview", href: "/student/dashboard", icon: LayoutDashboard },
  { key: "classes", label: "My Classes", href: "/student/classes", icon: CalendarDays },
  { key: "materials", label: "Study Materials", href: "/student/knowledge-base", icon: BookOpen },
  { key: "payments", label: "Payments", href: "/student/payments", icon: CreditCard },
  { key: "community", label: "Community", href: "/student/community", icon: Users },
  { key: "tickets", label: "Support", href: "/student/tickets", icon: HelpCircle },
];

export default function SidebarStudent({ collapsed = false, onToggle }: Props) {
  const { user, logout } = useAuth();
  const location = useLocation();

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 80 : 280 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="hidden lg:flex flex-col h-screen bg-brand-prussian text-white shadow-2xl relative z-50 top-0 overflow-hidden border-r border-white/5"
    >
      {/* --- HEADER --- */}
      <div className="h-20 flex items-center justify-between px-5 border-b border-white/10 shrink-0 relative bg-brand-prussian z-20">
        <div className="flex items-center gap-3 overflow-hidden">
          {/* Logo Icon */}
          <div className="w-10 h-10 bg-brand-cerulean rounded-xl flex items-center justify-center flex-shrink-0 text-white shadow-lg shadow-brand-cerulean/20">
            <GraduationCap size={24} />
          </div>

          {/* Logo Text */}
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="whitespace-nowrap"
              >
                <h1 className="font-bold text-lg leading-none tracking-tight">SL Accounting</h1>
                <span className="text-[10px] text-brand-jasmine uppercase tracking-[0.2em] font-bold">Student Portal</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Toggle Button */}
      <button
        onClick={onToggle}
        className="absolute right-3 top-16 w-7 h-7 bg-brand-cerulean rounded-full flex items-center justify-center text-white shadow-md hover:bg-brand-coral transition-colors z-50 border border-brand-prussian"
      >
        {collapsed ? <Menu size={14} /> : <ChevronLeft size={14} />}
      </button>

      {/* --- NAVIGATION --- */}
      <nav className="flex-1 py-6 px-3 overflow-y-auto scrollbar-hide space-y-2">
        {STUDENT_MENU.map((item) => {
          const isActive = location.pathname.startsWith(item.href);

          return (
            <Link
              key={item.key}
              to={item.href}
              className={`
                group flex items-center gap-3 p-3 rounded-xl transition-all duration-200 relative
                ${isActive
                  ? "bg-brand-cerulean text-white shadow-lg shadow-brand-cerulean/20"
                  : "text-brand-aliceBlue/70 hover:bg-white/5 hover:text-white"
                }
                ${collapsed ? "justify-center" : "mx-1"}
              `}
              title={collapsed ? item.label : ""}
            >
              <item.icon
                size={22}
                className={`transition-transform duration-300 flex-shrink-0 ${isActive ? "scale-100" : "group-hover:scale-110 opacity-80 group-hover:opacity-100"}`}
              />

              {!collapsed && (
                <span className="font-medium text-sm whitespace-nowrap tracking-wide">{item.label}</span>
              )}

              {/* Active Indicator Dot for Collapsed State */}
              {collapsed && isActive && (
                <div className="absolute right-2 top-2 w-2 h-2 bg-brand-jasmine rounded-full border border-brand-prussian"></div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* --- FOOTER --- */}
      <div className="p-4 border-t border-white/10 bg-black/20 shrink-0">
        <div className={`flex items-center ${collapsed ? "justify-center flex-col gap-4" : "gap-3"}`}>
          
          {/* Avatar */}
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-brand-jasmine to-brand-coral flex items-center justify-center text-brand-prussian font-bold shadow-md shrink-0 border border-white/10 text-sm">
            {user?.firstName ? user.firstName.charAt(0).toUpperCase() : "S"}
          </div>

          {/* User Info */}
          {!collapsed && (
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-bold truncate text-white leading-tight">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-[10px] text-brand-aliceBlue/60 truncate mt-0.5">
                {user?.email || "Student Account"}
              </p>
            </div>
          )}

          {/* Logout Button */}
          <button
            onClick={() => logout()}
            className={`
              p-2 rounded-lg hover:bg-red-500/20 text-brand-aliceBlue/60 hover:text-brand-coral transition-colors
              ${collapsed ? "" : "ml-auto"}
            `}
            title="Sign Out"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </motion.aside>
  );
}