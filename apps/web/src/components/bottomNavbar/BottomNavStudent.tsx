import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  CalendarDays,
  BookOpen,
  CreditCard,
  Users,
  HelpCircle,
  Menu,
  X,
  LogOut,
  ChevronRight
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
      key: "dashboard", 
      label: "Home", 
      href: "/student/dashboard", 
      icon: LayoutDashboard 
    },
    { 
      key: "classes", 
      label: "Classes", 
      href: "/student/classes", 
      icon: CalendarDays 
    },
    { 
      key: "materials", 
      label: "Materials", 
      href: "/student/knowledge-base", 
      icon: BookOpen 
    },
    { 
      key: "profile", 
      label: "Profile", 
      href: "/student/profile", 
      icon: Users 
    },
  ];

  // --- 2. MORE MENU ITEMS (Hidden in Drawer) ---
  const moreItems = [
    {
      key: "payments",
      label: "Payment History",
      href: "/student/payments",
      icon: CreditCard,
      desc: "View transactions & slips"
    },
    {
      key: "support",
      label: "Help & Support",
      href: "/student/tickets",
      icon: HelpCircle,
      desc: "Contact admin support"
    }
  ];

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
              className="fixed inset-0 bg-black/60 z-[60] lg:hidden backdrop-blur-sm"
            />
            
            {/* Slide-up Menu */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 w-full bg-white rounded-t-[2rem] z-[70] lg:hidden overflow-hidden border-t border-gray-100 shadow-2xl"
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between p-6 pb-2">
                <h3 className="text-lg font-bold text-brand-prussian">Menu</h3>
                <button 
                  onClick={() => setIsMoreOpen(false)}
                  className="p-2 bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Drawer Links */}
              <div className="p-4 space-y-3 pb-24">
                {moreItems.map((item) => (
                  <Link
                    key={item.key}
                    to={item.href}
                    onClick={() => setIsMoreOpen(false)}
                    className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 active:bg-gray-100 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-brand-cerulean shadow-sm">
                      <item.icon size={20} />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-gray-800">{item.label}</p>
                      <p className="text-xs text-gray-500">{item.desc}</p>
                    </div>
                    <ChevronRight size={16} className="text-gray-400" />
                  </Link>
                ))}

                {/* Logout Button inside Drawer */}
                <button
                  onClick={() => {
                    logout();
                    setIsMoreOpen(false);
                  }}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl bg-red-50 text-red-600 active:bg-red-100 transition-colors mt-4"
                >
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm">
                    <LogOut size={20} />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-bold">Log Out</p>
                    <p className="text-xs opacity-70">Sign out of your account</p>
                  </div>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* --- BOTTOM NAVIGATION BAR --- */}
      <div className="fixed bottom-0 left-0 w-full bg-white/95 backdrop-blur-xl border-t border-gray-200 lg:hidden z-50 pb-safe shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
        <div className="flex justify-around items-center h-[70px] px-2">
          
          {mainTabs.map((tab) => {
            const isActive = tab.href === "/student/dashboard" 
              ? path === "/student/dashboard"
              : path.startsWith(tab.href);

            return (
              <Link 
                key={tab.key} 
                to={tab.href} 
                onClick={() => setIsMoreOpen(false)}
                className="relative flex-1 flex flex-col items-center justify-center h-full space-y-1 group"
              >
                {/* Active Indicator Line */}
                {isActive && (
                  <motion.div
                    layoutId="bottom-nav-active"
                    className="absolute top-0 w-10 h-1 bg-brand-cerulean rounded-b-lg shadow-sm"
                    initial={false}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}

                {/* Icon */}
                <div className={`relative p-1.5 rounded-xl transition-all duration-300 ${isActive ? "text-brand-cerulean -translate-y-1" : "text-gray-400 group-active:scale-90"}`}>
                  <tab.icon 
                    size={24} 
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                </div>

                {/* Label */}
                <span className={`text-[10px] font-bold transition-colors duration-300 ${isActive ? "text-brand-prussian" : "text-gray-400"}`}>
                  {tab.label}
                </span>
              </Link>
            );
          })}

          {/* --- MORE BUTTON --- */}
          <button 
            onClick={() => setIsMoreOpen(!isMoreOpen)}
            className="relative flex-1 flex flex-col items-center justify-center h-full space-y-1 group"
          >
            <div className={`relative p-1.5 rounded-xl transition-all duration-300 ${isMoreOpen ? "text-brand-prussian -translate-y-1" : "text-gray-400 group-active:scale-90"}`}>
              <Menu size={24} strokeWidth={isMoreOpen ? 2.5 : 2} />
            </div>
            <span className={`text-[10px] font-bold transition-colors duration-300 ${isMoreOpen ? "text-brand-prussian" : "text-gray-400"}`}>
              More
            </span>
          </button>

        </div>
      </div>
    </>
  );
}