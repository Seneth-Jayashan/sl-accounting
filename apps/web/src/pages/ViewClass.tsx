import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
    Calendar,
    Clock,
    CheckCircle2,
    ArrowLeft,
    Share2,
    ArrowRight,
    BookOpen,
    GraduationCap,
    Layers,
    Tag,
    Check,
    PlayCircle,
    Repeat,
    Timer,
    ShieldCheck,
} from "lucide-react";

// Services & Context
import ClassService from "../services/ClassService";
import EnrollmentService from "../services/EnrollmentService";
import { useAuth } from "../contexts/AuthContext";

// --- Configuration ---
const API_BASE_URL = (
    import.meta.env.VITE_API_BASE_URL || "http://localhost:3000"
).replace(/\/+$/, "");

// --- Interfaces ---
interface Schedule {
    day: number;
    startTime: string;
    endTime: string;
}

interface ClassData {
    _id: string;
    name: string;
    description: string;
    promoVideoId?: string | null;
    price: number;
    level: string;
    type?: string;
    batch: any;
    coverImage?: string;
    timeSchedules: Schedule[];
    tags?: string[];
    sessionDurationMinutes?: number;
    totalSessions?: number;
    recurrence?: string;
}

// --- Helpers ---
const getImageUrl = (path?: string): string | null => {
    if (!path) return null;
    if (path.startsWith("http")) return path;
    const cleanPath = path.replace(/\\/g, "/").replace(/^\/+/, "");
    return `${API_BASE_URL}/${cleanPath}`;
};

const getDayName = (dayIndex: number): string =>
    [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
    ][dayIndex] || "TBA";

const extractYoutubeId = (value?: string | null): string | null => {
    if (!value) return null;
    const trimmed = value.trim();
    if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;
    const match = trimmed.match(
        /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
    );
    return match && match[2].length === 11 ? match[2] : trimmed;
};

// --- Skeleton Loader ---
function ClassDetailSkeleton() {
    return (
        <div className="min-h-screen bg-[#FAFCFF] pb-24 animate-pulse">
            <div className="h-[420px] bg-slate-200 rounded-b-[2.5rem]" />
            <div className="max-w-6xl mx-auto px-4 sm:px-6 -mt-12 grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-8 space-y-6">
                    <div className="h-24 bg-white rounded-2xl border border-slate-100" />
                    <div className="h-44 bg-white rounded-2xl border border-slate-100" />
                    <div className="h-72 bg-white rounded-2xl border border-slate-100" />
                </div>
                <div className="lg:col-span-4">
                    <div className="h-96 bg-white rounded-3xl border border-slate-100" />
                </div>
            </div>
        </div>
    );
}

