import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import moment from "moment";
import { motion, AnimatePresence } from "framer-motion";
import ClassService, { type UpdateClassPayload } from "../../../services/ClassService";
import BatchService from "../../../services/BatchService";
import {
  ChevronLeftIcon,
  ChevronDownIcon,
  PhotoIcon,
  InformationCircleIcon,
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
  const [loadingBatches, setLoadingBatches] = useState(true);
  
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // --- 1. Fetch Data & Populate Form ---
  const fetchData = useCallback(async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      setLoadingBatches(true);
      
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
        revisionPrice: cls.linkedRevisionClass?.price !== undefined ? String(cls.linkedRevisionClass.price) : "",

        // Paper Data (Unpack from linked object)
        paperDay: cls.linkedPaperClass?.timeSchedules?.[0] ? INDEX_TO_DAY[cls.linkedPaperClass.timeSchedules[0].day] : "Sunday",
        paperStartTime: cls.linkedPaperClass?.timeSchedules?.[0]?.startTime || "13:00",
        paperEndTime: cls.linkedPaperClass?.timeSchedules?.[0]?.endTime || "15:00",
        paperPrice: cls.linkedPaperClass?.price !== undefined ? String(cls.linkedPaperClass.price) : "",

        // Bundle Prices
        bundlePriceRevision: cls.bundlePriceRevision !== undefined && cls.bundlePriceRevision !== null ? String(cls.bundlePriceRevision) : "",
        bundlePricePaper: cls.bundlePricePaper !== undefined && cls.bundlePricePaper !== null ? String(cls.bundlePricePaper) : "",
        bundlePriceFull: cls.bundlePriceFull !== undefined && cls.bundlePriceFull !== null ? String(cls.bundlePriceFull) : "",
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
      setLoadingBatches(false);
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

    // --- Strict Validations ---

    // 1. Number Validations
    if (Number(formData.price) < 0) return setError("Tuition fee cannot be a negative value.");
    if (Number(formData.totalSessions) < 1) return setError("Sessions count must be at least 1.");
    if (Number(formData.sessionDurationMinutes) < 1) return setError("Duration must be at least 1 minute.");

    // 2. Time Validation
    if (moment(formData.startTime, "HH:mm").isSameOrAfter(moment(formData.endTime, "HH:mm"))) {
      return setError("End time must be later than start time.");
    }

    if (formData.type === 'theory') {
      // Revision Validation
      if (formData.createRevision) {
        if (Number(formData.revisionPrice) < 0) return setError("Revision fee cannot be negative.");
        if (moment(formData.revisionStartTime, "HH:mm").isSameOrAfter(moment(formData.revisionEndTime, "HH:mm"))) {
          return setError("Revision Class: End time must be later than start time.");
        }
      }
      // Paper Class Validation
      if (formData.createPaper) {
        if (Number(formData.paperPrice) < 0) return setError("Paper fee cannot be negative.");
        if (moment(formData.paperStartTime, "HH:mm").isSameOrAfter(moment(formData.paperEndTime, "HH:mm"))) {
          return setError("Paper Class: End time must be later than start time.");
        }
      }
      // Bundle Price Validations
      if (formData.bundlePriceRevision && Number(formData.bundlePriceRevision) < 0) return setError("Bundle price cannot be negative.");
      if (formData.bundlePricePaper && Number(formData.bundlePricePaper) < 0) return setError("Bundle price cannot be negative.");
      if (formData.bundlePriceFull && Number(formData.bundlePriceFull) < 0) return setError("Bundle price cannot be negative.");
    }

    setShowPreview(true);
  };

  const handleFinalSubmit = async () => {
    if (!id) return;
    const safeNumber = (val: string) => val.trim() === "" ? undefined : Number(val);
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
        revisionPrice: (formData.type === 'theory' && formData.createRevision) ? safeNumber(formData.revisionPrice) : undefined,
        
        paperDay: (formData.type === 'theory' && formData.createPaper) ? DAY_INDEX[formData.paperDay] : undefined,
        paperStartTime: (formData.type === 'theory' && formData.createPaper) ? formData.paperStartTime : undefined,
        paperEndTime: (formData.type === 'theory' && formData.createPaper) ? formData.paperEndTime : undefined,
        paperPrice: (formData.type === 'theory' && formData.createPaper) ? safeNumber(formData.paperPrice) : undefined,

        bundlePriceRevision: (formData.type === 'theory' && formData.createRevision) ? safeNumber(formData.bundlePriceRevision) : undefined,
        bundlePricePaper: (formData.type === 'theory' && formData.createPaper) ? safeNumber(formData.bundlePricePaper) : undefined,
        bundlePriceFull: (formData.type === 'theory' && formData.createRevision && formData.createPaper) ? safeNumber(formData.bundlePriceFull) : undefined,
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
        <div className="flex flex-col items-center justify-center h-screen text-[#0d4b5b]">
            <div className="w-12 h-12 border-4 border-gray-200 border-t-[#0d4b5b] rounded-full animate-spin mb-4"></div>
            <p className="font-bold">Loading Class Details...</p>
        </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-24 w-full overflow-x-hidden">
        
      {/* --- Header --- */}
      <div className="flex items-center gap-4 pt-4 mb-4">
        <button
          onClick={() => navigate(-1)}
          className="w-8 h-8 rounded-full bg-[#eef2f6] text-[#0d4b5b] flex items-center justify-center hover:bg-[#e2e8f0] transition-colors shrink-0"
        >
          <ChevronLeftIcon className="w-4 h-4 stroke-[3]" />
        </button>
        <div>
          <div className="flex items-center gap-3">
             <h1 className="text-xl md:text-[22px] font-bold text-gray-900 tracking-tight leading-tight">Update Module</h1>
             <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-[10px] font-bold rounded-md border border-gray-200">Editing</span>
          </div>
          <p className="text-gray-500 text-xs mt-0.5">Modify curriculum details, schedules, and bundle configurations.</p>
        </div>
      </div>

      {error && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-red-50 border border-red-100 text-red-600 px-5 py-4 rounded-xl text-sm font-medium flex items-center gap-3 shadow-sm">
          <InformationCircleIcon className="w-5 h-5 shrink-0" /> {error}
        </motion.div>
      )}

      <form onSubmit={handlePreSubmit} className="space-y-6">
          
        {/* --- 1. MODULE IDENTITY --- */}
        <Section title="MODULE IDENTITY">
          <div className="grid gap-5">
            <Input label="Module Name" name="name" value={formData.name} onChange={handleChange} required placeholder="E.g. 2026 AL Accounting" />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Select label="Module Type" name="type" value={formData.type} onChange={handleChange} disabled={true} className="bg-gray-100 cursor-not-allowed opacity-80">
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

            {/* --- CONDITIONAL PARENT SELECTOR --- */}
            {formData.type !== 'theory' && (
              <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                <Select label="Linked Parent Theory Class" name="parentTheoryClass" value={formData.parentTheoryClass} onChange={handleChange} disabled={true} className="bg-white border-blue-200 cursor-not-allowed opacity-80">
                  <option value="">-- No Parent Selected --</option>
                  {theoryClasses.map(cls => (
                    <option key={cls._id} value={cls._id}>
                      {cls.name} {cls.batch?.name ? `(${cls.batch.name})` : ''}
                    </option>
                  ))}
                </Select>
                <p className="text-[11px] text-blue-600 mt-2 flex items-center gap-1">
                  <LinkIcon className="w-3 h-3" /> Parent link cannot be changed after creation.
                </p>
              </motion.div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Select label="Batch / Intake" name="batch" value={formData.batch} onChange={handleChange} required>
                <option value="">{loadingBatches ? "Loading..." : "Select Batch"}</option>
                {batches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
              </Select>
              <Input label="Search Tags" name="tags" value={formData.tags} onChange={handleChange} placeholder="Comma separated keywords" />
            </div>

            <Textarea label="Description" name="description" value={formData.description} onChange={handleChange} required rows={3} placeholder="Detailed description of the curriculum..." />
          </div>
        </Section>

        {/* --- 2. SCHEDULE & PRICING --- */}
        <Section title="SCHEDULE & PRICING">
            <div className="space-y-5">
                <div className="bg-[#f4f8f9] border border-[#e5efef] p-5 rounded-xl">
                    <div className="text-[12px] font-black text-[#0d4b5b] uppercase tracking-widest mb-4">
                        Primary Schedule
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <Select label="Day" name="day" value={formData.day} onChange={handleChange}>
                            {Object.keys(DAY_INDEX).map(d => <option key={d} value={d}>{d}</option>)}
                        </Select>
                        <Input label="Start Time" name="startTime" type="time" value={formData.startTime} onChange={handleChange} />
                        <Input label="End Time" name="endTime" type="time" value={formData.endTime} onChange={handleChange} />
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                    <Input label="Tuition Fee (LKR)" name="price" type="number" min="0" value={formData.price} onChange={handleChange} placeholder="0" />
                    <Input label="Sessions Count" name="totalSessions" type="number" min="1" value={formData.totalSessions} onChange={handleChange} placeholder="1" />
                    <Input label="Duration (Mins)" name="sessionDurationMinutes" type="number" min="1" value={formData.sessionDurationMinutes} onChange={handleChange} placeholder="60" />
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

        {/* --- 3. COVER IMAGE --- */}
        <Section title="COVER IMAGE">
          <div className="relative w-full h-32 bg-[#fafbfc] rounded-xl border border-dashed border-gray-300 hover:border-[#0d4b5b] transition-all cursor-pointer overflow-hidden flex flex-col items-center justify-center text-center">
            {imagePreview ? (
              <>
                <img src={imagePreview} className="absolute inset-0 w-full h-full object-cover" alt="Preview" />
                <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center text-white font-medium text-xs backdrop-blur-sm">Click to Change</div>
              </>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <PhotoIcon className="w-6 h-6 text-[#0d4b5b]" />
                <span className="text-[12px] font-bold text-gray-700">Upload cover banner</span>
              </div>
            )}
            <input type="file" accept="image/*" onChange={handleImageChange} className="absolute inset-0 opacity-0 cursor-pointer" />
          </div>
        </Section>

        {/* --- 4. AUTO-GENERATE LINKED CLASSES (ONLY FOR THEORY) --- */}
        {formData.type === 'theory' && (
            <div className="space-y-6 pt-4">
                <h3 className="text-[13px] font-black text-gray-800 uppercase tracking-widest px-2">Auto-Generate Linked Classes</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <label className={`flex items-start gap-4 p-5 rounded-xl border cursor-pointer transition-all ${formData.createRevision ? "border-[#0d4b5b] bg-[#f4f8f9]" : "border-gray-200 bg-white hover:border-gray-300"}`}>
                        <input type="checkbox" className="mt-1 w-4 h-4 text-[#0d4b5b] border-gray-300 rounded focus:ring-[#0d4b5b]" name="createRevision" checked={formData.createRevision} onChange={handleChange} />
                        <div>
                            <span className="block text-[13px] font-bold text-gray-800">Include Revision</span>
                            <span className="text-[11px] text-gray-400 font-medium">Create a linked revision class</span>
                        </div>
                    </label>

                    <label className={`flex items-start gap-4 p-5 rounded-xl border cursor-pointer transition-all ${formData.createPaper ? "border-amber-400 bg-amber-50/50" : "border-gray-200 bg-white hover:border-gray-300"}`}>
                        <input type="checkbox" className="mt-1 w-4 h-4 text-amber-500 border-gray-300 rounded focus:ring-amber-500" name="createPaper" checked={formData.createPaper} onChange={handleChange} />
                        <div>
                            <span className="block text-[13px] font-bold text-gray-800">Include Paper Class</span>
                            <span className="text-[11px] text-gray-400 font-medium">Create a linked paper discussion</span>
                        </div>
                    </label>
                </div>

                <AnimatePresence>
                    {(formData.createRevision || formData.createPaper) && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-6 overflow-hidden">
                            
                            {/* LINKED SCHEDULES */}
                            <Section title="LINKED SCHEDULES">
                                <div className="space-y-6">
                                    {/* Revision Config */}
                                    {formData.createRevision && (
                                        <div className="p-5 rounded-xl bg-[#f4f8f9] border border-[#e5efef]">
                                            <h3 className="text-[11px] font-black text-[#0d4b5b] uppercase tracking-widest mb-4">Revision Class Details</h3>
                                            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                                                <Input label="Revision Fee" name="revisionPrice" type="number" min="0" value={formData.revisionPrice} onChange={handleChange} placeholder="0" />
                                                <Select label="Day" name="revisionDay" value={formData.revisionDay} onChange={handleChange}>
                                                    {Object.keys(DAY_INDEX).map(d => <option key={d} value={d}>{d}</option>)}
                                                </Select>
                                                <Input label="Start" name="revisionStartTime" type="time" value={formData.revisionStartTime} onChange={handleChange} />
                                                <Input label="End" name="revisionEndTime" type="time" value={formData.revisionEndTime} onChange={handleChange} />
                                            </div>
                                        </div>
                                    )}

                                    {/* Paper Config */}
                                    {formData.createPaper && (
                                        <div className="p-5 rounded-xl bg-[#fdf8f3] border border-[#f5e6d3]">
                                            <h3 className="text-[11px] font-black text-[#0d4b5b] uppercase tracking-widest mb-4">Paper Class Details</h3>
                                            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                                                <Input label="Paper Fee" name="paperPrice" type="number" min="0" value={formData.paperPrice} onChange={handleChange} placeholder="0" />
                                                <Select label="Day" name="paperDay" value={formData.paperDay} onChange={handleChange}>
                                                    {Object.keys(DAY_INDEX).map(d => <option key={d} value={d}>{d}</option>)}
                                                </Select>
                                                <Input label="Start" name="paperStartTime" type="time" value={formData.paperStartTime} onChange={handleChange} />
                                                <Input label="End" name="paperEndTime" type="time" value={formData.paperEndTime} onChange={handleChange} />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </Section>

                            {/* BUNDLE OFFERS */}
                            <Section title="BUNDLE OFFERS">
                                <div className="p-5 rounded-xl bg-[#f2fcf5] border border-emerald-100">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-[11px] font-black text-[#0d4b5b] uppercase tracking-widest">Package Pricing</h3>
                                        <span className="text-[10px] text-emerald-600 font-bold bg-white border border-emerald-300 px-2.5 py-0.5 rounded-full">Optional</span>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                                        {/* Theory + Revision */}
                                        {formData.createRevision && (
                                            <Input label="Theory + Revision" name="bundlePriceRevision" type="number" min="0" value={formData.bundlePriceRevision} onChange={handleChange} placeholder={(Number(formData.price) + Number(formData.revisionPrice || 0)).toString()} />
                                        )}
                                        {/* Theory + Paper */}
                                        {formData.createPaper && (
                                            <Input label="Theory + Paper" name="bundlePricePaper" type="number" min="0" value={formData.bundlePricePaper} onChange={handleChange} placeholder={(Number(formData.price) + Number(formData.paperPrice || 0)).toString()} />
                                        )}
                                        {/* Full Bundle */}
                                        {(formData.createRevision && formData.createPaper) && (
                                            <Input label="Full Bundle (All 3)" name="bundlePriceFull" type="number" min="0" value={formData.bundlePriceFull} onChange={handleChange} placeholder={(Number(formData.price) + Number(formData.revisionPrice || 0) + Number(formData.paperPrice || 0)).toString()} />
                                        )}
                                    </div>
                                </div>
                            </Section>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        )}

        {/* --- Actions --- */}
        <div className="flex items-center justify-center gap-4 pt-6 pb-10">
            <button type="button" onClick={() => navigate(-1)} className="px-8 py-2.5 rounded-xl bg-[#eef2f6] text-[#0d4b5b] font-bold text-sm border border-transparent hover:bg-[#e2e8f0] transition-colors min-w-[150px]">
                Cancel
            </button>
            <button type="submit" className="px-8 py-2.5 rounded-xl bg-[#0d4b5b] text-white font-bold text-sm hover:bg-[#093946] transition-colors shadow-sm active:scale-95 min-w-[200px]">
                Review And Update
            </button>
        </div>

      </form>

      {/* --- CONFIRMATION MODAL --- */}
      <AnimatePresence>
          {showPreview && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0d4b5b]/40 backdrop-blur-sm">
                  <motion.div 
                      initial={{ scale: 0.95, y: 10 }} 
                      animate={{ scale: 1, y: 0 }} 
                      exit={{ scale: 0.95, y: 10 }} 
                      className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-gray-100"
                  >
                      <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white">
                          <h3 className="text-[15px] font-black text-[#0d4b5b] uppercase tracking-widest">Confirm Details</h3>
                          <button onClick={() => setShowPreview(false)} className="p-1 hover:bg-gray-100 rounded-full text-gray-500"><XMarkIcon className="w-5 h-5"/></button>
                      </div>
                      
                      <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                          <div className="bg-[#f4f8f9] p-4 rounded-xl border border-gray-100 flex gap-4">
                              {imagePreview && <img src={imagePreview} className="w-16 h-16 object-cover rounded-lg bg-gray-200" alt="Cover" />}
                              <div>
                                  <h4 className="font-bold text-gray-900 text-[15px] leading-tight mb-1">{formData.name}</h4>
                                  <p className="text-[11px] text-gray-500 font-bold uppercase">{formData.type} • {formData.level}</p>
                              </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest block mb-1">Schedule</span>
                                  <p className="font-bold text-gray-800 text-[12px]">{formData.day}s</p>
                                  <p className="text-gray-500 text-[12px]">{formData.startTime} - {formData.endTime}</p>
                                  <p className="font-black text-[#0d4b5b] mt-1 text-[13px]">LKR {formData.price}</p>
                              </div>
                              {formData.type === 'theory' && (
                                  <div>
                                       <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest block mb-1">Linked Classes</span>
                                       <div className="flex flex-col gap-1">
                                          {formData.createRevision ? <span className="text-indigo-700 text-[11px] font-bold bg-indigo-50 px-2 py-1 rounded w-fit">Revision Active</span> : <span className="text-gray-400 text-[11px]">No Revision</span>}
                                          {formData.createPaper ? <span className="text-orange-700 text-[11px] font-bold bg-orange-50 px-2 py-1 rounded w-fit">Paper Active</span> : <span className="text-gray-400 text-[11px]">No Paper</span>}
                                       </div>
                                  </div>
                              )}
                          </div>
                      </div>

                      <div className="p-6 border-t border-gray-100 bg-white flex gap-3 justify-center">
                          <button onClick={() => setShowPreview(false)} className="px-6 py-2.5 rounded-xl font-bold text-[#0d4b5b] bg-[#eef2f6] hover:bg-[#e2e8f0] transition-colors text-sm min-w-[120px]">Edit</button>
                          <button onClick={handleFinalSubmit} disabled={isSaving} className="px-8 py-2.5 rounded-xl font-bold text-white bg-[#0d4b5b] hover:bg-[#093946] shadow-sm transition-all text-sm flex items-center justify-center gap-2 disabled:opacity-70">
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

// --- SUB COMPONENTS ---

const Section = ({ title, children }: { title: string, children: React.ReactNode }) => (
  <div className="bg-white p-6 md:p-8 rounded-2xl border border-gray-100 shadow-sm">
    <h2 className="text-[13px] font-black text-[#0d4b5b] uppercase tracking-widest mb-6">{title}</h2>
    {children}
  </div>
);

// Customized Input component to prevent typing minus and 'e'
const Input = ({ label, className, ...props }: any) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-[13px] font-bold text-gray-800">{label}</label>
    <input
      {...props}
      onKeyDown={(e) => {
        if (props.type === "number" && (e.key === "-" || e.key === "e" || e.key === "E")) {
          e.preventDefault();
        }
        if (props.onKeyDown) props.onKeyDown(e);
      }}
      className={`w-full bg-white border border-gray-200 focus:ring-2 focus:ring-[#0d4b5b]/20 focus:border-[#0d4b5b] rounded-xl px-4 py-2.5 outline-none transition-all text-[13px] font-medium text-gray-700 placeholder:text-gray-300 ${className || ''}`}
    />
  </div>
);

const Select = ({ label, children, className, ...props }: any) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-[13px] font-bold text-gray-800">{label}</label>
    <div className="relative">
      <select {...props} className={`w-full appearance-none bg-white border border-gray-200 focus:ring-2 focus:ring-[#0d4b5b]/20 focus:border-[#0d4b5b] rounded-xl px-4 py-2.5 outline-none transition-all text-[13px] font-medium text-gray-700 cursor-pointer ${className || ''}`}>
        {children}
      </select>
      <ChevronDownIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#0d4b5b] pointer-events-none stroke-[2.5]" />
    </div>
  </div>
);

const Textarea = ({ label, ...props }: any) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-[13px] font-bold text-gray-800">{label}</label>
    <textarea {...props} className="w-full bg-white border border-gray-200 focus:ring-2 focus:ring-[#0d4b5b]/20 focus:border-[#0d4b5b] rounded-xl px-4 py-3 outline-none transition-all text-[13px] font-medium text-gray-700 resize-none placeholder:text-gray-300" />
  </div>
);