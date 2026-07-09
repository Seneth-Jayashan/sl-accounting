import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
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
  PhoneIcon,
  ChevronLeftIcon,
  ChevronDownIcon,
  MegaphoneIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "../../contexts/AuthContext";

type Props = {
  collapsed?: boolean;
  onToggle?: () => void;
};

interface NavItem {
  key: string;
  label: string;
  href: string;
  icon: React.ElementType;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const MENU_STRUCTURE: NavSection[] = [
  {
    title: "System",
    items: [
      { key: "overview", label: "Overview", href: "/admin/dashboard", icon: HomeIcon },
      { key: "reports", label: "Reports", href: "/admin/reports", icon: ChartBarIcon },
    ],
  },
  {
    title: "Community",
    items: [
      { key: "community", label: "Community", href: "/admin/community", icon: ChatBubbleLeftRightIcon },
    ],
  },
  {
    title: "User Management",
    items: [
      { key: "students", label: "Students", href: "/admin/students", icon: UsersIcon },
    ],
  },
  {
    title: "Academic Management",
    items: [
      { key: "announcements", label: "Announcements", href: "/admin/announcements", icon: MegaphoneIcon },
      { key: "batches", label: "Batches", href: "/admin/batches", icon: ClipboardDocumentCheckIcon },
      { key: "classes", label: "Live Classes", href: "/admin/classes", icon: AcademicCapIcon },
      { key: "materials", label: "Materials", href: "/admin/materials", icon: BookOpenIcon },
      { key: "sessions", label: "Sessions", href: "/admin/sessions", icon: BookOpenIcon },
      { key: "quizzes", label: "Quizzes", href: "/admin/quizzes", icon: ClipboardDocumentCheckIcon },
      { key: "lesson-packs", label: "Lesson Packs", href: "/admin/lesson-packs", icon: BookOpenIcon },
    ],
  },
  {
    title: "Finance",
    items: [
      { key: "payments", label: "Payments", href: "/admin/payments", icon: CurrencyDollarIcon },
    ],
  },
  {
    title: "Tute Delivery",
    items: [
      { key: "tute-delivery", label: "Tute Delivery", href: "/admin/tute-delivery", icon: ClipboardDocumentCheckIcon },
    ],
  },
  {
    title: "Knowledge Base",
    items: [
      { key: "knowledge", label: "Library", href: "/admin/knowledge-base", icon: BookOpenIcon },
      { key: "knowledge-list", label: "Content List", href: "/admin/knowledge-list", icon: ClipboardDocumentCheckIcon },
    ],
  },
  {
    title: "Supports",
    items: [
      { key: "support", label: "Contact Us", href: "/admin/support", icon: PhoneIcon },
      { key: "chat", label: "Support Ticket", href: "/admin/chat", icon: ChatBubbleLeftRightIcon },
      { key: "settings", label: "Settings", href: "/admin/settings", icon: Cog6ToothIcon },
    ],
  },
];

export default function SidebarAdmin({ collapsed = false, onToggle }: Props) {
  const { user, logout } = useAuth();
  const location = useLocation();

  const [openSections, setOpenSections] = useState<string[]>([]);

  useEffect(() => {
    const currentPath = location.pathname;

    const activeSection = MENU_STRUCTURE.find(section =>
      section.items.some(item => currentPath.startsWith(item.href))
    );

    if (activeSection) {
      setOpenSections(prev => {
        if (prev.includes(activeSection.title)) return prev;
        return [...prev, activeSection.title];
      });
    }
  }, [location.pathname]);

  const toggleSection = (title: string) => {
    setOpenSections((prev) =>
      prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title]
    );
  };

