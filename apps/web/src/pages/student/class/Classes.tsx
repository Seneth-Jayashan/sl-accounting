import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../../layouts/DashboardLayout";
import SidebarStudent from "../../../components/sidebar/SidebarStudent";
import BottomNavStudent from "../../../components/bottomNavbar/BottomNavStudent";
import EnrollmentService from "../../../services/EnrollmentService";
import type { EnrollmentResponse, EnrolledClass } from "../../../services/EnrollmentService";
import { useAuth } from "../../../contexts/AuthContext"; // Adjust path to your context
import moment from "moment";
import {
  AcademicCapIcon,
  CheckBadgeIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ArrowRightIcon,
  CurrencyDollarIcon,
  DocumentArrowUpIcon,
  FunnelIcon
} from "@heroicons/react/24/outline";

// Helper to safely get class details even if population fails
const getClassDetails = (cls: EnrolledClass | string) => {
    if (typeof cls === 'string') return { name: "Unknown Class", _id: cls, price: 0, coverImage: "" };
    return cls; // It's an object (EnrolledClass)
};

export default function ViewEnrollments() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [enrollments, setEnrollments] = useState<EnrollmentResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "paid" | "pending">("all");

  useEffect(() => {
    const fetchEnrollments = async () => {
      if (!user) return;
      try {
        // This fetches ONLY the logged-in student's enrollments
        const data = await EnrollmentService.getMyEnrollments();
        setEnrollments(data);
      } catch (error) {
        console.error("Failed to fetch enrollments", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEnrollments();
  }, [user]);

  // Filter Logic
  const filteredEnrollments = enrollments.filter(e => {
      if (filter === "all") return true;
      if (filter === "paid") return e.paymentStatus === "paid";
      if (filter === "pending") return e.paymentStatus !== "paid";
      return true;
  });

  return (
    <DashboardLayout Sidebar={SidebarStudent} BottomNav={BottomNavStudent}>
      <div className="p-6 max-w-7xl mx-auto pb-24 min-h-screen bg-gray-50">
        
        {/* --- Header Section --- */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">My Classes</h1>
                <p className="text-gray-500 text-sm mt-1">Track your active courses and payment status.</p>
            </div>
            
            <div className="flex gap-2">
                {/* Filter Buttons */}
                <div className="bg-white p-1 rounded-xl shadow-sm border border-gray-200 flex">
                    {(['all', 'paid', 'pending'] as const).map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 text-sm font-medium rounded-lg capitalize transition-all ${
                                filter === f 
                                ? "bg-[#0b2540] text-white shadow-sm" 
                                : "text-gray-500 hover:bg-gray-50"
                            }`}
                        >
                            {f}
                        </button>
                    ))}
                </div>

                <button 
                    onClick={() => navigate("/classes")}
                    className="bg-[#0b2540] text-white px-5 py-2 rounded-xl font-medium hover:bg-[#153454] transition-colors shadow-lg shadow-blue-900/10 flex items-center gap-2"
                >
                    <AcademicCapIcon className="w-5 h-5" /> 
                    <span className="hidden sm:inline">Browse New</span>
                </button>
            </div>
        </div>

        {/* --- Content Grid --- */}
        {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map(i => (
                    <div key={i} className="bg-white h-64 rounded-2xl animate-pulse"></div>
                ))}
            </div>
        ) : filteredEnrollments.length === 0 ? (
            <div className="bg-white border-2 border-dashed border-gray-200 rounded-3xl p-16 text-center flex flex-col items-center">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <AcademicCapIcon className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No Classes Found</h3>
                <p className="text-gray-500 mb-8 max-w-sm">
                    {filter === 'all' 
                        ? "You haven't enrolled in any classes yet. Start your learning journey today!" 
                        : `You don't have any ${filter} classes.`}
                </p>
                <button 
                    onClick={() => navigate("/classes")}
                    className="text-[#0b2540] font-bold hover:underline"
                >
                    Browse All Classes &rarr;
                </button>
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
                {filteredEnrollments.map((enrollment) => {
                    // Type Guard / Extraction
                    const classData = enrollment.class as any; // Cast to any to access fields safely if interface is loose
                    const className = classData?.name || "Unknown Class";
                    const classId = classData?._id || (typeof enrollment.class === 'string' ? enrollment.class : "");
                    const classImage = classData?.coverImage; // Assuming populated

                    const isPaid = enrollment.paymentStatus === 'paid';
                    const isExpired = enrollment.accessEndDate && new Date(enrollment.accessEndDate) < new Date();

                    return (
                        <div key={enrollment._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col h-full group">
                            
                            {/* Card Image / Header Color */}
                            <div className="h-32 bg-gray-200 relative overflow-hidden">
                                {classImage ? (
                                    <img src={classImage} alt={className} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                ) : (
                                    <div className={`w-full h-full ${isPaid ? 'bg-gradient-to-r from-green-500 to-emerald-600' : 'bg-gradient-to-r from-yellow-400 to-orange-500'}`}></div>
                                )}
                                
                                {/* Status Badge */}
                                <div className="absolute top-3 right-3">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide shadow-sm ${
                                        isPaid 
                                        ? "bg-white text-green-700" 
                                        : "bg-white text-yellow-700"
                                    }`}>
                                        {isPaid ? "Active" : "Payment Pending"}
                                    </span>
                                </div>
                            </div>
                            
                            <div className="p-6 flex-1 flex flex-col">
                                <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 leading-tight">
                                    {className}
                                </h3>

                                <div className="space-y-3 mt-2 text-sm text-gray-500 mb-6">
                                    <div className="flex justify-between border-b border-gray-50 pb-2">
                                        <span>Joined</span>
                                        <span className="font-medium text-gray-900">{moment(enrollment.createdAt).format("MMM DD, YYYY")}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-gray-50 pb-2">
                                        <span>Access Ends</span>
                                        <span className={`font-medium ${isExpired ? "text-red-500" : "text-gray-900"}`}>
                                            {enrollment.accessEndDate ? moment(enrollment.accessEndDate).format("MMM DD") : "N/A"}
                                        </span>
                                    </div>
                                    
                                    {!isPaid && (
                                        <div className="flex items-start gap-2 text-yellow-700 bg-yellow-50 p-2.5 rounded-lg text-xs mt-2">
                                            <ExclamationTriangleIcon className="w-4 h-4 mt-0.5 shrink-0" />
                                            <span>Complete payment to access course materials.</span>
                                        </div>
                                    )}
                                </div>

                                <div className="mt-auto pt-4 border-t border-gray-50 flex gap-2">
                                    {isPaid ? (
                                        // --- PAID: Go to Classroom ---
                                        <button 
                                            onClick={() => navigate(`/student/class/${classId}`)}
                                            className="w-full bg-[#0b2540] text-white py-2.5 rounded-xl font-medium hover:bg-[#153454] transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-900/10"
                                        >
                                            Enter Classroom <ArrowRightIcon className="w-4 h-4" />
                                        </button>
                                    ) : (
                                        // --- UNPAID: Pay or Upload ---
                                        <>
                                            <button 
                                                onClick={() => navigate(`/student/enrollment/${classId}`)}
                                                className="flex-1 bg-yellow-500 text-white py-2.5 rounded-xl font-medium hover:bg-yellow-600 transition-colors flex items-center justify-center gap-1 shadow-lg shadow-yellow-500/20"
                                                title="Pay Online"
                                            >
                                                <CurrencyDollarIcon className="w-5 h-5" /> Pay Now
                                            </button>
                                            
                                            <button 
                                                onClick={() => navigate(`/student/payment/upload/${enrollment._id}`)}
                                                className="flex-1 border-2 border-gray-100 text-gray-600 py-2.5 rounded-xl font-medium hover:border-[#0b2540] hover:text-[#0b2540] transition-colors flex items-center justify-center gap-1 bg-white"
                                                title="Upload Bank Slip"
                                            >
                                                <DocumentArrowUpIcon className="w-5 h-5" /> Slip
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        )}
      </div>
    </DashboardLayout>
  );
}