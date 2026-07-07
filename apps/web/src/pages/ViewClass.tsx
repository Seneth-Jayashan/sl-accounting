import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
    Tag
} from "lucide-react";

// Services & Context
import ClassService from "../services/ClassService";
import EnrollmentService from "../services/EnrollmentService";
import { useAuth } from "../contexts/AuthContext";
import LoadingPage from "../components/LoadingPage";

// --- Configuration ---
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

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
    price: number;
    level: string;
    batch: any;
    coverImage?: string;
    timeSchedules: Schedule[];
    tags?: string[];
    sessionDurationMinutes?: number;
    totalSessions?: number;
    recurrence?: string;
}

// --- Animation Variants ---
const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

export default function ViewPublicClassPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [classData, setClassData] = useState<ClassData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isEnrolled, setIsEnrolled] = useState(false);

    const getDayName = (dayIndex: number) =>
        ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][dayIndex] || "";

    const formatTitle = (title: string) => {
        if (!title) return null;
        const words = title.trim().split(' ');
        if (words.length <= 1) return <span className="text-[#0d4b5b]">{title}</span>;
        const lastWord = words.pop();
        return (
            <>
                <span className="text-[#0d4b5b]">{words.join(' ')} </span>
                <span className="text-[#f88f89]">{lastWord}</span>
            </>
        );
    };

    useEffect(() => {
        if (!id) return;

        let isMounted = true;
        const fetchData = async () => {
            setLoading(true);
            try {
                const data = await ClassService.getPublicClassById(id);
                if (isMounted) setClassData(Array.isArray(data) ? data[0] : data);
                if (user) {
                    try {
                        const status = await EnrollmentService.checkEnrollmentStatus(id);
                        if (isMounted) setIsEnrolled(status);
                    } catch (e) {
                        console.warn("Enrollment check failed", e);
                    }
                }
            } catch (err) {
                console.error(err);
                if (isMounted) setError("Class not found or unavailable.");
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchData();
        return () => { isMounted = false; };
    }, [id, user]);

    const handleEnrollClick = () => {
        if (!classData) return;
        const targetEnrollmentPage = `/student/enrollment/${classData._id}`;
        if (user) {
            navigate(targetEnrollmentPage);
        } else {
            navigate("/login", { state: { from: targetEnrollmentPage } });
        }
    };

    if (loading) return <LoadingPage />;

    if (error || !classData) {
        return (
            <div className="min-h-screen bg-[#f9fbff] flex flex-col items-center justify-center text-center p-6">
                <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mb-6">
                    <BookOpen className="w-10 h-10 text-red-400" />
                </div>
                <h2 className="text-3xl font-bold text-[#0d4b5b] mb-2 font-sinhala">සමාවන්න! (Oops!)</h2>
                <p className="text-gray-500 mb-8 max-w-md">{error || "We couldn't find the class you are looking for."}</p>
                <button
                    onClick={() => navigate("/classes")}
                    className="bg-[#0d4b5b] text-white px-8 py-3 rounded-md hover:bg-[#093946] transition-colors font-bold shadow-sm flex items-center gap-2"
                >
                    <ArrowLeft size={20} /> Browse All Classes
                </button>
            </div>
        );
    }

    const schedule = classData.timeSchedules && classData.timeSchedules[0];

    return (
        <div className="min-h-screen font-sans text-gray-900 bg-white">

            {/* --- HERO HEADER SECTION (PADDING ADJUSTED) --- */}
            <div className="bg-[#f9fbff] pt-36 pb-12 sm:pt-48 sm:pb-16">
                <div className="container mx-auto px-4 sm:px-6 max-w-6xl">
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={fadeInUp}
                        className="flex items-start gap-4 sm:gap-6"
                    >
                        <button
                            onClick={() => navigate(-1)}
                            className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-full bg-[#e6ecef] text-[#0d4b5b] hover:bg-[#d0dbe1] transition-colors mt-1"
                            aria-label="Go Back"
                        >
                            <ArrowLeft size={18} />
                        </button>

                        <div>
                            <div className="flex items-center flex-wrap gap-3 mb-6">
                                <span className="bg-[#0d4b5b] text-white px-5 py-2 rounded-full text-xs font-bold capitalize">
                                    {classData.level}
                                </span>

                                {classData.batch && (
                                    <span className="bg-[#f88f89]/40 text-[#0d4b5b] px-5 py-2 rounded-full text-xs font-bold flex items-center gap-2">
                                        <GraduationCap size={14} /> {typeof classData.batch === 'object' ? classData.batch.name : 'Batch'}
                                    </span>
                                )}
                            </div>

                            <h1 className="text-4xl sm:text-5xl md:text-[3.5rem] font-black mb-6 leading-tight">
                                {formatTitle(classData.name)}
                            </h1>

                            <p className="text-gray-700 text-base sm:text-lg max-w-xl font-medium leading-relaxed">
                                Master accounting concepts with expert guidance and comprehensive study materials.
                            </p>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* --- CONTENT CONTAINER (PADDING ADJUSTED) --- */}
            <div className="container mx-auto px-4 sm:px-6 pt-12 pb-20 max-w-6xl">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="lg:col-span-2 space-y-8"
                    >
                        <div className="bg-[#f8fafc] rounded-2xl p-8 border border-gray-100">
                            <h3 className="text-2xl font-bold text-[#0d4b5b] mb-6 flex items-center gap-3">
                                <Clock className="text-[#0d4b5b]" size={24} /> Class Schedule
                            </h3>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="bg-white p-5 rounded-xl flex items-center gap-4 border border-gray-100 shadow-sm">
                                    <div className="w-12 h-12 bg-[#f8fafc] rounded-lg flex items-center justify-center text-[#0d4b5b] shrink-0 border border-gray-50">
                                        <Calendar size={20} />
                                    </div>
                                    <div>
                                        <p className="text-[11px] text-[#0d4b5b] font-bold uppercase tracking-wider mb-0.5">Class Day</p>
                                        <p className="text-gray-600 text-sm font-medium">{schedule ? `${getDayName(schedule.day)}` : "TBA"}</p>
                                    </div>
                                </div>
                                <div className="bg-white p-5 rounded-xl flex items-center gap-4 border border-gray-100 shadow-sm">
                                    <div className="w-12 h-12 bg-[#f8fafc] rounded-lg flex items-center justify-center text-[#0d4b5b] shrink-0 border border-gray-50">
                                        <Clock size={20} />
                                    </div>
                                    <div>
                                        <p className="text-[11px] text-[#0d4b5b] font-bold uppercase tracking-wider mb-0.5">Time</p>
                                        <p className="text-gray-600 text-sm font-medium">{schedule ? `${schedule.startTime} - ${schedule.endTime}` : "TBA"}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-[#f8fafc] rounded-2xl p-8 border border-gray-100">
                            <h3 className="text-2xl font-bold text-[#0d4b5b] mb-6 flex items-center gap-3">
                                <BookOpen className="text-[#0d4b5b]" size={24} /> About this Class
                            </h3>
                            <div className="text-gray-600 text-sm sm:text-base font-sans leading-relaxed whitespace-pre-wrap">
                                {classData.description}
                            </div>

                            {classData.tags && classData.tags.length > 0 && (
                                <div className="mt-8 pt-8 border-t border-gray-200">
                                    <p className="text-xs font-bold text-gray-400 mb-4 uppercase tracking-widest flex items-center gap-2">
                                        <Tag size={14} /> Topics Covered
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {classData.tags.map((tag, idx) => (
                                            <span key={idx} className="bg-white text-[#0d4b5b] px-4 py-2 rounded-md text-xs font-bold border border-gray-100 shadow-sm">
                                                #{tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 }}
                        className="lg:col-span-1"
                    >
                        <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm sticky top-28">
                            <div className="text-center mb-8 pb-8 border-b border-gray-100">
                                <p className="text-lg text-[#0d4b5b] font-bold mb-3 font-sinhala">මාසික ගාස්තු</p>
                                <div className="flex items-center justify-center gap-2 text-[#0d4b5b]">
                                    <span className="text-xl font-bold">LKR</span>
                                    <span className="text-5xl font-black">{classData.price.toLocaleString()}</span>
                                </div>
                            </div>

                            <div className="space-y-4 mb-10">
                                {[
                                    "Access to all live sessions via Zoom",
                                    "Full recording access for revision",
                                    "Downloadable study materials (PDF)",
                                    "Interactive Q&A with instructor",
                                    "LMS Access 24/7"
                                ].map((feature, i) => (
                                    <div key={i} className="flex items-start gap-3">
                                        <div className="mt-0.5 w-5 h-5 flex items-center justify-center flex-shrink-0">
                                            <CheckCircle2 size={18} className="text-green-500" />
                                        </div>
                                        <p className="text-sm text-gray-600 font-medium">{feature}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="space-y-4">
                                <AnimatePresence mode="wait">
                                    {isEnrolled ? (
                                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-3">
                                            <div className="w-full bg-green-50 text-green-700 border border-green-200 font-bold py-3.5 rounded-md flex items-center justify-center gap-2 cursor-default text-sm">
                                                <CheckCircle2 size={18} /> Already Enrolled
                                            </div>
                                            <button className="w-full bg-[#0d4b5b] text-white font-bold py-3.5 rounded-md hover:bg-[#093946] transition-colors flex items-center justify-center gap-2 text-sm shadow-sm" onClick={() => navigate("/student/dashboard")}>
                                                Go to Dashboard <ArrowRight size={18} />
                                            </button>
                                        </motion.div>
                                    ) : (
                                        <motion.button initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="w-full bg-[#0d4b5b] text-white font-bold py-3.5 rounded-md hover:bg-[#093946] transition-colors flex items-center justify-center gap-2 text-sm shadow-sm" onClick={handleEnrollClick}>
                                            Enroll Now <ArrowRight size={18} />
                                        </motion.button>
                                    )}
                                </AnimatePresence>

                                {!isEnrolled && (
                                    <button className="w-full bg-[#f1f5f9] text-[#0d4b5b] font-bold py-3 rounded-md hover:bg-[#e2e8f0] transition-colors flex items-center justify-center gap-2 text-sm" onClick={() => { navigator.clipboard.writeText(window.location.href); alert("Link copied!"); }}>
                                        <Share2 size={16} /> Share Class
                                    </button>
                                )}
                            </div>

                            <p className="text-[10px] text-center text-gray-400 mt-6 leading-relaxed">
                                By enrolling, you agree to our Terms of Service and Privacy Policy.
                            </p>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}