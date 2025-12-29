import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import moment from "moment";
import ClassService from "../../../services/ClassService";
import BatchService from "../../../services/BatchService";
import {
  ArrowLeftIcon,
  PhotoIcon,
  CurrencyDollarIcon,
  ClockIcon,
  AcademicCapIcon,
  CheckCircleIcon,
  ArrowPathIcon
} from "@heroicons/react/24/outline";

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    if (moment(formData.startTime, "HH:mm").isSameOrAfter(moment(formData.endTime, "HH:mm"))) {
      return setError("The session end time must be later than the start time.");
    }

    setIsSaving(true);
    setError(null);

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
      await ClassService.updateClass(id, payload as any);
      navigate(`/admin/classes`); 
    } catch (err: any) {
      setError(err.response?.data?.message || "Internal update failure.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <LoadingSkeleton />;

  return (
      <div className="max-w-5xl mx-auto space-y-6 pb-28 md:pb-24 p-4 md:p-6 animate-in fade-in duration-500">
        
        {/* Header */}
        <header className="flex flex-col gap-2">
          <button onClick={() => navigate(-1)} className="flex items-center text-[10px] md:text-xs font-bold text-gray-400 hover:text-brand-cerulean transition-all uppercase tracking-widest">
            <ArrowLeftIcon className="w-3 h-3 md:w-4 md:h-4 mr-2 stroke-[3px]" /> Discard Changes
          </button>
          <h1 className="text-2xl md:text-3xl font-semibold text-brand-prussian tracking-tight">Modify Class Module</h1>
        </header>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 text-sm font-medium">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          
          <div className="lg:col-span-2 space-y-6">
            <Section title="Identity & Curriculum" icon={<AcademicCapIcon className="w-5 h-5"/>}>
              <div className="space-y-4">
                <Input label="Class Name" name="name" value={formData.name} 
                  onChange={(e: any) => setFormData({...formData, name: e.target.value})} required />
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Select label="Batch Intake" name="batch" value={formData.batch} 
                    onChange={(e: any) => setFormData({...formData, batch: e.target.value})}>
                    {batches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
                  </Select>
                  <Select label="Module Type" name="type" value={formData.type}
                    onChange={(e: any) => setFormData({...formData, type: e.target.value})}>
                    <option value="theory">Theory</option>
                    <option value="revision">Revision</option>
                    <option value="paper">Paper Discussion</option>
                  </Select>
                </div>

                <Textarea label="Course Outline" name="description" value={formData.description} 
                  onChange={(e: any) => setFormData({...formData, description: e.target.value})} rows={4} />
              </div>
            </Section>

            <Section title="Timing & Investment" icon={<ClockIcon className="w-5 h-5"/>}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="relative">
                  <Input label="Monthly Fee (LKR)" name="price" type="number" value={formData.price} 
                    onChange={(e: any) => setFormData({...formData, price: e.target.value})} />
                  <CurrencyDollarIcon className="absolute right-4 top-9 w-4 h-4 text-gray-300" />
                </div>
                <Select label="Weekly Schedule" name="day" value={formData.day} 
                  onChange={(e: any) => setFormData({...formData, day: e.target.value})}>
                  {INDEX_TO_DAY.map(d => <option key={d} value={d}>{d}</option>)}
                </Select>
                <Input label="Starts At" name="startTime" type="time" value={formData.startTime} 
                  onChange={(e: any) => setFormData({...formData, startTime: e.target.value})} />
                <Input label="Ends At" name="endTime" type="time" value={formData.endTime} 
                  onChange={(e: any) => setFormData({...formData, endTime: e.target.value})} />
              </div>
            </Section>
          </div>

          <aside className="space-y-6">
            <Section title="Banner Media" icon={<PhotoIcon className="w-5 h-5"/>}>
              <div className="group relative aspect-video bg-brand-aliceBlue/50 rounded-2xl border border-dashed border-gray-200 overflow-hidden hover:border-brand-cerulean transition-all">
                {imagePreview ? (
                  <img src={imagePreview} className="w-full h-full object-cover" alt="Preview" />
                ) : currentImageUrl ? (
                  <img src={currentImageUrl} className="w-full h-full object-cover" alt="Current" />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400">
                      <PhotoIcon className="w-8 h-8 opacity-20" />
                      <p className="text-[10px] uppercase font-bold tracking-widest mt-2">No Cover Image</p>
                  </div>
                )}
                <input type="file" accept="image/*" onChange={handleImageChange} className="absolute inset-0 opacity-0 cursor-pointer" />
              </div>
            </Section>

            <div className="bg-brand-prussian p-6 rounded-3xl text-white shadow-xl shadow-brand-prussian/20">
              <h3 className="text-xs font-bold uppercase tracking-widest text-brand-jasmine mb-4">Settings</h3>
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className={`w-10 h-6 rounded-full transition-colors relative ${formData.isPublished ? 'bg-brand-cerulean' : 'bg-white/10'}`}>
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${formData.isPublished ? 'left-5' : 'left-1'}`} />
                </div>
                <input type="checkbox" className="hidden" checked={formData.isPublished} 
                  onChange={(e) => setFormData({...formData, isPublished: e.target.checked})} />
                <span className="text-xs font-semibold uppercase tracking-wider">Visible to Public</span>
              </label>
            </div>

            {/* Sticky Action Button on Mobile */}
            <div className="fixed bottom-20 left-0 right-0 p-4 bg-white border-t border-gray-200 lg:static lg:bg-transparent lg:border-none lg:p-0 z-50">
                <button type="submit" disabled={isSaving} className="w-full bg-brand-cerulean hover:bg-brand-prussian text-white py-4 rounded-2xl font-bold transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50">
                {isSaving ? <ArrowPathIcon className="w-5 h-5 animate-spin" /> : <><CheckCircleIcon className="w-5 h-5" /> Commit Changes</>}
                </button>
            </div>
          </aside>
        </form>
      </div>
  );
}

// --- Smooth UI Sub-components ---

const Section = ({ title, icon, children }: any) => (
  <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-brand-aliceBlue shadow-sm">
    <div className="flex items-center gap-3 mb-6 md:mb-8 border-b border-brand-aliceBlue pb-4">
      <div className="text-brand-cerulean p-2 bg-brand-aliceBlue rounded-xl">{icon}</div>
      <h2 className="text-xs font-bold text-brand-prussian uppercase tracking-widest">{title}</h2>
    </div>
    {children}
  </div>
);

const Input = ({ label, ...props }: any) => (
  <div className="flex flex-col gap-2">
    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.15em] ml-1">{label}</label>
    <input {...props} className="w-full bg-brand-aliceBlue/20 border border-brand-aliceBlue focus:border-brand-cerulean focus:bg-white rounded-xl px-4 py-3 outline-none transition-all text-sm font-medium" />
  </div>
);

const Select = ({ label, children, ...props }: any) => (
  <div className="flex flex-col gap-2">
    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.15em] ml-1">{label}</label>
    <select {...props} className="w-full bg-brand-aliceBlue/20 border border-brand-aliceBlue focus:border-brand-cerulean focus:bg-white rounded-xl px-4 py-3 outline-none transition-all text-sm font-medium cursor-pointer">
      {children}
    </select>
  </div>
);

const Textarea = ({ label, ...props }: any) => (
  <div className="flex flex-col gap-2">
    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.15em] ml-1">{label}</label>
    <textarea {...props} className="w-full bg-brand-aliceBlue/20 border border-brand-aliceBlue focus:border-brand-cerulean focus:bg-white rounded-xl px-4 py-3 outline-none transition-all text-sm font-medium resize-none" />
  </div>
);

const LoadingSkeleton = () => (
    <div className="flex flex-col h-[70vh] items-center justify-center space-y-4">
      <ArrowPathIcon className="w-12 h-12 text-brand-cerulean animate-spin" />
      <p className="text-brand-prussian font-bold uppercase tracking-widest animate-pulse">Synchronizing Curriculum...</p>
    </div>
);