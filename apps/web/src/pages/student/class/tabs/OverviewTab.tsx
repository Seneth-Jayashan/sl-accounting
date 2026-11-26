import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
    Video,
    Clock,
    Lock,
    Eye,
    EyeOff,
    Copy,
    Check,
    Hash,
    ShieldCheck,
    Signal,
    Calendar,
    Loader2,
    CheckCircle2,
    ExternalLink,
} from "lucide-react";
import { useAuth } from "../../../../contexts/AuthContext";
import AttendanceService from "../../../../services/AttendanceService";

interface OverviewTabProps {
    classData: any;
    sessions: any[];
}

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.08 },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as const },
    },
};

export default function OverviewTab({ classData, sessions }: OverviewTabProps) {
    const { user } = useAuth();
    const [showPassword, setShowPassword] = useState(false);
    const [copiedId, setCopiedId] = useState(false);
    const [copiedPass, setCopiedPass] = useState(false);
    const [isJoining, setIsJoining] = useState(false);

    const upcomingSession = useMemo(() => {
        const now = new Date();
        return [...(sessions || [])]
            .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())
            .find((s) => new Date(s.endAt) > now);
    }, [sessions]);

    const isLiveNow = useMemo(() => {
        if (!upcomingSession) return false;
        const now = new Date().getTime();
        return (
            now >= new Date(upcomingSession.startAt).getTime() &&
            now <= new Date(upcomingSession.endAt).getTime()
        );
    }, [upcomingSession]);

    const activeZoomLink = upcomingSession?.zoomJoinUrl || classData?.zoomLink;
    const activeMeetingId = upcomingSession?.zoomMeetingId || classData?.zoomMeetingId;
    const activePassword = classData?.zoomPassword;

    const copyToClipboard = (text: string, type: "id" | "pass") => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        if (type === "id") {
            setCopiedId(true);
            setTimeout(() => setCopiedId(false), 2000);
        } else {
            setCopiedPass(true);
            setTimeout(() => setCopiedPass(false), 2000);
        }
    };

    const handleJoinClick = async () => {
        if (!activeZoomLink) return;

        setIsJoining(true);
        try {
            if (upcomingSession?._id && user?._id) {
                await AttendanceService.markAttendanceStart(upcomingSession._id, user._id);
            }
        } catch (err) {
            console.error("Failed to mark attendance auto:", err);
        } finally {
            setIsJoining(false);
            window.open(activeZoomLink, "_blank", "noopener,noreferrer");
        }
    };

    const formatDay = (date: string) =>
        new Date(date).toLocaleDateString("en-US", { day: "numeric" });
    const formatMonth = (date: string) =>
        new Date(date).toLocaleDateString("en-US", { month: "short" });
    const formatWeekday = (date: string) =>
        new Date(date).toLocaleDateString("en-US", { weekday: "long" });
    const formatTime = (date: string) =>
        new Date(date).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="max-w-5xl mx-auto space-y-6"
        >
            {/* --- 1. MAIN SESSION HERO CARD --- */}
            <motion.section
                variants={itemVariants}
                className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-brand-prussian via-[#0d3a4b] to-brand-cerulean p-6 sm:p-8 lg:p-10 text-white shadow-xl shadow-brand-prussian/15"
            >
                {/* Ambient Glows */}
                <div className="pointer-events-none absolute -top-24 -right-20 w-80 h-80 bg-brand-jasmine/20 rounded-full blur-3xl" />
                <div className="pointer-events-none absolute -bottom-24 left-1/4 w-72 h-72 bg-sky-300/15 rounded-full blur-3xl" />

                <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                    {/* Left: Session Info */}
                    <div className="flex-1 space-y-5 min-w-0">
                        {/* Status Pill */}
                        <div className="flex flex-wrap items-center gap-2.5">
                            {isLiveNow ? (
                                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-400/20 border border-emerald-300/30 text-emerald-200 text-xs font-bold uppercase tracking-wider">
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                                    </span>
                                    Live Now
                                </span>
                            ) : upcomingSession ? (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-brand-jasmine text-xs font-bold uppercase tracking-wider">
                                    <Calendar size={13} />
                                    Next Session
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-white/70 text-xs font-bold uppercase tracking-wider">
                                    <Clock size={13} />
                                    No Upcoming Session
                                </span>
                            )}
                        </div>

                        {/* Title & Description */}
                        <div>
                            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight leading-tight">
                                {upcomingSession
                                    ? upcomingSession.title || "Next Live Class Session"
                                    : "No Session Scheduled"}
                            </h2>
                            <p className="text-white/75 mt-2.5 text-sm sm:text-base max-w-xl leading-relaxed">
                                {upcomingSession
                                    ? "Your live classroom is ready. Ensure you have a stable internet connection before joining."
                                    : "Check the Recordings or Resources tabs to review previous lessons while we schedule the next session."}
                            </p>
                        </div>

                        {/* Glassmorphic Date & Time Tile */}
                        {upcomingSession && (
                            <div className="inline-flex items-center gap-4 bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl px-4 py-3">
                                <div className="w-12 h-12 rounded-xl bg-white text-brand-prussian flex flex-col items-center justify-center shrink-0 shadow-sm">
                                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-brand-cerulean leading-none">
                                        {formatMonth(upcomingSession.startAt)}
                                    </span>
                                    <span className="text-xl font-black leading-none mt-0.5">
                                        {formatDay(upcomingSession.startAt)}
                                    </span>
                                </div>

                                <div className="pr-2">
                                    <p className="text-sm sm:text-base font-bold text-white leading-tight">
                                        {formatWeekday(upcomingSession.startAt)}
                                    </p>
                                    <p className="text-xs sm:text-sm text-white/75 flex items-center gap-1.5 mt-1">
                                        <Clock size={13} className="text-brand-jasmine" />
                                        <span>
                                            {formatTime(upcomingSession.startAt)}
                                            {upcomingSession.endAt && ` – ${formatTime(upcomingSession.endAt)}`}
                                        </span>
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right: Join CTA */}
                    <div className="w-full lg:w-auto flex flex-col items-stretch lg:items-end gap-2.5 shrink-0">
                        {activeZoomLink ? (
                            <>
                                <button
                                    onClick={handleJoinClick}
                                    disabled={isJoining}
                                    className="group relative inline-flex items-center justify-center gap-2.5 bg-brand-jasmine text-brand-prussian hover:bg-white py-4 px-8 rounded-2xl font-extrabold text-base shadow-lg shadow-black/15 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-75 disabled:scale-100 w-full lg:w-auto"
                                >
                                    {isJoining ? (
                                        <>
                                            <Loader2 size={19} className="animate-spin" />
                                            <span>Launching Zoom...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Video size={20} />
                                            <span>Join Live Class</span>
                                            <ExternalLink
                                                size={15}
                                                className="opacity-60 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"
                                            />
                                        </>
                                    )}
                                </button>
                                <span className="inline-flex items-center justify-center lg:justify-end gap-1.5 text-[11px] text-white/65 font-medium">
                                    <CheckCircle2 size={13} className="text-emerald-300" />
                                    Attendance is marked automatically on join
                                </span>
                            </>
                        ) : (
                            <div className="inline-flex items-center justify-center gap-2.5 bg-white/10 border border-white/15 text-white/60 py-4 px-8 rounded-2xl font-bold text-sm cursor-not-allowed w-full lg:w-auto">
                                <Lock size={18} />
                                <span>Zoom Link Unavailable</span>
                            </div>
                        )}
                    </div>
                </div>
            </motion.section>

            {/* --- 2. ZOOM CREDENTIALS GRID --- */}
            <motion.section
                variants={itemVariants}
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
                {/* Meeting ID Card */}
                <div className="group bg-white p-5 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md hover:border-brand-cerulean/30 transition-all flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 min-w-0">
                        <div className="w-12 h-12 rounded-2xl bg-brand-cerulean/10 text-brand-cerulean flex items-center justify-center shrink-0">
                            <Hash size={22} />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                                Zoom Meeting ID
                            </p>
                            <p className="text-lg sm:text-xl font-mono font-extrabold text-brand-prussian tracking-wide truncate mt-0.5">
                                {activeMeetingId || "Not assigned"}
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={() => copyToClipboard(activeMeetingId, "id")}
                        disabled={!activeMeetingId}
                        className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 ${copiedId
                                ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                                : "bg-gray-50 text-gray-600 hover:bg-brand-aliceBlue hover:text-brand-cerulean border border-gray-200/70"
                            }`}
                        title="Copy Meeting ID"
                    >
                        {copiedId ? (
                            <>
                                <Check size={15} />
                                <span>Copied</span>
                            </>
                        ) : (
                            <>
                                <Copy size={15} />
                                <span className="hidden sm:inline">Copy</span>
                            </>
                        )}
                    </button>
                </div>

                {/* Passcode Card */}
                <div className="group bg-white p-5 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md hover:border-brand-cerulean/30 transition-all flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 min-w-0">
                        <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                            <ShieldCheck size={22} />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                                Meeting Passcode
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                                <p className="text-lg sm:text-xl font-mono font-extrabold text-brand-prussian tracking-wide truncate">
                                    {activePassword ? (showPassword ? activePassword : "••••••••") : "None"}
                                </p>
                                {activePassword && (
                                    <button
                                        onClick={() => setShowPassword((prev) => !prev)}
                                        aria-label={showPassword ? "Hide passcode" : "Show passcode"}
                                        className="p-1 rounded-lg text-gray-400 hover:text-brand-prussian hover:bg-gray-100 transition-colors"
                                    >
                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={() => copyToClipboard(activePassword, "pass")}
                        disabled={!activePassword}
                        className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 ${copiedPass
                                ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                                : "bg-gray-50 text-gray-600 hover:bg-brand-aliceBlue hover:text-brand-cerulean border border-gray-200/70"
                            }`}
                        title="Copy Passcode"
                    >
                        {copiedPass ? (
                            <>
                                <Check size={15} />
                                <span>Copied</span>
                            </>
                        ) : (
                            <>
                                <Copy size={15} />
                                <span className="hidden sm:inline">Copy</span>
                            </>
                        )}
                    </button>
                </div>
            </motion.section>

            {/* --- 3. SYSTEM STATUS BAR --- */}
            <motion.div
                variants={itemVariants}
                className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 py-3 px-4 rounded-2xl bg-white/70 border border-gray-100 text-xs font-medium text-gray-500"
            >
                <span className="inline-flex items-center gap-1.5">
                    <Signal size={14} className="text-emerald-500" />
                    <span>Zoom Status:</span>
                    <strong className="text-emerald-600 font-bold">Operational</strong>
                </span>
                <span className="text-gray-300 hidden sm:inline">•</span>
                <span>Timezone: Asia/Colombo (GMT+5:30)</span>
            </motion.div>
        </motion.div>
    );
}