import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Search,
  Calendar,
  Clock,
  ArrowRight,
  GraduationCap,
  Layers,
  BookOpen,
  FileText,
  Sparkles,
  X,
  ChevronDown,
  RotateCcw,
  Calculator,
} from "lucide-react";

import ClassService from "../services/ClassService";
import BatchService from "../services/BatchService";
import { useAuth } from "../contexts/AuthContext";

// --- Configuration ---
const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000"
).replace(/\/+$/, "");

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
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" as const } },
};

// --- Helpers ---
const getImageUrl = (path?: string): string | null => {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  const cleanPath = path.replace(/\\/g, "/").replace(/^\/+/, "");
  return `${API_BASE_URL}/${cleanPath}`;
};

const getDayName = (dayIndex: number): string => {
  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  return days[dayIndex] || "TBA";
};

const getTypeBadgeStyle = (type?: string) => {
  switch (type?.toLowerCase()) {
    case "theory":
      return "bg-purple-50/95 text-purple-700 border-purple-200/80";
    case "revision":
      return "bg-amber-50/95 text-amber-700 border-amber-200/80";
    case "paper":
      return "bg-sky-50/95 text-sky-700 border-sky-200/80";
    default:
      return "bg-slate-100/95 text-slate-700 border-slate-200/80";
  }
};

// --- Skeleton Loader ---
function ClassesGridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 animate-pulse">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div
          key={i}
          className="bg-white rounded-3xl border border-slate-200/70 overflow-hidden shadow-sm flex flex-col"
        >
          <div className="h-52 bg-slate-100" />
          <div className="p-6 space-y-4 flex-1">
            <div className="h-3 w-24 bg-slate-100 rounded" />
            <div className="h-6 w-3/4 bg-slate-200 rounded-lg" />
            <div className="space-y-2">
              <div className="h-3.5 w-full bg-slate-100 rounded" />
              <div className="h-3.5 w-5/6 bg-slate-100 rounded" />
            </div>
            <div className="h-10 bg-slate-50 rounded-xl mt-4" />
            <div className="h-12 bg-slate-200/80 rounded-xl mt-2" />
          </div>
        </div>
      ))}
    </div>
  );
}

// --- Class Cover Image with Graceful Fallback ---
function ClassCover({
  src,
  alt,
}: {
  src: string | null;
  alt: string;
}) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-brand-prussian via-[#07273D] to-brand-cerulean flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#ffffff33_1px,transparent_1px)] [background-size:16px_16px]" />
        <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center text-brand-jasmine mb-2.5 relative z-10">
          <Calculator className="w-6 h-6" />
        </div>
        <span className="text-[11px] font-bold uppercase tracking-widest text-white/80 relative z-10">
          SL Accounting
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      onError={() => setFailed(true)}
      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
      loading="lazy"
    />
  );
}

