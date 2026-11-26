import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  CalendarDays,
  BookOpen,
  CreditCard,
  User,
  HelpCircle,
  LogOut,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  ClipboardList,
  ListVideo,
  FileText,
  MessageSquare,
  Library,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

type Props = {
  collapsed?: boolean;
  onToggle?: () => void;
};

const STUDENT_MENU_GROUPS = [
  {
    title: "Main",
    items: [
      { key: "overview", label: "Overview", href: "/student/dashboard", icon: LayoutDashboard },
      { key: "classes", label: "My Classes", href: "/student/classes", icon: CalendarDays },
    ],
  },
  {
    title: "Learning",
    items: [
      { key: "lesson-packs", label: "Lesson Packs", href: "/student/lesson-packs", icon: ListVideo },
      { key: "tutes", label: "My Tutes", href: "/student/my-tutes", icon: BookOpen },
      { key: "materials", label: "Study Materials", href: "/student/knowledge-base", icon: Library },
      { key: "quizzes", label: "Quizzes", href: "/student/quizzes/history", icon: ClipboardList },
      { key: "papers", label: "Essay Papers", href: "/student/papers", icon: FileText },
    ],
  },
  {
    title: "Account & Support",
    items: [
      { key: "payments", label: "Payments", href: "/student/payments", icon: CreditCard },
      { key: "profile", label: "Profile", href: "/student/Profile", icon: User },
      { key: "tickets", label: "Support", href: "/student/tickets", icon: HelpCircle },
      { key: "feedback", label: "Feedback", href: "/student/review", icon: MessageSquare },
    ],
  },
];

export default function SidebarStudent({ collapsed = false, onToggle }: Props) {
  const { user, logout } = useAuth();
  const location = useLocation();

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 84 : 272 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className="hidden lg:flex flex-col h-screen bg-gradient-to-b from-brand-prussian via-[#0b3140] to-[#07202b] text-white shadow-2xl relative z-50 top-0 overflow-hidden border-r border-white/10 select-none"
    >
      {/* Subtle Ambient Top Glow */}
      <div className="pointer-events-none absolute -top-16 -left-16 w-48 h-48 rounded-full bg-brand-cerulean/20 blur-3xl" />

      {/* --- HEADER --- */}
      <div className="h-20 flex items-center justify-between px-4 border-b border-white/10 shrink-0 relative z-20">
        <Link
          to="/student/dashboard"
          className={`flex items-center gap-3 overflow-hidden ${collapsed ? "mx-auto" : ""}`}
        >
          <div className="w-10 h-10 bg-gradient-to-br from-brand-cerulean to-[#0d6e96] rounded-xl flex items-center justify-center shrink-0 text-white shadow-lg shadow-brand-cerulean/25 ring-1 ring-white/15">
            <GraduationCap size={22} />
          </div>

          <AnimatePresence mode="wait">
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.18 }}
                className="whitespace-nowrap"
              >
                <h1 className="font-extrabold text-base leading-tight tracking-tight text-white">
                  SL Accounting
                </h1>
                <span className="text-[10px] text-brand-jasmine uppercase tracking-[0.2em] font-bold block mt-0.5">
                  Student Portal
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </Link>

        {/* Clean Header Toggle Button */}
        {!collapsed && (
          <button
            onClick={onToggle}
            aria-label="Collapse sidebar"
            className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/15 text-brand-aliceBlue/70 hover:text-white flex items-center justify-center transition-colors border border-white/10 shrink-0"
          >
            <ChevronLeft size={15} />
          </button>
        )}
      </div>

      {/* Expand Button when Collapsed */}
      {collapsed && (
        <div className="flex justify-center pt-3 pb-1 relative z-20">
          <button
            onClick={onToggle}
            aria-label="Expand sidebar"
            className="w-9 h-7 rounded-lg bg-white/5 hover:bg-brand-cerulean text-brand-aliceBlue/80 hover:text-white flex items-center justify-center transition-colors border border-white/10"
          >
            <ChevronRight size={15} />
          </button>
        </div>
      )}

      {/* --- NAVIGATION --- */}
      <nav className="flex-1 py-4 px-3 overflow-y-auto scrollbar-hide space-y-5 relative z-10">
        {STUDENT_MENU_GROUPS.map((group, groupIdx) => (
          <div key={group.title} className="space-y-1">
            {!collapsed ? (
              <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-brand-aliceBlue/40">
                {group.title}
              </p>
            ) : (
              groupIdx > 0 && <div className="mx-3 my-2 border-t border-white/10" />
            )}

            {group.items.map((item) => {
              const isActive = location.pathname
                .toLowerCase()
                .startsWith(item.href.toLowerCase());
              const Icon = item.icon;

              return (
                <Link
                  key={item.key}
                  to={item.href}
                  title={collapsed ? item.label : undefined}
                  className={`group relative flex items-center gap-3 rounded-xl transition-colors duration-200 ${collapsed ? "justify-center p-3" : "px-3 py-2.5"
                    } ${isActive
                      ? "text-white"
                      : "text-brand-aliceBlue/70 hover:text-white hover:bg-white/[0.06]"
                    }`}
                >
                  {/* Animated Active Background */}
                  {isActive && (
                    <motion.div
                      layoutId="student-sidebar-active"
                      transition={{ type: "spring", stiffness: 380, damping: 32 }}
                      className="absolute inset-0 rounded-xl bg-gradient-to-r from-brand-cerulean to-brand-cerulean/80 shadow-md shadow-brand-cerulean/25 ring-1 ring-white/15"
                    />
                  )}

                  {/* Left Accent Bar */}
                  {isActive && !collapsed && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-brand-jasmine z-10" />
                  )}

                  <Icon
                    size={20}
                    className={`relative z-10 shrink-0 transition-transform duration-200 ${isActive
                        ? "text-white"
                        : "opacity-75 group-hover:opacity-100 group-hover:scale-105"
                      }`}
                  />

                  {!collapsed && (
                    <span
                      className={`relative z-10 text-sm whitespace-nowrap tracking-wide truncate ${isActive ? "font-semibold" : "font-medium"
                        }`}
                    >
                      {item.label}
                    </span>
                  )}

                  {/* Collapsed Active Dot */}
                  {collapsed && isActive && (
                    <span className="absolute right-1.5 top-1.5 w-2 h-2 rounded-full bg-brand-jasmine ring-2 ring-brand-prussian z-10" />
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* --- FOOTER --- */}
      <div className="p-3 border-t border-white/10 bg-black/20 backdrop-blur-sm shrink-0 relative z-20">
        <div
          className={`flex items-center rounded-2xl bg-white/[0.05] border border-white/10 transition-all ${collapsed ? "flex-col gap-3 p-2.5" : "gap-3 p-2.5"
            }`}
        >
          {/* Avatar + Online Indicator */}
          <div className="relative shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-jasmine to-brand-coral flex items-center justify-center text-brand-prussian font-extrabold shadow-sm text-sm">
              {user?.firstName ? user.firstName.charAt(0).toUpperCase() : "S"}
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-brand-prussian" />
          </div>

          {/* User Info */}
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate text-white leading-tight">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-[11px] text-brand-aliceBlue/55 truncate mt-0.5">
                {user?.email || "Student Account"}
              </p>
            </div>
          )}

          {/* Logout Button */}
          <button
            onClick={() => logout()}
            title="Sign Out"
            aria-label="Sign Out"
            className={`p-2 rounded-xl text-brand-aliceBlue/60 hover:text-red-300 hover:bg-red-500/20 transition-colors shrink-0 ${collapsed ? "" : "ml-auto"
              }`}
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </motion.aside>
  );
}