  return (
    <motion.aside
      initial={false}
      // Width eka 250px kiyala gaththa UI design eke thiyena compact look ekata
      animate={{ width: collapsed ? 80 : 250 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="hidden lg:flex flex-col h-screen bg-[#0d4b5b] text-white shadow-2xl relative z-50 top-0 overflow-hidden"
    >
      {/* --- HEADER --- */}
      <div className={`h-28 flex items-center shrink-0 relative transition-all duration-300 ${collapsed ? 'justify-center px-0' : 'justify-between px-5'}`}>

        {/* Logo & Title */}
        <div className={`flex items-center gap-3 overflow-hidden transition-all duration-300 ${collapsed ? '-mt-4' : 'mt-2'}`}>
          <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0 text-white shadow-sm border border-white/5">
            <AcademicCapIcon className="w-6 h-6 stroke-[1.5]" />
          </div>
          <AnimatePresence mode="wait">
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="whitespace-nowrap flex flex-col justify-center"
              >
                <h1 className="font-bold text-[17px] leading-tight tracking-wide">SL Accounting</h1>
                <span className="text-[10px] text-[#facc15] uppercase tracking-[0.15em] font-black mt-0.5">Admin Portal</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Toggle Button */}
        <button
          onClick={onToggle}
          className={`absolute z-50 flex items-center justify-center text-white hover:bg-white/20 transition-all duration-300 shadow-sm ${collapsed
              ? "top-[85px] left-1/2 -translate-x-1/2 w-8 h-8 bg-white/10 rounded-full"
              : "right-3 top-1/2 -translate-y-1/2 mt-1 w-6 h-6 bg-white/10 rounded-full"
            }`}
        >
          {collapsed ? <Bars3Icon className="w-4 h-4 stroke-[2]" /> : <ChevronLeftIcon className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* --- NAVIGATION --- */}
      <nav className="flex-1 pt-2 pb-6 overflow-y-auto scrollbar-hide space-y-1 w-full">
        <style>{`.scrollbar-hide::-webkit-scrollbar { display: none; }`}</style>

        {MENU_STRUCTURE.map((section) => (
          <div key={section.title} className="flex flex-col">
            {/* Section Header */}
            {!collapsed && (
              <button
                onClick={() => toggleSection(section.title)}
                className="w-full flex items-center justify-between px-5 py-3 hover:bg-white/5 transition-colors group"
              >
                <span className="text-xs font-bold uppercase tracking-wider text-white/90">{section.title}</span>
                <ChevronDownIcon
                  className={`w-3.5 h-3.5 text-white/50 transition-transform duration-300 ${openSections.includes(section.title) ? "rotate-180" : ""}`}
                />
              </button>
            )}

            {/* Section Items */}
            <AnimatePresence initial={false}>
              {(openSections.includes(section.title) || collapsed) && (
                <motion.div
                  initial={collapsed ? { opacity: 1, height: "auto" } : { height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  {section.items.map((item) => {
                    const isActive = location.pathname.startsWith(item.href);
                    return (
                      <Link
                        key={item.key}
                        to={item.href}
                        className={`
                          group flex items-center gap-3 py-2.5 transition-all duration-200 relative
                          ${isActive
                            ? "bg-[#155e75] text-white border-l-[4px] border-[#facc15]"
                            : "text-white/70 hover:bg-white/5 hover:text-white border-l-[4px] border-transparent"
                          }
                          ${collapsed ? "justify-center px-0" : "px-5"}
                        `}
                        title={collapsed ? item.label : ""}
                      >
                        <item.icon className={`shrink-0 ${isActive ? "w-5 h-5 text-white" : "w-[18px] h-[18px] opacity-70 group-hover:opacity-100"}`} />
                        {!collapsed && <span className={`font-medium text-[13px] whitespace-nowrap ${isActive ? 'font-bold' : ''}`}>{item.label}</span>}
                      </Link>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </nav>

      {/* --- FOOTER --- */}
      <div className={`p-4 border-t border-white/5 bg-[#093946] shrink-0 w-full flex ${collapsed ? 'justify-center' : ''}`}>
        <div className={`flex items-center ${collapsed ? "flex-col justify-center gap-3" : "gap-3 w-full"}`}>
          <div className="w-10 h-10 rounded-full bg-[#f26d21] flex items-center justify-center text-white font-bold text-base shadow-sm shrink-0">
            {user?.firstName ? user.firstName.charAt(0).toUpperCase() : "S"}
          </div>

          {!collapsed && (
            <div className="flex-1 overflow-hidden">
              <p className="text-[14px] font-bold truncate text-white">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-[9px] text-[#facc15] uppercase tracking-wider font-bold mt-0.5">
                {user?.role || "ADMIN"}
              </p>
            </div>
          )}

          <button
            onClick={() => logout()}
            className={`p-2 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors ${collapsed ? '' : 'ml-auto'}`}
            title="Sign Out"
          >
            <ArrowRightOnRectangleIcon className="w-5 h-5 stroke-[1.5]" />
          </button>
        </div>
      </div>
    </motion.aside>
  );
}