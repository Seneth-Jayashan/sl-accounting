import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import moment from "moment";
import { motion } from "framer-motion";
import ClassService from "../../../services/ClassService";
import SessionService, { type CreateSessionPayload } from "../../../services/SessionService";

import { 
  ArrowLeftIcon,  
  ClockIcon, 
  VideoCameraIcon,
  PencilSquareIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  AcademicCapIcon
} from "@heroicons/react/24/outline";

interface ClassOption {
  _id: string;
  name: string;
  sessionDurationMinutes?: number;
}

export default function AddSessionPage() {
  const navigate = useNavigate();
  
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    classId: "",
    date: moment().format("YYYY-MM-DD"),
    time: "18:00",
    duration: 120,
    title: "",
    notes: "",
    createZoom: true,
  });

  const fetchClasses = useCallback(async () => {
    setLoading(true);
    try {
      const res = await ClassService.getAllClasses();
      const dataArray = (res as any).classes || (res as any).class || (Array.isArray(res) ? res : []);
      setClasses(dataArray);
    } catch (err) {
      setError("Failed to load available classes.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchClasses(); }, [fetchClasses]);

  const handleClassChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const clsId = e.target.value;
    const selectedClass = classes.find(c => c._id === clsId);
    setFormData(prev => ({
        ...prev,
        classId: clsId,
        duration: selectedClass?.sessionDurationMinutes || 120 
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.classId || !formData.date) return setError("Required fields missing.");

    setSubmitting(true);
    setError(null);

    try {
      // Create a unified ISO timestamp for the backend
      const startDateTime = moment(`${formData.date} ${formData.time}`, "YYYY-MM-DD HH:mm").toDate();

      const payload: CreateSessionPayload = {
        startAt: startDateTime,
        durationMinutes: Number(formData.duration),
        title: formData.title.trim() || undefined,
        notes: formData.notes.trim() || undefined,
        skipZoom: !formData.createZoom,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      };

      await SessionService.createSession(formData.classId, payload);
      navigate("/admin/sessions");
    } catch (err: any) {
      setError(err.response?.data?.message || "Internal scheduling failure.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
      <div className="max-w-3xl mx-auto space-y-6 pb-24 p-4 lg:p-0">
        
        {/* Navigation Header */}
        <header className="flex flex-col gap-2 pt-4">
          <button onClick={() => navigate(-1)} className="flex items-center text-[10px] font-bold text-gray-400 hover:text-brand-cerulean transition-all uppercase tracking-widest group w-fit">
            <ArrowLeftIcon className="w-3 h-3 mr-2 stroke-[3px] group-hover:-translate-x-1 transition-transform" /> 
            Back to Schedule
          </button>
          <h1 className="text-3xl font-semibold text-brand-prussian tracking-tight">Manual Session Entry</h1>
        </header>

        {error && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-xs font-medium flex items-center gap-2">
            <InformationCircleIcon className="w-4 h-4" /> {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in duration-700">
          
          {/* Section: Context */}
          <FormSection title="Module Context" icon={<AcademicCapIcon className="w-4 h-4" />}>
             <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Class Module</label>
                <select
                  name="classId"
                  value={formData.classId}
                  onChange={handleClassChange}
                  className="w-full bg-brand-aliceBlue/30 border border-brand-aliceBlue rounded-xl p-3.5 text-sm font-medium focus:border-brand-cerulean outline-none transition-all cursor-pointer appearance-none"
                  required
                >
                  <option value="">{loading ? "Syncing modules..." : "Select Target Class"}</option>
                  {classes.map((cls) => (
                    <option key={cls._id} value={cls._id}>{cls.name}</option>
                  ))}
                </select>
             </div>
          </FormSection>

          {/* Section: Timeline */}
          <FormSection title="Timeline & Duration" icon={<ClockIcon className="w-4 h-4" />}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
               <Input label="Session Date" type="date" name="date" value={formData.date} onChange={(e: any) => setFormData({...formData, date: e.target.value})} required />
               <Input label="Start Time" type="time" name="time" value={formData.time} onChange={(e: any) => setFormData({...formData, time: e.target.value})} required />
               <Input label="Minutes" type="number" name="duration" value={formData.duration} onChange={(e: any) => setFormData({...formData, duration: e.target.value})} min="15" />
            </div>
          </FormSection>

          {/* Section: Curriculum Details */}
          <FormSection title="Content Detail" icon={<PencilSquareIcon className="w-4 h-4" />}>
            <div className="space-y-4">
               <Input label="Session Topic (Optional)" type="text" placeholder="e.g. Unit 05: Buffer Solutions" name="title" value={formData.title} onChange={(e: any) => setFormData({...formData, title: e.target.value})} />
               <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Internal Notes</label>
                  <textarea
                    rows={3}
                    placeholder="Instructions or materials for students..."
                    className="w-full bg-brand-aliceBlue/30 border border-brand-aliceBlue rounded-xl p-3.5 text-sm font-medium focus:border-brand-cerulean outline-none transition-all resize-none"
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  />
               </div>
            </div>
          </FormSection>

          {/* Zoom Integration Toggle */}
          <div className="bg-white border border-brand-aliceBlue p-6 rounded-2xl flex items-center justify-between shadow-sm">
             <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl transition-colors ${formData.createZoom ? 'bg-brand-cerulean text-white' : 'bg-gray-100 text-gray-400'}`}>
                    <VideoCameraIcon className="w-6 h-6 stroke-[2px]" />
                </div>
                <div>
                   <p className="text-sm font-semibold text-brand-prussian">Live Meeting Sync</p>
                   <p className="text-[11px] text-gray-400 font-medium">Provision a new Zoom meeting ID for this entry.</p>
                </div>
             </div>
             <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={formData.createZoom} onChange={(e) => setFormData(prev => ({ ...prev, createZoom: e.target.checked }))} />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-cerulean"></div>
             </label>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-brand-prussian hover:bg-brand-cerulean text-white py-4 rounded-2xl text-sm font-bold uppercase tracking-widest transition-all shadow-lg active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitting ? <ArrowLeftIcon className="w-5 h-5 animate-spin" /> : <><CheckCircleIcon className="w-5 h-5" /> Confirm Schedule</>}
          </button>
        </form>
      </div>
  );
}

// --- Smooth UI Components ---

const FormSection = ({ title, icon, children }: any) => (
  <div className="bg-white p-6 rounded-2xl border border-brand-aliceBlue shadow-sm">
    <div className="flex items-center gap-2 mb-6 border-b border-brand-aliceBlue pb-4">
      <div className="text-brand-cerulean bg-brand-aliceBlue p-1.5 rounded-lg">{icon}</div>
      <h2 className="text-[11px] font-bold text-brand-prussian uppercase tracking-widest">{title}</h2>
    </div>
    {children}
  </div>
);

const Input = ({ label, ...props }: any) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">{label}</label>
    <input {...props} className="w-full bg-brand-aliceBlue/30 border border-brand-aliceBlue rounded-xl p-3.5 text-sm font-medium focus:border-brand-cerulean focus:bg-white outline-none transition-all" />
  </div>
);

