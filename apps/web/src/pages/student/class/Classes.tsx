import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
    ArrowRight,
    Clock,
    ShieldAlert,
    Sparkles,
    Zap,
    UploadCloud,
    Calendar,
    BookOpen,
    Search,
    CheckCircle2,
    Hourglass,
    Plus,
    X,
} from "lucide-react";

import EnrollmentService, {
    type EnrollmentResponse,
    type EnrolledClass,
} from "../../../services/EnrollmentService";
import { useAuth } from "../../../contexts/AuthContext";

// --- Configuration ---
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

// --- Helpers ---
const getClassDetails = (cls: EnrolledClass | string): EnrolledClass => {
    if (typeof cls === "string") {
        return { _id: cls, name: "Unknown Class", price: 0, coverImage: "" };
    }
    return cls;
};

const getImageUrl = (path?: string) => {
    if (!path) return null;
    if (path.startsWith("http")) return path;
    return `${API_BASE_URL}/${path.replace(/\\/g, "/").replace(/^\/+/, "")}`;
};

const formatDate = (dateString?: string) => {
    if (!dateString) return "Lifetime";
    return new Date(dateString).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
};

// --- Animations ---
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.06 },
    },
};

const cardVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as const },
    },
};

export default function ViewEnrollments() {
    const navigate = useNavigate();
    const { user } = useAuth();

    const [enrollments, setEnrollments] = useState<EnrollmentResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<"all" | "paid" | "pending">("all");
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        let isMounted = true;
        const fetchEnrollments = async () => {
            if (!user) return;
            try {
                const data = await EnrollmentService.getMyEnrollments();
                if (isMounted) setEnrollments(data || []);
            } catch (error) {
                console.error("Failed to fetch enrollments", error);
            } finally {
                if (isMounted) setLoading(false);
            }
        };
        fetchEnrollments();
        return () => {
            isMounted = false;
        };
    }, [user]);

    // Only include class enrollments (exclude lesson packs)
    const classEnrollments = useMemo(
        () => enrollments.filter((e) => !e.lessonPack),
        [enrollments]
    );

    const counts = useMemo(() => {
        const paid = classEnrollments.filter(
            (e) => (e.paymentStatus || "").toLowerCase() === "paid"
        ).length;
        return {
            all: classEnrollments.length,
            paid,
            pending: classEnrollments.length - paid,
        };
    }, [classEnrollments]);

    const filteredEnrollments = useMemo(() => {
        return classEnrollments.filter((e) => {
            const status = (e.paymentStatus || "").toLowerCase();
            const isPaid = status === "paid";

            if (filter === "paid" && !isPaid) return false;
            if (filter === "pending" && isPaid) return false;

            if (searchQuery.trim()) {
                const classObj = getClassDetails(e.class);
                return classObj.name.toLowerCase().includes(searchQuery.toLowerCase());
            }
            return true;
        });
    }, [classEnrollments, filter, searchQuery]);

    return (
        <div className="space-y-6 pb-24 sm:pb-10">
            {/* --- HERO HEADER --- */}
            <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-brand-prussian via-[#0d3a4b] to-brand-cerulean p-6 sm:p-8 text-white shadow-xl shadow-brand-prussian/15">
                <div className="pointer-events-none absolute -top-20 -right-16 w-72 h-72 rounded-full bg-brand-jasmine/20 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-24 left-1/3 w-64 h-64 rounded-full bg-white/10 blur-3xl" />

                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-semibold text-brand-jasmine mb-3">
                            <BookOpen size={13} />
                            <span>My Learning</span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                            Enrolled Classes
                        </h1>
                        <p className="text-white/75 text-sm sm:text-base mt-1">
                            Welcome back,{" "}
                            <span className="text-brand-jasmine font-semibold">
                                {user?.firstName || "Student"}
                            </span>
                            . Pick up right where you left off.
                        </p>
                    </div>

                    <button
                        onClick={() => navigate("/classes")}
                        className="inline-flex items-center justify-center gap-2 bg-brand-jasmine text-brand-prussian px-5 py-3 rounded-2xl text-sm font-bold hover:bg-white transition-all shadow-lg active:scale-95 shrink-0 self-start md:self-auto"
                    >
                        <Plus size={18} />
                        <span>Explore New Classes</span>
                    </button>
                </div>
            </section>

            {/* --- FILTER & SEARCH TOOLBAR --- */}
            <div className="bg-white rounded-2xl p-3 sm:p-4 border border-gray-100 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                {/* Filter Tabs */}
                <div className="flex items-center gap-1.5 bg-gray-100/80 p-1 rounded-xl overflow-x-auto scrollbar-hide">
                    {(
                        [
                            { key: "all", label: "All Courses", count: counts.all },
                            { key: "paid", label: "Active", count: counts.paid },
                            { key: "pending", label: "Pending", count: counts.pending },
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
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search your classes..."
                        className="w-full pl-10 pr-9 py-2.5 text-sm bg-gray-50 border border-gray-200/80 rounded-xl focus:outline-none focus:bg-white focus:border-brand-cerulean focus:ring-2 focus:ring-brand-cerulean/15 transition-all"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery("")}
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
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                        <div
                            key={i}
                            className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm animate-pulse"
                        >
                            <div className="h-48 bg-gray-200" />
                            <div className="p-6 space-y-4">
                                <div className="h-5 bg-gray-200 rounded-lg w-3/4" />
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="h-12 bg-gray-100 rounded-xl" />
                                    <div className="h-12 bg-gray-100 rounded-xl" />
                                </div>
                                <div className="h-12 bg-gray-200 rounded-2xl" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : filteredEnrollments.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white rounded-3xl p-12 sm:p-16 text-center flex flex-col items-center border border-dashed border-gray-200 shadow-sm"
                >
                    <div className="w-20 h-20 bg-brand-aliceBlue rounded-3xl flex items-center justify-center mb-5 text-brand-cerulean">
                        <Sparkles size={34} />
                    </div>
                    <h3 className="text-xl sm:text-2xl font-extrabold text-brand-prussian mb-2">
                        {searchQuery
                            ? "No matching classes found"
                            : filter === "all"
                                ? "No Courses Enrolled Yet"
                                : `No ${filter} courses`}
                    </h3>
                    <p className="text-gray-500 text-sm max-w-md mb-8">
                        {searchQuery
                            ? `We couldn't find any enrolled class matching "${searchQuery}".`
                            : "Explore our curriculum to join live classes, access study packs, and start learning."}
                    </p>
                    {searchQuery ? (
                        <button
                            onClick={() => setSearchQuery("")}
                            className="px-6 py-3 rounded-xl bg-gray-100 text-gray-700 font-bold text-sm hover:bg-gray-200 transition-colors"
                        >
                            Clear Search
                        </button>
                    ) : (
                        <button
                            onClick={() => navigate("/classes")}
                            className="bg-brand-prussian text-white px-7 py-3.5 rounded-2xl font-bold text-sm hover:bg-brand-cerulean transition-all shadow-lg flex items-center gap-2 active:scale-95"
                        >
                            <span>Explore Curriculum</span>
                            <ArrowRight size={18} />
                        </button>
                    )}
                </motion.div>
            ) : (
                <motion.div
                    key={`${filter}-${searchQuery}`}
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
                >
                    {filteredEnrollments.map((enrollment) => {
                        const classObj = getClassDetails(enrollment.class);
                        const classImage = getImageUrl(classObj.coverImage);
                        const status = (enrollment.paymentStatus || "").toLowerCase();
                        const isPaid = status === "paid";
                        const isPending = status === "pending";
                        const isExpired =
                            Boolean(enrollment.accessEndDate) &&
                            new Date(enrollment.accessEndDate as string) < new Date();

                        return (
                            <motion.article
                                key={enrollment._id}
                                variants={cardVariants}
                                className="group bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-brand-prussian/8 hover:-translate-y-1 transition-all duration-300 flex flex-col"
                            >
                                {/* COVER IMAGE */}
                                <div className="relative h-48 overflow-hidden bg-brand-prussian">
                                    {classImage ? (
                                        <img
                                            src={classImage}
                                            alt={classObj.name}
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-brand-cerulean to-brand-prussian flex items-center justify-center">
                                            <BookOpen size={40} className="text-white/25" />
                                        </div>
                                    )}

                                    {/* Subtle Scrim for Badge Readability */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />

                                    {/* Top Badges */}
                                    <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between gap-2">
                                        <span
                                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider backdrop-blur-md border shadow-sm ${isPaid
                                                    ? "bg-emerald-500/90 border-emerald-400/40 text-white"
                                                    : isPending
                                                        ? "bg-amber-500/90 border-amber-300/40 text-white"
                                                        : "bg-red-500/90 border-red-400/40 text-white"
                                                }`}
                                        >
                                            {isPaid ? (
                                                <CheckCircle2 size={12} />
                                            ) : isPending ? (
                                                <Hourglass size={12} />
                                            ) : (
                                                <ShieldAlert size={12} />
                                            )}
                                            {isPaid ? "Active" : isPending ? "Verifying" : "Payment Due"}
                                        </span>

                                        {isExpired && (
                                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-black/65 text-red-200 backdrop-blur-md border border-white/15">
                                                Expired
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* BODY */}
                                <div className="p-5 sm:p-6 flex-1 flex flex-col">
                                    <h3 className="text-lg font-extrabold text-brand-prussian leading-snug line-clamp-2 group-hover:text-brand-cerulean transition-colors">
                                        {classObj.name}
                                    </h3>

                                    {/* Metadata Grid */}
                                    <div className="grid grid-cols-2 gap-2.5 mt-4 mb-6">
                                        <div className="rounded-2xl bg-gray-50 border border-gray-100 p-3">
                                            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
                                                <Calendar size={12} className="text-brand-cerulean" />
                                                <span>Joined</span>
                                            </div>
                                            <p className="text-xs sm:text-sm font-bold text-gray-800 mt-1 truncate">
                                                {formatDate(enrollment.createdAt)}
                                            </p>
                                        </div>

                                        <div
                                            className={`rounded-2xl border p-3 ${isExpired
                                                    ? "bg-red-50/70 border-red-100"
                                                    : "bg-gray-50 border-gray-100"
                                                }`}
                                        >
                                            <div
                                                className={`flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide ${isExpired ? "text-red-500" : "text-gray-400"
                                                    }`}
                                            >
                                                <Clock
                                                    size={12}
                                                    className={isExpired ? "text-red-500" : "text-brand-cerulean"}
                                                />
                                                <span>Access Ends</span>
                                            </div>
                                            <p
                                                className={`text-xs sm:text-sm font-bold mt-1 truncate ${isExpired ? "text-red-600" : "text-gray-800"
                                                    }`}
                                            >
                                                {formatDate(enrollment.accessEndDate)}
                                            </p>
                                        </div>
                                    </div>

                                    {/* ACTION AREA */}
                                    <div className="mt-auto">
                                        {isPaid ? (
                                            <button
                                                onClick={() => navigate(`/student/class/${classObj._id}`)}
                                                className="w-full bg-brand-prussian text-white py-3.5 px-5 rounded-2xl font-bold text-sm flex items-center justify-between group/btn hover:bg-brand-cerulean transition-all shadow-md shadow-brand-prussian/15 active:scale-[0.98]"
                                            >
                                                <span>Continue Learning</span>
                                                <span className="w-7 h-7 rounded-xl bg-white/15 flex items-center justify-center group-hover/btn:bg-white group-hover/btn:text-brand-cerulean transition-colors">
                                                    <ArrowRight size={15} />
                                                </span>
                                            </button>
                                        ) : isPending ? (
                                            <div className="flex items-center gap-2.5">
                                                <div className="flex-1 py-3 px-4 rounded-2xl bg-amber-50 border border-amber-200/70 text-amber-700 text-xs font-bold flex items-center justify-center gap-2">
                                                    <Hourglass size={15} />
                                                    <span>Slip Under Review</span>
                                                </div>
                                                <button
                                                    onClick={() =>
                                                        navigate(`/student/payment/upload/${enrollment._id}`)
                                                    }
                                                    title="Re-upload Payment Slip"
                                                    className="p-3 rounded-2xl bg-white border border-gray-200 text-gray-600 hover:border-brand-prussian hover:text-brand-prussian transition-colors"
                                                >
                                                    <UploadCloud size={18} />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2.5">
                                                <button
                                                    onClick={() =>
                                                        navigate(`/student/payment/create/${classObj._id}`)
                                                    }
                                                    className="flex-1 bg-brand-coral text-white py-3.5 px-4 rounded-2xl font-bold text-sm hover:bg-red-600 transition-all shadow-md shadow-brand-coral/20 flex items-center justify-center gap-2 active:scale-[0.98]"
                                                >
                                                    <Zap size={16} fill="currentColor" />
                                                    <span>Pay Now</span>
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        navigate(`/student/payment/upload/${enrollment._id}`)
                                                    }
                                                    title="Upload Bank Slip"
                                                    className="px-4 py-3.5 rounded-2xl bg-gray-50 border border-gray-200 text-gray-600 hover:bg-white hover:border-brand-prussian hover:text-brand-prussian transition-all flex items-center justify-center gap-1.5 text-xs font-bold"
                                                >
                                                    <UploadCloud size={18} />
                                                    <span className="hidden sm:inline">Slip</span>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.article>
                        );
                    })}
                </motion.div>
            )}
        </div>
    );
}