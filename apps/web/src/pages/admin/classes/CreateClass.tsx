import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import moment from "moment";
import { motion } from "framer-motion";
import ClassService, { type CreateClassPayload } from "../../../services/ClassService";
import BatchService from "../../../services/BatchService";
import {
  ArrowLeftIcon,
  PhotoIcon,
  CurrencyDollarIcon,
  ClockIcon,
  AcademicCapIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  HashtagIcon,
  CalendarDaysIcon 
} from "@heroicons/react/24/outline";

const DAY_INDEX: Record<string, number> = {
  Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6,
};

const INITIAL_FORM = {
  name: "",
  description: "",
  price: "2000",
  batch: "",
  type: "theory",
  day: "Saturday",
  startTime: "08:00",
  endTime: "10:00",
  firstSessionDate: "",
  recurrence: "weekly",
  totalSessions: "4", 
  sessionDurationMinutes: "120", 
  level: "advanced",
  tags: "",
  
  autoCreateVariants: false,
  // Revision Details
  revisionDay: "Sunday",
  revisionStartTime: "08:00",
  revisionEndTime: "10:00",
  revisionPrice: "",

  // Paper Details
  paperDay: "Sunday",
  paperStartTime: "13:00",
  paperEndTime: "15:00",
  paperPrice: "",
};

