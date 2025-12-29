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
  PencilIcon,
  ArrowPathIcon
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
  accentColor: string;
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
      
      const mapped: ClassListItem[] = dataArray.map((item: any, idx: number) => ({
        _id: item._id,
        title: item.name ?? "Untitled Class",
        batchName: item.batch?.name ?? "Independent",
        level: item.level ? item.level.toUpperCase() : "GENERAL",
        schedule: item.timeSchedules?.[0] 
                  ? `${["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][item.timeSchedules[0].day]} • ${item.timeSchedules[0].startTime}`
                  : "TBA",
        studentCount: item.studentCount ?? 0,
        isActive: item.isActive ?? true,
        isPublished: item.isPublished ?? false,
        accentColor: ["bg-brand-cerulean", "bg-brand-coral", "bg-brand-jasmine"][idx % 3]
      }));
      
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
      <div className="space-y-6 pb-24 md:pb-20 max-w-6xl mx-auto px-4 sm:px-6 md:px-0">
        
        {/* Header */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-brand-prussian tracking-tight">Academic Modules</h1>
            <p className="text-gray-500 text-xs sm:text-sm">Configure curriculum and student access states.</p>
          </div>
          <button 
            onClick={() => navigate("/admin/classes/create")}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-brand-cerulean hover:bg-brand-prussian text-white px-5 py-3 rounded-xl text-sm font-medium transition-all shadow-sm active:scale-95"
          >
            <PlusIcon className="w-4 h-4 stroke-2" />
            New Class
          </button>
        </header>

        {/* Search */}
        <div className="relative group">
          <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-brand-cerulean transition-colors" />
          <input 
            type="text"
            placeholder="Search modules or intakes..."
            className="w-full pl-11 pr-4 py-3 bg-white border border-brand-aliceBlue rounded-xl focus:ring-2 focus:ring-brand-cerulean/10 focus:border-brand-cerulean outline-none transition-all text-sm text-brand-prussian"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
          {loading ? (
            <div className="col-span-full py-24 flex flex-col items-center gap-3">
               <ArrowPathIcon className="w-8 h-8 text-brand-cerulean animate-spin" />
               <p className="text-xs text-gray-400 font-medium uppercase tracking-widest animate-pulse">Syncing Curriculum...</p>
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
    className="group bg-white rounded-2xl border border-brand-aliceBlue hover:border-brand-cerulean/20 transition-all overflow-hidden shadow-sm"
  >
    <div className="p-5 flex flex-col h-full">
      
      {/* Top Row: Batch & Status */}
      <div className="flex justify-between items-start mb-4">
        <span className="text-[10px] font-bold text-brand-cerulean uppercase tracking-widest bg-brand-aliceBlue px-2.5 py-1 rounded-md truncate max-w-[60%]">
          {cls.batchName}
        </span>
        <button 
          onClick={onToggle}
          className={`text-[9px] font-bold px-2 py-1 rounded-md border uppercase tracking-wider transition-colors shrink-0 ${
            cls.isPublished 
            ? "border-green-200 text-green-600 bg-green-50" 
            : "border-gray-200 text-gray-400 bg-gray-50"
          }`}
        >
          {cls.isPublished ? "Visible" : "Hidden"}
        </button>
      </div>

      {/* Main Info */}
      <div className="flex-1 mb-4">
          <h3 className="text-base sm:text-lg font-semibold text-brand-prussian mb-1 leading-snug group-hover:text-brand-cerulean transition-colors line-clamp-2">
              {cls.title}
          </h3>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{cls.level} Curriculum</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="flex items-center gap-2 text-xs text-gray-600 bg-gray-50 p-2 rounded-lg">
          <ClockIcon className="w-4 h-4 text-brand-cerulean/50 shrink-0" />
          <span className="font-medium truncate">{cls.schedule}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-600 bg-gray-50 p-2 rounded-lg">
          <UsersIcon className="w-4 h-4 text-brand-cerulean/50 shrink-0" />
          <span className="font-medium">{cls.studentCount} Students</span>
        </div>
      </div>

      {/* Actions */}
      <div className="pt-4 border-t border-brand-aliceBlue flex items-center gap-2 mt-auto">
        <button 
          onClick={onView} 
          className="flex-1 bg-brand-prussian hover:bg-brand-cerulean text-white text-[11px] font-bold uppercase tracking-widest py-3 rounded-xl transition-all shadow-sm active:scale-95"
        >
          View Class
        </button>
        <div className="flex gap-1">
          <button onClick={onEdit} className="p-3 text-gray-400 hover:text-brand-cerulean hover:bg-brand-aliceBlue rounded-xl transition-all border border-transparent hover:border-brand-cerulean/10 active:scale-90">
            <PencilIcon className="w-4 h-4" />
          </button>
          <button onClick={onDelete} className="p-3 text-gray-400 hover:text-brand-coral hover:bg-red-50 rounded-xl transition-all active:scale-90">
            <TrashIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  </motion.div>
);

const EmptyState = ({ onAdd }: { onAdd: () => void }) => (
  <div className="col-span-full py-20 flex flex-col items-center justify-center bg-white rounded-2xl border border-dashed border-brand-aliceBlue text-gray-400 mx-4 md:mx-0">
    <AcademicCapIcon className="w-12 h-12 mb-4 opacity-10 text-brand-prussian" />
    <p className="text-xs font-semibold uppercase tracking-[0.2em]">Curriculum Empty</p>
    <button onClick={onAdd} className="mt-4 bg-brand-aliceBlue text-brand-cerulean px-6 py-2 rounded-lg text-xs font-bold hover:bg-brand-cerulean hover:text-white transition-all">
      Initialize Module
    </button>
  </div>
);