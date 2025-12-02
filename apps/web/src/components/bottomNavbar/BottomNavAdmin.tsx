// components/SidebarAdmin.tsx (or BottomNavAdmin.tsx)
import { useState } from "react";
import {
  HomeIcon,
  UsersIcon,
  ClipboardDocumentCheckIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  AcademicCapIcon,
  CurrencyDollarIcon,
  BookOpenIcon,
  EllipsisHorizontalIcon, // Import icon for "More"
  XMarkIcon // Import icon for closing
} from "@heroicons/react/24/outline";

export default function BottomNavAdmin() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const nav = [
    { key: "overview", label: "Overview", href: "/admin/dashboard", Icon: HomeIcon },
    { key: "students", label: "Students", href: "/admin/students", Icon: UsersIcon },
    { key: "classes", label: "Classes", href: "/admin/classes", Icon: AcademicCapIcon },
    { key: "payments", label: "Payments", href: "/admin/payments", Icon: CurrencyDollarIcon },

    // --- Cutoff point ---
    { key: "attendance", label: "Marking", href: "/admin/attendance", Icon: ClipboardDocumentCheckIcon },
    { key: "materials", label: "Materials", href: "/admin/materials", Icon: BookOpenIcon },
    { key: "reports", label: "Reports", href: "/admin/reports", Icon: ChartBarIcon },
    { key: "settings", label: "Settings", href: "/admin/settings", Icon: Cog6ToothIcon },
  ];

  // First 4 items shown on the bar
  const visibleNav = nav.slice(0, 4);
  // Remaining items shown in the drop-up
  const hiddenNav = nav.slice(4);

  return (
    <>
      {/* 1. Invisible Overlay: Closes menu when clicking outside */}
      {isMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-40 lg:hidden" 
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      {/* 2. Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 lg:hidden z-50 pb-safe">
        
        {/* The Drop-Up Menu */}
        <div
          className={`absolute bottom-full right-2 mb-3 w-48 bg-white rounded-2xl shadow-2xl border border-gray-100 transition-all duration-200 origin-bottom-right overflow-hidden ${
            isMenuOpen ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-4 pointer-events-none"
          }`}
        >
          <div className="p-2 space-y-1">
            <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              More Options
            </div>
            {hiddenNav.map((n) => (
              <a
                key={n.key}
                href={n.href}
                className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-gray-50 text-gray-700 hover:text-[#0b2540] transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                <n.Icon className="w-5 h-5" />
                <span className="text-sm font-medium">{n.label}</span>
              </a>
            ))}
          </div>
        </div>

        {/* The Main 5 Icons Grid */}
        <nav className="grid grid-cols-5 items-center px-2 py-2">
          
          {/* Render first 4 items */}
          {visibleNav.map((n) => (
            <a
              key={n.key}
              href={n.href}
              className="flex flex-col items-center justify-center py-1 rounded-lg text-gray-500 hover:text-[#0b2540] hover:bg-gray-50 transition-colors"
            >
              <n.Icon className="w-6 h-6 mb-1" />
              <span className="text-[10px] font-medium truncate w-full text-center">
                {n.label}
              </span>
            </a>
          ))}

          {/* The 5th Item: "More" Toggle Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={`flex flex-col items-center justify-center py-1 rounded-lg transition-colors ${
              isMenuOpen ? "text-[#0b2540] bg-blue-50" : "text-gray-500 hover:bg-gray-50"
            }`}
          >
            {isMenuOpen ? (
              <XMarkIcon className="w-6 h-6 mb-1" />
            ) : (
              <EllipsisHorizontalIcon className="w-6 h-6 mb-1" />
            )}
            <span className="text-[10px] font-medium truncate w-full text-center">
              {isMenuOpen ? "Close" : "More"}
            </span>
          </button>

        </nav>
      </div>
    </>
  );
}