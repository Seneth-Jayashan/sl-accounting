// src/pages/admin/classes/CreateClass.tsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import moment from "moment";
import DashboardLayout from "../../../layouts/DashboardLayout";
import SidebarAdmin from "../../../components/sidebar/SidebarAdmin";
import BottomNavAdmin from "../../../components/bottomNavbar/BottomNavAdmin";
import ClassService from "../../../services/ClassService";
import BatchService from "../../../services/BatchService"; // Import BatchService
import {
  ArrowLeftIcon,
  PhotoIcon,
  CurrencyDollarIcon,
  ClockIcon,
  AcademicCapIcon,
  CheckCircleIcon
} from "@heroicons/react/24/outline";

const DAY_TO_INDEX: Record<string, number> = {
  Sunday: 0,
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
};

export default function CreateClassPage() {
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- 1. Batch Data State ---
  const [batches, setBatches] = useState<any[]>([]);
  const [loadingBatches, setLoadingBatches] = useState(true);

  // Form state
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

  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // --- 2. Fetch Batches on Mount ---
  useEffect(() => {
    const fetchBatches = async () => {
      try {
        // Fetch only active batches for new classes
        const data = await BatchService.getAllBatches(true); 
        if (data.batches) {
          setBatches(data.batches);
        }
      } catch (err) {
        console.error("Failed to fetch batches", err);
        setError("Failed to load batch list. Please refresh.");
      } finally {
        setLoadingBatches(false);
      }
    };

    fetchBatches();
  }, []);

  useEffect(() => {
    return () => { if (imagePreview) URL.revokeObjectURL(imagePreview); };
  }, [imagePreview]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedImage(file);
      if (imagePreview) URL.revokeObjectURL(imagePreview);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    // Validation
    if (!formData.name.trim() || formData.name.trim().length < 3) {
      setError("Class name must be at least 3 characters.");
      setIsSaving(false); return;
    }
    if (!formData.description || formData.description.trim().length < 10) {
      setError("Description must be at least 10 characters.");
      setIsSaving(false); return;
    }
    if (!timeRegex.test(formData.startTime) || !timeRegex.test(formData.endTime)) {
      setError("Start and end times must be valid (HH:mm).");
      setIsSaving(false); return;
    }
    if (!formData.firstSessionDate || isNaN(Date.parse(formData.firstSessionDate))) {
      setError("Please provide a valid First Session Date.");
      setIsSaving(false); return;
    }
    if (!formData.batch) {
        setError("Please select a Batch.");
        setIsSaving(false); return;
    }

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
      coverImage: selectedImage || undefined,
    };

    try {
      await ClassService.createClass(payload as any);
      alert("Class created successfully.");
      navigate("/admin/classes");
    } catch (err: any) {
      console.error("Create class error:", err);
      const msg = err?.response?.data?.message || err?.message || "Failed to create class";
      setError(String(msg));
    } finally {
      setIsSaving(false);
    }
  };

  const TipsSidebar = (
    <div className="space-y-4">
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
        <h3 className="font-semibold text-gray-800 mb-2">Class Setup Tips</h3>
        <ul className="text-sm text-gray-500 space-y-3 list-disc pl-4">
          <li><strong>Naming:</strong> Use a clear format like "Subject - Year".</li>
          <li><strong>Batch:</strong> Select the active intake this class belongs to.</li>
          <li><strong>Banner:</strong> 1200x600px recommended, PNG/JPG up to 5MB.</li>
        </ul>
      </div>
    </div>
  );

  return (
    <DashboardLayout Sidebar={SidebarAdmin} BottomNav={BottomNavAdmin} rightSidebar={TipsSidebar}>
      <div className="max-w-4xl mx-auto space-y-6 pb-20">
        <button onClick={() => navigate(-1)} className="flex items-center text-gray-500 hover:text-[#0b2540] transition-colors">
          <ArrowLeftIcon className="w-4 h-4 mr-1" /> Back to Classes
        </button>

        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create New Class</h1>
          <p className="text-gray-500 text-sm mt-1">Set up a new course module for students.</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-100 flex items-center">
            <span className="mr-2">⚠️</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-5">
                <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <AcademicCapIcon className="w-5 h-5 text-gray-400" /> Class Details
                </h2>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Class Name <span className="text-red-500">*</span></label>
                  <input name="name" value={formData.name} onChange={handleChange} placeholder="e.g. Accounting Theory 2025" required
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0b2540]/20 outline-none"/>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  
                  {/* --- REAL BATCH SELECTOR --- */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700">Batch <span className="text-red-500">*</span></label>
                    <select 
                        name="batch" 
                        value={formData.batch} 
                        onChange={handleChange}
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0b2540]/20 outline-none cursor-pointer"
                        required
                        disabled={loadingBatches}
                    >
                        <option value="">{loadingBatches ? "Loading batches..." : "Select a Batch"}</option>
                        {batches.map((batch) => (
                            <option key={batch._id} value={batch._id}>
                                {batch.name} ({moment(batch.startDate).format('MMM YYYY')} - {moment(batch.endDate).format('MMM YYYY')})
                            </option>
                        ))}
                    </select>
                    {batches.length === 0 && !loadingBatches && (
                        <p className="text-xs text-red-500">No active batches found. Create a batch first.</p>
                    )}
                  </div>
                  {/* ----------------------------- */}

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700">Tags (comma separated)</label>
                    <input name="tags" value={formData.tags} onChange={handleChange} placeholder="accounting, theory"
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0b2540]/20 outline-none"/>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Description</label>
                  <textarea name="description" value={formData.description} onChange={handleChange} rows={3}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0b2540]/20 outline-none resize-none"/>
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
                      <input name="price" type="number" value={formData.price} onChange={handleChange} placeholder="2500"
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
                    <label className="text-sm font-medium text-gray-700">Recurrence</label>
                    <select name="recurrence" value={formData.recurrence} onChange={handleChange}
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0b2540]/20 outline-none cursor-pointer">
                      <option value="weekly">Weekly</option><option value="daily">Daily</option><option value="none">None</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700">Total Sessions</label>
                    <input name="totalSessions" type="number" value={String(formData.totalSessions)} onChange={handleChange}
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0b2540]/20 outline-none"/>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700">Session Duration (minutes)</label>
                    <input name="sessionDurationMinutes" type="number" value={String(formData.sessionDurationMinutes)} onChange={handleChange}
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

            <div className="space-y-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <PhotoIcon className="w-5 h-5 text-gray-400" /> Class Banner
                </h2>

                <div className="relative w-full aspect-video bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl overflow-hidden flex flex-col items-center justify-center hover:bg-gray-100 transition-colors group cursor-pointer">
                  {imagePreview ? <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" /> : (
                    <div className="text-center p-4">
                      <PhotoIcon className="w-10 h-10 text-gray-300 mx-auto mb-2 group-hover:text-gray-400" />
                      <p className="text-xs text-gray-500 font-medium">Click to upload image</p>
                      <p className="text-[10px] text-gray-400 mt-1">PNG, JPG up to 5MB</p>
                    </div>
                  )}

                  <input type="file" accept="image/*" onChange={handleImageChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />

                  {imagePreview && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      <span className="text-white text-xs font-medium bg-black/50 px-3 py-1 rounded-full">Change Image</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-100">
            <button type="button" onClick={() => navigate(-1)} className="px-6 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors">Cancel</button>
            <button type="submit" disabled={isSaving} className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#0b2540] text-white font-medium hover:bg-[#153454] transition-colors disabled:opacity-70 disabled:cursor-not-allowed">
              {isSaving ? <>Creating...</> : <><CheckCircleIcon className="w-5 h-5" /> Create Class</>}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}