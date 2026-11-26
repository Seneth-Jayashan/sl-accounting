import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Clock,
  PlayCircle,
  Lock,
  BookOpen,
  ShoppingCart,
  Film,
  Share2,
  Check,
  CheckCircle2,
  Paperclip,
  ShieldCheck,
  Sparkles,
  ListVideo,
} from "lucide-react";

import LessonPackService, {
  type LessonPackData,
} from "../services/LessonPackService";
import { useAuth } from "../contexts/AuthContext";

// --- Configuration ---
const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000"
)
  .replace(/\/api\/v1\/?$/, "")
  .replace(/\/+$/, "");

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
function LessonPackDetailSkeleton() {
  return (
    <div className="min-h-screen bg-[#FAFCFF] pb-24 animate-pulse">
      <div className="h-[380px] bg-slate-200 rounded-b-[2.5rem]" />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 -mt-10 grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-6">
          <div className="h-24 bg-white rounded-2xl border border-slate-100" />
          <div className="h-52 bg-white rounded-3xl border border-slate-100" />
          <div className="h-80 bg-white rounded-3xl border border-slate-100" />
        </div>
        <div className="lg:col-span-4">
          <div className="h-96 bg-white rounded-3xl border border-slate-100" />
        </div>
      </div>
    </div>
  );
}

