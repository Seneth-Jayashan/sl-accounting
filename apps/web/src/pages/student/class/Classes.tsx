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
  Book
} from "lucide-react";

import EnrollmentService, { type EnrollmentResponse, type EnrolledClass } from "../../../services/EnrollmentService";
import { useAuth } from "../../../contexts/AuthContext";

// --- Configuration ---
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

// --- Helpers ---
const getClassDetails = (cls: EnrolledClass | string): EnrolledClass => {
    if (typeof cls === 'string') return { _id: cls, name: "Unknown Class", price: 0, coverImage: "" };
    return cls;
};

const getImageUrl = (path?: string) => {
    if (!path) return null;
    if (path.startsWith("http")) return path;
    return `${API_BASE_URL}/${path.replace(/\\/g, "/").replace(/^\/+/, "")}`;
};

const formatDate = (dateString?: string) => {
    if (!dateString) return "Lifetime Access";
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export default function ViewEnrollments() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [enrollments, setEnrollments] = useState<EnrollmentResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "paid" | "pending">("all");

  useEffect(() => {
    let isMounted = true;
    const fetchEnrollments = async () => {
      if (!user) return;
      try {
        const data = await EnrollmentService.getMyEnrollments();
        if (isMounted) setEnrollments(data || []);
      } catch (error) {
        console.error("Failed to fetch enrollments");
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchEnrollments();
    return () => { isMounted = false; };
  }, [user]);

  const filteredEnrollments = useMemo(() => {
      return enrollments.filter(e => {
          const status = (e.paymentStatus || "").toLowerCase();
          const isPaid = status === 'paid';
          if (filter === "all") return true;
          if (filter === "paid") return isPaid;
          if (filter === "pending") return !isPaid;
          return true;
      });
  }, [enrollments, filter]);

  return (
      <div className="min-h-screen bg-[#F8FAFC] pb-32">
        
        {/* --- Modern Hero Header --- */}
        <div className="relative bg-white border-b border-gray-100 pt-10 pb-16 px-6 sm:px-10 overflow-hidden">
            <div className="max-w-7xl mx-auto relative z-10">
                <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-8">
                    <div>
                        <motion.h1 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-xl sm:text-3xl font-black text-brand-prussian tracking-tight mb-2"
                        >
                            My Learning
                        </motion.h1>
                        <motion.p 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-gray-500 font-medium text-base"
                        >
                            Welcome back, <span className="text-brand-cerulean font-bold">{user?.firstName}</span>.
                        </motion.p>
                    </div>

                    <div className="flex items-center gap-3 bg-gray-50 p-1.5 rounded-2xl border border-gray-200">
                        {(['all', 'paid', 'pending'] as const).map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-6 py-2.5 text-sm font-bold rounded-xl capitalize transition-all duration-300 ${
                                    filter === f 
                                    ? "bg-white text-brand-prussian shadow-lg shadow-gray-200 ring-1 ring-black/5" 
                                    : "text-gray-400 hover:text-gray-600"
                                }`}
                            >
                                {f === 'all' ? 'All Courses' : f}
                            </button>
                        ))}

                        <button
                            onClick={() => navigate(`/classes`)}
                            className="flex items-center gap-2 bg-brand-prussian text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-brand-cerulean transition-all shadow-sm active:scale-95 shrink-0"
                        >
                            <Book size={16} />
                            <span className="hidden sm:inline">New Classes</span>
                            <span className="sm:hidden">Class</span>
                        </button>
                    </div>
                </div>
            </div>
            
            {/* Decorative Background Blur */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-brand-cerulean/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        </div>

        {/* --- Content Grid --- */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 -mt-8 relative z-20">
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="bg-white h-[420px] rounded-3xl animate-pulse shadow-sm"></div>
                    ))}
                </div>
            ) : filteredEnrollments.length === 0 ? (
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white rounded-[2.5rem] p-16 text-center flex flex-col items-center shadow-xl shadow-gray-100 border border-white"
                >
                    <div className="w-24 h-24 bg-brand-aliceBlue/50 rounded-full flex items-center justify-center mb-6">
                        <Sparkles className="w-10 h-10 text-brand-cerulean" />
                    </div>
                    <h3 className="text-2xl font-bold text-brand-prussian mb-2">No Courses Found</h3>
                    <p className="text-gray-400 mb-8 font-medium">It looks like you haven't enrolled in any classes yet.</p>
                    <button 
                        onClick={() => navigate("/classes")}
                        className="bg-brand-prussian text-white px-8 py-4 rounded-2xl font-bold hover:bg-brand-cerulean transition-all shadow-lg hover:shadow-xl flex items-center gap-2 active:scale-95"
                    >
                        Explore Curriculum <ArrowRight size={20} />
                    </button>
                </motion.div>
            ) : (
                <motion.div 
                    key={filter}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ staggerChildren: 0.1 }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                >
                    {filteredEnrollments.map((enrollment) => {
                        const classObj = getClassDetails(enrollment.class);
                        const classImage = getImageUrl(classObj.coverImage);
                        const status = (enrollment.paymentStatus || "").toLowerCase();
                        const isPaid = status === 'paid';
                        const isExpired = enrollment.accessEndDate && new Date(enrollment.accessEndDate) < new Date();

                        return (
                            <motion.div 
                                key={enrollment._id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                whileHover={{ y: -5 }}
                                className="group relative bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl hover:shadow-brand-cerulean/10 transition-all duration-500 border border-gray-100 flex flex-col"
                            >
                                {/* IMAGE SECTION */}
                                <div className="h-56 relative overflow-hidden bg-gray-100">
                                    {classImage ? (
                                        <img 
                                            src={classImage} 
                                            alt={classObj.name} 
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-brand-cerulean to-brand-prussian"></div>
                                    )}
                                    {/* Gradient Fade */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent opacity-90"></div>

                                    {/* Glass Status Badge */}
                                    <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
                                        <div className={`backdrop-blur-md px-3 py-1.5 rounded-full border shadow-sm flex items-center gap-2 ${
                                            isPaid 
                                            ? "bg-white/80 border-white/50 text-green-700" 
                                            : "bg-white/90 border-white/50 text-brand-coral"
                                        }`}>
                                            <div className={`w-2 h-2 rounded-full ${isPaid ? "bg-green-500" : "bg-brand-coral animate-pulse"}`}></div>
                                            <span className="text-[10px] font-bold uppercase tracking-widest">
                                                {isPaid ? "Active" : status === 'pending' ? "Verifying" : "Locked"}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* CONTENT SECTION */}
                                <div className="px-6 pb-6 -mt-12 relative z-10 flex-1 flex flex-col">
                                    {/* Title Card */}
                                    <div className="bg-white rounded-2xl p-5 shadow-lg shadow-gray-100/50 border border-gray-50 mb-4">
                                        <h3 className="text-lg font-bold text-brand-prussian leading-snug line-clamp-2 mb-2 group-hover:text-brand-cerulean transition-colors">
                                            {classObj.name}
                                        </h3>
                                        <div className="flex items-left text-sm font-medium text-brand-prussian flex-col">
                                            <div className="flex items-center gap-1.5">
                                                <Calendar size={14} className="text-brand-cerulean"/>
                                                <span className="text-sm font-bold">Joined: </span>
                                                {formatDate(enrollment.createdAt)}
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <Clock size={14} className={isExpired ? "text-brand-coral" : "text-brand-cerulean"}/>
                                                <span className="text-sm font-bold">Ends: </span>
                                                {formatDate(enrollment.accessEndDate)}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Area */}
                                    <div className="mt-auto">
                                        {isPaid ? (
                                            <button 
                                                onClick={() => navigate(`/student/class/${classObj._id}`)}
                                                className="w-full bg-brand-prussian text-white py-4 rounded-2xl font-bold flex items-center justify-between px-6 group/btn hover:bg-brand-cerulean transition-all shadow-lg shadow-brand-prussian/20 hover:shadow-brand-cerulean/30"
                                            >
                                                <span>Continue Learning</span>
                                                <div className="bg-white/20 p-1.5 rounded-full group-hover/btn:bg-white group-hover/btn:text-brand-cerulean transition-all">
                                                    <ArrowRight size={16} />
                                                </div>
                                            </button>
                                        ) : (
                                            <div className="flex gap-3">
                                                {status !== 'pending' && (
                                                    <button 
                                                        onClick={() => navigate(`/student/payment/create/${classObj._id}`)}
                                                        className="flex-[2] bg-brand-coral text-white py-3.5 rounded-2xl font-bold hover:bg-red-600 transition-all shadow-lg shadow-brand-coral/20 flex items-center justify-center gap-2"
                                                    >
                                                        <Zap size={18} fill="currentColor" /> Pay Now
                                                    </button>
                                                )}
                                                <button 
                                                    onClick={() => navigate(`/student/payment/upload/${enrollment._id}`)}
                                                    className="flex-1 bg-white border-2 border-gray-100 text-gray-500 py-3.5 rounded-2xl font-bold hover:border-brand-prussian hover:text-brand-prussian transition-all flex items-center justify-center"
                                                    title="Upload Slip"
                                                >
                                                    <UploadCloud size={20} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Overdue Overlay (Optional Visual) */}
                                {!isPaid && status !== 'pending' && (
                                    <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                        <div className="bg-red-500 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1">
                                            <ShieldAlert size={12} /> Payment Required
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        );
                    })}
                </motion.div>
            )}
        </div>
      </div>
  );
}