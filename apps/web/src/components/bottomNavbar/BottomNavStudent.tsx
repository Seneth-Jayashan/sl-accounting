import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  HomeIcon,
  AcademicCapIcon,
  MagnifyingGlassIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";

// Helper to determine active state
const getLinkClass = (isActive: boolean) =>
  `flex flex-col items-center justify-center w-full h-full space-y-1 ${
    isActive ? "text-[#0b2540]" : "text-gray-400 hover:text-gray-600"
  }`;

export default function BottomNavStudent() {
  const location = useLocation();
  const path = location.pathname;

  return (
    <div className="fixed bottom-0 left-0 w-full h-16 bg-white border-t border-gray-200 lg:hidden z-50">
      <div className="grid grid-cols-4 h-full">
        
        {/* 1. Dashboard */}
        <Link to="/student/dashboard" className={getLinkClass(path === "/student/dashboard")}>
          <HomeIcon className={`w-6 h-6 ${path === "/student/dashboard" ? "stroke-2" : "stroke-1.5"}`} />
          <span className="text-[10px] font-medium">Home</span>
        </Link>

        {/* 2. My Classes (Enrollments) */}
        <Link to="/student/enrollments" className={getLinkClass(path.startsWith("/student/enrollments"))}>
          <AcademicCapIcon className={`w-6 h-6 ${path.startsWith("/student/enrollments") ? "stroke-2" : "stroke-1.5"}`} />
          <span className="text-[10px] font-medium">My Classes</span>
        </Link>

        {/* 3. Browse (Public Catalog) */}
        <Link to="/classes" className={getLinkClass(path.startsWith("/classes"))}>
          <MagnifyingGlassIcon className={`w-6 h-6 ${path.startsWith("/classes") ? "stroke-2" : "stroke-1.5"}`} />
          <span className="text-[10px] font-medium">Browse</span>
        </Link>

        {/* 4. Profile */}
        <Link to="/student/profile" className={getLinkClass(path.startsWith("/student/profile"))}>
          <UserCircleIcon className={`w-6 h-6 ${path.startsWith("/student/profile") ? "stroke-2" : "stroke-1.5"}`} />
          <span className="text-[10px] font-medium">Profile</span>
        </Link>

      </div>
    </div>
  );
}