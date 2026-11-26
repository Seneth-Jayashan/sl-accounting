import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
    format,
    startOfMonth,
    addMonths,
    subMonths,
    eachMonthOfInterval,
    isBefore,
    isAfter,
    isSameMonth,
} from "date-fns";
import {
    CreditCard,
    Landmark,
    ArrowLeft,
    ArrowRight,
    CheckCircle2,
    CalendarDays,
    Lock,
    Tag,
    ShieldCheck,
    Copy,
    Check,
    AlertCircle,
    Loader2,
    Sparkles,
    X,
} from "lucide-react";

// Services & Context
import ClassService from "../../../services/ClassService";
import EnrollmentService from "../../../services/EnrollmentService";
import PaymentService from "../../../services/PaymentService";
import { useAuth } from "../../../contexts/AuthContext";

// --- Config ---
const IS_DEV = import.meta.env.MODE === "development";
const NOTIFY_URL_BASE =
    import.meta.env.VITE_NOTIFY_URL || "http://localhost:3000";
const PAYHERE_CHECKOUT_URL = IS_DEV
    ? "https://sandbox.payhere.lk/pay/checkout"
    : "https://www.payhere.lk/pay/checkout";

const BANK_OPTIONS = JSON.parse(
    import.meta.env.VITE_BANK_DETAILS || "[]"
) as BankAccount[];

interface BankAccount {
    id: number;
    bankName: string;
    branch: string;
    accountName: string;
    accountNumber: string;
}

interface LinkedClass {
    _id: string;
    name: string;
    price: number;
}

interface ClassData {
    _id: string;
    name: string;
    price: number;
    level: string;
    coverImage?: string;
    firstSessionDate?: string;
    linkedRevisionClass?: LinkedClass;
    linkedPaperClass?: LinkedClass;
    bundlePriceRevision?: number;
    bundlePricePaper?: number;
    bundlePriceFull?: number;
}

