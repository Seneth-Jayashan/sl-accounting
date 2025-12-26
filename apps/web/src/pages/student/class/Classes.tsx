import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import moment from "moment";
import {
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  CreditCard,
  UploadCloud,
  Search,
  Calendar,
  Layers,
  GraduationCap
} from "lucide-react";

// Components & Layouts
import DashboardLayout from "../../../layouts/DashboardLayout";
import SidebarStudent from "../../../components/sidebar/SidebarStudent";
import BottomNavStudent from "../../../components/bottomNavbar/BottomNavStudent";

// Services & Context
import EnrollmentService from "../../../services/EnrollmentService";
import type { EnrollmentResponse , EnrolledClass } from "../../../services/EnrollmentService";
import { useAuth } from "../../../contexts/AuthContext";

// --- Configuration ---
const API_BASE_URL = import.meta.env.API_BASE_URL || "http://localhost:3000";

// Helper to safely get class details
const getClassDetails = (cls: EnrolledClass | string) => {
    if (typeof cls === 'string') return { name: "Unknown Class", _id: cls, price: 0, coverImage: "" };
    return cls;
};

// Helper for Image URLs
const getImageUrl = (path?: string) => {
    if (!path) return null;
    if (path.startsWith("http")) return path;
    const cleanPath = path.replace(/\\/g, "/");
    return `${API_BASE_URL}/${cleanPath.startsWith("/") ? cleanPath.slice(1) : cleanPath}`;
};

