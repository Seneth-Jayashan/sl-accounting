import { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PlayCircle,
  Video,
  Calendar,
  Lock,
  ChevronDown,
  Folder,
  FolderOpen,
  Check,
  CheckCheck,
  Circle,
  Search,
  X,
  CreditCard,
  Play,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import EnrollmentService, {
  type EnrollmentResponse,
} from "../../../../services/EnrollmentService";
import VideoProgressService, {
  type VideoProgressData,
} from "../../../../services/VideoProgressService";

// Helper to format dates safely
const formatDate = (date: string) =>
  new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

// Helper to get YYYY-MM from a date string
const getMonthString = (dateStr: string) => {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

export default function RecordingsTab({ sessions }: { sessions: any[] }) {
  const navigate = useNavigate();
  const [enrollment, setEnrollment] = useState<EnrollmentResponse | null>(null);
  const [watchProgress, setWatchProgress] = useState<VideoProgressData>({});
  const [loading, setLoading] = useState(true);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "unwatched" | "watched">("all");

  useEffect(() => {
    VideoProgressService.getRecordingProgress()
      .then((data) => setWatchProgress(data || {}))
      .catch(() => { });
  }, []);

  // 1. Fetch Enrollment to get Paid History
  useEffect(() => {
    let isMounted = true;
    const fetchEnrollment = async () => {
      try {
        const myEnrollments = await EnrollmentService.getMyEnrollments();

        if (sessions?.length > 0) {
          const sessionWithClass = sessions.find((s: any) => s.class != null);

          if (sessionWithClass) {
            const sessionClass = sessionWithClass.class;
            const classId =
              typeof sessionClass === "string" ? sessionClass : sessionClass?._id;

            if (classId) {
              const match = myEnrollments.find((e: any) => {
                const enrollClassId =
                  typeof e.class === "string" ? e.class : e.class?._id;
                return enrollClassId === classId;
              });

              if (isMounted) setEnrollment(match || null);
            }
          } else {
            if (isMounted) setEnrollment(null);
          }
        }
      } catch (err) {
        console.error("Failed to load enrollment rights", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    if (sessions.length > 0) fetchEnrollment();
    else setLoading(false);

    return () => {
      isMounted = false;
    };
  }, [sessions]);

  // 2. Filter & Sort Recordings
  const recordings = useMemo(() => {
    return (sessions || [])
      .filter((s) => s.youtubeVideoId || s.recordingUrl)
      .sort((a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime());
  }, [sessions]);

  // Watch Stats
  const watchStats = useMemo(() => {
    const total = recordings.length;
    const watched = recordings.filter(
      (s) => watchProgress[s._id]?.status === "completed"
    ).length;
    const percent = total > 0 ? Math.round((watched / total) * 100) : 0;
    return { total, watched, percent };
  }, [recordings, watchProgress]);

  // 3. STRICT MONTHLY ACCESS LOGIC
  const getAccessStatus = (session: any) => {
    if (!enrollment) return { locked: true, reason: "Not Enrolled" };

    const sessionMonth = getMonthString(session.startAt);
    const paidMonths = enrollment.paidMonths || [];

    if (!paidMonths.includes(sessionMonth)) {
      const monthName = new Date(session.startAt).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      });
      return { locked: true, reason: `Payment required for ${monthName}` };
    }

    return { locked: false, reason: "" };
  };

  // Apply search & watch status filters
  const filteredRecordings = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return recordings.filter((session) => {
      const status = watchProgress[session._id]?.status;
      if (statusFilter === "watched" && status !== "completed") return false;
      if (statusFilter === "unwatched" && status === "completed") return false;

      if (q) {
        const title = (session.recordingTitle || session.title || "").toLowerCase();
        const category = (session.recordingCategory || "General").toLowerCase();
        return title.includes(q) || category.includes(q);
      }
      return true;
    });
  }, [recordings, searchQuery, statusFilter, watchProgress]);

  // Group by Month and Category
  const groupedRecordings = useMemo(() => {
    const grouped: {
      month: string;
      sortDate: number;
      categories: { category: string; sessions: any[] }[];
    }[] = [];

    filteredRecordings.forEach((session) => {
      const monthName = new Date(session.startAt).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      });
      const categoryName = session.recordingCategory || "General";

      let monthObj = grouped.find((g) => g.month === monthName);
      if (!monthObj) {
        monthObj = {
          month: monthName,
          sortDate: new Date(session.startAt).getTime(),
          categories: [],
        };
        grouped.push(monthObj);
      }

      let catObj = monthObj.categories.find((c) => c.category === categoryName);
      if (!catObj) {
        catObj = { category: categoryName, sessions: [] };
        monthObj.categories.push(catObj);
      }

      catObj.sessions.push(session);
    });

    grouped.sort((a, b) => b.sortDate - a.sortDate);
    grouped.forEach((g) => {
      g.categories.sort((a, b) => a.category.localeCompare(b.category));
      g.categories.forEach((c) => {
        c.sessions.sort(
          (a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime()
        );
      });
    });

    return grouped;
  }, [filteredRecordings]);

  // Auto-expand the first category on initial load
  useEffect(() => {
    if (!expandedCategory && groupedRecordings.length > 0) {
      const firstMonth = groupedRecordings[0];
      const firstCat = firstMonth.categories[0];
      if (firstCat) {
        setExpandedCategory(`${firstMonth.month}-${firstCat.category}`);
      }
    }
  }, [groupedRecordings, expandedCategory]);

  // --- LOADING SKELETON ---
  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-24 bg-white rounded-3xl border border-gray-100" />
        <div className="bg-white rounded-3xl p-6 border border-gray-100 space-y-5">
          <div className="h-12 w-64 bg-gray-100 rounded-2xl" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-2xl border border-gray-100 overflow-hidden">
                <div className="aspect-video bg-gray-200" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                  <div className="h-10 bg-gray-100 rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // --- EMPTY STATE (NO RECORDINGS AT ALL) ---
  if (recordings.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-12 sm:p-20 text-center border border-dashed border-gray-200 shadow-sm flex flex-col items-center">
        <div className="w-16 h-16 rounded-2xl bg-brand-aliceBlue text-brand-cerulean flex items-center justify-center mb-4">
          <Video size={30} />
        </div>
        <h3 className="text-lg sm:text-xl font-extrabold text-brand-prussian mb-1">
          No Recordings Available Yet
        </h3>
        <p className="text-gray-400 text-sm max-w-sm">
          Session recordings will appear here automatically once uploaded by your teacher.
        </p>
      </div>
    );
  }

  const isFiltering = Boolean(searchQuery.trim()) || statusFilter !== "all";

  return (
    <div className="space-y-6">
      {/* --- TOP TOOLBAR: PROGRESS, FILTERS & SEARCH --- */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-gray-100 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Progress Overview */}
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-brand-cerulean/10 text-brand-cerulean flex items-center justify-center shrink-0">
              <PlayCircle size={22} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-lg font-extrabold text-brand-prussian tracking-tight">
                  Recorded Lessons
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-brand-aliceBlue text-brand-cerulean text-xs font-bold">
                  {watchStats.watched} / {watchStats.total} Watched
                </span>
              </div>
              {/* Mini Progress Bar */}
              <div className="flex items-center gap-2.5 mt-1.5">
                <div className="w-36 sm:w-48 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-brand-cerulean to-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${watchStats.percent}%` }}
                  />
                </div>
                <span className="text-[11px] font-bold text-gray-400">
                  {watchStats.percent}%
                </span>
              </div>
            </div>
          </div>

          {/* Filter Pills & Search */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <div className="flex items-center bg-gray-100/90 p-1 rounded-xl">
              {(["all", "unwatched", "watched"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setStatusFilter(tab)}
                  className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${statusFilter === tab
                      ? "bg-white text-brand-prussian shadow-sm"
                      : "text-gray-500 hover:text-gray-800"
                    }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-60">
              <Search
                size={15}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search recordings..."
                className="w-full pl-9 pr-8 py-2 text-sm bg-gray-50 border border-gray-200/80 rounded-xl focus:outline-none focus:bg-white focus:border-brand-cerulean focus:ring-2 focus:ring-brand-cerulean/15 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  aria-label="Clear search"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* --- NO FILTER MATCHES --- */}
      {groupedRecordings.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-gray-200">
          <p className="text-base font-bold text-brand-prussian mb-1">
            No matching recordings found
          </p>
          <p className="text-sm text-gray-400 mb-5">
            Try adjusting your search or filter selection.
          </p>
          <button
            onClick={() => {
              setSearchQuery("");
              setStatusFilter("all");
            }}
            className="px-5 py-2 rounded-xl bg-gray-100 text-gray-700 text-xs font-bold hover:bg-gray-200 transition-colors"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        /* --- MONTH GROUPS --- */
        <div className="space-y-8">
          {groupedRecordings.map((monthGroup, mIndex) => {
            const monthTotal = monthGroup.categories.reduce(
              (acc, c) => acc + c.sessions.length,
              0
            );

            return (
              <motion.section
                key={monthGroup.month}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: mIndex * 0.06, duration: 0.35 }}
                className="space-y-4"
              >
                {/* Month Divider Header */}
                <div className="flex items-center gap-3 px-1">
                  <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-prussian text-white text-xs sm:text-sm font-extrabold tracking-tight shadow-sm">
                    <Calendar size={14} className="text-brand-jasmine" />
                    {monthGroup.month}
                  </span>
                  <span className="text-xs font-semibold text-gray-400">
                    {monthTotal} {monthTotal === 1 ? "video" : "videos"}
                  </span>
                  <div className="flex-1 h-px bg-gradient-to-r from-gray-200 to-transparent" />
                </div>

                {/* Category Accordions */}
                <div className="space-y-4">
                  {monthGroup.categories.map((catGroup) => {
                    const categoryId = `${monthGroup.month}-${catGroup.category}`;
                    const isExpanded = isFiltering || expandedCategory === categoryId;
                    const watchedInCat = catGroup.sessions.filter(
                      (s) => watchProgress[s._id]?.status === "completed"
                    ).length;

                    return (
                      <div
                        key={catGroup.category}
                        className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden transition-shadow hover:shadow-md"
                      >
                        {/* Category Header Button */}
                        <button
                          onClick={() =>
                            setExpandedCategory(
                              expandedCategory === categoryId ? null : categoryId
                            )
                          }
                          className={`w-full flex items-center justify-between p-4 sm:p-5 transition-colors ${isExpanded
                              ? "bg-brand-aliceBlue/35"
                              : "hover:bg-gray-50/80"
                            }`}
                        >
                          <div className="flex items-center gap-3.5 min-w-0">
                            <div
                              className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${isExpanded
                                  ? "bg-brand-cerulean text-white shadow-sm"
                                  : "bg-brand-cerulean/10 text-brand-cerulean"
                                }`}
                            >
                              {isExpanded ? (
                                <FolderOpen size={21} />
                              ) : (
                                <Folder size={21} />
                              )}
                            </div>
                            <div className="text-left min-w-0">
                              <h3 className="text-base sm:text-lg font-extrabold text-brand-prussian truncate">
                                {catGroup.category}
                              </h3>
                              <div className="flex items-center gap-2 text-xs text-gray-500 font-medium mt-0.5">
                                <span>
                                  {catGroup.sessions.length}{" "}
                                  {catGroup.sessions.length === 1
                                    ? "Recording"
                                    : "Recordings"}
                                </span>
                                <span className="text-gray-300">•</span>
                                <span className="text-brand-cerulean font-semibold">
                                  {watchedInCat}/{catGroup.sessions.length} completed
                                </span>
                              </div>
                            </div>
                          </div>

                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300 ${isExpanded
                                ? "bg-brand-prussian text-white rotate-180"
                                : "bg-gray-100 text-gray-500"
                              }`}
                          >
                            <ChevronDown size={18} />
                          </div>
                        </button>

                        {/* Grid of Recordings */}
                        <AnimatePresence initial={false}>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.28, ease: "easeInOut" }}
                              className="overflow-hidden"
                            >
                              <div className="p-4 sm:p-6 border-t border-gray-100 bg-gray-50/40">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                  {catGroup.sessions.map((session) => {
                                    const { locked, reason } = getAccessStatus(session);
                                    const status = watchProgress[session._id]?.status;

                                    const youtubeThumbnail = session.youtubeVideoId
                                      ? `https://img.youtube.com/vi/${session.youtubeVideoId}/hqdefault.jpg`
                                      : null;
                                    const classBanner =
                                      typeof session.class === "object" &&
                                        session.class !== null
                                        ? session.class.bannerUrl ||
                                        session.class.imageUrl
                                        : null;
                                    const thumbnail = youtubeThumbnail || classBanner;
                                    const targetClassId =
                                      typeof session.class === "string"
                                        ? session.class
                                        : session.class?._id;

                                    return (
                                      <article
                                        key={session._id}
                                        className={`group flex flex-col rounded-2xl border overflow-hidden transition-all duration-300 ${locked
                                            ? "bg-white/70 border-gray-200/80"
                                            : "bg-white border-gray-100 shadow-sm hover:border-brand-cerulean/35 hover:shadow-xl hover:shadow-brand-prussian/8 hover:-translate-y-1"
                                          }`}
                                      >
                                        {/* Thumbnail */}
                                        <div
                                          onClick={() => {
                                            if (!locked) {
                                              navigate(
                                                `/student/class/recording/${session._id}`
                                              );
                                            }
                                          }}
                                          className={`relative aspect-video w-full bg-brand-prussian overflow-hidden flex items-center justify-center ${!locked ? "cursor-pointer" : ""
                                            }`}
                                        >
                                          {thumbnail ? (
                                            <img
                                              src={thumbnail}
                                              alt={
                                                session.recordingTitle || "Recording"
                                              }
                                              className={`w-full h-full object-cover transition-transform duration-500 ${!locked
                                                  ? "group-hover:scale-105"
                                                  : "grayscale-[40%] opacity-75"
                                                }`}
                                            />
                                          ) : (
                                            <Video
                                              size={42}
                                              className="text-white/25"
                                            />
                                          )}

                                          {/* Subtle bottom scrim */}
                                          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20" />

                                          {/* Center Play / Lock Overlay */}
                                          {locked ? (
                                            <div className="absolute inset-0 bg-gray-950/55 backdrop-blur-[2px] flex items-center justify-center">
                                              <div className="w-14 h-14 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center shadow-lg">
                                                <Lock size={24} className="text-white" />
                                              </div>
                                            </div>
                                          ) : (
                                            <div className="absolute inset-0 flex items-center justify-center">
                                              <div className="w-13 h-13 p-3.5 rounded-full bg-white/95 text-brand-cerulean shadow-xl transform scale-90 opacity-90 group-hover:scale-105 group-hover:opacity-100 group-hover:bg-brand-cerulean group-hover:text-white transition-all duration-200 flex items-center justify-center">
                                                <Play
                                                  size={20}
                                                  fill="currentColor"
                                                  className="ml-0.5"
                                                />
                                              </div>
                                            </div>
                                          )}

                                          {/* Top Left Category Pill */}
                                          <span className="absolute top-3 left-3 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border border-white/10">
                                            {catGroup.category}
                                          </span>

                                          {/* Top Right Watch Status Pill */}
                                          {!locked && (
                                            <>
                                              {status === "completed" ? (
                                                <span className="absolute top-3 right-3 bg-emerald-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
                                                  <CheckCheck size={12} />
                                                  Watched
                                                </span>
                                              ) : status === "started" ? (
                                                <span className="absolute top-3 right-3 bg-sky-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
                                                  <Check size={12} />
                                                  In Progress
                                                </span>
                                              ) : (
                                                <span className="absolute top-3 right-3 bg-black/60 backdrop-blur-md text-white/90 text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 border border-white/10">
                                                  <Circle size={10} />
                                                  Unwatched
                                                </span>
                                              )}
                                            </>
                                          )}
                                        </div>

                                        {/* Card Body */}
                                        <div className="p-4 sm:p-5 flex flex-col flex-1">
                                          <div className="flex-1 mb-4">
                                            <h4
                                              className={`text-sm sm:text-base font-extrabold line-clamp-2 leading-snug transition-colors ${locked
                                                  ? "text-gray-400"
                                                  : "text-brand-prussian group-hover:text-brand-cerulean"
                                                }`}
                                            >
                                              {session.recordingTitle ||
                                                session.title ||
                                                `Session ${session.index}`}
                                            </h4>
                                            <p className="flex items-center gap-1.5 text-xs font-medium text-gray-400 mt-1.5">
                                              <Calendar size={12} />
                                              <span>{formatDate(session.startAt)}</span>
                                            </p>
                                          </div>

                                          {locked ? (
                                            <div className="space-y-2 mt-auto">
                                              <p className="text-[11px] font-semibold text-red-500/90 text-center bg-red-50 border border-red-100 rounded-xl py-1.5 px-2.5 truncate">
                                                {reason}
                                              </p>
                                              <button
                                                onClick={() =>
                                                  targetClassId &&
                                                  navigate(
                                                    `/student/payment/create/${targetClassId}`
                                                  )
                                                }
                                                className="w-full py-2.5 rounded-xl bg-brand-prussian text-white text-xs font-bold hover:bg-brand-cerulean transition-colors flex items-center justify-center gap-1.5 active:scale-[0.98]"
                                              >
                                                <CreditCard size={14} />
                                                <span>Pay to Unlock</span>
                                              </button>
                                            </div>
                                          ) : (
                                            <button
                                              onClick={() =>
                                                navigate(
                                                  `/student/class/recording/${session._id}`
                                                )
                                              }
                                              className="w-full mt-auto py-2.5 px-4 rounded-xl bg-brand-aliceBlue/70 text-brand-prussian font-bold text-xs sm:text-sm hover:bg-brand-prussian hover:text-white transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                                            >
                                              <PlayCircle size={16} />
                                              <span>
                                                {status === "started"
                                                  ? "Resume Watching"
                                                  : status === "completed"
                                                    ? "Watch Again"
                                                    : "Watch Recording"}
                                              </span>
                                            </button>
                                          )}
                                        </div>
                                      </article>
                                    );
                                  })}
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              </motion.section>
            );
          })}
        </div>
      )}
    </div>
  );
}