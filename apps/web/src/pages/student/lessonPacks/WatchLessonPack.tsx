import { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Loader2,
  Lock,
  ListVideo,
  CheckCheck,
  Check,
  Clock,
  FileText,
  Download,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Sparkles,
  AlertCircle,
  Play,
} from "lucide-react";
import LessonPackService, {
  type LessonPackData,
  type PlaylistItem,
} from "../../../services/LessonPackService";
import VideoProgressService from "../../../services/VideoProgressService";
import { useAuth } from "../../../contexts/AuthContext";

// @ts-ignore
import Plyr from "plyr";
import "plyr/dist/plyr.css";

export default function WatchLessonPack() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [pack, setPack] = useState<LessonPackData | null>(null);
  const [activeVideo, setActiveVideo] = useState<PlaylistItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [watchProgress, setWatchProgress] = useState<
    Record<string, { status: "started" | "completed" }>
  >({});

  const watchProgressRef = useRef(watchProgress);
  useEffect(() => {
    watchProgressRef.current = watchProgress;
  }, [watchProgress]);

  const activeVideoRef = useRef(activeVideo);
  useEffect(() => {
    activeVideoRef.current = activeVideo;
  }, [activeVideo]);

  const playerRef = useRef<HTMLDivElement>(null);
  const playerInstance = useRef<any>(null);

  // 1. Fetch Playlist Data
  useEffect(() => {
    let isMounted = true;
    const fetchPack = async () => {
      if (!id) return;
      try {
        const data = await LessonPackService.getById(id);
        if (!isMounted) return;
        setPack(data);
        if (data.videos && data.videos.length > 0) {
          const sorted = [...data.videos].sort(
            (a, b) => (a.order || 0) - (b.order || 0)
          );
          setActiveVideo(sorted[0]);
        }
      } catch (err: any) {
        if (isMounted) setError(err.message || "Failed to load playlist.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchPack();
    return () => {
      isMounted = false;
    };
  }, [id]);

  // 2. Security: Prevent Copy/Paste & DevTools shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if ((e.ctrlKey || e.metaKey) && ["c", "x", "v", "s", "p"].includes(key)) {
        e.preventDefault();
      }
      if (
        (e.ctrlKey || e.metaKey) &&
        e.shiftKey &&
        ["c", "i", "j"].includes(key)
      ) {
        e.preventDefault();
      }
      if (e.key === "F12") e.preventDefault();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // 3. Sync Watch Progress
  useEffect(() => {
    if (!user?._id) return;

    const updateProgressState = async () => {
      try {
        const p = await VideoProgressService.getMyProgress();
        setWatchProgress(p || {});
      } catch (err) {
        console.error("Failed to fetch progress", err);
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

  // 4. Initialize/Update Plyr
  useEffect(() => {
    let player: any = null;

    const initPlayer = () => {
      if (pack?.hasAccess && activeVideo?.youtubeId && playerRef.current) {
        if (playerInstance.current) {
          playerInstance.current.destroy();
        }

        player = new Plyr(playerRef.current, {
          controls: [
            "play-large",
            "play",
            "progress",
            "current-time",
            "mute",
            "volume",
            "settings",
            "fullscreen",
          ],
          settings: ["speed"],
          speed: { selected: 1, options: [0.5, 0.75, 1, 1.25, 1.5, 2] },
          youtube: {
            noCookie: true,
            rel: 0,
            showinfo: 0,
            iv_load_policy: 3,
            modestbranding: 1,
            controls: 1,
            disablekb: 0,
            fs: 1,
          },
        } as any);

        playerInstance.current = player;

        let startedFired = false;
        let completedFired = false;

        player.on("timeupdate", () => {
          const vidId =
            activeVideoRef.current?._id || activeVideoRef.current?.youtubeId;
          if (!vidId) return;
          const currentTime = player.currentTime;
          const duration = player.duration;

          if (duration > 0) {
            const ratio = currentTime / duration;

            if (ratio > 0.9 && !completedFired) {
              const currentStatus = watchProgressRef.current[vidId]?.status;
              if (currentStatus !== "completed") {
                VideoProgressService.updateProgress(vidId, "completed").catch(
                  () => { }
                );
                window.dispatchEvent(new Event("progressUpdate"));
              }
              completedFired = true;
            } else if (currentTime > 1 && !startedFired) {
              const currentStatus = watchProgressRef.current[vidId]?.status;
              if (!currentStatus) {
                VideoProgressService.updateProgress(vidId, "started").catch(
                  () => { }
                );
                window.dispatchEvent(new Event("progressUpdate"));
              }
              startedFired = true;
            }
          }
        });

        // Re-attach the Shield
        player.on("ready", () => {
          const container = player.elements.container;
          if (!container || container.querySelector(".secure-shield-layer")) {
            return;
          }

          const shield = document.createElement("div");
          shield.className = "secure-shield-layer";
          Object.assign(shield.style, {
            position: "absolute",
            top: "0",
            left: "0",
            width: "100%",
            height: "100%",
            zIndex: "50",
            background: "transparent",
            cursor: "pointer",
            userSelect: "none",
            WebkitUserSelect: "none",
          });

          shield.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            player.togglePlay();
          });
          shield.addEventListener("contextmenu", (e) => {
            e.preventDefault();
            e.stopPropagation();
          });
          shield.addEventListener("dragstart", (e) => e.preventDefault());

          container.appendChild(shield);
        });
      }
    };

    const timeoutId = setTimeout(initPlayer, 50);

    return () => {
      clearTimeout(timeoutId);
      if (player) {
        player.destroy();
        playerInstance.current = null;
      }
    };
  }, [activeVideo?._id, activeVideo?.youtubeId, pack?.hasAccess]);

  // Derived Sorted Videos & Stats
  const sortedVideos = useMemo(() => {
    if (!pack?.videos) return [];
    return [...pack.videos].sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [pack?.videos]);

  const activeIndex = useMemo(() => {
    if (!activeVideo) return -1;
    return sortedVideos.findIndex(
      (v) => (v._id || v.youtubeId) === (activeVideo._id || activeVideo.youtubeId)
    );
  }, [sortedVideos, activeVideo]);

  const progressStats = useMemo(() => {
    const total = sortedVideos.length;
    const completed = sortedVideos.filter(
      (v) => watchProgress[v._id || v.youtubeId || ""]?.status === "completed"
    ).length;
    const totalMinutes = sortedVideos.reduce(
      (sum, v) => sum + (Number(v.durationMinutes) || 0),
      0
    );
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, percent, totalMinutes };
  }, [sortedVideos, watchProgress]);

  const watermarkText = user
    ? `${user.firstName} ${user.lastName} • PROTECTED CONTENT • DO NOT SHARE`
    : "PROTECTED CONTENT • DO NOT SHARE";

  // --- LOADING STATE ---
  if (loading) {
    return (
      <div className="h-screen bg-[#f8fafc] flex flex-col items-center justify-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-brand-cerulean/10 border border-brand-cerulean/20 flex items-center justify-center">
          <Loader2 className="w-7 h-7 text-brand-cerulean animate-spin" />
        </div>
        <div className="text-center">
          <p className="text-sm font-extrabold text-brand-prussian">
            Loading Lesson Pack
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            Preparing videos & study materials...
          </p>
        </div>
      </div>
    );
  }

  // --- ERROR STATE ---
  if (error || !pack) {
    return (
      <div className="h-screen bg-[#f8fafc] flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-lg max-w-sm w-full text-center">
          <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={26} />
          </div>
          <h2 className="text-lg font-extrabold text-brand-prussian mb-1">
            Unable to Load Playlist
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            {error || "This lesson pack could not be found."}
          </p>
          <button
            onClick={() => navigate(-1)}
            className="w-full py-3 rounded-xl bg-brand-prussian text-white text-sm font-bold hover:bg-brand-cerulean transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const activeVidKey = activeVideo?._id || activeVideo?.youtubeId || "";
  const activeVidStatus = watchProgress[activeVidKey]?.status;
  const attachments = Array.isArray((pack as any).attachments)
    ? (pack as any).attachments
    : [];

  return (
    <div
      className="min-h-screen bg-[#f8fafc] flex flex-col font-sans select-none"
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* --- STICKY TOP HEADER --- */}
      <header className="bg-white/95 backdrop-blur-md border-b border-gray-200/80 px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4 sticky top-0 z-40 shadow-2xs">
        <div className="flex items-center gap-3.5 min-w-0">
          <button
            onClick={() => navigate(-1)}
            aria-label="Go Back"
            className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-brand-aliceBlue text-gray-600 hover:text-brand-cerulean flex items-center justify-center transition-colors shrink-0"
          >
            <ArrowLeft size={18} />
          </button>

          <div className="min-w-0">
            <h1 className="text-sm sm:text-base lg:text-lg font-extrabold text-brand-prussian truncate">
              {pack.title}
            </h1>
            <div className="flex items-center gap-2 text-[11px] font-semibold text-gray-400 mt-0.5">
              <span className="text-brand-cerulean font-bold">
                {progressStats.total}{" "}
                {progressStats.total === 1 ? "Lesson" : "Lessons"}
              </span>
              {progressStats.totalMinutes > 0 && (
                <>
                  <span>•</span>
                  <span className="inline-flex items-center gap-1">
                    <Clock size={11} />
                    {progressStats.totalMinutes} mins total
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right: Progress Indicator or Quick Unlock */}
        {pack.hasAccess ? (
          <div className="hidden sm:flex items-center gap-3 bg-gray-50 border border-gray-200/70 px-3.5 py-2 rounded-2xl shrink-0">
            <div className="text-right">
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                Progress
              </p>
              <p className="text-xs font-extrabold text-brand-prussian">
                {progressStats.completed}/{progressStats.total} Completed
              </p>
            </div>
            <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-brand-cerulean to-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${progressStats.percent}%` }}
              />
            </div>
          </div>
        ) : (
          <button
            onClick={() => navigate(`/student/payment/lesson-pack/${pack._id}`)}
            className="hidden sm:inline-flex items-center gap-2 bg-brand-prussian hover:bg-brand-cerulean text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 shrink-0"
          >
            <Lock size={14} className="text-brand-jasmine" />
            <span>Unlock Pack</span>
          </button>
        )}
      </header>

      {/* --- MAIN WORKSPACE --- */}
      <div className="flex-1 flex flex-col lg:flex-row max-w-[1600px] w-full mx-auto">
        {/* LEFT COLUMN: PLAYER + DETAILS + ATTACHMENTS */}
        <main className="flex-1 p-4 sm:p-6 space-y-5 min-w-0">
          {!pack.hasAccess ? (
            /* LOCKED PAYWALL STAGE */
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full min-h-[340px] sm:aspect-video bg-gradient-to-br from-brand-prussian via-[#0d3a4b] to-brand-cerulean rounded-3xl shadow-xl shadow-brand-prussian/15 flex flex-col items-center justify-center text-center px-6 py-10 relative overflow-hidden"
            >
              <div className="pointer-events-none absolute -top-20 -right-20 w-72 h-72 bg-brand-jasmine/20 rounded-full blur-3xl" />
              <div className="pointer-events-none absolute -bottom-24 left-1/4 w-64 h-64 bg-white/10 rounded-full blur-3xl" />

              <div className="relative z-10 flex flex-col items-center max-w-md">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/15 border border-white/20 rounded-3xl flex items-center justify-center mb-5 backdrop-blur-md shadow-lg">
                  <Lock size={30} className="text-brand-jasmine" />
                </div>

                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-[11px] font-bold uppercase tracking-wider text-brand-jasmine mb-3">
                  <Sparkles size={12} />
                  Premium Lesson Pack
                </span>

                <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-2">
                  Unlock Full Access
                </h2>
                <p className="text-sm sm:text-base text-white/75 mb-7 leading-relaxed">
                  Purchase this bundle to unlock all {progressStats.total}{" "}
                  HD video lessons and downloadable study materials.
                </p>

                <button
                  onClick={() =>
                    navigate(`/student/payment/lesson-pack/${pack._id}`)
                  }
                  className="w-full sm:w-auto bg-brand-jasmine hover:bg-white text-brand-prussian px-8 py-3.5 rounded-2xl font-extrabold text-sm sm:text-base transition-all shadow-lg active:scale-95"
                >
                  Unlock for LKR {Number(pack.price).toLocaleString()}
                </button>
              </div>
            </motion.div>
          ) : (
            /* UNLOCKED VIDEO PLAYER STAGE */
            <div className="w-full aspect-video bg-black rounded-3xl shadow-xl shadow-brand-prussian/10 overflow-hidden relative border border-gray-200/80 ring-1 ring-black/5">
              {activeVideo?.youtubeId ? (
                <div
                  key={`player-shell-${activeVideo._id || activeVideo.youtubeId}`}
                  className="w-full h-full relative"
                >
                  <div
                    ref={playerRef}
                    className="plyr__video-embed w-full h-full"
                  >
                    <iframe
                      src={`https://www.youtube-nocookie.com/embed/${activeVideo.youtubeId}?origin=${window.location.origin}&iv_load_policy=3&modestbranding=1&playsinline=1&showinfo=0&rel=0&enablejsapi=1&controls=0&fs=0`}
                      allowFullScreen
                      allow="autoplay"
                      title={activeVideo.title}
                    />
                  </div>

                  {/* Watermark Overlay */}
                  <div className="absolute inset-0 z-40 pointer-events-none flex flex-col justify-between py-10 opacity-20 overflow-hidden">
                    <div className="whitespace-nowrap animate-marquee-fast">
                      <span className="text-lg sm:text-xl font-black text-white uppercase tracking-[0.8rem]">
                        {watermarkText} &nbsp;&nbsp;&nbsp; {watermarkText}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <Loader2 className="animate-spin" size={28} />
                </div>
              )}
            </div>
          )}

          {/* --- ACTIVE LESSON INFO + PREV/NEXT CONTROLS --- */}
          <div className="bg-white p-5 sm:p-6 rounded-3xl shadow-sm border border-gray-100 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  {activeIndex >= 0 && (
                    <span className="px-2.5 py-0.5 rounded-full bg-brand-aliceBlue text-brand-cerulean text-[11px] font-bold">
                      Lesson {activeIndex + 1} of {sortedVideos.length}
                    </span>
                  )}

                  {activeVideo?.durationMinutes && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-600 text-[11px] font-semibold">
                      <Clock size={11} />
                      {activeVideo.durationMinutes} mins
                    </span>
                  )}

                  {pack.hasAccess && activeVidStatus === "completed" && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 text-[11px] font-bold">
                      <CheckCheck size={12} />
                      Watched
                    </span>
                  )}

                  {pack.hasAccess && activeVidStatus === "started" && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-600 border border-sky-100 text-[11px] font-bold">
                      <Check size={12} />
                      In Progress
                    </span>
                  )}
                </div>

                <h2 className="text-xl sm:text-2xl font-extrabold text-brand-prussian tracking-tight leading-snug">
                  {activeVideo?.title || pack.title}
                </h2>
              </div>

              {/* Prev / Next Lesson Buttons */}
              {pack.hasAccess && sortedVideos.length > 1 && (
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() =>
                      activeIndex > 0 &&
                      setActiveVideo(sortedVideos[activeIndex - 1])
                    }
                    disabled={activeIndex <= 0}
                    className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold transition-colors disabled:opacity-35 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft size={15} />
                    <span>Prev</span>
                  </button>
                  <button
                    onClick={() =>
                      activeIndex < sortedVideos.length - 1 &&
                      setActiveVideo(sortedVideos[activeIndex + 1])
                    }
                    disabled={activeIndex >= sortedVideos.length - 1}
                    className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl bg-brand-prussian hover:bg-brand-cerulean text-white text-xs font-bold transition-colors disabled:opacity-35 disabled:cursor-not-allowed"
                  >
                    <span>Next</span>
                    <ChevronRight size={15} />
                  </button>
                </div>
              )}
            </div>

            {pack.description && (
              <p className="text-sm text-gray-500 leading-relaxed pt-3 border-t border-gray-100">
                {pack.description}
              </p>
            )}

            {pack.hasAccess && (
              <div className="flex items-center gap-2 text-[11px] font-semibold text-gray-400 pt-1">
                <ShieldCheck size={14} className="text-emerald-500" />
                <span>
                  Secure watermarked playback • Speed controls available in
                  player settings
                </span>
              </div>
            )}
          </div>

          {/* --- STUDY MATERIALS & ATTACHMENTS --- */}
          {attachments.length > 0 && (
            <section className="bg-white p-5 sm:p-6 rounded-3xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-brand-cerulean/10 text-brand-cerulean flex items-center justify-center">
                    <FileText size={18} />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-brand-prussian leading-tight">
                      Study Materials & Attachments
                    </h3>
                    <p className="text-xs text-gray-400">
                      {attachments.length}{" "}
                      {attachments.length === 1 ? "file" : "files"} included
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {attachments.map((att: any) =>
                  pack.hasAccess ? (
                    <a
                      key={att._id || att.fileUrl}
                      href={`${import.meta.env.VITE_API_BASE_URL || ""}${att.fileUrl}`}
                      target="_blank"
                      rel="noreferrer"
                      download
                      className="group flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-gray-50/80 hover:bg-brand-aliceBlue/50 border border-gray-100 hover:border-brand-cerulean/30 transition-all"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-white text-brand-cerulean border border-gray-100 flex items-center justify-center shrink-0 shadow-2xs">
                          <FileText size={17} />
                        </div>
                        <span className="text-sm font-bold text-brand-prussian group-hover:text-brand-cerulean truncate transition-colors">
                          {att.name}
                        </span>
                      </div>
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white group-hover:bg-brand-cerulean text-brand-cerulean group-hover:text-white text-xs font-bold border border-gray-100 transition-colors shrink-0">
                        <Download size={13} />
                        <span className="hidden sm:inline">Download</span>
                      </span>
                    </a>
                  ) : (
                    <div
                      key={att._id || att.name}
                      className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-gray-50 border border-gray-100 opacity-75 cursor-not-allowed"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-gray-100 text-gray-400 flex items-center justify-center shrink-0">
                          <Lock size={15} />
                        </div>
                        <span className="text-sm font-semibold text-gray-500 truncate">
                          {att.name}
                        </span>
                      </div>
                      <span className="text-[11px] font-bold text-gray-400 bg-gray-100 px-2.5 py-1 rounded-lg shrink-0">
                        Locked
                      </span>
                    </div>
                  )
                )}
              </div>
            </section>
          )}
        </main>

        {/* --- RIGHT SIDEBAR: COURSE CONTENT PLAYLIST --- */}
        <aside className="w-full lg:w-[380px] xl:w-[410px] bg-white border-t lg:border-t-0 lg:border-l border-gray-200/80 flex flex-col lg:h-[calc(100vh-69px)] lg:sticky lg:top-[69px] shrink-0">
          {/* Sidebar Header */}
          <div className="p-4 sm:p-5 border-b border-gray-100 bg-gray-50/50 space-y-3 shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-brand-cerulean/10 text-brand-cerulean flex items-center justify-center">
                  <ListVideo size={18} />
                </div>
                <div>
                  <h3 className="font-extrabold text-brand-prussian text-sm leading-tight">
                    Course Content
                  </h3>
                  <p className="text-[11px] text-gray-400 font-medium">
                    {sortedVideos.length}{" "}
                    {sortedVideos.length === 1 ? "video" : "videos"}
                  </p>
                </div>
              </div>

              {pack.hasAccess && (
                <span className="px-2.5 py-1 rounded-full bg-brand-aliceBlue text-brand-cerulean text-[11px] font-extrabold">
                  {progressStats.percent}%
                </span>
              )}
            </div>

            {pack.hasAccess && (
              <div className="h-1.5 w-full bg-gray-200/80 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-brand-cerulean to-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${progressStats.percent}%` }}
                />
              </div>
            )}
          </div>

          {/* Playlist Items */}
          <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
            {sortedVideos.map((vid, idx) => {
              const vidKey = vid._id || vid.youtubeId || "";
              const isActive =
                (activeVideo?._id || activeVideo?.youtubeId) === vidKey;
              const status = watchProgress[vidKey]?.status;

              return (
                <button
                  key={vidKey || idx}
                  onClick={() => pack.hasAccess && setActiveVideo(vid)}
                  disabled={!pack.hasAccess}
                  className={`w-full text-left p-3.5 rounded-2xl transition-all flex gap-3 items-start group border ${isActive
                    ? "bg-brand-aliceBlue/65 border-brand-cerulean/35 shadow-2xs"
                    : "bg-white hover:bg-gray-50 border-transparent hover:border-gray-100"
                    } ${!pack.hasAccess ? "cursor-not-allowed opacity-75" : ""}`}
                >
                  {/* Number / Play / Lock Icon */}
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-extrabold transition-colors mt-0.5 ${!pack.hasAccess
                      ? "bg-gray-100 text-gray-400"
                      : isActive
                        ? "bg-brand-cerulean text-white shadow-sm"
                        : status === "completed"
                          ? "bg-emerald-50 text-emerald-600"
                          : "bg-gray-100 text-gray-500 group-hover:bg-brand-cerulean/10 group-hover:text-brand-cerulean"
                      }`}
                  >
                    {!pack.hasAccess ? (
                      <Lock size={14} />
                    ) : isActive ? (
                      <Play size={13} fill="currentColor" className="ml-0.5" />
                    ) : status === "completed" ? (
                      <CheckCheck size={15} />
                    ) : (
                      <span>{idx + 1}</span>
                    )}
                  </div>

                  {/* Lesson Title & Meta */}
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm font-bold line-clamp-2 leading-snug transition-colors ${isActive
                        ? "text-brand-cerulean"
                        : "text-gray-800 group-hover:text-brand-prussian"
                        }`}
                    >
                      {vid.title}
                    </p>

                    <div className="flex items-center justify-between gap-2 mt-1.5">
                      <span className="inline-flex items-center gap-1 text-[11px] text-gray-400 font-medium">
                        <Clock size={11} />
                        {vid.durationMinutes} mins
                      </span>

                      {pack.hasAccess && (
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider ${status === "completed"
                            ? "text-emerald-600"
                            : status === "started"
                              ? "text-sky-600"
                              : isActive
                                ? "text-brand-cerulean"
                                : "text-gray-300"
                            }`}
                        >
                          {status === "completed"
                            ? "Watched"
                            : status === "started"
                              ? "In Progress"
                              : isActive
                                ? "Playing"
                                : ""}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>
      </div>

      {/* --- PLYR BRANDING & SECURITY STYLES --- */}
      <style>{`
        :root {
          --plyr-color-main: #0ea5e9;
          --plyr-video-control-background-hover: rgba(14, 165, 233, 0.85);
        }

        .plyr {
          width: 100%;
          height: 100%;
        }

        .plyr__video-embed iframe {
          pointer-events: none !important;
        }

        .plyr__controls {
          z-index: 60 !important;
          pointer-events: auto !important;
        }

        .secure-shield-layer {
          pointer-events: auto !important;
        }

        @keyframes marquee {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        .animate-marquee-fast {
          display: inline-block;
          animation: marquee 18s linear infinite;
        }
      `}</style>
    </div>
  );
}