import React from "react";
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
  ChevronLeftIcon
} from "@heroicons/react/24/outline";
import { useAuth } from "../../contexts/AuthContext";

type Props = { 
  collapsed?: boolean; 
  onToggle?: () => void; 
};

interface AdminNavItem {
  key: string;
  label: string;
  href: string;
  icon: React.ElementType;
}

const NAV_ITEMS: AdminNavItem[] = [
  { key: "overview", label: "Overview", href: "/admin/dashboard", icon: HomeIcon },
  { key: "students", label: "Students", href: "/admin/students", icon: UsersIcon },
  { key: "classes", label: "Classes", href: "/admin/classes", icon: AcademicCapIcon },
  { key: "batches", label: "Batches", href: "/admin/batches", icon: ClipboardDocumentCheckIcon },
  { key: "sessions", label: "Sessions", href: "/admin/sessions", icon: CurrencyDollarIcon },
  { key: "payments", label: "Payments", href: "/admin/payments", icon: BookOpenIcon },
  { key: "knowledge", label: "Knowledge Base", href: "/admin/knowledge-base", icon: BookOpenIcon },
  { key: "knowledge-list", label: "Knowledge List", href: "/admin/knowledge-list", icon: ClipboardDocumentCheckIcon },
  { key: "reports", label: "Reports", href: "/admin/reports", icon: ChartBarIcon },
  { key: "support", label: "Support", href: "/admin/support", icon: PhoneIcon },
  { key: "chat", label: "Chat", href: "/admin/chat", icon: ChatBubbleLeftRightIcon },
  { key: "settings", label: "Settings", href: "/admin/settings", icon: Cog6ToothIcon },
];

export default function SidebarAdmin({ collapsed = false, onToggle }: Props) {
  const { user, logout } = useAuth();
  const location = useLocation();

  return (
    <motion.aside 
      initial={false}
      animate={{ width: collapsed ? 80 : 260 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="hidden lg:flex flex-col h-screen bg-brand-prussian text-white shadow-2xl relative z-50 top-0"
    >
      {/* --- HEADER --- */}
      <div className="h-20 flex items-center justify-between px-5 border-b border-white/10">
        <div className="flex items-center gap-3 overflow-hidden">
           {/* Logo Icon using Cerulean */}
           <div className="w-10 h-10 bg-brand-cerulean rounded-xl flex items-center justify-center flex-shrink-0 text-white shadow-lg">
              <AcademicCapIcon className="w-6 h-6" />
           </div>
           
           {/* Animated Brand Text */}
           <AnimatePresence mode="wait">
             {!collapsed && (
               <motion.div 
                 initial={{ opacity: 0, x: -10 }}
                 animate={{ opacity: 1, x: 0 }}
                 exit={{ opacity: 0, x: -10 }}
                 className="whitespace-nowrap"
               >
                 <h1 className="font-bold text-lg leading-none">SL Accounting</h1>
                 <span className="text-[10px] text-brand-jasmine uppercase tracking-widest font-bold">Admin Portal</span>
               </motion.div>
             )}
           </AnimatePresence>
        </div>
      </div>

      {/* Absolute Toggle Button */}
      <button 
        onClick={onToggle}
        className="absolute right-3 top-16 w-6 h-6 bg-brand-cerulean rounded-full flex items-center justify-center text-white shadow-md hover:bg-brand-coral transition-colors z-50"
      >
        {collapsed ? <Bars3Icon className="w-3.5 h-3.5" /> : <ChevronLeftIcon className="w-3.5 h-3.5" />}
      </button>

      {/* --- NAVIGATION --- */}
      <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto scrollbar-hide">
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname.startsWith(item.href);
          
          return (
            <Link 
              key={item.key} 
              to={item.href}
              className={`
                group flex items-center gap-3 p-3 rounded-xl transition-all duration-200 relative
                ${isActive 
                  ? "bg-brand-cerulean text-white shadow-lg shadow-brand-cerulean/20" 
                  : "text-brand-aliceBlue/70 hover:bg-white/10 hover:text-white"
                }
                ${collapsed ? "justify-center" : ""}
              `}
              title={collapsed ? item.label : ""}
            >
              <item.icon 
                className={`w-5 h-5 transition-transform duration-300 ${isActive ? "scale-110" : "group-hover:scale-110"}`} 
              />
              
              {!collapsed && (
                <span className="font-medium text-sm whitespace-nowrap">{item.label}</span>
              )}

              {/* Active Dot using Jasmine for high contrast */}
              {collapsed && isActive && (
                <motion.div 
                  layoutId="activeDot"
                  className="absolute right-2 top-2 w-2 h-2 bg-brand-jasmine rounded-full"
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* --- FOOTER / PROFILE --- */}
      <div className="p-4 border-t border-white/10 bg-black/20">
        <div className={`flex items-center ${collapsed ? "justify-center flex-col gap-4" : "gap-3"}`}>
          
          {/* Avatar with Jasmine/Coral Gradient */}
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-brand-jasmine to-brand-coral flex items-center justify-center text-brand-prussian font-bold shadow-md shrink-0">
            {user?.firstName ? user.firstName.charAt(0).toUpperCase() : "A"}
          </div>

          {!collapsed && (
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-bold truncate text-white">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-[10px] text-brand-jasmine uppercase tracking-tighter font-bold">
                {user?.role || "Instructor"}
              </p>
            </div>
          )}

          <button 
            onClick={() => logout()}
            className={`
              p-2 rounded-lg hover:bg-red-500/20 text-brand-aliceBlue/60 hover:text-brand-coral transition-colors
              ${collapsed ? "" : "ml-auto"}
            `}
            title="Sign Out"
          >
            <ArrowRightOnRectangleIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
    </motion.aside>
  );
}