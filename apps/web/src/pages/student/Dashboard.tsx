import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
    BookOpen,
    Calendar,
    Clock,
    Video,
    FileText,
    AlertCircle,
    CheckCircle2,
    CreditCard,
    MapPin,
    ArrowUpRight,
    ChevronRight,
    User,
    Receipt,
    Sparkles,
    ExternalLink,
    ListVideo,
    ClipboardList,
    HelpCircle,
    PlayCircle,
    Radio,
} from "lucide-react";

import { useAuth } from "../../contexts/AuthContext";
import UserService, { type StudentDashboardData } from "../../services/UserService";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

// --- HELPERS ---

function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
}

function getRelativeDayLabel(isoString: string) {
    const target = new Date(isoString);
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfTarget = new Date(target.getFullYear(), target.getMonth(), target.getDate());
    const diffDays = Math.round(
        (startOfTarget.getTime() - startOfToday.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    return target.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

// --- ANIMATION VARIANTS ---

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.06 },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 14 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as const },
    },
};

// --- QUICK STUDY LINKS ---

const STUDY_SHORTCUTS = [
    {
        label: "Lesson Packs",
        desc: "Recorded modules",
        href: "/student/lesson-packs",
        icon: ListVideo,
        bg: "bg-blue-50",
        color: "text-brand-cerulean",
    },
    {
        label: "Quizzes",
        desc: "Test your knowledge",
        href: "/student/quizzes/history",
        icon: ClipboardList,
        bg: "bg-amber-50",
        color: "text-amber-600",
    },
    {
        label: "Essay Papers",
        desc: "Past papers & marking",
        href: "/student/papers",
        icon: FileText,
        bg: "bg-purple-50",
        color: "text-purple-600",
    },
    {
        label: "My Tutes",
        desc: "Course handouts",
        href: "/student/my-tutes",
        icon: BookOpen,
        bg: "bg-emerald-50",
        color: "text-emerald-600",
    },
];

// --- SUB-COMPONENTS ---

