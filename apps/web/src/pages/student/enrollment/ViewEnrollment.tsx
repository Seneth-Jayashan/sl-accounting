import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import EnrollmentService from "../../../services/EnrollmentService";
import type { EnrollmentResponse, EnrolledClass } from "../../../services/EnrollmentService";

import { useAuth } from "../../../contexts/AuthContext";
import moment from "moment";
import {
  AcademicCapIcon,
  CheckBadgeIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ArrowRightIcon,
  CurrencyDollarIcon,
  DocumentArrowUpIcon // Added Icon
} from "@heroicons/react/24/outline";

export default function ViewEnrollments() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [enrollments, setEnrollments] = useState<EnrollmentResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEnrollments = async () => {
      if (!user) return;
      try {
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

  // --- Helper: Get Class Name Safely ---
  const getClassDetails = (cls: EnrolledClass | string) => {
    if (typeof cls === 'string') return { name: "Unknown Class", _id: cls, price: 0 };
    return cls;
  };

  console.log(enrollments);
  return (
      <div className="p-6 max-w-7xl mx-auto pb-20">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">My Enrollments</h1>
                <p className="text-gray-500 text-sm">Manage your active subscriptions and learning progress.</p>
            </div>
            <button 
                onClick={() => navigate("/classes")}
                className="bg-[#0b2540] text-white px-5 py-2.5 rounded-xl font-medium hover:bg-[#153454] transition-colors shadow-lg shadow-blue-900/10 flex items-center gap-2"
            >
                <AcademicCapIcon className="w-5 h-5" /> Browse New Classes
            </button>
        </div>

        {/* Content */}
        {loading ? (
            <div className="flex justify-center py-20 text-gray-400 animate-pulse">Loading your classes...</div>
        ) : enrollments.length === 0 ? (
            <div className="bg-white border border-dashed border-gray-300 rounded-3xl p-12 text-center">
                <AcademicCapIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-gray-900">No Enrollments Yet</h3>
                <p className="text-gray-500 mb-6 max-w-sm mx-auto">You haven't enrolled in any classes yet. Browse our catalog to start learning.</p>
                <button 
                    onClick={() => navigate("/classes")}
                    className="text-[#0b2540] font-medium hover:underline"
                >
                    Browse Classes
                </button>
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {enrollments.map((enrollment) => {
                    const classInfo = getClassDetails(enrollment.class);
                    console.log(classInfo.name);
                    const isPaid = enrollment.paymentStatus === 'paid';
                    const isExpired = enrollment.accessEndDate && new Date(enrollment.accessEndDate) < new Date();

                    return (
                        <div key={enrollment._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col h-full">
                            
                            {/* Card Header (Status Color) */}
                            <div className={`h-2 w-full ${isPaid ? 'bg-green-500' : 'bg-yellow-500'}`} />
                            
                            <div className="p-6 flex-1 flex flex-col">
                                <div className="flex justify-between items-start mb-4">
                                    <div className={`p-2 rounded-lg ${isPaid ? 'bg-green-50 text-green-600' : 'bg-yellow-50 text-yellow-600'}`}>
                                        {isPaid ? <CheckBadgeIcon className="w-6 h-6" /> : <ClockIcon className="w-6 h-6" />}
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                                        isPaid ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                                    }`}>
                                        {isPaid ? "Active" : "Payment Pending"}
                                    </span>
                                </div>

                                <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
                                    {classInfo.name}
                                </h3>

                                <div className="space-y-3 mt-4 text-sm text-gray-500 mb-6">
                                    <div className="flex justify-between border-b border-gray-50 pb-2">
                                        <span>Enrolled On</span>
                                        <span className="font-medium text-gray-900">{moment(enrollment.createdAt).format("MMM DD, YYYY")}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-gray-50 pb-2">
                                        <span>Access Ends</span>
                                        <span className={`font-medium ${isExpired ? "text-red-500" : "text-gray-900"}`}>
                                            {enrollment.accessEndDate ? moment(enrollment.accessEndDate).format("MMM DD, YYYY") : "N/A"}
                                        </span>
                                    </div>
                                    {enrollment.paymentStatus !== 'paid' && (
                                        <div className="flex items-center gap-2 text-yellow-600 bg-yellow-50 p-2 rounded-lg text-xs">
                                            <ExclamationTriangleIcon className="w-4 h-4" />
                                            <span>Access is restricted until payment.</span>
                                        </div>
                                    )}
                                </div>

                                <div className="mt-auto pt-4 border-t border-gray-50 flex gap-2">
                                    {isPaid ? (
                                        <button 
                                            onClick={() => navigate(`/student/class/${classInfo._id}`)}
                                            className="w-full bg-[#0b2540] text-white py-2.5 rounded-xl font-medium hover:bg-[#153454] transition-colors flex items-center justify-center gap-2"
                                        >
                                            Enter Class <ArrowRightIcon className="w-4 h-4" />
                                        </button>
                                    ) : (
                                        <>
                                            {/* Pay Online Button */}
                                            <button 
                                                onClick={() => navigate(`/student/enrollment/${classInfo._id}`)}
                                                className="flex-1 bg-yellow-500 text-white py-2.5 rounded-xl font-medium hover:bg-yellow-600 transition-colors flex items-center justify-center gap-1 text-sm"
                                                title="Pay Online via PayHere"
                                            >
                                                <CurrencyDollarIcon className="w-4 h-4" /> Pay
                                            </button>
                                            
                                            {/* Upload Slip Button (New) */}
                                            <button 
                                                onClick={() => navigate(`/student/payment/upload/${enrollment._id}`)}
                                                className="flex-1 border border-[#0b2540] text-[#0b2540] py-2.5 rounded-xl font-medium hover:bg-blue-50 transition-colors flex items-center justify-center gap-1 text-sm"
                                                title="Upload Bank Transfer Slip"
                                            >
                                                <DocumentArrowUpIcon className="w-4 h-4" /> Upload Slip
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
  );
}