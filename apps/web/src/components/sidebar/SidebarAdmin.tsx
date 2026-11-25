import React, { useState, useEffect, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  HomeIcon,
  UsersIcon,
  ClipboardDocumentCheckIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  ChatBubbleLeftRightIcon,
  AcademicCapIcon,
  CurrencyDollarIcon,
  BookOpenIcon,
  PhoneIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  MegaphoneIcon,
  MagnifyingGlassIcon,
  TruckIcon,
  DocumentTextIcon,
  StarIcon,
  NewspaperIcon,
  RectangleStackIcon,
  PresentationChartLineIcon,
  XMarkIcon,
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
      { key: "reports-payments", label: "Payments Report", href: "/admin/reports/payments", icon: ChartBarIcon },
      { key: "reports-attendance", label: "Attendance Report", href: "/admin/reports/attendance", icon: PresentationChartLineIcon },
    ],
  },
  {
    title: "News & Updates",
    items: [
      { key: "news", label: "News & Updates", href: "/admin/news", icon: NewspaperIcon },
    ],
  },
  {
    title: "Community",
    items: [
      { key: "community", label: "Community", href: "/admin/community", icon: ChatBubbleLeftRightIcon },
      { key: "reviews", label: "Reviews", href: "/admin/reviews", icon: StarIcon },
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
      { key: "batches", label: "Batches", href: "/admin/batches", icon: RectangleStackIcon },
      { key: "classes", label: "Live Classes", href: "/admin/classes", icon: AcademicCapIcon },
      { key: "materials", label: "Materials", href: "/admin/materials", icon: BookOpenIcon },
      { key: "sessions", label: "Sessions", href: "/admin/sessions", icon: PresentationChartLineIcon },
      { key: "quizzes", label: "Quizzes", href: "/admin/quizzes", icon: ClipboardDocumentCheckIcon },
      { key: "papers", label: "Essay Papers", href: "/admin/papers", icon: DocumentTextIcon },
      { key: "lesson-packs", label: "Lesson Packs", href: "/admin/lesson-packs", icon: RectangleStackIcon },
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
      { key: "tute-delivery", label: "Tute Delivery", href: "/admin/tute-delivery", icon: TruckIcon },
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
    ],
  },
  {
    title: "Settings",
    items: [
      { key: "settings", label: "Settings", href: "/admin/settings", icon: Cog6ToothIcon },
    ],
  },
];

