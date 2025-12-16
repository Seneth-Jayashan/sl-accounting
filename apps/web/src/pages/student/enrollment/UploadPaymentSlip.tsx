import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DashboardLayout from "../../../layouts/DashboardLayout";
import SidebarStudent from "../../../components/sidebar/SidebarStudent";
import BottomNavStudent from "../../../components/bottomNavbar/BottomNavStudent";
import PaymentService from "../../../services/PaymentService";
import EnrollmentService from "../../../services/EnrollmentService";
import { 
  CloudArrowUpIcon, 
  DocumentTextIcon, 
  XMarkIcon,
  ArrowLeftIcon 
} from "@heroicons/react/24/outline";

export default function UploadPaymentSlip() {
  const { enrollmentId } = useParams<{ enrollmentId: string }>();
  const navigate = useNavigate();

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [uploading, setUploading] = useState(false);
  const [className, setClassName] = useState("Loading...");

  // Fetch Class Name for Context
  useEffect(() => {
    if (!enrollmentId) return;
    EnrollmentService.getEnrollmentById(enrollmentId)
      .then(data => {
         const clsName = typeof data.class === 'string' ? 'Class' : data.class.name;
         setClassName(clsName);
      })
      .catch(() => setClassName("Unknown Class"));
  }, [enrollmentId]);

  // Handle File Selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
    }
  };

  // Handle Remove File
  const handleRemoveFile = () => {
    setFile(null);
    setPreviewUrl(null);
  };

  // Handle Submit
  const handleUpload = async () => {
    if (!enrollmentId || !file) return;
    
    setUploading(true);
    try {
      await PaymentService.uploadPaymentSlip(enrollmentId, file, notes);
      alert("Payment slip uploaded successfully! Admin will verify shortly.");
      navigate("/student/enrollments");
    } catch (error: any) {
      console.error(error);
      alert(error.response?.data?.message || "Failed to upload slip.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <DashboardLayout Sidebar={SidebarStudent} BottomNav={BottomNavStudent}>
      <div className="p-6 max-w-2xl mx-auto pb-20">
        
        {/* Header */}
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-500 hover:text-[#0b2540] mb-6 transition-colors"
        >
          <ArrowLeftIcon className="w-4 h-4 mr-2" /> Back
        </button>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">Upload Payment Slip</h1>
        <p className="text-gray-500 mb-8">
          Upload proof of payment for <span className="font-semibold text-gray-900">{className}</span>.
        </p>

        {/* Upload Area */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
            
            {/* File Drop Zone */}
            {!file ? (
                <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <CloudArrowUpIcon className="w-12 h-12 text-gray-400 mb-3" />
                        <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                        <p className="text-xs text-gray-500">JPG, PNG or PDF (MAX. 5MB)</p>
                    </div>
                    <input type="file" className="hidden" accept="image/*,.pdf" onChange={handleFileChange} />
                </label>
            ) : (
                <div className="relative w-full h-64 bg-gray-100 rounded-xl overflow-hidden flex items-center justify-center border border-gray-200">
                    {file.type.startsWith('image/') && previewUrl ? (
                        <img src={previewUrl} alt="Preview" className="h-full object-contain" />
                    ) : (
                        <div className="flex flex-col items-center text-gray-500">
                            <DocumentTextIcon className="w-16 h-16 mb-2" />
                            <span className="text-sm font-medium">{file.name}</span>
                        </div>
                    )}
                    <button 
                        onClick={handleRemoveFile}
                        className="absolute top-3 right-3 p-1.5 bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition-colors"
                    >
                        <XMarkIcon className="w-5 h-5" />
                    </button>
                </div>
            )}

            {/* Notes Input */}
            <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Additional Notes (Optional)</label>
                <textarea 
                    rows={3}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0b2540] focus:border-transparent outline-none text-sm"
                    placeholder="E.g. Transferred from HNB Bank, Ref No: 123456"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                />
            </div>

            {/* Submit Button */}
            <button
                onClick={handleUpload}
                disabled={!file || uploading}
                className={`w-full mt-8 py-3.5 rounded-xl font-bold text-white transition-all shadow-lg ${
                    !file || uploading 
                    ? "bg-gray-300 cursor-not-allowed shadow-none" 
                    : "bg-[#0b2540] hover:bg-[#153454] shadow-blue-900/20 transform hover:-translate-y-0.5"
                }`}
            >
                {uploading ? "Uploading..." : "Submit Payment Slip"}
            </button>

        </div>
      </div>
    </DashboardLayout>
  );
}