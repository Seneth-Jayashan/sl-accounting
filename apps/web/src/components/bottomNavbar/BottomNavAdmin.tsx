import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  HomeIcon,
  UsersIcon,
  AcademicCapIcon,
  CurrencyDollarIcon,
  ClipboardDocumentCheckIcon,
  BookOpenIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  PhoneIcon,
  ChatBubbleLeftRightIcon,
  MegaphoneIcon,
  EllipsisHorizontalIcon,
  XMarkIcon,
  ChevronRightIcon,
  ArrowRightOnRectangleIcon
} from "@heroicons/react/24/outline";
import { useAuth } from "../../contexts/AuthContext";

export default function BottomNavAdmin() {
  const { logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const path = location.pathname;

  // --- 1. MAIN TABS (Always Visible) ---
  const mainTabs = [
    { key: "overview", label: "Home", href: "/admin/dashboard", icon: HomeIcon },
    { key: "classes", label: "Classes", href: "/admin/classes", icon: AcademicCapIcon },
    { key: "students", label: "Students", href: "/admin/students", icon: UsersIcon },
    { key: "payments", label: "Payments", href: "/admin/payments", icon: CurrencyDollarIcon },
  ];

  // --- 2. DRAWER ITEMS (Grouped) ---
  const drawerSections = [
    {
      title: "Academic Management",
      items: [
        { key: "batches", label: "Batches", href: "/admin/batches", icon: ClipboardDocumentCheckIcon },
        { key: "sessions", label: "Sessions", href: "/admin/sessions", icon: BookOpenIcon },
        { key: "materials", label: "Materials", href: "/admin/materials", icon: BookOpenIcon },
        { key: "announcements", label: "Announcements", href: "/admin/announcements", icon: MegaphoneIcon },
      ]
    },
    {
      title: "System & Community",
      items: [
        { key: "reports", label: "Reports", href: "/admin/reports", icon: ChartBarIcon },
        { key: "community", label: "Community", href: "/admin/community", icon: ChatBubbleLeftRightIcon },
        { key: "settings", label: "Settings", href: "/admin/settings", icon: Cog6ToothIcon },
      ]
    },
    {
      title: "Knowledge & Support",
      items: [
        { key: "knowledge", label: "Knowledge Base", href: "/admin/knowledge-base", icon: BookOpenIcon },
        { key: "knowledge-list", label: "Content List", href: "/admin/knowledge-list", icon: ClipboardDocumentCheckIcon },
        { key: "tickets", label: "Support Tickets", href: "/admin/chat", icon: ChatBubbleLeftRightIcon },
        { key: "contact", label: "Contact Requests", href: "/admin/support", icon: PhoneIcon },
      ]
    }
  ];

  return (
    <>
      {/* --- DRAWER OVERLAY --- */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 bg-black/60 z-[60] lg:hidden backdrop-blur-sm"
            />
            
            {/* Slide-up Drawer */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 w-full bg-white rounded-t-[2rem] z-[70] lg:hidden overflow-hidden border-t border-gray-100 shadow-2xl h-[85vh] flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-100 shrink-0 bg-white sticky top-0 z-10">
                <h3 className="text-xl font-bold text-brand-prussian">Admin Menu</h3>
                <button 
                  onClick={() => setIsMenuOpen(false)}
                  className="p-2 bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200 transition-colors"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              {/* Scrollable Links */}
              <div className="flex-1 overflow-y-auto p-4 space-y-8 pb-24">
                {drawerSections.map((section) => (
                  <div key={section.title}>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 px-2">
                      {section.title}
                    </h4>
                    <div className="space-y-2">
                      {section.items.map((item) => (
                        <Link
                          key={item.key}
                          to={item.href}
                          onClick={() => setIsMenuOpen(false)}
                          className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 active:bg-gray-100 transition-colors border border-transparent active:border-gray-200"
                        >
                          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-brand-cerulean shadow-sm border border-gray-100">
                            <item.icon className="w-5 h-5" />
                          </div>
                          <div className="flex-1 font-semibold text-gray-700">{item.label}</div>
                          <ChevronRightIcon className="w-4 h-4 text-gray-400" />
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}

                {/* Logout Button */}
                <button
                  onClick={() => {
                    logout();
                    setIsMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl bg-red-50 text-red-600 active:bg-red-100 transition-colors mt-6 border border-red-100"
                >
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm">
                    <ArrowRightOnRectangleIcon className="w-5 h-5" />
                  </div>
                  <span className="font-bold">Log Out</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* --- BOTTOM NAV BAR --- */}
      <div className="fixed bottom-0 left-0 w-full bg-white/95 backdrop-blur-xl border-t border-gray-200 lg:hidden z-50 pb-safe shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
        <div className="flex justify-around items-center h-[70px] px-1">
          
          {mainTabs.map((tab) => {
            const isActive = tab.href === "/admin/dashboard" 
              ? path === "/admin/dashboard"
              : path.startsWith(tab.href);

            return (
              <Link 
                key={tab.key} 
                to={tab.href} 
                onClick={() => setIsMenuOpen(false)}
                className="relative flex-1 flex flex-col items-center justify-center h-full space-y-1 group"
              >
                {/* Active Indicator */}
                {isActive && (
                  <motion.div
                    layoutId="bottom-nav-indicator"
                    className="absolute top-0 w-12 h-1 bg-brand-cerulean rounded-b-lg shadow-[0_0_10px_rgba(5,102,138,0.4)]"
                    initial={false}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}

                {/* Icon */}
                <div className={`relative p-1.5 rounded-xl transition-all duration-300 ${isActive ? "text-brand-cerulean -translate-y-1" : "text-gray-400 group-active:scale-90"}`}>
                  <tab.icon className="w-6 h-6" strokeWidth={isActive ? 2.5 : 2} />
                </div>

                {/* Label */}
                <span className={`text-[10px] font-bold transition-colors duration-300 ${isActive ? "text-brand-prussian" : "text-gray-400"}`}>
                  {tab.label}
                </span>
              </Link>
            );
          })}

          {/* MORE BUTTON */}
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="relative flex-1 flex flex-col items-center justify-center h-full space-y-1 group"
          >
            <div className={`relative p-1.5 rounded-xl transition-all duration-300 ${isMenuOpen ? "text-brand-prussian -translate-y-1" : "text-gray-400 group-active:scale-90"}`}>
              {isMenuOpen ? (
                <XMarkIcon className="w-6 h-6" strokeWidth={2.5} />
              ) : (
                <EllipsisHorizontalIcon className="w-6 h-6" strokeWidth={2} />
              )}
            </div>
            <span className={`text-[10px] font-bold transition-colors duration-300 ${isMenuOpen ? "text-brand-prussian" : "text-gray-400"}`}>
              {isMenuOpen ? "Close" : "More"}
            </span>
          </button>

        </div>
      </div>
    </>
  );
}