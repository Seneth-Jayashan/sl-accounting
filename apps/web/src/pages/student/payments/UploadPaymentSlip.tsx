import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import Swal from "sweetalert2"; 
import { 
    format, 
    addMonths, 
    startOfMonth, 
    subMonths, 
    eachMonthOfInterval, 
    isSameMonth,
    isBefore,
    isAfter
} from "date-fns";
import { 
  CloudArrowUpIcon, 
  DocumentTextIcon, 
  XMarkIcon,
  ArrowLeftIcon,
  ExclamationCircleIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  TagIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";

// Services
import PaymentService from "../../../services/PaymentService"; 
import EnrollmentService, { type EnrollmentResponse } from "../../../services/EnrollmentService";
import ClassService from "../../../services/ClassService";

// Config
const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/jpg'];

// --- INTERFACES ---
interface LinkedClass { 
    _id: string; 
    name: string; 
    price: number; 
}

// We define a local ClassData that can handle both string IDs and Objects
interface LocalClassData {
  _id: string;
  name: string;
  price: number;
  level: string;
  coverImage?: string;
  timeSchedules: { day: number; startTime: string; endTime: string }[];
  
  // These can be an ID string OR a populated object
  linkedRevisionClass?: LinkedClass | string;
  linkedPaperClass?: LinkedClass | string;
  
  bundlePriceRevision?: number;
  bundlePricePaper?: number;
  bundlePriceFull?: number;
}

// --- TYPE GUARD HELPER ---
// This tells TypeScript: "If this function returns true, 'cls' is definitely a LinkedClass object"
const isLinkedClass = (cls: any): cls is LinkedClass => {
    return cls && typeof cls === 'object' && 'price' in cls;
};

export default function UploadPaymentSlip() {
  const { enrollmentId } = useParams<{ enrollmentId: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  // --- STATE FROM NAVIGATION ---
  const stateAmount = location.state?.amount;
  const stateMonth = location.state?.targetMonth;
  const isPreConfigured = !!(stateAmount && stateMonth); 

  // --- LOCAL STATE ---
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  
  // Data State
  const [enrollment, setEnrollment] = useState<EnrollmentResponse | null>(null);
  const [classData, setClassData] = useState<LocalClassData | null>(null);

  // Selection State
  const [selectedMonth, setSelectedMonth] = useState<string>(stateMonth || format(new Date(), "yyyy-MM"));
  const [includeRevision, setIncludeRevision] = useState(false);
  const [includePaper, setIncludePaper] = useState(false);
  const [manualAmount, setManualAmount] = useState<string>("");

  // UI State
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // --- 1. LOAD DATA ---
  useEffect(() => {
    let isMounted = true;
    if (!enrollmentId) return;

    const loadData = async () => {
        try {
            // A. Get Enrollment
            const enrollRes = await EnrollmentService.getEnrollmentById(enrollmentId);
            if (!isMounted) return;
            setEnrollment(enrollRes);

            // B. Get Class Details
            const classId = typeof enrollRes.class === 'string' ? enrollRes.class : (enrollRes.class as any)._id;
            const classRes = await ClassService.getPublicClassById(classId);
            
            // Handle API response structure
            const cls = (classRes as any).class || (Array.isArray(classRes) ? classRes[0] : classRes);
            
            if (isMounted && cls) {
                // Cast to our local flexible interface
                setClassData(cls as unknown as LocalClassData);

                // Pre-fill amount logic
                if (!stateAmount) {
                     setManualAmount(cls.price.toString());
                } else {
                     setManualAmount(stateAmount.toString());
                }
            }
        } catch (err) {
            console.error("Data Load Error:", err);
            if (isMounted) setError("Failed to load class details.");
        } finally {
            if (isMounted) setLoading(false);
        }
    };

    loadData();
    return () => { isMounted = false; };
  }, [enrollmentId, stateAmount]);

  // --- 2. CALCULATE DYNAMIC TOTAL ---
  const calculatedTotal = useMemo(() => {
      // Use manual amount if pre-configured or data missing
      if (isPreConfigured || !classData) return Number(manualAmount);

      // 1. Bundle Logic (Server defined prices)
      if (includeRevision && includePaper && classData.bundlePriceFull != null) return classData.bundlePriceFull;
      if (includeRevision && !includePaper && classData.bundlePriceRevision != null) return classData.bundlePriceRevision;
      if (!includeRevision && includePaper && classData.bundlePricePaper != null) return classData.bundlePricePaper;

      // 2. Sum Logic (Fallback)
      let total = classData.price;
      
      // FIX: Use type guard before accessing .price
      if (includeRevision && isLinkedClass(classData.linkedRevisionClass)) {
          total += classData.linkedRevisionClass.price;
      }
      if (includePaper && isLinkedClass(classData.linkedPaperClass)) {
          total += classData.linkedPaperClass.price;
      }
      
      return total;
  }, [classData, includeRevision, includePaper, isPreConfigured, manualAmount]);

  // Sync calculation to input field
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

          return months.map(date => {
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
                  isPaid
              };
          }).reverse();
      } catch (e) {
          console.error("Date error", e);
          return [];
      }
  }, [enrollment]);

  // --- 4. HANDLERS ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.size > MAX_FILE_BYTES) return setError(`File too large. Max ${MAX_FILE_SIZE_MB}MB.`);
      if (!ALLOWED_TYPES.includes(selectedFile.type)) return setError("Invalid file type (JPG, PNG, JPEG only).");
      setFile(selectedFile);
      setPreviewUrl(selectedFile.type.startsWith('image/') ? URL.createObjectURL(selectedFile) : null);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setPreviewUrl(null);
    setError(null);
  };

  const handleUpload = async () => {
    if (!enrollmentId || !file) return;
    
    const finalAmount = parseFloat(manualAmount);
    if (isNaN(finalAmount) || finalAmount <= 0) return setError("Please enter a valid amount.");
    if (!selectedMonth) return setError("Billing month is required.");

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
          title: 'Slip Uploaded!',
          text: 'Please wait for admin approval.',
          icon: 'success',
          confirmButtonColor: '#0b2540'
      }).then(() => navigate("/student/dashboard"));

    } catch (err: any) {
      setError(err.response?.data?.message || "Upload failed.");
      setUploading(false);
    }
  };

  const formatPrice = (price: number) => new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR' }).format(price);

  if (loading) return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="w-8 h-8 border-4 border-brand-cerulean border-t-transparent rounded-full animate-spin"/>
      </div>
  );

  return (
      <div className="min-h-screen bg-gray-50/50 py-8 px-4 font-sans flex items-center justify-center">
        
        <div className="bg-white rounded-[2.5rem] shadow-xl shadow-gray-200/50 p-8 sm:p-12 border border-gray-100 max-w-2xl w-full">
            
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 border-b border-gray-100 pb-6">
                <div>
                    <button onClick={() => navigate(-1)} className="flex items-center text-gray-400 hover:text-brand-cerulean transition-colors text-sm font-bold uppercase tracking-wider mb-2 group">
                        <ArrowLeftIcon className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" /> Back
                    </button>
                    <h1 className="text-3xl font-black text-brand-prussian tracking-tight">Upload Payment Slip</h1>
                    <p className="text-gray-500 font-medium mt-1">
                        For class: <span className="font-bold text-brand-cerulean">{classData?.name || "Loading..."}</span>
                    </p>
                </div>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-center text-red-600 text-xs font-medium animate-fade-in-up">
                    <ExclamationCircleIcon className="w-5 h-5 mr-2 shrink-0" />{error}
                </div>
            )}

            <div className="space-y-8">
                
                {/* 1. MONTH SELECTION (Conditional) */}
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Billing Month <span className="text-red-500">*</span></label>
                    {isPreConfigured ? (
                        <div className="inline-flex items-center gap-2 bg-brand-aliceBlue/50 text-brand-prussian px-5 py-3 rounded-2xl text-sm font-bold border border-brand-aliceBlue w-full">
                            <CalendarDaysIcon className="w-5 h-5 text-brand-cerulean" />
                            {format(new Date(selectedMonth), "MMMM yyyy")}
                            <span className="ml-auto text-[10px] bg-gray-200 text-gray-600 px-2 py-1 rounded font-bold uppercase tracking-wider">Locked</span>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto custom-scrollbar">
                            {monthOptions.map(opt => {
                                let borderClass = "border-gray-100 hover:border-gray-200 bg-white";
                                let badge = null;

                                if (opt.status === 'overdue' && !opt.isPaid) {
                                    borderClass = "border-red-100 bg-red-50/20";
                                    badge = <span className="text-[10px] font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">Overdue</span>;
                                } else if (opt.status === 'advance') {
                                    badge = <span className="text-[10px] font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded-full">Advance</span>;
                                } else if (opt.status === 'due') {
                                    borderClass = "border-brand-cerulean/30 bg-brand-aliceBlue/10";
                                    badge = <span className="text-[10px] font-bold text-brand-cerulean bg-brand-aliceBlue px-2 py-0.5 rounded-full border border-brand-cerulean/20">Due</span>;
                                }

                                if (selectedMonth === opt.value) {
                                    borderClass = "border-brand-cerulean ring-2 ring-brand-cerulean bg-brand-aliceBlue/20 shadow-md";
                                }

                                if (opt.isPaid) {
                                    borderClass = "border-gray-100 opacity-60 cursor-not-allowed";
                                }

                                return (
                                    <button
                                        key={opt.value}
                                        disabled={opt.isPaid}
                                        onClick={() => setSelectedMonth(opt.value)}
                                        className={`relative p-3 rounded-xl border text-left transition-all flex flex-col items-start gap-1 ${borderClass}`}
                                    >
                                        <div className="flex justify-between w-full items-center">
                                            <span className="font-bold text-sm text-gray-700">{opt.label}</span>
                                            {opt.isPaid ? <CheckCircleIcon className="w-5 h-5 text-green-500" /> : badge}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* 2. BUNDLE OPTIONS (Only show if NOT pre-configured & Data exists) */}
                {!isPreConfigured && (isLinkedClass(classData?.linkedRevisionClass) || isLinkedClass(classData?.linkedPaperClass)) && (
                    <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                        <div className="flex items-center gap-2 mb-4 text-brand-prussian">
                            <TagIcon className="w-4 h-4" />
                            <span className="text-xs font-bold uppercase tracking-widest">Add Extras</span>
                        </div>
                        <div className="space-y-3">
                            {/* FIX: Use Type Guard Check */}
                            {isLinkedClass(classData?.linkedRevisionClass) && (
                                <label className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all bg-white hover:shadow-sm ${includeRevision ? 'border-brand-cerulean ring-1 ring-brand-cerulean' : 'border-gray-200'}`}>
                                    <input type="checkbox" className="w-5 h-5 text-brand-cerulean rounded border-gray-300 focus:ring-brand-cerulean" checked={includeRevision} onChange={e => setIncludeRevision(e.target.checked)} />
                                    <div className="flex-1 text-sm font-medium text-gray-700">Revision Class</div>
                                    <span className="text-sm font-bold text-brand-prussian">+{formatPrice(classData!.linkedRevisionClass!.price)}</span>
                                </label>
                            )}
                            {/* FIX: Use Type Guard Check */}
                            {isLinkedClass(classData?.linkedPaperClass) && (
                                <label className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all bg-white hover:shadow-sm ${includePaper ? 'border-brand-cerulean ring-1 ring-brand-cerulean' : 'border-gray-200'}`}>
                                    <input type="checkbox" className="w-5 h-5 text-brand-cerulean rounded border-gray-300 focus:ring-brand-cerulean" checked={includePaper} onChange={e => setIncludePaper(e.target.checked)} />
                                    <div className="flex-1 text-sm font-medium text-gray-700">Paper Class</div>
                                    <span className="text-sm font-bold text-brand-prussian">+{formatPrice(classData!.linkedPaperClass!.price)}</span>
                                </label>
                            )}
                        </div>
                    </div>
                )}

                {/* 3. AMOUNT INPUT */}
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Total Amount (LKR) <span className="text-red-500">*</span></label>
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <span className="text-gray-400 font-bold text-lg">Rs.</span>
                        </div>
                        <input
                            type="number"
                            min="0"
                            step="0.01"
                            required
                            readOnly={isPreConfigured} 
                            className={`w-full pl-14 p-4 rounded-2xl outline-none transition-all font-mono font-bold text-gray-800 text-xl ${
                                isPreConfigured 
                                ? "bg-gray-50 border border-gray-200 text-gray-500 cursor-not-allowed" 
                                : "bg-white border-2 border-brand-aliceBlue focus:border-brand-cerulean focus:ring-4 focus:ring-brand-cerulean/10"
                            }`}
                            placeholder="0.00"
                            value={manualAmount}
                            onChange={(e) => setManualAmount(e.target.value)}
                        />
                    </div>
                </div>

                {/* 4. DROP ZONE */}
                {!file ? (
                    <label className={`flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-[2rem] cursor-pointer transition-all duration-300 group ${error ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-gray-50 hover:bg-brand-aliceBlue/30 hover:border-brand-cerulean'}`}>
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <div className="p-4 bg-white rounded-full shadow-sm mb-3 group-hover:scale-110 transition-transform">
                                <CloudArrowUpIcon className={`w-8 h-8 ${error ? 'text-red-400' : 'text-brand-cerulean'}`} />
                            </div>
                            <p className="mb-1 text-sm text-gray-600 font-medium">Click to upload slip</p>
                            <p className="text-[10px] text-gray-400 uppercase tracking-wide">JPG, PNG OR JPEG</p>
                        </div>
                        <input type="file" className="hidden" accept={ALLOWED_TYPES.join(',')} onChange={handleFileChange} />
                    </label>
                ) : (
                    <div className="relative w-full h-48 bg-gray-900 rounded-[2rem] overflow-hidden flex items-center justify-center border border-gray-200 group shadow-md">
                        {previewUrl ? (
                            <img src={previewUrl} alt="Slip Preview" className="h-full w-full object-contain opacity-90 group-hover:opacity-100 transition-opacity" />
                        ) : (
                            <div className="flex flex-col items-center text-white">
                                <DocumentTextIcon className="w-12 h-12 mb-2 opacity-50" />
                                <span className="text-sm font-medium">{file.name}</span>
                                <span className="text-xs opacity-50 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                            </div>
                        )}
                        <button onClick={handleRemoveFile} className="absolute top-4 right-4 p-2 bg-black/50 backdrop-blur-md text-white rounded-full hover:bg-red-500 transition-colors shadow-lg border border-white/10">
                            <XMarkIcon className="w-5 h-5" />
                        </button>
                    </div>
                )}

                {/* Notes */}
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Ref / Notes</label>
                    <textarea 
                        rows={2}
                        className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-brand-cerulean/20 focus:border-brand-cerulean outline-none text-sm transition-all resize-none placeholder:text-gray-400"
                        placeholder="Bank Reference No, Date, etc."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                    />
                </div>

                {/* Submit */}
                <button
                    onClick={handleUpload}
                    disabled={!file || !manualAmount || uploading || !!success || !selectedMonth}
                    className={`w-full py-4 rounded-2xl font-bold text-white transition-all shadow-lg shadow-brand-prussian/20 flex items-center justify-center text-sm uppercase tracking-wide transform active:scale-[0.98] ${
                        !file || !manualAmount || uploading || !!success || !selectedMonth
                        ? "bg-gray-300 cursor-not-allowed shadow-none text-gray-500" 
                        : "bg-brand-prussian hover:bg-brand-cerulean hover:shadow-brand-cerulean/30"
                    }`}
                >
                    {uploading ? (
                        <span className="flex items-center gap-2">
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                            Uploading...
                        </span>
                    ) : success ? "Uploaded Successfully" : "Submit Payment Slip"}
                </button>

                <div className="flex items-center justify-center gap-2 text-[10px] text-gray-400 font-medium pt-2">
                    <ShieldCheckIcon className="w-3 h-3" /> Secure Transmission
                </div>

            </div>
        </div>
      </div>
  );
}