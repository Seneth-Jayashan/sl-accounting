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
  Menu,
  GraduationCap
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

// --- FIX: Make props optional to match DashboardLayout's expectations ---
type Props = { 
  collapsed?: boolean; 
  onToggle?: () => void; 
};

export default function SidebarStudent({ collapsed = false, onToggle }: Props) {
  const { user, logout } = useAuth();
  const location = useLocation();

  const navItems = [
    { key: "overview", label: "Overview", href: "/student/dashboard", icon: LayoutDashboard },
    { key: "classes", label: "My Classes", href: "/student/classes", icon: CalendarDays },
    { key: "materials", label: "Study Materials", href: "/student/materials", icon: BookOpen },
    { key: "payments", label: "Payments", href: "/student/payments", icon: CreditCard },
    { key: "community", label: "Community", href: "/student/community", icon: Users },
    { key: "tickets", label: "Support", href: "/student/tickets", icon: HelpCircle }
  ];

  return (
    <motion.aside 
      initial={false}
      animate={{ width: collapsed ? 80 : 260 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="h-screen bg-brand-prussian text-white flex flex-col shadow-2xl relative z-50 top-0"
    >
      
      {/* --- HEADER --- */}
      <div className="h-20 flex items-center justify-between px-5 border-b border-white/10">
        <div className="flex items-center gap-3 overflow-hidden">
           {/* Logo Icon */}
           <div className="w-10 h-10 bg-brand-cerulean rounded-xl flex items-center justify-center flex-shrink-0 text-white shadow-lg">
              <GraduationCap size={24} />
           </div>
           
           {/* Logo Text (Animated) */}
           <AnimatePresence>
             {!collapsed && (
               <motion.div 
                 initial={{ opacity: 0, x: -10 }}
                 animate={{ opacity: 1, x: 0 }}
                 exit={{ opacity: 0, x: -10 }}
                 className="whitespace-nowrap"
               >
                 <h1 className="font-bold text-lg leading-none">SL Accounting</h1>
                 <span className="text-[10px] text-brand-jasmine uppercase tracking-widest font-bold">Student Portal</span>
               </motion.div>
             )}
           </AnimatePresence>
        </div>
      </div>

      {/* Toggle Button (Absolute Positioned) */}
      <button 
        onClick={onToggle}
        className="absolute right-3 top-16 w-6 h-6 bg-brand-cerulean rounded-full flex items-center justify-center text-white shadow-md hover:bg-brand-coral transition-colors z-50"
      >
        {collapsed ? <Menu size={14} /> : <ChevronLeft size={14} />}
      </button>

      {/* --- NAVIGATION --- */}
      <nav className="flex-1 py-6 px-3 space-y-2 overflow-y-auto scrollbar-hide">
        {navItems.map((item) => {
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
                size={22} 
                className={`transition-transform duration-300 ${isActive ? "scale-110" : "group-hover:scale-110"}`} 
              />
              
              {!collapsed && (
                <span className="font-medium whitespace-nowrap">{item.label}</span>
              )}

              {/* Active Indicator Dot for Collapsed State */}
              {collapsed && isActive && (
                <div className="absolute right-2 top-2 w-2 h-2 bg-brand-jasmine rounded-full"></div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* --- USER PROFILE & FOOTER --- */}
      <div className="p-4 border-t border-white/10 bg-[#042f40]">
        <div className={`flex items-center ${collapsed ? "justify-center flex-col gap-4" : "gap-3"}`}>
          
          {/* Avatar */}
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-brand-jasmine to-brand-coral flex items-center justify-center text-brand-prussian font-bold shadow-md shrink-0">
            {user?.firstName ? user.firstName.charAt(0).toUpperCase() : "S"}
          </div>

          {/* User Info */}
          {!collapsed && (
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-bold truncate text-white">
                {user?.firstName || "Student"}
              </p>
              <p className="text-xs text-brand-aliceBlue/50 truncate">
                {user?.email || "student@slaccounting.lk"}
              </p>
            </div>
          )}

          {/* Logout Button */}
          <button 
            onClick={logout}
            className={`
              p-2 rounded-lg hover:bg-red-500/20 text-brand-aliceBlue/70 hover:text-red-400 transition-colors
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