// --- Main Component ---
export default function ViewPublicClassPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();

    // --- State ---
    const [classData, setClassData] = useState<ClassData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isEnrolled, setIsEnrolled] = useState(false);
    const [heroImageFailed, setHeroImageFailed] = useState(false);
    const [copied, setCopied] = useState(false);

    // --- Fetch Data ---
    useEffect(() => {
        if (!id) return;

        let isMounted = true;

        const fetchData = async () => {
            setLoading(true);
            setHeroImageFailed(false);
            try {
                const data = await ClassService.getPublicClassById(id);
                if (isMounted) setClassData(Array.isArray(data) ? data[0] : data);

                if (user) {
                    try {
                        const status = await EnrollmentService.checkEnrollmentStatus(id);
                        if (isMounted) setIsEnrolled(status);
                    } catch (e) {
                        console.warn("Enrollment check failed (likely not enrolled)", e);
                    }
                }
            } catch (err) {
                console.error(err);
                if (isMounted) setError("Class not found or currently unavailable.");
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchData();
        return () => {
            isMounted = false;
        };
    }, [id, user]);

    // --- Handlers ---
    const handleEnrollClick = () => {
        if (!classData) return;
        const targetEnrollmentPage = `/student/enrollment/${classData._id}`;
        if (user) {
            navigate(targetEnrollmentPage);
        } else {
            navigate("/login", { state: { from: targetEnrollmentPage } });
        }
    };

    const handleShare = async () => {
        try {
            await navigator.clipboard.writeText(window.location.href);
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
        } catch {
            // Fallback for restricted clipboard contexts
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

    if (loading) return <ClassDetailSkeleton />;

    if (error || !classData) {
        return (
            <div className="min-h-screen bg-[#FAFCFF] flex flex-col items-center justify-center text-center px-6 py-24">
                <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mb-5 border border-rose-100">
                    <BookOpen className="w-8 h-8" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-brand-prussian mb-2 font-sinhala">
                    සමාවන්න! Class Not Found
                </h2>
                <p className="text-slate-500 mb-8 max-w-md text-sm sm:text-base">
                    {error || "We couldn't find the class you are looking for."}
                </p>
                <Link
                    to="/classes"
                    className="inline-flex items-center gap-2 bg-brand-prussian hover:bg-brand-cerulean text-white px-7 py-3.5 rounded-xl font-semibold text-sm shadow-md transition-colors"
                >
                    <ArrowLeft size={17} />
                    <span>Browse All Classes</span>
                </Link>
            </div>
        );
    }

    const coverUrl = getImageUrl(classData.coverImage);
    const batchName =
        classData.batch && typeof classData.batch === "object"
            ? classData.batch.name
            : null;
    const promoEmbedId = extractYoutubeId(classData.promoVideoId);

    const quickFacts = [
        classData.level
            ? {
                icon: GraduationCap,
                label: "Level",
                value: `${classData.level} Level`,
            }
            : null,
        classData.recurrence
            ? {
                icon: Repeat,
                label: "Session Recurrence",
                value: classData.recurrence,
            }
            : null,
        classData.sessionDurationMinutes
            ? {
                icon: Timer,
                label: "Session Length",
                value: `${classData.sessionDurationMinutes} mins`,
            }
            : null,
        classData.totalSessions
            ? {
                icon: Layers,
                label: "Total Sessions",
                value: `${classData.totalSessions} Sessions`,
            }
            : null,
    ].filter(Boolean) as {
        icon: React.ComponentType<{ className?: string }>;
        label: string;
        value: string;
    }[];

    return (
        <div className="min-h-screen bg-[#FAFCFF] font-sans text-brand-prussian pb-28 lg:pb-20 selection:bg-brand-cerulean selection:text-white">
            {/* --- HERO HEADER SECTION --- */}
            <header className="relative bg-gradient-to-br from-brand-prussian via-[#07273D] to-[#02121E] text-white overflow-hidden rounded-b-[2.5rem] sm:rounded-b-[3rem] shadow-xl pt-28 pb-16 sm:pt-32 sm:pb-20">
                {/* Optional Blended Cover Image */}
                {coverUrl && !heroImageFailed && (
                    <motion.div
                        initial={{ scale: 1.06 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 8, ease: "easeOut" }}
                        className="absolute inset-0 pointer-events-none"
                    >
                        <img
                            src={coverUrl}
                            alt={classData.name}
                            onError={() => setHeroImageFailed(true)}
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
                    {/* Top Back Link */}
                    <div>
                        <Link
                            to="/classes"
                            className="group inline-flex items-center gap-2 text-xs font-semibold text-white/85 hover:text-white bg-white/10 hover:bg-white/15 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/15 transition-all"
                        >
                            <ArrowLeft
                                size={15}
                                className="group-hover:-translate-x-0.5 transition-transform"
                            />
                            <span>Back to Classes</span>
                        </Link>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, y: 18 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.45 }}
                        className="max-w-3xl space-y-4"
                    >
                        {/* Badges */}
                        <div className="flex flex-wrap items-center gap-2">
                            {classData.level && (
                                <span className="inline-flex items-center gap-1.5 bg-brand-cerulean/90 text-white px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border border-white/15 shadow-sm">
                                    <GraduationCap size={13} />
                                    {classData.level} Level
                                </span>
                            )}
                            {batchName && (
                                <span className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-md text-brand-jasmine px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border border-white/15">
                                    <Layers size={13} />
                                    {batchName}
                                </span>
                            )}
                            {classData.type && (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-brand-coral/90 text-white shadow-sm">
                                    {classData.type}
                                </span>
                            )}
                        </div>

                        {/* Class Title */}
                        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white leading-[1.15] font-sinhala tracking-tight">
                            {classData.name}
                        </h1>

                        <p className="text-white/75 text-sm sm:text-base max-w-2xl leading-relaxed font-sans">
                            Structured A/L Accounting sessions led by Kalum Waduge with live Zoom classes, HD recordings, and downloadable study materials.
                        </p>
                    </motion.div>
                </div>
            </header>

            {/* --- MAIN CONTENT CONTAINER --- */}
            <main className="max-w-6xl mx-auto px-4 sm:px-6 relative -mt-8 z-20">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
                    {/* LEFT COLUMN (8 cols): Quick Facts, Schedule, Video & Description */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1, duration: 0.4 }}
                        className="lg:col-span-8 space-y-6"
                    >
                        {/* Quick Facts Strip */}
                        {quickFacts.length > 0 && (
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                                {quickFacts.map((fact) => {
                                    const Icon = fact.icon;
                                    return (
                                        <div
                                            key={fact.label}
                                            className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-3"
                                        >
                                            <div className="w-9 h-9 rounded-xl bg-brand-aliceBlue text-brand-cerulean flex items-center justify-center shrink-0">
                                                <Icon className="w-4 h-4" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                                    {fact.label}
                                                </p>
                                                <p className="text-xs sm:text-sm font-bold text-brand-prussian capitalize truncate tabular-nums mt-0.5">
                                                    {fact.value}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Class Schedule Card */}
                        <section className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80">
                            <div className="flex items-center gap-3 pb-4 mb-5 border-b border-slate-100">
                                <div className="w-10 h-10 rounded-xl bg-brand-aliceBlue text-brand-cerulean flex items-center justify-center shrink-0">
                                    <Calendar className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="text-base sm:text-lg font-bold text-brand-prussian">
                                        Weekly Class Schedule
                                    </h2>
                                    <p className="text-xs text-slate-400">
                                        All times are in Sri Lanka Standard Time (SLST)
                                    </p>
                                </div>
                            </div>

                            {classData.timeSchedules && classData.timeSchedules.length > 0 ? (
                                <div className="space-y-3">
                                    {classData.timeSchedules.map((sch, idx) => (
                                        <div
                                            key={idx}
                                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-50/90 border border-slate-200/70"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-white border border-slate-200/80 text-brand-cerulean flex items-center justify-center font-bold text-xs shadow-sm shrink-0">
                                                    {getDayName(sch.day).slice(0, 3).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                                        Class Day
                                                    </p>
                                                    <p className="text-sm sm:text-base font-bold text-brand-prussian">
                                                        Every {getDayName(sch.day)}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200/80 text-xs sm:text-sm font-bold text-brand-prussian shadow-sm tabular-nums self-start sm:self-center">
                                                <Clock className="w-4 h-4 text-brand-coral shrink-0" />
                                                <span>
                                                    {sch.startTime} – {sch.endTime}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 text-sm font-semibold text-slate-500">
                                    Schedule to be announced (Recorded access available)
                                </div>
                            )}
                        </section>

                        {/* Optional Promo Video Card */}
                        {promoEmbedId && (
                            <section className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80 space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-rose-50 text-brand-coral ring-1 ring-rose-100 flex items-center justify-center shrink-0">
                                        <PlayCircle className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h2 className="text-base sm:text-lg font-bold text-brand-prussian">
                                            Class Introduction & Preview
                                        </h2>
                                        <p className="text-xs text-slate-400">
                                            Watch a short overview of what to expect in this class
                                        </p>
                                    </div>
                                </div>

                                <div className="aspect-video w-full rounded-2xl overflow-hidden bg-slate-900 border border-slate-200/80 shadow-inner">
                                    <iframe
                                        className="w-full h-full"
                                        src={`https://www.youtube.com/embed/${promoEmbedId}`}
                                        title="Class Promo Video"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                    />
                                </div>
                            </section>
                        )}

                        {/* Description & Topics Card */}
                        <section className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80">
                            <div className="flex items-center gap-3 pb-4 mb-5 border-b border-slate-100">
                                <div className="w-10 h-10 rounded-xl bg-brand-aliceBlue text-brand-cerulean flex items-center justify-center shrink-0">
                                    <BookOpen className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="text-base sm:text-lg font-bold text-brand-prussian">
                                        About This Class
                                    </h2>
                                    <p className="text-xs text-slate-400">
                                        Course structure, syllabus scope, and study materials
                                    </p>
                                </div>
                            </div>

                            <div className="text-slate-600 text-sm sm:text-base font-sans leading-relaxed whitespace-pre-wrap">
                                {classData.description}
                            </div>

                            {/* Topics / Tags */}
                            {classData.tags && classData.tags.length > 0 && (
                                <div className="mt-8 pt-6 border-t border-slate-100">
                                    <p className="text-[11px] font-bold text-slate-400 mb-3 uppercase tracking-wider flex items-center gap-1.5">
                                        <Tag size={13} className="text-brand-cerulean" />
                                        Topics Covered
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {classData.tags.map((tag, idx) => (
                                            <span
                                                key={idx}
                                                className="bg-brand-aliceBlue/70 text-brand-prussian px-3 py-1.5 rounded-xl text-xs font-semibold border border-brand-cerulean/15"
                                            >
                                                #{tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </section>
                    </motion.div>

                    {/* RIGHT COLUMN (4 cols): Sticky Enrollment Sidebar */}
                    <motion.aside
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.4 }}
                        className="lg:col-span-4"
                    >
                        <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-xl shadow-brand-prussian/5 border border-slate-200/80 lg:sticky lg:top-28 space-y-6">
                            {/* Price Display */}
                            <div className="p-5 rounded-2xl bg-slate-50/90 border border-slate-200/70 text-center">
                                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                                    {classData.recurrence?.toLowerCase() === "monthly"
                                        ? "Monthly Class Fee"
                                        : "Class Fee"}
                                </p>
                                <div className="flex items-baseline justify-center gap-1.5 text-brand-prussian font-mono tabular-nums">
                                    <span className="text-sm font-bold text-slate-500">LKR</span>
                                    <span className="text-4xl font-black tracking-tight">
                                        {Number(classData.price || 0).toLocaleString()}
                                    </span>
                                </div>
                            </div>

                            {/* Included Features */}
                            <div className="space-y-3">
                                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                    What's Included
                                </p>
                                {[
                                    "Live interactive sessions via Zoom",
                                    "Full HD replay access for revision",
                                    "Downloadable PDF tutes & worksheets",
                                    "Timed MCQ quizzes & paper marking",
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

                            {/* Primary & Secondary Action Buttons */}
                            <div className="space-y-2.5 pt-2 border-t border-slate-100">
                                <AnimatePresence mode="wait">
                                    {isEnrolled ? (
                                        <motion.div
                                            key="enrolled"
                                            initial={{ opacity: 0, y: 6 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -6 }}
                                            className="space-y-2.5"
                                        >
                                            <div className="w-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 font-bold py-3 rounded-xl flex items-center justify-center gap-2 text-xs sm:text-sm">
                                                <CheckCircle2 size={16} />
                                                <span>You're Enrolled</span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => navigate("/student/dashboard")}
                                                className="w-full bg-brand-prussian hover:bg-brand-cerulean text-white font-semibold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-md text-sm active:scale-[0.98]"
                                            >
                                                <span>Go to Dashboard</span>
                                                <ArrowRight size={16} />
                                            </button>
                                        </motion.div>
                                    ) : (
                                        <motion.button
                                            key="enroll"
                                            type="button"
                                            initial={{ opacity: 0, y: 6 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -6 }}
                                            onClick={handleEnrollClick}
                                            className="w-full bg-brand-prussian hover:bg-brand-cerulean text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-brand-prussian/15 flex items-center justify-center gap-2 text-sm sm:text-base active:scale-[0.98]"
                                        >
                                            <span>Enroll Now</span>
                                            <ArrowRight size={17} />
                                        </motion.button>
                                    )}
                                </AnimatePresence>

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
                                            <span>Share Class</span>
                                        </>
                                    )}
                                </button>
                            </div>

                            <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
                                <ShieldCheck size={14} className="text-brand-cerulean shrink-0" />
                                <span>Instant LMS access after payment verification</span>
                            </div>
                        </div>
                    </motion.aside>
                </div>
            </main>

            {/* --- MOBILE STICKY ENROLLMENT BAR --- */}
            <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-4 py-3 shadow-lg">
                <div className="max-w-xl mx-auto flex items-center justify-between gap-4">
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Class Fee
                        </p>
                        <p className="text-base font-black text-brand-prussian font-mono tabular-nums">
                            LKR {Number(classData.price || 0).toLocaleString()}
                        </p>
                    </div>

                    {isEnrolled ? (
                        <button
                            type="button"
                            onClick={() => navigate("/student/dashboard")}
                            className="inline-flex items-center gap-2 bg-brand-prussian text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-sm active:scale-95"
                        >
                            <span>Go to Dashboard</span>
                            <ArrowRight size={15} />
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={handleEnrollClick}
                            className="inline-flex items-center gap-2 bg-brand-prussian hover:bg-brand-cerulean text-white px-6 py-2.5 rounded-xl font-bold text-xs shadow-md active:scale-95"
                        >
                            <span>Enroll Now</span>
                            <ArrowRight size={15} />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}