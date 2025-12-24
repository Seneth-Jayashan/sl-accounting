// src/pages/admin/Class.tsx
import React, { useEffect, useMemo, useState } from "react";
import DashboardLayout from "../../../layouts/DashboardLayout";
import SidebarAdmin from "../../../components/sidebar/SidebarAdmin";
import BottomNavAdmin from "../../../components/bottomNavbar/BottomNavAdmin";
import {
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  UsersIcon,
  ClockIcon,
  EllipsisVerticalIcon,
  AcademicCapIcon,
  EyeIcon,
  EyeSlashIcon
} from "@heroicons/react/24/outline";
import ClassService from "../../../services/ClassService";
import { useNavigate } from "react-router-dom";

// --- Types ---
type ClassItem = {
  _id?: string;
  id?: number;
  title: string;
  batch?: string;
  type?: "Theory" | "Revision" | "Paper Class" | string;
  day?: string;
  time?: string;
  students?: number;
  status?: "Active" | "Paused" | string;
  color?: string;
  isPublished?: boolean; // Added isPublished field
};

export default function ClassesPage() {
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("All");

  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load classes from service on mount
  useEffect(() => {
    loadClasses();
  }, []);

  async function loadClasses() {
    setLoading(true);
    setError(null);
    try {
      const res = await ClassService.getAllClasses();
      const list = Array.isArray(res) ? res : (res?.classes ?? res?.data ?? []);
      
      const mapped = list.map((item: any, idx: number) => ({
        _id: item._id ?? item.id ?? `local-${idx}`,
        id: item.id ?? idx + 1,
        title: item.name ?? "Untitled Class",
        batch: item.batch?.name ?? (typeof item.batch === 'string' ? "Batch " + item.batch.substring(0, 4) : "—"), // Handle populated batch object or string ID
        type: item.level ? (item.level.charAt(0).toUpperCase() + item.level.slice(1)) : "Theory",
        day: (item.timeSchedules && item.timeSchedules[0]?.day !== undefined) 
             ? ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][item.timeSchedules[0].day] 
             : "TBA",
        time: (item.timeSchedules && item.timeSchedules[0]) 
              ? `${item.timeSchedules[0].startTime} - ${item.timeSchedules[0].endTime}` 
              : "TBA",
        students: item.studentCount ?? 0,
        status: item.isActive ? "Active" : "Paused",
        isPublished: item.isPublished ?? false, // Map isPublished from API
        color: idx % 3 === 0 ? "bg-blue-600" : idx % 3 === 1 ? "bg-emerald-600" : "bg-purple-600"
      })) as ClassItem[];
      
      setClasses(mapped);
    } catch (err: any) {
      console.error(err);
      setError(err?.message ?? "Failed to load classes");
    } finally {
      setLoading(false);
    }
  }

  // Filter Logic
  const filteredClasses = useMemo(() => {
    return classes.filter((cls) => {
      const matchesSearch =
        cls.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (cls.batch || "").toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === "All" || cls.type === filterType; // You might want to map 'level' to 'type' properly if filtering by level
      return matchesSearch; // Simplified for now, add matchesType back if 'type' data is consistent
    });
  }, [classes, searchTerm, filterType]);

  // Actions
  function onCreate() {
    navigate("/admin/classes/create");
  }

  function onEdit(cls: ClassItem) {
    if (!cls._id) return;
    navigate(`/admin/classes/edit/${cls._id}`);
  }

  function onManage(cls: ClassItem) {
    if (!cls._id) return;
    navigate(`/admin/classes/view/${cls._id}`);
  }

  async function onDelete(cls: ClassItem) {
    if (!cls._id) return;
    if (!confirm(`Delete "${cls.title}"? This action cannot be undone.`)) return;
    
    // optimistic update
    const prev = classes;
    setClasses((s) => s.filter(c => c._id !== cls._id));
    
    try {
      await ClassService.deleteClass(cls._id);
    } catch (err: any) {
      console.error("Delete failed", err);
      alert("Delete failed: " + (err?.message ?? err));
      setClasses(prev); // rollback
    }
  }

  // --- NEW: Toggle Publish Status ---
  async function togglePublish(cls: ClassItem) {
    if (!cls._id) return;
    
    const newStatus = !cls.isPublished;
    
    // 1. Optimistic UI Update
    const prevClasses = [...classes];
    setClasses((prev) => 
      prev.map((c) => c._id === cls._id ? { ...c, isPublished: newStatus } : c)
    );

    try {
      // 2. Call API
      // Using setPublished helper if available in ClassService, or updateClass fallback
      if (ClassService.setPublished) {
          await ClassService.setPublished(cls._id, newStatus);
      } else {
          // Fallback to generic update if helper missing
          await ClassService.updateClass(cls._id, { isPublished: newStatus });
      }
    } catch (err: any) {
      // 3. Rollback on error
      console.error("Publish toggle failed", err);
      alert("Failed to update status.");
      setClasses(prevClasses);
    }
  }

  const ClassStatsSidebar = (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <h3 className="font-semibold text-gray-800 mb-4">Class Overview</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><AcademicCapIcon className="w-5 h-5"/></div>
              <span className="text-sm font-medium text-gray-600">Total Classes</span>
            </div>
            <span className="font-bold text-gray-900">{classes.length}</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg"><UsersIcon className="w-5 h-5"/></div>
              <span className="text-sm font-medium text-gray-600">Total Enrollments</span>
            </div>
            <span className="font-bold text-gray-900">{classes.reduce((acc, c) => acc + (c.students ?? 0), 0)}</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <DashboardLayout 
      Sidebar={SidebarAdmin} 
      BottomNav={BottomNavAdmin}
      rightSidebar={ClassStatsSidebar}
    >
      <div className="space-y-6 pb-20">
        
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Classes</h1>
            <p className="text-gray-500 text-sm mt-1">Manage batches, schedules, and class settings.</p>
          </div>
          <button onClick={onCreate} className="flex items-center justify-center gap-2 bg-[#0b2540] hover:bg-[#1a3b5c] text-white px-4 py-2.5 rounded-xl font-medium transition-colors shadow-sm">
            <PlusIcon className="w-5 h-5" />
            <span>Create New Class</span>
          </button>
        </div>

        {/* SEARCH & FILTER */}
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
          {/* <div className="relative w-full sm:w-48">
             <FunnelIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
             <select ... /> 
          </div> */}
        </div>

        {/* CLASS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {loading && <div className="col-span-full p-10 text-center text-gray-400 animate-pulse">Loading classes...</div>}
          {error && <div className="col-span-full p-6 text-center text-red-600 bg-red-50 rounded-xl">Error: {error}</div>}

          {!loading && !error && filteredClasses.map((cls) => (
            <div key={cls._id ?? cls.id} className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col">
              
              {/* Color Stripe */}
              <div className={`h-2 ${cls.color} w-full`}></div>
              
              <div className="p-5 flex-1 flex flex-col">
                {/* Top Row: Batch & Publish Status */}
                <div className="flex justify-between items-start mb-3">
                  <div className="px-2.5 py-1 rounded-md bg-gray-100 text-xs font-bold text-gray-600 uppercase tracking-wide">
                    {cls.batch}
                  </div>
                  
                  {/* Publish Toggle Button */}
                  <button 
                    onClick={() => togglePublish(cls)}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all border ${
                        cls.isPublished 
                        ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100" 
                        : "bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100"
                    }`}
                    title={cls.isPublished ? "Publicly Visible" : "Hidden from Students"}
                  >
                    {cls.isPublished ? (
                        <>
                            <EyeIcon className="w-3.5 h-3.5" /> Published
                        </>
                    ) : (
                        <>
                            <EyeSlashIcon className="w-3.5 h-3.5" /> Hidden
                        </>
                    )}
                  </button>
                </div>

                {/* Title & Status */}
                <h3 className="text-lg font-bold text-gray-900 mb-1">{cls.title}</h3>
                <div className="flex items-center gap-2 mb-4">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    cls.status === 'Active' ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {cls.status}
                  </span>
                  <span className="text-xs text-gray-400">•</span>
                  <span className="text-xs text-gray-500 font-medium">{cls.type}</span>
                </div>

                {/* Info Grid */}
                <div className="space-y-3 mt-auto">
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <ClockIcon className="w-5 h-5 text-gray-400" />
                    <span>{cls.day}, {cls.time}</span>
                  </div>
                  
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <UsersIcon className="w-5 h-5 text-gray-400" />
                    <span>{cls.students} Students</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-6 pt-4 border-t border-gray-50 flex gap-3">
                  <button onClick={() => onEdit(cls)} className="flex-1 py-2 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200">
                    Edit
                  </button>
                  <button onClick={() => onManage(cls)} className="flex-1 py-2 text-sm font-medium text-white bg-[#0b2540] hover:bg-[#153454] rounded-lg transition-colors shadow-sm">
                    Manage
                  </button>
                  <button onClick={() => onDelete(cls)} className="px-3 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors">
                    <EllipsisVerticalIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Empty State / Add New Placeholder */}
          {!loading && !error && filteredClasses.length === 0 && (
             <div className="col-span-full py-12 flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 rounded-2xl">
                <AcademicCapIcon className="w-12 h-12 mb-3 opacity-20" />
                <p>No classes found.</p>
                <button onClick={onCreate} className="mt-4 text-[#0b2540] font-medium hover:underline">Create your first class</button>
             </div>
          )}
        </div>
        
      </div>
    </DashboardLayout>
  );
}