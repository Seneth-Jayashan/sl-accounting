import React, { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Swal from "sweetalert2";
import {
    format,
    addMonths,
    startOfMonth,
    subMonths,
    eachMonthOfInterval,
    isSameMonth,
    isBefore,
    isAfter,
} from "date-fns";
import {
    UploadCloud,
    FileText,
    X,
    ArrowLeft,
    AlertCircle,
    CalendarDays,
    CheckCircle2,
    Tag,
    ShieldCheck,
    Lock,
    Check,
    Loader2,
    MapPin,
    Trash2,
    Sparkles,
} from "lucide-react";

// Services
import PaymentService from "../../../services/PaymentService";
import EnrollmentService, {
    type EnrollmentResponse,
} from "../../../services/EnrollmentService";
import ClassService from "../../../services/ClassService";

// Config
const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/jpg"];

// --- INTERFACES ---
interface LinkedClass {
    _id: string;
    name: string;
    price: number;
}

interface LocalClassData {
    _id?: string;
    name: string;
    price: number;
    level?: string;
    coverImage?: string;
    timeSchedules?: { day: number; startTime: string; endTime: string }[];
    linkedRevisionClass?: LinkedClass | string;
    linkedPaperClass?: LinkedClass | string;
    bundlePriceRevision?: number;
    bundlePricePaper?: number;
    bundlePriceFull?: number;
}

const isLinkedClass = (cls: any): cls is LinkedClass => {
    return cls && typeof cls === "object" && "price" in cls;
};

export default function UploadPaymentSlip() {
    const { enrollmentId } = useParams<{ enrollmentId: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const fileInputRef = useRef<HTMLInputElement>(null);

    // --- STATE FROM NAVIGATION ---
    const stateAmount = location.state?.amount;
    const stateMonth = location.state?.targetMonth;
    const isPreConfigured = !!(stateAmount && stateMonth);

    // --- LOCAL STATE ---
    const [file, setFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [notes, setNotes] = useState("");
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);

    // Data State
    const [enrollment, setEnrollment] = useState<EnrollmentResponse | null>(null);
    const [classData, setClassData] = useState<LocalClassData | null>(null);

    // Selection State
    const [selectedMonth, setSelectedMonth] = useState<string>(
        stateMonth || format(new Date(), "yyyy-MM")
    );
    const [includeRevision, setIncludeRevision] = useState(false);
    const [includePaper, setIncludePaper] = useState(false);
    const [manualAmount, setManualAmount] = useState<string>("");

    // UI State
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Cleanup object URL on unmount or file change
    useEffect(() => {
        return () => {
            if (previewUrl) URL.revokeObjectURL(previewUrl);
        };
    }, [previewUrl]);

    // --- 1. LOAD DATA ---
    useEffect(() => {
        let isMounted = true;
        if (!enrollmentId) return;

        const loadData = async () => {
            try {
                const enrollRes = await EnrollmentService.getEnrollmentById(
                    enrollmentId
                );
                if (!isMounted) return;
                setEnrollment(enrollRes);

                if (enrollRes.class) {
                    const classId =
                        typeof enrollRes.class === "string"
                            ? enrollRes.class
                            : (enrollRes.class as any)._id;
                    const classRes = await ClassService.getPublicClassById(classId);
                    const cls =
                        (classRes as any).class ||
                        (Array.isArray(classRes) ? classRes[0] : classRes);

                    if (isMounted && cls) {
                        setClassData(cls as unknown as LocalClassData);
                        if (!stateAmount) setManualAmount(cls.price.toString());
                        else setManualAmount(stateAmount.toString());
                    }
                } else if (enrollRes.lessonPack) {
                    if (isMounted) {
                        setClassData({
                            name: "Premium Video Playlist",
                            price: stateAmount || 0,
                        } as LocalClassData);
                        setManualAmount(stateAmount ? stateAmount.toString() : "0");
                    }
                }
            } catch (err) {
                console.error("Data Load Error:", err);
                if (isMounted) setError("Failed to load details.");
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        loadData();
        return () => {
            isMounted = false;
        };
    }, [enrollmentId, stateAmount]);

    // --- 2. CALCULATE DYNAMIC TOTAL ---
    const calculatedTotal = useMemo(() => {
        if (isPreConfigured || !classData) return Number(manualAmount);

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

        let total = classData.price;
        if (includeRevision && isLinkedClass(classData.linkedRevisionClass)) {
            total += classData.linkedRevisionClass.price;
        }
        if (includePaper && isLinkedClass(classData.linkedPaperClass)) {
            total += classData.linkedPaperClass.price;
        }

        return total;
    }, [classData, includeRevision, includePaper, isPreConfigured, manualAmount]);

    useEffect(() => {
        if (!isPreConfigured && classData) {
            setManualAmount(calculatedTotal.toString());
        }
    }, [calculatedTotal, isPreConfigured, classData]);

    // --- 3. MONTH GENERATOR (7 Months) ---
    const monthOptions = useMemo(() => {
        const today = startOfMonth(new Date());
        const start = subMonths(today, 3);
        const end = addMonths(today, 3);

        try {
            const months = eachMonthOfInterval({ start, end });
            return months
                .map((date) => {
                    const value = format(date, "yyyy-MM");
                    const isPaid = enrollment?.paidMonths?.includes(value) || false;
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
                        status,
                        isPaid,
                    };
                })
                .reverse();
        } catch {
            return [];
        }
    }, [enrollment]);

    // --- 4. FILE HANDLERS ---
    const validateAndSetFile = (selectedFile: File | null) => {
        setError(null);
        if (!selectedFile) return;
        if (selectedFile.size > MAX_FILE_BYTES) {
            setError(`File too large. Maximum size is ${MAX_FILE_SIZE_MB}MB.`);
            return;
        }
        if (!ALLOWED_TYPES.includes(selectedFile.type)) {
            setError("Invalid file type. Please upload a JPG or PNG image.");
            return;
        }
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setFile(selectedFile);
        setPreviewUrl(
            selectedFile.type.startsWith("image/")
                ? URL.createObjectURL(selectedFile)
                : null
        );
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        validateAndSetFile(e.target.files?.[0] || null);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
        validateAndSetFile(e.dataTransfer.files?.[0] || null);
    };

    const handleRemoveFile = () => {
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setFile(null);
        setPreviewUrl(null);
        setError(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleUpload = async () => {
        if (!enrollmentId || !file) return;

        const finalAmount = parseFloat(manualAmount);
        if (isNaN(finalAmount) || finalAmount <= 0) {
            setError("Please enter a valid amount.");
            return;
        }
        if (!selectedMonth) {
            setError("Billing month/type is required.");
            return;
        }

        setUploading(true);
        setError(null);

        try {
            await PaymentService.uploadPaymentSlip(
                enrollmentId,
                file,
                finalAmount,
                notes,
                selectedMonth
            );

            setSuccess("Uploaded successfully!");
            Swal.fire({
                title: "Slip Uploaded!",
                text: "Please wait for admin approval.",
                icon: "success",
                confirmButtonColor: "#0b2540",
            }).then(() => navigate("/student/dashboard"));
        } catch (err: any) {
            setError(err.response?.data?.message || "Upload failed.");
            setUploading(false);
        }
    };

    const formatPrice = (price: number) =>
        new Intl.NumberFormat("en-LK", {
            style: "currency",
            currency: "LKR",
            maximumFractionDigits: 0,
        }).format(price);

    const formattedSelectedMonth =
        selectedMonth === "Lifetime Access"
            ? "Lifetime Access"
            : format(new Date(`${selectedMonth}-01T00:00:00`), "MMMM yyyy");

    // --- LOADING SKELETON ---
    if (loading) {
        return (
            <div className="max-w-2xl mx-auto py-8 px-4 pb-24 animate-pulse">
                <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
                    <div className="h-36 bg-gray-200" />
                    <div className="p-6 sm:p-8 space-y-6">
                        <div className="h-14 bg-gray-100 rounded-2xl" />
                        <div className="h-14 bg-gray-100 rounded-2xl" />
                        <div className="h-44 bg-gray-100 rounded-2xl" />
                        <div className="h-14 bg-gray-200 rounded-2xl" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto py-4 sm:py-8 px-4 pb-24 font-sans">
            <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-white rounded-[2rem] shadow-xl shadow-brand-prussian/10 border border-gray-100 overflow-hidden"
            >
                {/* --- HERO HEADER --- */}
                <div className="relative bg-gradient-to-br from-brand-prussian via-[#0d3a4b] to-brand-cerulean p-6 sm:p-8 text-white overflow-hidden">
                    <div className="pointer-events-none absolute -top-16 -right-16 w-56 h-56 rounded-full bg-brand-jasmine/20 blur-3xl" />

                    <div className="relative z-10 flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3.5 min-w-0">
                            <button
                                type="button"
                                onClick={() => navigate(-1)}
                                aria-label="Go Back"
                                className="mt-0.5 w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 backdrop-blur-md flex items-center justify-center text-white transition-colors shrink-0"
                            >
                                <ArrowLeft size={18} />
                            </button>

                            <div className="min-w-0">
                                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-semibold text-brand-jasmine mb-2">
                                    <Sparkles size={12} />
                                    <span>Bank Deposit Verification</span>
                                </div>
                                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight">
                                    Upload Payment Slip
                                </h1>
                                <p className="text-white/75 text-sm mt-1 truncate">
                                    For:{" "}
                                    <span className="font-bold text-white">
                                        {classData?.name || "Enrollment"}
                                    </span>
                                </p>
                            </div>
                        </div>

                        <div className="hidden sm:inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-md border border-white/15 px-3 py-1.5 rounded-full text-[11px] font-bold text-white/90 shrink-0">
                            <Lock size={12} className="text-emerald-300" />
                            <span>Secure</span>
                        </div>
                    </div>
                </div>

                {/* --- FORM BODY --- */}
                <div className="p-6 sm:p-8 space-y-6">
                    {/* Error Banner */}
                    <AnimatePresence>
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -6 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -6 }}
                                className="p-4 bg-red-50 border border-red-200/80 rounded-2xl flex items-center justify-between gap-3 text-red-700 text-xs sm:text-sm font-medium"
                            >
                                <div className="flex items-center gap-2.5">
                                    <AlertCircle size={17} className="text-red-500 shrink-0" />
                                    <span>{error}</span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setError(null)}
                                    className="p-1 rounded-lg hover:bg-red-100 text-red-500"
                                    aria-label="Dismiss error"
                                >
                                    <X size={14} />
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* 1. BILLING CYCLE */}
                    <div>
                        <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-500 mb-2.5">
                            Billing Cycle <span className="text-red-500">*</span>
                        </label>

                        {isPreConfigured ? (
                            <div className="flex items-center justify-between bg-brand-aliceBlue/50 text-brand-prussian px-4 py-3.5 rounded-2xl border border-brand-cerulean/20">
                                <div className="flex items-center gap-2.5 text-sm font-extrabold">
                                    <CalendarDays size={18} className="text-brand-cerulean" />
                                    <span>{formattedSelectedMonth}</span>
                                </div>
                                <span className="inline-flex items-center gap-1 text-[10px] bg-white text-gray-500 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider border border-gray-200">
                                    <Lock size={10} />
                                    Locked
                                </span>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[280px] overflow-y-auto pr-1">
                                {monthOptions.map((opt) => {
                                    const isSelected = selectedMonth === opt.value;
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
                                            label: "Due",
                                            cls: "bg-brand-aliceBlue text-brand-cerulean border-brand-cerulean/20",
                                        },
                                        advance: {
                                            label: "Advance",
                                            cls: "bg-emerald-50 text-emerald-600 border-emerald-100",
                                        },
                                    };
                                    const badge = badgeMap[opt.status];

                                    return (
                                        <button
                                            key={opt.value}
                                            type="button"
                                            disabled={opt.isPaid}
                                            onClick={() => setSelectedMonth(opt.value)}
                                            className={`p-3.5 rounded-2xl border-2 text-left transition-all flex items-center justify-between gap-2 ${opt.isPaid
                                                    ? "bg-gray-50 border-gray-100 opacity-60 cursor-not-allowed"
                                                    : isSelected
                                                        ? "border-brand-cerulean bg-brand-aliceBlue/35 shadow-xs"
                                                        : opt.status === "overdue"
                                                            ? "border-red-100 bg-red-50/20 hover:border-red-200"
                                                            : "border-gray-100 bg-white hover:border-brand-cerulean/40"
                                                }`}
                                        >
                                            <span className="font-bold text-sm text-brand-prussian truncate">
                                                {opt.label}
                                            </span>
                                            <div className="flex items-center gap-1.5 shrink-0">
                                                <span
                                                    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${badge.cls}`}
                                                >
                                                    {badge.label}
                                                </span>
                                                {opt.isPaid && (
                                                    <CheckCircle2
                                                        size={16}
                                                        className="text-emerald-500"
                                                    />
                                                )}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* 2. BUNDLE OPTIONS (Only if not pre-configured) */}
                    {!isPreConfigured &&
                        (isLinkedClass(classData?.linkedRevisionClass) ||
                            isLinkedClass(classData?.linkedPaperClass)) && (
                            <div className="bg-gray-50/80 p-5 rounded-2xl border border-gray-100 space-y-3">
                                <div className="flex items-center gap-2 text-brand-prussian">
                                    <Tag size={15} className="text-brand-cerulean" />
                                    <span className="text-xs font-extrabold uppercase tracking-wider">
                                        Add Optional Extras
                                    </span>
                                </div>

                                {isLinkedClass(classData?.linkedRevisionClass) && (
                                    <label
                                        className={`flex items-center gap-3.5 p-3.5 rounded-xl border-2 cursor-pointer transition-all bg-white ${includeRevision
                                                ? "border-brand-cerulean bg-brand-aliceBlue/20"
                                                : "border-gray-100 hover:border-gray-200"
                                            }`}
                                    >
                                        <div
                                            className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${includeRevision
                                                    ? "bg-brand-cerulean border-brand-cerulean text-white"
                                                    : "border-gray-300 bg-white"
                                                }`}
                                        >
                                            {includeRevision && <Check size={12} strokeWidth={3} />}
                                        </div>
                                        <input
                                            type="checkbox"
                                            className="hidden"
                                            checked={includeRevision}
                                            onChange={(e) => setIncludeRevision(e.target.checked)}
                                        />
                                        <span className="flex-1 text-sm font-bold text-brand-prussian">
                                            Revision Class
                                        </span>
                                        <span className="text-sm font-extrabold text-brand-cerulean">
                                            +{formatPrice(classData!.linkedRevisionClass!.price)}
                                        </span>
                                    </label>
                                )}

                                {isLinkedClass(classData?.linkedPaperClass) && (
                                    <label
                                        className={`flex items-center gap-3.5 p-3.5 rounded-xl border-2 cursor-pointer transition-all bg-white ${includePaper
                                                ? "border-brand-cerulean bg-brand-aliceBlue/20"
                                                : "border-gray-100 hover:border-gray-200"
                                            }`}
                                    >
                                        <div
                                            className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${includePaper
                                                    ? "bg-brand-cerulean border-brand-cerulean text-white"
                                                    : "border-gray-300 bg-white"
                                                }`}
                                        >
                                            {includePaper && <Check size={12} strokeWidth={3} />}
                                        </div>
                                        <input
                                            type="checkbox"
                                            className="hidden"
                                            checked={includePaper}
                                            onChange={(e) => setIncludePaper(e.target.checked)}
                                        />
                                        <span className="flex-1 text-sm font-bold text-brand-prussian">
                                            Paper Class
                                        </span>
                                        <span className="text-sm font-extrabold text-brand-cerulean">
                                            +{formatPrice(classData!.linkedPaperClass!.price)}
                                        </span>
                                    </label>
                                )}
                            </div>
                        )}

                    {/* 3. AMOUNT INPUT */}
                    <div>
                        <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-500 mb-2">
                            Total Amount (LKR) <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <span className="text-gray-400 font-extrabold text-sm">
                                    LKR
                                </span>
                            </div>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                required
                                readOnly={isPreConfigured}
                                className={`w-full pl-14 pr-4 py-3.5 rounded-2xl outline-none transition-all font-mono font-extrabold text-lg sm:text-xl ${isPreConfigured
                                        ? "bg-gray-50 border border-gray-200 text-gray-500 cursor-not-allowed"
                                        : "bg-gray-50 border border-gray-200/90 text-brand-prussian focus:bg-white focus:border-brand-cerulean focus:ring-2 focus:ring-brand-cerulean/15"
                                    }`}
                                placeholder="0.00"
                                value={manualAmount}
                                onChange={(e) => setManualAmount(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* 4. DRAG & DROP SLIP UPLOAD */}
                    <div>
                        <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-500 mb-2">
                            Bank Slip Image <span className="text-red-500">*</span>
                        </label>

                        <input
                            ref={fileInputRef}
                            type="file"
                            className="hidden"
                            accept={ALLOWED_TYPES.join(",")}
                            onChange={handleFileChange}
                        />

                        {!file ? (
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                onDragOver={(e) => {
                                    e.preventDefault();
                                    setIsDragging(true);
                                }}
                                onDragLeave={() => setIsDragging(false)}
                                onDrop={handleDrop}
                                className={`flex flex-col items-center justify-center w-full py-10 px-6 border-2 border-dashed rounded-3xl cursor-pointer transition-all text-center ${isDragging
                                        ? "border-brand-cerulean bg-brand-aliceBlue/40 scale-[1.01]"
                                        : error
                                            ? "border-red-300 bg-red-50/50"
                                            : "border-gray-200 bg-gray-50/60 hover:bg-brand-aliceBlue/20 hover:border-brand-cerulean/50"
                                    }`}
                            >
                                <div className="w-14 h-14 bg-white rounded-2xl shadow-xs border border-gray-100 flex items-center justify-center mb-3 text-brand-cerulean">
                                    <UploadCloud size={26} />
                                </div>
                                <p className="text-sm font-bold text-brand-prussian">
                                    Click to browse or drag & drop slip
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                    JPG, PNG or JPEG • Max {MAX_FILE_SIZE_MB}MB
                                </p>
                            </div>
                        ) : (
                            <div className="rounded-3xl border border-gray-200 overflow-hidden bg-gray-950 shadow-sm">
                                <div className="relative h-56 flex items-center justify-center bg-gray-900/90 p-3">
                                    {previewUrl ? (
                                        <img
                                            src={previewUrl}
                                            alt="Slip Preview"
                                            className="max-h-full max-w-full object-contain rounded-xl"
                                        />
                                    ) : (
                                        <div className="flex flex-col items-center text-white/70">
                                            <FileText size={36} className="mb-2" />
                                            <span className="text-sm font-semibold">{file.name}</span>
                                        </div>
                                    )}

                                    <button
                                        type="button"
                                        onClick={handleRemoveFile}
                                        disabled={uploading}
                                        title="Remove slip"
                                        aria-label="Remove slip"
                                        className="absolute top-3 right-3 p-2 bg-black/60 hover:bg-red-500 text-white rounded-xl backdrop-blur-md transition-colors border border-white/15"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>

                                <div className="bg-white px-4 py-3 flex items-center justify-between gap-3 border-t border-gray-100">
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <CheckCircle2
                                            size={16}
                                            className="text-emerald-500 shrink-0"
                                        />
                                        <span className="text-xs font-bold text-brand-prussian truncate">
                                            {file.name}
                                        </span>
                                    </div>
                                    <span className="text-[11px] font-semibold text-gray-400 shrink-0">
                                        {(file.size / 1024 / 1024).toFixed(2)} MB
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* 5. WHATSAPP & POST OFFICE NOTES */}
                    <div>
                        <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-500 mb-2">
                            Whatsapp Number / ළගම Post Office එක{" "}
                            <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <MapPin
                                size={16}
                                className="absolute left-3.5 top-3.5 text-gray-400 pointer-events-none"
                            />
                            <textarea
                                rows={2}
                                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200/90 rounded-2xl focus:bg-white focus:ring-2 focus:ring-brand-cerulean/15 focus:border-brand-cerulean outline-none text-sm text-gray-800 transition-all resize-none placeholder:text-gray-400"
                                placeholder="070-1234567 / බද්දේගම තැපැල් කාර්යාලය"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    {/* 6. SUBMIT BUTTON */}
                    <button
                        type="button"
                        onClick={handleUpload}
                        disabled={
                            !file || !manualAmount || uploading || !!success || !selectedMonth
                        }
                        className={`w-full py-4 px-5 rounded-2xl font-extrabold text-sm text-white transition-all shadow-lg flex items-center justify-center gap-2 active:scale-[0.98] ${!file || !manualAmount || uploading || !!success || !selectedMonth
                                ? "bg-gray-300 cursor-not-allowed shadow-none text-gray-500"
                                : "bg-brand-prussian hover:bg-brand-cerulean shadow-brand-prussian/20"
                            }`}
                    >
                        {uploading ? (
                            <>
                                <Loader2 size={17} className="animate-spin" />
                                <span>Uploading Slip...</span>
                            </>
                        ) : success ? (
                            <>
                                <CheckCircle2 size={17} />
                                <span>Uploaded Successfully</span>
                            </>
                        ) : (
                            <>
                                <UploadCloud size={17} />
                                <span>Submit Payment Slip</span>
                            </>
                        )}
                    </button>

                    <div className="flex items-center justify-center gap-1.5 text-[11px] text-gray-400 font-medium">
                        <ShieldCheck size={13} className="text-emerald-500" />
                        <span>Encrypted & Secure Transmission</span>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}