export default function ClassPaymentPage() {
    const { classId } = useParams<{ classId: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();

    // State
    const [classData, setClassData] = useState<ClassData | null>(null);
    const [paidMonths, setPaidMonths] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    // Selection State
    const [selectedMonth, setSelectedMonth] = useState<string>("");
    const [includeRevision, setIncludeRevision] = useState(false);
    const [includePaper, setIncludePaper] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<"payhere" | "bank">(
        "payhere"
    );
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [copiedBankId, setCopiedBankId] = useState<number | null>(null);

    // --- 1. Load Data ---
    useEffect(() => {
        if (!classId || !user) return;

        let isMounted = true;
        const loadData = async () => {
            try {
                const clsRes = await ClassService.getPublicClassById(classId);
                const cls = Array.isArray(clsRes) ? clsRes[0] : clsRes;
                if (isMounted) setClassData(cls);

                try {
                    const enrollRes = await EnrollmentService.enrollInClass(
                        classId,
                        user._id
                    );

                    if (isMounted && enrollRes && enrollRes.enrollment) {
                        const paid = enrollRes.enrollment.paidMonths || [];
                        setPaidMonths(paid);

                        const currentMonth = format(new Date(), "yyyy-MM");
                        if (!paid.includes(currentMonth)) {
                            setSelectedMonth(currentMonth);
                        } else {
                            setSelectedMonth(format(addMonths(new Date(), 1), "yyyy-MM"));
                        }
                    }
                } catch (enrollErr) {
                    console.warn(
                        "No prior enrollment found or creation pending:",
                        enrollErr
                    );
                    if (isMounted) setSelectedMonth(format(new Date(), "yyyy-MM"));
                }
            } catch (err) {
                console.error(err);
                if (isMounted) setError("Failed to load class details.");
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        loadData();
        return () => {
            isMounted = false;
        };
    }, [classId, user]);

    // --- 2. Generate Month Grid (STRICT 7 MONTH RANGE) ---
    const monthList = useMemo(() => {
        const today = startOfMonth(new Date());
        const start = subMonths(today, 3);
        const end = addMonths(today, 3);

        try {
            const months = eachMonthOfInterval({ start, end });

            return months
                .map((date) => {
                    const value = format(date, "yyyy-MM");
                    const isPaid = paidMonths.includes(value);
                    const isCurrent = isSameMonth(date, today);
                    const isPast = isBefore(date, today);
                    const isFuture = isAfter(date, today);

                    let status: "paid" | "overdue" | "due" | "advance" = "due";
                    if (isPaid) status = "paid";
                    else if (isPast) status = "overdue";
                    else if (isFuture) status = "advance";
                    else if (isCurrent) status = "due";

                    return {
                        value,
                        label: format(date, "MMMM yyyy"),
                        shortLabel: format(date, "MMM ''yy"),
                        status,
                    };
                })
                .reverse();
        } catch (e) {
            console.error("Date interval error", e);
            return [];
        }
    }, [paidMonths]);

    // --- 3. Calculate Total ---
    const standardSum = useMemo(() => {
        if (!classData) return 0;
        let sum = classData.price;
        if (includeRevision && classData.linkedRevisionClass) {
            sum += classData.linkedRevisionClass.price;
        }
        if (includePaper && classData.linkedPaperClass) {
            sum += classData.linkedPaperClass.price;
        }
        return sum;
    }, [classData, includeRevision, includePaper]);

    const totalAmount = useMemo(() => {
        if (!classData) return 0;

        if (includeRevision && includePaper && classData.bundlePriceFull != null) {
            return classData.bundlePriceFull;
        }
        if (
            includeRevision &&
            !includePaper &&
            classData.bundlePriceRevision != null
        ) {
            return classData.bundlePriceRevision;
        }
        if (
            !includeRevision &&
            includePaper &&
            classData.bundlePricePaper != null
        ) {
            return classData.bundlePricePaper;
        }

        return standardSum;
    }, [classData, includeRevision, includePaper, standardSum]);

    const savingsAmount = Math.max(0, standardSum - totalAmount);
    const isDiscountApplied = savingsAmount > 0;

    const formatPrice = (price: number) =>
        new Intl.NumberFormat("en-LK", {
            style: "currency",
            currency: "LKR",
            maximumFractionDigits: 0,
        }).format(price);

    const selectedMonthLabel = selectedMonth
        ? format(new Date(`${selectedMonth}-01T00:00:00`), "MMMM yyyy")
        : "Select a month";

    const handleCopyAccount = (accountNumber: string, bankId: number) => {
        navigator.clipboard.writeText(accountNumber);
        setCopiedBankId(bankId);
        setTimeout(() => setCopiedBankId(null), 2000);
    };

    // --- 4. Handle Pay ---
    const handlePayment = async () => {
        if (!selectedMonth || !classData || !user) return;
        setSubmitting(true);
        setError(null);

        try {
            const enrollmentRes = await EnrollmentService.enrollInClass(
                classData._id,
                user._id,
                { includeRevision, includePaper }
            );

            const finalAmount = enrollmentRes.totalAmount || totalAmount;
            const enrollmentId = enrollmentRes.enrollment._id;

            if (paymentMethod === "bank") {
                navigate(`/student/payment/upload/${enrollmentId}`, {
                    state: { amount: finalAmount, targetMonth: selectedMonth },
                });
            } else {
                const orderId = `${enrollmentId}_${Date.now()}`;
                const signature = await PaymentService.initiatePayHere(
                    finalAmount,
                    orderId
                );

                const params = {
                    merchant_id: signature.merchant_id,
                    return_url: `${window.location.origin}/student/classes?payment=success`,
                    cancel_url: `${window.location.origin}/student/classes/${classId}/pay?error=cancel`,
                    notify_url: `${NOTIFY_URL_BASE}/payments/payhere-webhook`,
                    order_id: orderId,
                    items: `${classData.name} [${selectedMonth}]`,
                    currency: "LKR",
                    amount: signature.amount,
                    hash: signature.hash,
                    first_name: user.firstName,
                    last_name: user.lastName,
                    email: user.email,
                    phone: user.phoneNumber || "0770000000",
                    address: "Sri Lanka",
                    city: "Galle",
                    country: "Sri Lanka",
                    custom_1: enrollmentId,
                    custom_2: selectedMonth,
                };

                const form = document.createElement("form");
                form.setAttribute("method", "POST");
                form.setAttribute("action", PAYHERE_CHECKOUT_URL);
                Object.keys(params).forEach((key) => {
                    const input = document.createElement("input");
                    input.type = "hidden";
                    input.name = key;
                    input.value = (params as any)[key];
                    form.appendChild(input);
                });
                document.body.appendChild(form);
                form.submit();
            }
        } catch (err: any) {
            setError(err.message || "Payment processing failed.");
            setSubmitting(false);
        }
    };

    // --- LOADING SKELETON ---
    if (loading) {
        return (
            <div className="max-w-6xl mx-auto space-y-6 pb-24 animate-pulse">
                <div className="h-36 rounded-[2rem] bg-gray-200" />
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="h-80 rounded-3xl bg-white border border-gray-100" />
                        <div className="h-52 rounded-3xl bg-white border border-gray-100" />
                    </div>
                    <div className="h-96 rounded-3xl bg-white border border-gray-100" />
                </div>
            </div>
        );
    }

    const hasBundles = Boolean(
        classData?.linkedRevisionClass || classData?.linkedPaperClass
    );

    return (
        <div className="max-w-6xl mx-auto space-y-6 pb-24 sm:pb-10">
            {/* --- HERO HEADER --- */}
            <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-brand-prussian via-[#0d3a4b] to-brand-cerulean p-6 sm:p-8 text-white shadow-xl shadow-brand-prussian/15">
                <div className="pointer-events-none absolute -top-20 -right-16 w-72 h-72 rounded-full bg-brand-jasmine/20 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-24 left-1/3 w-64 h-64 rounded-full bg-white/10 blur-3xl" />

                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
                    <div className="flex items-start gap-3.5 min-w-0">
                        <button
                            onClick={() => navigate(-1)}
                            aria-label="Go Back"
                            className="mt-0.5 w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 backdrop-blur-md flex items-center justify-center text-white transition-colors shrink-0"
                        >
                            <ArrowLeft size={18} />
                        </button>
                        <div className="min-w-0">
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-semibold text-brand-jasmine mb-2.5">
                                <Sparkles size={12} />
                                <span>Monthly Fee Checkout</span>
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-snug">
                                {classData?.name || "Class Payments"}
                            </h1>
                            <p className="text-white/75 text-sm mt-1">
                                Select your billing month and preferred payment method to
                                activate access.
                            </p>
                        </div>
                    </div>

                    <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/15 px-4 py-2.5 rounded-2xl text-xs font-bold text-white/90 shrink-0 self-start md:self-center">
                        <Lock size={14} className="text-emerald-300" />
                        <span>SSL Secured Checkout</span>
                    </div>
                </div>
            </section>

            {/* --- ERROR BANNER --- */}
            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        className="bg-red-50 border border-red-200/80 text-red-700 px-5 py-3.5 rounded-2xl text-sm font-medium flex items-center justify-between gap-3 shadow-xs"
                    >
                        <div className="flex items-center gap-2.5">
                            <AlertCircle size={18} className="text-red-500 shrink-0" />
                            <span>{error}</span>
                        </div>
                        <button
                            onClick={() => setError(null)}
                            className="p-1 rounded-lg hover:bg-red-100 text-red-500 transition-colors"
                            aria-label="Dismiss error"
                        >
                            <X size={15} />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* --- MAIN CHECKOUT GRID --- */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                {/* LEFT COLUMN (2/3) */}
                <div className="lg:col-span-2 space-y-6">
                    {/* 1. BILLING CYCLE SELECTION */}
                    <section className="bg-white p-5 sm:p-7 rounded-3xl shadow-sm border border-gray-100">
                        <div className="flex items-center gap-3 mb-5">
                            <div className="w-10 h-10 rounded-2xl bg-brand-cerulean/10 text-brand-cerulean flex items-center justify-center shrink-0">
                                <CalendarDays size={20} />
                            </div>
                            <div>
                                <p className="text-[10px] font-extrabold uppercase tracking-widest text-brand-cerulean">
                                    Step 01
                                </p>
                                <h2 className="text-lg font-extrabold text-brand-prussian leading-tight">
                                    Select Billing Cycle
                                </h2>
                            </div>
                        </div>

                        {monthList.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                {monthList.map((m) => {
                                    const isSelected = selectedMonth === m.value;
                                    const isPaid = m.status === "paid";

                                    const badgeMap = {
                                        paid: {
                                            label: "Paid",
                                            cls: "bg-emerald-50 text-emerald-700 border-emerald-200",
                                        },
                                        overdue: {
                                            label: "Overdue",
                                            cls: "bg-red-50 text-red-600 border-red-200",
                                        },
                                        due: {
                                            label: "Due Now",
                                            cls: "bg-brand-aliceBlue text-brand-cerulean border-brand-cerulean/20",
                                        },
                                        advance: {
                                            label: "Advance",
                                            cls: "bg-emerald-50 text-emerald-600 border-emerald-100",
                                        },
                                    };

                                    const badge = badgeMap[m.status];

                                    return (
                                        <button
                                            key={m.value}
                                            type="button"
                                            disabled={isPaid}
                                            onClick={() => setSelectedMonth(m.value)}
                                            className={`group relative p-4 rounded-2xl border-2 text-left transition-all flex items-center justify-between gap-3 ${isPaid
                                                    ? "bg-gray-50/80 border-gray-100 opacity-65 cursor-not-allowed"
                                                    : isSelected
                                                        ? "border-brand-cerulean bg-brand-aliceBlue/35 shadow-sm ring-1 ring-brand-cerulean/20"
                                                        : m.status === "overdue"
                                                            ? "border-red-100 bg-red-50/20 hover:border-red-200"
                                                            : "border-gray-100 bg-white hover:border-brand-cerulean/40 hover:bg-gray-50/50"
                                                }`}
                                        >
                                            <div className="min-w-0">
                                                <p
                                                    className={`font-extrabold text-sm sm:text-base truncate ${isPaid
                                                            ? "text-gray-500"
                                                            : isSelected
                                                                ? "text-brand-prussian"
                                                                : "text-gray-800"
                                                        }`}
                                                >
                                                    {m.label}
                                                </p>
                                                <p className="text-xs text-gray-400 font-medium mt-0.5">
                                                    {isPaid
                                                        ? "Access Active"
                                                        : m.status === "advance"
                                                            ? "Pay in advance"
                                                            : "Pending payment"}
                                                </p>
                                            </div>

                                            <div className="flex items-center gap-2 shrink-0">
                                                <span
                                                    className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${badge.cls}`}
                                                >
                                                    {badge.label}
                                                </span>

                                                {isPaid ? (
                                                    <CheckCircle2
                                                        size={18}
                                                        className="text-emerald-500 shrink-0"
                                                    />
                                                ) : (
                                                    <div
                                                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors shrink-0 ${isSelected
                                                                ? "bg-brand-cerulean border-brand-cerulean text-white"
                                                                : "border-gray-300 bg-white"
                                                            }`}
                                                    >
                                                        {isSelected && <Check size={12} strokeWidth={3} />}
                                                    </div>
                                                )}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                                <p className="text-gray-400 text-sm font-medium">
                                    No billing cycles available yet.
                                </p>
                            </div>
                        )}
                    </section>

                    {/* 2. BUNDLE OPTIONS */}
                    {hasBundles && (
                        <section className="bg-white p-5 sm:p-7 rounded-3xl shadow-sm border border-gray-100">
                            <div className="flex items-center gap-3 mb-5">
                                <div className="w-10 h-10 rounded-2xl bg-brand-cerulean/10 text-brand-cerulean flex items-center justify-center shrink-0">
                                    <Tag size={20} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-extrabold uppercase tracking-widest text-brand-cerulean">
                                        Step 02 • Optional
                                    </p>
                                    <h2 className="text-lg font-extrabold text-brand-prussian leading-tight">
                                        Customize Your Plan
                                    </h2>
                                </div>
                            </div>

                            <div className="space-y-3">
                                {classData?.linkedRevisionClass && (
                                    <label
                                        className={`flex items-center gap-4 p-4 sm:p-5 rounded-2xl border-2 cursor-pointer transition-all ${includeRevision
                                                ? "border-brand-cerulean bg-brand-aliceBlue/35 shadow-xs"
                                                : "border-gray-100 bg-gray-50/40 hover:border-gray-200 hover:bg-white"
                                            }`}
                                    >
                                        <div
                                            className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-colors shrink-0 ${includeRevision
                                                    ? "bg-brand-cerulean border-brand-cerulean text-white"
                                                    : "border-gray-300 bg-white"
                                                }`}
                                        >
                                            {includeRevision && <Check size={14} strokeWidth={3} />}
                                        </div>
                                        <input
                                            type="checkbox"
                                            className="hidden"
                                            checked={includeRevision}
                                            onChange={(e) => setIncludeRevision(e.target.checked)}
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-extrabold text-brand-prussian">
                                                Revision Class
                                            </p>
                                            <p className="text-xs text-gray-500 mt-0.5">
                                                Add comprehensive revision sessions to your monthly plan
                                            </p>
                                        </div>
                                        <span className="text-sm font-extrabold text-brand-cerulean shrink-0">
                                            +{formatPrice(classData.linkedRevisionClass.price)}
                                        </span>
                                    </label>
                                )}

                                {classData?.linkedPaperClass && (
                                    <label
                                        className={`flex items-center gap-4 p-4 sm:p-5 rounded-2xl border-2 cursor-pointer transition-all ${includePaper
                                                ? "border-brand-cerulean bg-brand-aliceBlue/35 shadow-xs"
                                                : "border-gray-100 bg-gray-50/40 hover:border-gray-200 hover:bg-white"
                                            }`}
                                    >
                                        <div
                                            className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-colors shrink-0 ${includePaper
                                                    ? "bg-brand-cerulean border-brand-cerulean text-white"
                                                    : "border-gray-300 bg-white"
                                                }`}
                                        >
                                            {includePaper && <Check size={14} strokeWidth={3} />}
                                        </div>
                                        <input
                                            type="checkbox"
                                            className="hidden"
                                            checked={includePaper}
                                            onChange={(e) => setIncludePaper(e.target.checked)}
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-extrabold text-brand-prussian">
                                                Paper Class
                                            </p>
                                            <p className="text-xs text-gray-500 mt-0.5">
                                                Add model paper discussions & exam walkthroughs
                                            </p>
                                        </div>
                                        <span className="text-sm font-extrabold text-brand-cerulean shrink-0">
                                            +{formatPrice(classData.linkedPaperClass.price)}
                                        </span>
                                    </label>
                                )}
                            </div>
                        </section>
                    )}

                    {/* 3. PAYMENT METHOD */}
                    <section className="bg-white p-5 sm:p-7 rounded-3xl shadow-sm border border-gray-100">
                        <div className="flex items-center gap-3 mb-5">
                            <div className="w-10 h-10 rounded-2xl bg-brand-cerulean/10 text-brand-cerulean flex items-center justify-center shrink-0">
                                <CreditCard size={20} />
                            </div>
                            <div>
                                <p className="text-[10px] font-extrabold uppercase tracking-widest text-brand-cerulean">
                                    Step {hasBundles ? "03" : "02"}
                                </p>
                                <h2 className="text-lg font-extrabold text-brand-prussian leading-tight">
                                    Payment Method
                                </h2>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* PayHere Option */}
                            <button
                                type="button"
                                onClick={() => setPaymentMethod("payhere")}
                                className={`p-5 rounded-2xl border-2 text-left transition-all flex flex-col gap-3 ${paymentMethod === "payhere"
                                        ? "border-brand-cerulean bg-brand-aliceBlue/35 shadow-sm ring-1 ring-brand-cerulean/20"
                                        : "border-gray-100 hover:border-gray-200 bg-gray-50/40 hover:bg-white"
                                    }`}
                            >
                                <div className="flex items-center justify-between w-full">
                                    <div
                                        className={`w-10 h-10 rounded-xl flex items-center justify-center ${paymentMethod === "payhere"
                                                ? "bg-brand-cerulean text-white"
                                                : "bg-white text-gray-400 border border-gray-200"
                                            }`}
                                    >
                                        <CreditCard size={20} />
                                    </div>
                                    <div
                                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === "payhere"
                                                ? "bg-brand-cerulean border-brand-cerulean text-white"
                                                : "border-gray-300 bg-white"
                                            }`}
                                    >
                                        {paymentMethod === "payhere" && (
                                            <Check size={12} strokeWidth={3} />
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <p className="font-extrabold text-sm text-brand-prussian">
                                        Pay Online (PayHere)
                                    </p>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        Instant activation via Visa, MasterCard, or eZ Cash
                                    </p>
                                </div>
                            </button>

                            {/* Bank Transfer Option */}
                            <button
                                type="button"
                                onClick={() => setPaymentMethod("bank")}
                                className={`p-5 rounded-2xl border-2 text-left transition-all flex flex-col gap-3 ${paymentMethod === "bank"
                                        ? "border-brand-cerulean bg-brand-aliceBlue/35 shadow-sm ring-1 ring-brand-cerulean/20"
                                        : "border-gray-100 hover:border-gray-200 bg-gray-50/40 hover:bg-white"
                                    }`}
                            >
                                <div className="flex items-center justify-between w-full">
                                    <div
                                        className={`w-10 h-10 rounded-xl flex items-center justify-center ${paymentMethod === "bank"
                                                ? "bg-brand-cerulean text-white"
                                                : "bg-white text-gray-400 border border-gray-200"
                                            }`}
                                    >
                                        <Landmark size={20} />
                                    </div>
                                    <div
                                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === "bank"
                                                ? "bg-brand-cerulean border-brand-cerulean text-white"
                                                : "border-gray-300 bg-white"
                                            }`}
                                    >
                                        {paymentMethod === "bank" && (
                                            <Check size={12} strokeWidth={3} />
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <p className="font-extrabold text-sm text-brand-prussian">
                                        Bank Transfer
                                    </p>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        Deposit to our bank account & upload your slip
                                    </p>
                                </div>
                            </button>
                        </div>

                        {/* Bank Details Panel */}
                        <AnimatePresence>
                            {paymentMethod === "bank" && BANK_OPTIONS.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="overflow-hidden"
                                >
                                    <div className="mt-5 space-y-3.5 pt-5 border-t border-gray-100">
                                        {BANK_OPTIONS.map((bank) => {
                                            const isCopied = copiedBankId === bank.id;
                                            return (
                                                <div
                                                    key={bank.id}
                                                    className="p-5 bg-gray-50/90 rounded-2xl border border-gray-200/80 space-y-4"
                                                >
                                                    <div className="flex items-center justify-between gap-2">
                                                        <span className="text-xs font-extrabold text-brand-prussian flex items-center gap-2">
                                                            <Landmark
                                                                size={15}
                                                                className="text-brand-cerulean"
                                                            />
                                                            {bank.bankName}
                                                        </span>
                                                        <span className="text-[10px] font-bold uppercase tracking-wider bg-white border border-gray-200 px-2.5 py-1 rounded-full text-gray-500">
                                                            {bank.branch}
                                                        </span>
                                                    </div>

                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
                                                        <div className="bg-white p-3.5 rounded-xl border border-gray-200/70 flex items-center justify-between gap-2">
                                                            <div className="min-w-0">
                                                                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">
                                                                    Account Number
                                                                </p>
                                                                <p className="font-mono font-extrabold text-brand-prussian text-base tracking-wide mt-0.5 truncate">
                                                                    {bank.accountNumber}
                                                                </p>
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    handleCopyAccount(bank.accountNumber, bank.id)
                                                                }
                                                                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold inline-flex items-center gap-1 transition-colors shrink-0 ${isCopied
                                                                        ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                                                                        : "bg-gray-50 hover:bg-brand-aliceBlue text-gray-600 hover:text-brand-cerulean border border-gray-200"
                                                                    }`}
                                                            >
                                                                {isCopied ? (
                                                                    <>
                                                                        <Check size={13} />
                                                                        <span>Copied</span>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <Copy size={13} />
                                                                        <span>Copy</span>
                                                                    </>
                                                                )}
                                                            </button>
                                                        </div>

                                                        <div className="bg-white p-3.5 rounded-xl border border-gray-200/70">
                                                            <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">
                                                                Account Holder
                                                            </p>
                                                            <p className="font-bold text-gray-800 mt-1 truncate">
                                                                {bank.accountName}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="text-xs text-gray-500 flex items-center gap-2 pt-1">
                                                        <ShieldCheck
                                                            size={15}
                                                            className="text-brand-cerulean shrink-0"
                                                        />
                                                        <span>
                                                            Keep your transfer receipt or screenshot ready for
                                                            the next step.
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </section>
                </div>

                {/* RIGHT COLUMN: STICKY ORDER SUMMARY (1/3) */}
                <aside className="lg:col-span-1">
                    <div className="bg-white rounded-3xl shadow-xl shadow-brand-prussian/8 border border-gray-100 overflow-hidden sticky top-6">
                        {/* Summary Header */}
                        <div className="bg-gradient-to-r from-brand-prussian to-[#0d3a4b] px-6 py-5 text-white">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-brand-jasmine">
                                Checkout Summary
                            </p>
                            <h3 className="font-extrabold text-lg mt-0.5">Order Details</h3>
                        </div>

                        <div className="p-6 space-y-5">
                            {/* Billing Period Pill */}
                            <div className="flex items-center justify-between text-sm bg-gray-50 p-3.5 rounded-2xl border border-gray-100">
                                <span className="text-gray-500 font-semibold text-xs">
                                    Billing Period
                                </span>
                                <span className="font-extrabold text-brand-prussian text-xs sm:text-sm">
                                    {selectedMonthLabel}
                                </span>
                            </div>

                            {/* Line Items */}
                            <div className="space-y-3 pb-5 border-b border-dashed border-gray-200 text-sm">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-500 font-medium">Theory Fee</span>
                                    <span className="font-bold text-gray-900">
                                        {formatPrice(classData?.price || 0)}
                                    </span>
                                </div>

                                {includeRevision && classData?.linkedRevisionClass && (
                                    <div className="flex justify-between items-center text-brand-cerulean">
                                        <span className="font-semibold">+ Revision Class</span>
                                        <span className="font-bold">
                                            {formatPrice(classData.linkedRevisionClass.price)}
                                        </span>
                                    </div>
                                )}

                                {includePaper && classData?.linkedPaperClass && (
                                    <div className="flex justify-between items-center text-brand-cerulean">
                                        <span className="font-semibold">+ Paper Class</span>
                                        <span className="font-bold">
                                            {formatPrice(classData.linkedPaperClass.price)}
                                        </span>
                                    </div>
                                )}

                                {isDiscountApplied && (
                                    <div className="flex justify-between items-center text-xs text-emerald-700 bg-emerald-50 px-3.5 py-2.5 rounded-xl border border-emerald-100 mt-2">
                                        <span className="font-bold flex items-center gap-1.5">
                                            <Tag size={14} />
                                            Bundle Savings
                                        </span>
                                        <span className="font-extrabold">
                                            - {formatPrice(savingsAmount)}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Total Payable */}
                            <div className="flex items-end justify-between">
                                <div>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                                        Total Payable
                                    </p>
                                    <p className="text-2xl sm:text-3xl font-black text-brand-prussian tracking-tight mt-0.5">
                                        {formatPrice(totalAmount)}
                                    </p>
                                </div>
                                <span className="text-[11px] font-bold text-gray-400 bg-gray-100 px-2.5 py-1 rounded-lg">
                                    {paymentMethod === "payhere" ? "PayHere" : "Bank Slip"}
                                </span>
                            </div>

                            {/* Primary CTA */}
                            <button
                                onClick={handlePayment}
                                disabled={submitting || !selectedMonth}
                                className={`w-full py-4 px-5 rounded-2xl font-extrabold text-sm text-white shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2 ${submitting || !selectedMonth
                                        ? "bg-gray-300 cursor-not-allowed shadow-none"
                                        : "bg-brand-prussian hover:bg-brand-cerulean shadow-brand-prussian/20"
                                    }`}
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 size={17} className="animate-spin" />
                                        <span>Processing...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>
                                            {paymentMethod === "payhere"
                                                ? "Pay Securely Now"
                                                : "Proceed to Upload Slip"}
                                        </span>
                                        <ArrowRight size={17} />
                                    </>
                                )}
                            </button>

                            <div className="flex items-center justify-center gap-1.5 text-[11px] text-gray-400 font-medium pt-1">
                                <Lock size={12} className="text-emerald-500" />
                                <span>256-bit Encrypted & Secure Payment</span>
                            </div>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
}