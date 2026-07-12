import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  PlusIcon,
  MagnifyingGlassIcon,
  TrashIcon,
  PencilSquareIcon,
  ArrowPathIcon,
  AcademicCapIcon
} from "@heroicons/react/24/outline";
import ClassService from "../../../services/ClassService";

// --- Enforced Interfaces ---
interface ClassListItem {
  _id: string;
  title: string;
  batchName: string;
  level: string;
  schedule: string;
  studentCount: number;
  isActive: boolean;
  isPublished: boolean;
}

export default function ClassesPage() {
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState<string>("");
  const [classes, setClasses] = useState<ClassListItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadClasses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await ClassService.getAllClasses();
      const dataArray = Array.isArray(response) ? response : (response as any).classes || [];

      const mapped: ClassListItem[] = dataArray.map((item: any) => {
        // Format schedule as "Wed 02:00PM"
        let scheduleStr = "TBA";
        if (item.timeSchedules?.[0]) {
          const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
          scheduleStr = `${days[item.timeSchedules[0].day]} ${item.timeSchedules[0].startTime}`;
        }

        // Format level to Capitalize first letter (e.g. "Advance", "Ordinary")
        const levelStr = item.level
          ? item.level.charAt(0).toUpperCase() + item.level.slice(1).toLowerCase()
          : "General";

        return {
          _id: item._id,
          title: item.name ?? "Untitled Class",
          batchName: item.batch?.name ?? "Independent",
          level: levelStr,
          schedule: scheduleStr,
          studentCount: item.studentCount ?? 0,
          isActive: item.isActive ?? true,
          isPublished: item.isPublished ?? false,
        };
      });

      setClasses(mapped);
    } catch (err: any) {
      setError("Unable to sync curriculum data. Please check your network connection.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadClasses(); }, [loadClasses]);

  const filteredClasses = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    return classes.filter(cls =>
      cls.title.toLowerCase().includes(term) || cls.batchName.toLowerCase().includes(term)
    );
  }, [classes, searchTerm]);

  const handleTogglePublish = async (cls: ClassListItem) => {
    const original = [...classes];
    const newStatus = !cls.isPublished;

    // Optimistic Update
    setClasses(prev => prev.map(c => c._id === cls._id ? { ...c, isPublished: newStatus } : c));

    try {
      await ClassService.setPublished(cls._id, newStatus);
    } catch (err) {
      console.error("Publish toggle failed", err);
      setClasses(original); // Rollback
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("System Warning: Deleting this class will remove all associated session data. Proceed?")) return;

    const original = [...classes];
    setClasses(prev => prev.filter(c => c._id !== id));

    try {
      await ClassService.deleteClass(id);
    } catch (err) {
      console.error("Delete failed", err);
      alert("Unauthorized or failed deletion attempt.");
      setClasses(original); // Rollback
    }
  };

  return (
    <div className="space-y-6 pb-24 md:pb-20 w-full overflow-x-hidden">

      {/* --- Header --- */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-1">
        <div>
          <h1 className="text-[22px] font-bold text-gray-900 tracking-tight">Academic Modules</h1>
          <p className="text-gray-500 text-xs mt-1">Configure curriculum and student access states.</p>
        </div>
        <button
          onClick={() => navigate("/admin/classes/create")}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#0d4b5b] hover:bg-[#093946] text-white px-5 py-2.5 rounded-lg text-sm font-bold transition-all shadow-sm active:scale-95 shrink-0"
        >
          <PlusIcon className="w-4 h-4 stroke-[2.5]" />
          New Class
        </button>
      </header>

      {/* --- Search --- */}
      <div className="relative group w-full">
        <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 transition-colors" />
        <input
          type="text"
          placeholder="Search by name, email ..."
          className="w-full pl-11 pr-4 py-3 bg-white border border-gray-100 rounded-xl focus:ring-2 focus:ring-[#0d4b5b]/20 focus:border-[#0d4b5b] outline-none transition-all text-sm font-medium text-gray-700 shadow-sm placeholder:text-gray-300"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* --- Grid --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 w-full">
        {loading ? (
          <div className="col-span-full py-24 flex flex-col items-center gap-3">
            <ArrowPathIcon className="w-8 h-8 text-[#0d4b5b]/50 animate-spin" />
            <p className="text-xs text-[#0d4b5b] font-bold uppercase tracking-widest animate-pulse">Syncing Curriculum...</p>
          </div>
        ) : error ? (
          <div className="col-span-full py-12 text-center bg-red-50 rounded-xl border border-red-100 text-red-600 text-sm font-medium">
            {error}
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {filteredClasses.length === 0 ? (
              <EmptyState key="empty" onAdd={() => navigate("/admin/classes/create")} />
            ) : (
              filteredClasses.map((cls) => (
                <ClassCard
                  key={cls._id}
                  cls={cls}
                  onToggle={() => handleTogglePublish(cls)}
                  onDelete={() => handleDelete(cls._id)}
                  onEdit={() => navigate(`/admin/classes/edit/${cls._id}`)}
                  onView={() => navigate(`/admin/classes/view/${cls._id}`)}
                />
              ))
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}

// --- Precise Sub-Components ---

const ClassCard = ({ cls, onToggle, onDelete, onEdit, onView }: any) => (
  <motion.div
    layout
    initial={{ opacity: 0, scale: 0.98 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.95 }}
    className="bg-white rounded-2xl border border-gray-100 transition-all overflow-hidden shadow-sm hover:shadow-md"
  >
    <div className="p-5 flex flex-col h-full">

      {/* Top Row: Batch & Status */}
      <div className="flex justify-between items-start mb-5">
        <span className="text-[11px] font-bold text-cyan-600 bg-cyan-50 px-3 py-1 rounded-full truncate max-w-[70%]">
          {cls.batchName}
        </span>
        <button
          onClick={onToggle}
          className={`text-[11px] font-bold px-3 py-1 rounded-full border transition-colors shrink-0 ${cls.isPublished
              ? "border-emerald-100 text-emerald-500 bg-white"
              : "border-gray-200 text-gray-400 bg-gray-50"
            }`}
        >
          {cls.isPublished ? "Visible" : "Hidden"}
        </button>
      </div>

      {/* Main Info */}
      <div className="flex-1 mb-5">
        <h3 className="text-[17px] font-bold text-gray-800 mb-1 leading-snug line-clamp-2">
          {cls.title}
        </h3>
        <p className="text-[12px] font-medium text-gray-400">{cls.level} Curriculum</p>
      </div>

      {/* Stats (Gray Pills) */}
      <div className="flex items-center gap-3 mb-5">
        <div className="flex-1 text-center text-[12px] font-bold text-gray-600 bg-gray-50 py-2.5 rounded-lg border border-gray-100/50 truncate">
          {cls.schedule}
        </div>
        <div className="flex-1 text-center text-[12px] font-bold text-gray-600 bg-gray-50 py-2.5 rounded-lg border border-gray-100/50 truncate">
          {cls.studentCount} Students
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 mt-auto">
        <button
          onClick={onView}
          className="flex-1 bg-[#0d4b5b] hover:bg-[#093946] text-white text-[13px] font-bold py-2.5 rounded-lg transition-all shadow-sm active:scale-95"
        >
          View Class
        </button>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={onEdit} className="p-2 border border-gray-200 text-gray-400 hover:border-[#0d4b5b] hover:text-[#0d4b5b] rounded-lg transition-all active:scale-90 bg-white">
            <PencilSquareIcon className="w-5 h-5 stroke-[2]" />
          </button>
          <button onClick={onDelete} className="p-2 border border-gray-200 text-gray-400 hover:border-red-500 hover:text-red-500 rounded-lg transition-all active:scale-90 bg-white">
            <TrashIcon className="w-5 h-5 stroke-[2]" />
          </button>
        </div>
      </div>

    </div>
  </motion.div>
);

const EmptyState = ({ onAdd }: { onAdd: () => void }) => (
  <div className="col-span-full py-20 flex flex-col items-center justify-center bg-white rounded-3xl border border-dashed border-gray-200 text-gray-400 mx-4 md:mx-0">
    <AcademicCapIcon className="w-12 h-12 mb-4 text-gray-300" />
    <p className="text-[13px] font-bold text-gray-900 uppercase tracking-widest">Curriculum Empty</p>
    <p className="text-[11px] text-gray-500 mt-1 mb-5 font-medium">Get started by creating your first class module.</p>
    <button onClick={onAdd} className="bg-[#0d4b5b] text-white px-6 py-2.5 rounded-xl text-xs font-bold hover:bg-[#093946] transition-all shadow-sm">
      New Class
    </button>
  </div>
);