// --- Main Component ---
export default function PublicClassesPage() {
  const { user } = useAuth();

  const [classes, setClasses] = useState<ClassData[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [selectedBatch, setSelectedBatch] = useState("All");
  const [selectedLevel, setSelectedLevel] = useState("All");
  const [selectedType, setSelectedType] = useState("All");

  // Resolve student's assigned batch if logged in as student
  const userBatchId = useMemo(() => {
    if (user?.role === "student" && user.batch) {
      return typeof user.batch === "object"
        ? (user.batch as any)._id
        : String(user.batch);
    }
    return null;
  }, [user]);

  // 1. Fetch Data
  useEffect(() => {
    const initData = async () => {
      setLoading(true);
      try {
        const [classRes, batchRes] = await Promise.all([
          ClassService.getAllPublicClasses(),
          BatchService.getAllPublicBatches(true).catch(() => ({ batches: [] })),
        ]);

        const fetchedClasses: ClassData[] = Array.isArray(classRes)
          ? classRes
          : (classRes as any).classes || [];
        setClasses(fetchedClasses);

        if (batchRes.batches && batchRes.batches.length > 0) {
          setBatches(batchRes.batches);
        } else {
          const uniqueBatchesMap = new Map<string, Batch>();
          fetchedClasses.forEach((cls) => {
            if (
              cls.batch &&
              typeof cls.batch === "object" &&
              "_id" in cls.batch
            ) {
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

  // Base classes accessible to the current viewer (applies student batch scope)
  const accessibleClasses = useMemo(() => {
    if (!userBatchId) return classes;
    return classes.filter((c) => {
      const classBatchId = c.batch
        ? typeof c.batch === "object"
          ? c.batch._id
          : c.batch
        : null;
      return !classBatchId || classBatchId === userBatchId;
    });
  }, [classes, userBatchId]);

  // Visible batches in dropdown (restricted if student is bound to a batch)
  const visibleBatches = useMemo(() => {
    if (!userBatchId) return batches;
    return batches.filter((b) => b._id === userBatchId);
  }, [batches, userBatchId]);

  // Dynamic counts per class type
  const typeCounts = useMemo(() => {
    const counts = { All: accessibleClasses.length, theory: 0, revision: 0, paper: 0 };
    accessibleClasses.forEach((c) => {
      const t = c.type?.toLowerCase();
      if (t === "theory") counts.theory++;
      else if (t === "revision") counts.revision++;
      else if (t === "paper") counts.paper++;
    });
    return counts;
  }, [accessibleClasses]);

  // 2. Filter Logic
  const filteredClasses = useMemo(() => {
    const searchTerm = search.toLowerCase().trim();

    return accessibleClasses.filter((c) => {
      const matchesSearch =
        !searchTerm ||
        c.name.toLowerCase().includes(searchTerm) ||
        (c.description && c.description.toLowerCase().includes(searchTerm)) ||
        (c.tags && c.tags.some((t) => t.toLowerCase().includes(searchTerm)));

      const classBatchId = c.batch
        ? typeof c.batch === "object"
          ? c.batch._id
          : c.batch
        : null;
      const matchesBatch =
        selectedBatch === "All" || classBatchId === selectedBatch;

      const matchesLevel =
        selectedLevel === "All" ||
        (c.level && c.level.toLowerCase() === selectedLevel.toLowerCase());

      const matchesType =
        selectedType === "All" ||
        (c.type && c.type.toLowerCase() === selectedType.toLowerCase());

      return matchesSearch && matchesBatch && matchesLevel && matchesType;
    });
  }, [
    accessibleClasses,
    search,
    selectedBatch,
    selectedLevel,
    selectedType,
  ]);

  const hasActiveFilters =
    search.trim() !== "" ||
    selectedBatch !== "All" ||
    selectedLevel !== "All" ||
    selectedType !== "All";

  const resetFilters = () => {
    setSearch("");
    setSelectedBatch("All");
    setSelectedLevel("All");
    setSelectedType("All");
  };

  return (
    <div className="min-h-screen bg-[#FAFCFF] font-sans text-brand-prussian pb-24 selection:bg-brand-cerulean selection:text-white">
      {/* HERO SECTION */}
      <header className="relative bg-gradient-to-br from-brand-prussian via-[#07273D] to-[#02121E] text-white overflow-hidden rounded-b-[2.5rem] sm:rounded-b-[3rem] shadow-xl pt-32 pb-16 sm:pt-36 sm:pb-20 px-4 sm:px-6">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff33_1px,transparent_1px)] [background-size:22px_22px] pointer-events-none" />
        <div className="absolute -top-32 -left-20 w-[480px] h-[480px] bg-brand-cerulean rounded-full blur-[130px] opacity-25 pointer-events-none" />
        <div className="absolute -bottom-32 -right-20 w-[480px] h-[480px] bg-brand-coral rounded-full blur-[130px] opacity-20 pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/15 text-brand-jasmine text-[11px] font-bold uppercase tracking-widest mb-6 backdrop-blur-md"
          >
            <Sparkles size={13} />
            <span>2027 · 2028 A/L Accounting Classes</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="text-3xl sm:text-5xl md:text-6xl font-black mb-5 tracking-tight font-sans leading-[1.1]"
          >
            Find Your Perfect{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-jasmine to-brand-coral">
              Class
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.16 }}
            className="text-sm sm:text-lg text-white/75 max-w-2xl mx-auto mb-9 leading-relaxed font-sans"
          >
            Enroll in live Theory, Revision, and Paper classes led by Kalum Waduge—complete with HD replays, structured tutes, and timed assessments.
          </motion.p>

          {/* Search Box */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.24 }}
            className="max-w-2xl mx-auto"
          >
            <div className="relative flex items-center bg-white rounded-2xl shadow-2xl shadow-black/20 p-1.5 border border-white/20 focus-within:ring-4 focus-within:ring-brand-cerulean/30 transition-all">
              <div className="pl-3.5 pr-2.5 text-slate-400">
                <Search size={19} />
              </div>
              <input
                type="text"
                placeholder="Search by class title, syllabus topic, or tag..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full py-2.5 px-1 text-sm sm:text-base text-brand-prussian outline-none placeholder:text-slate-400 font-medium bg-transparent"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  aria-label="Clear search"
                  className="p-2 mr-1 rounded-xl text-slate-400 hover:text-brand-prussian hover:bg-slate-100 transition-colors"
                >
                  <X size={17} />
                </button>
              )}
            </div>
          </motion.div>
        </div>
      </header>

      {/* MAIN DIRECTORY */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-10 sm:pt-12 space-y-8">
        {/* Filter Toolbar Card */}
        <section className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Segmented Class Type Tabs */}
            <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200/70 overflow-x-auto self-start max-w-full">
              {(
                [
                  { key: "All", label: "All Classes", count: typeCounts.All },
                  { key: "theory", label: "Theory", count: typeCounts.theory },
                  {
                    key: "revision",
                    label: "Revision",
                    count: typeCounts.revision,
                  },
                  { key: "paper", label: "Paper", count: typeCounts.paper },
                ] as const
              ).map((tab) => {
                const active = selectedType === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setSelectedType(tab.key)}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${active
                        ? "bg-brand-prussian text-white shadow-sm"
                        : "text-slate-600 hover:text-brand-prussian hover:bg-white/60"
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

            {/* Batch & Level Dropdowns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:w-auto">
              <div className="relative sm:min-w-[190px]">
                <Layers
                  size={15}
                  className="text-brand-cerulean absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                />
                <select
                  value={selectedBatch}
                  onChange={(e) => setSelectedBatch(e.target.value)}
                  aria-label="Filter by batch"
                  className="w-full appearance-none bg-slate-50 border border-slate-200/80 text-brand-prussian py-2.5 pl-9 pr-9 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-cerulean/20 focus:border-brand-cerulean outline-none cursor-pointer text-xs font-semibold transition-all"
                >
                  <option value="All">
                    {userBatchId ? "My Assigned Batch" : "All Batches"}
                  </option>
                  {visibleBatches.map((b) => (
                    <option key={b._id} value={b._id}>
                      {b.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              <div className="relative sm:min-w-[190px]">
                <GraduationCap
                  size={15}
                  className="text-brand-coral absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                />
                <select
                  value={selectedLevel}
                  onChange={(e) => setSelectedLevel(e.target.value)}
                  aria-label="Filter by academic level"
                  className="w-full appearance-none bg-slate-50 border border-slate-200/80 text-brand-prussian py-2.5 pl-9 pr-9 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-cerulean/20 focus:border-brand-cerulean outline-none cursor-pointer text-xs font-semibold transition-all"
                >
                  <option value="All">All Levels</option>
                  <option value="Advanced">Advanced Level (A/L)</option>
                  <option value="Ordinary">Ordinary Level (O/L)</option>
                  <option value="General">General</option>
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Results Summary & Reset Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100 text-xs">
            <div className="flex items-center gap-2 text-slate-500">
              <BookOpen size={14} className="text-brand-cerulean" />
              <span>
                Showing{" "}
                <strong className="text-brand-prussian tabular-nums">
                  {filteredClasses.length}
                </strong>{" "}
                {filteredClasses.length === 1 ? "class" : "classes"}
                {userBatchId && (
                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-md bg-brand-aliceBlue text-brand-cerulean font-semibold text-[11px]">
                    Filtered to your batch
                  </span>
                )}
              </span>
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-cerulean hover:text-brand-prussian transition-colors"
              >
                <RotateCcw size={13} />
                <span>Reset Filters</span>
              </button>
            )}
          </div>
        </section>

        {/* CLASSES GRID */}
        {loading ? (
          <ClassesGridSkeleton />
        ) : filteredClasses.length === 0 ? (
          <div className="text-center py-20 px-6 bg-white rounded-3xl shadow-sm border border-dashed border-slate-200 max-w-xl mx-auto">
            <div className="w-16 h-16 bg-brand-aliceBlue/70 text-brand-cerulean rounded-2xl flex items-center justify-center mx-auto mb-5">
              <BookOpen className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-brand-prussian mb-1.5">
              No matching classes found
            </h3>
            <p className="text-slate-500 mb-6 text-sm max-w-sm mx-auto leading-relaxed">
              We couldn't find any classes matching your current search or filter criteria.
            </p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-prussian hover:bg-brand-cerulean text-white text-xs font-semibold transition-colors shadow-sm"
              >
                <RotateCcw size={14} />
                <span>Clear All Filters</span>
              </button>
            )}
          </div>
        ) : (
          <motion.div
            key={`${selectedType}-${selectedBatch}-${selectedLevel}-${search}`}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8"
          >
            {filteredClasses.map((cls) => {
              const coverSrc = getImageUrl(cls.coverImage);
              const batchName =
                cls.batch && typeof cls.batch === "object"
                  ? cls.batch.name
                  : null;

              return (
                <motion.article
                  key={cls._id}
                  variants={cardVariants}
                  className="group bg-white rounded-3xl border border-slate-200/80 hover:border-brand-cerulean/40 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col h-full"
                >
                  <Link
                    to={`/classes/${cls._id}`}
                    className="flex flex-col h-full focus:outline-none"
                  >
                    {/* Cover Image */}
                    <div className="relative h-52 overflow-hidden bg-slate-100 shrink-0">
                      <ClassCover src={coverSrc} alt={cls.name} />
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-brand-prussian/85 via-brand-prussian/15 to-transparent" />

                      {/* Top Badges */}
                      <div className="absolute top-3.5 left-3.5 right-3.5 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap gap-1.5">
                          {cls.type && (
                            <span
                              className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider border backdrop-blur-md ${getTypeBadgeStyle(
                                cls.type
                              )}`}
                            >
                              {cls.type}
                            </span>
                          )}
                          {batchName && (
                            <span className="bg-brand-prussian/85 backdrop-blur-md text-brand-jasmine text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider border border-white/15">
                              {batchName}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Bottom Price Pill */}
                      <div className="absolute bottom-3.5 right-3.5">
                        <div className="bg-white/95 backdrop-blur-md text-brand-prussian px-3.5 py-1.5 rounded-xl font-extrabold shadow-md text-xs sm:text-sm font-mono tabular-nums border border-white">
                          LKR {Number(cls.price || 0).toLocaleString()}
                        </div>
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="p-6 flex-1 flex flex-col">
                      {/* Level & Recurrence Meta */}
                      <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                        {cls.level && <span>{cls.level} Level</span>}
                        {cls.level && cls.recurrence && <span>•</span>}
                        {cls.recurrence && (
                          <span className="capitalize">{cls.recurrence}</span>
                        )}
                      </div>

                      <h3 className="text-lg sm:text-xl font-bold text-brand-prussian mb-2 group-hover:text-brand-cerulean transition-colors line-clamp-1 font-sinhala leading-snug">
                        {cls.name}
                      </h3>

                      <p className="text-slate-500 text-sm line-clamp-2 mb-5 font-sans leading-relaxed">
                        {cls.description}
                      </p>

                      {/* Schedule Rows */}
                      <div className="space-y-2 mb-5 mt-auto">
                        {cls.timeSchedules && cls.timeSchedules.length > 0 ? (
                          cls.timeSchedules.map((sch, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between text-xs bg-slate-50/90 px-3.5 py-2.5 rounded-xl border border-slate-200/60"
                            >
                              <div className="flex items-center gap-2 font-bold text-brand-prussian">
                                <Calendar className="w-3.5 h-3.5 text-brand-cerulean shrink-0" />
                                <span>{getDayName(sch.day)}s</span>
                              </div>
                              <div className="flex items-center gap-1.5 font-semibold text-slate-600 bg-white px-2.5 py-0.5 rounded-lg border border-slate-200/70 tabular-nums">
                                <Clock className="w-3 h-3 text-brand-cerulean shrink-0" />
                                <span>
                                  {sch.startTime} – {sch.endTime}
                                </span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-50/80 px-3.5 py-2.5 rounded-xl border border-slate-200/60">
                            <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>Flexible / Recorded Schedule</span>
                          </div>
                        )}
                      </div>

                      {/* Optional Tags */}
                      {cls.tags && cls.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-5">
                          {cls.tags.slice(0, 3).map((tag, i) => (
                            <span
                              key={i}
                              className="text-[10px] font-semibold text-brand-cerulean bg-brand-aliceBlue/70 px-2 py-0.5 rounded-md"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* CTA Button */}
                      <div className="w-full bg-brand-prussian group-hover:bg-brand-cerulean text-white font-semibold text-xs sm:text-sm py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm">
                        <span>View Class Details</span>
                        <ArrowRight
                          size={15}
                          className="group-hover:translate-x-1 transition-transform"
                        />
                      </div>
                    </div>
                  </Link>
                </motion.article>
              );
            })}
          </motion.div>
        )}
      </main>
    </div>
  );
}