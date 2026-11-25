import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import EnrollmentService from "../../../services/EnrollmentService";
import {
    ArrowLeftIcon,
    EnvelopeIcon,
    PhoneIcon,
    CalendarDaysIcon,
    MapPinIcon,
    BookOpenIcon,
    ClockIcon,
    CurrencyDollarIcon,
    CreditCardIcon,
    PencilSquareIcon,
    CheckIcon,
    ClipboardDocumentIcon,
    XMarkIcon,
    ArrowPathIcon,
    PlusCircleIcon,
    AcademicCapIcon,
    CheckBadgeIcon,
    ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

// Services & Context
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
    return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
};

const getCurrentMonthValue = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    return `${y}-${m}`;
};

export default function ViewStudentPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user: currentUser } = useAuth();

    // Data State
    const [student, setStudent] = useState<UserData | null>(null);
    const [enrollments, setEnrollments] = useState<AdminStudentEnrollment[]>([]);
    const [payments, setPayments] = useState<AdminStudentPayment[]>([]);
    const [lifetimePaidClasses, setLifetimePaidClasses] = useState<
        AdminStudentPaidClassSummary[]
    >([]);
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

    // Grant Month Modal State
    const [grantModal, setGrantModal] = useState<{
        enrollmentId: string;
        className: string;
    } | null>(null);
    const [grantMonth, setGrantMonth] = useState(getCurrentMonthValue());
    const [grantNote, setGrantNote] = useState("");
    const [isGranting, setIsGranting] = useState(false);
    const [grantFeedback, setGrantFeedback] = useState<{
        type: "success" | "error";
        text: string;
    } | null>(null);

    // --- 1. Fetch Data ---
    const loadData = useCallback(async () => {
        if (!id) {
            setError("No student ID provided.");
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);
        try {
            const userRes = await UserService.getUserById(id);
            if (userRes.success && userRes.user) {
                setStudent(userRes.user as UserData);
                setEnrollments(userRes.enrollments || []);
                setPayments(userRes.payments || []);
                setLifetimePaidClasses(userRes.lifetimePaidClasses || []);
                setStats(userRes.stats || null);
            } else {
                throw new Error("Student not found in database.");
            }
        } catch (err: any) {
            console.error("Load Error Details:", err);
            setError(err.message || "Failed to load student profile.");
        } finally {
            setIsLoading(false);
        }
    }, [id]);

    useEffect(() => {
        if (currentUser && currentUser.role !== "admin") {
            navigate("/unauthorized");
            return;
        }
        loadData();
    }, [currentUser, navigate, loadData]);

    // --- 2. Grant Month Handler ---
    const openGrantModal = (enrollmentId: string, className: string) => {
        setGrantMonth(getCurrentMonthValue());
        setGrantNote("");
        setGrantFeedback(null);
        setGrantModal({ enrollmentId, className });
    };

    const handleGrantSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!grantModal) return;

        if (!/^\d{4}-\d{2}$/.test(grantMonth.trim())) {
            setGrantFeedback({ type: "error", text: "Please select a valid month (YYYY-MM)." });
            return;
        }

        setIsGranting(true);
        setGrantFeedback(null);
        try {
            await EnrollmentService.grantAccessMonths(
                grantModal.enrollmentId,
                [grantMonth.trim()],
                grantNote.trim() || undefined
            );
            setGrantFeedback({
                type: "success",
                text: `Access granted for ${grantMonth.trim()}.`,
            });
            await loadData();
            setTimeout(() => {
                setGrantModal(null);
                setGrantFeedback(null);
            }, 900);
        } catch (err: any) {
            setGrantFeedback({
                type: "error",
                text: err?.response?.data?.message || "Failed to grant access.",
            });
        } finally {
            setIsGranting(false);
        }
    };

    // --- Render Helpers ---
    const getBatchName = () => {
        if (!student?.batch) return "Unassigned";
        if (typeof student.batch === "object" && "name" in student.batch) {
            return (student.batch as any).name;
        }
        return "Assigned Batch";
    };

    const getAddressString = () => {
        const addr = (student as any).address;
        if (!addr || (typeof addr === "object" && !addr.street && !addr.city)) {
            return "Not Provided";
        }
        if (typeof addr === "string") return addr;
        return [addr.street, addr.city, addr.state, addr.zipCode]
            .filter(Boolean)
            .join(", ");
    };

    const getInitials = () =>
        student?.firstName
            ? `${student.firstName.charAt(0)}${student.lastName?.charAt(0) || ""}`.toUpperCase()
            : "ST";

    const getAccountStatus = () => {
        if (!student) return { label: "Active", cls: "bg-emerald-50 text-emerald-700 ring-emerald-600/15", dot: "bg-emerald-500" };
        if (student.isDeleted) return { label: "Deleted", cls: "bg-slate-100 text-slate-600 ring-slate-300", dot: "bg-slate-400" };
        if (student.isLocked) return { label: "Locked", cls: "bg-rose-50 text-rose-700 ring-rose-600/15", dot: "bg-rose-500" };
        if (!student.isActive) return { label: "Inactive", cls: "bg-amber-50 text-amber-700 ring-amber-600/15", dot: "bg-amber-500" };
        return { label: "Active", cls: "bg-emerald-50 text-emerald-700 ring-emerald-600/15", dot: "bg-emerald-500" };
    };

    // --- States ---
    if (isLoading) return <LoadingSkeleton />;
    if (error || !student) {
        return (
            <ErrorState
                message={error || "Profile not found"}
                onBack={() => navigate("/admin/students")}
            />
        );
    }

    const accountStatus = getAccountStatus();

    return (
        <div className="max-w-6xl mx-auto space-y-6 md:space-y-8 pb-24 md:pb-12">
            {/* TOP ACTION BAR */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <button
                    onClick={() => navigate("/admin/students")}
                    className="group inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-brand-prussian bg-white px-3.5 py-2 rounded-xl border border-slate-200/80 shadow-sm transition-all"
                >
                    <ArrowLeftIcon className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
                    Back to Directory
                </button>

                <button
                    onClick={() => navigate(`/admin/students/edit/${student._id}`)}
                    className="inline-flex items-center gap-2 bg-brand-prussian hover:bg-brand-cerulean text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-sm transition-all"
                >
                    <PencilSquareIcon className="w-4 h-4" />
                    Edit Profile
                </button>
            </div>

            {/* HERO PROFILE CARD */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/70 overflow-hidden">
                {/* Banner */}
                <div className="relative h-28 md:h-36 bg-gradient-to-r from-brand-prussian via-[#07273D] to-[#02121E] overflow-hidden">
                    <div className="pointer-events-none absolute -top-12 -right-12 w-56 h-56 rounded-full bg-brand-cerulean/20 blur-3xl" />
                    <div className="pointer-events-none absolute -bottom-10 left-1/4 w-44 h-44 rounded-full bg-brand-jasmine/10 blur-3xl" />
                </div>

                {/* Profile Info */}
                <div className="px-6 md:px-8 pb-6 md:pb-8">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 -mt-12 md:-mt-14 relative z-10">
                        <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 text-center sm:text-left">
                            {/* Avatar */}
                            <div className="relative shrink-0">
                                <div className="w-24 h-24 md:w-28 md:h-28 rounded-2xl border-4 border-white bg-white shadow-md overflow-hidden flex items-center justify-center">
                                    {student.profileImage ? (
                                        <img
                                            src={`${import.meta.env.VITE_API_BASE_URL}/${student.profileImage}`}
                                            alt={student.firstName}
                                            className="w-full h-full  object-cover"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${student.firstName}+${student.lastName || ""}&background=0b2540&color=fff`;
                                            }}
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-brand-aliceBlue flex items-center justify-center text-2xl md:text-3xl font-bold text-brand-cerulean">
                                            {getInitials()}
                                        </div>
                                    )}
                                </div>

                                {/* Verification Badge */}
                                <div
                                    title={student.isVerified ? "Verified Account" : "Pending Verification"}
                                    className="absolute -bottom-1.5 -right-1.5 bg-white p-1 rounded-full shadow-sm ring-1 ring-slate-100"
                                >
                                    {student.isVerified ? (
                                        <CheckBadgeIcon className="w-5 h-5 text-emerald-500" />
                                    ) : (
                                        <span className="block w-3.5 h-3.5 rounded-full bg-amber-400" />
                                    )}
                                </div>
                            </div>

                            {/* Name & Pills */}
                            <div>
                                <h1 className="text-2xl md:text-3xl font-bold text-brand-prussian tracking-tight">
                                    {student.firstName} {student.lastName}
                                </h1>
                                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-2">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-brand-aliceBlue text-brand-cerulean ring-1 ring-brand-cerulean/20">
                                        {getBatchName()}
                                    </span>
                                    <span
                                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ring-1 ${accountStatus.cls}`}
                                    >
                                        <span className={`w-1.5 h-1.5 rounded-full ${accountStatus.dot}`} />
                                        {accountStatus.label}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* System ID & Joined Meta */}
                        <div className="flex items-center justify-center sm:justify-end gap-4 pt-2 md:pt-0 md:pb-1">
                            <div className="text-center sm:text-right">
                                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                                    System ID
                                </p>
                                <p className="text-xs font-mono font-bold text-brand-prussian bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200/70 mt-0.5">
                                    #{student._id.slice(-8).toUpperCase()}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* KPI SUMMARY CARDS */}
            {stats && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    <div className="relative overflow-hidden bg-white p-5 rounded-2xl border border-slate-200/70 shadow-sm">
                        <div className="pointer-events-none absolute -top-10 -right-10 w-24 h-24 rounded-full bg-emerald-500/10 blur-2xl" />
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                    Lifetime Paid
                                </p>
                                <h3 className="text-2xl font-bold text-brand-prussian mt-2 tabular-nums">
                                    LKR {Number(stats.lifetimePaidAmount || 0).toLocaleString()}
                                </h3>
                            </div>
                            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
                                <CurrencyDollarIcon className="w-5 h-5" />
                            </div>
                        </div>
                    </div>

                    <div className="relative overflow-hidden bg-white p-5 rounded-2xl border border-slate-200/70 shadow-sm">
                        <div className="pointer-events-none absolute -top-10 -right-10 w-24 h-24 rounded-full bg-blue-500/10 blur-2xl" />
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                    Enrollments
                                </p>
                                <h3 className="text-2xl font-bold text-brand-prussian mt-2 tabular-nums">
                                    {stats.activeEnrollments}
                                    <span className="text-xs font-medium text-slate-400 ml-1">
                                        / {stats.totalEnrollments} total
                                    </span>
                                </h3>
                            </div>
                            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 ring-1 ring-blue-100">
                                <BookOpenIcon className="w-5 h-5" />
                            </div>
                        </div>
                    </div>

                    <div className="relative overflow-hidden bg-white p-5 rounded-2xl border border-slate-200/70 shadow-sm">
                        <div className="pointer-events-none absolute -top-10 -right-10 w-24 h-24 rounded-full bg-purple-500/10 blur-2xl" />
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                    Paid Classes
                                </p>
                                <h3 className="text-2xl font-bold text-brand-prussian mt-2 tabular-nums">
                                    {stats.totalPaidClasses}
                                </h3>
                            </div>
                            <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600 ring-1 ring-purple-100">
                                <AcademicCapIcon className="w-5 h-5" />
                            </div>
                        </div>
                    </div>

                    <div className="relative overflow-hidden bg-white p-5 rounded-2xl border border-slate-200/70 shadow-sm">
                        <div className="pointer-events-none absolute -top-10 -right-10 w-24 h-24 rounded-full bg-amber-500/10 blur-2xl" />
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                    Payments
                                </p>
                                <h3 className="text-2xl font-bold text-brand-prussian mt-2 tabular-nums">
                                    {stats.completedPayments}
                                    <span className="text-xs font-medium text-slate-400 ml-1">
                                        / {stats.totalPayments}
                                    </span>
                                </h3>
                            </div>
                            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 ring-1 ring-amber-100">
                                <CreditCardIcon className="w-5 h-5" />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MAIN CONTENT GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* LEFT: Contact & System Meta */}
                <div className="space-y-6">
                    <section className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/70">
                        <h2 className="text-base font-bold text-brand-prussian mb-5 pb-3 border-b border-slate-100 flex items-center gap-2">
                            <EnvelopeIcon className="w-5 h-5 text-brand-cerulean" />
                            Contact Information
                        </h2>
                        <div className="space-y-4">
                            <InfoRow
                                label="Email"
                                value={student.email}
                                icon={<EnvelopeIcon className="w-4 h-4 text-slate-400 shrink-0" />}
                                copyable
                            />
                            <InfoRow
                                label="Phone"
                                value={student.phoneNumber}
                                icon={<PhoneIcon className="w-4 h-4 text-slate-400 shrink-0" />}
                                copyable
                            />
                            <InfoRow
                                label="Address"
                                value={getAddressString()}
                                icon={<MapPinIcon className="w-4 h-4 text-slate-400 shrink-0" />}
                            />
                        </div>
                    </section>

                    <section className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/70 space-y-3.5">
                        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                            Account Activity
                        </h2>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-500 flex items-center gap-2">
                                <CalendarDaysIcon className="w-4 h-4 text-slate-400" />
                                Joined
                            </span>
                            <span className="font-semibold text-brand-prussian tabular-nums">
                                {formatDate(student.createdAt)}
                            </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-500 flex items-center gap-2">
                                <ClockIcon className="w-4 h-4 text-slate-400" />
                                Last Login
                            </span>
                            <span className="font-semibold text-brand-prussian tabular-nums">
                                {student.lastLogin ? formatDate(student.lastLogin.toString()) : "Never"}
                            </span>
                        </div>
                    </section>
                </div>

                {/* RIGHT: Enrolled Classes */}
                <div className="lg:col-span-2 space-y-6">
                    <section className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/70">
                        <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-100">
                            <h2 className="text-base font-bold text-brand-prussian flex items-center gap-2">
                                <BookOpenIcon className="w-5 h-5 text-brand-cerulean" />
                                Enrolled Classes
                            </h2>
                            <span className="text-xs font-semibold text-slate-400 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100 tabular-nums">
                                {enrollments.length} total
                            </span>
                        </div>

                        {enrollments.length > 0 ? (
                            <div className="space-y-3">
                                {enrollments.map((enr) => {
                                    const classData = typeof enr.class === "string" ? null : enr.class;
                                    const className = classData?.name || "Unknown Class";
                                    return (
                                        <div
                                            key={enr._id}
                                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/60 hover:border-brand-cerulean/30 transition-colors"
                                        >
                                            <div className="flex items-center gap-3.5 min-w-0">
                                                <div className="w-12 h-12 bg-white rounded-xl border border-slate-200/80 flex items-center justify-center shrink-0 overflow-hidden">
                                                    {classData?.coverImage ? (
                                                        <img
                                                            src={`${import.meta.env.VITE_API_BASE_URL}/${classData.coverImage}`}
                                                            className="w-full h-full object-cover"
                                                            alt={className}
                                                        />
                                                    ) : (
                                                        <BookOpenIcon className="w-5 h-5 text-slate-400" />
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <h4 className="font-semibold text-sm text-brand-prussian truncate">
                                                        {className}
                                                    </h4>
                                                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                                                        <span
                                                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ring-1 ${enr.paymentStatus === "paid"
                                                                ? "bg-emerald-50 text-emerald-700 ring-emerald-600/15"
                                                                : "bg-amber-50 text-amber-700 ring-amber-600/15"
                                                                }`}
                                                        >
                                                            {enr.paymentStatus}
                                                        </span>
                                                        <span className="truncate text-slate-400">
                                                            Joined {formatDate(enr.createdAt)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => openGrantModal(enr._id, className)}
                                                className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-brand-prussian hover:border-brand-cerulean hover:text-brand-cerulean shadow-sm transition-colors shrink-0"
                                            >
                                                <PlusCircleIcon className="w-4 h-4" />
                                                Grant Month
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-10 bg-slate-50/60 rounded-xl border border-dashed border-slate-200">
                                <p className="text-sm text-slate-400">No active enrollments found.</p>
                            </div>
                        )}
                    </section>

                    {/* Lifetime Paid Classes */}
                    <section className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/70">
                        <h2 className="text-base font-bold text-brand-prussian mb-5 pb-3 border-b border-slate-100 flex items-center gap-2">
                            <CurrencyDollarIcon className="w-5 h-5 text-brand-cerulean" />
                            Lifetime Paid Classes
                        </h2>

                        {lifetimePaidClasses.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                {lifetimePaidClasses.map((item) => (
                                    <div
                                        key={item.class._id}
                                        className="rounded-xl border border-slate-200/70 bg-slate-50/70 p-4 flex flex-col justify-between gap-3"
                                    >
                                        <div>
                                            <p className="font-semibold text-sm text-brand-prussian">
                                                {item.class.name}
                                            </p>
                                            <p className="text-xs text-slate-500 mt-1">
                                                {item.paymentCount} payment(s) • {item.paidMonths?.length || 0}{" "}
                                                month(s)
                                            </p>
                                        </div>
                                        <div className="flex items-end justify-between pt-2 border-t border-slate-200/60">
                                            <span className="text-[11px] text-slate-400">
                                                Last: {item.lastPaidAt ? formatDate(item.lastPaidAt) : "N/A"}
                                            </span>
                                            <span className="text-sm font-bold text-emerald-700 tabular-nums">
                                                LKR {Number(item.totalPaidAmount || 0).toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-10 bg-slate-50/60 rounded-xl border border-dashed border-slate-200">
                                <p className="text-sm text-slate-400">No completed class payments yet.</p>
                            </div>
                        )}
                    </section>
                </div>
            </div>

            {/* PAYMENT HISTORY TABLE */}
            <section className="bg-white rounded-2xl border border-slate-200/70 shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                    <h2 className="text-base font-bold text-brand-prussian flex items-center gap-2">
                        <CreditCardIcon className="w-5 h-5 text-brand-cerulean" />
                        Payment History
                    </h2>
                    <span className="text-xs font-semibold text-slate-400 tabular-nums">
                        {payments.length} record(s)
                    </span>
                </div>

                {payments.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-50/80 text-[11px] uppercase text-slate-500 font-semibold tracking-wider border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-3.5">Class</th>
                                    <th className="px-6 py-3.5">Target Month</th>
                                    <th className="px-6 py-3.5">Method</th>
                                    <th className="px-6 py-3.5">Date</th>
                                    <th className="px-6 py-3.5">Status</th>
                                    <th className="px-6 py-3.5 text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {payments.map((payment) => (
                                    <tr key={payment._id} className="hover:bg-slate-50/80 transition-colors">
                                        <td className="px-6 py-4 font-semibold text-sm text-brand-prussian">
                                            {payment.enrollment?.class?.name || "Unknown Class"}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                                                {payment.targetMonth || "—"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-xs font-medium text-slate-600 capitalize">
                                            {payment.method?.replace("_", " ") || "—"}
                                        </td>
                                        <td className="px-6 py-4 text-xs text-slate-500 tabular-nums">
                                            {payment.paymentDate ? formatDate(payment.paymentDate) : "—"}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span
                                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold capitalize ring-1 ${payment.status === "completed"
                                                    ? "bg-emerald-50 text-emerald-700 ring-emerald-600/15"
                                                    : payment.status === "pending"
                                                        ? "bg-amber-50 text-amber-700 ring-amber-600/15"
                                                        : "bg-rose-50 text-rose-700 ring-rose-600/15"
                                                    }`}
                                            >
                                                {payment.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right text-sm font-bold text-brand-prussian tabular-nums">
                                            LKR {Number(payment.amount || 0).toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-center py-12 text-slate-400 text-sm">
                        No payment records found for this student.
                    </div>
                )}
            </section>

            {/* GRANT MONTH MODAL */}
            {grantModal && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-200/70 overflow-hidden">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                            <div>
                                <h3 className="text-base font-bold text-brand-prussian">
                                    Grant Monthly Access
                                </h3>
                                <p className="text-xs text-slate-400 mt-0.5 truncate max-w-[280px]">
                                    {grantModal.className}
                                </p>
                            </div>
                            <button
                                onClick={() => !isGranting && setGrantModal(null)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                            >
                                <XMarkIcon className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleGrantSubmit} className="p-6 space-y-4">
                            <div className="space-y-1.5">
                                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                                    Target Month <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="month"
                                    required
                                    value={grantMonth}
                                    onChange={(e) => setGrantMonth(e.target.value)}
                                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-brand-prussian focus:bg-white focus:ring-2 focus:ring-brand-cerulean/20 focus:border-brand-cerulean outline-none"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                                    Note (Optional)
                                </label>
                                <input
                                    type="text"
                                    value={grantNote}
                                    onChange={(e) => setGrantNote(e.target.value)}
                                    placeholder="e.g., Manual grant / scholarship"
                                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:bg-white focus:ring-2 focus:ring-brand-cerulean/20 focus:border-brand-cerulean outline-none"
                                />
                            </div>

                            {grantFeedback && (
                                <div
                                    className={`p-3 rounded-xl text-xs font-semibold ${grantFeedback.type === "success"
                                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                        : "bg-rose-50 text-rose-700 border border-rose-200"
                                        }`}
                                >
                                    {grantFeedback.text}
                                </div>
                            )}

                            <div className="flex justify-end gap-2.5 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setGrantModal(null)}
                                    disabled={isGranting}
                                    className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isGranting}
                                    className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-brand-prussian hover:bg-brand-cerulean rounded-xl transition-colors disabled:opacity-50"
                                >
                                    {isGranting && <ArrowPathIcon className="w-3.5 h-3.5 animate-spin" />}
                                    <span>{isGranting ? "Granting..." : "Grant Access"}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

// --- SUB-COMPONENTS ---

const InfoRow = ({
    label,
    value,
    icon,
    copyable,
}: {
    label: string;
    value?: string;
    icon?: React.ReactNode;
    copyable?: boolean;
}) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        if (!value) return;
        navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };

    return (
        <div className="flex items-start justify-between gap-3 group">
            <div className="flex items-start gap-2.5 min-w-0">
                <div className="mt-0.5">{icon}</div>
                <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                        {label}
                    </p>
                    <p className="text-sm font-medium text-brand-prussian break-words mt-0.5">
                        {value || <span className="text-slate-300 italic">Not Provided</span>}
                    </p>
                </div>
            </div>

            {copyable && value && (
                <button
                    onClick={handleCopy}
                    title={copied ? "Copied!" : `Copy ${label}`}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-brand-cerulean hover:bg-brand-aliceBlue transition-colors shrink-0"
                >
                    {copied ? (
                        <CheckIcon className="w-4 h-4 text-emerald-500" />
                    ) : (
                        <ClipboardDocumentIcon className="w-4 h-4" />
                    )}
                </button>
            )}
        </div>
    );
};

const LoadingSkeleton = () => (
    <div className="max-w-6xl mx-auto space-y-6 animate-pulse pb-12">
        <div className="h-9 w-36 bg-slate-200 rounded-xl" />
        <div className="h-56 bg-white rounded-2xl border border-slate-100" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-28 bg-white rounded-2xl border border-slate-100" />
            ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="h-64 bg-white rounded-2xl border border-slate-100" />
            <div className="lg:col-span-2 h-64 bg-white rounded-2xl border border-slate-100" />
        </div>
    </div>
);

const ErrorState = ({
    message,
    onBack,
}: {
    message: string;
    onBack: () => void;
}) => (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
        <div className="w-14 h-14 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mb-4">
            <ExclamationTriangleIcon className="w-7 h-7" />
        </div>
        <h2 className="text-lg font-bold text-brand-prussian mb-1">
            Profile Unavailable
        </h2>
        <p className="text-sm text-slate-500 mb-6 max-w-sm">{message}</p>
        <button
            onClick={onBack}
            className="px-5 py-2.5 bg-brand-prussian text-white text-sm font-semibold rounded-xl hover:bg-brand-cerulean transition-colors"
        >
            Back to Directory
        </button>
    </div>
);