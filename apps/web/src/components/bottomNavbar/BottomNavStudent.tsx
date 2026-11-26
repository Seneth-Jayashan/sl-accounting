import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  CalendarDays,
  BookOpen,
  Library,
  CreditCard,
  Users,
  HelpCircle,
  Menu,
  X,
  LogOut,
  ChevronRight,
  ClipboardList,
  ListVideo,
  FileText,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

export default function BottomNavStudent() {
  const { logout } = useAuth();
  const location = useLocation();
  const path = location.pathname;
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  // --- 1. MAIN TABS (Always Visible) ---
  const mainTabs = [
    {
      key: "overview",
      label: "Overview",
      href: "/student/dashboard",
      icon: LayoutDashboard,
    },
    {
      key: "classes",
      label: "Classes",
      href: "/student/classes",
      icon: CalendarDays,
    },
    {
      key: "quizzes",
      label: "Quizzes",
      href: "/student/quizzes/history",
      icon: ClipboardList,
    },
    {
      key: "profile",
      label: "Profile",
      href: "/student/Profile",
      icon: Users,
    },
  ];

  // --- 2. MORE MENU ITEMS (Slide-Up Drawer) ---
  const moreItems = [
    {
      key: "papers",
      label: "Essay Papers",
      href: "/student/papers",
      icon: FileText,
      desc: "Submit & track essay papers",
    },
    {
      key: "tutes",
      label: "My Tutes",
      href: "/student/my-tutes",
      icon: BookOpen,
      desc: "Track physical study pack deliveries",
    },
    {
      key: "lesson-packs",
      label: "Lesson Packs",
      href: "/student/lesson-packs",
      icon: ListVideo,
      desc: "Browse & watch video bundles",
    },
    {
      key: "materials",
      label: "Study Materials",
      href: "/student/knowledge-base",
      icon: Library,
      desc: "Notes, past papers & guides",
    },
    {
      key: "payments",
      label: "Payments",
      href: "/student/payments",
      icon: CreditCard,
      desc: "View transactions & receipts",
    },
    {
      key: "support",
      label: "Support",
      href: "/student/tickets",
      icon: HelpCircle,
      desc: "Open a live support ticket",
    },
    {
      key: "feedback",
      label: "Feedback",
      href: "/student/review",
      icon: MessageSquare,
      desc: "Share your course review",
    },
  ];

  const isTabActive = (href: string) => {
    const normalizedPath = path.toLowerCase();
    const normalizedHref = href.toLowerCase();
    if (normalizedHref === "/student/dashboard") {
      return normalizedPath === "/student/dashboard";
    }
    return normalizedPath.startsWith(normalizedHref);
  };

  return (
    <>
      {/* --- MORE MENU DRAWER (Overlay) --- */}
      <AnimatePresence>
        {isMoreOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMoreOpen(false)}
              className="fixed inset-0 bg-black/60 z-[60] lg:hidden backdrop-blur-xs"
            />

            {/* Slide-up Sheet */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              className="fixed bottom-0 left-0 w-full bg-white rounded-t-[2rem] z-[70] lg:hidden overflow-hidden border-t border-gray-100 shadow-2xl"
            >
              {/* Handle Pill & Header */}
              <div className="pt-3 px-6 pb-4 border-b border-gray-100 bg-gray-50/50">
                <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-3" />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-brand-prussian text-brand-jasmine text-[10px] font-extrabold uppercase tracking-wider">
                      <Sparkles size={10} />
                      Student Menu
                    </span>
                    <h3 className="text-base font-extrabold text-brand-prussian">
                      More Options
                    </h3>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsMoreOpen(false)}
                    aria-label="Close menu"
                    className="w-9 h-9 rounded-xl bg-white border border-gray-200 text-gray-500 hover:bg-gray-100 hover:text-brand-prussian flex items-center justify-center transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Drawer Links */}
              <div className="p-4 space-y-2 pb-24 overflow-y-auto max-h-[75vh]">
                {moreItems.map((item) => {
                  const Icon = item.icon;
                  const active = isTabActive(item.href);

                  return (
                    <Link
                      key={item.key}
                      to={item.href}
                      onClick={() => setIsMoreOpen(false)}
                      className={`flex items-center gap-3.5 p-3.5 rounded-2xl border transition-all ${active
                          ? "bg-brand-aliceBlue/60 border-brand-cerulean/30 shadow-2xs"
                          : "bg-gray-50/80 border-transparent hover:bg-gray-100/80 active:scale-[0.99]"
                        }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-2xs transition-colors ${active
                            ? "bg-brand-cerulean text-white"
                            : "bg-white text-brand-cerulean border border-gray-100"
                          }`}
                      >
                        <Icon size={19} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-sm font-extrabold truncate ${active ? "text-brand-prussian" : "text-gray-800"
                            }`}
                        >
                          {item.label}
                        </p>
                        <p className="text-xs text-gray-400 truncate mt-0.5">
                          {item.desc}
                        </p>
                      </div>

                      <ChevronRight
                        size={16}
                        className={`shrink-0 ${active ? "text-brand-cerulean" : "text-gray-300"
                          }`}
                      />
                    </Link>
                  );
                })}

                {/* Logout Button */}
                <button
                  type="button"
                  onClick={() => {
                    setIsMoreOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-3.5 p-3.5 rounded-2xl bg-red-50/90 hover:bg-red-100/80 text-red-600 border border-red-100 transition-colors mt-3 active:scale-[0.99]"
                >
                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-2xs text-red-500 shrink-0">
                    <LogOut size={19} />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-extrabold">Log Out</p>
                    <p className="text-xs text-red-500/80">
                      Sign out of your student account
                    </p>
                  </div>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* --- BOTTOM NAVIGATION BAR --- */}
      <nav
        aria-label="Mobile Navigation"
        className="fixed bottom-0 left-0 w-full bg-white/95 backdrop-blur-xl border-t border-gray-200/80 lg:hidden z-50 pb-safe shadow-[0_-6px_24px_rgba(11,37,64,0.06)]"
      >
        <div className="flex justify-around items-center h-[70px] px-1.5">
          {mainTabs.map((tab) => {
            const active = !isMoreOpen && isTabActive(tab.href);
            const Icon = tab.icon;

            return (
              <Link
                key={tab.key}
                to={tab.href}
                onClick={() => setIsMoreOpen(false)}
                className="relative flex-1 flex flex-col items-center justify-center h-full gap-1 group"
              >
                {active && (
                  <motion.div
                    layoutId="bottom-nav-indicator"
                    className="absolute top-0 w-10 h-1 bg-brand-cerulean rounded-b-full"
                    transition={{ type: "spring", stiffness: 450, damping: 32 }}
                  />
                )}

                <div
                  className={`relative p-1.5 rounded-xl transition-all duration-200 ${active
                      ? "bg-brand-aliceBlue/80 text-brand-cerulean -translate-y-0.5"
                      : "text-gray-400 group-hover:text-brand-prussian group-active:scale-90"
                    }`}
                >
                  <Icon size={21} strokeWidth={active ? 2.5 : 2} />
                </div>

                <span
                  className={`text-[10px] font-bold tracking-tight transition-colors ${active ? "text-brand-prussian" : "text-gray-400"
                    }`}
                >
                  {tab.label}
                </span>
              </Link>
            );
          })}

          {/* --- MORE BUTTON --- */}
          <button
            type="button"
            onClick={() => setIsMoreOpen((prev) => !prev)}
            className="relative flex-1 flex flex-col items-center justify-center h-full gap-1 group"
          >
            {isMoreOpen && (
              <motion.div
                layoutId="bottom-nav-indicator"
                className="absolute top-0 w-10 h-1 bg-brand-prussian rounded-b-full"
                transition={{ type: "spring", stiffness: 450, damping: 32 }}
              />
            )}

            <div
              className={`relative p-1.5 rounded-xl transition-all duration-200 ${isMoreOpen
                  ? "bg-brand-prussian text-white -translate-y-0.5 shadow-xs"
                  : "text-gray-400 group-hover:text-brand-prussian group-active:scale-90"
                }`}
            >
              {isMoreOpen ? (
                <X size={21} strokeWidth={2.5} />
              ) : (
                <Menu size={21} strokeWidth={2} />
              )}
            </div>

            <span
              className={`text-[10px] font-bold tracking-tight transition-colors ${isMoreOpen ? "text-brand-prussian" : "text-gray-400"
                }`}
            >
              More
            </span>
          </button>
        </div>
      </nav>
    </>
  );
}