import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import Swal from "sweetalert2"; 
import { format } from "date-fns";
import { 
  CloudArrowUpIcon, 
  DocumentTextIcon, 
  XMarkIcon,
  ArrowLeftIcon,
  ExclamationCircleIcon,
  CalendarDaysIcon
} from "@heroicons/react/24/outline";

// Services
import PaymentService from "../../../services/PaymentService"; 
import EnrollmentService, { type EnrollmentResponse } from "../../../services/EnrollmentService";

// Config
const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/jpg'];

export default function UploadPaymentSlip() {
  const { enrollmentId } = useParams<{ enrollmentId: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  // Extract State passed from Enrollment Page
  const { amount: stateAmount, targetMonth } = location.state || {};

  // State
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  // Initialize amount from state if available
  const [amount, setAmount] = useState(stateAmount ? stateAmount.toString() : ""); 
  const [loading, setLoading] = useState(false);
  const [className, setClassName] = useState("Loading...");
  
  // UI State
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // 1. Status Check & Data Fetching
  useEffect(() => {
    let isMounted = true;
    if (!enrollmentId) return;

    const checkEnrollmentStatus = async () => {
        try {
            const enrollment: EnrollmentResponse = await EnrollmentService.getEnrollmentById(enrollmentId);
            
            if (!isMounted) return;

            // Set Class Details
            const clsName = typeof enrollment.class === 'object' && enrollment.class !== null 
                ? (enrollment.class as any).name 
                : 'Class';
            
            setClassName(clsName);

            // Pre-fill amount if not passed from state (Fallback)
            if (!stateAmount && typeof enrollment.class === 'object' && (enrollment.class as any).price) {
                setAmount((enrollment.class as any).price.toString());
            }

            // Note: We don't block 'paid' status here strictly because a user 
            // might be uploading a slip for a NEW month on an existing enrollment.

        } catch (err) {
            console.error("Enrollment Check Error:", err);
            if (isMounted) {
                setError("Failed to load enrollment details.");
                setClassName("Unknown Class");
            }
        }
    };

    checkEnrollmentStatus();
    return () => { isMounted = false; };
  }, [enrollmentId, navigate, stateAmount]);

  // 2. Cleanup Preview
  useEffect(() => {
      return () => { if (previewUrl) URL.revokeObjectURL(previewUrl); };
  }, [previewUrl]);

  // 3. Handlers
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];

      if (selectedFile.size > MAX_FILE_BYTES) {
          setError(`File too large. Max ${MAX_FILE_SIZE_MB}MB.`);
          return;
      }
      if (!ALLOWED_TYPES.includes(selectedFile.type)) {
          setError("Invalid file type (JPG, PNG, JPEG only).");
          return;
      }

      setFile(selectedFile);
      if (selectedFile.type.startsWith('image/')) {
          setPreviewUrl(URL.createObjectURL(selectedFile));
      } else {
          setPreviewUrl(null);
      }
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setPreviewUrl(null);
    setError(null);
  };

  const handleUpload = async () => {
    if (!enrollmentId || !file) return;
    
    const paidAmount = parseFloat(amount);
    if (isNaN(paidAmount) || paidAmount <= 0) {
        setError("Please enter a valid amount.");
        return;
    }

    setLoading(true);
    setError(null);

    try {
      // --- CALL UPDATED SERVICE ---
      await PaymentService.uploadPaymentSlip(
          enrollmentId, 
          file, 
          paidAmount, 
          notes,
          targetMonth // <--- PASS MONTH TO BACKEND
      );
      
      setSuccess("Uploaded successfully!");
      
      Swal.fire({
          title: 'Slip Uploaded!',
          text: 'Please wait for admin approval.',
          icon: 'success',
          confirmButtonColor: '#0b2540'
      }).then(() => navigate("/student/dashboard"));

    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || "Upload failed. Please try again.");
      setLoading(false);
    }
  };

  return (
      <div className="p-4 sm:p-6 max-w-xl mx-auto pb-24 font-sans min-h-screen bg-gray-50 flex flex-col justify-center">
        
        <div className="bg-white rounded-[2rem] shadow-xl shadow-gray-100 p-6 sm:p-10 border border-gray-100">
            <button onClick={() => navigate(-1)} className="flex items-center text-gray-400 hover:text-[#0b2540] mb-6 transition-colors text-sm font-medium">
                <ArrowLeftIcon className="w-4 h-4 mr-1" /> Back
            </button>

            <h1 className="text-2xl font-black text-[#0b2540] mb-2">Upload Slip</h1>
            <div className="mb-8">
                <p className="text-gray-500 text-sm">
                    For class: <span className="font-bold text-gray-800">{className}</span>
                </p>
                {/* --- DISPLAY SELECTED MONTH --- */}
                {targetMonth && (
                    <div className="mt-2 inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1 rounded-lg text-xs font-bold border border-blue-100">
                        <CalendarDaysIcon className="w-4 h-4" />
                        Billing: {format(new Date(targetMonth), "MMMM yyyy")}
                    </div>
                )}
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-center text-red-600 text-xs font-medium">
                    <ExclamationCircleIcon className="w-5 h-5 mr-2 shrink-0" />{error}
                </div>
            )}

            <div className="space-y-6">
                
                {/* Amount */}
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Amount Paid (LKR) <span className="text-red-500">*</span></label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <span className="text-gray-400 font-bold">Rs.</span>
                        </div>
                        <input
                            type="number"
                            min="0"
                            step="0.01"
                            required
                            className="w-full pl-12 p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-[#0b2540] focus:border-transparent outline-none transition-all font-mono font-bold text-gray-800 text-lg"
                            placeholder="0.00"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                        />
                    </div>
                </div>

                {/* Drop Zone */}
                {!file ? (
                    <label className={`flex flex-col items-center justify-center w-full h-56 border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-300 group ${error ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50 hover:bg-blue-50/50 hover:border-blue-200'}`}>
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <div className="p-4 bg-white rounded-full shadow-sm mb-3 group-hover:scale-110 transition-transform">
                                <CloudArrowUpIcon className={`w-8 h-8 ${error ? 'text-red-400' : 'text-blue-500'}`} />
                            </div>
                            <p className="mb-1 text-sm text-gray-500 font-medium">Click to upload slip</p>
                            <p className="text-[10px] text-gray-400 uppercase tracking-wide">JPG, PNG OR JPEG</p>
                        </div>
                        <input type="file" className="hidden" accept={ALLOWED_TYPES.join(',')} onChange={handleFileChange} />
                    </label>
                ) : (
                    <div className="relative w-full h-56 bg-gray-900 rounded-2xl overflow-hidden flex items-center justify-center border border-gray-200 group">
                        {previewUrl ? (
                            <img src={previewUrl} alt="Slip Preview" className="h-full w-full object-contain p-4 opacity-90 group-hover:opacity-100 transition-opacity" />
                        ) : (
                            <div className="flex flex-col items-center text-white">
                                <DocumentTextIcon className="w-16 h-16 mb-2 opacity-50" />
                                <span className="text-sm font-medium">{file.name}</span>
                                <span className="text-xs opacity-50 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                            </div>
                        )}
                        <button onClick={handleRemoveFile} className="absolute top-3 right-3 p-2 bg-white/10 backdrop-blur-md text-white rounded-full hover:bg-red-500 transition-colors shadow-lg border border-white/20">
                            <XMarkIcon className="w-5 h-5" />
                        </button>
                    </div>
                )}

                {/* Notes */}
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Ref / Notes</label>
                    <textarea 
                        rows={2}
                        className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-[#0b2540] focus:border-transparent outline-none text-sm transition-all resize-none"
                        placeholder="Bank Ref No, Date, etc."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                    />
                </div>

                {/* Submit */}
                <button
                    onClick={handleUpload}
                    disabled={!file || !amount || loading || !!success}
                    className={`w-full py-4 rounded-2xl font-bold text-white transition-all shadow-lg flex items-center justify-center text-sm uppercase tracking-wide ${
                        !file || !amount || loading || !!success
                        ? "bg-gray-300 cursor-not-allowed shadow-none text-gray-500" 
                        : "bg-[#0b2540] hover:bg-[#153454] shadow-blue-900/20 active:scale-95"
                    }`}
                >
                    {loading ? (
                        <span className="flex items-center gap-2">
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                            Uploading...
                        </span>
                    ) : success ? "Uploaded" : "Submit Payment Slip"}
                </button>

            </div>
        </div>
      </div>
  );
}