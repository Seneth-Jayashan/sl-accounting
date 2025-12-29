import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeftIcon,
  EnvelopeIcon,
  CalendarDaysIcon,
  MapPinIcon,
  ShieldCheckIcon,
  BookOpenIcon,
  ClockIcon
} from "@heroicons/react/24/outline";

// Layouts & Services
import UserService, { type UserData } from "../../../services/AdminService";
import EnrollmentService, { type EnrollmentResponse, type EnrolledClass } from "../../../services/EnrollmentService";
import { useAuth } from "../../../contexts/AuthContext";

// --- HELPERS ---
const formatDate = (dateString?: string) => {
    if (!dateString) return "Unknown";
    return new Date(dateString).toLocaleDateString('en-US', { 
        year: 'numeric', month: 'long', day: 'numeric' 
    });
};

export default function ViewStudentPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  
  // State
  const [student, setStudent] = useState<UserData | null>(null);
  const [enrollments, setEnrollments] = useState<EnrollmentResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- 1. Fetch Data ---
  useEffect(() => {
    let isMounted = true;

    // Security Check
    if (currentUser && currentUser.role !== 'admin') {
        navigate('/unauthorized');
        return;
    }

    const loadData = async () => {
      if (!id) {
          setError("No student ID provided.");
          setIsLoading(false);
          return;
      }

      setIsLoading(true);
      try {
        console.log("Fetching data for student ID:", id); // Debug log

        // Parallel Fetch
        const [userRes, enrollmentRes] = await Promise.all([
            UserService.getUserById(id),
            EnrollmentService.getAllEnrollments({ studentId: id }) // Ensure backend supports query param
        ]);

        if (isMounted) {
            if (userRes.success && userRes.user) {
                setStudent(userRes.user as UserData);
            } else {
                throw new Error("Student not found in database.");
            }
            
            // Handle Enrollments (check if array or object wrapper)
            const enrolledList = Array.isArray(enrollmentRes) 
                ? enrollmentRes 
                : (enrollmentRes as any).enrollments || [];
                
            setEnrollments(enrolledList);
        }
      } catch (err: any) {
        console.error("Load Error Details:", err);
        if (isMounted) setError(err.message || "Failed to load student profile.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadData();
    return () => { isMounted = false; };
  }, [id, currentUser, navigate]);


  // --- Render Helpers ---
  const getBatchName = () => {
    if (!student?.batch) return "Unassigned";
    if (typeof student.batch === 'object' && 'name' in student.batch) {
        return (student.batch as any).name;
    }
    return "Assigned (ID Hidden)";
  };

  const getAddressString = () => {
      const addr = (student as any).address;
      if (!addr || (typeof addr === 'object' && !addr.street && !addr.city)) return "Not Provided";
      if (typeof addr === 'string') return addr;
      return `${addr.street || ''}, ${addr.city || ''}, ${addr.state || ''}`.replace(/^, /, '').replace(/, $/, '');
  };

  const getInitials = () => student?.firstName ? student.firstName.slice(0, 2).toUpperCase() : "ST";

  // --- 4. States ---
  if (isLoading) return <LoadingSkeleton />;
  if (error || !student) return <ErrorState message={error || "Profile not found"} onBack={() => navigate('/admin/students')} />;

  return (
      <div className="max-w-5xl mx-auto space-y-6 md:space-y-8 font-sans pb-24 md:pb-20">
        
        {/* Mobile Header: Back Button */}
        <button 
          onClick={() => navigate(-1)} 
          className="group flex items-center text-gray-500 hover:text-[#0b2540] transition-colors font-medium text-xs md:text-sm uppercase tracking-widest mt-2 md:mt-0"
        >
          <ArrowLeftIcon className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" /> 
          Back to Directory
        </button>

        {/* HERO SECTION */}
        <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 relative overflow-visible mt-8 md:mt-12">
          
          {/* Banner */}
          <div className="absolute top-0 left-0 w-full h-24 md:h-32 bg-gradient-to-r from-[#0b2540] to-[#1a3b5c] rounded-t-[2rem]">
             <div className="absolute top-[-50%] right-[-5%] w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          </div>
          
          <div className="relative px-6 md:px-8 pb-8 pt-12 md:pt-16 flex flex-col md:flex-row items-center md:items-start gap-4 md:gap-6 text-center md:text-left">
            
            {/* Avatar */}
            <div className="relative -mt-8 md:-mt-6 shrink-0">
                <div className="w-24 h-24 md:w-32 md:h-32 rounded-3xl border-[6px] border-white bg-white shadow-lg flex items-center justify-center overflow-hidden">
                    {student.profileImage ? (
                        <img 
                            src={`${import.meta.env.VITE_API_BASE_URL}/${student.profileImage}`} 
                            alt="Profile" 
                            className="w-full h-full object-cover"
                            onError={(e) => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${student.firstName}&background=0b2540&color=fff` }} 
                        />
                    ) : (
                        <div className="w-full h-full bg-blue-50 flex items-center justify-center text-3xl md:text-4xl font-black text-blue-600">
                            {getInitials()}
                        </div>
                    )}
                </div>
                {/* Verification Badge */}
                <div className="absolute -bottom-2 -right-2 bg-white p-1.5 rounded-full shadow-sm">
                    {student.isVerified ? (
                        <ShieldCheckIcon className="w-5 h-5 md:w-6 md:h-6 text-green-500 fill-current" />
                    ) : (
                        <div className="w-4 h-4 bg-amber-400 rounded-full border-2 border-white"></div>
                    )}
                </div>
            </div>

            {/* Info Block */}
            <div className="flex-1 mt-2 md:mt-16 mb-2 w-full"> 
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                      <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
                        {student.firstName} {student.lastName}
                      </h1>
                      
                      <div className="flex flex-wrap justify-center md:justify-start items-center gap-2 md:gap-3 mt-3">
                          <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-lg text-[10px] md:text-xs font-bold border border-blue-100 uppercase tracking-wide">
                            {getBatchName()}
                          </span>
                          <span className="flex items-center gap-1.5 text-[10px] md:text-xs text-gray-500 font-medium bg-gray-50 px-3 py-1 rounded-lg border border-gray-100">
                             <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span> Student
                          </span>
                      </div>
                  </div>
                  
                  {/* ID Badge (Hidden on small mobile, visible on tablet+) */}
                  <div className="text-center md:text-right hidden sm:block">
                      <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">System ID</p>
                      <p className="text-sm font-mono font-bold text-gray-600 bg-gray-50 px-2 py-1 rounded border border-gray-100">
                        {student._id.slice(-8).toUpperCase()}
                      </p>
                  </div>
              </div>
            </div>
          </div>
        </div>

        {/* CONTENT GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* 1. Contact Details */}
          <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300">
            <h2 className="text-base md:text-lg font-bold text-gray-900 mb-6 flex items-center gap-2 border-b border-gray-100 pb-4">
              <EnvelopeIcon className="w-5 h-5 text-brand-cerulean" /> Contact Information
            </h2>
            <div className="space-y-5">
              <InfoRow label="Email Address" value={student.email} copyable />
              <InfoRow label="Phone Number" value={student.phoneNumber} />
              <InfoRow label="Address" value={getAddressString()} icon={<MapPinIcon className="w-4 h-4 text-gray-400"/>} />
            </div>
          </div>

          {/* 2. Enrolled Classes */}
          <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300">
              <h2 className="text-base md:text-lg font-bold text-gray-900 mb-6 flex items-center gap-2 border-b border-gray-100 pb-4">
              <BookOpenIcon className="w-5 h-5 text-brand-cerulean" /> Enrolled Classes
            </h2>
            
            {enrollments.length > 0 ? (
                <div className="space-y-4">
                    {enrollments.map((enr) => {
                        const classData = typeof enr.class === 'string' ? null : (enr.class as EnrolledClass);
                        return (
                            <div key={enr._id} className="flex items-center gap-4 p-3 rounded-xl bg-gray-50 border border-gray-100">
                                <div className="w-12 h-12 bg-white rounded-lg border border-gray-200 flex items-center justify-center shrink-0 overflow-hidden">
                                    {classData?.coverImage ? (
                                        <img src={`${import.meta.env.VITE_API_BASE_URL}/${classData.coverImage}`} className="w-full h-full object-cover" alt="Class" />
                                    ) : (
                                        <BookOpenIcon className="w-5 h-5 text-gray-400" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-sm text-gray-900 truncate">{classData?.name || "Unknown Class"}</h4>
                                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                                        <span className={`px-1.5 rounded-sm font-semibold capitalize ${enr.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                            {enr.paymentStatus}
                                        </span>
                                        <span className="truncate">• Joined {new Date(enr.createdAt).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="text-center py-8 text-gray-400">
                    <p className="text-sm">No active enrollments.</p>
                </div>
            )}
          </div>

          {/* 3. System Meta */}
          <div className="md:col-span-2 bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-4 sm:gap-6 items-start sm:items-center justify-between text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <CalendarDaysIcon className="w-4 h-4" />
                <span>Joined: <span className="text-gray-900 font-medium">{formatDate(student.createdAt)}</span></span>
              </div>
              <div className="flex items-center gap-2">
                <ClockIcon className="w-4 h-4" />
                <span>Last Login: <span className="text-gray-900 font-medium">{student.lastLogin ? formatDate(student.lastLogin.toString()) : "Never"}</span></span>
              </div>
          </div>

        </div>
      </div>
  );
}

// --- SUB-COMPONENTS ---

const InfoRow = ({ label, value, icon, copyable }: { label: string, value?: string, icon?: React.ReactNode, copyable?: boolean }) => {
    const handleCopy = () => {
        if (value) navigator.clipboard.writeText(value);
    };

    return (
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-1 group">
            <span className="text-xs md:text-sm text-gray-400 font-medium shrink-0 w-32">{label}</span>
            <div className="flex items-center gap-2 text-sm text-gray-800 font-semibold text-left sm:text-right break-all flex-1 justify-start sm:justify-end">
                {icon}
                <span>{value || <span className="text-gray-300 italic">Not Provided</span>}</span>
                {copyable && value && (
                    <button onClick={handleCopy} className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 text-gray-400 hover:text-blue-600 transition-opacity p-1">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                    </button>
                )}
            </div>
        </div>
    );
};

const LoadingSkeleton = () => (
    <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-6 animate-pulse">
        <div className="h-8 w-32 bg-gray-200 rounded-lg"></div>
        <div className="h-48 md:h-64 bg-gray-200 rounded-3xl"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-48 bg-gray-200 rounded-3xl"></div>
            <div className="h-48 bg-gray-200 rounded-3xl"></div>
        </div>
    </div>
);

const ErrorState = ({ message, onBack }: { message: string, onBack: () => void }) => (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
            <ShieldCheckIcon className="w-8 h-8 text-red-400" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Unavailable</h2>
        <p className="text-gray-500 mb-6">{message}</p>
        <button onClick={onBack} className="px-6 py-2 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors">
            Go Back
        </button>
    </div>
);