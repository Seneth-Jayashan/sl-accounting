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
  UsersIcon,
  TrashIcon,
  ArrowUturnLeftIcon,
  NoSymbolIcon,
  CheckCircleIcon,
  LockClosedIcon,
  LockOpenIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";

// Services
import AdminService, { type UserData } from "../../../services/AdminService";
import BatchService, { type BatchData } from "../../../services/BatchService";

// --- TYPES ---
type PopulatedBatch = { _id: string; name: string };
type StatusFilter = "all" | "active" | "inactive" | "locked" | "deleted";

interface ExtendedUserData extends Omit<UserData, "batch"> {
  batch?: string | PopulatedBatch;
}

interface MenuPosition {
  id: string;
  top: number;
  right: number;
  openUp: boolean;
}

// --- CONSTANTS & HELPERS ---
const AVATAR_COLORS = [
  "bg-blue-100 text-blue-700 ring-blue-200",
  "bg-purple-100 text-purple-700 ring-purple-200",
  "bg-emerald-100 text-emerald-700 ring-emerald-200",
  "bg-pink-100 text-pink-700 ring-pink-200",
  "bg-amber-100 text-amber-700 ring-amber-200",
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
  if (!batch) return "Unassigned";
  return typeof batch === "string" ? `Batch #${batch.slice(-4)}` : batch.name;
};

const getStudentStatus = (student: ExtendedUserData) => {
  if (student.isDeleted) return "Deleted" as const;
  if (student.isLocked) return "Locked" as const;
  if (!student.isActive) return "Inactive" as const;
  return "Active" as const;
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

// --- SKELETON LOADER ---
function StudentsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 bg-white rounded-2xl border border-slate-100 p-6">
            <div className="h-3 w-24 bg-slate-200 rounded mb-4" />
            <div className="h-7 w-16 bg-slate-200 rounded" />
          </div>
        ))}
      </div>
      <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4">
        <div className="h-10 w-72 bg-slate-100 rounded-xl" />
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-16 bg-slate-50 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

// --- MAIN COMPONENT ---

