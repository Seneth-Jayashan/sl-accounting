import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Filter,
  Calendar,
  Clock,
  ArrowRight,
  GraduationCap,
  Layers,
  BookOpen,
  Frown,
  FileText
} from "lucide-react";

import ClassService from "../services/ClassService";
import BatchService from "../services/BatchService";
import { useAuth } from "../contexts/AuthContext";

// --- Configuration ---
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

// --- Interfaces ---
interface Batch {
  _id: string;
  name: string;
}

interface TimeSchedule {
  day: number;
  startTime: string;
  endTime: string;
}

interface ClassData {
  _id: string;
  name: string;
  description: string;
  price: number;
  level: string;
  type: "theory" | "revision" | "paper";
  batch?: Batch | string; 
  coverImage?: string;
  firstSessionDate: string;
  recurrence: string;
  timeSchedules: TimeSchedule[];
  isPublished: boolean;
  tags?: string[];
}

// --- Animation Variants ---
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
};

// --- Helpers ---
const getImageUrl = (path?: string): string => {
  if (!path) return "https://via.placeholder.com/800x450?text=SL+Accounting";
  if (path.startsWith("http")) return path;
  const cleanPath = path.replace(/\\/g, "/").replace(/^\/+/, "");
  return `${API_BASE_URL}/${cleanPath}`;
};

const getDayName = (dayIndex: number): string => {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return days[dayIndex] || "TBA";
};

const getTypeColor = (type: string) => {
    switch(type?.toLowerCase()) {
        case 'theory': return 'bg-purple-100 text-purple-700 border-purple-200';
        case 'revision': return 'bg-orange-100 text-orange-700 border-orange-200';
        case 'paper': return 'bg-blue-100 text-blue-700 border-blue-200';
        default: return 'bg-gray-100 text-gray-600 border-gray-200';
    }
};

