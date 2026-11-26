import { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  PlayCircle,
  Lock,
  ListVideo,
  CheckCircle2,
  CheckCheck,
  Sparkles,
  X,
  Play,
  Video,
  Unlock,
} from "lucide-react";
import LessonPackService, {
  type LessonPackData,
} from "../../../services/LessonPackService";
import VideoProgressService from "../../../services/VideoProgressService";
import { useAuth } from "../../../contexts/AuthContext";

const getSmartCoverUrl = (pack: any) => {
  if (pack.coverImage) {
    return `${import.meta.env.VITE_API_BASE_URL}${pack.coverImage}`;
  }
  if (pack.videos && pack.videos.length > 0 && pack.videos[0].youtubeId) {
    return `https://img.youtube.com/vi/${pack.videos[0].youtubeId}/maxresdefault.jpg`;
  }
  return null;
};

type PackFilter = "all" | "unlocked" | "locked";

export default function StudentLessonPacks() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [packs, setPacks] = useState<LessonPackData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<PackFilter>("all");
  const [watchProgress, setWatchProgress] = useState<
    Record<string, { status: "started" | "completed" }>
  >({});

  // 1. Sync Watch Progress
  useEffect(() => {
    if (!user?._id) return;

    const updateProgressState = async () => {
      try {
        const data = await VideoProgressService.getMyProgress();
        setWatchProgress(data || {});
      } catch (err) {
        console.error("Failed to load watch progress", err);
      }
    };

    updateProgressState();
    window.addEventListener("progressUpdate", updateProgressState);
    window.addEventListener("focus", updateProgressState);

    return () => {
      window.removeEventListener("progressUpdate", updateProgressState);
      window.removeEventListener("focus", updateProgressState);
    };
  }, [user?._id]);

  // 2. Fetch Batch Lesson Packs
  useEffect(() => {
    let isMounted = true;
    const fetchPacks = async () => {
      try {
        const data = await LessonPackService.getAll();
        const userBatchId =
          user?.role === "student" && user.batch ? user.batch : null;
        const batchPacks = userBatchId
          ? data.filter((pack) => pack.batch === userBatchId)
          : [];
        const enrichedPacks = batchPacks.map((pack) => ({
          ...pack,
          hasAccess: pack.hasAccess || pack.price === 0,
        }));
        if (isMounted) setPacks(enrichedPacks);
      } catch (error) {
        console.error("Failed to load lesson packs", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchPacks();
    return () => {
      isMounted = false;
    };
  }, [user]);

  // 3. Progress Calculator Helper
  const getPackProgress = useCallback(
    (pack: LessonPackData) => {
      const total = pack.videos?.length || 0;
      if (total === 0) {
        return {
          status: "none" as const,
          completedCount: 0,
          total: 0,
          percent: 0,
        };
      }

      let completedCount = 0;
      let startedCount = 0;

      pack.videos.forEach((v) => {
        const st = watchProgress[v._id || v.youtubeId || ""]?.status;
        if (st === "completed") completedCount++;
        if (st === "started") startedCount++;
      });

      const percent = Math.round((completedCount / total) * 100);
      const status =
        completedCount === total
          ? ("completed" as const)
          : completedCount > 0 || startedCount > 0
            ? ("started" as const)
            : ("none" as const);

      return { status, completedCount, total, percent };
    },
    [watchProgress]
  );

  // 4. Stats & Filter Counts
  const stats = useMemo(() => {
    const unlocked = packs.filter((p) => p.hasAccess).length;
    const locked = packs.length - unlocked;
    const completed = packs.filter(
      (p) => p.hasAccess && getPackProgress(p).status === "completed"
    ).length;
    return { all: packs.length, unlocked, locked, completed };
  }, [packs, getPackProgress]);

  const filteredPacks = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return packs.filter((p) => {
      if (filter === "unlocked" && !p.hasAccess) return false;
      if (filter === "locked" && p.hasAccess) return false;

      if (q) {
        return (
          p.title.toLowerCase().includes(q) ||
          (p.description || "").toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [packs, searchTerm, filter]);

  return (
    <div className="space-y-6 pb-24 sm:pb-10">
      {/* --- HERO BANNER --- */}
      <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-brand-prussian via-[#0d3a4b] to-brand-cerulean p-6 sm:p-8 text-white shadow-xl shadow-brand-prussian/15">
        <div className="pointer-events-none absolute -top-20 -right-16 w-72 h-72 rounded-full bg-brand-jasmine/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-1/3 w-64 h-64 rounded-full bg-white/10 blur-3xl" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-semibold text-brand-jasmine mb-3">
              <Sparkles size={13} />
              <span>Revision Archives</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Premium Lesson Packs
            </h1>
            <p className="text-white/75 text-sm sm:text-base mt-1 max-w-xl">
              Unlock curated video bundles, revision marathons, and past-paper
              walkthroughs tailored for your batch.
            </p>
          </div>

          {/* Glass Summary Pills */}
          <div className="flex items-center gap-3 self-start lg:self-auto shrink-0">
            <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl px-4 py-3 text-center min-w-[92px]">
              <p className="text-[10px] font-bold uppercase tracking-wider text-white/65">
                Unlocked
              </p>
              <p className="text-xl font-black text-brand-jasmine mt-0.5">
                {stats.unlocked}
                <span className="text-xs font-semibold text-white/50">
                  /{stats.all}
                </span>
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl px-4 py-3 text-center min-w-[92px]">
              <p className="text-[10px] font-bold uppercase tracking-wider text-white/65">
                Completed
              </p>
              <p className="text-xl font-black text-emerald-300 mt-0.5">
                {stats.completed}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* --- FILTER & SEARCH TOOLBAR --- */}
      <div className="bg-white rounded-2xl p-3 sm:p-4 border border-gray-100 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 bg-gray-100/80 p-1 rounded-xl overflow-x-auto scrollbar-hide">
          {(
            [
              { key: "all", label: "All Packs", count: stats.all },
              { key: "unlocked", label: "Unlocked", count: stats.unlocked },
              { key: "locked", label: "Locked", count: stats.locked },
            ] as const
          ).map((tab) => {
            const active = filter === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-bold rounded-lg whitespace-nowrap transition-all ${active
                    ? "bg-white text-brand-prussian shadow-sm ring-1 ring-black/5"
                    : "text-gray-500 hover:text-gray-800"
                  }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[11px] px-1.5 py-0.5 rounded-md ${active
                      ? "bg-brand-cerulean/10 text-brand-cerulean"
                      : "bg-gray-200/70 text-gray-500"
                    }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
          <input
            type="text"
            placeholder="Search playlists..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-9 py-2.5 text-sm bg-gray-50 border border-gray-200/80 rounded-xl focus:outline-none focus:bg-white focus:border-brand-cerulean focus:ring-2 focus:ring-brand-cerulean/15 transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={15} />
            </button>
          )}
        </div>
      </div>

      {/* --- CONTENT GRID --- */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm animate-pulse"
            >
              <div className="aspect-video bg-gray-200" />
              <div className="p-6 space-y-3">
                <div className="h-5 bg-gray-200 rounded-lg w-3/4" />
                <div className="h-4 bg-gray-100 rounded-lg w-full" />
                <div className="h-10 bg-gray-100 rounded-xl mt-4" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredPacks.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 sm:p-16 text-center border border-dashed border-gray-200 flex flex-col items-center shadow-sm">
          <div className="w-16 h-16 bg-brand-aliceBlue text-brand-cerulean rounded-2xl flex items-center justify-center mb-4">
            <ListVideo size={30} />
          </div>
          <h3 className="text-lg sm:text-xl font-extrabold text-brand-prussian mb-1">
            {searchTerm || filter !== "all"
              ? "No Matching Playlists Found"
              : "No Lesson Packs Yet"}
          </h3>
          <p className="text-sm text-gray-400 max-w-sm">
            {searchTerm || filter !== "all"
              ? "Try adjusting your search or filter selection."
              : "Check back later for new revision bundles and premium content."}
          </p>
          {(searchTerm || filter !== "all") && (
            <button
              onClick={() => {
                setSearchTerm("");
                setFilter("all");
              }}
              className="mt-5 px-5 py-2.5 rounded-xl bg-gray-100 text-gray-700 text-xs font-bold hover:bg-gray-200 transition-colors"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredPacks.map((pack) => {
              const coverUrl = getSmartCoverUrl(pack);
              const progress = getPackProgress(pack);
              const isFree = pack.price === 0;

              return (
                <motion.article
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.28 }}
                  key={pack._id}
                  className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-xl hover:shadow-brand-prussian/8 hover:border-brand-cerulean/30 hover:-translate-y-1 transition-all duration-300 flex flex-col group"
                >
                  {/* Thumbnail Section */}
                  <div
                    onClick={() => navigate(`/student/lesson-packs/${pack._id}`)}
                    className="aspect-video relative bg-brand-prussian overflow-hidden cursor-pointer"
                  >
                    {coverUrl ? (
                      <img
                        src={coverUrl}
                        alt={pack.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-brand-cerulean to-brand-prussian flex items-center justify-center">
                        <ListVideo size={38} className="text-white/25" />
                      </div>
                    )}

                    {/* Subtle Gradient Scrim */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-black/20" />

                    {/* Center Hover Action Icon */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <div
                        className={`w-13 h-13 p-3.5 rounded-full shadow-xl flex items-center justify-center transform scale-90 group-hover:scale-100 transition-transform ${pack.hasAccess
                            ? "bg-white/95 text-brand-cerulean"
                            : "bg-black/65 text-brand-jasmine backdrop-blur-md border border-white/20"
                          }`}
                      >
                        {pack.hasAccess ? (
                          <Play size={20} fill="currentColor" className="ml-0.5" />
                        ) : (
                          <Lock size={20} />
                        )}
                      </div>
                    </div>

                    {/* Top Left Access Badge */}
                    <div className="absolute top-3 left-3">
                      {isFree ? (
                        <span className="inline-flex items-center gap-1 bg-emerald-500/90 backdrop-blur-md text-white px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm border border-emerald-400/30">
                          <Unlock size={11} />
                          Free Access
                        </span>
                      ) : pack.hasAccess ? (
                        <span className="inline-flex items-center gap-1 bg-emerald-500/90 backdrop-blur-md text-white px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm border border-emerald-400/30">
                          <CheckCircle2 size={11} />
                          Purchased
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-black/60 backdrop-blur-md text-brand-jasmine px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm border border-white/15">
                          <Lock size={11} />
                          Premium
                        </span>
                      )}
                    </div>

                    {/* Bottom Right Video Count Badge */}
                    <div className="absolute bottom-3 right-3 bg-black/65 backdrop-blur-md text-white px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1.5 border border-white/10">
                      <Video size={12} className="text-brand-jasmine" />
                      <span>
                        {progress.total}{" "}
                        {progress.total === 1 ? "Video" : "Videos"}
                      </span>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-5 sm:p-6 flex-1 flex flex-col">
                    <h3
                      onClick={() =>
                        navigate(`/student/lesson-packs/${pack._id}`)
                      }
                      className="font-extrabold text-base sm:text-lg text-brand-prussian line-clamp-2 leading-snug mb-2 group-hover:text-brand-cerulean transition-colors cursor-pointer"
                    >
                      {pack.title}
                    </h3>

                    <p className="text-xs sm:text-sm text-gray-500 line-clamp-2 leading-relaxed mb-4 flex-1">
                      {pack.description ||
                        "Comprehensive video lesson bundle and revision archive."}
                    </p>

                    {/* Progress Bar (Only for Unlocked Packs with Videos) */}
                    {pack.hasAccess && progress.total > 0 && (
                      <div className="mb-4 p-3 rounded-2xl bg-gray-50 border border-gray-100">
                        <div className="flex items-center justify-between text-[11px] font-bold mb-1.5">
                          <span
                            className={`inline-flex items-center gap-1 ${progress.status === "completed"
                                ? "text-emerald-600"
                                : progress.status === "started"
                                  ? "text-brand-cerulean"
                                  : "text-gray-400"
                              }`}
                          >
                            <CheckCheck size={14} />
                            {progress.status === "completed"
                              ? "All Watched"
                              : progress.status === "started"
                                ? "In Progress"
                                : "Not Started"}
                          </span>
                          <span className="text-gray-500">
                            {progress.completedCount}/{progress.total} (
                            {progress.percent}%)
                          </span>
                        </div>
                        <div className="h-1.5 w-full bg-gray-200/80 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${progress.status === "completed"
                                ? "bg-emerald-500"
                                : "bg-brand-cerulean"
                              }`}
                            style={{ width: `${progress.percent}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Price & Action Footer */}
                    <div className="flex items-center justify-between gap-3 mt-auto pt-4 border-t border-gray-100">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                          {isFree ? "Access" : "Bundle Price"}
                        </p>
                        <p
                          className={`font-black text-lg leading-tight ${isFree ? "text-emerald-600" : "text-brand-prussian"
                            }`}
                        >
                          {isFree
                            ? "FREE"
                            : `LKR ${Number(pack.price).toLocaleString()}`}
                        </p>
                      </div>

                      <button
                        onClick={() =>
                          navigate(`/student/lesson-packs/${pack._id}`)
                        }
                        className={`px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all active:scale-95 shrink-0 ${pack.hasAccess
                            ? "bg-brand-prussian text-white shadow-md shadow-brand-prussian/15 hover:bg-brand-cerulean"
                            : "bg-brand-aliceBlue text-brand-prussian hover:bg-brand-prussian hover:text-white"
                          }`}
                      >
                        {pack.hasAccess ? (
                          <>
                            <PlayCircle size={17} />
                            <span>
                              {progress.status === "started"
                                ? "Continue"
                                : progress.status === "completed"
                                  ? "Rewatch"
                                  : "Watch"}
                            </span>
                          </>
                        ) : (
                          <>
                            <Lock size={15} />
                            <span>Unlock</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}