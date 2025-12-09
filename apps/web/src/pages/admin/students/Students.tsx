import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate
import DashboardLayout from "../../../layouts/DashboardLayout";
import SidebarAdmin from "../../../components/sidebar/SidebarAdmin";
import BottomNavAdmin from "../../../components/bottomNavbar/BottomNavAdmin";
import UserService from "../../../services/userService"; 
import type { StudentUser } from "../../../services/userService";
import {
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EllipsisHorizontalIcon,
  UserIcon,
  PhoneIcon,
  ArrowDownTrayIcon,
  ArrowPathIcon,
  EyeIcon,
  PencilSquareIcon
} from "@heroicons/react/24/outline";

// Helper: Avatar Color
const getAvatarColor = (name: string) => {
  const colors = [
    "bg-blue-100 text-blue-600",
    "bg-purple-100 text-purple-600",
    "bg-emerald-100 text-emerald-600",
    "bg-pink-100 text-pink-600",
    "bg-orange-100 text-orange-600"
  ];
  return colors[name.length % colors.length];
};

export default function StudentsPage() {
  const navigate = useNavigate(); // Initialize Hook
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBatch, setSelectedBatch] = useState("All");
  
  const [students, setStudents] = useState<StudentUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Menu State
  const [openActionId, setOpenActionId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Debounce Search
  const [debouncedSearch, setDebouncedSearch] = useState(searchTerm);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Click Outside Listener
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenActionId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch Data
  const fetchStudents = async () => {
    setIsLoading(true);
    try {
      const data = await UserService.getStudents({
        search: debouncedSearch,
        batch: selectedBatch !== "All" ? selectedBatch : undefined
      });
      setStudents(data.users || []); // Assuming API returns { users: [...] }
    } catch (err: any) {
      console.error(err);
      setError("Failed to load students.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, selectedBatch]);

  // --- ACTIONS ---
  const handleViewStudent = (studentId: string) => {
    // Navigate to the View Page
    navigate(`/admin/students/${studentId}`);
  };

  const handleEditStudent = (studentId: string) => {
    navigate(`/admin/students/edit/${studentId}`);
  };

  const toggleActionMenu = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setOpenActionId(openActionId === id ? null : id);
  };

  // Right Sidebar
  const StudentStatsSidebar = (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <h3 className="font-semibold text-gray-800 mb-4">Quick Stats</h3>
        <div className="grid grid-cols-2 gap-3">
            <div className="bg-blue-50 p-3 rounded-xl text-center">
                <span className="block text-2xl font-bold text-blue-700">{students.length}</span>
                <span className="text-xs text-blue-600">Students</span>
            </div>
             <div className="bg-emerald-50 p-3 rounded-xl text-center">
                <span className="block text-2xl font-bold text-emerald-700">Active</span>
                <span className="text-xs text-emerald-600">Status</span>
            </div>
        </div>
      </div>
    </div>
  );

  return (
    <DashboardLayout Sidebar={SidebarAdmin} BottomNav={BottomNavAdmin} rightSidebar={StudentStatsSidebar}>
      <div className="space-y-6">
        
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Students Directory</h1>
            <p className="text-gray-500 text-sm">Manage registered students</p>
          </div>
          <button className="flex items-center gap-2 bg-[#0b2540] hover:bg-[#1a3b5c] text-white px-4 py-2 rounded-xl transition-colors">
            <PlusIcon className="w-5 h-5" /> <span>Add Student</span>
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search students..." 
              className="w-full pl-10 pr-4 py-2 bg-gray-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
           <div className="flex items-center gap-2">
            <div className="relative">
              <FunnelIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <select 
                className="pl-10 pr-8 py-2 bg-gray-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 appearance-none cursor-pointer"
                value={selectedBatch}
                onChange={(e) => setSelectedBatch(e.target.value)}
              >
                <option value="All">All Batches</option>
                <option value="2024 A/L">2024 A/L</option>
                <option value="2025 A/L">2025 A/L</option>
              </select>
            </div>
            <button onClick={fetchStudents} className="p-2 bg-gray-50 rounded-xl hover:bg-gray-100">
               <ArrowPathIcon className={`w-5 h-5 text-gray-600 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden min-h-[400px]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
               <ArrowPathIcon className="w-8 h-8 animate-spin mb-2" />
               <p>Loading...</p>
            </div>
          ) : (
            <div className="overflow-x-visible">
               <table className="w-full text-left">
                  <thead className="bg-gray-50/50 text-xs uppercase text-gray-500 font-semibold border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-4">Student</th>
                      <th className="px-6 py-4">Batch</th>
                      <th className="px-6 py-4">Contact</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {students.map(student => {
                       const displayName = student.firstName ? `${student.firstName} ${student.lastName || ''}` : "Unknown";
                       const status = student.isVerified ? "Active" : "Pending";
                       return (
                         <tr key={student._id} className="hover:bg-gray-50/50 transition-colors">
                           <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${getAvatarColor(displayName)}`}>
                                   {displayName.slice(0,2).toUpperCase()}
                                </div>
                                <div>
                                  <div className="font-medium text-gray-900">{displayName}</div>
                                  <div className="text-xs text-gray-400">{student.email}</div>
                                </div>
                              </div>
                           </td>
                           <td className="px-6 py-4 text-sm text-gray-500">{student.batch || "N/A"}</td>
                           <td className="px-6 py-4 text-sm text-gray-500">{student.phoneNumber || "N/A"}</td>
                           <td className="px-6 py-4">
                              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${status === 'Active' ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'}`}>
                                {status}
                              </span>
                           </td>
                           <td className="px-6 py-4 text-right relative">
                              <button onClick={(e) => toggleActionMenu(e, student._id || "")} className="p-1 text-gray-400 hover:text-[#0b2540] rounded-md hover:bg-gray-100">
                                <EllipsisHorizontalIcon className="w-6 h-6" />
                              </button>
                              
                              {/* Dropdown */}
                              {openActionId === student._id && (
                                <div ref={menuRef} className="absolute right-8 top-8 z-10 w-40 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in duration-200">
                                   <button onClick={() => handleViewStudent(student._id!)} className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                                     <EyeIcon className="w-4 h-4 text-gray-400" /> View
                                   </button>
                                   <button onClick={() => handleEditStudent(student._id!)} className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                                     <PencilSquareIcon className="w-4 h-4 text-gray-400" /> Edit
                                   </button>
                                </div>
                              )}
                           </td>
                         </tr>
                       );
                    })}
                  </tbody>
               </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}