import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import moment from "moment";
import { motion, AnimatePresence } from "framer-motion";
import ClassService, { type UpdateClassPayload } from "../../../services/ClassService";
import BatchService from "../../../services/BatchService";
import {
  ArrowLeftIcon,
  PhotoIcon,
  CurrencyDollarIcon,
  ClockIcon,
  AcademicCapIcon,
  InformationCircleIcon,
  TagIcon,
  SparklesIcon,
  EyeIcon,
  XMarkIcon,
  LinkIcon
} from "@heroicons/react/24/outline";

// --- CONSTANTS ---
const DAY_INDEX: Record<string, number> = {
  Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6,
};

const INDEX_TO_DAY: string[] = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// Use environment variable for image base URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

const INITIAL_FORM = {
  name: "",
  description: "",
  price: "",
  batch: "",
  type: "theory",
  parentTheoryClass: "",
  day: "Saturday",
  startTime: "08:00",
  endTime: "10:00",
  firstSessionDate: "",
  recurrence: "weekly",
  totalSessions: "4", 
  sessionDurationMinutes: "120", 
  level: "advanced",
  tags: "",
  
  // Variant Flags
  createRevision: false,
  createPaper: false,

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

  // Bundle Prices
  bundlePriceRevision: "",
  bundlePricePaper: "",
  bundlePriceFull: "",
};