function StatCard({
    title,
    value,
    badge,
    hint,
    icon: Icon,
    iconBg,
    iconColor,
    isAlert = false,
}: {
    title: string;
    value: string | number;
    badge?: string;
    hint?: string;
    icon: React.ElementType;
    iconBg: string;
    iconColor: string;
    isAlert?: boolean;
}) {
    return (
        <motion.div
            variants={itemVariants}
            className={`group relative bg-white rounded-3xl p-5 sm:p-6 border transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-brand-prussian/5 flex flex-col justify-between h-full ${isAlert
                    ? "border-red-200 ring-2 ring-red-100/80 shadow-sm"
                    : "border-gray-100 shadow-sm hover:border-brand-cerulean/25"
                }`}
        >
            <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">
                        {title}
                    </p>
                    <div className="mt-2 flex items-baseline gap-2.5 flex-wrap">
                        <span className="text-3xl font-extrabold text-gray-900 tracking-tight">
                            {value}
                        </span>
                        {badge && (
                            <span
                                className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${isAlert
                                        ? "bg-red-50 text-red-600"
                                        : "bg-brand-aliceBlue text-brand-cerulean"
                                    }`}
                            >
                                {badge}
                            </span>
                        )}
                    </div>
                </div>

                <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110 ${iconBg}`}
                >
                    <Icon size={22} className={iconColor} />
                </div>
            </div>

            {hint && (
                <div
                    className={`mt-5 pt-3.5 border-t border-gray-100/80 text-xs font-medium flex items-center gap-2 truncate ${isAlert ? "text-red-500" : "text-gray-500"
                        }`}
                >
                    <span
                        className={`w-1.5 h-1.5 rounded-full shrink-0 ${isAlert ? "bg-red-500 animate-pulse" : "bg-brand-cerulean"
                            }`}
                    />
                    <span className="truncate">{hint}</span>
                </div>
            )}
        </motion.div>
    );
}

function SkeletonCard() {
    return (
        <div className="rounded-3xl p-6 border border-gray-100 bg-white shadow-sm h-40 animate-pulse flex flex-col justify-between">
            <div className="flex justify-between items-start">
                <div className="space-y-3 w-2/3">
                    <div className="h-3 bg-gray-200 rounded-full w-1/2" />
                    <div className="h-8 bg-gray-200 rounded-xl w-3/4" />
                </div>
                <div className="w-12 h-12 bg-gray-100 rounded-2xl" />
            </div>
            <div className="h-3 bg-gray-100 rounded-full w-1/2" />
        </div>
    );
}

// --- MAIN PAGE ---

export default function StudentDashboardPage() {
    const { user } = useAuth();
    const [data, setData] = useState<StudentDashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [materialFilter, setMaterialFilter] = useState<"all" | "pdf" | "video">("all");

    useEffect(() => {
        let isMounted = true;
        const loadData = async () => {
            try {
                setLoading(true);
                const dashboardData = await UserService.getStudentDashboard();
                if (isMounted) setData(dashboardData);
            } catch (err) {
                console.error("Dashboard Load Error", err);
            } finally {
                if (isMounted) setLoading(false);
            }
        };
        loadData();
        return () => {
            isMounted = false;
        };
    }, []);

    const formatDate = (isoString: string) =>
        new Date(isoString).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
        });

    const formatTime = (isoString: string) =>
        new Date(isoString).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
        });

    const filteredMaterials = useMemo(() => {
        const list = data?.recentMaterials ?? [];
        if (materialFilter === "all") return list;
        if (materialFilter === "pdf") return list.filter((m) => m.fileType === "pdf");
        return list.filter((m) => m.fileType !== "pdf");
    }, [data?.recentMaterials, materialFilter]);

    const pendingPayments = data?.stats.pendingPaymentsCount ?? 0;

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6 pb-24 sm:pb-8"
        >
            {/* --- HERO BANNER WITH UP-NEXT SPOTLIGHT --- */}
            <motion.section
                variants={itemVariants}
                className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-brand-prussian via-[#0d3a4b] to-brand-cerulean p-6 sm:p-8 text-white shadow-xl shadow-brand-prussian/15"
            >
                {/* Ambient Mesh Glows */}
                <div className="pointer-events-none absolute -top-24 -right-16 w-80 h-80 rounded-full bg-brand-jasmine/20 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-24 left-1/4 w-72 h-72 rounded-full bg-sky-300/15 blur-3xl" />

                <div className="relative z-10 grid grid-cols-1 xl:grid-cols-12 gap-6 items-center">
                    {/* Left Greeting */}
                    <div className="xl:col-span-7 space-y-3">
                        <div className="flex flex-wrap items-center gap-2.5">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-semibold text-brand-jasmine">
                                <Sparkles size={13} />
                                SL Accounting LMS
                            </span>
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/15 backdrop-blur-md text-xs text-white/80">
                                <Calendar size={13} className="text-brand-jasmine" />
                                {new Date().toLocaleDateString("en-US", {
                                    weekday: "short",
                                    month: "short",
                                    day: "numeric",
                                })}
                            </span>
                        </div>

                        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight leading-tight">
                            {getGreeting()}, {user?.firstName || "Student"}!
                        </h1>

                        <p className="text-white/75 text-sm sm:text-base max-w-xl leading-relaxed">
                            Stay on top of your classes, access fresh study materials, and keep your learning momentum going.
                        </p>
                    </div>

                    {/* Right Spotlight: Next Session Card */}
                    <div className="xl:col-span-5">
                        {loading ? (
                            <div className="h-28 rounded-2xl bg-white/10 animate-pulse border border-white/10" />
                        ) : data?.nextSession ? (
                            <div className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 p-4 sm:p-5 flex flex-col sm:flex-row xl:flex-col 2xl:flex-row sm:items-center xl:items-stretch 2xl:items-center justify-between gap-4">
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-brand-jasmine">
                                        <Radio size={13} className="animate-pulse" />
                                        <span>Up Next • {getRelativeDayLabel(data.nextSession.startTime)}</span>
                                    </div>
                                    <h3 className="font-bold text-white text-base mt-1 truncate">
                                        {data.nextSession.title}
                                    </h3>
                                    <p className="text-xs text-white/75 mt-1 flex items-center gap-1.5">
                                        <Clock size={13} />
                                        {formatTime(data.nextSession.startTime)}
                                    </p>
                                </div>

                                <Link
                                    to={
                                        data.nextSession._id
                                            ? `/student/class/${data.nextSession._id}`
                                            : "/student/classes"
                                    }
                                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand-jasmine text-brand-prussian font-bold text-xs sm:text-sm hover:bg-white transition-all shadow-md shrink-0 active:scale-95"
                                >
                                    <PlayCircle size={16} />
                                    <span>Open Class</span>
                                </Link>
                            </div>
                        ) : (
                            <div className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 p-5 flex items-center justify-between gap-4">
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-wider text-brand-jasmine">
                                        All Caught Up
                                    </p>
                                    <p className="text-sm font-semibold text-white mt-1">
                                        No live classes scheduled right now.
                                    </p>
                                    <p className="text-xs text-white/70 mt-0.5">
                                        Great time to revise lesson packs or take a quiz.
                                    </p>
                                </div>
                                <Link
                                    to="/student/lesson-packs"
                                    className="p-3 rounded-xl bg-white/15 hover:bg-brand-jasmine hover:text-brand-prussian transition-colors shrink-0"
                                    aria-label="Go to Lesson Packs"
                                >
                                    <ArrowUpRight size={18} />
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </motion.section>

            {/* --- QUICK STUDY HUB (BENTO SHORTCUTS) --- */}
            <motion.section
                variants={itemVariants}
                className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"
            >
                {STUDY_SHORTCUTS.map((item) => {
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.label}
                            to={item.href}
                            className="group bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-md hover:border-brand-cerulean/30 transition-all duration-200 flex items-center gap-3.5"
                        >
                            <div
                                className={`w-11 h-11 rounded-xl ${item.bg} ${item.color} flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105`}
                            >
                                <Icon size={20} />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="font-bold text-gray-900 text-sm truncate group-hover:text-brand-cerulean transition-colors">
                                    {item.label}
                                </p>
                                <p className="text-[11px] text-gray-400 truncate">{item.desc}</p>
                            </div>
                            <ChevronRight
                                size={16}
                                className="text-gray-300 group-hover:text-brand-cerulean group-hover:translate-x-0.5 transition-all hidden sm:block shrink-0"
                            />
                        </Link>
                    );
                })}
            </motion.section>

            {/* --- STATS GRID --- */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                {loading ? (
                    <>
                        <SkeletonCard />
                        <SkeletonCard />
                        <SkeletonCard />
                    </>
                ) : (
                    <>
                        <StatCard
                            title="My Classes"
                            value={data?.stats.activeClasses || 0}
                            badge="Active"
                            hint="Currently enrolled batches"
                            icon={BookOpen}
                            iconBg="bg-brand-cerulean/10"
                            iconColor="text-brand-cerulean"
                        />

                        <StatCard
                            title="Next Session"
                            value={
                                data?.nextSession ? formatTime(data.nextSession.startTime) : "No Class"
                            }
                            badge={
                                data?.nextSession
                                    ? getRelativeDayLabel(data.nextSession.startTime)
                                    : undefined
                            }
                            hint={data?.nextSession?.title || "Free schedule ahead"}
                            icon={Clock}
                            iconBg="bg-amber-50"
                            iconColor="text-amber-600"
                        />

                        <StatCard
                            title="Payments"
                            value={pendingPayments}
                            badge={pendingPayments > 0 ? "Action Needed" : "Cleared"}
                            hint={
                                pendingPayments > 0
                                    ? "Settle pending dues to keep full access"
                                    : "All monthly fees are up to date"
                            }
                            icon={CreditCard}
                            iconBg={pendingPayments > 0 ? "bg-red-50" : "bg-emerald-50"}
                            iconColor={pendingPayments > 0 ? "text-red-500" : "text-emerald-600"}
                            isAlert={pendingPayments > 0}
                        />
                    </>
                )}
            </div>

            {/* --- MAIN CONTENT GRID --- */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* LEFT COLUMN (2/3) */}
                <div className="lg:col-span-2 space-y-6">
                    {/* 1. UPCOMING SCHEDULE */}
                    <motion.section
                        variants={itemVariants}
                        className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-gray-100"
                    >
                        <div className="flex items-center justify-between mb-5">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-brand-cerulean/10 text-brand-cerulean flex items-center justify-center">
                                    <Calendar size={19} />
                                </div>
                                <div>
                                    <h2 className="font-bold text-lg text-gray-900 leading-tight">
                                        Upcoming Schedule
                                    </h2>
                                    <p className="text-xs text-gray-400">
                                        Your next live online & physical sessions
                                    </p>
                                </div>
                            </div>
                            <Link
                                to="/student/classes"
                                className="inline-flex items-center gap-1 text-xs font-bold text-brand-cerulean hover:text-brand-prussian bg-brand-aliceBlue/70 hover:bg-brand-aliceBlue px-3.5 py-1.5 rounded-full transition-colors"
                            >
                                View All <ArrowUpRight size={14} />
                            </Link>
                        </div>

                        {loading ? (
                            <div className="space-y-3 animate-pulse">
                                {[1, 2].map((i) => (
                                    <div key={i} className="h-24 bg-gray-100 rounded-2xl" />
                                ))}
                            </div>
                        ) : !data?.upcomingSessions || data.upcomingSessions.length === 0 ? (
                            <div className="text-center py-12 px-4 bg-gray-50/80 rounded-2xl border border-dashed border-gray-200">
                                <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center mx-auto mb-3 text-gray-300">
                                    <Calendar size={24} />
                                </div>
                                <p className="text-sm font-bold text-gray-700">
                                    No upcoming sessions scheduled
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                    New class sessions will appear here automatically.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {data.upcomingSessions.map((session, idx) => (
                                    <div
                                        key={session._id || idx}
                                        className="group relative flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border border-gray-100 bg-gray-50/40 hover:bg-white hover:border-brand-cerulean/30 hover:shadow-lg hover:shadow-brand-prussian/5 transition-all duration-200 gap-4"
                                    >
                                        <div className="flex items-start gap-4 min-w-0">
                                            {/* Date Tile */}
                                            <div className="shrink-0 w-14 h-14 rounded-2xl bg-white border border-gray-200/80 shadow-sm flex flex-col items-center justify-center group-hover:border-brand-cerulean/40 transition-colors">
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-cerulean">
                                                    {new Date(session.startTime).toLocaleString("default", {
                                                        month: "short",
                                                    })}
                                                </span>
                                                <span className="text-xl font-extrabold text-gray-900 leading-none mt-0.5">
                                                    {new Date(session.startTime).getDate()}
                                                </span>
                                            </div>

                                            {/* Details */}
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <h4 className="font-bold text-gray-900 text-sm sm:text-base truncate">
                                                        {session.title}
                                                    </h4>
                                                    <span
                                                        className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wide ${session.isOnline
                                                                ? "bg-emerald-50 text-emerald-600"
                                                                : "bg-gray-100 text-gray-600"
                                                            }`}
                                                    >
                                                        {session.isOnline && (
                                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                        )}
                                                        {session.isOnline ? "Online" : "In-Person"}
                                                    </span>
                                                </div>

                                                <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mt-1.5">
                                                    <span className="inline-flex items-center gap-1 font-semibold text-brand-prussian">
                                                        <Clock size={13} className="text-brand-cerulean" />
                                                        {formatTime(session.startTime)}
                                                    </span>
                                                    <span className="text-gray-300">•</span>
                                                    <span className="font-medium text-gray-500">
                                                        {getRelativeDayLabel(session.startTime)}
                                                    </span>
                                                    {session.subject && (
                                                        <span className="px-2.5 py-0.5 bg-brand-aliceBlue/70 text-brand-prussian rounded-full font-semibold text-[11px]">
                                                            {session.subject}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Action */}
                                        <div className="w-full sm:w-auto shrink-0">
                                            {session.isOnline ? (
                                                <Link
                                                    to={`/student/class/${session._id}`}
                                                    className="flex items-center justify-center gap-2 w-full sm:w-auto px-4 py-2.5 bg-brand-cerulean text-white text-xs sm:text-sm font-bold rounded-xl hover:bg-brand-prussian shadow-sm hover:shadow transition-all active:scale-95"
                                                >
                                                    <Video size={16} />
                                                    <span>Join Class</span>
                                                </Link>
                                            ) : (
                                                <div className="flex items-center justify-center gap-1.5 w-full sm:w-auto px-4 py-2.5 bg-gray-100 text-gray-600 text-xs sm:text-sm font-semibold rounded-xl">
                                                    <MapPin size={15} />
                                                    <span>Physical</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </motion.section>

                    {/* 2. RECENT MATERIALS WITH FILTER PILLS */}
                    <motion.section
                        variants={itemVariants}
                        className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-gray-100"
                    >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-brand-cerulean/10 text-brand-cerulean flex items-center justify-center">
                                    <BookOpen size={19} />
                                </div>
                                <div>
                                    <h2 className="font-bold text-lg text-gray-900 leading-tight">
                                        Recent Materials
                                    </h2>
                                    <p className="text-xs text-gray-400">Latest notes, PDFs & recordings</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 self-start sm:self-auto">
                                {/* Filter Pills */}
                                <div className="inline-flex items-center bg-gray-100 p-1 rounded-xl">
                                    {(["all", "pdf", "video"] as const).map((tab) => (
                                        <button
                                            key={tab}
                                            onClick={() => setMaterialFilter(tab)}
                                            className={`px-3 py-1 rounded-lg text-xs font-bold capitalize transition-all ${materialFilter === tab
                                                    ? "bg-white text-brand-prussian shadow-sm"
                                                    : "text-gray-500 hover:text-gray-800"
                                                }`}
                                        >
                                            {tab}
                                        </button>
                                    ))}
                                </div>

                                <Link
                                    to="/student/knowledge-base"
                                    className="inline-flex items-center gap-1 text-xs font-bold text-brand-cerulean hover:text-brand-prussian bg-brand-aliceBlue/70 hover:bg-brand-aliceBlue px-3 py-1.5 rounded-full transition-colors"
                                >
                                    Library <ArrowUpRight size={14} />
                                </Link>
                            </div>
                        </div>

                        {loading ? (
                            <div className="space-y-3 animate-pulse">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="h-16 bg-gray-100 rounded-2xl" />
                                ))}
                            </div>
                        ) : filteredMaterials.length === 0 ? (
                            <div className="text-center py-10 px-4 bg-gray-50/80 rounded-2xl border border-dashed border-gray-200">
                                <FileText className="mx-auto text-gray-300 mb-2" size={28} />
                                <p className="text-sm font-semibold text-gray-600">
                                    No {materialFilter === "all" ? "" : materialFilter.toUpperCase()} materials found.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-2.5">
                                {filteredMaterials.map((material) => {
                                    const isPdf = material.fileType === "pdf";
                                    return (
                                        <a
                                            key={material._id}
                                            href={BASE_URL + material.fileUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="group flex items-center justify-between p-3.5 rounded-2xl border border-gray-100 hover:border-brand-cerulean/30 hover:bg-brand-aliceBlue/25 transition-all"
                                        >
                                            <div className="flex items-center gap-3.5 min-w-0">
                                                <div
                                                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isPdf
                                                            ? "bg-red-50 text-red-500"
                                                            : "bg-blue-50 text-blue-600"
                                                        }`}
                                                >
                                                    {isPdf ? <FileText size={20} /> : <Video size={20} />}
                                                </div>
                                                <div className="min-w-0">
                                                    <h4 className="font-semibold text-gray-800 text-sm truncate group-hover:text-brand-cerulean transition-colors">
                                                        {material.title}
                                                    </h4>
                                                    <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                                                        <span
                                                            className={`uppercase font-bold text-[10px] px-1.5 py-0.5 rounded ${isPdf
                                                                    ? "bg-red-50 text-red-500"
                                                                    : "bg-blue-50 text-blue-600"
                                                                }`}
                                                        >
                                                            {material.fileType}
                                                        </span>
                                                        <span>•</span>
                                                        <span>Added {formatDate(material.createdAt)}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="shrink-0 ml-3 inline-flex items-center gap-1.5 text-xs font-bold text-brand-cerulean bg-brand-aliceBlue/60 group-hover:bg-brand-cerulean group-hover:text-white px-3 py-1.5 rounded-xl transition-colors">
                                                <span className="hidden sm:inline">Open</span>
                                                <ExternalLink size={13} />
                                            </div>
                                        </a>
                                    );
                                })}
                            </div>
                        )}
                    </motion.section>
                </div>

                {/* RIGHT COLUMN (1/3 Sidebar) */}
                <aside className="space-y-6">
                    {/* 1. PAYMENT STATUS WIDGET */}
                    <motion.div
                        variants={itemVariants}
                        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-prussian via-[#0b3342] to-[#071f29] p-6 text-white shadow-xl shadow-brand-prussian/15"
                    >
                        <div className="pointer-events-none absolute -top-12 -right-12 w-40 h-40 bg-brand-jasmine/15 rounded-full blur-2xl" />
                        <div className="pointer-events-none absolute bottom-0 left-0 w-32 h-32 bg-brand-cerulean/20 rounded-full blur-2xl" />

                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-5">
                                <h3 className="font-bold text-base flex items-center gap-2">
                                    <AlertCircle size={18} className="text-brand-jasmine" />
                                    <span>Payment Status</span>
                                </h3>
                                <span
                                    className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${data?.nextPayment
                                            ? "bg-amber-400/20 text-brand-jasmine border border-amber-300/20"
                                            : "bg-emerald-400/20 text-emerald-300 border border-emerald-300/20"
                                        }`}
                                >
                                    {data?.nextPayment ? "Payment Due" : "Up to Date"}
                                </span>
                            </div>

                            {data?.nextPayment ? (
                                <div>
                                    <div className="bg-white/10 backdrop-blur-md border border-white/15 p-4 rounded-2xl mb-5">
                                        <p className="text-[11px] text-white/65 uppercase tracking-wider font-bold">
                                            Amount Due
                                        </p>
                                        <p className="text-3xl font-extrabold text-brand-jasmine mt-1 tracking-tight">
                                            LKR {Number(data.nextPayment.amount).toLocaleString()}
                                        </p>
                                    </div>

                                    <Link
                                        to="/student/payments"
                                        className="flex items-center justify-center gap-2 w-full py-3 bg-brand-jasmine text-brand-prussian font-bold rounded-xl hover:bg-white transition-colors text-sm shadow-md active:scale-[0.98]"
                                    >
                                        <span>View & Pay Now</span>
                                        <ChevronRight size={16} />
                                    </Link>
                                </div>
                            ) : (
                                <div className="py-5 flex flex-col items-center text-center">
                                    <div className="w-14 h-14 bg-emerald-500/20 border border-emerald-400/30 rounded-2xl flex items-center justify-center mb-3 shadow-inner">
                                        <CheckCircle2 size={28} className="text-emerald-400" />
                                    </div>
                                    <p className="text-white font-bold text-sm">All payments cleared!</p>
                                    <p className="text-white/65 text-xs mt-1 max-w-[220px] leading-relaxed">
                                        Your class access is active through the end of the month.
                                    </p>
                                </div>
                            )}
                        </div>
                    </motion.div>

                    {/* 2. QUICK ACTIONS */}
                    <motion.div
                        variants={itemVariants}
                        className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100"
                    >
                        <h3 className="font-bold text-gray-900 mb-3 text-sm px-1">Quick Actions</h3>
                        <div className="space-y-1.5">
                            <Link
                                to="/student/Profile"
                                className="group flex items-center justify-between p-3 rounded-2xl hover:bg-gray-50 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-brand-cerulean/10 text-brand-cerulean flex items-center justify-center">
                                        <User size={17} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-gray-800 group-hover:text-brand-cerulean transition-colors">
                                            Edit Profile
                                        </p>
                                        <p className="text-[11px] text-gray-400">Update personal details</p>
                                    </div>
                                </div>
                                <ChevronRight
                                    size={16}
                                    className="text-gray-300 group-hover:text-brand-cerulean group-hover:translate-x-0.5 transition-all"
                                />
                            </Link>

                            <Link
                                to="/student/payments"
                                className="group flex items-center justify-between p-3 rounded-2xl hover:bg-gray-50 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                        <Receipt size={17} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-gray-800 group-hover:text-brand-cerulean transition-colors">
                                            Payment History
                                        </p>
                                        <p className="text-[11px] text-gray-400">Receipts & past invoices</p>
                                    </div>
                                </div>
                                <ChevronRight
                                    size={16}
                                    className="text-gray-300 group-hover:text-brand-cerulean group-hover:translate-x-0.5 transition-all"
                                />
                            </Link>

                            <Link
                                to="/student/tickets"
                                className="group flex items-center justify-between p-3 rounded-2xl hover:bg-gray-50 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                                        <HelpCircle size={17} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-gray-800 group-hover:text-brand-cerulean transition-colors">
                                            Need Help?
                                        </p>
                                        <p className="text-[11px] text-gray-400">Open a support ticket</p>
                                    </div>
                                </div>
                                <ChevronRight
                                    size={16}
                                    className="text-gray-300 group-hover:text-brand-cerulean group-hover:translate-x-0.5 transition-all"
                                />
                            </Link>
                        </div>
                    </motion.div>
                </aside>
            </div>
        </motion.div>
    );
}