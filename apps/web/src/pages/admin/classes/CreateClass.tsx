import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import moment from "moment";
import { motion } from "framer-motion";
import DashboardLayout from "../../../layouts/DashboardLayout";
import SidebarAdmin from "../../../components/sidebar/SidebarAdmin";
import BottomNavAdmin from "../../../components/bottomNavbar/BottomNavAdmin";
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
  TagIcon,
  HashtagIcon
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
  totalSessions: "4", // Added as string for input handling
  sessionDurationMinutes: "120", // Added as string for input handling
  level: "advanced",
  tags: "",
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
    setFormData(prev => ({ ...prev, [name]: value }));
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

    // Logic Validations
    if (moment(formData.startTime, "HH:mm").isSameOrAfter(moment(formData.endTime, "HH:mm"))) {
      return setError("The session end time must be later than the start time.");
    }

    const dateDay = moment(formData.firstSessionDate).format("dddd");
    if (formData.firstSessionDate && dateDay !== formData.day) {
      return setError(`Date conflict: ${formData.firstSessionDate} is a ${dateDay}, but you selected ${formData.day}.`);
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
        // --- CRITICAL FIX: Explicitly include these numeric values ---
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
    <DashboardLayout Sidebar={SidebarAdmin} BottomNav={BottomNavAdmin} rightSidebar={<SidebarTips />}>
      <div className="max-w-4xl mx-auto space-y-6 pb-24">
        
        <header className="space-y-2">
          <button onClick={() => navigate(-1)} className="flex items-center text-[10px] font-bold text-gray-400 hover:text-brand-cerulean transition-all uppercase tracking-[0.2em]">
            <ArrowLeftIcon className="w-3 h-3 mr-2 stroke-[3px]" /> Back to Curriculum
          </button>
          <h1 className="text-2xl font-semibold text-brand-prussian tracking-tight">Create Academic Module</h1>
        </header>

        {error && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-xs font-medium flex items-center gap-2">
            <InformationCircleIcon className="w-4 h-4" /> {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <div className="lg:col-span-2 space-y-6">
            <Section title="Module Identity" icon={<AcademicCapIcon />}>
              <div className="space-y-4">
                <Input label="Module Name" name="name" value={formData.name} onChange={handleChange} required placeholder="e.g. Revision: Financial Accounting" />
                
                <div className="grid grid-cols-2 gap-4">
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

                <div className="grid grid-cols-2 gap-4">
                  <Select label="Assigned Batch" name="batch" value={formData.batch} onChange={handleChange} required>
                    <option value="">{loadingBatches ? "Syncing..." : "Select Batch"}</option>
                    {batches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
                  </Select>
                  <Input label="Tags (SEO)" name="tags" value={formData.tags} onChange={handleChange} placeholder="comma, separated" />
                </div>
                <Textarea label="Public Description" name="description" value={formData.description} onChange={handleChange} required rows={3} />
              </div>
            </Section>

            <Section title="Logistics & Pricing" icon={<ClockIcon />}>
              <div className="grid grid-cols-2 gap-4">
                <div className="relative">
                  <Input label="Tuition Fee (LKR)" name="price" type="number" value={formData.price} onChange={handleChange} placeholder="0.00" />
                  <CurrencyDollarIcon className="absolute right-4 top-9 w-4 h-4 text-gray-300" />
                </div>
                <Select label="Schedule Day" name="day" value={formData.day} onChange={handleChange}>
                  {Object.keys(DAY_INDEX).map(d => <option key={d} value={d}>{d}</option>)}
                </Select>
                <Input label="Session Start" name="startTime" type="time" value={formData.startTime} onChange={handleChange} />
                <Input label="Session End" name="endTime" type="time" value={formData.endTime} onChange={handleChange} />
                
                {/* --- NEW INPUTS: Sessions & Duration --- */}
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
          </div>

          <div className="space-y-6">
            <Section title="Cover Media" icon={<PhotoIcon />}>
              <div className="group relative aspect-video bg-brand-aliceBlue/50 rounded-xl border border-dashed border-gray-200 overflow-hidden hover:border-brand-cerulean transition-all cursor-pointer">
                {imagePreview ? (
                  <img src={imagePreview} className="w-full h-full object-cover" alt="Preview" />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center p-4">
                    <PhotoIcon className="w-6 h-6 text-gray-300 mb-2" />
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Upload Banner</span>
                  </div>
                )}
                <input type="file" accept="image/*" onChange={handleImageChange} className="absolute inset-0 opacity-0 cursor-pointer" />
              </div>
            </Section>

            <div className="flex flex-col gap-2">
              <button type="submit" disabled={isSaving} className="w-full bg-brand-prussian hover:bg-brand-cerulean text-white py-3.5 rounded-xl text-sm font-semibold transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50">
                {isSaving ? "Creating..." : <><CheckCircleIcon className="w-4 h-4" /> Initialize Module</>}
              </button>
              <button type="button" onClick={() => navigate(-1)} className="w-full bg-white border border-gray-100 text-gray-400 py-3.5 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-all">
                Cancel
              </button>
            </div>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}

// --- Internal UI Components ---

const Section = ({ title, icon, children }: any) => (
  <div className="bg-white p-6 rounded-2xl border border-brand-aliceBlue shadow-sm">
    <div className="flex items-center gap-2 mb-6 border-b border-brand-aliceBlue pb-4">
      <div className="text-brand-cerulean p-1.5 bg-brand-aliceBlue rounded-lg">{icon}</div>
      <h2 className="text-xs font-bold text-brand-prussian uppercase tracking-widest">{title}</h2>
    </div>
    {children}
  </div>
);

const Input = ({ label, ...props }: any) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">{label}</label>
    <input {...props} className="w-full bg-brand-aliceBlue/30 border border-brand-aliceBlue focus:border-brand-cerulean focus:bg-white rounded-lg px-4 py-2.5 outline-none transition-all text-sm font-medium" />
  </div>
);

const Select = ({ label, children, ...props }: any) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">{label}</label>
    <select {...props} className="w-full bg-brand-aliceBlue/30 border border-brand-aliceBlue focus:border-brand-cerulean focus:bg-white rounded-lg px-4 py-2.5 outline-none transition-all text-sm font-medium cursor-pointer">
      {children}
    </select>
  </div>
);

const Textarea = ({ label, ...props }: any) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">{label}</label>
    <textarea {...props} className="w-full bg-brand-aliceBlue/30 border border-brand-aliceBlue focus:border-brand-cerulean focus:bg-white rounded-lg px-4 py-2.5 outline-none transition-all text-sm font-medium resize-none" />
  </div>
);

const SidebarTips = () => (
  <div className="bg-brand-prussian text-white p-6 rounded-2xl shadow-lg border border-white/5">
    <div className="flex items-center gap-2 mb-4">
      <TagIcon className="w-4 h-4 text-brand-jasmine" />
      <h3 className="text-brand-jasmine font-bold text-[10px] uppercase tracking-widest">Quick Guide</h3>
    </div>
    <div className="space-y-4 text-[11px] font-medium text-brand-aliceBlue/60 leading-relaxed">
      <p>Ensure <span className="text-white">Total Sessions</span> matches the number of live meetings planned.</p>
      <p>Recommended <span className="text-white">Duration</span> for Revision is typically 120-180 minutes.</p>
      <p>Commencement date will trigger automated session creation in the database.</p>
    </div>
  </div>
);