// Animation Variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export default function ViewEnrollments() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // State
  const [enrollments, setEnrollments] = useState<EnrollmentResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "paid" | "pending">("all");

  useEffect(() => {
    const fetchEnrollments = async () => {
      if (!user) return;
      try {
        const data = await EnrollmentService.getMyEnrollments();
        console.log("Fetched Enrollments:", data); // Debug Log
        setEnrollments(data);
      } catch (error) {
        console.error("Failed to fetch enrollments", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEnrollments();
  }, [user]);

  // --- ROBUST FILTER LOGIC ---
  const filteredEnrollments = enrollments.filter(e => {
      // Normalize status to lowercase for comparison
      const status = e.paymentStatus ? e.paymentStatus.toLowerCase() : "pending";
      
      if (filter === "all") return true;
      if (filter === "paid") return status === "paid";
      if (filter === "pending") return status !== "paid";
      
      return true;
  });

  return (
    <DashboardLayout Sidebar={SidebarStudent} BottomNav={BottomNavStudent}>
      <div className="p-6 max-w-7xl mx-auto pb-24 min-h-screen bg-brand-aliceBlue/30">
        
        {/* --- Header Section --- */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <div>
                <h1 className="text-3xl font-black text-brand-prussian font-sinhala">My Classes</h1>
                <p className="text-gray-500 mt-2 font-sans">Manage your active courses and track payments.</p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
                {/* Filter Tabs */}
                <div className="bg-white p-1.5 rounded-xl shadow-sm border border-gray-200 flex overflow-x-auto">
                    {(['all', 'paid', 'pending'] as const).map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 text-sm font-bold rounded-lg capitalize transition-all whitespace-nowrap ${
                                filter === f 
                                ? "bg-brand-prussian text-white shadow-md" 
                                : "text-gray-500 hover:bg-brand-aliceBlue hover:text-brand-cerulean"
                            }`}
                        >
                            {f === 'all' ? 'All Classes' : f}
                        </button>
                    ))}
                </div>

                <button 
                    onClick={() => navigate("/classes")}
                    className="bg-brand-cerulean text-white px-5 py-2.5 rounded-xl font-bold hover:bg-brand-prussian transition-colors shadow-lg shadow-brand-cerulean/20 flex items-center justify-center gap-2 whitespace-nowrap"
                >
                    <Search size={18} /> 
                    <span className="hidden sm:inline">Browse Classes</span>
                    <span className="sm:hidden">Browse</span>
                </button>
            </div>
        </div>

        {/* --- Content Grid --- */}
        {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[1, 2, 3].map(i => (
                    <div key={i} className="bg-white h-[400px] rounded-[2rem] animate-pulse border border-gray-100 shadow-sm"></div>
                ))}
            </div>
        ) : filteredEnrollments.length === 0 ? (
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-[2.5rem] p-16 text-center flex flex-col items-center border border-gray-100 shadow-xl"
            >
                <div className="w-24 h-24 bg-brand-aliceBlue rounded-full flex items-center justify-center mb-6">
                    <BookOpen className="w-10 h-10 text-brand-cerulean/50" />
                </div>
                <h3 className="text-2xl font-bold text-brand-prussian mb-2">No Classes Found</h3>
                <p className="text-gray-500 mb-8 max-w-md font-sans">
                    {filter === 'all' 
                        ? "You haven't enrolled in any classes yet. Start your journey to A/L success today!" 
                        : `You don't have any ${filter} classes at the moment.`}
                </p>
                <button 
                    onClick={() => navigate("/classes")}
                    className="text-brand-cerulean font-bold hover:text-brand-prussian hover:underline flex items-center gap-2 transition-colors"
                >
                    Browse All Classes <ArrowRight size={18} />
                </button>
            </motion.div>
        ) : (
            <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
                <AnimatePresence mode="popLayout">
                    {filteredEnrollments.map((enrollment) => {
                        // Extract Data
                        const classObj = getClassDetails(enrollment.class);
                        const className = classObj.name;
                        const classId = classObj._id;
                        const classImage = getImageUrl(classObj.coverImage);
                        const isPaid = (enrollment.paymentStatus || "").toLowerCase() === 'paid';
                        const isExpired = enrollment.accessEndDate && new Date(enrollment.accessEndDate) < new Date();

                        return (
                            <motion.div 
                                key={enrollment._id} 
                                variants={itemVariants}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="group bg-white rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-2xl hover:border-brand-cerulean/20 transition-all duration-300 overflow-hidden flex flex-col h-full relative"
                            >
                                {/* Card Image / Header */}
                                <div className="h-40 bg-brand-prussian relative overflow-hidden">
                                    {classImage ? (
                                        <img src={classImage} alt={className} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                                    ) : (
                                        <div className={`w-full h-full ${isPaid ? 'bg-gradient-to-br from-brand-cerulean to-brand-prussian' : 'bg-gradient-to-br from-brand-coral to-red-500'}`}></div>
                                    )}
                                    <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors"></div>

                                    {/* Status Badge */}
                                    <div className="absolute top-4 right-4 z-10">
                                        <span className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-lg flex items-center gap-1.5 ${
                                            isPaid 
                                            ? "bg-white text-green-600" 
                                            : "bg-white text-brand-coral"
                                        }`}>
                                            {isPaid ? <CheckCircle2 size={12} /> : <AlertTriangle size={12} />}
                                            {isPaid ? "Active" : "Pending"}
                                        </span>
                                    </div>
                                </div>
                                
                                {/* Card Body */}
                                <div className="p-6 flex-1 flex flex-col relative">
                                    {/* Overlapping Icon (Optional decoration) */}
                                    <div className="absolute -top-6 left-6 w-12 h-12 bg-white rounded-2xl shadow-md flex items-center justify-center text-brand-prussian border border-gray-50">
                                        <GraduationCap size={24} />
                                    </div>

                                    <div className="mt-6 mb-4">
                                        <h3 className="text-xl font-bold text-brand-prussian mb-2 line-clamp-2 leading-tight font-sinhala group-hover:text-brand-cerulean transition-colors">
                                            {className}
                                        </h3>
                                    </div>

                                    {/* Info Grid */}
                                    <div className="space-y-3 mb-6 bg-brand-aliceBlue/30 p-4 rounded-xl">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500 flex items-center gap-2"><Calendar size={14}/> Joined</span>
                                            <span className="font-bold text-brand-prussian">{moment(enrollment.createdAt).format("MMM DD, YYYY")}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500 flex items-center gap-2"><Layers size={14}/> Access Ends</span>
                                            <span className={`font-bold ${isExpired ? "text-red-500" : "text-brand-prussian"}`}>
                                                {enrollment.accessEndDate ? moment(enrollment.accessEndDate).format("MMM DD") : "Unlimited"}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Warning for Unpaid */}
                                    {!isPaid && (
                                        <div className="mb-6 bg-yellow-50 text-yellow-700 text-xs p-3 rounded-lg border border-yellow-100 flex gap-2">
                                            <AlertTriangle size={16} className="shrink-0" />
                                            <span>Please complete your payment to unlock class materials and zoom links.</span>
                                        </div>
                                    )}

                                    {/* Action Buttons */}
                                    <div className="mt-auto flex gap-3">
                                        {isPaid ? (
                                            <button 
                                                onClick={() => navigate(`/student/class/${classId}`)}
                                                className="w-full bg-brand-prussian text-white py-3.5 rounded-xl font-bold hover:bg-brand-cerulean transition-colors flex items-center justify-center gap-2 shadow-lg shadow-brand-prussian/20 group-hover:scale-[1.02] duration-200"
                                            >
                                                Enter Classroom <ArrowRight size={18} />
                                            </button>
                                        ) : (
                                            <>
                                                <button 
                                                    onClick={() => navigate(`/student/enrollment/${classId}`)}
                                                    className="flex-1 bg-brand-coral text-white py-3 rounded-xl font-bold hover:bg-red-500 transition-colors flex items-center justify-center gap-1 shadow-lg shadow-brand-coral/20"
                                                    title="Pay Online"
                                                >
                                                    <CreditCard size={18} /> Pay
                                                </button>
                                                
                                                <button 
                                                    onClick={() => navigate(`/student/payment/upload/${enrollment._id}`)}
                                                    className="flex-1 bg-white border border-gray-200 text-gray-600 py-3 rounded-xl font-bold hover:border-brand-prussian hover:text-brand-prussian transition-colors flex items-center justify-center gap-1"
                                                    title="Upload Bank Slip"
                                                >
                                                    <UploadCloud size={18} /> Slip
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
}