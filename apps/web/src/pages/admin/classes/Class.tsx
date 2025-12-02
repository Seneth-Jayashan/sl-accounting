import React, { useState } from "react";
import DashboardLayout from "../../../layouts/DashboardLayout";
import SidebarAdmin from "../../../components/sidebar/SidebarAdmin";
import BottomNavAdmin from "../../../components/bottomNavbar/BottomNavAdmin";
import {
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  UsersIcon,
  ClockIcon,
  VideoCameraIcon,
  MapPinIcon,
  EllipsisVerticalIcon,
  AcademicCapIcon
} from "@heroicons/react/24/outline";

// --- Types ---
type ClassItem = {
  id: number;
  title: string;
  batch: string;
  type: "Theory" | "Revision" | "Paper Class";
  day: string;
  time: string;
  location: "Zoom" | "Physical" | "Hybrid";
  students: number;
  status: "Active" | "Paused";
  color: string;
};

// --- Mock Data ---
const classesData: ClassItem[] = [
  {
    id: 1,
    title: "Accounting Theory",
    batch: "2025 A/L",
    type: "Theory",
    day: "Saturday",
    time: "08:00 AM - 12:00 PM",
    location: "Hybrid",
    students: 145,
    status: "Active",
    color: "bg-blue-600"
  },
  {
    id: 2,
    title: "Costing Revision",
    batch: "2024 A/L",
    type: "Revision",
    day: "Monday",
    time: "04:00 PM - 07:00 PM",
    location: "Zoom",
    students: 310,
    status: "Active",
    color: "bg-emerald-600"
  },
  {
    id: 3,
    title: "Paper Class - Unit 1",
    batch: "2024 A/L",
    type: "Paper Class",
    day: "Wednesday",
    time: "06:00 PM - 09:00 PM",
    location: "Physical",
    students: 85,
    status: "Paused",
    color: "bg-purple-600"
  },
];

export default function ClassesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("All");

  // Filter Logic
  const filteredClasses = classesData.filter((cls) => {
    const matchesSearch = cls.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          cls.batch.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "All" || cls.type === filterType;
    return matchesSearch && matchesType;
  });

  // --- Custom Right Sidebar for this Page ---
  const ClassStatsSidebar = (
    <div className="space-y-6">
      {/* Widget 1: Summary */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <h3 className="font-semibold text-gray-800 mb-4">Class Overview</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><AcademicCapIcon className="w-5 h-5"/></div>
              <span className="text-sm font-medium text-gray-600">Total Classes</span>
            </div>
            <span className="font-bold text-gray-900">12</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg"><UsersIcon className="w-5 h-5"/></div>
              <span className="text-sm font-medium text-gray-600">Total Enrollments</span>
            </div>
            <span className="font-bold text-gray-900">540</span>
          </div>
        </div>
      </div>

      {/* Widget 2: Quick Links */}
      <div className="bg-[#0b2540] rounded-2xl p-5 shadow-sm text-white">
        <h3 className="font-semibold mb-2">Need Help?</h3>
        <p className="text-sm text-gray-300 mb-4">Check the guide on how to setup Zoom links for hybrid classes.</p>
        <button className="w-full py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors">
          View Documentation
        </button>
      </div>
    </div>
  );

  return (
    <DashboardLayout 
      Sidebar={SidebarAdmin} 
      BottomNav={BottomNavAdmin}
      rightSidebar={ClassStatsSidebar} // Passing custom sidebar
    >
      <div className="space-y-6">
        
        {/* PAGE HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Classes</h1>
            <p className="text-gray-500 text-sm mt-1">Manage batches, schedules, and class settings.</p>
          </div>
          <button className="flex items-center justify-center gap-2 bg-[#0b2540] hover:bg-[#1a3b5c] text-white px-4 py-2.5 rounded-xl font-medium transition-colors shadow-sm">
            <PlusIcon className="w-5 h-5" />
            <span>Create New Class</span>
          </button>
        </div>

        {/* FILTERS & SEARCH */}
        <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input 
              type="text"
              placeholder="Search by name or batch..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none text-gray-700 placeholder-gray-400"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
             <div className="relative">
               <FunnelIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
               <select 
                 className="pl-10 pr-8 py-2 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none text-gray-700 appearance-none cursor-pointer"
                 value={filterType}
                 onChange={(e) => setFilterType(e.target.value)}
               >
                 <option value="All">All Types</option>
                 <option value="Theory">Theory</option>
                 <option value="Revision">Revision</option>
                 <option value="Paper Class">Paper Class</option>
               </select>
             </div>
          </div>
        </div>

        {/* CLASS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredClasses.map((cls) => (
            <div key={cls.id} className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col">
              
              {/* Card Header / Banner */}
              <div className={`h-2 ${cls.color} w-full`}></div>
              
              <div className="p-5 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                  <div className="px-2.5 py-1 rounded-md bg-gray-100 text-xs font-bold text-gray-600 uppercase tracking-wide">
                    {cls.batch}
                  </div>
                  <button className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-50">
                    <EllipsisVerticalIcon className="w-6 h-6" />
                  </button>
                </div>

                <h3 className="text-lg font-bold text-gray-900 mb-1">{cls.title}</h3>
                <div className="flex items-center gap-2 mb-4">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    cls.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {cls.status}
                  </span>
                  <span className="text-xs text-gray-400">•</span>
                  <span className="text-xs text-gray-500 font-medium">{cls.type}</span>
                </div>

                {/* Details Grid */}
                <div className="space-y-3 mt-auto">
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <ClockIcon className="w-5 h-5 text-gray-400" />
                    <span>{cls.day}, {cls.time}</span>
                  </div>
                  
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    {cls.location === 'Zoom' ? <VideoCameraIcon className="w-5 h-5 text-gray-400" /> : <MapPinIcon className="w-5 h-5 text-gray-400" />}
                    <span>{cls.location} Class</span>
                  </div>

                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <UsersIcon className="w-5 h-5 text-gray-400" />
                    <span>{cls.students} Students Enrolled</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-6 pt-4 border-t border-gray-50 flex gap-3">
                  <button className="flex-1 py-2 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                    Edit
                  </button>
                  <button className="flex-1 py-2 text-sm font-medium text-white bg-[#0b2540] hover:bg-[#153454] rounded-lg transition-colors shadow-sm">
                    Manage
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* New Class Placeholder Card (Optional) */}
          <button className="border-2 border-dashed border-gray-300 rounded-2xl p-6 flex flex-col items-center justify-center text-gray-400 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50/50 transition-all min-h-[300px]">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3 group-hover:bg-blue-100">
              <PlusIcon className="w-6 h-6" />
            </div>
            <span className="font-semibold">Add New Class</span>
          </button>
        </div>
        
      </div>
    </DashboardLayout>
  );
}