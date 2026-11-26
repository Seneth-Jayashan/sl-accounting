import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Search,
  BookOpen,
  ArrowRight,
  PlayCircle,
  Sparkles,
  X,
  Clock,
  Paperclip,
  ListVideo,
  RotateCcw,
  ArrowUpDown,
  ChevronDown,
} from "lucide-react";

import LessonPackService, {
  type LessonPackData,
} from "../services/LessonPackService";

// --- Configuration ---
const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000"
)
  .replace(/\/api\/v1\/?$/, "")
  .replace(/\/+$/, "");

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
const extractYoutubeId = (url?: string): string | null => {
  if (!url) return null;
  const match = url.match(
    /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
  );
  return match && match[2].length === 11 ? match[2] : null;
};

const getSmartCoverUrl = (pack: LessonPackData): string | null => {
  if (pack.coverImage) {
    if (pack.coverImage.startsWith("http")) return pack.coverImage;
    const cleanPath = pack.coverImage.replace(/\\/g, "/").replace(/^\/+/, "");
    return `${API_BASE_URL}/${cleanPath}`;
  }

  if (pack.videos && pack.videos.length > 0) {
    const firstVideo: any = pack.videos[0];
    const ytId =
      firstVideo.youtubeId || extractYoutubeId(firstVideo.youtubeUrl);
    if (ytId) {
      return `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg`;
    }
  }

  return null;
};

// --- Skeleton Loader ---
function LessonPacksSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 animate-pulse">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div
          key={i}
          className="bg-white rounded-3xl border border-slate-200/70 overflow-hidden shadow-sm flex flex-col"
        >
          <div className="h-52 bg-slate-100" />
          <div className="p-6 space-y-4 flex-1">
            <div className="h-3 w-28 bg-slate-100 rounded" />
            <div className="h-6 w-3/4 bg-slate-200 rounded-lg" />
            <div className="space-y-2">
              <div className="h-3.5 w-full bg-slate-100 rounded" />
              <div className="h-3.5 w-5/6 bg-slate-100 rounded" />
            </div>
            <div className="h-12 bg-slate-200/80 rounded-xl mt-4" />
          </div>
        </div>
      ))}
    </div>
  );
}

