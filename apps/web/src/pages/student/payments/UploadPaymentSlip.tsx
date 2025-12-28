import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Swal from "sweetalert2"; 
import { 
  CloudArrowUpIcon, 
  DocumentTextIcon, 
  XMarkIcon,
  ArrowLeftIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/outline";


import PaymentService, { type PaymentData } from "../../../services/PaymentService";
import EnrollmentService from "../../../services/EnrollmentService";

// Config
const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

export default function UploadPaymentSlip() {
  const { enrollmentId } = useParams<{ enrollmentId: string }>();
  const navigate = useNavigate();

  // State
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [amount, setAmount] = useState(""); // New Amount State
  const [loading, setLoading] = useState(false);
  const [className, setClassName] = useState("Loading...");
  
  // UI State
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // 1. Initial Status Check
  useEffect(() => {
    let isMounted = true;
    if (!enrollmentId) return;

    const checkStatus = async () => {
        try {
            // A. Fetch Class Name
            const enrollmentData = await EnrollmentService.getEnrollmentById(enrollmentId);
            if (isMounted) {
                const clsName = typeof enrollmentData.class === 'string' ? 'Class' : enrollmentData.class.name;
                setClassName(clsName);
                // Optional: Pre-fill amount with class price if available
                if (typeof enrollmentData.class !== 'string' && enrollmentData.class.price) {
                    setAmount(enrollmentData.class.price.toString());
                }
            }

            // B. Check Existing Pending Payments
            const myPayments = await PaymentService.getMyPayments();
            const existingPayment = myPayments.find(
                (p: PaymentData) => 
                    (typeof p.enrollment === 'string' ? p.enrollment : p.enrollment._id) === enrollmentId
            );

            if (existingPayment) {
                if (existingPayment.status === 'pending') {
                    Swal.fire({
                        title: 'Slip Already Uploaded!',
                        text: 'Your slip is under review. Please wait for admin approval.',
                        icon: 'info',
                        confirmButtonText: 'OK',
                        confirmButtonColor: '#0b2540'
                    }).then(() => navigate("/student/enrollment"));
                } else if (existingPayment.status === 'completed') {
                    Swal.fire({
                        title: 'Already Paid!',
                        text: 'Redirecting to dashboard...',
                        icon: 'success',
                        timer: 2000,
                        showConfirmButton: false
                    }).then(() => navigate("/student/dashboard"));
                }
            }
        } catch (err) {
            console.error("Context Check Error:", err);
            if (isMounted) setClassName("Unknown Class");
        }
    };
    checkStatus();
    return () => { isMounted = false; };
  }, [enrollmentId, navigate]);

  // 2. Cleanup
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
          setError("Invalid file type (JPG, PNG, PDF only).");
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

  // 4. Submit
  const handleUpload = async () => {
    if (!enrollmentId || !file) return;
    
    // Validate Amount
    const paidAmount = parseFloat(amount);
    if (isNaN(paidAmount) || paidAmount <= 0) {
        setError("Please enter a valid amount greater than 0.");
        return;
    }

    setLoading(true);
    setError(null);

    try {
      // Pass amount to service
      await PaymentService.uploadPaymentSlip(enrollmentId, file, paidAmount, notes);
      
      setSuccess("Uploaded successfully!");
      Swal.fire({
          title: 'Upload Successful!',
          text: 'Your slip has been submitted for verification.',
          icon: 'success',
          confirmButtonColor: '#0b2540'
      }).then(() => navigate("/student/enrollment"));

    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || "Upload failed. Please try again.");
      setLoading(false);
    }
  };

  return (
      <div className="p-6 max-w-2xl mx-auto pb-24 font-sans">
        
        <button onClick={() => navigate(-1)} className="flex items-center text-gray-500 hover:text-[#0b2540] mb-6 transition-colors">
          <ArrowLeftIcon className="w-4 h-4 mr-2" /> Back
        </button>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">Upload Payment Slip</h1>
        <p className="text-gray-500 mb-8">
          Verify payment for <span className="font-semibold text-gray-900">{className}</span>.
        </p>

        {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-center text-red-600 text-sm">
                <ExclamationCircleIcon className="w-5 h-5 mr-2 shrink-0" />{error}
            </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8 space-y-6">
            
            {/* Amount Input */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Amount Paid (LKR) <span className="text-red-500">*</span></label>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">Rs.</span>
                    </div>
                    <input
                        type="number"
                        min="0"
                        step="0.01"
                        required
                        className="w-full pl-10 p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0b2540] focus:border-transparent outline-none transition-all font-mono font-bold text-gray-700"
                        placeholder="0.00"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                    />
                </div>
            </div>

            {/* File Drop Zone */}
            {!file ? (
                <label className={`flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${error ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-gray-50 hover:bg-gray-100'}`}>
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <CloudArrowUpIcon className={`w-12 h-12 mb-3 ${error ? 'text-red-400' : 'text-gray-400'}`} />
                        <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Click to upload</span> slip</p>
                        <p className="text-xs text-gray-400">JPG, PNG or PDF (MAX. {MAX_FILE_SIZE_MB}MB)</p>
                    </div>
                    <input type="file" className="hidden" accept={ALLOWED_TYPES.join(',')} onChange={handleFileChange} />
                </label>
            ) : (
                <div className="relative w-full h-64 bg-gray-100 rounded-xl overflow-hidden flex items-center justify-center border border-gray-200">
                    {previewUrl ? (
                        <img src={previewUrl} alt="Slip Preview" className="h-full w-full object-contain p-2" />
                    ) : (
                        <div className="flex flex-col items-center text-gray-500">
                            <DocumentTextIcon className="w-16 h-16 mb-2 text-gray-400" />
                            <span className="text-sm font-medium">{file.name}</span>
                            <span className="text-xs text-gray-400 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                        </div>
                    )}
                    <button onClick={handleRemoveFile} className="absolute top-3 right-3 p-2 bg-white/90 text-gray-600 rounded-full hover:bg-red-50 hover:text-red-600 transition-colors shadow-sm border border-gray-200">
                        <XMarkIcon className="w-5 h-5" />
                    </button>
                </div>
            )}

            {/* Notes Input */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Reference / Notes (Optional)</label>
                <textarea 
                    rows={2}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0b2540] focus:border-transparent outline-none text-sm transition-all"
                    placeholder="E.g. Transferred from HNB Bank, Ref No: 123456"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                />
            </div>

            {/* Submit Button */}
            <button
                onClick={handleUpload}
                disabled={!file || !amount || loading || !!success}
                className={`w-full py-3.5 rounded-xl font-bold text-white transition-all shadow-lg flex items-center justify-center ${
                    !file || !amount || loading || !!success
                    ? "bg-gray-300 cursor-not-allowed shadow-none text-gray-500" 
                    : "bg-[#0b2540] hover:bg-[#153454] shadow-blue-900/20 transform hover:-translate-y-0.5"
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
  );
}