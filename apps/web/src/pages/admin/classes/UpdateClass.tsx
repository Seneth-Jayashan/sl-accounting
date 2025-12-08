import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DashboardLayout from "../../../layouts/DashboardLayout";
import SidebarAdmin from "../../../components/sidebar/SidebarAdmin";
import BottomNavAdmin from "../../../components/bottomNavbar/BottomNavAdmin";
import ClassService from "../../../services/ClassService";
import {
  ArrowLeftIcon,
  PhotoIcon,
  CurrencyDollarIcon,
  ClockIcon,
  AcademicCapIcon,
  CheckCircleIcon,
  TrashIcon
} from "@heroicons/react/24/outline";

export default function UpdateClassPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    className: "",
    subject: "",
    batch: "",
    fee: "",
    description: "",
    scheduleDay: "",
    scheduleTime: ""
  });

  // Image State
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // 1. Fetch Existing Data
  useEffect(() => {
    if (!id) return;
    const fetchClass = async () => {
      setIsLoading(true);
      try {
        const data = await ClassService.getClassById(id);
        if (data.success && data.class) {
          const c = data.class;
          setFormData({
            className: c.className || "",
            subject: c.subject || "Accounting",
            batch: c.batch || "2025 A/L",
            fee: c.fee ? String(c.fee) : "",
            description: c.description || "",
            scheduleDay: c.scheduleDay || "Saturday",
            scheduleTime: c.scheduleTime || "08:00"
          });
          setCurrentImageUrl(c.coverImage || null);
        } else {
          setError("Class not found.");
        }
      } catch (err: any) {
        console.error(err);
        setError("Failed to load class details.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchClass();
  }, [id]);

  // 2. Handle Text Changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // 3. Handle Image Selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  // 4. Remove Selected Image (Revert to current)
  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
  };

  // 5. Submit Update
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    
    setIsSaving(true);
    setError(null);

    try {
      await ClassService.updateClass(id, {
        ...formData,
        coverImage: selectedImage // Will be null if not changed, which is fine
      });
      
      navigate(`/admin/classes/${id}`); // Go back to View Page
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to update class.");
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout Sidebar={SidebarAdmin} BottomNav={BottomNavAdmin}>
        <div className="flex h-screen items-center justify-center text-gray-400">
          Loading class data...
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout Sidebar={SidebarAdmin} BottomNav={BottomNavAdmin}>
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Navigation */}
        <button 
          onClick={() => navigate(-1)} 
          className="flex items-center text-gray-500 hover:text-[#0b2540] transition-colors"
        >
          <ArrowLeftIcon className="w-4 h-4 mr-1" /> Cancel & Go Back
        </button>

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Class</h1>
          <p className="text-gray-500 text-sm mt-1">Update course details and settings.</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-100 flex items-center">
            <span className="mr-2">⚠️</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Column: Form Fields */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-5">
                <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <AcademicCapIcon className="w-5 h-5 text-gray-400" /> Class Information
                </h2>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Class Name</label>
                  <input
                    name="className"
                    value={formData.className}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0b2540]/20 focus:border-[#0b2540] outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700">Subject</label>
                    <select
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none cursor-pointer"
                    >
                      <option value="Accounting">Accounting</option>
                      <option value="Economics">Economics</option>
                      <option value="Business Studies">Business Studies</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700">Batch</label>
                    <select
                      name="batch"
                      value={formData.batch}
                      onChange={handleChange}
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none cursor-pointer"
                    >
                      <option value="2024 A/L">2024 A/L</option>
                      <option value="2025 A/L">2025 A/L</option>
                      <option value="2026 A/L">2026 A/L</option>
                      <option value="Revision">Revision</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0b2540]/20 focus:border-[#0b2540] outline-none resize-none"
                  />
                </div>
              </div>

               <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-5">
                 <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <ClockIcon className="w-5 h-5 text-gray-400" /> Schedule & Fees
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700">Monthly Fee (LKR)</label>
                    <div className="relative">
                      <CurrencyDollarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        name="fee"
                        type="number"
                        value={formData.fee}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none"
                      />
                    </div>
                  </div>

                   <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700">Day</label>
                    <select
                      name="scheduleDay"
                      value={formData.scheduleDay}
                      onChange={handleChange}
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none cursor-pointer"
                    >
                      <option value="Monday">Monday</option>
                      <option value="Tuesday">Tuesday</option>
                      <option value="Wednesday">Wednesday</option>
                      <option value="Thursday">Thursday</option>
                      <option value="Friday">Friday</option>
                      <option value="Saturday">Saturday</option>
                      <option value="Sunday">Sunday</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700">Start Time</label>
                    <input
                      name="scheduleTime"
                      type="time"
                      value={formData.scheduleTime}
                      onChange={handleChange}
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Image Upload */}
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <PhotoIcon className="w-5 h-5 text-gray-400" /> Class Banner
                </h2>
                
                {/* Image Preview Logic */}
                <div className="relative w-full aspect-video bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl overflow-hidden flex flex-col items-center justify-center hover:bg-gray-100 transition-colors group cursor-pointer">
                  
                  {imagePreview ? (
                    // New Image Selected
                    <img src={imagePreview} alt="New Preview" className="w-full h-full object-cover" />
                  ) : currentImageUrl ? (
                    // Existing Image from Backend
                    <img src={currentImageUrl} alt="Current Banner" className="w-full h-full object-cover opacity-90" />
                  ) : (
                    // No Image
                    <div className="text-center p-4">
                      <PhotoIcon className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                      <p className="text-xs text-gray-500">No cover image</p>
                    </div>
                  )}

                  {/* Hidden Input */}
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleImageChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <span className="text-white text-xs font-medium bg-black/50 px-3 py-1 rounded-full">
                      {imagePreview || currentImageUrl ? "Change Image" : "Upload Image"}
                    </span>
                  </div>
                </div>

                {/* Remove / Reset Button */}
                {imagePreview && (
                  <button 
                    type="button"
                    onClick={handleRemoveImage}
                    className="mt-3 text-xs text-red-600 flex items-center gap-1 hover:underline"
                  >
                    <TrashIcon className="w-3 h-3" /> Remove new selection
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-100">
             <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-6 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
             >
              Cancel
             </button>
             <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#0b2540] text-white font-medium hover:bg-[#153454] transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
             >
              {isSaving ? (
                <>Saving...</>
              ) : (
                <>
                  <CheckCircleIcon className="w-5 h-5" />
                  Save Changes
                </>
              )}
             </button>
          </div>

        </form>
      </div>
    </DashboardLayout>
  );
}