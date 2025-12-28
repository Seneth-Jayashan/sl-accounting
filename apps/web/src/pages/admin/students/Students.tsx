import React, { useState, useEffect, useMemo, useCallback } from "react";
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
  TrashIcon,
  ArrowUturnLeftIcon, // For Restore
  NoSymbolIcon,       // For Deactivate
  CheckCircleIcon     // For Activate
} from "@heroicons/react/24/outline";

// Services
import AdminService, { type UserData } from "../../../services/AdminService";
import BatchService, { type BatchData } from "../../../services/BatchService";

// --- TYPES ---

// Extend UserData locally to safely handle populated Batch objects
type PopulatedBatch = { _id: string; name: string };

interface ExtendedUserData extends Omit<UserData, "batch"> {
  batch?: string | PopulatedBatch;
}

// --- CONSTANTS & HELPERS ---

const AVATAR_COLORS = [
  "bg-blue-100 text-blue-600",
  "bg-purple-100 text-purple-600",
  "bg-emerald-100 text-emerald-600",
  "bg-pink-100 text-pink-600",
  "bg-orange-100 text-orange-600"
];

const getAvatarColor = (name: string): string => {
  if (!name) return AVATAR_COLORS[0];
  return AVATAR_COLORS[name.length % AVATAR_COLORS.length];
};

const getBatchId = (batch: string | PopulatedBatch | undefined): string | null => {
  if (!batch) return null;
  return typeof batch === "string" ? batch : batch._id;
};

