import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
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
  CheckCircleIcon
} from "@heroicons/react/24/outline";

export default function CreateClassPage() {
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    className: "",
    subject: "Accounting",
    batch: "2025 A/L",
    fee: "",
    description: "",
    scheduleDay: "Saturday",
    scheduleTime: "08:00"
  });

  // Image State
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Handle Text Inputs
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle Image Selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedImage(file);
      
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    }
  };

  // Handle Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      await ClassService.createClass({
        ...formData,
        coverImage: selectedImage
      });
      
      // Navigate to class list on success
      // navigate("/admin/classes"); 
      alert("Class created successfully!"); // Temporary feedback
      navigate(-1);
      
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to create class.");
    } finally {
      setIsSaving(false);
    }
  };

  // Right Sidebar Tips
  const TipsSidebar = (
    <div className="space-y-4">
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
        <h3 className="font-semibold text-gray-800 mb-2">Class Setup Tips</h3>
        <ul className="text-sm text-gray-500 space-y-3 list-disc pl-4">
          <li><strong>Naming:</strong> Use a clear format like "Year + Subject" (e.g., 2025 A/L Accounting).</li>
          <li><strong>Banner:</strong> Recommended size is 1200x600px (2:1 ratio) for best visibility on student dashboards.</li>
          <li><strong>Fees:</strong> Enter the monthly fee amount. This will be used for payment tracking.</li>
        </ul>
      </div>
    </div>
  );

  return (
    <DashboardLayout Sidebar={SidebarAdmin} BottomNav={BottomNavAdmin} rightSidebar={TipsSidebar}>
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Navigation */}
        <button 
          onClick={() => navigate(-1)} 
          className="flex items-center text-gray-500 hover:text-[#0b2540] transition-colors"
        >
          <ArrowLeftIcon className="w-4 h-4 mr-1" /> Back to Classes
        </button>

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create New Class</h1>
          <p className="text-gray-500 text-sm mt-1">Set up a new course module for students.</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-100 flex items-center">
            <span className="mr-2">⚠️</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Column: Details */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Basic Info Card */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-5">
                <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <AcademicCapIcon className="w-5 h-5 text-gray-400" /> Class Details
                </h2>

                {/* Class Name */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Class Name <span className="text-red-500">*</span></label>
                  <input
                    name="className"
                    value={formData.className}
                    onChange={handleChange}
                    placeholder="e.g. 2025 A/L Theory"
                    required
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0b2540]/20 focus:border-[#0b2540] outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Subject */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700">Subject</label>
                    <select
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0b2540]/20 outline-none cursor-pointer"
                    >
                      <option value="Accounting">Accounting</option>
                      <option value="Economics">Economics</option>
                      <option value="Business Studies">Business Studies</option>
                    </select>
                  </div>

                  {/* Batch */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700">Batch</label>
                    <select
                      name="batch"
                      value={formData.batch}
                      onChange={handleChange}
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0b2540]/20 outline-none cursor-pointer"
                    >
                      <option value="2024 A/L">2024 A/L</option>
                      <option value="2025 A/L">2025 A/L</option>
                      <option value="2026 A/L">2026 A/L</option>
                      <option value="Revision">Revision</option>
                    </select>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Brief overview of what this class covers..."
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0b2540]/20 focus:border-[#0b2540] outline-none resize-none"
                  />
                </div>
              </div>

              {/* Schedule & Fees Card */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-5">
                 <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <ClockIcon className="w-5 h-5 text-gray-400" /> Schedule & Fees
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Monthly Fee */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700">Monthly Fee (LKR)</label>
                    <div className="relative">
                      <CurrencyDollarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        name="fee"
                        type="number"
                        value={formData.fee}
                        onChange={handleChange}
                        placeholder="2500"
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0b2540]/20 focus:border-[#0b2540] outline-none"
                      />
                    </div>
                  </div>

                   {/* Day */}
                   <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700">Day</label>
                    <select
                      name="scheduleDay"
                      value={formData.scheduleDay}
                      onChange={handleChange}
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0b2540]/20 outline-none cursor-pointer"
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

                  {/* Time */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700">Start Time</label>
                    <input
                      name="scheduleTime"
                      type="time"
                      value={formData.scheduleTime}
                      onChange={handleChange}
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0b2540]/20 outline-none"
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
                
                {/* Image Preview Area */}
                <div className="relative w-full aspect-video bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl overflow-hidden flex flex-col items-center justify-center hover:bg-gray-100 transition-colors group cursor-pointer">
                  
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center p-4">
                      <PhotoIcon className="w-10 h-10 text-gray-300 mx-auto mb-2 group-hover:text-gray-400" />
                      <p className="text-xs text-gray-500 font-medium">Click to upload image</p>
                      <p className="text-[10px] text-gray-400 mt-1">PNG, JPG up to 5MB</p>
                    </div>
                  )}

                  {/* Hidden Input */}
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleImageChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  
                  {/* Overlay for change */}
                  {imagePreview && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      <span className="text-white text-xs font-medium bg-black/50 px-3 py-1 rounded-full">Change Image</span>
                    </div>
                  )}
                </div>
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
                <>Creating...</>
              ) : (
                <>
                  <CheckCircleIcon className="w-5 h-5" />
                  Create Class
                </>
              )}
             </button>
          </div>

        </form>
      </div>
    </DashboardLayout>
  );
}