// --- Cover Image with Graceful Branded Fallback ---
function PackCover({ src, alt }: { src: string | null; alt: string }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-brand-prussian via-[#07273D] to-brand-cerulean flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#ffffff33_1px,transparent_1px)] [background-size:16px_16px]" />
        <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center text-brand-jasmine mb-2.5 relative z-10">
          <ListVideo className="w-6 h-6" />
        </div>
        <span className="text-[11px] font-bold uppercase tracking-widest text-white/80 relative z-10">
          Lesson Pack
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
export default function PublicLessonPacksPage() {
  const [lessonPacks, setLessonPacks] = useState<LessonPackData[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter & Sort State
  const [search, setSearch] = useState("");
  const [priceFilter, setPriceFilter] = useState<"all" | "free" | "paid">("all");
  const [sortBy, setSortBy] = useState<
    "default" | "price_asc" | "price_desc" | "videos_desc"
  >("default");

  // 1. Fetch Data
  useEffect(() => {
    const fetchLessonPacks = async () => {
      setLoading(true);
      try {
        const data = await LessonPackService.getAllPublic();
        const publishedPacks = (data || []).filter((pack) => pack.isPublished);
        setLessonPacks(publishedPacks);
      } catch (error) {
        console.error("Failed to load lesson packs", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLessonPacks();
  }, []);

  // Counts for Price Filter Tabs
  const counts = useMemo(() => {
    let free = 0;
    let paid = 0;
    lessonPacks.forEach((p) => {
      if (Number(p.price || 0) === 0) free++;
      else paid++;
    });
    return { all: lessonPacks.length, free, paid };
  }, [lessonPacks]);

  // 2. Filter & Sort Logic
  const filteredPacks = useMemo(() => {
    const searchTerm = search.toLowerCase().trim();

    const filtered = lessonPacks.filter((pack) => {
      const price = Number(pack.price || 0);
      if (priceFilter === "free" && price > 0) return false;
      if (priceFilter === "paid" && price === 0) return false;

      if (!searchTerm) return true;
      return (
        pack.title.toLowerCase().includes(searchTerm) ||
        (pack.description &&
          pack.description.toLowerCase().includes(searchTerm))
      );
    });

    if (sortBy === "price_asc") {
      return [...filtered].sort(
        (a, b) => Number(a.price || 0) - Number(b.price || 0)
      );
    }
    if (sortBy === "price_desc") {
      return [...filtered].sort(
        (a, b) => Number(b.price || 0) - Number(a.price || 0)
      );
    }
    if (sortBy === "videos_desc") {
      return [...filtered].sort(
        (a, b) => (b.videos?.length || 0) - (a.videos?.length || 0)
      );
    }

    return filtered;
  }, [lessonPacks, search, priceFilter, sortBy]);

  const hasActiveFilters =
    search.trim() !== "" || priceFilter !== "all" || sortBy !== "default";

  const resetFilters = () => {
    setSearch("");
    setPriceFilter("all");
    setSortBy("default");
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
            <span>Self-Paced A/L Accounting Bundles</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="text-3xl sm:text-5xl md:text-6xl font-black mb-5 tracking-tight font-sans leading-[1.1]"
          >
            Master Topics with{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-jasmine to-brand-coral">
              Lesson Packs
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.16 }}
            className="text-sm sm:text-lg text-white/75 max-w-2xl mx-auto mb-9 leading-relaxed font-sans"
          >
            Unlock curated video playlists, downloadable PDF tutes, and unit-focused revision collections to study at your own pace, 24/7.
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
                placeholder="Search lesson packs by unit, topic, or title..."
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
        {/* Toolbar Card */}
        <section className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Segmented Price Filter Tabs */}
            <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200/70 self-start">
              {(
                [
                  { key: "all", label: "All Packs", count: counts.all },
                  { key: "free", label: "Free", count: counts.free },
                  { key: "paid", label: "Premium", count: counts.paid },
                ] as const
              ).map((tab) => {
                const active = priceFilter === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setPriceFilter(tab.key)}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${active
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

            {/* Sort Dropdown */}
            <div className="relative sm:min-w-[200px]">
              <ArrowUpDown
                size={14}
                className="text-brand-cerulean absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                aria-label="Sort lesson packs"
                className="w-full appearance-none bg-slate-50 border border-slate-200/80 text-brand-prussian py-2.5 pl-9 pr-9 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-cerulean/20 focus:border-brand-cerulean outline-none cursor-pointer text-xs font-semibold transition-all"
              >
                <option value="default">Sort: Featured</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="videos_desc">Most Videos</option>
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Results Summary & Reset Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100 text-xs">
            <div className="flex items-center gap-2 text-slate-500">
              <BookOpen size={14} className="text-brand-cerulean" />
              <span>
                Showing{" "}
                <strong className="text-brand-prussian tabular-nums">
                  {filteredPacks.length}
                </strong>{" "}
                {filteredPacks.length === 1 ? "lesson pack" : "lesson packs"}
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

        {/* LESSON PACKS GRID */}
        {loading ? (
          <LessonPacksSkeleton />
        ) : filteredPacks.length === 0 ? (
          <div className="text-center py-20 px-6 bg-white rounded-3xl shadow-sm border border-dashed border-slate-200 max-w-xl mx-auto">
            <div className="w-16 h-16 bg-brand-aliceBlue/70 text-brand-cerulean rounded-2xl flex items-center justify-center mx-auto mb-5">
              <ListVideo className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-brand-prussian mb-1.5">
              No lesson packs found
            </h3>
            <p className="text-slate-500 mb-6 text-sm max-w-sm mx-auto leading-relaxed">
              We couldn't find any lesson packs matching your current search or filter criteria.
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
            key={`${search}-${priceFilter}-${sortBy}`}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8"
          >
            {filteredPacks.map((pack: any) => {
              const coverSrc = getSmartCoverUrl(pack);
              const videoCount = pack.videos?.length || 0;
              const totalMinutes = (pack.videos || []).reduce(
                (sum: number, v: any) => sum + (Number(v.durationMinutes) || 0),
                0
              );
              const attachmentCount = Array.isArray(pack.attachments)
                ? pack.attachments.length
                : 0;
              const price = Number(pack.price || 0);

              return (
                <motion.article
                  key={pack._id}
                  variants={cardVariants}
                  className="group bg-white rounded-3xl border border-slate-200/80 hover:border-brand-cerulean/40 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col h-full"
                >
                  <Link
                    to={`/lesson-packs/${pack._id}`}
                    className="flex flex-col h-full focus:outline-none"
                  >
                    {/* Cover Image */}
                    <div className="relative h-52 overflow-hidden bg-slate-100 shrink-0">
                      <PackCover src={coverSrc} alt={pack.title} />
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-brand-prussian/85 via-brand-prussian/15 to-transparent" />

                      {/* Top Badges */}
                      <div className="absolute top-3.5 left-3.5 right-3.5 flex flex-wrap items-center gap-1.5">
                        <span className="inline-flex items-center gap-1.5 bg-brand-prussian/85 backdrop-blur-md text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider border border-white/15 shadow-sm tabular-nums">
                          <PlayCircle size={12} className="text-brand-jasmine" />
                          {videoCount} {videoCount === 1 ? "Video" : "Videos"}
                        </span>

                        {totalMinutes > 0 && (
                          <span className="inline-flex items-center gap-1 bg-white/90 backdrop-blur-md text-brand-prussian text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm tabular-nums">
                            <Clock size={11} className="text-brand-cerulean" />
                            {totalMinutes} mins
                          </span>
                        )}
                      </div>

                      {/* Bottom Price Tag */}
                      <div className="absolute bottom-3.5 right-3.5">
                        {price === 0 ? (
                          <div className="bg-emerald-600 text-white px-3.5 py-1.5 rounded-xl font-extrabold shadow-md text-xs uppercase tracking-wider">
                            Free Access
                          </div>
                        ) : (
                          <div className="bg-white/95 backdrop-blur-md text-brand-prussian px-3.5 py-1.5 rounded-xl font-extrabold shadow-md text-xs sm:text-sm font-mono tabular-nums border border-white">
                            LKR {price.toLocaleString()}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="p-6 flex-1 flex flex-col">
                      <h3 className="text-lg sm:text-xl font-bold text-brand-prussian mb-2 group-hover:text-brand-cerulean transition-colors line-clamp-2 font-sinhala leading-snug">
                        {pack.title}
                      </h3>

                      <p className="text-slate-500 text-sm line-clamp-3 mb-5 font-sans leading-relaxed flex-1">
                        {pack.description ||
                          "Focused video lessons and downloadable study materials to master this accounting unit."}
                      </p>

                      {/* Metadata Strip */}
                      <div className="flex items-center gap-3 text-xs text-slate-500 bg-slate-50/90 px-3.5 py-2.5 rounded-xl border border-slate-200/60 mb-5 mt-auto">
                        <span className="inline-flex items-center gap-1.5 font-semibold text-brand-prussian tabular-nums">
                          <PlayCircle className="w-3.5 h-3.5 text-brand-cerulean shrink-0" />
                          {videoCount} {videoCount === 1 ? "Lesson" : "Lessons"}
                        </span>

                        {attachmentCount > 0 && (
                          <>
                            <span className="text-slate-300">•</span>
                            <span className="inline-flex items-center gap-1 font-medium text-slate-600 tabular-nums">
                              <Paperclip className="w-3.5 h-3.5 text-brand-coral shrink-0" />
                              {attachmentCount}{" "}
                              {attachmentCount === 1 ? "Tute/PDF" : "Tutes/PDFs"}
                            </span>
                          </>
                        )}
                      </div>

                      {/* CTA Button */}
                      <div className="w-full bg-brand-prussian group-hover:bg-brand-cerulean text-white font-semibold text-xs sm:text-sm py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm">
                        <span>View Lesson Pack</span>
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