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

// Services
import AdminService, { type UserData } from "../../../services/AdminService"; // Updated Service
import BatchService, { type BatchData } from "../../../services/BatchService"; 

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
  const [students, setStudents] = useState<UserData[]>([]);
  const [batches, setBatches] = useState<BatchData[]>([]);
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
        const data = await BatchService.getAllBatches();
        if (data.batches) {
            setBatches(data.batches);
        }
      } catch (error) {
        console.warn("Failed to load batches, filters may be limited.");
      }
    };
    loadBatches();
  }, []);

  // --- 2. FETCH STUDENTS (On Filter Change) ---
  const fetchStudents = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch from Admin API
      const response = await AdminService.getAllUsers({
        search: debouncedSearch,
        role: "student" // Explicitly fetch only students
      });
      
      let users = response.users || [];

      // 2. Client-side Batch Filter
      // (Since backend search currently supports name/email, we filter batch here for now)
      if (selectedBatch !== "All") {
        users = users.filter(user => {
            const b = user.batch; 
            // Handle if batch is populated object or string ID
            if (typeof b === 'object' && b !== null) return (b as any)._id === selectedBatch;
            return b === selectedBatch;
        });
      }

      setStudents(users);
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
        await AdminService.deleteUser(id); // Use AdminService
        Swal.fire('Deleted!', 'Student removed.', 'success');
        fetchStudents(); 
      } catch (error) {
        Swal.fire('Error', 'Failed to delete student.', 'error');
      }
    }
  };

  return (
      <div className="space-y-6 font-sans pb-20"> {/* Added pb-20 for bottom nav spacing */}
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-brand-prussian">Students Directory</h1>
            <p className="text-gray-500 text-sm mt-1">Manage and monitor registered students</p>
          </div>
          <button 
            onClick={() => navigate("/admin/students/add")} // Point to Create page
            className="flex items-center gap-2 bg-brand-cerulean hover:bg-brand-prussian text-white px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-brand-cerulean/20 active:scale-95 text-sm font-semibold"
          >
            <PlusIcon className="w-5 h-5" /> <span>Add Student</span>
          </button>
        </div>

        {/* Filters Bar */}
        <div className="flex flex-col md:flex-row gap-4 bg-white p-2 rounded-2xl shadow-sm border border-brand-aliceBlue">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search by name, email or phone..." 
              className="w-full pl-11 pr-4 py-3 bg-brand-aliceBlue/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-cerulean/20 transition-all text-sm font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <div className="relative h-full">
              <FunnelIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              
              {/* DYNAMIC BATCH DROPDOWN */}
              <select 
                className="h-full pl-10 pr-8 py-3 bg-brand-aliceBlue/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-cerulean/20 appearance-none cursor-pointer text-sm font-medium text-gray-700 border-none min-w-[160px]"
                value={selectedBatch}
                onChange={(e) => setSelectedBatch(e.target.value)}
              >
                <option value="All">All Batches</option>
                {batches.map((batch) => (
                    <option key={batch._id} value={batch._id}>
                        {batch.name}
                    </option>
                ))}
              </select>
              
            </div>
            {/* Refresh Button */}
            <button 
                onClick={fetchStudents}
                className="h-full px-4 bg-brand-aliceBlue/30 rounded-xl hover:bg-gray-100 text-gray-600 transition-colors"
                title="Refresh List"
            >
               <ArrowPathIcon className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        

        {/* Students Table */}
        <div className="bg-white rounded-2xl border border-brand-aliceBlue shadow-sm overflow-hidden min-h-[400px] flex flex-col">
          {isLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
               <ArrowPathIcon className="w-8 h-8 animate-spin mb-2 text-brand-cerulean/50" />
               <p className="text-sm font-medium uppercase tracking-widest">Loading students...</p>
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
                 <thead className="bg-brand-aliceBlue/40 text-[10px] uppercase text-gray-500 font-bold tracking-widest border-b border-brand-aliceBlue">
                   <tr>
                     <th className="px-6 py-4">Student</th>
                     <th className="px-6 py-4">Batch</th>
                     <th className="px-6 py-4">Contact</th>
                     <th className="px-6 py-4">Status</th>
                     <th className="px-6 py-4 text-right">Actions</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-brand-aliceBlue">
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
    student: UserData; // Updated Interface
    isOpen: boolean; 
    onToggle: (e: React.MouseEvent) => void; 
    onView: () => void; 
    onEdit: () => void;
    onDelete: () => void;
}) => {
    const displayName = student.firstName ? `${student.firstName} ${student.lastName || ''}` : "Unknown";
    // Check account locks and activation
    const status = student.isLocked ? "Locked" : !student.isActive ? "Inactive" : "Active";
        
    // Handle cases where batch is populated (Object) or ID (String)
    const batchName = typeof student.batch === 'object' 
        ? (student.batch as any).name 
        : student.batch || "N/A";

    return (
      <tr className="hover:bg-brand-aliceBlue/20 transition-colors group">
        <td className="px-6 py-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${getAvatarColor(displayName)}`}>
               {displayName.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="font-semibold text-brand-prussian">{displayName}</div>
              <div className="text-xs text-gray-500">{student.email}</div>
            </div>
          </div>
        </td>
        <td className="px-6 py-4 text-sm text-gray-600">
            <span className="bg-white border border-gray-200 px-2 py-1 rounded-md text-xs font-bold text-gray-500 uppercase tracking-wide">
                {batchName}
            </span>
        </td>
        <td className="px-6 py-4 text-sm text-gray-500 font-mono tracking-tight">{student.phoneNumber || "-"}</td>
        <td className="px-6 py-4">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${
            status === 'Active' 
                ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                : status === 'Locked'
                ? 'bg-red-50 text-red-700 border-red-100'
                : 'bg-gray-50 text-gray-600 border-gray-200'
          }`}>
             <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                status === 'Active' ? 'bg-emerald-500' : status === 'Locked' ? 'bg-red-500' : 'bg-gray-400'
             }`}></span>
             {status}
          </span>
        </td>
        <td className="px-6 py-4 text-right relative">
          <button 
            onClick={onToggle} 
            className={`p-2 rounded-lg transition-colors ${isOpen ? 'bg-brand-aliceBlue text-brand-cerulean' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
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