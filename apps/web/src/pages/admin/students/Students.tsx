import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import {
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowPathIcon,
  EyeIcon,
  PencilSquareIcon,
  UserIcon,
  TrashIcon,
  ArrowUturnLeftIcon,
  NoSymbolIcon,
  CheckCircleIcon,
  LockClosedIcon,
  LockOpenIcon,
  ChevronRightIcon
} from "@heroicons/react/24/outline";

// Services
import AdminService, { type UserData } from "../../../services/AdminService";
import BatchService, { type BatchData } from "../../../services/BatchService";

// --- TYPES ---
type PopulatedBatch = { _id: string; name: string };

interface ExtendedUserData extends Omit<UserData, "batch"> {
  batch?: string | PopulatedBatch;
}

// --- CONSTANTS & HELPERS ---
const AVATAR_COLORS = [
  "bg-blue-100 text-blue-700",
  "bg-purple-100 text-purple-700",
  "bg-emerald-100 text-emerald-700",
  "bg-pink-100 text-pink-700",
  "bg-amber-100 text-amber-700"
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

  const handleRestore = useCallback(async (id: string, name: string) => {
    setOpenMenuId(null);
    const result = await Swal.fire({
      title: "Restore Student?",
      text: `Are you sure you want to restore ${name}?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#10b981",
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

  const handleDeactivate = useCallback(async (id: string) => {
    setOpenMenuId(null);
    const result = await Swal.fire({
      title: "Deactivate Account?",
      text: "User will not be able to log in, but data is preserved.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#f59e0b",
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

  const handleLock = useCallback(async (id: string) => {
    setOpenMenuId(null);
    const result = await Swal.fire({
      title: "Lock Account?",
      text: "User login will be blocked until an admin unlocks the account.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      confirmButtonText: "Yes, lock account",
    });

    if (result.isConfirmed) {
      try {
        await AdminService.lockUser(id);
        Swal.fire("Locked", "Account has been locked.", "success");
        fetchStudents();
      } catch (error) {
        Swal.fire("Error", "Could not lock user.", "error");
      }
    }
  }, [fetchStudents]);

  const handleUnlock = useCallback(async (id: string) => {
    setOpenMenuId(null);
    try {
      await AdminService.unlockUser(id);
      const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000
      });
      Toast.fire({ icon: 'success', title: 'Account Unlocked' });
      fetchStudents();
    } catch (error) {
      Swal.fire("Error", "Could not unlock user.", "error");
    }
  }, [fetchStudents]);

  return (
    <div className="w-full space-y-5 pb-12 overflow-visible">

      {/* --- Header --- */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-1">
        <div>
          <h1 className="text-[22px] font-bold text-gray-900">Students Directory</h1>
          <p className="text-gray-500 text-xs mt-1">Manage, activate, or restore student accounts</p>
        </div>
        <button
          onClick={() => navigate("/admin/students/add")}
          className="flex items-center gap-2 bg-[#0d4b5b] hover:bg-[#093946] text-white px-4 py-2.5 rounded-xl shadow-sm transition-colors text-sm font-bold shrink-0 w-full sm:w-auto justify-center"
        >
          <PlusIcon className="w-4 h-4 stroke-[2]" /> Add Student
        </button>
      </div>

      {/* --- Filters --- */}
      <div className="flex flex-col md:flex-row gap-3 bg-white px-4 py-2.5 rounded-xl shadow-sm border border-gray-100 items-center justify-between w-full">

        {/* Search */}
        <div className="relative flex-1 w-full max-w-md">
          <MagnifyingGlassIcon className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, email ...."
            className="w-full pl-8 pr-4 py-1.5 bg-transparent outline-none text-xs font-medium text-gray-700 placeholder-gray-400 border-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
          />
        </div>

        {/* Batch Dropdown & Refresh */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-[200px] border-l border-gray-100 pl-2">
            <FunnelIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <select
              className="w-full pl-8 py-1.5 bg-transparent outline-none cursor-pointer text-xs font-medium text-gray-500 appearance-none"
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
            className="p-1.5 hover:bg-gray-50 rounded-full transition-colors text-gray-400 shrink-0 border border-gray-100 ml-2"
            title="Refresh"
          >
            <ArrowPathIcon className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* --- List Area --- */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 min-h-[400px] flex flex-col w-full">
        {isLoading && filteredStudents.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 py-16">
            <ArrowPathIcon className="w-8 h-8 animate-spin mb-3 text-[#0d4b5b]/50" />
            <p className="text-xs font-bold uppercase tracking-widest">Loading students...</p>
          </div>
        )}

        {!isLoading && !isError && filteredStudents.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8 text-center py-16">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-3">
              <UserIcon className="w-8 h-8 text-gray-300" />
            </div>
            <h3 className="text-gray-900 font-bold text-sm">No students found</h3>
            <p className="text-[10px] mt-1">Try adjusting your search or filters.</p>
          </div>
        )}

        {!isLoading && !isError && filteredStudents.length > 0 && (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block w-full rounded-t-xl">
              <table className="w-full text-left border-collapse table-fixed">
                <thead className="text-[11px] uppercase text-gray-500 font-bold tracking-widest border-b border-gray-100 bg-white rounded-t-xl">
                  <tr>
                    <th className="px-5 py-4 w-[30%]">Student</th>
                    <th className="px-5 py-4 w-[25%]">Batch</th>
                    <th className="px-5 py-4 w-[20%]">Contact</th>
                    <th className="px-5 py-4 w-[15%]">States</th>
                    <th className="px-2 py-4 text-center w-[10%]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
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
                      onLock={() => handleLock(student._id)}
                      onUnlock={() => handleUnlock(student._id)}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-3 w-full p-4">
              {filteredStudents.map((student) => (
                <StudentCardMobile
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
                  onLock={() => handleLock(student._id)}
                  onUnlock={() => handleUnlock(student._id)}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Define exact props to fix "Parameter 'e' implicitly has 'any' type"
interface StudentItemProps {
  student: ExtendedUserData;
  isOpen: boolean;
  onToggle: (e: React.MouseEvent) => void;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onRestore: () => void;
  onActivate: () => void;
  onDeactivate: () => void;
  onLock: () => void;
  onUnlock: () => void;
}

// --- SUB-COMPONENT: Table Row (Desktop) ---
const StudentRow = React.memo(({
  student,
  isOpen,
  onToggle,
  onView,
  onEdit,
  onDelete,
  onRestore,
  onActivate,
  onDeactivate,
  onLock,
  onUnlock
}: StudentItemProps) => {

  const displayName = student.firstName ? `${student.firstName} ${student.lastName || ""}` : "Unknown";

  let status = "Active";
  if (student.isDeleted) status = "Deleted";
  else if (student.isLocked) status = "Locked";
  else if (!student.isActive) status = "Inactive";

  // Match the clean design: Just colored text and a dot
  const statusConfig = {
    Active: { text: "text-emerald-500", dot: "bg-emerald-500" },
    Locked: { text: "text-red-500", dot: "bg-red-500" },
    Inactive: { text: "text-amber-500", dot: "bg-amber-400" },
    Deleted: { text: "text-gray-400", dot: "bg-gray-400" }
  };

  const currentConfig = statusConfig[status as keyof typeof statusConfig];
  const rowOpacity = student.isDeleted ? "opacity-60 bg-gray-50" : "hover:bg-gray-50/50";

  return (
    <tr className={`transition-colors group ${rowOpacity}`}>
      <td className="px-5 py-3 align-middle truncate">
        <div className="flex items-center gap-3 w-full">
          <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${getAvatarColor(displayName)}`}>
            {displayName.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className={`font-bold text-[13px] text-gray-900 truncate ${student.isDeleted ? 'line-through text-gray-400' : ''}`}>
              {displayName}
            </div>
            <div className="text-[11px] text-gray-400 font-medium truncate mt-0.5">{student.email}</div>
          </div>
        </div>
      </td>
      <td className="px-5 py-3 align-middle truncate">
        <span className="text-[13px] font-medium text-gray-700 truncate block">
          {getBatchName(student.batch)}
        </span>
      </td>
      <td className="px-5 py-3 align-middle text-[13px] text-gray-600 font-medium truncate">
        {student.phoneNumber || "-"}
      </td>
      <td className="px-5 py-3 align-middle truncate">
        <div className={`flex items-center gap-1.5 text-[12px] font-bold ${currentConfig.text}`}>
          <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${currentConfig.dot}`}></div>
          <span className="truncate">{status}</span>
        </div>
      </td>
      <td className="px-5 py-3 text-center align-middle relative">
        <button
          onClick={onToggle}
          className={`p-2 rounded-lg transition-colors relative z-10 mx-auto ${isOpen ? "bg-[#eef2f6] text-[#0d4b5b]" : "text-[#0d4b5b] hover:bg-gray-100"}`}
        >
          <ChevronRightIcon className="w-5 h-5 stroke-[2.5]" />
        </button>

        {/* Desktop Action Menu Tooltip wrapper */}
        {isOpen && (
          <div className="absolute right-12 top-10 z-50 w-44 shadow-xl rounded-xl bg-white border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-left py-1">
            <ActionMenu {...{ onView, onEdit, onDelete, onRestore, onActivate, onDeactivate, onLock, onUnlock, student }} />
          </div>
        )}
      </td>
    </tr>
  );
});

// --- SUB-COMPONENT: Mobile Card ---
const StudentCardMobile = React.memo(({
  student,
  isOpen,
  onToggle,
  onView,
  onEdit,
  onDelete,
  onRestore,
  onActivate,
  onDeactivate,
  onLock,
  onUnlock
}: StudentItemProps) => {

  const displayName = student.firstName ? `${student.firstName} ${student.lastName || ""}` : "Unknown";

  let status = "Active";
  if (student.isDeleted) status = "Deleted";
  else if (student.isLocked) status = "Locked";
  else if (!student.isActive) status = "Inactive";

  const statusConfig = {
    Active: { text: "text-emerald-500", dot: "bg-emerald-500" },
    Locked: { text: "text-red-500", dot: "bg-red-500" },
    Inactive: { text: "text-amber-500", dot: "bg-amber-400" },
    Deleted: { text: "text-gray-400", dot: "bg-gray-400" }
  };
  const currentConfig = statusConfig[status as keyof typeof statusConfig];

  return (
    <div className={`bg-white p-4 rounded-xl border border-gray-100 shadow-sm relative ${student.isDeleted ? 'opacity-70 bg-gray-50' : ''}`}>
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${getAvatarColor(displayName)}`}>
            {displayName.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0 overflow-hidden">
            <h4 className="font-bold text-gray-900 text-[13px] truncate">{displayName}</h4>
            <p className="text-[11px] text-gray-400 mt-0.5 truncate">{student.email}</p>
          </div>
        </div>
        <button onClick={onToggle} className="p-1 -mr-1 text-[#0d4b5b] relative z-10 shrink-0">
          <ChevronRightIcon className="w-5 h-5 stroke-[2.5]" />
        </button>
      </div>

      <div className="flex items-center justify-between text-xs text-gray-500 border-t border-gray-50 pt-3">
        <span className="text-gray-700 font-medium truncate max-w-[150px]">{getBatchName(student.batch)}</span>
        <div className={`flex items-center gap-1.5 font-bold shrink-0 ${currentConfig.text}`}>
          <div className={`w-1.5 h-1.5 rounded-full ${currentConfig.dot}`}></div>
          {status}
        </div>
      </div>

      {/* Mobile Action Menu */}
      {isOpen && (
        <div className="absolute right-4 top-12 z-50 w-44 shadow-xl rounded-xl bg-white border border-gray-100 overflow-hidden py-1 animate-in fade-in zoom-in-95 duration-200">
          <ActionMenu {...{ onView, onEdit, onDelete, onRestore, onActivate, onDeactivate, onLock, onUnlock, student }} />
        </div>
      )}
    </div>
  )
});

// --- SUB-COMPONENT: Action Menu Content ---
const ActionMenu = ({ onView, onEdit, onDelete, onRestore, onActivate, onDeactivate, onLock, onUnlock, student }: any) => (
  <div className="bg-white flex flex-col">
    {/* View Details - Dark Teal */}
    <button onClick={onView} className="w-full text-left px-4 py-2.5 text-[11px] font-bold text-white bg-[#0d4b5b] hover:bg-[#093946] flex items-center gap-2.5 transition-colors">
      <EyeIcon className="w-4 h-4 text-white" /> View Details
    </button>

    {student.isDeleted ? (
      <button onClick={onRestore} className="w-full text-left px-4 py-2.5 text-[11px] font-bold text-emerald-600 hover:bg-emerald-50 flex items-center gap-2.5 transition-colors border-b border-gray-50">
        <ArrowUturnLeftIcon className="w-4 h-4" /> Restore User
      </button>
    ) : (
      <>
        <button onClick={onEdit} className="w-full text-left px-4 py-2.5 text-[11px] font-bold text-gray-600 hover:bg-gray-50 flex items-center gap-2.5 transition-colors border-b border-gray-50">
          <PencilSquareIcon className="w-4 h-4 text-gray-400" /> Edit Profile
        </button>
        {student.isLocked ? (
          <button onClick={onUnlock} className="w-full text-left px-4 py-2.5 text-[11px] font-bold text-blue-600 hover:bg-blue-50 flex items-center gap-2.5 transition-colors border-b border-gray-50">
            <LockOpenIcon className="w-4 h-4 text-blue-500" /> Unlock Login
          </button>
        ) : (
          <button onClick={onLock} className="w-full text-left px-4 py-2.5 text-[11px] font-bold text-red-500 hover:bg-red-50 flex items-center gap-2.5 transition-colors border-b border-gray-50">
            <LockClosedIcon className="w-4 h-4 text-red-500" /> Lock Login
          </button>
        )}
        {student.isActive ? (
          <button onClick={onDeactivate} className="w-full text-left px-4 py-2.5 text-[11px] font-bold text-amber-500 hover:bg-amber-50 flex items-center gap-2.5 transition-colors border-b border-gray-50">
            <NoSymbolIcon className="w-4 h-4 text-amber-500" /> Deactivate
          </button>
        ) : (
          <button onClick={onActivate} className="w-full text-left px-4 py-2.5 text-[11px] font-bold text-emerald-500 hover:bg-emerald-50 flex items-center gap-2.5 transition-colors border-b border-gray-50">
            <CheckCircleIcon className="w-4 h-4 text-emerald-500" /> Activate
          </button>
        )}
        <button onClick={onDelete} className="w-full text-left px-4 py-2.5 text-[11px] font-bold text-red-500 hover:bg-red-50 flex items-center gap-2.5 transition-colors">
          <TrashIcon className="w-4 h-4 text-red-500" /> Delete User
        </button>
      </>
    )}
  </div>
);