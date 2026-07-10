import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    ChevronLeftIcon,
    ShieldCheckIcon,
    BookOpenIcon,
    CalendarDaysIcon,
    ClockIcon,
    CurrencyDollarIcon
} from "@heroicons/react/24/outline";

// Layouts & Services
import UserService, {
    type UserData,
    type AdminStudentEnrollment,
    type AdminStudentPayment,
    type AdminStudentPaidClassSummary,
} from "../../../services/AdminService";
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
    const [enrollments, setEnrollments] = useState<AdminStudentEnrollment[]>([]);
    const [payments, setPayments] = useState<AdminStudentPayment[]>([]);
    const [lifetimePaidClasses, setLifetimePaidClasses] = useState<AdminStudentPaidClassSummary[]>([]);
    const [stats, setStats] = useState<{
        totalEnrollments: number;
        activeEnrollments: number;
        totalPayments: number;
        completedPayments: number;
        lifetimePaidAmount: number;
        totalPaidClasses: number;
    } | null>(null);
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
                const userRes = await UserService.getUserById(id);

                if (isMounted) {
                    if (userRes.success && userRes.user) {
                        setStudent(userRes.user as UserData);
                        setEnrollments(userRes.enrollments || []);
                        setPayments(userRes.payments || []);
                        setLifetimePaidClasses(userRes.lifetimePaidClasses || []);
                        setStats(userRes.stats || null);
                    } else {
                        throw new Error("Student not found in database.");
                    }
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

    // --- States ---
    if (isLoading) return <LoadingSkeleton />;
    if (error || !student) return <ErrorState message={error || "Profile not found"} onBack={() => navigate('/admin/students')} />;

    return (
        <div className="w-full space-y-5 pb-12 overflow-x-hidden">

            {/* --- Header --- */}
            <div className="flex items-center gap-4 pt-2">
                <button
                    onClick={() => navigate(-1)}
                    className="w-8 h-8 rounded-full bg-[#eef2f6] text-[#0d4b5b] flex items-center justify-center hover:bg-[#e2e8f0] transition-colors shrink-0"
                >
                    <ChevronLeftIcon className="w-4 h-4 stroke-[3]" />
                </button>
            </div>

            {/* --- HERO SECTION --- */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Banner */}
                <div className="h-[90px] w-full bg-[#333333]"></div>

                {/* Profile Info */}
                <div className="px-6 pb-6 relative">
                    <div className="flex flex-col md:flex-row md:justify-between items-start gap-4 md:gap-0">

                        <div className="flex flex-col sm:flex-row gap-4 sm:gap-5 w-full md:w-auto">
                            {/* Avatar */}
                            <div className="-mt-10 relative shrink-0 mx-auto sm:mx-0">
                                <div className="w-20 h-20 bg-[#f4f7f9] rounded-2xl border-[3px] border-white flex items-center justify-center text-[26px] font-black text-gray-800 shadow-sm overflow-hidden">
                                    {student.profileImage ? (
                                        <img
                                            src={`${import.meta.env.VITE_API_BASE_URL}/${student.profileImage}`}
                                            alt="Profile"
                                            className="w-full h-full object-cover"
                                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                        />
                                    ) : (
                                        getInitials()
                                    )}
                                </div>
                                <div className="absolute -bottom-1.5 -right-1.5 bg-white p-0.5 rounded-full shadow-sm">
                                    {student.isVerified ? (
                                        <ShieldCheckIcon className="w-4 h-4 text-emerald-500" />
                                    ) : (
                                        <div className="w-3 h-3 bg-amber-400 rounded-full border-2 border-white"></div>
                                    )}
                                </div>
                            </div>

                            {/* Name & Badges */}
                            <div className="pt-2 text-center sm:text-left">
                                <h1 className="text-base font-black text-gray-900 uppercase tracking-widest">
                                    {student.firstName} {student.lastName}
                                </h1>
                                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-2">
                                    <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-[10px] font-bold">
                                        {getBatchName()}
                                    </span>
                                    <span className="flex items-center gap-1.5 bg-gray-100 text-gray-700 px-2 py-1 rounded text-[10px] font-bold">
                                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span> Student
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* System ID */}
                        <div className="pt-3 text-center sm:text-left md:text-right w-full md:w-auto flex flex-col items-center sm:items-start md:items-end">
                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">System ID</p>
                            <p className="text-[11px] font-black text-gray-700 mt-1 uppercase">
                                {student._id.slice(-8)}
                            </p>
                        </div>

                    </div>
                </div>
            </div>

            {/* --- CONTENT GRID --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                {/* 1. Contact Information */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h2 className="text-[12px] font-black text-[#0d4b5b] mb-5 uppercase tracking-widest">
                        Contact Information
                    </h2>
                    <div className="space-y-4">
                        <div className="flex justify-between items-start gap-4 text-[12px]">
                            <span className="font-bold text-gray-700">Email Address</span>
                            <span className="text-[#648496] font-medium text-right break-all">{student.email}</span>
                        </div>
                        <div className="flex justify-between items-start gap-4 text-[12px]">
                            <span className="font-bold text-gray-700">Phone Number</span>
                            <span className="text-[#648496] font-medium text-right">{student.phoneNumber || "Not Provided"}</span>
                        </div>
                        <div className="flex justify-between items-start gap-4 text-[12px]">
                            <span className="font-bold text-gray-700">Address</span>
                            <span className="text-[#648496] font-medium text-right max-w-[150px] leading-relaxed">
                                {getAddressString()}
                            </span>
                        </div>
                    </div>
                </div>

                {/* 2. Enrolled Classes */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h2 className="text-[12px] font-black text-[#0d4b5b] mb-5 uppercase tracking-widest">
                        Enrolled Classes
                    </h2>
                    {enrollments.length > 0 ? (
                        <div className="space-y-3">
                            {enrollments.map((enr) => {
                                const classData = typeof enr.class === 'string' ? null : enr.class;
                                return (
                                    <div key={enr._id} className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border border-gray-100">
                                        <div className="w-8 h-8 bg-white border border-gray-200 rounded-lg flex items-center justify-center shrink-0">
                                            <BookOpenIcon className="w-4 h-4 text-gray-400 stroke-[2]" />
                                        </div>
                                        <div>
                                            <p className="text-[12px] font-bold text-gray-900 leading-tight">
                                                {classData?.name || "Unknown Class"}
                                            </p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-[4px] text-[9px] font-bold uppercase tracking-wider">
                                                    {enr.paymentStatus === 'paid' ? 'Paid' : enr.paymentStatus}
                                                </span>
                                                <span className="text-[10px] text-gray-400 font-medium">
                                                    • Joined {new Date(enr.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-6 text-gray-400 text-xs font-medium">
                            No active enrollments.
                        </div>
                    )}
                </div>
            </div>

            {/* 3. Lifetime Paid Classes */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h2 className="text-[12px] font-black text-[#0d4b5b] mb-5 uppercase tracking-widest">
                    Lifetime Paid Classes
                </h2>
                {lifetimePaidClasses.length > 0 ? (
                    <div className="space-y-3">
                        {lifetimePaidClasses.map((item) => (
                            <div key={item.class._id} className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                <div>
                                    <p className="text-[12px] font-bold text-gray-900">{item.class.name}</p>
                                    <p className="text-[11px] text-gray-500 mt-1 font-medium">
                                        Payments: {item.paymentCount} | Months: {item.paidMonths?.length || 0}
                                    </p>
                                </div>
                                <div className="text-left sm:text-right">
                                    <p className="text-[12px] font-black text-[#0d4b5b]">
                                        LKR {Number(item.totalPaidAmount || 0).toLocaleString()}
                                    </p>
                                    <p className="text-[10px] text-gray-400 mt-1 font-medium">
                                        Last paid: {item.lastPaidAt ? formatDate(item.lastPaidAt) : "N/A"}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-6 text-gray-400 text-xs font-medium">
                        No completed payments found.
                    </div>
                )}
            </div>

            {/* 4. Payment Details */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h2 className="text-[12px] font-black text-[#0d4b5b] mb-5 uppercase tracking-widest">
                    Payment Details
                </h2>
                {payments.length > 0 ? (
                    <div className="space-y-3">
                        {payments.map((payment) => (
                            <div key={payment._id} className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                <div>
                                    <p className="text-[12px] font-bold text-gray-900">
                                        {payment.enrollment?.class?.name || "Unknown Class"}
                                    </p>
                                    <p className="text-[11px] text-gray-500 mt-1 font-medium">
                                        {payment.method} | {payment.targetMonth || "No target month"}
                                    </p>
                                    <p className="text-[10px] text-gray-400 mt-1 font-medium">
                                        {payment.paymentDate ? formatDate(payment.paymentDate) : "No payment date"}
                                    </p>
                                </div>
                                <div className="text-left sm:text-right flex flex-col items-start sm:items-end">
                                    <p className="text-[12px] font-black text-gray-900">
                                        LKR {Number(payment.amount || 0).toLocaleString()}
                                    </p>
                                    <span className={`inline-block mt-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest border ${payment.status === "completed" ? "border-emerald-400 text-emerald-600 bg-white" :
                                            payment.status === "pending" ? "border-amber-400 text-amber-600 bg-white" :
                                                "border-red-400 text-red-600 bg-white"
                                        }`}>
                                        {payment.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-6 text-gray-400 text-xs font-medium">
                        No payment records found.
                    </div>
                )}
            </div>

            {/* 5. System Meta */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex flex-wrap gap-4 sm:gap-8 items-center justify-center sm:justify-start text-[11px] text-gray-400 font-medium">
                <div className="flex items-center gap-1.5">
                    <CalendarDaysIcon className="w-4 h-4 text-[#8ea9c1]" />
                    <span>Joined: <span className="text-gray-900 font-bold ml-1">{formatDate(student.createdAt)}</span></span>
                </div>
                <div className="flex items-center gap-1.5">
                    <ClockIcon className="w-4 h-4 text-[#8ea9c1]" />
                    <span>Last Login: <span className="text-gray-900 font-bold ml-1">{student.lastLogin ? formatDate(student.lastLogin.toString()) : "Never"}</span></span>
                </div>
                {stats && (
                    <div className="flex items-center gap-1.5">
                        <CurrencyDollarIcon className="w-4 h-4 text-[#8ea9c1]" />
                        <span>Lifetime Paid: <span className="text-gray-900 font-bold ml-1">LKR {Number(stats.lifetimePaidAmount || 0).toLocaleString()}</span></span>
                    </div>
                )}
            </div>

        </div>
    );
}

// --- SUB-COMPONENTS ---

const LoadingSkeleton = () => (
    <div className="w-full space-y-5 animate-pulse">
        <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
        <div className="h-48 bg-gray-200 rounded-2xl"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="h-48 bg-gray-200 rounded-2xl"></div>
            <div className="h-48 bg-gray-200 rounded-2xl"></div>
        </div>
    </div>
);

const ErrorState = ({ message, onBack }: { message: string, onBack: () => void }) => (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
            <ShieldCheckIcon className="w-8 h-8 text-red-400" />
        </div>
        <h2 className="text-[15px] font-black text-gray-900 uppercase tracking-widest mb-2">Unavailable</h2>
        <p className="text-xs text-gray-500 mb-6 font-medium">{message}</p>
        <button onClick={onBack} className="px-6 py-2.5 bg-[#0d4b5b] text-white rounded-xl hover:bg-[#093946] transition-colors text-xs font-bold">
            Go Back
        </button>
    </div>
);