import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../../layouts/DashboardLayout";
import SidebarAdmin from "../../../components/sidebar/SidebarAdmin";
import BottomNavAdmin from "../../../components/bottomNavbar/BottomNavAdmin";
import UserService from "../../../services/UserService"; 
import type { StudentUser } from "../../../services/UserService";
import {
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EllipsisHorizontalIcon,
  UserIcon,
  PhoneIcon,
  ArrowPathIcon,
  EyeIcon,
  PencilSquareIcon,
  TrashIcon
} from "@heroicons/react/24/outline";

// Helper: Avatar Color Generator
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

export default function AllStudents() {
  const navigate = useNavigate();
  
  // -- State --
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBatch, setSelectedBatch] = useState("All");
  const [students, setStudents] = useState<StudentUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // -- Menu State --
  const [openActionId, setOpenActionId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // -- Search Debounce --
  const [debouncedSearch, setDebouncedSearch] = useState(searchTerm);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // -- Click Outside to Close Menu --
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenActionId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // -- Fetch Data --
  const fetchStudents = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await UserService.getStudents({
        search: debouncedSearch,
        batch: selectedBatch !== "All" ? selectedBatch : undefined
      });
      // Adjust based on your API response structure (e.g. data.users or data.students)
      setStudents(data.users || []); 
    } catch (err: any) {
      console.error(err);
      setError("Failed to load students. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, selectedBatch]);

  // -- Actions --
  const toggleActionMenu = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setOpenActionId(openActionId === id ? null : id);
  };

  const handleView = (id: string) => navigate(`/admin/students/${id}`);
  const handleEdit = (id: string) => navigate(`/admin/students/edit/${id}`);
  
  const handleDelete = async (id: string) => {
    if(window.confirm("Are you sure you want to remove this student?")) {
        // Call delete service here
        alert("Delete functionality to be connected to API");
    }
  };

  // -- Right Sidebar (Stats) --
  const StatsSidebar = (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <h3 className="font-semibold text-gray-800 mb-4">Quick Stats</h3>
        <div className="grid grid-cols-2 gap-3">
            <div className="bg-blue-50 p-3 rounded-xl text-center">
                <span className="block text-2xl font-bold text-blue-700">{students.length}</span>
                <span className="text-xs text-blue-600">Total Found</span>
            </div>
             <div className="bg-emerald-50 p-3 rounded-xl text-center">
                <span className="block text-2xl font-bold text-emerald-700">
                  {students.filter(s => s.isVerified).length}
                </span>
                <span className="text-xs text-emerald-600">Active</span>
            </div>
        </div>
      </div>
    </div>
  );

  return (
    <DashboardLayout Sidebar={SidebarAdmin} BottomNav={BottomNavAdmin} rightSidebar={StatsSidebar}>
      <div className="space-y-6">
        
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Students Directory</h1>
            <p className="text-gray-500 text-sm mt-1">Manage and view all registered students.</p>
          </div>
          <button 
            onClick={() => navigate("/admin/students/add")} 
            className="flex items-center justify-center gap-2 bg-[#0b2540] hover:bg-[#1a3b5c] text-white px-5 py-2.5 rounded-xl font-medium transition-colors shadow-sm shadow-blue-900/10"
          >
            <PlusIcon className="w-5 h-5" />
            <span>Add Student</span>
          </button>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
          
          {/* Search Input */}
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search by name, Reg No..." 
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-[#0b2540]/20 outline-none text-gray-700 placeholder-gray-400 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Batch Filter & Refresh */}
           <div className="flex items-center gap-2">
            <div className="relative">
              <FunnelIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <select 
                className="pl-10 pr-8 py-2 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-[#0b2540]/20 outline-none text-gray-700 appearance-none cursor-pointer"
                value={selectedBatch}
                onChange={(e) => setSelectedBatch(e.target.value)}
              >
                <option value="All">All Batches</option>
                <option value="2024 A/L">2024 A/L</option>
                <option value="2025 A/L">2025 A/L</option>
                <option value="2026 A/L">2026 A/L</option>
                <option value="Revision">Revision</option>
              </select>
            </div>
            
            <button 
              onClick={fetchStudents} 
              className="p-2 bg-gray-50 rounded-xl hover:bg-gray-100 text-gray-600 transition-colors"
              title="Refresh List"
            >
               <ArrowPathIcon className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Error State */}
        {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-2">
                <span>⚠️ {error}</span>
                <button onClick={fetchStudents} className="underline text-sm ml-auto">Retry</button>
            </div>
        )}

        {/* Main Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden min-h-[400px] relative">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
               <ArrowPathIcon className="w-8 h-8 animate-spin mb-2" />
               <p>Loading students...</p>
            </div>
          ) : (
            <div className="overflow-x-visible"> {/* Allow Dropdowns to overflow */}
               <table className="w-full text-left border-collapse">
                  <thead className="bg-gray-50/50 text-xs uppercase text-gray-500 font-semibold border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-4">Student Name</th>
                      <th className="px-6 py-4">Reg & Batch</th>
                      <th className="px-6 py-4">Contact</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {students.map(student => {
                       const id = student._id || "unknown";
                       const displayName = student.firstName ? `${student.firstName} ${student.lastName || ''}` : "Unknown";
                       const displayBatch = student.batch || "N/A";
                       const displayReg = student.regNo || "PENDING";
                       const isActive = student.isVerified; 

                       return (
                         <tr key={id} className="hover:bg-gray-50/60 transition-colors group">
                           
                           {/* Name */}
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

                           {/* Batch & Reg */}
                           <td className="px-6 py-4">
                             <div className="text-sm font-medium text-gray-900">{displayReg}</div>
                             <div className="text-xs text-gray-500">{displayBatch}</div>
                           </td>

                           {/* Contact */}
                           <td className="px-6 py-4 text-sm text-gray-500">
                             <div className="flex items-center gap-2">
                               <PhoneIcon className="w-3.5 h-3.5 text-gray-400" />
                               {student.phoneNumber || "N/A"}
                             </div>
                           </td>

                           {/* Status Badge */}
                           <td className="px-6 py-4">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${isActive ? 'bg-green-50 text-green-700 border-green-100' : 'bg-yellow-50 text-yellow-700 border-yellow-100'}`}>
                                <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${isActive ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
                                {isActive ? 'Active' : 'Pending'}
                              </span>
                           </td>

                           {/* Actions Dropdown */}
                           <td className="px-6 py-4 text-right relative">
                              <button 
                                onClick={(e) => toggleActionMenu(e, id)} 
                                className={`p-1.5 rounded-lg transition-colors ${openActionId === id ? 'bg-gray-100 text-[#0b2540]' : 'text-gray-400 hover:text-[#0b2540] hover:bg-gray-50'}`}
                              >
                                <EllipsisHorizontalIcon className="w-6 h-6" />
                              </button>
                              
                              {/* Menu */}
                              {openActionId === id && (
                                <div 
                                  ref={menuRef} 
                                  className="absolute right-8 top-6 z-50 w-44 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in duration-200 origin-top-right"
                                >
                                   <div className="py-1">
                                     <button onClick={() => handleView(id)} className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors">
                                       <EyeIcon className="w-4 h-4 text-gray-400" /> View Profile
                                     </button>
                                     <button onClick={() => handleEdit(id)} className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors">
                                       <PencilSquareIcon className="w-4 h-4 text-gray-400" /> Edit Details
                                     </button>
                                     <div className="h-px bg-gray-100 my-1"></div>
                                     <button onClick={() => handleDelete(id)} className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors">
                                       <TrashIcon className="w-4 h-4 text-red-500" /> Delete User
                                     </button>
                                   </div>
                                </div>
                              )}
                           </td>
                         </tr>
                       );
                    })}
                    
                    {/* Empty State */}
                    {!isLoading && students.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-16 text-center">
                          <div className="flex flex-col items-center justify-center">
                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                              <UserIcon className="w-8 h-8 text-gray-300" />
                            </div>
                            <h3 className="text-gray-900 font-medium mb-1">No students found</h3>
                            <p className="text-gray-500 text-sm">Try adjusting your search or filters.</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
               </table>
            </div>
          )}
          
          {/* Pagination (Static Placeholder) */}
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex items-center justify-between">
            <div className="text-sm text-gray-500">Showing <span className="font-medium text-gray-900">{students.length}</span> results</div>
            <div className="flex gap-2">
              <button className="px-3 py-1 text-sm border border-gray-300 rounded-lg bg-white text-gray-400 cursor-not-allowed" disabled>Previous</button>
              <button className="px-3 py-1 text-sm border border-gray-300 rounded-lg bg-white hover:bg-gray-50 text-gray-600">Next</button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}