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
  VideoCameraIcon,
  MapPinIcon,
  EllipsisVerticalIcon,
  AcademicCapIcon
} from "@heroicons/react/24/outline";
import ClassService from "../../../services/ClassService"; // <-- adjust path to your project setup
import { useNavigate } from "react-router-dom";

// --- Types ---
// Minimal UI-facing shape — adapt if your API returns different field names
type ClassItem = {
  _id?: string;
  id?: number; // fallback if API returns numeric id
  title: string;
  batch?: string;
  type?: "Theory" | "Revision" | "Paper Class" | string;
  day?: string;
  time?: string;
  location?: "Zoom" | "Physical" | "Hybrid" | string;
  students?: number;
  status?: "Active" | "Paused" | string;
  color?: string;
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
      // defensive: service might return array or { classes: [] } or { data: [] }
      const list = Array.isArray(res) ? res : (res?.classes ?? res?.data ?? []);
      // Map API fields to UI-friendly fields (modify mapping based on your API)
      const mapped = list.map((item: any, idx: number) => ({
        _id: item._id ?? item.id ?? `local-${idx}`,
        id: item.id ?? idx + 1,
        title: item.name ?? item.className ?? item.title ?? "Untitled Class",
        batch: item.bacth ?? item.batch ?? item.batchName ?? "—",
        type: item.type ?? (item.recurrence ? "Theory" : "Theory"),
        day: (item.timeSchedules && item.timeSchedules[0]?.day) ?? item.day ?? "Sat",
        time: (item.timeSchedules && `${item.timeSchedules[0]?.startTime || ""} - ${item.timeSchedules[0]?.endTime || ""}`) ?? item.time ?? "08:00 AM - 10:00 AM",
        students: (item.students && item.students.length) ?? item.studentCount ?? item.enrollmentCount ?? 0,
        status: item.isActive ? "Active" : (item.status ?? "Paused"),
        color: item.color ?? (idx % 3 === 0 ? "bg-blue-600" : idx % 3 === 1 ? "bg-emerald-600" : "bg-purple-600")
      })) as ClassItem[];
      setClasses(mapped);
    } catch (err: any) {
      console.error(err);
      setError(err?.message ?? "Failed to load classes");
    } finally {
      setLoading(false);
    }
  }

  // Filter Logic (search + type)
  const filteredClasses = useMemo(() => {
    return classes.filter((cls) => {
      const matchesSearch =
        cls.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (cls.batch || "").toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === "All" || cls.type === filterType;
      return matchesSearch && matchesType;
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

  async function toggleStatus(cls: ClassItem) {
    if (!cls._id) return;
    const willActivate = cls.status !== "Active";
    // optimistic UI
    setClasses((s) => s.map(c => c._id === cls._id ? { ...c, status: willActivate ? "Active" : "Paused" } : c));
    try {
      // Your ClassService.updateClass expects the form keys used by your backend.
      // If your backend expects { isActive: boolean } then update the service or send that shape here.
      await ClassService.updateClass(cls._id, { /* adapt payload if needed */ } as any);
      // If backend supports { isActive }, do: await ClassService.updateClass(cls._id, { isActive: willActivate } as any);
    } catch (err: any) {
      console.error("Status toggle failed", err);
      alert("Update failed: " + (err?.message ?? err));
      // reload to refresh actual state
      await loadClasses();
    }
  }

  // --- Custom Right Sidebar for this Page --- (kept unchanged)
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

      {/* Widget 2: Quick Links */}
      <div className="bg-[#0b2540] rounded-2xl p-5 shadow-sm text-white">
        <h3 className="font-semibold mb-2">Need Help?</h3>
        <p className="text-sm text-gray-300 mb-4">Check the guide on how to setup Zoom links for hybrid classes.</p>
        <button onClick={() => navigate("/docs/zoom-setup")} className="w-full py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors">
          View Documentation
        </button>
      </div>
    </div>
  );

  return (
    <DashboardLayout 
      Sidebar={SidebarAdmin} 
      BottomNav={BottomNavAdmin}
      rightSidebar={ClassStatsSidebar}
    >
      <div className="space-y-6">
        
        {/* PAGE HEADER */}
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
          {loading && <div className="col-span-full p-6 text-center text-gray-500">Loading classes…</div>}
          {error && <div className="col-span-full p-6 text-center text-red-600">Error: {error}</div>}

          {!loading && !error && filteredClasses.map((cls) => (
            <div key={cls._id ?? cls.id} className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col">
              
              {/* Card Header / Banner */}
              <div className={`h-2 ${cls.color} w-full`}></div>
              
              <div className="p-5 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                  <div className="px-2.5 py-1 rounded-md bg-gray-100 text-xs font-bold text-gray-600 uppercase tracking-wide">
                    {cls.batch}
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => onEdit(cls)} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-50">
                      <EllipsisVerticalIcon className="w-6 h-6" />
                    </button>
                  </div>
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
                    <UsersIcon className="w-5 h-5 text-gray-400" />
                    <span>{cls.students} Students Enrolled</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-6 pt-4 border-t border-gray-50 flex gap-3">
                  <button onClick={() => onEdit(cls)} className="flex-1 py-2 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                    Edit
                  </button>
                  <button onClick={() => onManage(cls)} className="flex-1 py-2 text-sm font-medium text-white bg-[#0b2540] hover:bg-[#153454] rounded-lg transition-colors shadow-sm">
                    Manage
                  </button>
                  <button onClick={() => onDelete(cls)} className="py-2 px-3 text-sm font-medium text-red-600 rounded-lg bg-red-50 hover:bg-red-100 transition-colors">
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* New Class Placeholder Card (Optional) */}
          <button onClick={onCreate} className="border-2 border-dashed border-gray-300 rounded-2xl p-6 flex flex-col items-center justify-center text-gray-400 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50/50 transition-all min-h-[300px]">
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
