import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import moment from "moment";
import { motion, AnimatePresence } from "framer-motion";
import ClassService from "../../../services/ClassService";
import BatchService from "../../../services/BatchService";
import {
  ArrowLeftIcon,
  PhotoIcon,
  CurrencyDollarIcon,
  ClockIcon,
  AcademicCapIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  InformationCircleIcon,
  EyeIcon,
  XMarkIcon
} from "@heroicons/react/24/outline";

// --- CONSTANTS ---
const DAY_INDEX: Record<string, number> = {
  Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6,
};
const INDEX_TO_DAY = Object.keys(DAY_INDEX);
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export default function UpdateClassPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false); // <--- New State
  const [error, setError] = useState<string | null>(null);
  
  const [batches, setBatches] = useState<any[]>([]);
  const [formData, setFormData] = useState<any>(null);
  
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // --- 1. Load Initial Data ---
  const initPage = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const [batchRes, classRes] = await Promise.all([
        BatchService.getAllBatches(false),
        ClassService.getClassById(id)
      ]);

      setBatches(batchRes.batches || []);
      
      const c = classRes.class || (Array.isArray(classRes) ? classRes[0] : classRes);
      if (!c) throw new Error("Module not found.");

      const schedule = c.timeSchedules?.[0] || {};
      
      setFormData({
        name: c.name || "",
        description: c.description || "",
        price: c.price ?? "",
        batch: c.batch?._id || c.batch || "", 
        day: schedule.day !== undefined ? INDEX_TO_DAY[schedule.day] : "Saturday",
        startTime: schedule.startTime || "08:00",
        endTime: schedule.endTime || "10:00",
        firstSessionDate: c.firstSessionDate ? moment(c.firstSessionDate).format("YYYY-MM-DD") : "",
        recurrence: c.recurrence || "weekly",
        totalSessions: c.totalSessions || 4,
        sessionDurationMinutes: c.sessionDurationMinutes || 120,
        level: c.level || "general",
        type: c.type || "theory",
        tags: c.tags?.join(", ") || "",
        isPublished: c.isPublished || false
      });

      if (c.coverImage) {
        const fullUrl = c.coverImage.startsWith("http") 
          ? c.coverImage 
          : `${API_BASE_URL}/${c.coverImage.replace(/\\/g, "/").replace(/^\/+/, "")}`;
        setCurrentImageUrl(fullUrl);
      }
    } catch (err: any) {
      setError(err.message || "Failed to synchronize data.");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => { initPage(); }, [initPage]);

  useEffect(() => {
    return () => { if (imagePreview) URL.revokeObjectURL(imagePreview); };
  }, [imagePreview]);

  // --- Handlers ---
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (e.target.type === 'checkbox') {
        const checked = (e.target as HTMLInputElement).checked;
        setFormData((prev: any) => ({ ...prev, [name]: checked }));
    } else {
        setFormData((prev: any) => ({ ...prev, [name]: value }));
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) return setError("Use JPG, PNG, or WebP formats only.");
    if (file.size > 5 * 1024 * 1024) return setError("File too large (Max 5MB).");

    setSelectedImage(file);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(URL.createObjectURL(file));
  };

  // 1. Pre-Submit Validation
  const handlePreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setError(null);

    if (moment(formData.startTime, "HH:mm").isSameOrAfter(moment(formData.endTime, "HH:mm"))) {
      return setError("The session end time must be later than the start time.");
    }

    setShowPreview(true);
  };

  // 2. Final Submit
  const handleFinalSubmit = async () => {
    setIsSaving(true);
    
    const payload = {
      ...formData,
      price: Number(formData.price) || 0,
      timeSchedules: [{
        day: DAY_INDEX[formData.day],
        startTime: formData.startTime,
        endTime: formData.endTime,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      }],
      tags: formData.tags.split(",").map((t: string) => t.trim()).filter(Boolean),
      coverImage: selectedImage || undefined,
    };

    try {
      await ClassService.updateClass(id!, payload);
      navigate(`/admin/classes`); 
    } catch (err: any) {
      setError(err.response?.data?.message || "Internal update failure.");
      setShowPreview(false);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <LoadingSkeleton />;

  return (
      <div className="max-w-3xl mx-auto space-y-8 pb-32 font-sans px-4 sm:px-6">
        
        {/* Header */}
        <header className="flex flex-col gap-2 pt-6 border-b border-gray-100 pb-6">
          <button onClick={() => navigate(-1)} className="w-fit flex items-center text-xs font-bold text-gray-400 hover:text-brand-cerulean transition-all uppercase tracking-widest">
            <ArrowLeftIcon className="w-3 h-3 mr-2 stroke-[3px]" /> Discard Changes
          </button>
          <h1 className="text-3xl font-bold text-brand-prussian tracking-tight">Modify Class Module</h1>
          <p className="text-gray-500 text-sm">Update module details, pricing, and schedules.</p>
        </header>

        {error && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-red-50 border border-red-100 text-red-600 px-5 py-4 rounded-2xl text-sm font-medium flex items-center gap-3 shadow-sm">
            <InformationCircleIcon className="w-5 h-5 shrink-0" /> {error}
          </motion.div>
        )}

        <form onSubmit={handlePreSubmit} className="space-y-8">
            
            {/* 1. Identity */}
            <Section title="Identity & Curriculum" icon={<AcademicCapIcon className="w-5 h-5"/>}>
              <div className="grid gap-5">
                <Input label="Class Name" name="name" value={formData.name} onChange={handleChange} required />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <Select label="Batch Intake" name="batch" value={formData.batch} onChange={handleChange}>
                    {batches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
                  </Select>
                  <Select label="Module Type" name="type" value={formData.type} onChange={handleChange} disabled>
                    <option value="theory">Theory</option>
                    <option value="revision">Revision</option>
                    <option value="paper">Paper Discussion</option>
                  </Select>
                </div>

                <Textarea label="Course Outline" name="description" value={formData.description} onChange={handleChange} rows={4} />
              </div>
            </Section>

            {/* 2. Logistics */}
            <Section title="Timing & Investment" icon={<ClockIcon className="w-5 h-5"/>}>
                <div className="space-y-5">
                    <div className="bg-brand-aliceBlue/30 border border-brand-aliceBlue p-5 rounded-2xl">
                        <div className="text-xs font-bold text-brand-prussian uppercase tracking-widest mb-4 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-brand-cerulean"></span> Primary Schedule
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                             <Select label="Weekly Schedule" name="day" value={formData.day} onChange={handleChange} className="bg-white">
                                {INDEX_TO_DAY.map(d => <option key={d} value={d}>{d}</option>)}
                             </Select>
                             <Input label="Starts At" name="startTime" type="time" value={formData.startTime} onChange={handleChange} className="bg-white" />
                             <Input label="Ends At" name="endTime" type="time" value={formData.endTime} onChange={handleChange} className="bg-white" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div className="relative">
                            <Input label="Monthly Fee (LKR)" name="price" type="number" value={formData.price} onChange={handleChange} />
                            <CurrencyDollarIcon className="absolute right-4 top-9 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                        <Input label="Start Date" name="firstSessionDate" type="date" value={formData.firstSessionDate} onChange={handleChange} />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                         <Input label="Sessions Count" name="totalSessions" type="number" value={formData.totalSessions} onChange={handleChange} />
                         <Input label="Duration (Mins)" name="sessionDurationMinutes" type="number" value={formData.sessionDurationMinutes} onChange={handleChange} />
                    </div>
                </div>
            </Section>

            {/* 3. Media */}
            <Section title="Cover Banner" icon={<PhotoIcon className="w-5 h-5"/>}>
              <div className="group relative aspect-[16/5] bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 hover:border-brand-cerulean transition-all cursor-pointer overflow-hidden flex flex-col items-center justify-center text-center p-6">
                {imagePreview ? (
                  <>
                    <img src={imagePreview} className="absolute inset-0 w-full h-full object-cover" alt="Preview" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-medium text-xs backdrop-blur-sm">Click to Change</div>
                  </>
                ) : currentImageUrl ? (
                   <>
                    <img src={currentImageUrl} className="absolute inset-0 w-full h-full object-cover opacity-80" alt="Current" />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/10 group-hover:bg-black/20 transition-all">
                        <span className="bg-white/90 text-brand-prussian px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm">Change Image</span>
                    </div>
                   </>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-10 h-10 bg-white rounded-full shadow-sm flex items-center justify-center text-gray-400 group-hover:text-brand-cerulean transition-colors"><PhotoIcon className="w-5 h-5" /></div>
                    <span className="text-xs font-bold text-gray-500">Upload Cover Banner</span>
                  </div>
                )}
                <input type="file" accept="image/*" onChange={handleImageChange} className="absolute inset-0 opacity-0 cursor-pointer" />
              </div>
            </Section>

            {/* 4. Settings */}
            <div className="bg-brand-prussian p-6 rounded-3xl text-white shadow-xl shadow-brand-prussian/20 flex items-center justify-between">
                <div>
                    <h3 className="text-sm font-bold text-brand-jasmine">Visibility Settings</h3>
                    <p className="text-xs text-blue-200/70 mt-1">Control if students can see this class.</p>
                </div>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <span className="text-xs font-semibold uppercase tracking-wider">{formData.isPublished ? "Public" : "Hidden"}</span>
                  <div className={`w-12 h-7 rounded-full transition-colors relative ${formData.isPublished ? 'bg-brand-cerulean' : 'bg-white/20'}`}>
                    <div className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-all shadow-sm ${formData.isPublished ? 'left-6' : 'left-1'}`} />
                  </div>
                  <input type="checkbox" className="hidden" name="isPublished" checked={formData.isPublished} onChange={handleChange} />
                </label>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-6 border-t border-gray-100">
                <button type="button" onClick={() => navigate(-1)} className="flex-1 py-4 rounded-xl text-sm font-bold text-gray-500 bg-white border border-gray-200 hover:bg-gray-50 transition-all">Cancel</button>
                <button type="submit" className="flex-[2] bg-brand-prussian hover:bg-brand-cerulean text-white py-4 rounded-xl text-sm font-bold transition-all shadow-lg shadow-brand-prussian/20 flex items-center justify-center gap-2 active:scale-95">
                    Review & Update <EyeIcon className="w-4 h-4" />
                </button>
            </div>

        </form>

        {/* --- CONFIRMATION MODAL --- */}
        <AnimatePresence>
            {showPreview && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                    <motion.div 
                        initial={{ scale: 0.95, y: 10 }} 
                        animate={{ scale: 1, y: 0 }} 
                        exit={{ scale: 0.95, y: 10 }} 
                        className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100"
                    >
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h3 className="text-lg font-bold text-brand-prussian">Confirm Updates</h3>
                            <button onClick={() => setShowPreview(false)} className="p-2 hover:bg-gray-200 rounded-full text-gray-500"><XMarkIcon className="w-5 h-5"/></button>
                        </div>
                        
                        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
                             {/* Summary Card */}
                             <div className="bg-brand-aliceBlue/20 p-4 rounded-xl border border-brand-aliceBlue/50 flex gap-4">
                                {(imagePreview || currentImageUrl) && <img src={imagePreview || currentImageUrl!} className="w-16 h-16 object-cover rounded-lg bg-gray-200" alt="Cover" />}
                                <div>
                                    <h4 className="font-bold text-brand-prussian text-lg leading-tight">{formData.name}</h4>
                                    <p className="text-xs text-gray-500 mt-1 capitalize">{formData.type} • {formData.recurrence}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="text-xs text-gray-400 font-bold uppercase block mb-1">New Schedule</span>
                                    <p className="font-medium text-gray-800">{formData.day}s</p>
                                    <p className="text-gray-600">{formData.startTime} - {formData.endTime}</p>
                                </div>
                                <div>
                                    <span className="text-xs text-gray-400 font-bold uppercase block mb-1">Fee</span>
                                    <p className="font-bold text-brand-cerulean text-lg">LKR {formData.price}</p>
                                </div>
                            </div>

                            {/* Alert for Schedule Change */}
                            <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 flex gap-3 items-start">
                                <InformationCircleIcon className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-xs font-bold text-orange-800">Note on Schedule Changes</p>
                                    <p className="text-[11px] text-orange-600 mt-1 leading-relaxed">
                                        Updating the schedule or duration will regenerate all future Zoom sessions. Past session data remains safe.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex gap-3">
                            <button onClick={() => setShowPreview(false)} className="flex-1 py-3 rounded-xl font-bold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 transition-all text-sm">Edit</button>
                            <button onClick={handleFinalSubmit} disabled={isSaving} className="flex-[2] py-3 rounded-xl font-bold text-white bg-brand-prussian hover:bg-brand-cerulean shadow-lg transition-all text-sm flex items-center justify-center gap-2">
                                {isSaving ? <ArrowPathIcon className="w-4 h-4 animate-spin"/> : <><CheckCircleIcon className="w-4 h-4"/> Confirm Update</>}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>

      </div>
  );
}

// --- SUB COMPONENTS ---

const Section = ({ title, icon, children }: any) => (
  <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-brand-aliceBlue shadow-sm">
    <div className="flex items-center gap-3 mb-6 md:mb-8 border-b border-brand-aliceBlue pb-4">
      <div className="text-brand-cerulean p-2 bg-brand-aliceBlue/50 rounded-xl">{icon}</div>
      <h2 className="text-xs font-bold text-brand-prussian uppercase tracking-widest">{title}</h2>
    </div>
    {children}
  </div>
);

const Input = ({ label, className, ...props }: any) => (
  <div className="flex flex-col gap-2">
    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.15em] ml-1">{label}</label>
    <input {...props} className={`w-full bg-brand-aliceBlue/20 border border-brand-aliceBlue focus:border-brand-cerulean focus:bg-white rounded-xl px-4 py-3 outline-none transition-all text-sm font-medium text-brand-prussian ${className || ''}`} />
  </div>
);

const Select = ({ label, children, className, ...props }: any) => (
  <div className="flex flex-col gap-2">
    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.15em] ml-1">{label}</label>
    <div className="relative">
        <select {...props} className={`w-full appearance-none bg-brand-aliceBlue/20 border border-brand-aliceBlue focus:border-brand-cerulean focus:bg-white rounded-xl px-4 py-3 outline-none transition-all text-sm font-medium cursor-pointer text-brand-prussian ${className || ''}`}>
        {children}
        </select>
        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
        </div>
    </div>
  </div>
);

const Textarea = ({ label, ...props }: any) => (
  <div className="flex flex-col gap-2">
    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.15em] ml-1">{label}</label>
    <textarea {...props} className="w-full bg-brand-aliceBlue/20 border border-brand-aliceBlue focus:border-brand-cerulean focus:bg-white rounded-xl px-4 py-3 outline-none transition-all text-sm font-medium text-brand-prussian resize-none" />
  </div>
);

const LoadingSkeleton = () => (
    <div className="flex flex-col h-[70vh] items-center justify-center space-y-4">
      <ArrowPathIcon className="w-12 h-12 text-brand-cerulean animate-spin" />
      <p className="text-brand-prussian font-bold uppercase tracking-widest animate-pulse">Syncing Data...</p>
    </div>
);