const getBatchName = (batch: string | PopulatedBatch | undefined): string => {
  if (!batch) return "N/A";
  return typeof batch === "string" ? "Batch ID: " + batch.slice(-4) : batch.name;
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

// --- MAIN COMPONENT ---

export default function StudentsPage() {
  const navigate = useNavigate();

  // UI State
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBatchId, setSelectedBatchId] = useState("All");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  
  // Data State
  const [students, setStudents] = useState<ExtendedUserData[]>([]);
  const [batches, setBatches] = useState<BatchData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  const debouncedSearch = useDebounce(searchTerm, 500);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setOpenMenuId(null);
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  // --- 1. LOAD BATCHES ---
  useEffect(() => {
    let isMounted = true;
    const loadBatches = async () => {
      try {
        const data = await BatchService.getAllBatches();
        if (isMounted && data.batches) {
          setBatches(data.batches);
        }
      } catch (error) {
        console.error("Failed to load batches", error);
      }
    };
    loadBatches();
    return () => { isMounted = false; };
  }, []);

  // --- 2. FETCH STUDENTS ---
  const fetchStudents = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      const response = await AdminService.getAllUsers({
        search: debouncedSearch,
        role: "student",
        limit: 100 
      });
      setStudents((response.users as unknown) as ExtendedUserData[]);
    } catch (err) {
      console.error("Fetch error:", err);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  // --- 3. FILTER LOGIC ---
  const filteredStudents = useMemo(() => {
    if (selectedBatchId === "All") return students;
    return students.filter((student) => {
      const sBatchId = getBatchId(student.batch);
      return sBatchId === selectedBatchId;
    });
  }, [students, selectedBatchId]);

  // --- ACTIONS ---

  const handleMenuClick = useCallback((e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setOpenMenuId((prev) => (prev === id ? null : id));
  }, []);

  // 1. Delete (Soft Delete)
  const handleDelete = useCallback(async (id: string, name: string) => {
    setOpenMenuId(null);
    const result = await Swal.fire({
      title: "Delete Student?",
      text: `${name} will be moved to the trash (Soft Delete).`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    });

    if (result.isConfirmed) {
      try {
        await AdminService.deleteUser(id);
        Swal.fire("Deleted!", "Student has been deactivated/deleted.", "success");
        fetchStudents();
      } catch (error) {
        Swal.fire("Error", "Failed to delete student.", "error");
      }
    }
  }, [fetchStudents]);

  // 2. Restore (Undo Delete)
  const handleRestore = useCallback(async (id: string, name: string) => {
    setOpenMenuId(null);
    const result = await Swal.fire({
      title: "Restore Student?",
      text: `Are you sure you want to restore ${name}?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#10b981", // Emerald
      confirmButtonText: "Yes, restore!",
    });

    if (result.isConfirmed) {
      try {
        await AdminService.restoreUser(id);
        Swal.fire("Restored!", "Student account is back.", "success");
        fetchStudents();
      } catch (error) {
        Swal.fire("Error", "Failed to restore student.", "error");
      }
    }
  }, [fetchStudents]);

  // 3. Activate
  const handleActivate = useCallback(async (id: string) => {
    setOpenMenuId(null);
    try {
      await AdminService.activateUser(id);
      const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000
      });
      Toast.fire({ icon: 'success', title: 'Account Activated' });
      fetchStudents();
    } catch (error) {
      Swal.fire("Error", "Could not activate user.", "error");
    }
  }, [fetchStudents]);

  // 4. Deactivate
  const handleDeactivate = useCallback(async (id: string) => {
    setOpenMenuId(null);
    const result = await Swal.fire({
        title: "Deactivate Account?",
        text: "User will not be able to log in, but data is preserved.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#f59e0b", // Amber
        confirmButtonText: "Yes, suspend!",
      });

      if (result.isConfirmed) {
        try {
            await AdminService.deactivateUser(id);
            Swal.fire("Suspended", "Account has been deactivated.", "success");
            fetchStudents();
        } catch (error) {
            Swal.fire("Error", "Could not deactivate user.", "error");
        }
    }
  }, [fetchStudents]);

  return (
    <div className="space-y-6 font-sans pb-20">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-prussian">Students Directory</h1>
          <p className="text-gray-500 text-sm mt-1">Manage, activate, or restore student accounts</p>
        </div>
        <button
          onClick={() => navigate("/admin/students/add")}
          className="flex items-center gap-2 bg-brand-cerulean hover:bg-brand-prussian text-white px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-brand-cerulean/20 active:scale-95 text-sm font-semibold"
        >
          <PlusIcon className="w-5 h-5" /> <span>Add Student</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 bg-white p-2 rounded-2xl shadow-sm border border-brand-aliceBlue">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, email or phone..."
            className="w-full pl-11 pr-4 py-3 bg-brand-aliceBlue/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-cerulean/20 transition-all text-sm font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
          />
        </div>
        <div className="flex items-center gap-2">
          <div className="relative h-full">
            <FunnelIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <select
              className="h-full pl-10 pr-8 py-3 bg-brand-aliceBlue/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-cerulean/20 appearance-none cursor-pointer text-sm font-medium text-gray-700 border-none min-w-[160px]"
              value={selectedBatchId}
              onChange={(e) => setSelectedBatchId(e.target.value)}
            >
              <option value="All">All Batches</option>
              {batches.map((batch) => (
                <option key={batch._id} value={batch._id}>
                  {batch.name}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={fetchStudents}
            disabled={isLoading}
            className="h-full px-4 bg-brand-aliceBlue/30 rounded-xl hover:bg-gray-100 text-gray-600 transition-colors disabled:opacity-50"
          >
            <ArrowPathIcon className={`w-5 h-5 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Table Area */}
      <div className="bg-white rounded-2xl border border-brand-aliceBlue shadow-sm overflow-hidden min-h-[400px] flex flex-col">
        {isLoading && filteredStudents.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
            <ArrowPathIcon className="w-8 h-8 animate-spin mb-2 text-brand-cerulean/50" />
            <p className="text-sm font-medium uppercase tracking-widest">Loading students...</p>
          </div>
        )}

        {!isLoading && !isError && filteredStudents.length === 0 && (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8 text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                <UserIcon className="w-8 h-8 text-gray-300" />
            </div>
            <h3 className="text-gray-900 font-semibold">No students found</h3>
            </div>
        )}

        {!isLoading && !isError && filteredStudents.length > 0 && (
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
                {filteredStudents.map((student) => (
                  <StudentRow
                    key={student._id}
                    student={student}
                    isOpen={openMenuId === student._id}
                    onToggle={(e) => handleMenuClick(e, student._id)}
                    onView={() => navigate(`/admin/students/${student._id}`)}
                    onEdit={() => navigate(`/admin/students/edit/${student._id}`)}
                    onDelete={() => handleDelete(student._id, student.firstName)}
                    onRestore={() => handleRestore(student._id, student.firstName)}
                    onActivate={() => handleActivate(student._id)}
                    onDeactivate={() => handleDeactivate(student._id)}
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
const StudentRow = React.memo(({
  student,
  isOpen,
  onToggle,
  onView,
  onEdit,
  onDelete,
  onRestore,
  onActivate,
  onDeactivate
}: {
  student: ExtendedUserData;
  isOpen: boolean;
  onToggle: (e: React.MouseEvent) => void;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onRestore: () => void;
  onActivate: () => void;
  onDeactivate: () => void;
}) => {
  const displayName = student.firstName ? `${student.firstName} ${student.lastName || ""}` : "Unknown";
  // DETERMINE STATUS
  // Priority: Deleted > Locked > Inactive > Active
  let status = "Active";
  if (student.isDeleted) status = "Deleted";
  else if (student.isLocked) status = "Locked";
  else if (!student.isActive) status = "Inactive";

  // Visual Styles based on status
  const statusConfig = {
    Active: { 
        bg: "bg-emerald-50 text-emerald-700 border-emerald-100", 
        dot: "bg-emerald-500" 
    },
    Locked: { 
        bg: "bg-red-50 text-red-700 border-red-100", 
        dot: "bg-red-500" 
    },
    Inactive: { 
        bg: "bg-amber-50 text-amber-600 border-amber-100", 
        dot: "bg-amber-400" 
    },
    Deleted: { 
        bg: "bg-gray-100 text-gray-500 border-gray-200 line-through decoration-gray-400", 
        dot: "bg-gray-400" 
    }
  };

  const currentConfig = statusConfig[status as keyof typeof statusConfig];
  const rowOpacity = student.isDeleted ? "opacity-60 bg-gray-50" : "hover:bg-brand-aliceBlue/20";

  return (
    <tr className={`transition-colors group ${rowOpacity}`}>
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${getAvatarColor(
              displayName
            )}`}
          >
            {displayName.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className={`font-semibold text-brand-prussian ${student.isDeleted ? 'line-through text-gray-400' : ''}`}>
                {displayName}
            </div>
            <div className="text-xs text-gray-500">{student.email}</div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 text-sm text-gray-600">
        <span className="bg-white border border-gray-200 px-2 py-1 rounded-md text-xs font-bold text-gray-500 uppercase tracking-wide">
          {getBatchName(student.batch)}
        </span>
      </td>
      <td className="px-6 py-4 text-sm text-gray-500 font-mono tracking-tight">
        {student.phoneNumber || "-"}
      </td>
      <td className="px-6 py-4">
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${currentConfig.bg}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${currentConfig.dot}`}></span>
          {status}
        </span>
      </td>
      <td className="px-6 py-4 text-right relative">
        <button
          onClick={onToggle}
          className={`p-2 rounded-lg transition-colors ${
            isOpen
              ? "bg-brand-aliceBlue text-brand-cerulean"
              : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          }`}
        >
          <EllipsisHorizontalIcon className="w-6 h-6" />
        </button>

        {isOpen && (
          <div className="absolute right-8 top-12 z-50 w-52 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-right">
            
            {/* VIEW (Always visible) */}
            <button
              onClick={onView}
              className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors border-b border-gray-50"
            >
              <EyeIcon className="w-4 h-4 text-gray-400" /> View Details
            </button>

            {/* IF DELETED: Show Restore Only */}
            {student.isDeleted ? (
                 <button
                 onClick={onRestore}
                 className="w-full text-left px-4 py-3 text-sm text-emerald-600 hover:bg-emerald-50 flex items-center gap-3 transition-colors font-medium"
               >
                 <ArrowUturnLeftIcon className="w-4 h-4" /> Restore User
               </button>
            ) : (
                <>
                    {/* EDIT */}
                    <button
                        onClick={onEdit}
                        className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors border-b border-gray-50"
                    >
                        <PencilSquareIcon className="w-4 h-4 text-gray-400" /> Edit Profile
                    </button>

                    {/* ACTIVATE / DEACTIVATE */}
                    {student.isActive ? (
                        <button
                            onClick={onDeactivate}
                            className="w-full text-left px-4 py-3 text-sm text-amber-600 hover:bg-amber-50 flex items-center gap-3 transition-colors border-b border-gray-50"
                        >
                            <NoSymbolIcon className="w-4 h-4" /> Deactivate
                        </button>
                    ) : (
                        <button
                            onClick={onActivate}
                            className="w-full text-left px-4 py-3 text-sm text-emerald-600 hover:bg-emerald-50 flex items-center gap-3 transition-colors border-b border-gray-50"
                        >
                            <CheckCircleIcon className="w-4 h-4" /> Activate
                        </button>
                    )}

                    {/* DELETE */}
                    <button
                        onClick={onDelete}
                        className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors"
                    >
                        <TrashIcon className="w-4 h-4" /> Delete User
                    </button>
                </>
            )}
          </div>
        )}
      </td>
    </tr>
  );
});