// src/pages/admin/classes/UpdateClassPage.tsx
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

// --- MOCK BATCH DATA (Same as Create Page) ---
const MOCK_BATCHES = [
  { _id: "675841029e0780f1966504e9", name: "2025 A/L Theory", year: "2025" },
  { _id: "675841029e0780f1966504ea", name: "2026 A/L Theory", year: "2026" },
  { _id: "675841029e0780f1966504eb", name: "2025 Revision", year: "2025" }
];

const DAY_TO_INDEX: Record<string, number> = {
  Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6,
};

// Helper to reverse index to day name
const INDEX_TO_DAY = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function UpdateClassPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State (Matches Backend Schema)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    batch: "", 
    day: "Saturday",
    startTime: "08:00",
    endTime: "10:00",
    firstSessionDate: "",
    recurrence: "weekly",
    totalSessions: 4,
    sessionDurationMinutes: 60,
    level: "general",
    tags: "",
    isPublished: false
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

          // Extract Schedule (Assuming 1 schedule for now)
          const schedule = c.timeSchedules && c.timeSchedules.length > 0 ? c.timeSchedules[0] : {};
          const dayName = schedule.day !== undefined ? INDEX_TO_DAY[schedule.day] : "Saturday";

          // Format Date for Input (YYYY-MM-DD)
          let dateStr = "";
          if (c.firstSessionDate) {
            dateStr = new Date(c.firstSessionDate).toISOString().split('T')[0];
          }

          setFormData({
            name: c.name || "",
            description: c.description || "",
            price: c.price !== undefined ? String(c.price) : "",
            batch: c.batch ? (typeof c.batch === 'object' ? c.batch._id : c.batch) : "", // Handle populated or raw ID
            day: dayName,
            startTime: schedule.startTime || "08:00",
            endTime: schedule.endTime || "10:00",
            firstSessionDate: dateStr,
            recurrence: c.recurrence || "weekly",
            totalSessions: c.totalSessions || 4,
            sessionDurationMinutes: c.sessionDurationMinutes || 60,
            level: c.level || "general",
            tags: c.tags ? c.tags.join(", ") : "", // Array to Comma-String
            isPublished: c.isPublished || false
          });

          // Handle Image
          // Assuming backend returns a full URL or relative path
          if (c.coverImage) {
            // Adjust this if your backend returns just filename
            // e.g., `http://localhost:5000/uploads/classes/${c.coverImage}`
            setCurrentImageUrl(c.coverImage); 
          }
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

  // 2. Handle Inputs
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // 3. Handle Image Selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedImage(file);
      // Clean up previous preview if exists
      if (imagePreview) URL.revokeObjectURL(imagePreview);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleRemoveNewImage = () => {
    setSelectedImage(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
  };

  // 4. Submit Update
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    
    setIsSaving(true);
    setError(null);

    // Reconstruct Time Schedules
    const timeSchedules = [
        {
          day: DAY_TO_INDEX[formData.day] ?? 0,
          startTime: formData.startTime,
          endTime: formData.endTime,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"
        }
    ];

    const payload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        price: formData.price ? Number(formData.price) : 0,
        batch: formData.batch,
        timeSchedules,
        firstSessionDate: formData.firstSessionDate,
        recurrence: formData.recurrence as "weekly" | "daily" | "none",
        totalSessions: Number(formData.totalSessions),
        sessionDurationMinutes: Number(formData.sessionDurationMinutes),
        level: formData.level as "general" | "ordinary" | "advanced",
        tags: formData.tags ? formData.tags.split(",").map(t => t.trim()).filter(Boolean) : undefined,
        isPublished: Boolean(formData.isPublished),
        coverImage: selectedImage || undefined, // Only send if new image selected
    };

    try {
      await ClassService.updateClass(id, payload as any);
      alert("Class updated successfully!");
      navigate(`/admin/classes`); 
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to update class.");
    } finally {
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
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0b2540]/20 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  
                  {/* Batch Select */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700">Batch</label>
                    <select 
                        name="batch" 
                        value={formData.batch} 
                        onChange={handleChange}
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0b2540]/20 outline-none cursor-pointer"
                        required
                    >
                        <option value="">Select Batch</option>
                        {MOCK_BATCHES.map((batch) => (
                            <option key={batch._id} value={batch._id}>
                                {batch.name} ({batch.year})
                            </option>
                        ))}
                    </select>
                  </div>

                  {/* Tags */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700">Tags (comma sep)</label>
                    <input 
                        name="tags" 
                        value={formData.tags} 
                        onChange={handleChange} 
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0b2540]/20 outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0b2540]/20 outline-none resize-none"
                  />
                </div>
              </div>

              {/* Schedule Section */}
               <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-5">
                <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <ClockIcon className="w-5 h-5 text-gray-400" /> Schedule & Fees
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700">Monthly Fee (LKR)</label>
                    <div className="relative">
                      <CurrencyDollarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"/>
                      <input name="price" type="number" value={formData.price} onChange={handleChange}
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0b2540]/20 outline-none"/>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700">Day</label>
                    <select name="day" value={formData.day} onChange={handleChange}
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0b2540]/20 outline-none cursor-pointer">
                      <option>Monday</option><option>Tuesday</option><option>Wednesday</option>
                      <option>Thursday</option><option>Friday</option><option>Saturday</option><option>Sunday</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700">Start Time</label>
                    <input name="startTime" type="time" value={formData.startTime} onChange={handleChange}
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0b2540]/20 outline-none"/>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700">End Time</label>
                    <input name="endTime" type="time" value={formData.endTime} onChange={handleChange}
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0b2540]/20 outline-none"/>
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700">First Session Date</label>
                    <input name="firstSessionDate" type="date" value={formData.firstSessionDate} onChange={handleChange}
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0b2540]/20 outline-none"/>
                  </div>
                   <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700">Level</label>
                    <select name="level" value={formData.level} onChange={handleChange}
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0b2540]/20 outline-none cursor-pointer">
                      <option value="general">General</option><option value="ordinary">Ordinary</option><option value="advanced">Advanced</option>
                    </select>
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
                    <img src={currentImageUrl} alt="Current Banner" className="w-full h-full object-cover" />
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
                    onClick={handleRemoveNewImage}
                    className="mt-3 text-xs text-red-600 flex items-center gap-1 hover:underline"
                  >
                    <TrashIcon className="w-3 h-3" /> Revert to original
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