// --- Main Component ---
export default function LessonPackDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [pack, setPack] = useState<LessonPackData | null>(null);
  const [loading, setLoading] = useState(true);
  const [coverFailed, setCoverFailed] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchPackDetails = async () => {
      if (!id) return;
      try {
        setLoading(true);
        setCoverFailed(false);
        const data = await LessonPackService.getPublicById(id);
        setPack(data);
      } catch (error) {
        console.error("Failed to load lesson pack details", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPackDetails();
  }, [id]);

  const handleActionClick = () => {
    if (!pack) return;
    const targetPlayerRoute = `/student/lesson-pack/${pack._id}`;
    if (user) {
      navigate(targetPlayerRoute);
    } else {
      navigate("/login", { state: { from: targetPlayerRoute } });
    }
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      const input = document.createElement("input");
      input.value = window.location.href;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  if (loading) return <LessonPackDetailSkeleton />;

  if (!pack) {
    return (
      <div className="min-h-screen bg-[#FAFCFF] flex flex-col items-center justify-center text-center px-6 py-24">
        <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mb-5 border border-rose-100">
          <ListVideo className="w-8 h-8" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-brand-prussian mb-2 font-sinhala">
          සමාවන්න! Lesson Pack Not Found
        </h2>
        <p className="text-slate-500 mb-8 max-w-md text-sm sm:text-base leading-relaxed">
          The lesson pack you are looking for does not exist or is no longer published.
        </p>
        <Link
          to="/lesson-packs"
          className="inline-flex items-center gap-2 bg-brand-prussian hover:bg-brand-cerulean text-white px-7 py-3.5 rounded-xl font-semibold text-sm shadow-md transition-colors"
        >
          <ArrowLeft size={17} />
          <span>Browse All Lesson Packs</span>
        </Link>
      </div>
    );
  }

  const videos = pack.videos || [];
  const attachments: any[] = Array.isArray((pack as any).attachments)
    ? (pack as any).attachments
    : [];
  const totalMinutes = videos.reduce(
    (acc, video) => acc + (Number(video.durationMinutes) || 0),
    0
  );
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const formattedDuration =
    totalMinutes > 0
      ? `${hours > 0 ? `${hours}h ` : ""}${minutes}m`
      : "Self-paced";

  const coverUrl = getSmartCoverUrl(pack);
  const price = Number(pack.price || 0);
  const isFree = price === 0;
  const canWatch = Boolean(pack.hasAccess);

  return (
    <div className="min-h-screen bg-[#FAFCFF] font-sans text-brand-prussian pb-28 lg:pb-20 selection:bg-brand-cerulean selection:text-white">
      {/* --- HERO HEADER SECTION --- */}
      <header className="relative bg-gradient-to-br from-brand-prussian via-[#07273D] to-[#02121E] text-white overflow-hidden rounded-b-[2.5rem] sm:rounded-b-[3rem] shadow-xl pt-28 pb-16 sm:pt-32 sm:pb-20">
        {/* Blended Cover Image */}
        {coverUrl && !coverFailed && (
          <motion.div
            initial={{ scale: 1.06 }}
            animate={{ scale: 1 }}
            transition={{ duration: 8, ease: "easeOut" }}
            className="absolute inset-0 pointer-events-none"
          >
            <img
              src={coverUrl}
              alt={pack.title}
              onError={() => setCoverFailed(true)}
              className="w-full h-full object-cover opacity-30 mix-blend-luminosity"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-brand-prussian via-brand-prussian/80 to-brand-prussian/50" />
          </motion.div>
        )}

        {/* Ambient Pattern & Glows */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff33_1px,transparent_1px)] [background-size:22px_22px] pointer-events-none" />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-brand-cerulean rounded-full blur-[130px] opacity-25 pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-brand-coral rounded-full blur-[120px] opacity-20 pointer-events-none" />

        {/* Hero Content */}
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 space-y-6">
          {/* Top Navigation Bar */}
          <div className="flex items-center justify-between gap-3">
            <Link
              to="/lesson-packs"
              className="group inline-flex items-center gap-2 text-xs font-semibold text-white/85 hover:text-white bg-white/10 hover:bg-white/15 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/15 transition-all"
            >
              <ArrowLeft
                size={15}
                className="group-hover:-translate-x-0.5 transition-transform"
              />
              <span>Back to Lesson Packs</span>
            </Link>

            <button
              type="button"
              onClick={handleShare}
              className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-xl border backdrop-blur-md transition-all ${copied
                  ? "bg-emerald-500/20 border-emerald-400/40 text-emerald-200"
                  : "bg-white/10 hover:bg-white/15 border-white/15 text-white/90"
                }`}
            >
              {copied ? (
                <>
                  <Check size={14} />
                  <span>Link Copied</span>
                </>
              ) : (
                <>
                  <Share2 size={14} />
                  <span>Share</span>
                </>
              )}
            </button>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="max-w-3xl space-y-4"
          >
            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 bg-brand-cerulean/90 text-white px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border border-white/15 shadow-sm">
                <Sparkles size={12} />
                On-Demand Lesson Pack
              </span>
              <span className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-md text-brand-jasmine px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border border-white/15 tabular-nums">
                <Film size={12} />
                {videos.length} {videos.length === 1 ? "Lesson" : "Lessons"}
              </span>
              {totalMinutes > 0 && (
                <span className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-md text-white/90 px-3 py-1 rounded-full text-[11px] font-semibold border border-white/15 tabular-nums">
                  <Clock size={12} className="text-brand-jasmine" />
                  {formattedDuration}
                </span>
              )}
            </div>

            {/* Pack Title */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white leading-[1.15] font-sinhala tracking-tight">
              {pack.title}
            </h1>

            <p className="text-white/75 text-sm sm:text-base max-w-2xl leading-relaxed font-sans">
              Master this accounting module at your own pace with structured HD video lessons and downloadable study notes by Kalum Waduge.
            </p>
          </motion.div>
        </div>
      </header>

      {/* --- MAIN CONTENT CONTAINER --- */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 relative -mt-8 z-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
          {/* LEFT COLUMN (8 cols): Quick Stats, Description, Attachments & Curriculum */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="lg:col-span-8 space-y-6"
          >
            {/* Quick Metrics Strip */}
            <div className="grid grid-cols-3 gap-3 sm:gap-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-brand-aliceBlue text-brand-cerulean flex items-center justify-center shrink-0">
                  <Film className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Lessons
                  </p>
                  <p className="text-xs sm:text-sm font-bold text-brand-prussian tabular-nums mt-0.5">
                    {videos.length} {videos.length === 1 ? "Video" : "Videos"}
                  </p>
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Duration
                  </p>
                  <p className="text-xs sm:text-sm font-bold text-brand-prussian tabular-nums mt-0.5 truncate">
                    {formattedDuration}
                  </p>
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <Paperclip className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Materials
                  </p>
                  <p className="text-xs sm:text-sm font-bold text-brand-prussian tabular-nums mt-0.5 truncate">
                    {attachments.length > 0
                      ? `${attachments.length} PDF${attachments.length > 1 ? "s" : ""
                      }`
                      : "Included"}
                  </p>
                </div>
              </div>
            </div>

            {/* About This Pack Card */}
            <section className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80">
              <div className="flex items-center gap-3 pb-4 mb-5 border-b border-slate-100">
                <div className="w-10 h-10 rounded-xl bg-brand-aliceBlue text-brand-cerulean flex items-center justify-center shrink-0">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-brand-prussian">
                    About This Lesson Pack
                  </h2>
                  <p className="text-xs text-slate-400">
                    Overview, syllabus coverage, and study outcomes
                  </p>
                </div>
              </div>

              <div className="text-slate-600 text-sm sm:text-base font-sans leading-relaxed whitespace-pre-wrap">
                {pack.description ||
                  "Focused video lessons and downloadable study materials designed to help you master this A/L Accounting topic."}
              </div>

              {/* Included PDFs / Attachments Preview */}
              {attachments.length > 0 && (
                <div className="mt-7 pt-6 border-t border-slate-100 space-y-3">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Paperclip size={13} className="text-brand-cerulean" />
                    Included Study Materials ({attachments.length})
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {attachments.map((att, i) => (
                      <div
                        key={att._id || i}
                        className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-slate-50/90 border border-slate-200/70 text-xs font-semibold text-brand-prussian"
                      >
                        <span className="px-2 py-0.5 rounded bg-brand-aliceBlue text-brand-cerulean text-[10px] font-bold uppercase shrink-0">
                          PDF
                        </span>
                        <span className="truncate">
                          {att.title || att.name || `Study Note ${i + 1}`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>

            {/* Course Curriculum Card */}
            <section className="bg-white rounded-3xl shadow-sm border border-slate-200/80 overflow-hidden">
              <div className="p-6 sm:px-8 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-aliceBlue text-brand-cerulean flex items-center justify-center shrink-0">
                    <ListVideo className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-brand-prussian">
                      Course Curriculum
                    </h2>
                    <p className="text-xs text-slate-400">
                      {videos.length}{" "}
                      {videos.length === 1 ? "video lesson" : "video lessons"}
                      {totalMinutes > 0 ? ` • ${formattedDuration} total` : ""}
                    </p>
                  </div>
                </div>

                {!canWatch && !isFree && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-500 text-[11px] font-semibold">
                    <Lock size={12} />
                    <span>Unlock pack to watch</span>
                  </span>
                )}
              </div>

              {videos.length === 0 ? (
                <div className="p-10 text-center text-sm text-slate-400">
                  No video lessons have been added to this pack yet.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {videos.map((video, index) => {
                    const interactive = canWatch || isFree;
                    return (
                      <div
                        key={video._id || index}
                        onClick={() => interactive && handleActionClick()}
                        className={`px-6 sm:px-8 py-4 flex items-center justify-between gap-4 transition-colors ${interactive
                            ? "hover:bg-brand-aliceBlue/35 cursor-pointer group"
                            : "bg-white"
                          }`}
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <span
                            className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 tabular-nums transition-colors ${interactive
                                ? "bg-brand-aliceBlue text-brand-cerulean group-hover:bg-brand-prussian group-hover:text-white"
                                : "bg-slate-100 text-slate-400"
                              }`}
                          >
                            {String(index + 1).padStart(2, "0")}
                          </span>

                          <div className="min-w-0">
                            <h3
                              className={`font-semibold text-sm truncate font-sinhala ${interactive
                                  ? "text-brand-prussian group-hover:text-brand-cerulean transition-colors"
                                  : "text-slate-700"
                                }`}
                            >
                              {video.title}
                            </h3>
                            <p className="text-[11px] text-slate-400 mt-0.5 tabular-nums flex items-center gap-1.5">
                              <Clock size={11} />
                              <span>
                                {video.durationMinutes
                                  ? `${video.durationMinutes} mins`
                                  : "Video Lesson"}
                              </span>
                            </p>
                          </div>
                        </div>

                        <div className="shrink-0">
                          {interactive ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand-cerulean group-hover:translate-x-0.5 transition-transform">
                              <PlayCircle size={18} />
                            </span>
                          ) : (
                            <span className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200/70 flex items-center justify-center text-slate-400">
                              <Lock size={14} />
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </motion.div>

          {/* RIGHT COLUMN (4 cols): Sticky Purchase / Access Sidebar */}
          <motion.aside
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="lg:col-span-4"
          >
            <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-xl shadow-brand-prussian/5 border border-slate-200/80 lg:sticky lg:top-28 space-y-6">
              {/* Price Box */}
              <div className="p-5 rounded-2xl bg-slate-50/90 border border-slate-200/70 text-center">
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                  One-Time Pack Access
                </p>
                {isFree ? (
                  <div className="text-3xl font-black text-emerald-600 tracking-tight">
                    FREE
                  </div>
                ) : (
                  <div className="flex items-baseline justify-center gap-1.5 text-brand-prussian font-mono tabular-nums">
                    <span className="text-sm font-bold text-slate-500">LKR</span>
                    <span className="text-4xl font-black tracking-tight">
                      {price.toLocaleString()}
                    </span>
                  </div>
                )}
              </div>

              {/* Included Perks */}
              <div className="space-y-3">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Pack Includes
                </p>
                {[
                  `${videos.length} full-length HD video lessons`,
                  "Watch anytime on mobile, tablet, or desktop",
                  "Downloadable PDF tutes & worksheets",
                  "24/7 SL Accounting LMS access",
                ].map((feature, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <div className="mt-0.5 w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200/70 flex items-center justify-center shrink-0">
                      <CheckCircle2 size={12} />
                    </div>
                    <p className="text-xs sm:text-sm text-slate-600 font-medium leading-snug">
                      {feature}
                    </p>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="space-y-2.5 pt-2 border-t border-slate-100">
                {canWatch ? (
                  <button
                    type="button"
                    onClick={handleActionClick}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 text-sm sm:text-base active:scale-[0.98]"
                  >
                    <PlayCircle size={19} />
                    <span>Continue Learning</span>
                  </button>
                ) : isFree ? (
                  <button
                    type="button"
                    onClick={handleActionClick}
                    className="w-full bg-brand-prussian hover:bg-brand-cerulean text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-brand-prussian/15 flex items-center justify-center gap-2 text-sm sm:text-base active:scale-[0.98]"
                  >
                    <PlayCircle size={19} />
                    <span>Start Watching Free</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleActionClick}
                    className="w-full bg-brand-prussian hover:bg-brand-cerulean text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-brand-prussian/15 flex items-center justify-center gap-2 text-sm sm:text-base active:scale-[0.98]"
                  >
                    <ShoppingCart size={18} />
                    <span>Purchase Lesson Pack</span>
                    <ArrowRight size={16} />
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleShare}
                  className={`w-full border font-semibold py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 text-xs sm:text-sm active:scale-[0.98] ${copied
                      ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                      : "bg-white border-slate-200/80 text-slate-600 hover:text-brand-prussian hover:bg-slate-50"
                    }`}
                >
                  {copied ? (
                    <>
                      <Check size={16} />
                      <span>Link Copied!</span>
                    </>
                  ) : (
                    <>
                      <Share2 size={15} />
                      <span>Share Lesson Pack</span>
                    </>
                  )}
                </button>
              </div>

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
                <ShieldCheck size={14} className="text-brand-cerulean shrink-0" />
                <span>Instant unlock upon payment verification</span>
              </div>
            </div>
          </motion.aside>
        </div>
      </main>

      {/* --- MOBILE STICKY ACTION BAR --- */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-4 py-3 shadow-lg">
        <div className="max-w-xl mx-auto flex items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Pack Price
            </p>
            <p className="text-base font-black text-brand-prussian font-mono tabular-nums">
              {isFree ? "FREE" : `LKR ${price.toLocaleString()}`}
            </p>
          </div>

          {canWatch ? (
            <button
              type="button"
              onClick={handleActionClick}
              className="inline-flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-sm active:scale-95"
            >
              <PlayCircle size={16} />
              <span>Continue Learning</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleActionClick}
              className="inline-flex items-center gap-2 bg-brand-prussian hover:bg-brand-cerulean text-white px-6 py-2.5 rounded-xl font-bold text-xs shadow-md active:scale-95"
            >
              <ShoppingCart size={15} />
              <span>{isFree ? "Watch Free" : "Purchase Pack"}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}