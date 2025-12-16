import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ClassService from "../services/ClassService";
import BatchService from "../services/BatchService";
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  CalendarDaysIcon,
  ClockIcon,
  AcademicCapIcon,
  ArrowRightIcon,
  UserGroupIcon
} from "@heroicons/react/24/outline";

// --- Configuration ---
const API_BASE_URL = "http://localhost:3000"; 

// --- Interfaces ---
interface Batch {
  _id: string;
  name: string;
}

interface ClassData {
  _id: string;
  name: string;
  description: string;
  price: number;
  level: string;
  batch?: Batch | string; // Can be object (populated) or ID string
  coverImage?: string;
  firstSessionDate: string;
  recurrence: string;
  timeSchedules: { day: number; startTime: string; endTime: string }[];
  isPublished: boolean;
  tags?: string[];
}

export default function PublicClassesPage() {
  const navigate = useNavigate();
  
  // --- Data State ---
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);

  // --- Filter State ---
  const [search, setSearch] = useState("");
  const [selectedBatch, setSelectedBatch] = useState("All");
  const [selectedLevel, setSelectedLevel] = useState("All");

  // --- Helper: Get Image URL ---
  const getImageUrl = (path?: string) => {
    if (!path) return "https://via.placeholder.com/800x450?text=SL+Accounting"; 
    if (path.startsWith("http")) return path;
    const cleanPath = path.replace(/\\/g, "/");
    return `${API_BASE_URL}/${cleanPath.startsWith("/") ? cleanPath.slice(1) : cleanPath}`;
  };

  // --- Helper: Day Name ---
  const getDayName = (dayIndex: number) => 
    ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][dayIndex] || "";

  // --- 1. Fetch Data ---
  useEffect(() => {
    const initData = async () => {
      setLoading(true);
      try {
        // Run fetches in parallel
        const [classRes, batchRes] = await Promise.all([
          ClassService.getAllPublicClasses(),
          BatchService.getAllPublicBatches(true).catch(err => {
            console.log("Could not fetch batches via service (likely requires login). Using fallback.", err);
            return { batches: [] }; 
          })
        ]);

        // 1. Process Classes
        const fetchedClasses: ClassData[] = Array.isArray(classRes) ? classRes : (classRes.classes || []);
        setClasses(fetchedClasses);

        // 2. Process Batches
        if (batchRes.batches && batchRes.batches.length > 0) {
            setBatches(batchRes.batches);
        } else {
            // Fallback: Extract from classes
            const uniqueBatchesMap = new Map<string, Batch>();
            fetchedClasses.forEach(cls => {
                if (cls.batch && typeof cls.batch === 'object' && '_id' in cls.batch) {
                    uniqueBatchesMap.set(cls.batch._id, {
                        _id: cls.batch._id,
                        name: cls.batch.name
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

  // --- 2. Filter Logic ---
  const filteredClasses = classes.filter((c) => {
    // A. Search (Name OR Tags)
    const matchesSearch = 
      c.name.toLowerCase().includes(search.toLowerCase()) || 
      (c.tags && c.tags.some(t => t.toLowerCase().includes(search.toLowerCase())));
    
    // B. Batch Filter
    const classBatchId = c.batch 
        ? (typeof c.batch === 'object' ? c.batch._id : c.batch) 
        : null;
    
    const matchesBatch = selectedBatch === "All" || classBatchId === selectedBatch;
    
    // C. Level Filter
    const matchesLevel = selectedLevel === "All" || c.level.toLowerCase() === selectedLevel.toLowerCase();

    return matchesSearch && matchesBatch && matchesLevel;
  });

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      
      {/* --- HERO SECTION --- */}
      <div className="relative bg-[#0b2540] text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
        <div className="relative max-w-7xl mx-auto px-6 py-20 lg:py-28 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight">
            Master Accounting <span className="text-blue-400">Today</span>
          </h1>
          <p className="text-lg md:text-xl text-blue-100 max-w-2xl mx-auto mb-10 leading-relaxed">
            Join Sri Lanka's premium accounting classes. Expert guidance, comprehensive materials, and proven results.
          </p>
          
          {/* Search Bar */}
          <div className="max-w-xl mx-auto relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-400 to-teal-400 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-200"></div>
            <div className="relative flex items-center bg-white rounded-xl overflow-hidden shadow-2xl">
                <MagnifyingGlassIcon className="w-6 h-6 text-gray-400 ml-4" />
                <input 
                    type="text" 
                    placeholder="Search classes..." 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full p-4 text-gray-800 outline-none placeholder-gray-400 font-medium"
                />
            </div>
          </div>
        </div>
      </div>

      {/* --- CONTENT SECTION --- */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        
        {/* Filters Header */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-10">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <AcademicCapIcon className="w-7 h-7 text-[#0b2540]" />
                Available Courses
            </h2>
            
            <div className="flex flex-wrap gap-3 w-full md:w-auto">
                {/* Batch Filter */}
                <div className="relative flex-1 md:flex-none">
                    <select 
                        value={selectedBatch}
                        onChange={(e) => setSelectedBatch(e.target.value)}
                        className="w-full appearance-none bg-white border border-gray-200 text-gray-700 py-2.5 pl-4 pr-10 rounded-xl focus:ring-2 focus:ring-[#0b2540] focus:border-transparent outline-none cursor-pointer shadow-sm text-sm font-medium"
                    >
                        <option value="All">All Batches</option>
                        {batches.map(b => (
                            <option key={b._id} value={b._id}>{b.name}</option>
                        ))}
                    </select>
                    <FunnelIcon className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                {/* Level Filter */}
                <div className="relative flex-1 md:flex-none">
                    <select 
                        value={selectedLevel}
                        onChange={(e) => setSelectedLevel(e.target.value)}
                        className="w-full appearance-none bg-white border border-gray-200 text-gray-700 py-2.5 pl-4 pr-10 rounded-xl focus:ring-2 focus:ring-[#0b2540] focus:border-transparent outline-none cursor-pointer shadow-sm text-sm font-medium"
                    >
                        <option value="All">All Levels</option>
                        <option value="Advanced">Advanced Level</option>
                        <option value="Ordinary">Ordinary Level</option>
                        <option value="General">General</option>
                    </select>
                    <FunnelIcon className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
            </div>
        </div>

        {/* --- GRID --- */}
        {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-pulse">
                {[1,2,3].map(i => <div key={i} className="h-96 bg-gray-200 rounded-3xl"></div>)}
            </div>
        ) : filteredClasses.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-gray-100">
                <AcademicCapIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-700">No classes found</h3>
                <p className="text-gray-500">Try adjusting your filters or search term.</p>
                <button 
                    onClick={() => { setSearch(""); setSelectedBatch("All"); setSelectedLevel("All"); }}
                    className="mt-4 text-[#0b2540] font-semibold hover:underline"
                >
                    Clear Filters
                </button>
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredClasses.map((cls) => {
                    const schedule = cls.timeSchedules && cls.timeSchedules[0];
                    return (
                        <div 
                            key={cls._id} 
                            onClick={() => navigate(`/classes/${cls._id}`)}
                            className="group bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden cursor-pointer flex flex-col h-full"
                        >
                            {/* Image Header */}
                            <div className="relative h-56 overflow-hidden bg-gray-100">
                                <img 
                                    src={getImageUrl(cls.coverImage)} 
                                    alt={cls.name} 
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                />
                                {/* Gradient Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60 group-hover:opacity-80 transition-opacity"></div>
                                
                                {/* Badges */}
                                <div className="absolute top-4 left-4 flex gap-2">
                                    <span className="bg-white/90 backdrop-blur text-[#0b2540] text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                                        {cls.level}
                                    </span>
                                    {cls.batch && typeof cls.batch === 'object' && (
                                        <span className="bg-[#0b2540]/90 backdrop-blur text-white text-xs font-bold px-3 py-1 rounded-full border border-white/20">
                                            {cls.batch.name}
                                        </span>
                                    )}
                                </div>

                                {/* Price Tag */}
                                <div className="absolute bottom-4 right-4 bg-blue-600 text-white px-4 py-1.5 rounded-xl font-bold shadow-lg">
                                    LKR {cls.price.toLocaleString()}
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-6 flex-1 flex flex-col">
                                <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors line-clamp-1">
                                    {cls.name}
                                </h3>
                                
                                <p className="text-gray-500 text-sm line-clamp-2 mb-4 flex-1">
                                    {cls.description}
                                </p>

                                {/* Meta Info */}
                                <div className="space-y-3 border-t border-gray-100 pt-4 mb-4">
                                    {schedule && (
                                        <div className="flex items-center text-sm text-gray-600">
                                            <CalendarDaysIcon className="w-5 h-5 mr-3 text-blue-500" />
                                            <span className="font-medium">{getDayName(schedule.day)}s</span>
                                        </div>
                                    )}
                                    {schedule && (
                                        <div className="flex items-center text-sm text-gray-600">
                                            <ClockIcon className="w-5 h-5 mr-3 text-blue-500" />
                                            <span>{schedule.startTime} - {schedule.endTime}</span>
                                        </div>
                                    )}
                                    <div className="flex items-center text-sm text-gray-600">
                                        <UserGroupIcon className="w-5 h-5 mr-3 text-blue-500" />
                                        <span>Physical & Online</span>
                                    </div>
                                </div>

                                {/* View Details Button */}
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation(); // Prevent double navigation if the parent div also has onClick
                                        navigate(`/classes/${cls._id}`);
                                    }}
                                    className="w-full mt-auto bg-gray-50 text-gray-900 font-bold py-3.5 rounded-xl group-hover:bg-[#0b2540] group-hover:text-white transition-colors flex items-center justify-center gap-2"
                                >
                                    View Details <ArrowRightIcon className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        )}

      </div>
    </div>
  );
}