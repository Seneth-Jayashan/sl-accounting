import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  PlusIcon,
  MagnifyingGlassIcon,
  UsersIcon,
  ClockIcon,
  AcademicCapIcon,
  TrashIcon,
  PencilSquareIcon,
  ArrowPathIcon,
  XMarkIcon,
  EyeIcon,
  EyeSlashIcon,
  FunnelIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import ClassService from "../../../services/ClassService";

// --- Interfaces ---
interface ClassListItem {
  _id: string;
  title: string;
  batchName: string;
  level: string;
  schedule: string[];
  studentCount: number;
  isActive: boolean;
  isPublished: boolean;
}

// --- Skeleton Loader ---
function ClassesSkeleton() {
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
      <div className="h-20 bg-white rounded-2xl border border-slate-100" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-64 bg-white rounded-2xl border border-slate-100 p-6 space-y-4">
            <div className="h-5 w-24 bg-slate-100 rounded-md" />
            <div className="h-6 w-3/4 bg-slate-200 rounded" />
            <div className="h-16 bg-slate-50 rounded-xl" />
            <div className="h-10 bg-slate-100 rounded-xl mt-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}

// --- Main Component ---
export default function ClassesPage() {
  const navigate = useNavigate();

  // Data State
  const [classes, setClasses] = useState<ClassListItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filter State
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [batchFilter, setBatchFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "visible" | "hidden">("all");

  // Delete Modal State
  const [deleteTarget, setDeleteTarget] = useState<ClassListItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadClasses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await ClassService.getAllClasses();
      const dataArray = Array.isArray(response)
        ? response
        : (response as any).classes || [];

      const mapped: ClassListItem[] = dataArray.map((item: any) => ({
        _id: item._id,
        title: item.name ?? "Untitled Class",
        batchName: item.batch?.name ?? "Independent",
        level: item.level ? item.level.toUpperCase() : "GENERAL",
        schedule:
          item.timeSchedules && item.timeSchedules.length > 0
            ? item.timeSchedules.map(
              (sch: any) =>
                `${["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][sch.day]} • ${sch.startTime}`
            )
            : ["Schedule TBA"],
        studentCount: item.studentCount ?? 0,
        isActive: item.isActive ?? true,
        isPublished: item.isPublished ?? false,
      }));

      setClasses(mapped);
    } catch {
      setError("Unable to sync curriculum data. Please check your network connection.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadClasses();
  }, [loadClasses]);

  // Derived Stats & Batches
  const stats = useMemo(() => {
    const visible = classes.filter((c) => c.isPublished).length;
    const totalStudents = classes.reduce((sum, c) => sum + c.studentCount, 0);
    return {
      total: classes.length,
      visible,
      hidden: classes.length - visible,
      totalStudents,
    };
  }, [classes]);

  const uniqueBatches = useMemo(() => {
    const set = new Set(classes.map((c) => c.batchName));
    return Array.from(set).sort();
  }, [classes]);

  // Filtered List
  const filteredClasses = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    return classes.filter((cls) => {
      if (batchFilter !== "all" && cls.batchName !== batchFilter) return false;
      if (statusFilter === "visible" && !cls.isPublished) return false;
      if (statusFilter === "hidden" && cls.isPublished) return false;
      if (!term) return true;

      return (
        cls.title.toLowerCase().includes(term) ||
        cls.batchName.toLowerCase().includes(term) ||
        cls.level.toLowerCase().includes(term)
      );
    });
  }, [classes, searchTerm, batchFilter, statusFilter]);

  // --- Handlers ---
  const handleTogglePublish = async (cls: ClassListItem) => {
    const original = [...classes];
    const newStatus = !cls.isPublished;

    setClasses((prev) =>
      prev.map((c) => (c._id === cls._id ? { ...c, isPublished: newStatus } : c))
    );

    try {
      await ClassService.setPublished(cls._id, newStatus);
    } catch (err) {
      console.error("Publish toggle failed", err);
      setClasses(original);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const original = [...classes];

    try {
      await ClassService.deleteClass(deleteTarget._id);
      setClasses((prev) => prev.filter((c) => c._id !== deleteTarget._id));
      setDeleteTarget(null);
    } catch (err) {
      console.error("Delete failed", err);
      alert("Unauthorized or failed deletion attempt.");
      setClasses(original);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6 md:space-y-8 pb-24 md:pb-12">
      {/* HEADER */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-brand-prussian tracking-tight">
            Academic Modules
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Configure live classes, weekly schedules, and student visibility.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={loadClasses}
            disabled={loading}
            title="Refresh classes"
            className="p-2.5 bg-white rounded-xl border border-slate-200/80 shadow-sm text-slate-600 hover:text-brand-cerulean hover:border-brand-cerulean/40 transition-colors disabled:opacity-50"
          >
            <ArrowPathIcon
              className={`w-4 h-4 ${loading ? "animate-spin text-brand-cerulean" : ""}`}
            />
          </button>

          <button
            onClick={() => navigate("/admin/classes/create")}
            className="inline-flex items-center gap-2 bg-brand-prussian hover:bg-brand-cerulean text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-sm hover:shadow-md active:scale-[0.98] transition-all"
          >
            <PlusIcon className="w-4 h-4 stroke-[2.5]" />
            <span>New Class</span>
          </button>
        </div>
      </header>

      {/* LOADING SKELETON */}
      {loading && classes.length === 0 ? (
        <ClassesSkeleton />
      ) : error ? (
        <div className="bg-rose-50 border border-rose-200/70 text-rose-700 p-6 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <ExclamationTriangleIcon className="w-6 h-6 text-rose-500 shrink-0" />
            <div>
              <p className="font-semibold text-sm">Failed to load classes</p>
              <p className="text-xs text-rose-600/80 mt-0.5">{error}</p>
            </div>
          </div>
          <button
            onClick={loadClasses}
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
                    Total Modules
                  </p>
                  <h3 className="text-3xl font-bold text-brand-prussian mt-2 tabular-nums">
                    {stats.total}
                  </h3>
                </div>
                <div className="p-3 rounded-xl bg-blue-50 text-blue-600 ring-1 ring-blue-100">
                  <AcademicCapIcon className="w-5 h-5" />
                </div>
              </div>
            </div>

            <div className="relative overflow-hidden bg-white p-6 rounded-2xl border border-slate-200/70 shadow-sm">
              <div className="pointer-events-none absolute -top-10 -right-10 w-24 h-24 rounded-full bg-emerald-500/10 blur-2xl" />
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Visible
                  </p>
                  <h3 className="text-3xl font-bold text-brand-prussian mt-2 tabular-nums">
                    {stats.visible}
                  </h3>
                </div>
                <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
                  <EyeIcon className="w-5 h-5" />
                </div>
              </div>
            </div>

            <div className="relative overflow-hidden bg-white p-6 rounded-2xl border border-slate-200/70 shadow-sm">
              <div className="pointer-events-none absolute -top-10 -right-10 w-24 h-24 rounded-full bg-slate-500/10 blur-2xl" />
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Hidden
                  </p>
                  <h3 className="text-3xl font-bold text-brand-prussian mt-2 tabular-nums">
                    {stats.hidden}
                  </h3>
                </div>
                <div className="p-3 rounded-xl bg-slate-100 text-slate-600 ring-1 ring-slate-200">
                  <EyeSlashIcon className="w-5 h-5" />
                </div>
              </div>
            </div>

            <div className="relative overflow-hidden bg-white p-6 rounded-2xl border border-slate-200/70 shadow-sm">
              <div className="pointer-events-none absolute -top-10 -right-10 w-24 h-24 rounded-full bg-purple-500/10 blur-2xl" />
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Enrolled Seats
                  </p>
                  <h3 className="text-3xl font-bold text-brand-prussian mt-2 tabular-nums">
                    {stats.totalStudents.toLocaleString()}
                  </h3>
                </div>
                <div className="p-3 rounded-xl bg-purple-50 text-purple-600 ring-1 ring-purple-100">
                  <UsersIcon className="w-5 h-5" />
                </div>
              </div>
            </div>
          </div>

          {/* FILTER & SEARCH TOOLBAR */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/70 shadow-sm space-y-3.5">
            <div className="flex flex-col md:flex-row gap-3">
              {/* Search */}
              <div className="relative flex-1">
                <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search classes, batches, or levels..."
                  className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-sm text-slate-700 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-cerulean/20 focus:border-brand-cerulean transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
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

              {/* Batch Filter */}
              {uniqueBatches.length > 0 && (
                <div className="relative md:w-56">
                  <FunnelIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <select
                    value={batchFilter}
                    onChange={(e) => setBatchFilter(e.target.value)}
                    className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-sm font-medium text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-cerulean/20 focus:border-brand-cerulean appearance-none cursor-pointer transition-all"
                  >
                    <option value="all">All Batches</option>
                    {uniqueBatches.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                  <ChevronDownIcon className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              )}
            </div>

            {/* Status Filter Pills */}
            <div className="flex items-center gap-1.5">
              {(
                [
                  { key: "all", label: "All", count: stats.total },
                  { key: "visible", label: "Visible", count: stats.visible },
                  { key: "hidden", label: "Hidden", count: stats.hidden },
                ] as const
              ).map((tab) => {
                const active = statusFilter === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setStatusFilter(tab.key)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${active
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

          {/* CLASSES GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <AnimatePresence mode="popLayout">
              {filteredClasses.length === 0 ? (
                <EmptyState
                  key="empty"
                  isEmptyList={classes.length === 0}
                  onAdd={() => navigate("/admin/classes/create")}
                />
              ) : (
                filteredClasses.map((cls) => (
                  <ClassCard
                    key={cls._id}
                    cls={cls}
                    onToggle={() => handleTogglePublish(cls)}
                    onDelete={() => setDeleteTarget(cls)}
                    onEdit={() => navigate(`/admin/classes/edit/${cls._id}`)}
                    onView={() => navigate(`/admin/classes/view/${cls._id}`)}
                  />
                ))
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl border border-slate-200/70">
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <ExclamationTriangleIcon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-brand-prussian">
                  Delete class module?
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  Are you sure you want to delete{" "}
                  <strong className="text-brand-prussian">
                    "{deleteTarget.title}"
                  </strong>
                  ? All associated session data will be permanently removed.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 mt-6">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="px-4 py-2 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors disabled:opacity-50"
              >
                {deleting && <ArrowPathIcon className="w-4 h-4 animate-spin" />}
                <span>{deleting ? "Deleting..." : "Delete Class"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Sub-Components ---

interface ClassCardProps {
  cls: ClassListItem;
  onToggle: () => void;
  onDelete: () => void;
  onEdit: () => void;
  onView: () => void;
}

const ClassCard = ({ cls, onToggle, onDelete, onEdit, onView }: ClassCardProps) => (
  <motion.div
    layout
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, scale: 0.96 }}
    transition={{ duration: 0.18 }}
    className="group bg-white rounded-2xl border border-slate-200/70 hover:border-brand-cerulean/40 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col overflow-hidden"
  >
    <div className="p-5 flex flex-col h-full">
      {/* Top Row: Batch & Visibility Toggle */}
      <div className="flex items-center justify-between gap-2 mb-4">
        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-brand-aliceBlue text-brand-cerulean ring-1 ring-brand-cerulean/20 truncate max-w-[65%]">
          {cls.batchName}
        </span>

        <button
          onClick={onToggle}
          title="Click to toggle visibility"
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ring-1 transition-all shrink-0 ${cls.isPublished
              ? "bg-emerald-50 text-emerald-700 ring-emerald-600/15 hover:bg-emerald-100"
              : "bg-slate-100 text-slate-600 ring-slate-300/70 hover:bg-slate-200"
            }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${cls.isPublished ? "bg-emerald-500" : "bg-slate-400"
              }`}
          />
          {cls.isPublished ? "Visible" : "Hidden"}
        </button>
      </div>

      {/* Title & Level */}
      <div className="mb-4">
        <h3
          onClick={onView}
          className="text-base font-bold text-brand-prussian group-hover:text-brand-cerulean transition-colors line-clamp-2 cursor-pointer leading-snug"
        >
          {cls.title}
        </h3>
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mt-1">
          {cls.level} Curriculum
        </p>
      </div>

      {/* Schedule & Student Count */}
      <div className="space-y-2 mb-5 flex-1">
        <div className="bg-slate-50/90 border border-slate-100 rounded-xl p-2.5 space-y-1.5">
          {cls.schedule.map((sch, idx) => (
            <div key={idx} className="flex items-center gap-2 text-xs text-slate-600">
              <ClockIcon className="w-3.5 h-3.5 text-brand-cerulean shrink-0" />
              <span className="font-medium truncate">{sch}</span>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between bg-slate-50/90 border border-slate-100 rounded-xl px-3 py-2 text-xs">
          <span className="text-slate-500 flex items-center gap-2">
            <UsersIcon className="w-3.5 h-3.5 text-brand-cerulean shrink-0" />
            Enrolled Students
          </span>
          <span className="font-bold text-brand-prussian tabular-nums">
            {cls.studentCount}
          </span>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="pt-4 border-t border-slate-100 flex items-center gap-2 mt-auto">
        <button
          onClick={onView}
          className="flex-1 inline-flex items-center justify-center gap-1.5 bg-brand-prussian hover:bg-brand-cerulean text-white text-xs font-semibold py-2.5 rounded-xl transition-all shadow-sm active:scale-[0.98]"
        >
          <span>View Class</span>
          <ChevronRightIcon className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={onEdit}
          title="Edit class"
          className="p-2.5 text-slate-400 hover:text-brand-cerulean hover:bg-brand-aliceBlue rounded-xl border border-slate-200/70 transition-colors"
        >
          <PencilSquareIcon className="w-4 h-4" />
        </button>

        <button
          onClick={onDelete}
          title="Delete class"
          className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl border border-slate-200/70 transition-colors"
        >
          <TrashIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  </motion.div>
);

const EmptyState = ({
  isEmptyList,
  onAdd,
}: {
  isEmptyList: boolean;
  onAdd: () => void;
}) => (
  <div className="col-span-full py-16 flex flex-col items-center justify-center bg-white rounded-2xl border border-dashed border-slate-200 text-center px-4">
    <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mb-3 border border-slate-100">
      <AcademicCapIcon className="w-7 h-7 text-slate-300" />
    </div>
    <h3 className="text-sm font-semibold text-brand-prussian">
      {isEmptyList ? "No classes created yet" : "No matching classes"}
    </h3>
    <p className="text-xs text-slate-400 mt-1 max-w-xs">
      {isEmptyList
        ? "Create your first academic module to start scheduling sessions and enrolling students."
        : "Try adjusting your search query, batch filter, or visibility tab."}
    </p>
    {isEmptyList && (
      <button
        onClick={onAdd}
        className="mt-4 inline-flex items-center gap-1.5 bg-brand-aliceBlue text-brand-cerulean px-4 py-2 rounded-xl text-xs font-semibold hover:bg-brand-cerulean hover:text-white transition-colors"
      >
        <PlusIcon className="w-4 h-4" />
        Create First Class
      </button>
    )}
  </div>
);