export default function CreateClassPage() {
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [batches, setBatches] = useState<any[]>([]);
  const [loadingBatches, setLoadingBatches] = useState(true);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const fetchBatches = useCallback(async () => {
    try {
      setLoadingBatches(true);
      const data = await BatchService.getAllBatches(true);
      setBatches(data.batches || []);
    } catch (err) {
      setError("System was unable to load intake batches.");
    } finally {
      setLoadingBatches(false);
    }
  }, []);

  useEffect(() => { fetchBatches(); }, [fetchBatches]);

  useEffect(() => {
    return () => { if (imagePreview) URL.revokeObjectURL(imagePreview); };
  }, [imagePreview]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    // Handle Checkbox
    if (e.target.type === 'checkbox') {
        const checked = (e.target as HTMLInputElement).checked;
        setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
        setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) return setError("Invalid format. Use JPG, PNG or WebP.");
    if (file.size > 5 * 1024 * 1024) return setError("File too large. Max 5MB allowed.");

    setSelectedImage(file);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(URL.createObjectURL(file));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // 1. Basic Validation
    if (moment(formData.startTime, "HH:mm").isSameOrAfter(moment(formData.endTime, "HH:mm"))) {
      return setError("Theory Class: End time must be later than start time.");
    }

    const dateDay = moment(formData.firstSessionDate).format("dddd");
    if (formData.firstSessionDate && dateDay !== formData.day) {
      return setError(`Date conflict: ${formData.firstSessionDate} is a ${dateDay}, but you selected ${formData.day}.`);
    }

    // 2. Variants Validation (if checked)
    if (formData.autoCreateVariants && formData.type === 'theory') {
        if (moment(formData.revisionStartTime, "HH:mm").isSameOrAfter(moment(formData.revisionEndTime, "HH:mm"))) {
            return setError("Revision Class: End time must be later than start time.");
        }
        if (moment(formData.paperStartTime, "HH:mm").isSameOrAfter(moment(formData.paperEndTime, "HH:mm"))) {
            return setError("Paper Class: End time must be later than start time.");
        }
        // Optional: Check for obvious overlaps (Basic check)
        if(formData.revisionDay === formData.paperDay && formData.revisionStartTime === formData.paperStartTime) {
             return setError("Revision and Paper classes cannot start at the exact same time on the same day.");
        }
    }

    setIsSaving(true);
    try {
      const payload: CreateClassPayload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        price: Number(formData.price) || 0,
        batch: formData.batch,
        type: formData.type as any,
        level: formData.level as any,
        recurrence: formData.recurrence as any,
        firstSessionDate: formData.firstSessionDate,
        totalSessions: Number(formData.totalSessions),
        sessionDurationMinutes: Number(formData.sessionDurationMinutes),
        timeSchedules: [{
          day: DAY_INDEX[formData.day],
          startTime: formData.startTime,
          endTime: formData.endTime,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        }],
        tags: formData.tags.split(",").map(t => t.trim()).filter(Boolean),
        coverImage: selectedImage || null,
        
        // --- NEW FIELDS IN PAYLOAD ---
        autoCreateVariants: formData.autoCreateVariants,
        revisionDay: formData.autoCreateVariants ? DAY_INDEX[formData.revisionDay] : undefined,
        revisionStartTime: formData.autoCreateVariants ? formData.revisionStartTime : undefined,
        revisionEndTime: formData.autoCreateVariants ? formData.revisionEndTime : undefined,
        revisionPrice: formData.autoCreateVariants ? Number(formData.revisionPrice) : undefined,
        
        paperDay: formData.autoCreateVariants ? DAY_INDEX[formData.paperDay] : undefined,
        paperStartTime: formData.autoCreateVariants ? formData.paperStartTime : undefined,
        paperEndTime: formData.autoCreateVariants ? formData.paperEndTime : undefined,
        paperPrice: formData.autoCreateVariants ? Number(formData.paperPrice) : undefined,

      };

      await ClassService.createClass(payload);
      navigate("/admin/classes");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Internal server error occurred.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
      <div className="max-w-4xl mx-auto space-y-6 pb-28 md:pb-24">
        
        {/* Header */}
        <header className="space-y-2 px-1">
          <button onClick={() => navigate(-1)} className="flex items-center text-[10px] md:text-xs font-bold text-gray-400 hover:text-brand-cerulean transition-all uppercase tracking-[0.2em]">
            <ArrowLeftIcon className="w-3 h-3 md:w-4 md:h-4 mr-2 stroke-[3px]" /> Back to Curriculum
          </button>
          <h1 className="text-xl md:text-2xl font-semibold text-brand-prussian tracking-tight">Create Academic Module</h1>
        </header>

        {error && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-xs font-medium flex items-center gap-2">
            <InformationCircleIcon className="w-4 h-4 shrink-0" /> {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <div className="lg:col-span-2 space-y-6">
            <Section title="Module Identity" icon={<AcademicCapIcon className="w-5 h-5"/>}>
              <div className="space-y-4">
                <Input label="Module Name" name="name" value={formData.name} onChange={handleChange} required placeholder="e.g. Revision: Financial Accounting" />
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Select label="Module Type" name="type" value={formData.type} onChange={handleChange}>
                    <option value="theory">Theory Class</option>
                    <option value="revision">Revision Class</option>
                    <option value="paper">Paper Discussion</option>
                  </Select>
                  <Select label="Academic Level" name="level" value={formData.level} onChange={handleChange}>
                    <option value="advanced">Advanced Level</option>
                    <option value="ordinary">Ordinary Level</option>
                    <option value="general">General</option>
                  </Select>
                </div>

                {/* --- AUTO CREATE CHECKBOX --- */}
                {formData.type === "theory" && (
                    <div className="flex items-start gap-3 p-4 bg-blue-50/50 rounded-xl border border-blue-100 transition-all">
                        <div className="flex items-center h-5">
                            <input
                                id="autoCreateVariants"
                                name="autoCreateVariants"
                                type="checkbox"
                                checked={formData.autoCreateVariants}
                                onChange={handleChange}
                                className="w-4 h-4 text-brand-cerulean border-gray-300 rounded focus:ring-brand-cerulean cursor-pointer"
                            />
                        </div>
                        <div className="ml-1">
                            <label htmlFor="autoCreateVariants" className="text-sm font-bold text-brand-prussian cursor-pointer select-none">
                                Auto-create Revision & Paper Classes
                            </label>
                            <p className="text-gray-500 text-[11px] mt-1 leading-snug">
                                Enable this to automatically generate "Revision" and "Paper" classes linked to this Theory class.
                            </p>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Select label="Assigned Batch" name="batch" value={formData.batch} onChange={handleChange} required>
                    <option value="">{loadingBatches ? "Syncing..." : "Select Batch"}</option>
                    {batches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
                  </Select>
                  <Input label="Tags (SEO)" name="tags" value={formData.tags} onChange={handleChange} placeholder="comma, separated" />
                </div>
                <Textarea label="Public Description" name="description" value={formData.description} onChange={handleChange} required rows={3} />
              </div>
            </Section>

            {/* --- PRIMARY SCHEDULE --- */}
            <Section title="Logistics & Pricing" icon={<ClockIcon className="w-5 h-5"/>}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="relative">
                  <Input label="Tuition Fee (LKR)" name="price" type="number" value={formData.price} onChange={handleChange} placeholder="0.00" />
                  <CurrencyDollarIcon className="absolute right-4 top-9 w-4 h-4 text-gray-300" />
                </div>
                
                {/* Primary Day/Time */}
                <div className="sm:col-span-2 grid grid-cols-3 gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
                    <div className="col-span-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Theory Schedule (Primary)</div>
                    <Select label="Day" name="day" value={formData.day} onChange={handleChange} className="bg-white">
                        {Object.keys(DAY_INDEX).map(d => <option key={d} value={d}>{d}</option>)}
                    </Select>
                    <Input label="Start" name="startTime" type="time" value={formData.startTime} onChange={handleChange} className="bg-white" />
                    <Input label="End" name="endTime" type="time" value={formData.endTime} onChange={handleChange} className="bg-white" />
                </div>

                <div className="relative">
                    <Input label="Total Sessions" name="totalSessions" type="number" value={formData.totalSessions} onChange={handleChange} />
                    <HashtagIcon className="absolute right-4 top-9 w-4 h-4 text-gray-300" />
                </div>
                <div className="relative">
                    <Input label="Duration (Mins)" name="sessionDurationMinutes" type="number" value={formData.sessionDurationMinutes} onChange={handleChange} />
                    <ClockIcon className="absolute right-4 top-9 w-4 h-4 text-gray-300" />
                </div>

                <Input label="Commencement Date" name="firstSessionDate" type="date" value={formData.firstSessionDate} onChange={handleChange} />
                <Select label="Recurrence" name="recurrence" value={formData.recurrence} onChange={handleChange}>
                  <option value="weekly">Every Week</option>
                  <option value="daily">Daily</option>
                  <option value="none">One-time Event</option>
                </Select>
              </div>
            </Section>

            {/* --- VARIANT SCHEDULES (CONDITIONAL) --- */}
            {formData.autoCreateVariants && formData.type === 'theory' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <Section title="Variant Details" icon={<CalendarDaysIcon className="w-5 h-5"/>}>
                        <div className="space-y-6">
                            
                            {/* --- REVISION BLOCK --- */}
                            <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100 space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Revision Class</span>
                                </div>
                                
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    {/* Price Input */}
                                    <div className="relative">
                                        <Input 
                                            label="Revision Fee (LKR)" 
                                            name="revisionPrice" 
                                            type="number" 
                                            value={formData.revisionPrice} 
                                            onChange={handleChange} 
                                            placeholder={formData.price} // Show Theory price as hint
                                            className="bg-white border-indigo-100 focus:border-indigo-300"
                                        />
                                        <CurrencyDollarIcon className="absolute right-4 top-9 w-4 h-4 text-gray-300" />
                                    </div>

                                    {/* Schedule Inputs */}
                                    <Select label="Day" name="revisionDay" value={formData.revisionDay} onChange={handleChange} className="bg-white border-indigo-100">
                                        {Object.keys(DAY_INDEX).map(d => <option key={d} value={d}>{d}</option>)}
                                    </Select>
                                    <div className="flex gap-2">
                                        <Input label="Start" name="revisionStartTime" type="time" value={formData.revisionStartTime} onChange={handleChange} className="bg-white border-indigo-100" />
                                        <Input label="End" name="revisionEndTime" type="time" value={formData.revisionEndTime} onChange={handleChange} className="bg-white border-indigo-100" />
                                    </div>
                                </div>
                            </div>

                            {/* --- PAPER BLOCK --- */}
                            <div className="p-4 bg-orange-50/50 rounded-xl border border-orange-100 space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-bold text-orange-400 uppercase tracking-widest">Paper Class</span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    {/* Price Input */}
                                    <div className="relative">
                                        <Input 
                                            label="Paper Fee (LKR)" 
                                            name="paperPrice" 
                                            type="number" 
                                            value={formData.paperPrice} 
                                            onChange={handleChange} 
                                            placeholder={formData.price} // Show Theory price as hint
                                            className="bg-white border-orange-100 focus:border-orange-300"
                                        />
                                        <CurrencyDollarIcon className="absolute right-4 top-9 w-4 h-4 text-gray-300" />
                                    </div>

                                    {/* Schedule Inputs */}
                                    <Select label="Day" name="paperDay" value={formData.paperDay} onChange={handleChange} className="bg-white border-orange-100">
                                        {Object.keys(DAY_INDEX).map(d => <option key={d} value={d}>{d}</option>)}
                                    </Select>
                                    <div className="flex gap-2">
                                        <Input label="Start" name="paperStartTime" type="time" value={formData.paperStartTime} onChange={handleChange} className="bg-white border-orange-100" />
                                        <Input label="End" name="paperEndTime" type="time" value={formData.paperEndTime} onChange={handleChange} className="bg-white border-orange-100" />
                                    </div>
                                </div>
                            </div>

                        </div>
                    </Section>
                </motion.div>
            )}
          </div>

          <div className="space-y-6">
            <Section title="Cover Media" icon={<PhotoIcon className="w-5 h-5"/>}>
               {/* ... (Keep Image upload same as before) ... */}
               <div className="group relative aspect-video bg-brand-aliceBlue/50 rounded-xl border border-dashed border-gray-200 overflow-hidden hover:border-brand-cerulean transition-all cursor-pointer">
                {imagePreview ? (
                  <img src={imagePreview} className="w-full h-full object-cover" alt="Preview" />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center p-4">
                    <PhotoIcon className="w-8 h-8 text-gray-300 mb-2" />
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Upload Banner</span>
                  </div>
                )}
                <input type="file" accept="image/*" onChange={handleImageChange} className="absolute inset-0 opacity-0 cursor-pointer" />
              </div>
            </Section>

            {/* Desktop Actions */}
            <div className="hidden lg:flex flex-col gap-2">
              <button type="submit" disabled={isSaving} className="w-full bg-brand-prussian hover:bg-brand-cerulean text-white py-3.5 rounded-xl text-sm font-semibold transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50">
                {isSaving ? "Creating..." : <><CheckCircleIcon className="w-4 h-4" /> Initialize Module</>}
              </button>
              <button type="button" onClick={() => navigate(-1)} className="w-full bg-white border border-gray-100 text-gray-400 py-3.5 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-all">
                Cancel
              </button>
            </div>
          </div>

          {/* Sticky Mobile Actions */}
          <div className="fixed bottom-20 left-0 right-0 p-4 bg-white border-t border-gray-100 lg:hidden flex gap-3 z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
             {/* ... Keep same ... */}
             <button type="button" onClick={() => navigate(-1)} className="flex-1 py-3.5 rounded-xl text-xs font-bold text-gray-500 bg-gray-50 hover:bg-gray-100">Cancel</button>
             <button type="submit" disabled={isSaving} className="flex-[2] bg-brand-prussian hover:bg-brand-cerulean text-white py-3.5 rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50">
               {isSaving ? "Creating..." : "Create Module"}
             </button>
          </div>

        </form>
      </div>
  );
}

// ... Internal Components (Section, Input, Select, Textarea) same as previous ...
const Section = ({ title, icon, children }: any) => (
  <div className="bg-white p-5 md:p-6 rounded-2xl border border-brand-aliceBlue shadow-sm">
    <div className="flex items-center gap-2 mb-5 md:mb-6 border-b border-brand-aliceBlue pb-4">
      <div className="text-brand-cerulean p-1.5 bg-brand-aliceBlue rounded-lg">{icon}</div>
      <h2 className="text-xs font-bold text-brand-prussian uppercase tracking-widest">{title}</h2>
    </div>
    {children}
  </div>
);
const Input = ({ label, className, ...props }: any) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">{label}</label>
    <input {...props} className={`w-full bg-brand-aliceBlue/30 border border-brand-aliceBlue focus:border-brand-cerulean focus:bg-white rounded-lg px-4 py-3 md:py-2.5 outline-none transition-all text-sm font-medium placeholder:text-gray-300 ${className || ''}`} />
  </div>
);
const Select = ({ label, children, className, ...props }: any) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">{label}</label>
    <select {...props} className={`w-full bg-brand-aliceBlue/30 border border-brand-aliceBlue focus:border-brand-cerulean focus:bg-white rounded-lg px-4 py-3 md:py-2.5 outline-none transition-all text-sm font-medium cursor-pointer ${className || ''}`}>
      {children}
    </select>
  </div>
);
const Textarea = ({ label, ...props }: any) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">{label}</label>
    <textarea {...props} className="w-full bg-brand-aliceBlue/30 border border-brand-aliceBlue focus:border-brand-cerulean focus:bg-white rounded-lg px-4 py-3 md:py-2.5 outline-none transition-all text-sm font-medium resize-none" />
  </div>
);