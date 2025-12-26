import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import {
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EllipsisHorizontalIcon,
  ArrowPathIcon,
  EyeIcon,
  PencilSquareIcon,
  UserIcon,
  TrashIcon
} from "@heroicons/react/24/outline";

// Layouts & Services
import DashboardLayout from "../../../layouts/DashboardLayout";
import SidebarAdmin from "../../../components/sidebar/SidebarAdmin";
import BottomNavAdmin from "../../../components/bottomNavbar/BottomNavAdmin";
import UserService, { type StudentUser } from "../../../services/UserService";
import BatchService, { type BatchData } from "../../../services/BatchService"; // Import Batch Service

// --- CONSTANTS ---
const AVATAR_COLORS = [
  "bg-blue-100 text-blue-600",
  "bg-purple-100 text-purple-600",
  "bg-emerald-100 text-emerald-600",
  "bg-pink-100 text-pink-600",
  "bg-orange-100 text-orange-600"
];

// Helper: Consistent Avatar Color
const getAvatarColor = (name: string) => {
  if (!name) return AVATAR_COLORS[0];
  return AVATAR_COLORS[name.length % AVATAR_COLORS.length];
};

// --- HOOK: Debounce ---
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export default function StudentsPage() {
  const navigate = useNavigate();
  
  // State
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBatch, setSelectedBatch] = useState("All");
  
  // Data State
  const [students, setStudents] = useState<StudentUser[]>([]);
  const [batches, setBatches] = useState<BatchData[]>([]); // Dynamic Batches
  const [isLoading, setIsLoading] = useState(true);
  
  // Dropdown Management
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const debouncedSearch = useDebounce(searchTerm, 500);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setOpenMenuId(null);
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  // --- 1. LOAD BATCHES (On Mount) ---
  useEffect(() => {
    const loadBatches = async () => {
      try {
        const data = await BatchService.getAllBatches(); // Fetch from API
        if (data.batches) {
            setBatches(data.batches);
        }
      } catch (error) {
        console.error("Failed to load batches", error);
      }
    };
    loadBatches();
  }, []);

  // --- 2. FETCH STUDENTS (On Filter Change) ---
  const fetchStudents = async () => {
    setIsLoading(true);
    try {
      const data = await UserService.getStudents({
        search: debouncedSearch,
        // Send 'undefined' if "All" is selected so backend ignores the filter
        batch: selectedBatch !== "All" ? selectedBatch : undefined
      });
      setStudents(data.users || []);
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, selectedBatch]);

  // --- ACTIONS ---
  const handleMenuClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setOpenMenuId(openMenuId === id ? null : id);
  };

  const handleDelete = async (id: string, name: string) => {
    setOpenMenuId(null);
    
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: `Delete ${name}? This cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      try {
        await UserService.deleteUser(id);
        Swal.fire('Deleted!', 'Student removed.', 'success');
        fetchStudents(); 
      } catch (error) {
        Swal.fire('Error', 'Failed to delete student.', 'error');
      }
    }
  };

  // --- SUB-COMPONENT: Stats ---
  const StatsSidebar = (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
           <UserIcon className="w-5 h-5 text-gray-400"/> Directory Stats
        </h3>
        <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 p-4 rounded-2xl text-center">
                <span className="block text-3xl font-bold text-blue-700">{students.length}</span>
                <span className="text-xs font-semibold text-blue-600 uppercase tracking-wide">Total</span>
            </div>
             <div className="bg-emerald-50 p-4 rounded-2xl text-center">
                <span className="block text-3xl font-bold text-emerald-700">
                  {students.filter(s => s.isVerified).length}
                </span>
                <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wide">Active</span>
            </div>
        </div>
      </div>
    </div>
  );

  return (
    <DashboardLayout Sidebar={SidebarAdmin} BottomNav={BottomNavAdmin} rightSidebar={StatsSidebar}>
      <div className="space-y-6 font-sans">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Students Directory</h1>
            <p className="text-gray-500 text-sm mt-1">Manage and monitor registered students</p>
          </div>
          <button 
            onClick={() => navigate("/admin/students/add")} 
            className="flex items-center gap-2 bg-[#0b2540] hover:bg-[#1a3b5c] text-white px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-blue-900/10 active:scale-95"
          >
            <PlusIcon className="w-5 h-5" /> <span className="font-semibold">Add Student</span>
          </button>
        </div>

        {/* Filters Bar */}
        <div className="flex flex-col md:flex-row gap-4 bg-white p-2 rounded-2xl shadow-sm border border-gray-100">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search by name, email or phone..." 
              className="w-full pl-11 pr-4 py-3 bg-gray-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0b2540]/20 transition-all text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <div className="relative h-full">
              <FunnelIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              
              {/* DYNAMIC BATCH DROPDOWN */}
              <select 
                className="h-full pl-10 pr-8 py-3 bg-gray-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0b2540]/20 appearance-none cursor-pointer text-sm font-medium text-gray-700 border-none min-w-[160px]"
                value={selectedBatch}
                onChange={(e) => setSelectedBatch(e.target.value)}
              >
                <option value="All">All Batches</option>
                {batches.map((batch) => (
                    // Use _id for value to ensure precise backend filtering
                    <option key={batch._id} value={batch._id}>
                        {batch.name}
                    </option>
                ))}
              </select>
              
            </div>
            {/* Refresh Button */}
            <button 
                onClick={fetchStudents}
                className="h-full px-4 bg-gray-50 rounded-xl hover:bg-gray-100 text-gray-600 transition-colors"
                title="Refresh List"
            >
               <ArrowPathIcon className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Students Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden min-h-[400px] flex flex-col">
          {isLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
               <ArrowPathIcon className="w-8 h-8 animate-spin mb-2" />
               <p className="text-sm">Loading students...</p>
            </div>
          ) : students.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8 text-center">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                    <UserIcon className="w-8 h-8 text-gray-300" />
                </div>
                <h3 className="text-gray-900 font-semibold">No students found</h3>
                <p className="text-sm mt-1">Try adjusting your search filters.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
               <table className="w-full text-left border-collapse">
                 <thead className="bg-gray-50/80 text-xs uppercase text-gray-500 font-semibold border-b border-gray-100">
                   <tr>
                     <th className="px-6 py-4">Student</th>
                     <th className="px-6 py-4">Batch</th>
                     <th className="px-6 py-4">Contact</th>
                     <th className="px-6 py-4">Status</th>
                     <th className="px-6 py-4 text-right">Actions</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-50">
                   {students.map(student => (
                     <StudentRow 
                        key={student._id} 
                        student={student} 
                        isOpen={openMenuId === student._id}
                        onToggle={(e) => handleMenuClick(e, student._id)}
                        onView={() => navigate(`/admin/students/${student._id}`)}
                        onEdit={() => navigate(`/admin/students/edit/${student._id}`)}
                        onDelete={() => handleDelete(student._id, student.firstName)}
                     />
                   ))}
                 </tbody>
               </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

// --- SUB-COMPONENT: Table Row ---
const StudentRow = ({ 
    student, 
    isOpen, 
    onToggle, 
    onView, 
    onEdit,
    onDelete
}: { 
    student: StudentUser; 
    isOpen: boolean; 
    onToggle: (e: React.MouseEvent) => void; 
    onView: () => void; 
    onEdit: () => void;
    onDelete: () => void;
}) => {
    const displayName = student.firstName ? `${student.firstName} ${student.lastName || ''}` : "Unknown";
    const status = student.isVerified ? "Active" : "Pending";
        
    // Handle cases where batch is populated (Object) or ID (String)
    const batchName = typeof student.batch === 'object' 
        ? (student.batch as any).name 
        : student.batch || "N/A";

    return (
      <tr className="hover:bg-blue-50/30 transition-colors group">
        <td className="px-6 py-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${getAvatarColor(displayName)}`}>
               {displayName.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="font-semibold text-gray-900">{displayName}</div>
              <div className="text-xs text-gray-500">{student.email}</div>
            </div>
          </div>
        </td>
        <td className="px-6 py-4 text-sm text-gray-600">
            <span className="bg-gray-100 px-2 py-1 rounded-md text-xs font-medium text-gray-700">
                {batchName}
            </span>
        </td>
        <td className="px-6 py-4 text-sm text-gray-500 font-mono">{student.phoneNumber || "-"}</td>
        <td className="px-6 py-4">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
            status === 'Active' 
                ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                : 'bg-amber-50 text-amber-700 border-amber-100'
          }`}>
             <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${status === 'Active' ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
             {status}
          </span>
        </td>
        <td className="px-6 py-4 text-right relative">
          <button 
            onClick={onToggle} 
            className={`p-2 rounded-lg transition-colors ${isOpen ? 'bg-blue-50 text-blue-600' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
          >
            <EllipsisHorizontalIcon className="w-6 h-6" />
          </button>
          
          {isOpen && (
            <div className="absolute right-8 top-12 z-50 w-48 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-right">
               <button onClick={onView} className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors border-b border-gray-50">
                 <EyeIcon className="w-4 h-4 text-gray-400" /> View Details
               </button>
               <button onClick={onEdit} className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors border-b border-gray-50">
                 <PencilSquareIcon className="w-4 h-4 text-gray-400" /> Edit Profile
               </button>
               <button onClick={onDelete} className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors">
                 <TrashIcon className="w-4 h-4" /> Delete Student
               </button>
            </div>
          )}
        </td>
      </tr>
    );
};