export default function StudentsPage() {
  const navigate = useNavigate();

  // UI State
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBatchId, setSelectedBatchId] = useState("All");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [openMenu, setOpenMenu] = useState<MenuPosition | null>(null);

  // Data State
  const [students, setStudents] = useState<ExtendedUserData[]>([]);
  const [batches, setBatches] = useState<BatchData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  const debouncedSearch = useDebounce(searchTerm, 500);

  // Close menu on outside click or scroll
  useEffect(() => {
    const closeMenu = () => setOpenMenu(null);
    document.addEventListener("click", closeMenu);
    window.addEventListener("scroll", closeMenu, true);
    return () => {
      document.removeEventListener("click", closeMenu);
      window.removeEventListener("scroll", closeMenu, true);
    };
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
    return () => {
      isMounted = false;
    };
  }, []);

  // --- 2. FETCH STUDENTS ---
  const fetchStudents = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      const response = await AdminService.getAllUsers({
        search: debouncedSearch,
        role: "student",
        limit: 100,
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

  // --- 3. STATS & FILTER LOGIC ---
  const stats = useMemo(() => {
    let active = 0;
    let inactive = 0;
    let locked = 0;
    let deleted = 0;

    students.forEach((s) => {
      const status = getStudentStatus(s);
      if (status === "Active") active++;
      else if (status === "Inactive") inactive++;
      else if (status === "Locked") locked++;
      else if (status === "Deleted") deleted++;
    });

    return { total: students.length, active, inactive, locked, deleted };
  }, [students]);

  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      if (selectedBatchId !== "All" && getBatchId(student.batch) !== selectedBatchId) {
        return false;
      }
      if (statusFilter !== "all") {
        const s = getStudentStatus(student).toLowerCase();
        if (s !== statusFilter) return false;
      }
      return true;
    });
  }, [students, selectedBatchId, statusFilter]);

  // --- ACTIONS ---

  const handleMenuClick = useCallback((e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUp = spaceBelow < 240;

    setOpenMenu((prev) =>
      prev?.id === id
        ? null
        : {
          id,
          top: openUp ? rect.top - 6 : rect.bottom + 6,
          right: window.innerWidth - rect.right,
          openUp,
        }
    );
  }, []);

  const handleDelete = useCallback(
    async (id: string, name: string) => {
      setOpenMenu(null);
      const result = await Swal.fire({
        title: "Delete Student?",
        text: `${name} will be moved to the trash (Soft Delete).`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#e11d48",
        cancelButtonColor: "#64748b",
        confirmButtonText: "Yes, delete",
      });

      if (result.isConfirmed) {
        try {
          await AdminService.deleteUser(id);
          Swal.fire("Deleted!", "Student has been deactivated/deleted.", "success");
          fetchStudents();
        } catch {
          Swal.fire("Error", "Failed to delete student.", "error");
        }
      }
    },
    [fetchStudents]
  );

  const handleRestore = useCallback(
    async (id: string, name: string) => {
      setOpenMenu(null);
      const result = await Swal.fire({
        title: "Restore Student?",
        text: `Are you sure you want to restore ${name}?`,
        icon: "question",
        showCancelButton: true,
        confirmButtonColor: "#10b981",
        confirmButtonText: "Yes, restore",
      });

      if (result.isConfirmed) {
        try {
          await AdminService.restoreUser(id);
          Swal.fire("Restored!", "Student account is back.", "success");
          fetchStudents();
        } catch {
          Swal.fire("Error", "Failed to restore student.", "error");
        }
      }
    },
    [fetchStudents]
  );

  const handleActivate = useCallback(
    async (id: string) => {
      setOpenMenu(null);
      try {
        await AdminService.activateUser(id);
        const Toast = Swal.mixin({
          toast: true,
          position: "top-end",
          showConfirmButton: false,
          timer: 3000,
        });
        Toast.fire({ icon: "success", title: "Account Activated" });
        fetchStudents();
      } catch {
        Swal.fire("Error", "Could not activate user.", "error");
      }
    },
    [fetchStudents]
  );

  const handleDeactivate = useCallback(
    async (id: string) => {
      setOpenMenu(null);
      const result = await Swal.fire({
        title: "Deactivate Account?",
        text: "User will not be able to log in, but data is preserved.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#f59e0b",
        confirmButtonText: "Yes, suspend",
      });

      if (result.isConfirmed) {
        try {
          await AdminService.deactivateUser(id);
          Swal.fire("Suspended", "Account has been deactivated.", "success");
          fetchStudents();
        } catch {
          Swal.fire("Error", "Could not deactivate user.", "error");
        }
      }
    },
    [fetchStudents]
  );

  const handleLock = useCallback(
    async (id: string) => {
      setOpenMenu(null);
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
        } catch {
          Swal.fire("Error", "Could not lock user.", "error");
        }
      }
    },
    [fetchStudents]
  );

  const handleUnlock = useCallback(
    async (id: string) => {
      setOpenMenu(null);
      try {
        await AdminService.unlockUser(id);
        const Toast = Swal.mixin({
          toast: true,
          position: "top-end",
          showConfirmButton: false,
          timer: 3000,
        });
        Toast.fire({ icon: "success", title: "Account Unlocked" });
        fetchStudents();
      } catch {
        Swal.fire("Error", "Could not unlock user.", "error");
      }
    },
    [fetchStudents]
  );

  return (
    <div className="space-y-6 md:space-y-8 pb-24 md:pb-12">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-brand-prussian tracking-tight">
            Students Directory
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Manage enrollments, account access, and student profiles.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={fetchStudents}
            disabled={isLoading}
            title="Refresh list"
            className="p-2.5 bg-white rounded-xl border border-slate-200/80 shadow-sm text-slate-600 hover:text-brand-cerulean hover:border-brand-cerulean/40 transition-colors disabled:opacity-50"
          >
            <ArrowPathIcon
              className={`w-4 h-4 ${isLoading ? "animate-spin text-brand-cerulean" : ""}`}
            />
          </button>

          <button
            onClick={() => navigate("/admin/students/add")}
            className="inline-flex items-center gap-2 bg-brand-prussian hover:bg-brand-cerulean text-white px-5 py-2.5 rounded-xl font-semibold text-sm shadow-sm hover:shadow-md active:scale-[0.98] transition-all"
          >
            <PlusIcon className="w-4 h-4 stroke-[2.5]" />
            <span>Add Student</span>
          </button>
        </div>
      </div>

      {/* INITIAL LOADING */}
      {isLoading && students.length === 0 ? (
        <StudentsSkeleton />
      ) : isError ? (
        <div className="bg-rose-50 border border-rose-200/70 text-rose-700 p-6 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <ExclamationTriangleIcon className="w-6 h-6 text-rose-500 shrink-0" />
            <div>
              <p className="font-semibold text-sm">Failed to load students</p>
              <p className="text-xs text-rose-600/80 mt-0.5">
                Please check your connection and try again.
              </p>
            </div>
          </div>
          <button
            onClick={fetchStudents}
            className="px-4 py-2 bg-white text-rose-600 text-xs font-semibold rounded-xl border border-rose-200 hover:bg-rose-50 transition-colors"
          >
            Retry
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* KPI SUMMARY CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="relative overflow-hidden bg-white p-6 rounded-2xl border border-slate-200/70 shadow-sm">
              <div className="pointer-events-none absolute -top-10 -right-10 w-24 h-24 rounded-full bg-blue-500/10 blur-2xl" />
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Total Students
                  </p>
                  <h3 className="text-3xl font-bold text-brand-prussian mt-2 tabular-nums">
                    {stats.total}
                  </h3>
                </div>
                <div className="p-3 rounded-xl bg-blue-50 text-blue-600 ring-1 ring-blue-100">
                  <UsersIcon className="w-5 h-5" />
                </div>
              </div>
            </div>

            <div className="relative overflow-hidden bg-white p-6 rounded-2xl border border-slate-200/70 shadow-sm">
              <div className="pointer-events-none absolute -top-10 -right-10 w-24 h-24 rounded-full bg-emerald-500/10 blur-2xl" />
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Active
                  </p>
                  <h3 className="text-3xl font-bold text-brand-prussian mt-2 tabular-nums">
                    {stats.active}
                  </h3>
                </div>
                <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
                  <CheckCircleIcon className="w-5 h-5" />
                </div>
              </div>
            </div>

            <div className="relative overflow-hidden bg-white p-6 rounded-2xl border border-slate-200/70 shadow-sm">
              <div className="pointer-events-none absolute -top-10 -right-10 w-24 h-24 rounded-full bg-amber-500/10 blur-2xl" />
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Inactive / Locked
                  </p>
                  <h3 className="text-3xl font-bold text-brand-prussian mt-2 tabular-nums">
                    {stats.inactive + stats.locked}
                  </h3>
                </div>
                <div className="p-3 rounded-xl bg-amber-50 text-amber-600 ring-1 ring-amber-100">
                  <LockClosedIcon className="w-5 h-5" />
                </div>
              </div>
            </div>

            <div className="relative overflow-hidden bg-white p-6 rounded-2xl border border-slate-200/70 shadow-sm">
              <div className="pointer-events-none absolute -top-10 -right-10 w-24 h-24 rounded-full bg-slate-500/10 blur-2xl" />
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Deleted
                  </p>
                  <h3 className="text-3xl font-bold text-brand-prussian mt-2 tabular-nums">
                    {stats.deleted}
                  </h3>
                </div>
                <div className="p-3 rounded-xl bg-slate-100 text-slate-600 ring-1 ring-slate-200">
                  <TrashIcon className="w-5 h-5" />
                </div>
              </div>
            </div>
          </div>

          {/* FILTERS & DIRECTORY */}
          <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm">
            {/* Toolbar */}
            <div className="p-4 sm:p-5 border-b border-slate-100 space-y-4">
              <div className="flex flex-col md:flex-row gap-3">
                {/* Search */}
                <div className="relative flex-1">
                  <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search by student name or email..."
                    className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-sm text-slate-700 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-cerulean/20 focus:border-brand-cerulean transition-all"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Batch Dropdown */}
                <div className="relative md:w-56">
                  <FunnelIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <select
                    className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-cerulean/20 focus:border-brand-cerulean appearance-none cursor-pointer text-sm font-medium text-slate-700 transition-all"
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
                  <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* Status Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
                {(
                  [
                    { key: "all", label: "All", count: stats.total },
                    { key: "active", label: "Active", count: stats.active },
                    { key: "inactive", label: "Inactive", count: stats.inactive },
                    { key: "locked", label: "Locked", count: stats.locked },
                    { key: "deleted", label: "Deleted", count: stats.deleted },
                  ] as const
                ).map((tab) => {
                  const active = statusFilter === tab.key;
                  return (
                    <button
                      key={tab.key}
                      onClick={() => setStatusFilter(tab.key)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${active
                          ? "bg-brand-prussian text-white shadow-sm"
                          : "bg-slate-50 text-slate-600 hover:bg-brand-aliceBlue hover:text-brand-cerulean"
                        }`}
                    >
                      <span>{tab.label}</span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] tabular-nums ${active
                            ? "bg-white/20 text-white"
                            : "bg-slate-200/70 text-slate-500"
                          }`}
                      >
                        {tab.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Empty State */}
            {filteredStudents.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center py-16 px-4">
                <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mb-3 border border-slate-100">
                  <UserIcon className="w-7 h-7 text-slate-300" />
                </div>
                <h3 className="text-sm font-semibold text-brand-prussian">
                  No students found
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Try adjusting your search query, batch selection, or status filter.
                </p>
              </div>
            ) : (
              <>
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50/80 text-[11px] uppercase text-slate-500 font-semibold tracking-wider border-b border-slate-100">
                      <tr>
                        <th className="px-6 py-3.5">Student</th>
                        <th className="px-6 py-3.5">Batch</th>
                        <th className="px-6 py-3.5">Contact</th>
                        <th className="px-6 py-3.5">Status</th>
                        <th className="px-6 py-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredStudents.map((student) => (
                        <StudentRow
                          key={student._id}
                          student={student}
                          isOpen={openMenu?.id === student._id}
                          menuPos={openMenu?.id === student._id ? openMenu : null}
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
                <div className="md:hidden divide-y divide-slate-100">
                  {filteredStudents.map((student) => (
                    <StudentCardMobile
                      key={student._id}
                      student={student}
                      isOpen={openMenu?.id === student._id}
                      menuPos={openMenu?.id === student._id ? openMenu : null}
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

                {/* Footer Count */}
                <div className="px-6 py-3.5 bg-slate-50/60 border-t border-slate-100 text-xs text-slate-500 rounded-b-2xl">
                  Showing{" "}
                  <strong className="text-brand-prussian tabular-nums">
                    {filteredStudents.length}
                  </strong>{" "}
                  of{" "}
                  <strong className="text-brand-prussian tabular-nums">
                    {students.length}
                  </strong>{" "}
                  students
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// --- SUB-COMPONENT PROPS ---
interface StudentItemProps {
  student: ExtendedUserData;
  isOpen: boolean;
  menuPos: MenuPosition | null;
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

const STATUS_STYLES = {
  Active: {
    pill: "bg-emerald-50 text-emerald-700 ring-emerald-600/15",
    dot: "bg-emerald-500",
  },
  Locked: {
    pill: "bg-rose-50 text-rose-700 ring-rose-600/15",
    dot: "bg-rose-500",
  },
  Inactive: {
    pill: "bg-amber-50 text-amber-700 ring-amber-600/15",
    dot: "bg-amber-500",
  },
  Deleted: {
    pill: "bg-slate-100 text-slate-500 ring-slate-300/70 line-through",
    dot: "bg-slate-400",
  },
};

// --- SUB-COMPONENT: Table Row (Desktop) ---
const StudentRow = React.memo(
  ({
    student,
    isOpen,
    menuPos,
    onToggle,
    onView,
    onEdit,
    onDelete,
    onRestore,
    onActivate,
    onDeactivate,
    onLock,
    onUnlock,
  }: StudentItemProps) => {
    const displayName = student.firstName
      ? `${student.firstName} ${student.lastName || ""}`
      : "Unknown";
    const status = getStudentStatus(student);
    const currentConfig = STATUS_STYLES[status];

    return (
      <tr
        className={`transition-colors ${student.isDeleted ? "opacity-60 bg-slate-50/70" : "hover:bg-slate-50/80"
          }`}
      >
        <td className="px-6 py-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-full ring-1 flex items-center justify-center font-bold text-xs shrink-0 ${getAvatarColor(
                displayName
              )}`}
            >
              {displayName.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div
                className={`font-semibold text-sm truncate ${student.isDeleted
                    ? "line-through text-slate-400"
                    : "text-brand-prussian"
                  }`}
              >
                {displayName}
              </div>
              <div className="text-xs text-slate-400 truncate">{student.email}</div>
            </div>
          </div>
        </td>

        <td className="px-6 py-4 whitespace-nowrap">
          <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200/80 text-xs font-semibold text-slate-600">
            {getBatchName(student.batch)}
          </span>
        </td>

        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 font-mono tabular-nums">
          {student.phoneNumber || "—"}
        </td>

        <td className="px-6 py-4 whitespace-nowrap">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ring-1 ${currentConfig.pill}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${currentConfig.dot}`} />
            {status}
          </span>
        </td>

        <td className="px-6 py-4 text-right whitespace-nowrap">
          <button
            onClick={onToggle}
            className={`p-2 rounded-lg transition-colors ${isOpen
                ? "bg-brand-aliceBlue text-brand-cerulean"
                : "text-slate-400 hover:text-brand-prussian hover:bg-slate-100"
              }`}
          >
            <EllipsisHorizontalIcon className="w-5 h-5" />
          </button>

          {isOpen && menuPos && (
            <div
              style={{
                top: menuPos.top,
                right: menuPos.right,
                transform: menuPos.openUp ? "translateY(-100%)" : undefined,
              }}
              className="fixed z-50 w-48 shadow-xl rounded-xl bg-white border border-slate-200/80 overflow-hidden text-left"
            >
              <ActionMenu
                {...{
                  onView,
                  onEdit,
                  onDelete,
                  onRestore,
                  onActivate,
                  onDeactivate,
                  onLock,
                  onUnlock,
                  student,
                }}
              />
            </div>
          )}
        </td>
      </tr>
    );
  }
);

// --- SUB-COMPONENT: Mobile Card ---
const StudentCardMobile = React.memo(
  ({
    student,
    isOpen,
    menuPos,
    onToggle,
    onView,
    onEdit,
    onDelete,
    onRestore,
    onActivate,
    onDeactivate,
    onLock,
    onUnlock,
  }: StudentItemProps) => {
    const displayName = student.firstName
      ? `${student.firstName} ${student.lastName || ""}`
      : "Unknown";
    const status = getStudentStatus(student);
    const currentConfig = STATUS_STYLES[status];

    return (
      <div
        className={`p-4 relative ${student.isDeleted ? "opacity-65 bg-slate-50" : "bg-white"}`}
      >
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`w-10 h-10 rounded-full ring-1 flex items-center justify-center font-bold text-xs shrink-0 ${getAvatarColor(
                displayName
              )}`}
            >
              {displayName.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <h4 className="font-semibold text-brand-prussian text-sm truncate">
                {displayName}
              </h4>
              <p className="text-xs text-slate-400 truncate">{student.email}</p>
            </div>
          </div>

          <button
            onClick={onToggle}
            className="p-1.5 -mr-1.5 rounded-lg text-slate-400 hover:bg-slate-100"
          >
            <EllipsisHorizontalIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center justify-between text-xs pt-2">
          <span className="bg-slate-50 text-slate-600 font-medium px-2.5 py-1 rounded-lg border border-slate-200/70">
            {getBatchName(student.batch)}
          </span>
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ring-1 ${currentConfig.pill}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${currentConfig.dot}`} />
            {status}
          </span>
        </div>

        {isOpen && menuPos && (
          <div
            style={{
              top: menuPos.top,
              right: menuPos.right,
              transform: menuPos.openUp ? "translateY(-100%)" : undefined,
            }}
            className="fixed z-50 w-48 shadow-xl rounded-xl bg-white border border-slate-200/80 overflow-hidden text-left"
          >
            <ActionMenu
              {...{
                onView,
                onEdit,
                onDelete,
                onRestore,
                onActivate,
                onDeactivate,
                onLock,
                onUnlock,
                student,
              }}
            />
          </div>
        )}
      </div>
    );
  }
);

// --- SUB-COMPONENT: Action Menu Content ---
interface ActionMenuProps {
  student: ExtendedUserData;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onRestore: () => void;
  onActivate: () => void;
  onDeactivate: () => void;
  onLock: () => void;
  onUnlock: () => void;
}

const ActionMenu = ({
  onView,
  onEdit,
  onDelete,
  onRestore,
  onActivate,
  onDeactivate,
  onLock,
  onUnlock,
  student,
}: ActionMenuProps) => (
  <div className="py-1 bg-white divide-y divide-slate-100">
    <button
      onClick={onView}
      className="w-full text-left px-4 py-2.5 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors"
    >
      <EyeIcon className="w-4 h-4 text-slate-400" />
      View Details
    </button>

    {student.isDeleted ? (
      <button
        onClick={onRestore}
        className="w-full text-left px-4 py-2.5 text-xs font-semibold text-emerald-600 hover:bg-emerald-50 flex items-center gap-2.5 transition-colors"
      >
        <ArrowUturnLeftIcon className="w-4 h-4" />
        Restore User
      </button>
    ) : (
      <>
        <button
          onClick={onEdit}
          className="w-full text-left px-4 py-2.5 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors"
        >
          <PencilSquareIcon className="w-4 h-4 text-slate-400" />
          Edit Profile
        </button>

        {student.isLocked ? (
          <button
            onClick={onUnlock}
            className="w-full text-left px-4 py-2.5 text-xs font-medium text-blue-600 hover:bg-blue-50 flex items-center gap-2.5 transition-colors"
          >
            <LockOpenIcon className="w-4 h-4" />
            Unlock Login
          </button>
        ) : (
          <button
            onClick={onLock}
            className="w-full text-left px-4 py-2.5 text-xs font-medium text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 transition-colors"
          >
            <LockClosedIcon className="w-4 h-4" />
            Lock Login
          </button>
        )}

        {student.isActive ? (
          <button
            onClick={onDeactivate}
            className="w-full text-left px-4 py-2.5 text-xs font-medium text-amber-600 hover:bg-amber-50 flex items-center gap-2.5 transition-colors"
          >
            <NoSymbolIcon className="w-4 h-4" />
            Deactivate
          </button>
        ) : (
          <button
            onClick={onActivate}
            className="w-full text-left px-4 py-2.5 text-xs font-medium text-emerald-600 hover:bg-emerald-50 flex items-center gap-2.5 transition-colors"
          >
            <CheckCircleIcon className="w-4 h-4" />
            Activate
          </button>
        )}

        <button
          onClick={onDelete}
          className="w-full text-left px-4 py-2.5 text-xs font-medium text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 transition-colors"
        >
          <TrashIcon className="w-4 h-4" />
          Delete User
        </button>
      </>
    )}
  </div>
);