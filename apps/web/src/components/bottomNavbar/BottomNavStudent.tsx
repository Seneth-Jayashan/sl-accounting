import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  CalendarDays,
  Search,
  UserCircle,
  CreditCard
} from "lucide-react";

export default function BottomNavStudent() {
  const location = useLocation();
  const path = location.pathname;

  const tabs = [
    { 
      key: "dashboard", 
      label: "Home", 
      href: "/student/dashboard", 
      icon: LayoutDashboard 
    },
    { 
      key: "classes", 
      label: "My Classes", 
      href: "/student/classes", 
      icon: CalendarDays 
    },
    { 
      key: "browse", 
      label: "Browse", 
      href: "/classes", // Public catalog
      icon: Search 
    },
    { 
        key: "enrollments", 
        label: "Enrollments", 
        href: "/student/enrollment", 
        icon: CreditCard 
      },
    { 
      key: "profile", 
      label: "Profile", 
      href: "/student/profile", 
      icon: UserCircle 
    },
  ];

  return (
    <div className="fixed bottom-0 left-0 w-full bg-white/90 backdrop-blur-lg border-t border-gray-200 lg:hidden z-50 pb-safe">
      <div className="flex justify-around items-center h-16 px-2">
        {tabs.map((tab) => {
          // Check if tab is active (exact match for dashboard, startsWith for others)
          const isActive = tab.href === "/student/dashboard" 
            ? path === "/student/dashboard"
            : path.startsWith(tab.href);

          return (
            <Link 
              key={tab.key} 
              to={tab.href} 
              className="relative flex-1 flex flex-col items-center justify-center h-full space-y-1 group"
            >
              {/* Active Indicator Background */}
              {isActive && (
                <motion.div
                  layoutId="bottom-nav-active"
                  className="absolute -top-[1px] w-12 h-[3px] bg-brand-cerulean rounded-full shadow-[0_0_10px_rgba(5,102,138,0.5)]"
                  initial={false}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}

              {/* Icon with Animation */}
              <div className={`relative p-1 rounded-xl transition-colors duration-300 ${isActive ? "text-brand-cerulean" : "text-gray-400 group-hover:text-gray-600"}`}>
                <tab.icon 
                  size={24} 
                  strokeWidth={isActive ? 2.5 : 2}
                  className={`transition-transform duration-300 ${isActive ? "-translate-y-0.5" : ""}`}
                />
              </div>

              {/* Label */}
              <span className={`text-[10px] font-bold transition-colors duration-300 ${isActive ? "text-brand-prussian" : "text-gray-400"}`}>
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}