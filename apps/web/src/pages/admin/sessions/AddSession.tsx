import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../../layouts/DashboardLayout";
import SidebarAdmin from "../../../components/sidebar/SidebarAdmin";
import BottomNavAdmin from "../../../components/bottomNavbar/BottomNavAdmin";
import ClassService from "../../../services/ClassService";
import SessionService from "../../../services/SessionService";
import type { CreateSessionPayload } from "../../../services/SessionService";

import { 
  ArrowLeftIcon, 
  CalendarDaysIcon, 
  ClockIcon, 
  VideoCameraIcon,
  PlusCircleIcon,
  PencilSquareIcon,
  DocumentTextIcon
} from "@heroicons/react/24/outline";

interface ClassOption {
  _id: string;
  name: string;
  sessionDurationMinutes?: number;
}

export default function AddSessionPage() {
  const navigate = useNavigate();
  
  // --- State ---
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form State
  const [formData, setFormData] = useState({
    classId: "",
    date: "",
    time: "18:00",
    duration: 120,
    title: "",
    notes: "",
    createZoom: true,
  });

  // --- 1. Fetch Classes for Dropdown ---
  useEffect(() => {
    const fetchClasses = async () => {
      setLoading(true);
      try {
        const data = await ClassService.getAllClasses();
        // Handle array response
        if (Array.isArray(data)) {
            setClasses(data);
        } else if (data.classes) {
            // In case your API returns { success: true, classes: [...] }
            setClasses(data.classes);
        }
      } catch (error) {
        console.error("Failed to load classes", error);
        setError("Failed to load class list. Please refresh.");
      } finally {
        setLoading(false);
      }
    };
    fetchClasses();
  }, []);

  // --- 2. Update Duration when Class Changes ---
  const handleClassChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const clsId = e.target.value;
    const selectedClass = classes.find(c => c._id === clsId);
    
    setFormData(prev => ({
        ...prev,
        classId: clsId,
        // Auto-fill duration from class default if available
        duration: selectedClass?.sessionDurationMinutes || 120 
    }));
  };

  // --- 3. Handle Generic Input ---
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // --- 4. Handle Submit ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.classId) { alert("Please select a class."); return; }
    if (!formData.date) { alert("Please select a date."); return; }

    setSubmitting(true);
    setError(null);

    try {
      const payload: CreateSessionPayload = {
        date: formData.date,
        time: formData.time,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Colombo", // Auto-detect
        durationMinutes: Number(formData.duration),
        title: formData.title.trim() || undefined,
        notes: formData.notes.trim() || undefined,
        skipZoom: !formData.createZoom
      };

      await SessionService.createSession(formData.classId, payload);
      
      alert("Session scheduled successfully!");
      navigate("/admin/sessions"); // Redirect to sessions list
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to schedule session.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout Sidebar={SidebarAdmin} BottomNav={BottomNavAdmin}>
      <div className="max-w-3xl mx-auto space-y-6 pb-20">
        
        {/* Header */}
        <div className="flex items-center gap-4 pt-6">
           <button 
             onClick={() => navigate(-1)}
             className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
           >
             <ArrowLeftIcon className="w-5 h-5" />
           </button>
           <div>
             <h1 className="text-2xl font-bold text-gray-900">Schedule Extra Session</h1>
             <p className="text-gray-500 text-sm">Add a makeup class or special session.</p>
           </div>
        </div>

        {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
                {error}
            </div>
        )}

        {/* Form Card */}
        <div className="bg-white border border-gray-100 rounded-3xl shadow-sm p-6 sm:p-8">
          
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* 1. Class Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Class <span className="text-red-500">*</span></label>
              <div className="relative">
                 <select
                   name="classId"
                   value={formData.classId}
                   onChange={handleClassChange}
                   disabled={loading}
                   className="w-full appearance-none bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-[#0b2540] focus:border-[#0b2540] block p-3 pr-8 outline-none transition-all cursor-pointer"
                   required
                 >
                   <option value="">{loading ? "Loading classes..." : "-- Choose a Class --"}</option>
                   {classes.map((cls) => (
                     <option key={cls._id} value={cls._id}>
                       {cls.name}
                     </option>
                   ))}
                 </select>
                 <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                   <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/></svg>
                 </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* 2. Date */}
                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <CalendarDaysIcon className="w-4 h-4 text-gray-400"/> Date <span className="text-red-500">*</span>
                   </label>
                   <input
                     type="date"
                     name="date"
                     value={formData.date}
                     onChange={handleChange}
                     className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-[#0b2540] focus:border-[#0b2540] p-3 outline-none"
                     required
                   />
                </div>

                {/* 3. Start Time */}
                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <ClockIcon className="w-4 h-4 text-gray-400"/> Start Time <span className="text-red-500">*</span>
                   </label>
                   <input
                     type="time"
                     name="time"
                     value={formData.time}
                     onChange={handleChange}
                     className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-[#0b2540] focus:border-[#0b2540] p-3 outline-none"
                     required
                   />
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* 4. Duration */}
                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-2">Duration (Minutes)</label>
                   <input
                     type="number"
                     name="duration"
                     min="15"
                     step="15"
                     value={formData.duration}
                     onChange={handleChange}
                     className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-[#0b2540] focus:border-[#0b2540] p-3 outline-none"
                   />
                </div>

                {/* 5. Topic (Optional) */}
                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <PencilSquareIcon className="w-4 h-4 text-gray-400"/> Topic / Title
                   </label>
                   <input
                     type="text"
                     name="title"
                     placeholder="e.g. Revision for Mid-Term"
                     value={formData.title}
                     onChange={handleChange}
                     className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-[#0b2540] focus:border-[#0b2540] p-3 outline-none"
                   />
                </div>
            </div>

            {/* 6. Notes */}
            <div>
               <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <DocumentTextIcon className="w-4 h-4 text-gray-400"/> Notes for Students
               </label>
               <textarea
                 name="notes"
                 rows={3}
                 placeholder="Add any specific instructions, materials required, etc."
                 value={formData.notes}
                 onChange={handleChange}
                 className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-[#0b2540] focus:border-[#0b2540] p-3 outline-none resize-none"
               />
            </div>

            {/* 7. Zoom Toggle */}
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="bg-white p-2 rounded-lg text-blue-600 shadow-sm">
                        <VideoCameraIcon className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-blue-900">Create Zoom Meeting</p>
                        <p className="text-xs text-blue-700">Automatically generate a link for this session.</p>
                    </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer"
                    checked={formData.createZoom}
                    onChange={(e) => setFormData(prev => ({ ...prev, createZoom: e.target.checked }))}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
               <button
                 type="submit"
                 disabled={submitting}
                 className={`w-full flex items-center justify-center gap-2 text-white font-medium py-3.5 rounded-xl transition-all ${
                    submitting 
                      ? "bg-gray-400 cursor-not-allowed" 
                      : "bg-[#0b2540] hover:bg-[#153454] shadow-lg shadow-blue-900/20"
                 }`}
               >
                 {submitting ? (
                    <span className="animate-pulse">Scheduling...</span>
                 ) : (
                    <>
                      <PlusCircleIcon className="w-5 h-5" />
                      Add Session
                    </>
                 )}
               </button>
            </div>

          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}