export default function SidebarAdmin({ collapsed = false, onToggle }: Props) {
  const { user, logout } = useAuth();
  const location = useLocation();

  const [openSections, setOpenSections] = useState<string[]>(["System"]);
  const [searchQuery, setSearchQuery] = useState("");

  // Automatically expand the section containing the active route
  useEffect(() => {
    const currentPath = location.pathname;
    const activeSection = MENU_STRUCTURE.find((section) =>
      section.items.some((item) => currentPath.startsWith(item.href))
    );

    if (activeSection) {
      setOpenSections((prev) =>
        prev.includes(activeSection.title) ? prev : [...prev, activeSection.title]
      );
    }
  }, [location.pathname]);

  const toggleSection = (title: string) => {
    setOpenSections((prev) =>
      prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title]
    );
  };

  // Filter menu items when searching
  const filteredMenu = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q || collapsed) return MENU_STRUCTURE;

    return MENU_STRUCTURE.map((section) => ({
      ...section,
      items: section.items.filter(
        (item) =>
          item.label.toLowerCase().includes(q) ||
          section.title.toLowerCase().includes(q)
      ),
    })).filter((section) => section.items.length > 0);
  }, [searchQuery, collapsed]);

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 84 : 276 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      className="hidden lg:flex flex-col h-screen sticky top-0 bg-gradient-to-b from-brand-prussian via-[#07273D] to-[#02121E] text-white border-r border-white/10 shadow-2xl z-40 shrink-0 select-none"
    >
      {/* --- HEADER --- */}
      <div className="h-20 flex items-center justify-between px-4 border-b border-white/10 shrink-0">
        <div className={`flex items-center gap-3 overflow-hidden ${collapsed ? "mx-auto" : ""}`}>
          <div className="w-10 h-10 bg-gradient-to-br from-brand-cerulean to-sky-400 rounded-xl flex items-center justify-center shrink-0 text-white shadow-lg shadow-brand-cerulean/25 ring-1 ring-white/20">
            <AcademicCapIcon className="w-6 h-6" />
          </div>

          <AnimatePresence mode="wait">
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.15 }}
                className="whitespace-nowrap"
              >
                <h1 className="font-bold text-base tracking-tight leading-tight text-white">
                  SL Accounting
                </h1>
                <span className="text-[10px] text-brand-jasmine uppercase tracking-[0.18em] font-semibold">
                  Admin Portal
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {!collapsed && (
          <button
            onClick={onToggle}
            title="Collapse sidebar"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <ChevronLeftIcon className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Expand button when collapsed */}
      {collapsed && (
        <div className="flex justify-center pt-3">
          <button
            onClick={onToggle}
            title="Expand sidebar"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <ChevronRightIcon className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* --- QUICK SEARCH (Expanded only) --- */}
      {!collapsed && (
        <div className="px-4 pt-4 pb-2 shrink-0">
          <div className="relative">
            <MagnifyingGlassIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Jump to menu..."
              className="w-full pl-9 pr-8 py-2 bg-white/[0.06] border border-white/10 rounded-xl text-xs text-white placeholder:text-slate-400 focus:outline-none focus:bg-white/10 focus:border-brand-cerulean/60 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <XMarkIcon className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* --- NAVIGATION --- */}
      <nav className="flex-1 py-4 px-3 overflow-y-auto scrollbar-hide space-y-3">
        <style>{`.scrollbar-hide::-webkit-scrollbar { display: none; }`}</style>

        {filteredMenu.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-8">No matching menu items</p>
        ) : (
          filteredMenu.map((section, sectionIdx) => {
            const isMulti = section.items.length > 1;
            const isOpen =
              collapsed ||
              !isMulti ||
              searchQuery.trim().length > 0 ||
              openSections.includes(section.title);

            return (
              <div key={section.title} className="space-y-1">
                {/* Divider in collapsed mode */}
                {collapsed && sectionIdx > 0 && (
                  <div className="mx-3 my-2 border-t border-white/10" />
                )}

                {/* Section Header (Expanded mode) */}
                {!collapsed && (
                  isMulti ? (
                    <button
                      onClick={() => toggleSection(section.title)}
                      className="w-full flex items-center justify-between px-3 py-1.5 text-slate-400 hover:text-brand-jasmine transition-colors group"
                    >
                      <span className="text-[10px] font-bold uppercase tracking-[0.16em]">
                        {section.title}
                      </span>
                      <ChevronDownIcon
                        className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? "rotate-180 text-brand-jasmine" : ""
                          }`}
                      />
                    </button>
                  ) : (
                    <div className="px-3 pt-2 pb-1">
                      <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
                        {section.title}
                      </span>
                    </div>
                  )
                )}

                {/* Section Items */}
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={
                        collapsed || !isMulti
                          ? { opacity: 1, height: "auto" }
                          : { height: 0, opacity: 0 }
                      }
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden space-y-0.5"
                    >
                      {section.items.map((item) => {
                        const isActive = location.pathname.startsWith(item.href);
                        return (
                          <Link
                            key={item.key}
                            to={item.href}
                            title={collapsed ? item.label : undefined}
                            className={`
                              group relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150
                              ${isActive
                                ? "bg-white/10 text-white font-semibold ring-1 ring-white/10 shadow-sm"
                                : "text-slate-300/80 hover:bg-white/[0.06] hover:text-white font-medium"
                              }
                              ${collapsed ? "justify-center px-0 mx-1" : ""}
                            `}
                          >
                            {/* Active Left Accent Pill */}
                            {isActive && (
                              <motion.span
                                layoutId="activeSidebarIndicator"
                                className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-brand-cerulean shadow-[0_0_8px_rgba(56,189,248,0.8)]"
                              />
                            )}

                            <item.icon
                              className={`w-5 h-5 shrink-0 transition-colors ${isActive
                                  ? "text-brand-cerulean"
                                  : "text-slate-400 group-hover:text-white"
                                }`}
                            />

                            {!collapsed && (
                              <span className="text-sm truncate">{item.label}</span>
                            )}
                          </Link>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })
        )}
      </nav>

      {/* --- FOOTER --- */}
      <div className="p-3 border-t border-white/10 bg-black/20 shrink-0">
        <div
          className={`flex items-center p-2 rounded-xl bg-white/[0.04] border border-white/5 ${collapsed ? "flex-col gap-3 py-2.5" : "gap-3"
            }`}
        >
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-brand-jasmine to-brand-coral flex items-center justify-center text-brand-prussian font-bold text-sm shadow-md shrink-0 ring-2 ring-white/10">
            {user?.firstName ? user.firstName.charAt(0).toUpperCase() : "A"}
          </div>

          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate text-white leading-tight">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-[10px] text-brand-jasmine uppercase tracking-wider font-semibold mt-0.5 truncate">
                {user?.role || "Instructor"}
              </p>
            </div>
          )}

          <button
            onClick={() => logout()}
            className="p-2 rounded-lg text-slate-400 hover:bg-rose-500/20 hover:text-rose-300 transition-colors shrink-0"
            title="Sign Out"
          >
            <ArrowRightOnRectangleIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
    </motion.aside>
  );
}