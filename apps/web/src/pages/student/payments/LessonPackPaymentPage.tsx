import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
    CreditCard,
    Landmark,
    ArrowLeft,
    ArrowRight,
    Lock,
    ShieldCheck,
    PlayCircle,
    Sparkles,
    Copy,
    Check,
    AlertCircle,
    Loader2,
    X,
    Video,
    Clock,
    CheckCircle2,
    Unlock,
} from "lucide-react";

// Services & Context
import LessonPackService, {
    type LessonPackData,
} from "../../../services/LessonPackService";
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
const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

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

const getSmartCoverUrl = (pack: LessonPackData) => {
    if (pack.coverImage) {
        const baseUrl = API_BASE_URL.replace(/\/api\/v1\/?$/, "");
        const cleanPath = pack.coverImage.replace(/\\/g, "/").replace(/^\/+/, "");
        return `${baseUrl}/${cleanPath}`;
    }
    if (pack.videos && pack.videos.length > 0 && pack.videos[0].youtubeId) {
        return `https://img.youtube.com/vi/${pack.videos[0].youtubeId}/maxresdefault.jpg`;
    }
    return null;
};

export default function LessonPackPaymentPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();

    // State
    const [packData, setPackData] = useState<LessonPackData | null>(null);
    const [loading, setLoading] = useState(true);
    const [paymentMethod, setPaymentMethod] = useState<"payhere" | "bank">(
        "payhere"
    );
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [copiedBankId, setCopiedBankId] = useState<number | null>(null);

    // --- 1. Load Data ---
    useEffect(() => {
        if (!id || !user) return;

        let isMounted = true;
        const loadData = async () => {
            try {
                const data = await LessonPackService.getById(id);
                if (isMounted) setPackData(data);
            } catch (err) {
                console.error(err);
                if (isMounted) {
                    setError("Failed to load playlist details. It may be unavailable.");
                }
            } finally {
                if (isMounted) setLoading(false);
            }
        };
        loadData();
        return () => {
            isMounted = false;
        };
    }, [id, user]);

    const formatPrice = (price: number) =>
        new Intl.NumberFormat("en-LK", {
            style: "currency",
            currency: "LKR",
            maximumFractionDigits: 0,
        }).format(price);

    const packStats = useMemo(() => {
        const videos = packData?.videos || [];
        const totalMinutes = videos.reduce(
            (sum, v) => sum + (Number(v.durationMinutes) || 0),
            0
        );
        return {
            videoCount: videos.length,
            totalMinutes,
        };
    }, [packData]);

    const handleCopyAccount = (accountNumber: string, bankId: number) => {
        navigator.clipboard.writeText(accountNumber);
        setCopiedBankId(bankId);
        setTimeout(() => setCopiedBankId(null), 2000);
    };

    // --- 2. Handle Payment ---
    const handlePayment = async () => {
        if (!packData || !user) return;
        setSubmitting(true);
        setError(null);

        try {
            const enrollmentRes = await EnrollmentService.enrollInLessonPack(
                packData._id
            );

            if (packData.price === 0) {
                navigate(`/student/lesson-packs/${packData._id}`);
                return;
            }

            const finalAmount = packData.price;
            const enrollmentId = enrollmentRes.enrollment._id;

            if (paymentMethod === "bank") {
                navigate(`/student/payment/upload/${enrollmentId}`, {
                    state: { amount: finalAmount, targetMonth: "Lifetime Access" },
                });
            } else {
                const orderId = `${enrollmentId}_${Date.now()}`;
                const signature = await PaymentService.initiatePayHere(
                    finalAmount,
                    orderId
                );

                const params = {
                    merchant_id: signature.merchant_id,
                    return_url: `${window.location.origin}/student/lesson-packs/${packData._id}?payment=success`,
                    cancel_url: `${window.location.origin}/student/payment/lesson-pack/${id}?error=cancel`,
                    notify_url: `${NOTIFY_URL_BASE}/payments/payhere-webhook`,
                    order_id: orderId,
                    items: `Playlist: ${packData.title} [Lifetime]`,
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
                    custom_2: "Lifetime Access",
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
            setError(
                err.response?.data?.message ||
                err.message ||
                "Payment processing failed."
            );
            setSubmitting(false);
        }
    };

    // --- LOADING SKELETON ---
    if (loading) {
        return (
            <div className="max-w-5xl mx-auto space-y-6 pb-24 animate-pulse">
                <div className="h-36 rounded-[2rem] bg-gray-200" />
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="h-48 rounded-3xl bg-white border border-gray-100" />
                        <div className="h-56 rounded-3xl bg-white border border-gray-100" />
                    </div>
                    <div className="h-80 rounded-3xl bg-white border border-gray-100" />
                </div>
            </div>
        );
    }

    const isFree = (packData?.price || 0) === 0;
    const coverUrl = packData ? getSmartCoverUrl(packData) : null;

    return (
        <div className="max-w-5xl mx-auto space-y-6 pb-24 sm:pb-10">
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
                                <span>Lesson Pack Checkout</span>
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-snug">
                                Unlock Playlist
                            </h1>
                            <p className="text-white/75 text-sm mt-1">
                                Purchase lifetime access to{" "}
                                <span className="text-brand-jasmine font-semibold">
                                    {packData?.title || "this video bundle"}
                                </span>
                                .
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
                    {/* 1. BUNDLE PREVIEW CARD */}
                    <section className="bg-white p-5 sm:p-7 rounded-3xl shadow-sm border border-gray-100">
                        <div className="flex items-center gap-3 mb-5">
                            <div className="w-10 h-10 rounded-2xl bg-brand-cerulean/10 text-brand-cerulean flex items-center justify-center shrink-0">
                                <PlayCircle size={20} />
                            </div>
                            <div>
                                <p className="text-[10px] font-extrabold uppercase tracking-widest text-brand-cerulean">
                                    Selected Bundle
                                </p>
                                <h2 className="text-lg font-extrabold text-brand-prussian leading-tight">
                                    Playlist Overview
                                </h2>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-5 items-start">
                            {/* Thumbnail */}
                            <div className="relative w-full sm:w-52 aspect-video rounded-2xl overflow-hidden shadow-sm shrink-0 bg-brand-prussian flex items-center justify-center">
                                {coverUrl ? (
                                    <img
                                        src={coverUrl}
                                        alt={packData?.title}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <PlayCircle size={36} className="text-white/30" />
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                                <span className="absolute bottom-2.5 right-2.5 bg-black/65 backdrop-blur-md text-white px-2.5 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 border border-white/10">
                                    <Video size={11} className="text-brand-jasmine" />
                                    {packStats.videoCount}{" "}
                                    {packStats.videoCount === 1 ? "Video" : "Videos"}
                                </span>
                            </div>

                            {/* Bundle Info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-2 mb-2">
                                    <span className="px-2.5 py-0.5 bg-brand-aliceBlue text-brand-cerulean text-[10px] font-bold uppercase tracking-wider rounded-full">
                                        Video Bundle
                                    </span>
                                    {packStats.totalMinutes > 0 && (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-gray-100 text-gray-600 text-[11px] font-semibold rounded-full">
                                            <Clock size={11} />
                                            {packStats.totalMinutes} mins
                                        </span>
                                    )}
                                </div>

                                <h3 className="text-lg sm:text-xl font-extrabold text-brand-prussian leading-snug">
                                    {packData?.title}
                                </h3>

                                <p className="text-xs sm:text-sm text-gray-500 mt-2 leading-relaxed">
                                    {packData?.description ||
                                        "Comprehensive video lesson bundle and revision archive."}
                                </p>

                                <div className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100">
                                    <CheckCircle2 size={14} className="text-emerald-600" />
                                    <span>Lifetime Access & Study Materials Included</span>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* 2. PAYMENT METHOD (Hidden for Free Packs) */}
                    {!isFree && (
                        <section className="bg-white p-5 sm:p-7 rounded-3xl shadow-sm border border-gray-100">
                            <div className="flex items-center gap-3 mb-5">
                                <div className="w-10 h-10 rounded-2xl bg-brand-cerulean/10 text-brand-cerulean flex items-center justify-center shrink-0">
                                    <CreditCard size={20} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-extrabold uppercase tracking-widest text-brand-cerulean">
                                        Payment Option
                                    </p>
                                    <h2 className="text-lg font-extrabold text-brand-prussian leading-tight">
                                        Choose Payment Method
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
                                            Instant video activation via Card or Wallet
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
                                                                        handleCopyAccount(
                                                                            bank.accountNumber,
                                                                            bank.id
                                                                        )
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
                                                                Keep your transfer receipt or screenshot ready
                                                                for the next step.
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
                    )}
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
                            {/* Access Type Pill */}
                            <div className="flex items-center justify-between text-sm bg-gray-50 p-3.5 rounded-2xl border border-gray-100">
                                <span className="text-gray-500 font-semibold text-xs">
                                    Access Type
                                </span>
                                <span className="font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 rounded-full text-xs">
                                    Lifetime
                                </span>
                            </div>

                            {/* Line Items */}
                            <div className="space-y-3 pb-5 border-b border-dashed border-gray-200 text-sm">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-500 font-medium">
                                        Video Bundle Fee
                                    </span>
                                    <span className="font-bold text-gray-900">
                                        {isFree ? "FREE" : formatPrice(packData?.price || 0)}
                                    </span>
                                </div>
                            </div>

                            {/* Total Payable */}
                            <div className="flex items-end justify-between">
                                <div>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                                        Total Payable
                                    </p>
                                    <p
                                        className={`text-2xl sm:text-3xl font-black tracking-tight mt-0.5 ${isFree ? "text-emerald-600" : "text-brand-prussian"
                                            }`}
                                    >
                                        {isFree ? "FREE" : formatPrice(packData?.price || 0)}
                                    </p>
                                </div>
                                {!isFree && (
                                    <span className="text-[11px] font-bold text-gray-400 bg-gray-100 px-2.5 py-1 rounded-lg">
                                        {paymentMethod === "payhere" ? "PayHere" : "Bank Slip"}
                                    </span>
                                )}
                            </div>

                            {/* Primary CTA */}
                            <button
                                onClick={handlePayment}
                                disabled={submitting || !packData}
                                className={`w-full py-4 px-5 rounded-2xl font-extrabold text-sm text-white shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2 ${submitting || !packData
                                        ? "bg-gray-300 cursor-not-allowed shadow-none"
                                        : "bg-brand-prussian hover:bg-brand-cerulean shadow-brand-prussian/20"
                                    }`}
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 size={17} className="animate-spin" />
                                        <span>Processing...</span>
                                    </>
                                ) : isFree ? (
                                    <>
                                        <Unlock size={16} />
                                        <span>Claim Free Access</span>
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
                                <ShieldCheck size={13} className="text-emerald-500" />
                                <span>Guaranteed Instant Access on Approval</span>
                            </div>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
}