export default function UpdateClassPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [batches, setBatches] = useState<any[]>([]);
  const [theoryClasses, setTheoryClasses] = useState<any[]>([]);
  
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // --- 1. Fetch Data & Populate Form ---
  const fetchData = useCallback(async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      
      // Fetch Dependencies
      const [batchData, theories, classDataResponse] = await Promise.all([
          BatchService.getAllBatches(true),
          ClassService.getTheoryClasses(),
          ClassService.getClassById(id)
      ]);

      setBatches(batchData.batches || []);
      setTheoryClasses(theories || []);

      const cls: any = classDataResponse.class || classDataResponse;

      // Map Backend Data to Form State
      setFormData({
        name: cls.name,
        description: cls.description || "",
        price: String(cls.price),
        batch: typeof cls.batch === 'object' ? cls.batch._id : cls.batch,
        type: cls.type,
        parentTheoryClass: typeof cls.parentTheoryClass === 'object' ? cls.parentTheoryClass?._id : (cls.parentTheoryClass || ""),
        
        // Schedule (Main Class)
        day: cls.timeSchedules?.[0] ? INDEX_TO_DAY[cls.timeSchedules[0].day] : "Saturday",
        startTime: cls.timeSchedules?.[0]?.startTime || "08:00",
        endTime: cls.timeSchedules?.[0]?.endTime || "10:00",
        
        firstSessionDate: cls.firstSessionDate ? moment(cls.firstSessionDate).format("YYYY-MM-DD") : "",
        recurrence: cls.recurrence || "weekly",
        totalSessions: String(cls.totalSessions || 4),
        sessionDurationMinutes: String(cls.sessionDurationMinutes || 120),
        level: cls.level,
        tags: cls.tags ? cls.tags.join(", ") : "",

        // Variants (Check if linked classes exist)
        createRevision: !!cls.linkedRevisionClass,
        createPaper: !!cls.linkedPaperClass,

        // Revision Data (Unpack from linked object)
        revisionDay: cls.linkedRevisionClass?.timeSchedules?.[0] ? INDEX_TO_DAY[cls.linkedRevisionClass.timeSchedules[0].day] : "Sunday",
        revisionStartTime: cls.linkedRevisionClass?.timeSchedules?.[0]?.startTime || "08:00",
        revisionEndTime: cls.linkedRevisionClass?.timeSchedules?.[0]?.endTime || "10:00",
        revisionPrice: cls.linkedRevisionClass?.price ? String(cls.linkedRevisionClass.price) : "",

        // Paper Data (Unpack from linked object)
        paperDay: cls.linkedPaperClass?.timeSchedules?.[0] ? INDEX_TO_DAY[cls.linkedPaperClass.timeSchedules[0].day] : "Sunday",
        paperStartTime: cls.linkedPaperClass?.timeSchedules?.[0]?.startTime || "13:00",
        paperEndTime: cls.linkedPaperClass?.timeSchedules?.[0]?.endTime || "15:00",
        paperPrice: cls.linkedPaperClass?.price ? String(cls.linkedPaperClass.price) : "",

        // Bundle Prices
        bundlePriceRevision: cls.bundlePriceRevision ? String(cls.bundlePriceRevision) : "",
        bundlePricePaper: cls.bundlePricePaper ? String(cls.bundlePricePaper) : "",
        bundlePriceFull: cls.bundlePriceFull ? String(cls.bundlePriceFull) : "",
      });

      // Set Existing Image
      if (cls.coverImage) {
        // Ensure we handle absolute vs relative paths if needed
        const imgUrl = cls.coverImage.startsWith('http') ? cls.coverImage : `${API_BASE_URL}/${cls.coverImage}`;
        setImagePreview(imgUrl);
      }

    } catch (err) {
      console.error(err);
      setError("System was unable to load class details.");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Cleanup object URL on unmount
  useEffect(() => {
    return () => { 
      if (imagePreview && imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview); 
      }
    };
  }, [imagePreview]);

  // --- Handlers ---

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
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
    setImagePreview(URL.createObjectURL(file)); // This overrides the server URL
    setError(null);
  };

  const handlePreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Basic Validation
    if (moment(formData.startTime, "HH:mm").isSameOrAfter(moment(formData.endTime, "HH:mm"))) {
      return setError("End time must be later than start time.");
    }
    
    // Variant Validation
    if (formData.type === 'theory') {
        if (formData.createRevision && moment(formData.revisionStartTime, "HH:mm").isSameOrAfter(moment(formData.revisionEndTime, "HH:mm"))) {
            return setError("Revision Class: End time must be later than start time.");
        }
        if (formData.createPaper && moment(formData.paperStartTime, "HH:mm").isSameOrAfter(moment(formData.paperEndTime, "HH:mm"))) {
            return setError("Paper Class: End time must be later than start time.");
        }
    }

    setShowPreview(true);
  };

  const handleFinalSubmit = async () => {
    if (!id) return;
    setIsSaving(true);
    try {
      const payload: UpdateClassPayload = {
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
        
        // Update Schedule
        timeSchedules: [{
          day: DAY_INDEX[formData.day],
          startTime: formData.startTime,
          endTime: formData.endTime,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        }],
        
        tags: formData.tags.split(",").map(t => t.trim()).filter(Boolean),
        
        // Only attach image if a NEW one is selected
        coverImage: selectedImage || undefined,
        
        // Linking
        parentTheoryClass: (formData.type !== 'theory' && formData.parentTheoryClass) ? formData.parentTheoryClass : undefined,

        // Variants Logic (Theory Only)
        createRevision: formData.type === 'theory' ? formData.createRevision : undefined,
        createPaper: formData.type === 'theory' ? formData.createPaper : undefined,

        revisionDay: (formData.type === 'theory' && formData.createRevision) ? DAY_INDEX[formData.revisionDay] : undefined,
        revisionStartTime: (formData.type === 'theory' && formData.createRevision) ? formData.revisionStartTime : undefined,
        revisionEndTime: (formData.type === 'theory' && formData.createRevision) ? formData.revisionEndTime : undefined,
        revisionPrice: (formData.type === 'theory' && formData.createRevision) ? Number(formData.revisionPrice) : undefined,
        
        paperDay: (formData.type === 'theory' && formData.createPaper) ? DAY_INDEX[formData.paperDay] : undefined,
        paperStartTime: (formData.type === 'theory' && formData.createPaper) ? formData.paperStartTime : undefined,
        paperEndTime: (formData.type === 'theory' && formData.createPaper) ? formData.paperEndTime : undefined,
        paperPrice: (formData.type === 'theory' && formData.createPaper) ? Number(formData.paperPrice) : undefined,

        bundlePriceRevision: (formData.type === 'theory' && formData.createRevision) ? Number(formData.bundlePriceRevision) : undefined,
        bundlePricePaper: (formData.type === 'theory' && formData.createPaper) ? Number(formData.bundlePricePaper) : undefined,
        bundlePriceFull: (formData.type === 'theory' && formData.createRevision && formData.createPaper) ? Number(formData.bundlePriceFull) : undefined,
      };

      await ClassService.updateClass(id, payload);
      navigate("/admin/classes");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Internal server error occurred.");
      setShowPreview(false);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
        <div className="flex flex-col items-center justify-center h-screen text-brand-prussian">
            <div className="w-12 h-12 border-4 border-gray-200 border-t-brand-cerulean rounded-full animate-spin mb-4"></div>
            <p className="font-bold">Loading Class Details...</p>
        </div>
    );
  }

  return (
      <div className="max-w-3xl mx-auto space-y-8 pb-32 font-sans px-4 sm:px-6">
        
        <header className="flex flex-col gap-2 pt-6 border-b border-gray-100 pb-6">
          <button onClick={() => navigate(-1)} className="w-fit flex items-center text-xs font-bold text-gray-400 hover:text-brand-cerulean transition-colors uppercase tracking-widest">
            <ArrowLeftIcon className="w-3 h-3 mr-2 stroke-[3px]" /> Back to Curriculum
          </button>
          <div className="flex items-center gap-3">
             <h1 className="text-3xl font-bold text-brand-prussian tracking-tight">Update Module</h1>
             <span className="px-3 py-1 bg-brand-aliceBlue text-brand-cerulean text-xs font-bold rounded-full border border-blue-100">Editing</span>
          </div>
          <p className="text-gray-500 text-sm">Modify curriculum details, schedules, and bundle configurations.</p>
        </header>

        {error && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-red-50 border border-red-100 text-red-600 px-5 py-4 rounded-2xl text-sm font-medium flex items-center gap-3 shadow-sm">
            <InformationCircleIcon className="w-5 h-5 shrink-0" /> {error}
          </motion.div>
        )}

        <form onSubmit={handlePreSubmit} className="space-y-8">
            
            <Section title="Module Identity" icon={<AcademicCapIcon className="w-5 h-5"/>}>
              <div className="grid gap-5">
                <Input label="Module Name" name="name" value={formData.name} onChange={handleChange} required placeholder="e.g. 2026 Advanced Level Accounting" />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <Select label="Module Type" name="type" value={formData.type} onChange={handleChange} disabled={true} className="bg-gray-100 cursor-not-allowed">
                    <option value="theory">Theory Class</option>
                    <option value="revision">Revision Class</option>
                    <option value="paper">Paper Discussion</option>
                  </Select>
                  <Select label="Academic Level" name="level" value={formData.level} onChange={handleChange}>
                    <option value="advanced">Advanced Level</option>
                    <option value="ordinary">Ordinary Level</option>
                    <option value="general">General Education</option>
                  </Select>
                </div>

                {/* --- PARENT LINK (READ ONLY FOR UPDATES TO PREVENT ORPHANING) --- */}
                {formData.type !== 'theory' && (
                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider ml-1 mb-2 block">Linked Parent Theory Class</label>
                        <select disabled value={formData.parentTheoryClass} className="w-full bg-gray-200 border border-gray-300 rounded-xl px-4 py-3 text-sm font-medium text-gray-600 cursor-not-allowed">
                           <option value="">-- No Parent Selected --</option>
                            {theoryClasses.map(cls => (
                                <option key={cls._id} value={cls._id}>
                                    {cls.name}
                                </option>
                            ))}
                        </select>
                        <p className="text-[11px] text-blue-600 mt-2 flex items-center gap-1">
                            <LinkIcon className="w-3 h-3"/> Parent link cannot be changed after creation.
                        </p>
                    </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <Select label="Batch / Intake" name="batch" value={formData.batch} onChange={handleChange} required>
                    <option value="">Select Batch</option>
                    {batches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
                  </Select>
                  <Input label="Search Tags" name="tags" value={formData.tags} onChange={handleChange} placeholder="Comma separated keywords" />
                </div>

                <Textarea label="Description" name="description" value={formData.description} onChange={handleChange} required rows={4} placeholder="Detailed description of the curriculum..." />
              </div>
            </Section>

            <Section title="Schedule & Pricing" icon={<ClockIcon className="w-5 h-5"/>}>
                <div className="space-y-5">
                    <div className="bg-brand-aliceBlue/30 border border-brand-aliceBlue p-5 rounded-2xl">
                        <div className="text-xs font-bold text-brand-prussian uppercase tracking-widest mb-4 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-brand-cerulean"></span> Primary Schedule
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Select label="Day" name="day" value={formData.day} onChange={handleChange} className="bg-white">
                                {Object.keys(DAY_INDEX).map(d => <option key={d} value={d}>{d}</option>)}
                            </Select>
                            <Input label="Start Time" name="startTime" type="time" value={formData.startTime} onChange={handleChange} className="bg-white" />
                            <Input label="End Time" name="endTime" type="time" value={formData.endTime} onChange={handleChange} className="bg-white" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                        <div className="relative">
                            <Input label="Tuition Fee (LKR)" name="price" type="number" value={formData.price} onChange={handleChange} placeholder="0.00" />
                            <CurrencyDollarIcon className="absolute right-4 top-9 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                        <Input label="Sessions Count" name="totalSessions" type="number" value={formData.totalSessions} onChange={handleChange} />
                        <Input label="Duration (Mins)" name="sessionDurationMinutes" type="number" value={formData.sessionDurationMinutes} onChange={handleChange} />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <Input label="Start Date" name="firstSessionDate" type="date" value={formData.firstSessionDate} onChange={handleChange} />
                        <Select label="Recurrence" name="recurrence" value={formData.recurrence} onChange={handleChange}>
                            <option value="weekly">Weekly</option>
                            <option value="daily">Daily</option>
                            <option value="none">One-time</option>
                        </Select>
                    </div>
                </div>
            </Section>

            {/* Media */}
            <Section title="Cover Image" icon={<PhotoIcon className="w-5 h-5"/>}>
              <div className="group relative aspect-[16/5] bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 hover:border-brand-cerulean transition-all cursor-pointer overflow-hidden flex flex-col items-center justify-center text-center p-6">
                {imagePreview ? (
                  <>
                    <img src={imagePreview} className="absolute inset-0 w-full h-full object-cover" alt="Preview" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-medium text-xs backdrop-blur-sm">Click to Change</div>
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

            {/* --- VARIANTS & BUNDLES (ONLY FOR THEORY) --- */}
            {formData.type === 'theory' && (
                <div className="space-y-6 pt-4 border-t border-gray-100">
                    <h3 className="text-lg font-bold text-brand-prussian">Linked Class Configuration</h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <label className={`flex items-start gap-4 p-5 rounded-2xl border-2 cursor-pointer transition-all ${formData.createRevision ? "border-indigo-400 bg-indigo-50/50" : "border-gray-200 bg-white hover:border-gray-300"}`}>
                            <input type="checkbox" className="mt-1 w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-600" name="createRevision" checked={formData.createRevision} onChange={handleChange} />
                            <div>
                                <span className="block text-sm font-bold text-gray-900">Include Revision</span>
                                <span className="text-xs text-gray-500">Manage linked revision class</span>
                            </div>
                        </label>

                        <label className={`flex items-start gap-4 p-5 rounded-2xl border-2 cursor-pointer transition-all ${formData.createPaper ? "border-orange-400 bg-orange-50/50" : "border-gray-200 bg-white hover:border-gray-300"}`}>
                            <input type="checkbox" className="mt-1 w-5 h-5 text-orange-600 border-gray-300 rounded focus:ring-orange-600" name="createPaper" checked={formData.createPaper} onChange={handleChange} />
                            <div>
                                <span className="block text-sm font-bold text-gray-900">Include Paper Class</span>
                                <span className="text-xs text-gray-500">Manage linked paper discussion</span>
                            </div>
                        </label>
                    </div>

                    <AnimatePresence>
                        {(formData.createRevision || formData.createPaper) && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-8 overflow-hidden">
                                
                                <Section title="Linked Schedules" icon={<SparklesIcon className="w-5 h-5"/>}>
                                    <div className="space-y-6">
                                        {/* Revision Config */}
                                        {formData.createRevision && (
                                            <div className="p-5 rounded-2xl bg-indigo-50/40 border border-indigo-100">
                                                <h3 className="text-xs font-bold text-indigo-900 uppercase tracking-widest mb-4">Revision Details</h3>
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                    <div className="relative">
                                                        <Input label="Revision Fee" name="revisionPrice" type="number" value={formData.revisionPrice} onChange={handleChange} placeholder={formData.price} className="bg-white border-indigo-200 focus:border-indigo-400" />
                                                        <CurrencyDollarIcon className="absolute right-4 top-9 w-4 h-4 text-gray-400 pointer-events-none" />
                                                    </div>
                                                    <div className="md:col-span-2 grid grid-cols-3 gap-3">
                                                        <Select label="Day" name="revisionDay" value={formData.revisionDay} onChange={handleChange} className="bg-white border-indigo-200">
                                                            {Object.keys(DAY_INDEX).map(d => <option key={d} value={d}>{d}</option>)}
                                                        </Select>
                                                        <Input label="Start" name="revisionStartTime" type="time" value={formData.revisionStartTime} onChange={handleChange} className="bg-white border-indigo-200" />
                                                        <Input label="End" name="revisionEndTime" type="time" value={formData.revisionEndTime} onChange={handleChange} className="bg-white border-indigo-200" />
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Paper Config */}
                                        {formData.createPaper && (
                                            <div className="p-5 rounded-2xl bg-orange-50/40 border border-orange-100">
                                                <h3 className="text-xs font-bold text-orange-900 uppercase tracking-widest mb-4">Paper Class Details</h3>
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                    <div className="relative">
                                                        <Input label="Paper Fee" name="paperPrice" type="number" value={formData.paperPrice} onChange={handleChange} placeholder={formData.price} className="bg-white border-orange-200 focus:border-orange-400" />
                                                        <CurrencyDollarIcon className="absolute right-4 top-9 w-4 h-4 text-gray-400 pointer-events-none" />
                                                    </div>
                                                    <div className="md:col-span-2 grid grid-cols-3 gap-3">
                                                        <Select label="Day" name="paperDay" value={formData.paperDay} onChange={handleChange} className="bg-white border-orange-200">
                                                            {Object.keys(DAY_INDEX).map(d => <option key={d} value={d}>{d}</option>)}
                                                        </Select>
                                                        <Input label="Start" name="paperStartTime" type="time" value={formData.paperStartTime} onChange={handleChange} className="bg-white border-orange-200" />
                                                        <Input label="End" name="paperEndTime" type="time" value={formData.paperEndTime} onChange={handleChange} className="bg-white border-orange-200" />
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </Section>

                                {/* Bundle Pricing */}
                                <Section title="Bundle Offers" icon={<TagIcon className="w-5 h-5"/>}>
                                    <div className="p-5 rounded-2xl bg-green-50/40 border border-green-100">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-xs font-bold text-green-800 uppercase tracking-widest">Package Pricing</h3>
                                            <span className="text-[10px] text-green-600 font-medium bg-green-100 px-2 py-1 rounded-md">Optional</span>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                                            {formData.createRevision && (
                                                <div className="relative">
                                                    <Input label="Theory + Revision" name="bundlePriceRevision" type="number" value={formData.bundlePriceRevision} onChange={handleChange} placeholder={(Number(formData.price) + Number(formData.revisionPrice || 0)).toString()} className="bg-white border-green-200 focus:border-green-400"/>
                                                    <CurrencyDollarIcon className="absolute right-4 top-9 w-4 h-4 text-gray-400 pointer-events-none" />
                                                </div>
                                            )}
                                            {formData.createPaper && (
                                                <div className="relative">
                                                    <Input label="Theory + Paper" name="bundlePricePaper" type="number" value={formData.bundlePricePaper} onChange={handleChange} placeholder={(Number(formData.price) + Number(formData.paperPrice || 0)).toString()} className="bg-white border-green-200 focus:border-green-400"/>
                                                    <CurrencyDollarIcon className="absolute right-4 top-9 w-4 h-4 text-gray-400 pointer-events-none" />
                                                </div>
                                            )}
                                            {(formData.createRevision && formData.createPaper) && (
                                                <div className="relative">
                                                    <Input label="Full Bundle (All 3)" name="bundlePriceFull" type="number" value={formData.bundlePriceFull} onChange={handleChange} placeholder={(Number(formData.price) + Number(formData.revisionPrice || 0) + Number(formData.paperPrice || 0)).toString()} className="bg-white border-green-200 focus:border-green-400 font-bold text-green-800"/>
                                                    <CurrencyDollarIcon className="absolute right-4 top-9 w-4 h-4 text-gray-400 pointer-events-none" />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </Section>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-6 border-t border-gray-100">
                <button type="button" onClick={() => navigate(-1)} className="flex-1 py-4 rounded-xl text-sm font-bold text-gray-500 bg-white border border-gray-200 hover:bg-gray-50 transition-all">Cancel</button>
                <button type="submit" className="flex-[2] bg-brand-prussian hover:bg-brand-cerulean text-white py-4 rounded-xl text-sm font-bold transition-all shadow-lg shadow-brand-prussian/20 flex items-center justify-center gap-2 active:scale-95">
                    Review & Save Changes <EyeIcon className="w-4 h-4" />
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
                            <div className="bg-brand-aliceBlue/20 p-4 rounded-xl border border-brand-aliceBlue/50 flex gap-4">
                                {imagePreview && <img src={imagePreview} className="w-16 h-16 object-cover rounded-lg bg-gray-200" alt="Cover" />}
                                <div>
                                    <h4 className="font-bold text-brand-prussian text-lg leading-tight">{formData.name}</h4>
                                    <p className="text-xs text-gray-500 mt-1 capitalize">{formData.type} • {formData.level} Level</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="text-xs text-gray-400 font-bold uppercase block mb-1">Schedule</span>
                                    <p className="font-medium text-gray-800">{formData.day}s</p>
                                    <p className="text-gray-600">{formData.startTime} - {formData.endTime}</p>
                                    <p className="font-bold text-brand-cerulean mt-1">LKR {formData.price}</p>
                                </div>
                                {formData.type === 'theory' && (
                                    <div>
                                         <span className="text-xs text-gray-400 font-bold uppercase block mb-1">Linked Classes</span>
                                         <div className="flex flex-col gap-1">
                                            {formData.createRevision ? <span className="text-indigo-600 text-xs font-bold bg-indigo-50 px-2 py-1 rounded w-fit">Revision Active</span> : <span className="text-gray-400 text-xs">No Revision</span>}
                                            {formData.createPaper ? <span className="text-orange-600 text-xs font-bold bg-orange-50 px-2 py-1 rounded w-fit">Paper Active</span> : <span className="text-gray-400 text-xs">No Paper</span>}
                                         </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex gap-3">
                            <button onClick={() => setShowPreview(false)} className="flex-1 py-3 rounded-xl font-bold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 transition-all text-sm">Edit</button>
                            <button onClick={handleFinalSubmit} disabled={isSaving} className="flex-[2] py-3 rounded-xl font-bold text-white bg-brand-prussian hover:bg-brand-cerulean shadow-lg transition-all text-sm flex items-center justify-center gap-2">
                                {isSaving ? "Updating..." : "Confirm Update"}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>

      </div>
  );
}

// --- SUB COMPONENTS (Reused) ---
const Section = ({ title, icon, children }: { title: string, icon: React.ReactNode, children: React.ReactNode }) => (
  <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm transition-shadow hover:shadow-md">
    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-50">
      <div className="text-brand-cerulean p-2 bg-brand-aliceBlue/50 rounded-xl">{icon}</div>
      <h2 className="text-sm font-bold text-brand-prussian uppercase tracking-widest">{title}</h2>
    </div>
    {children}
  </div>
);

const Input = ({ label, className, ...props }: any) => (
  <div className="flex flex-col gap-2">
    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider ml-1">{label}</label>
    <input {...props} className={`w-full bg-gray-50 border border-gray-200 focus:border-brand-cerulean focus:bg-white focus:ring-4 focus:ring-brand-cerulean/10 rounded-xl px-4 py-3 outline-none transition-all text-sm font-medium text-brand-prussian placeholder:text-gray-400 ${className || ''}`} />
  </div>
);

const Select = ({ label, children, className, ...props }: any) => (
  <div className="flex flex-col gap-2">
    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider ml-1">{label}</label>
    <div className="relative">
        <select {...props} className={`w-full appearance-none bg-gray-50 border border-gray-200 focus:border-brand-cerulean focus:bg-white focus:ring-4 focus:ring-brand-cerulean/10 rounded-xl px-4 py-3 outline-none transition-all text-sm font-medium text-brand-prussian cursor-pointer ${className || ''}`}>
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
    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider ml-1">{label}</label>
    <textarea {...props} className="w-full bg-gray-50 border border-gray-200 focus:border-brand-cerulean focus:bg-white focus:ring-4 focus:ring-brand-cerulean/10 rounded-xl px-4 py-3 outline-none transition-all text-sm font-medium text-brand-prussian resize-none placeholder:text-gray-400" />
  </div>
);