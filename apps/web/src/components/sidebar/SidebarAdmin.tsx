import React, { useState , useEffect } from "react";
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
      { key: "classes", label: "Classes", href: "/admin/classes", icon: AcademicCapIcon },
      { key: "materials", label: "Materials", href: "/admin/materials", icon: BookOpenIcon },
      { key: "sessions", label: "Sessions", href: "/admin/sessions", icon: BookOpenIcon },
    ],
  },
  {
    title: "Finance",
    items: [
      { key: "payments", label: "Payments", href: "/admin/payments", icon: CurrencyDollarIcon },
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
  
  // 1. Initialize empty or with a default
  const [openSections, setOpenSections] = useState<string[]>([]);

  // 2. Automatically expand the section containing the active route
  useEffect(() => {
    const currentPath = location.pathname;
    
    // Find which section contains the current URL
    const activeSection = MENU_STRUCTURE.find(section => 
      section.items.some(item => currentPath.startsWith(item.href))
    );

    if (activeSection) {
      setOpenSections(prev => {
        // Only update if the section isn't already open to avoid unnecessary re-renders
        if (prev.includes(activeSection.title)) return prev;
        return [...prev, activeSection.title];
      });
    }
  }, [location.pathname]); // Runs every time the URL changes

  const toggleSection = (title: string) => {
    setOpenSections((prev) =>
      prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title]
    );
  };

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 80 : 280 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="hidden lg:flex flex-col h-screen bg-brand-prussian text-white shadow-2xl relative z-50 top-0 overflow-hidden"
    >
      {/* --- HEADER --- */}
      <div className="h-20 flex items-center justify-between px-5 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-10 h-10 bg-brand-cerulean rounded-xl flex items-center justify-center flex-shrink-0 text-white shadow-lg">
            <AcademicCapIcon className="w-6 h-6" />
          </div>
          <AnimatePresence mode="wait">
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="whitespace-nowrap"
              >
                <h1 className="font-semibold text-lg leading-none">SL Accounting</h1>
                <span className="text-[10px] text-brand-jasmine uppercase tracking-widest font-bold">Admin Portal</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Toggle Button */}
      <button
        onClick={onToggle}
        className="absolute right-3 top-16 w-6 h-6 bg-brand-cerulean rounded-full flex items-center justify-center text-white shadow-md hover:bg-brand-coral transition-colors z-50"
      >
        {collapsed ? <Bars3Icon className="w-3.5 h-3.5" /> : <ChevronLeftIcon className="w-3.5 h-3.5" />}
      </button>

      {/* --- NAVIGATION --- */}
      <nav className="flex-1 py-6 px-3 overflow-y-auto scrollbar-hide space-y-4">
        <style>{`.scrollbar-hide::-webkit-scrollbar { display: none; }`}</style>
        
        {MENU_STRUCTURE.map((section) => (
          <div key={section.title} className="space-y-1">
            {/* Section Header */}
            {!collapsed && (
              <button
                onClick={() => toggleSection(section.title)}
                className="w-full flex items-center justify-between px-3 py-2 text-brand-jasmine/50 hover:text-brand-jasmine transition-colors group"
              >
                <span className="text-[10px] font-bold uppercase tracking-[0.2em]">{section.title}</span>
                <ChevronDownIcon 
                  className={`w-3 h-3 transition-transform duration-300 ${openSections.includes(section.title) ? "rotate-180" : ""}`} 
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
                  className="overflow-hidden space-y-1"
                >
                  {section.items.map((item) => {
                    const isActive = location.pathname.startsWith(item.href);
                    return (
                      <Link
                        key={item.key}
                        to={item.href}
                        className={`
                          group flex items-center gap-3 p-3 rounded-xl transition-all duration-200 relative
                          ${isActive 
                            ? "bg-brand-cerulean text-white shadow-lg" 
                            : "text-brand-aliceBlue/70 hover:bg-white/5 hover:text-white"
                          }
                          ${collapsed ? "justify-center" : "mx-1"}
                        `}
                      >
                        <item.icon className={`w-5 h-5 shrink-0 ${isActive ? "text-white" : "opacity-70 group-hover:opacity-100"}`} />
                        {!collapsed && <span className="font-medium text-sm whitespace-nowrap">{item.label}</span>}
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
      <div className="p-4 border-t border-white/10 bg-black/20 shrink-0">
        <div className={`flex items-center ${collapsed ? "justify-center flex-col gap-4" : "gap-3"}`}>
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-brand-jasmine to-brand-coral flex items-center justify-center text-brand-prussian font-bold shadow-md shrink-0">
            {user?.firstName ? user.firstName.charAt(0).toUpperCase() : "A"}
          </div>

          {!collapsed && (
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-semibold truncate text-white">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-[10px] text-brand-jasmine uppercase tracking-tight font-bold opacity-80">
                {user?.role || "Instructor"}
              </p>
            </div>
          )}

          <button
            onClick={() => logout()}
            className="p-2 rounded-lg hover:bg-red-500/20 text-brand-aliceBlue/60 hover:text-brand-coral transition-colors ml-auto"
            title="Sign Out"
          >
            <ArrowRightOnRectangleIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
    </motion.aside>
  );
}