export default function PublicClassesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [classes, setClasses] = useState<ClassData[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [selectedBatch, setSelectedBatch] = useState("All");
  const [selectedLevel, setSelectedLevel] = useState("All");
  const [selectedType, setSelectedType] = useState("All");

  // 1. Fetch Data
  useEffect(() => {
    const initData = async () => {
      setLoading(true);
      try {
        const [classRes, batchRes] = await Promise.all([
          ClassService.getAllPublicClasses(),
          BatchService.getAllPublicBatches(true).catch(() => ({ batches: [] })),
        ]);

        const fetchedClasses: ClassData[] = Array.isArray(classRes) ? classRes : (classRes as any).classes || [];
        setClasses(fetchedClasses);

        if (batchRes.batches && batchRes.batches.length > 0) {
          setBatches(batchRes.batches);
        } else {
          const uniqueBatchesMap = new Map<string, Batch>();
          fetchedClasses.forEach((cls) => {
            if (cls.batch && typeof cls.batch === "object" && "_id" in cls.batch) {
              uniqueBatchesMap.set(cls.batch._id, {
                _id: cls.batch._id,
                name: cls.batch.name,
              });
            }
          });
          setBatches(Array.from(uniqueBatchesMap.values()));
        }
      } catch (error) {
        console.error("Failed to load content", error);
      } finally {
        setLoading(false);
      }
    };

    initData();
  }, []);

  // 2. Filter Logic
  const filteredClasses = useMemo(() => {
    const searchTerm = search.toLowerCase().trim();
    const userBatchId = (user?.role === 'student' && user.batch) ? user.batch : null;

    return classes.filter((c) => {
      // Search
      const matchesSearch = c.name.toLowerCase().includes(searchTerm) || (c.tags && c.tags.some((t) => t.toLowerCase().includes(searchTerm)));

      // Batch
      const classBatchId = c.batch ? (typeof c.batch === "object" ? c.batch._id : c.batch) : null;
      let matchesBatch = true;

      // Rule: Student Restriction
      if (userBatchId) {
          if (classBatchId && classBatchId !== userBatchId) return false;
      }
      // Rule: Dropdown
      if (selectedBatch !== "All") {
          matchesBatch = classBatchId === selectedBatch;
      }

      // Level
      const matchesLevel = selectedLevel === "All" || (c.level && c.level.toLowerCase() === selectedLevel.toLowerCase());

      // Type
      const matchesType = selectedType === "All" || (c.type && c.type.toLowerCase() === selectedType.toLowerCase());

      return matchesSearch && matchesBatch && matchesLevel && matchesType;
    });
  }, [classes, search, selectedBatch, selectedLevel, selectedType, user]);

  return (
    <div className="min-h-screen bg-brand-aliceBlue/30 font-sans text-gray-900 pb-20">
      
      {/* HERO */}
      <div className="relative bg-brand-prussian text-white overflow-hidden rounded-b-[3rem] shadow-2xl z-10 pt-24 pb-20">
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
        <div className="absolute top-[-50%] left-[-10%] w-[600px] h-[600px] bg-brand-cerulean rounded-full blur-[120px] opacity-30 pointer-events-none"></div>
        <div className="absolute bottom-[-50%] right-[-10%] w-[600px] h-[600px] bg-brand-coral rounded-full blur-[120px] opacity-20 pointer-events-none"></div>

        <div className="relative max-w-7xl mx-auto px-6 text-center">
          <motion.h1 initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-4xl md:text-6xl font-black mb-6 tracking-tight font-sinhala leading-tight">
            Find Your Perfect <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-jasmine to-brand-coral">Class</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="text-lg md:text-xl text-brand-aliceBlue/80 max-w-2xl mx-auto mb-10 leading-relaxed font-sans">
             Access premium accounting education with expert guidance, comprehensive materials, and proven results.
          </motion.p>
          
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="max-w-2xl mx-auto relative group z-20">
            <div className="absolute -inset-1 bg-gradient-to-r from-brand-cerulean to-brand-coral rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-500"></div>
            <div className="relative flex items-center bg-white rounded-xl overflow-hidden shadow-2xl p-1">
              <div className="pl-4 pr-2 text-gray-400"><Search size={20} /></div>
              <input type="text" placeholder="Search for classes..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full p-3 text-gray-800 outline-none placeholder-gray-400 font-medium bg-transparent" />
            </div>
          </motion.div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        
        {/* Filters */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 mb-12">
            <h2 className="text-2xl font-bold text-brand-prussian flex items-center gap-2 font-sinhala shrink-0">
                <BookOpen className="text-brand-cerulean" /> Available Classes
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full xl:w-auto">
                <div className="relative group">
                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none"><Layers size={16} className="text-brand-cerulean" /></div>
                    <select value={selectedBatch} onChange={(e) => setSelectedBatch(e.target.value)} className="w-full appearance-none bg-white border border-gray-200 text-gray-700 py-2.5 pl-10 pr-10 rounded-xl focus:ring-2 focus:ring-brand-cerulean focus:border-transparent outline-none cursor-pointer shadow-sm text-sm font-bold transition-all hover:border-brand-cerulean">
                        <option value="All">All Batches</option>
                        {batches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
                    </select>
                    <Filter className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                <div className="relative group">
                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none"><FileText size={16} className="text-purple-500" /></div>
                    <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)} className="w-full appearance-none bg-white border border-gray-200 text-gray-700 py-2.5 pl-10 pr-10 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none cursor-pointer shadow-sm text-sm font-bold transition-all hover:border-purple-500 capitalize">
                        <option value="All">All Types</option>
                        <option value="theory">Theory</option>
                        <option value="revision">Revision</option>
                        <option value="paper">Paper</option>
                    </select>
                    <Filter className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                <div className="relative group">
                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none"><GraduationCap size={16} className="text-brand-coral" /></div>
                    <select value={selectedLevel} onChange={(e) => setSelectedLevel(e.target.value)} className="w-full appearance-none bg-white border border-gray-200 text-gray-700 py-2.5 pl-10 pr-10 rounded-xl focus:ring-2 focus:ring-brand-coral focus:border-transparent outline-none cursor-pointer shadow-sm text-sm font-bold transition-all hover:border-brand-coral">
                        <option value="All">All Levels</option>
                        <option value="Advanced">Advanced Level</option>
                        <option value="Ordinary">Ordinary Level</option>
                        <option value="General">General</option>
                    </select>
                    <Filter className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
            </div>
        </div>

        {/* Grid */}
        {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[1,2,3].map(i => (
                    <div key={i} className="bg-white rounded-[2rem] h-[450px] animate-pulse border border-gray-100 shadow-sm"></div>
                ))}
            </div>
        ) : filteredClasses.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-[2.5rem] shadow-sm border border-gray-100 max-w-2xl mx-auto">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6"><Frown className="w-10 h-10 text-gray-400" /></div>
                <h3 className="text-xl font-bold text-brand-prussian mb-2">No classes found</h3>
                <p className="text-gray-500 mb-6 text-sm">We couldn't find any classes matching your current filters.</p>
                <button onClick={() => { setSearch(""); setSelectedBatch("All"); setSelectedLevel("All"); setSelectedType("All"); }} className="text-brand-cerulean font-bold hover:text-brand-prussian underline transition-colors text-sm">Clear All Filters</button>
            </div>
        ) : (
            <motion.div 
                // --- FIX: Add KEY based on filters to force re-render ---
                key={`${selectedType}-${selectedBatch}-${selectedLevel}-${search}`} 
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
                <AnimatePresence mode="popLayout">
                    {filteredClasses.map((cls) => {
                        const schedule = cls.timeSchedules && cls.timeSchedules[0];
                        return (
                            <motion.div 
                                key={cls._id} 
                                variants={cardVariants}
                                // Removed layout prop here to avoid grid calculation bugs
                                className="group bg-white rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-2xl hover:border-brand-cerulean/20 transition-all duration-300 overflow-hidden flex flex-col h-full relative"
                            >
                                <div onClick={() => navigate(`/classes/${cls._id}`)} className="cursor-pointer flex flex-col h-full">
                                    <div className="relative h-56 overflow-hidden bg-brand-aliceBlue">
                                        <img src={getImageUrl(cls.coverImage)} alt={cls.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" loading="lazy" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-brand-prussian/90 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity"></div>
                                        <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                                            {cls.type && <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest shadow-sm border ${getTypeColor(cls.type)} backdrop-blur-md bg-opacity-90`}>{cls.type}</span>}
                                            {cls.batch && typeof cls.batch === 'object' && <span className="bg-brand-cerulean/90 backdrop-blur-md text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest shadow-sm border border-white/20">{cls.batch.name}</span>}
                                        </div>
                                        <div className="absolute bottom-4 right-4"><div className="bg-green-700 text-white px-4 py-1.5 rounded-xl font-bold shadow-lg text-sm flex items-center gap-1">LKR {cls.price.toLocaleString()}</div></div>
                                    </div>
                                    <div className="p-6 flex-1 flex flex-col">
                                        <h3 className="text-xl font-bold text-brand-prussian mb-2 group-hover:text-brand-cerulean transition-colors line-clamp-1 font-sinhala leading-tight">{cls.name}</h3>
                                        <p className="text-gray-500 text-sm line-clamp-2 mb-6 font-sans leading-relaxed flex-1">{cls.description}</p>
                                        <div className="grid grid-cols-1 gap-3 mb-6 mt-auto">
                                            {schedule && (
                                                <>
                                                    <div className="flex items-center text-sm text-gray-600 bg-brand-aliceBlue/50 p-2 rounded-lg"><Calendar className="w-4 h-4 mr-3 text-brand-cerulean" /><span className="font-bold text-brand-prussian">{getDayName(schedule.day)}s</span></div>
                                                    <div className="flex items-center text-sm text-gray-600 bg-brand-aliceBlue/50 p-2 rounded-lg"><Clock className="w-4 h-4 mr-3 text-brand-cerulean" /><span className="font-medium">{schedule.startTime} - {schedule.endTime}</span></div>
                                                </>
                                            )}
                                        </div>
                                        <button className="w-full bg-brand-prussian text-white font-bold py-3.5 rounded-xl group-hover:bg-brand-cerulean transition-colors flex items-center justify-center gap-2 shadow-lg shadow-brand-prussian/10">View Class Details <ArrowRight size={16} /></button>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </motion.div>
        )}
      </div>
    </div>
  );
}