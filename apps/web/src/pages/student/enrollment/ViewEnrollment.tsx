import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  BookOpenIcon,
  CheckBadgeIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ArrowRightIcon,
  CurrencyDollarIcon,
  DocumentArrowUpIcon,
  MagnifyingGlassIcon,
  CalendarIcon
} from "@heroicons/react/24/outline";

import EnrollmentService, { type EnrollmentResponse, type EnrolledClass } from "../../../services/EnrollmentService";
import { useAuth } from "../../../contexts/AuthContext";

// --- HELPERS ---
const getClassDetails = (cls: EnrolledClass | string): EnrolledClass => {
    if (typeof cls === 'string') return { _id: cls, name: "Unknown Class", price: 0, coverImage: "" };
    return cls;
};

// --- ANIMATION VARIANTS ---
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1, 
    transition: { staggerChildren: 0.05 } 
  },
  exit: { opacity: 0 }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
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
        if (isMounted) setEnrollments(data);
      } catch (error) {
        console.error("Failed to fetch enrollments", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchEnrollments();
    return () => { isMounted = false; };
  }, [user]);

  // --- FILTER LOGIC ---
  const filteredEnrollments = useMemo(() => {
      return enrollments.filter(e => {
          // Safe access to paymentStatus
          const status = e.paymentStatus ? e.paymentStatus.toLowerCase() : "pending";
          const isPaid = status === 'paid';
          
          if (filter === "all") return true;
          if (filter === "paid") return isPaid;
          if (filter === "pending") return !isPaid; // Includes 'unpaid', 'pending', 'expired'
          return true;
      });
  }, [enrollments, filter]);

  // Date Formatter
  const formatDate = (dateString?: string) => {
      if (!dateString) return "Unlimited";
      return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
      <div className="p-4 sm:p-6 max-w-7xl mx-auto pb-24 min-h-screen bg-gray-50/50">
        
        {/* --- HEADER --- */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
            <div>
                <h1 className="text-2xl sm:text-3xl font-black text-[#0b2540]">My Enrollments</h1>
                <p className="text-sm sm:text-base text-gray-500 mt-1">Manage your active subscriptions and learning progress.</p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
                {/* Filter Tabs */}
                <div className="bg-white p-1 rounded-xl shadow-sm border border-gray-200 flex overflow-x-auto scrollbar-hide">
                    {(['all', 'paid', 'pending'] as const).map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 text-sm font-bold rounded-lg capitalize transition-all whitespace-nowrap ${
                                filter === f 
                                ? "bg-[#0b2540] text-white shadow-md" 
                                : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                            }`}
                        >
                            {f === 'all' ? 'All Classes' : f}
                        </button>
                    ))}
                </div>

                <button 
                    onClick={() => navigate("/classes")}
                    className="bg-brand-cerulean text-white px-5 py-2.5 rounded-xl font-bold hover:bg-brand-prussian transition-colors shadow-lg shadow-brand-cerulean/20 flex items-center justify-center gap-2 whitespace-nowrap active:scale-95"
                >
                    <MagnifyingGlassIcon className="w-5 h-5" /> 
                    <span>Browse</span>
                </button>
            </div>
        </div>

        {/* --- CONTENT --- */}
        {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map(i => (
                    <div key={i} className="bg-white h-[350px] rounded-3xl animate-pulse border border-gray-100 shadow-sm"></div>
                ))}
            </div>
        ) : filteredEnrollments.length === 0 ? (
            <motion.div 
                key="empty"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-[2rem] p-8 sm:p-16 text-center flex flex-col items-center border border-gray-100 shadow-sm border-dashed"
            >
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                    <BookOpenIcon className="w-10 h-10 text-gray-300" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No Enrollments Found</h3>
                <p className="text-gray-500 mb-6 max-w-md text-sm">
                    {filter === 'all' 
                        ? "You haven't enrolled in any classes yet. Start your journey today!" 
                        : `You don't have any ${filter} classes at the moment.`}
                </p>
                <button 
                    onClick={() => navigate("/classes")}
                    className="text-[#0b2540] font-bold hover:underline flex items-center gap-2"
                >
                    Browse Available Classes <ArrowRightIcon className="w-4 h-4" />
                </button>
            </motion.div>
        ) : (
            <motion.div 
                key={filter} // Forces re-render when filter changes (Fixes disappearance bug)
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
                {filteredEnrollments.map((enrollment) => {
                    const classInfo = getClassDetails(enrollment.class);
                    const isPaid = (enrollment.paymentStatus || "").toLowerCase() === 'paid';
                    const isExpired = enrollment.accessEndDate && new Date(enrollment.accessEndDate) < new Date();

                    return (
                        <motion.div 
                            key={enrollment._id} 
                            variants={itemVariants}
                            // Removed 'layout' prop here to fix the grid bug
                            className="group bg-white rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col h-full relative"
                        >
                            {/* Status Strip */}
                            <div className={`h-1.5 w-full ${isPaid ? 'bg-green-500' : 'bg-yellow-500'}`} />

                            <div className="p-6 flex-1 flex flex-col">
                                
                                {/* Badge Row */}
                                <div className="flex justify-between items-start mb-4">
                                    <div className={`p-2 rounded-xl ${isPaid ? 'bg-green-50 text-green-600' : 'bg-yellow-50 text-yellow-600'}`}>
                                        {isPaid ? <CheckBadgeIcon className="w-6 h-6" /> : <ClockIcon className="w-6 h-6" />}
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                        isPaid ? "bg-green-50 text-green-700 border border-green-100" : "bg-yellow-50 text-yellow-700 border border-yellow-100"
                                    }`}>
                                        {isPaid ? "Active" : "Pending"}
                                    </span>
                                </div>

                                {/* Title */}
                                <h3 className="text-lg font-bold text-[#0b2540] mb-1 line-clamp-2 group-hover:text-brand-cerulean transition-colors">
                                    {classInfo.name}
                                </h3>
                                <p className="text-xs text-gray-400 font-mono mb-4">ID: {classInfo._id.slice(-6).toUpperCase()}</p>

                                {/* Info Grid */}
                                <div className="space-y-3 mb-6 bg-gray-50/50 p-4 rounded-xl border border-gray-50">
                                    <div className="flex justify-between text-xs sm:text-sm">
                                        <span className="text-gray-500 flex items-center gap-2"><CalendarIcon className="w-4 h-4"/> Joined</span>
                                        <span className="font-semibold text-gray-900">{formatDate(enrollment.createdAt)}</span>
                                    </div>
                                    <div className="flex justify-between text-xs sm:text-sm">
                                        <span className="text-gray-500 flex items-center gap-2"><ClockIcon className="w-4 h-4"/> Access Ends</span>
                                        <span className={`font-semibold ${isExpired ? "text-red-500" : "text-gray-900"}`}>
                                            {formatDate(enrollment.accessEndDate)}
                                        </span>
                                    </div>
                                </div>

                                {/* Warning for Unpaid */}
                                {!isPaid && (
                                    <div className="mb-6 bg-yellow-50/50 text-yellow-800 text-xs p-3 rounded-lg border border-yellow-100 flex gap-2">
                                        <ExclamationTriangleIcon className="w-4 h-4 shrink-0" />
                                        <span>Complete payment to unlock contents.</span>
                                    </div>
                                )}

                                {/* Action Buttons */}
                                <div className="mt-auto flex flex-col sm:flex-row gap-2">
                                    {isPaid ? (
                                        <button 
                                            onClick={() => navigate(`/student/class/${classInfo._id}`)}
                                            className="w-full bg-[#0b2540] text-white py-3 rounded-xl font-bold hover:bg-[#153454] transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-900/10 active:scale-95"
                                        >
                                            Enter Class <ArrowRightIcon className="w-4 h-4" />
                                        </button>
                                    ) : (
                                        <>
                                            <button 
                                                onClick={() => navigate(`/student/enrollment/${classInfo._id}`)}
                                                className="flex-1 bg-yellow-500 text-white py-3 rounded-xl font-bold hover:bg-yellow-600 transition-colors flex items-center justify-center gap-1 shadow-lg shadow-yellow-500/20 active:scale-95 text-sm"
                                            >
                                                <CurrencyDollarIcon className="w-4 h-4" /> Pay
                                            </button>
                                            
                                            <button 
                                                onClick={() => navigate(`/student/payment/upload/${enrollment._id}`)}
                                                className="flex-1 bg-white border border-[#0b2540] text-[#0b2540] py-3 rounded-xl font-bold hover:bg-[#0b2540] hover:text-white transition-colors flex items-center justify-center gap-1 active:scale-95 text-sm"
                                            >
                                                <DocumentArrowUpIcon className="w-4 h-4" /> Slip
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </motion.div>
        )}
      </div>
  );
}