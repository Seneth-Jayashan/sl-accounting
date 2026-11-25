import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import moment from "moment";
import { motion, AnimatePresence } from "framer-motion";
import ClassService, { type CreateClassPayload } from "../../../services/ClassService";
import BatchService from "../../../services/BatchService";
import {
  ArrowLeftIcon,
  PhotoIcon,
  ClockIcon,
  AcademicCapIcon,
  TagIcon,
  SparklesIcon,
  EyeIcon,
  XMarkIcon,
  LinkIcon,
  PlusIcon,
  TrashIcon,
  ChevronDownIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  VideoCameraIcon,
} from "@heroicons/react/24/outline";

// --- CONSTANTS ---
const DAY_INDEX: Record<string, number> = {
  Sunday: 0,
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
};

const MODULE_TYPES = [
  {
    value: "theory",
    label: "Theory Class",
    desc: "Core syllabus & optional linked classes",
  },
  {
    value: "revision",
    label: "Revision Class",
    desc: "Focused review & past-paper recap",
  },
  {
    value: "paper",
    label: "Paper Discussion",
    desc: "Timed papers & marking scheme",
  },
] as const;

const INITIAL_FORM = {
  name: "",
  description: "",
  promoVideoUrl: "",
  price: "",
  batch: "",
  type: "theory", // theory | revision | paper
  parentTheoryClass: "",
  timeSchedules: [{ day: "Saturday", startTime: "08:00", endTime: "10:00" }],
  firstSessionDate: "",
  recurrence: "weekly",
  totalSessions: "4",
  sessionDurationMinutes: "120",
  level: "advanced",
  tags: "",

  createRevision: false,
  createPaper: false,

  revisionDay: "Sunday",
  revisionStartTime: "08:00",
  revisionEndTime: "10:00",
  revisionPrice: "",

  paperDay: "Sunday",
  paperStartTime: "13:00",
  paperEndTime: "15:00",
  paperPrice: "",

  bundlePriceRevision: "",
  bundlePricePaper: "",
  bundlePriceFull: "",
};

export default function CreateClassPage() {
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [batches, setBatches] = useState<any[]>([]);
  const [theoryClasses, setTheoryClasses] = useState<any[]>([]);
  const [loadingBatches, setLoadingBatches] = useState(true);

  const [formData, setFormData] = useState(INITIAL_FORM);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Fetch Batches & Theory Classes
  const fetchData = useCallback(async () => {
    try {
      setLoadingBatches(true);
      const [batchData, theories] = await Promise.all([
        BatchService.getAllBatches(true),
        ClassService.getTheoryClasses(),
      ]);
      setBatches(batchData.batches || []);
      setTheoryClasses(theories || []);
    } catch {
      setError("System was unable to load initial batches and classes.");
    } finally {
      setLoadingBatches(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  // Resolved names for the confirmation modal
  const selectedBatchName = useMemo(
    () => batches.find((b) => b._id === formData.batch)?.name || "Not selected",
    [batches, formData.batch]
  );

  const selectedParentName = useMemo(
    () =>
      theoryClasses.find((c) => c._id === formData.parentTheoryClass)?.name ||
      null,
    [theoryClasses, formData.parentTheoryClass]
  );

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    if (e.target.type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleScheduleChange = (index: number, field: string, value: string) => {
    setFormData((prev) => {
      const newSchedules = [...prev.timeSchedules];
      newSchedules[index] = { ...newSchedules[index], [field]: value };
      return { ...prev, timeSchedules: newSchedules };
    });
  };

  const addSchedule = () => {
    setFormData((prev) => ({
      ...prev,
      timeSchedules: [
        ...prev.timeSchedules,
        { day: "Saturday", startTime: "08:00", endTime: "10:00" },
      ],
    }));
  };

  const removeSchedule = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      timeSchedules: prev.timeSchedules.filter((_, i) => i !== index),
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type))
      return setError("Invalid image format. Use JPG, PNG, or WebP.");
    if (file.size > 5 * 1024 * 1024)
      return setError("File too large. Maximum 5MB allowed.");

    setSelectedImage(file);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(URL.createObjectURL(file));
    setError(null);
  };

  const clearImage = () => {
    setSelectedImage(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
  };

  const handlePreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    for (const sch of formData.timeSchedules) {
      if (moment(sch.startTime, "HH:mm").isSameOrAfter(moment(sch.endTime, "HH:mm"))) {
        return setError("End time must be later than start time in all schedules.");
      }
    }

    if (formData.type === "theory") {
      if (
        formData.createRevision &&
        moment(formData.revisionStartTime, "HH:mm").isSameOrAfter(
          moment(formData.revisionEndTime, "HH:mm")
        )
      ) {
        return setError("Revision Class: End time must be later than start time.");
      }
      if (
        formData.createPaper &&
        moment(formData.paperStartTime, "HH:mm").isSameOrAfter(
          moment(formData.paperEndTime, "HH:mm")
        )
      ) {
        return setError("Paper Class: End time must be later than start time.");
      }
    }

    setShowPreview(true);
  };

  const handleFinalSubmit = async () => {
    const safeNumber = (val: string) =>
      val.trim() === "" ? undefined : Number(val);
    setIsSaving(true);
    try {
      const payload: CreateClassPayload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        promoVideoUrl: formData.promoVideoUrl.trim(),
        price: Number(formData.price) || 0,
        batch: formData.batch,
        type: formData.type as any,
        level: formData.level as any,
        recurrence: formData.recurrence as any,
        firstSessionDate: formData.firstSessionDate,
        totalSessions: Number(formData.totalSessions),
        sessionDurationMinutes: Number(formData.sessionDurationMinutes),
        timeSchedules: formData.timeSchedules.map((sch) => ({
          day: DAY_INDEX[sch.day],
          startTime: sch.startTime,
          endTime: sch.endTime,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        })),
        tags: formData.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        coverImage: selectedImage || null,

        parentTheoryClass:
          formData.type !== "theory" && formData.parentTheoryClass
            ? formData.parentTheoryClass
            : undefined,

        createRevision:
          formData.type === "theory" ? formData.createRevision : undefined,
        createPaper:
          formData.type === "theory" ? formData.createPaper : undefined,

        revisionDay:
          formData.type === "theory" && formData.createRevision
            ? DAY_INDEX[formData.revisionDay]
            : undefined,
        revisionStartTime:
          formData.type === "theory" && formData.createRevision
            ? formData.revisionStartTime
            : undefined,
        revisionEndTime:
          formData.type === "theory" && formData.createRevision
            ? formData.revisionEndTime
            : undefined,
        revisionPrice:
          formData.type === "theory" && formData.createRevision
            ? safeNumber(formData.revisionPrice)
            : undefined,

        paperDay:
          formData.type === "theory" && formData.createPaper
            ? DAY_INDEX[formData.paperDay]
            : undefined,
        paperStartTime:
          formData.type === "theory" && formData.createPaper
            ? formData.paperStartTime
            : undefined,
        paperEndTime:
          formData.type === "theory" && formData.createPaper
            ? formData.paperEndTime
            : undefined,
        paperPrice:
          formData.type === "theory" && formData.createPaper
            ? safeNumber(formData.paperPrice)
            : undefined,

        bundlePriceRevision:
          formData.type === "theory" && formData.createRevision
            ? safeNumber(formData.bundlePriceRevision)
            : undefined,
        bundlePricePaper:
          formData.type === "theory" && formData.createPaper
            ? safeNumber(formData.bundlePricePaper)
            : undefined,
        bundlePriceFull:
          formData.type === "theory" &&
            formData.createRevision &&
            formData.createPaper
            ? safeNumber(formData.bundlePriceFull)
            : undefined,
      };

      await ClassService.createClass(payload);
      navigate("/admin/classes");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Internal server error occurred.");
      setShowPreview(false);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 md:space-y-8 pb-32 md:pb-16">
      {/* HEADER */}
      <header className="space-y-4">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="group inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-brand-prussian bg-white px-3.5 py-2 rounded-xl border border-slate-200/80 shadow-sm transition-all"
        >
          <ArrowLeftIcon className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
          Back to Curriculum
        </button>

        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-brand-prussian tracking-tight">
            Create New Class
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Configure module details, weekly schedules, cover media, and optional bundles.
          </p>
        </div>
      </header>

      {/* ERROR BANNER */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="bg-rose-50 border border-rose-200/80 text-rose-700 px-4 py-3.5 rounded-2xl text-sm font-medium flex items-center justify-between gap-3 shadow-sm"
          >
            <div className="flex items-center gap-2.5">
              <ExclamationTriangleIcon className="w-5 h-5 text-rose-500 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              type="button"
              onClick={() => setError(null)}
              className="p-1 rounded-lg hover:bg-rose-100 text-rose-500"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handlePreSubmit} className="space-y-6">
        {/* 1. MODULE IDENTITY */}
        <Section
          title="Module Identity"
          subtitle="Class type, batch assignment, and curriculum details"
          icon={<AcademicCapIcon className="w-5 h-5" />}
        >
          <div className="space-y-5">
            {/* Module Type Cards */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                Module Type <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {MODULE_TYPES.map((mt) => {
                  const active = formData.type === mt.value;
                  return (
                    <button
                      key={mt.value}
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({ ...prev, type: mt.value }))
                      }
                      className={`text-left p-3.5 rounded-xl border transition-all ${active
                          ? "bg-brand-aliceBlue/70 border-brand-cerulean ring-1 ring-brand-cerulean/30"
                          : "bg-slate-50/70 border-slate-200/80 hover:bg-white hover:border-slate-300"
                        }`}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-sm font-bold ${active ? "text-brand-prussian" : "text-slate-700"
                            }`}
                        >
                          {mt.label}
                        </span>
                        <span
                          className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${active
                              ? "border-brand-cerulean bg-brand-cerulean"
                              : "border-slate-300"
                            }`}
                        >
                          {active && (
                            <span className="w-1.5 h-1.5 rounded-full bg-white" />
                          )}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                        {mt.desc}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Conditional Parent Theory Selector */}
            <AnimatePresence>
              {formData.type !== "theory" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="bg-blue-50/70 p-4 rounded-xl border border-blue-200/70 space-y-2">
                    <Select
                      label="Link to Parent Theory Class"
                      name="parentTheoryClass"
                      value={formData.parentTheoryClass}
                      onChange={handleChange}
                      className="bg-white border-blue-200"
                    >
                      <option value="">-- Optional: Select Parent Theory Class --</option>
                      {theoryClasses.map((cls) => (
                        <option key={cls._id} value={cls._id}>
                          {cls.name} {cls.batch?.name ? `(${cls.batch.name})` : ""}
                        </option>
                      ))}
                    </Select>
                    <p className="text-xs text-blue-700 flex items-center gap-1.5">
                      <LinkIcon className="w-3.5 h-3.5 shrink-0" />
                      Students enrolled in the parent theory class will see this{" "}
                      {formData.type} module linked together.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <Input
              label="Module Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="e.g., 2026 Advanced Level Accounting"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Select
                label="Batch / Intake"
                name="batch"
                value={formData.batch}
                onChange={handleChange}
                required
                disabled={loadingBatches}
              >
                <option value="">
                  {loadingBatches ? "Loading batches..." : "Select Batch"}
                </option>
                {batches.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.name}
                  </option>
                ))}
              </Select>

              <Select
                label="Academic Level"
                name="level"
                value={formData.level}
                onChange={handleChange}
              >
                <option value="advanced">Advanced Level</option>
                <option value="ordinary">Ordinary Level</option>
                <option value="general">General Education</option>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Input
                label="Search Tags"
                name="tags"
                value={formData.tags}
                onChange={handleChange}
                placeholder="accounting, 2026, theory (comma separated)"
              />
              <Input
                label="Promo Video URL (YouTube)"
                name="promoVideoUrl"
                value={formData.promoVideoUrl}
                onChange={handleChange}
                placeholder="https://www.youtube.com/watch?v=..."
                icon={<VideoCameraIcon className="w-4 h-4" />}
              />
            </div>

            <Textarea
              label="Description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows={4}
              placeholder="Outline the syllabus coverage, teaching approach, and key expectations..."
            />
          </div>
        </Section>

        {/* 2. SCHEDULE & PRICING */}
        <Section
          title="Schedule & Pricing"
          subtitle="Weekly class times, tuition fee, and session cadence"
          icon={<ClockIcon className="w-5 h-5" />}
        >
          <div className="space-y-5">
            {/* Primary Schedules */}
            <div className="bg-slate-50/80 border border-slate-200/70 p-4 sm:p-5 rounded-2xl space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-brand-prussian uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-brand-cerulean" />
                  Weekly Time Slots
                </span>
                <button
                  type="button"
                  onClick={addSchedule}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-brand-cerulean hover:text-brand-prussian bg-white px-3 py-1.5 rounded-lg border border-slate-200/80 shadow-sm transition-colors"
                >
                  <PlusIcon className="w-3.5 h-3.5 stroke-[2.5]" />
                  Add Day
                </button>
              </div>

              <div className="space-y-3">
                {formData.timeSchedules.map((sch, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end bg-white p-3.5 rounded-xl border border-slate-200/70"
                  >
                    <div className="sm:col-span-4">
                      <Select
                        label="Day"
                        value={sch.day}
                        onChange={(e: any) =>
                          handleScheduleChange(idx, "day", e.target.value)
                        }
                      >
                        {Object.keys(DAY_INDEX).map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </Select>
                    </div>
                    <div className="sm:col-span-3">
                      <Input
                        label="Start Time"
                        type="time"
                        value={sch.startTime}
                        onChange={(e: any) =>
                          handleScheduleChange(idx, "startTime", e.target.value)
                        }
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <Input
                        label="End Time"
                        type="time"
                        value={sch.endTime}
                        onChange={(e: any) =>
                          handleScheduleChange(idx, "endTime", e.target.value)
                        }
                      />
                    </div>
                    <div className="sm:col-span-2 flex justify-end">
                      {formData.timeSchedules.length > 1 ? (
                        <button
                          type="button"
                          onClick={() => removeSchedule(idx)}
                          title="Remove slot"
                          className="w-full sm:w-auto h-[42px] px-3 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors flex items-center justify-center gap-1.5 text-xs font-semibold"
                        >
                          <TrashIcon className="w-4 h-4" />
                          <span className="sm:hidden">Remove</span>
                        </button>
                      ) : (
                        <span className="hidden sm:inline-block text-[11px] text-slate-400 pb-2.5 pr-1">
                          Primary
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pricing & Session Settings */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <CurrencyInput
                label="Monthly Tuition Fee"
                name="price"
                value={formData.price}
                onChange={handleChange}
                placeholder="3500"
              />
              <Input
                label="Sessions / Month"
                name="totalSessions"
                type="number"
                value={formData.totalSessions}
                onChange={handleChange}
              />
              <Input
                label="Duration (Minutes)"
                name="sessionDurationMinutes"
                type="number"
                value={formData.sessionDurationMinutes}
                onChange={handleChange}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Input
                label="First Session Date"
                name="firstSessionDate"
                type="date"
                value={formData.firstSessionDate}
                onChange={handleChange}
              />
              <Select
                label="Recurrence"
                name="recurrence"
                value={formData.recurrence}
                onChange={handleChange}
              >
                <option value="weekly">Weekly</option>
                <option value="daily">Daily</option>
                <option value="none">One-time</option>
              </Select>
            </div>
          </div>
        </Section>

        {/* 3. COVER IMAGE */}
        <Section
          title="Cover Banner"
          subtitle="Displayed on class cards and student enrollment pages"
          icon={<PhotoIcon className="w-5 h-5" />}
        >
          <div className="relative">
            {imagePreview ? (
              <div className="relative aspect-[16/6] rounded-xl overflow-hidden border border-slate-200/80 bg-slate-100 group">
                <img
                  src={imagePreview}
                  className="w-full h-full object-cover"
                  alt="Cover preview"
                />
                <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-[2px]">
                  <label className="px-4 py-2 rounded-xl bg-white text-brand-prussian text-xs font-semibold cursor-pointer hover:bg-brand-aliceBlue transition-colors shadow-sm">
                    Change Image
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={clearImage}
                    className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 transition-colors shadow-sm"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <label className="group flex flex-col items-center justify-center aspect-[16/5] min-h-[150px] bg-slate-50/80 hover:bg-brand-aliceBlue/30 rounded-xl border-2 border-dashed border-slate-300 hover:border-brand-cerulean transition-all cursor-pointer text-center p-6">
                <div className="w-11 h-11 bg-white rounded-xl shadow-sm border border-slate-200/70 flex items-center justify-center text-slate-400 group-hover:text-brand-cerulean transition-colors mb-3">
                  <PhotoIcon className="w-5 h-5" />
                </div>
                <span className="text-sm font-semibold text-brand-prussian">
                  Click to upload cover image
                </span>
                <span className="text-xs text-slate-400 mt-1">
                  JPG, PNG, or WebP up to 5MB (16:9 recommended)
                </span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            )}
          </div>
        </Section>

        {/* 4. VARIANTS & BUNDLES (ONLY FOR THEORY) */}
        {formData.type === "theory" && (
          <Section
            title="Auto-Generate Linked Classes"
            subtitle="Optionally create companion Revision or Paper classes with bundle pricing"
            icon={<SparklesIcon className="w-5 h-5" />}
          >
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label
                  className={`flex items-start gap-3.5 p-4 rounded-xl border cursor-pointer transition-all ${formData.createRevision
                      ? "border-indigo-400 bg-indigo-50/50 ring-1 ring-indigo-400/30"
                      : "border-slate-200/80 bg-slate-50/60 hover:bg-white hover:border-slate-300"
                    }`}
                >
                  <input
                    type="checkbox"
                    className="mt-0.5 w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                    name="createRevision"
                    checked={formData.createRevision}
                    onChange={handleChange}
                  />
                  <div>
                    <span className="block text-sm font-bold text-brand-prussian">
                      Include Revision Class
                    </span>
                    <span className="text-xs text-slate-500 mt-0.5 block">
                      Automatically generate and link a revision module
                    </span>
                  </div>
                </label>

                <label
                  className={`flex items-start gap-3.5 p-4 rounded-xl border cursor-pointer transition-all ${formData.createPaper
                      ? "border-amber-400 bg-amber-50/50 ring-1 ring-amber-400/30"
                      : "border-slate-200/80 bg-slate-50/60 hover:bg-white hover:border-slate-300"
                    }`}
                >
                  <input
                    type="checkbox"
                    className="mt-0.5 w-4 h-4 text-amber-600 border-slate-300 rounded focus:ring-amber-500"
                    name="createPaper"
                    checked={formData.createPaper}
                    onChange={handleChange}
                  />
                  <div>
                    <span className="block text-sm font-bold text-brand-prussian">
                      Include Paper Class
                    </span>
                    <span className="text-xs text-slate-500 mt-0.5 block">
                      Automatically generate and link a paper discussion
                    </span>
                  </div>
                </label>
              </div>

              <AnimatePresence>
                {(formData.createRevision || formData.createPaper) && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-5 overflow-hidden"
                  >
                    {/* Revision Config */}
                    {formData.createRevision && (
                      <div className="p-5 rounded-2xl bg-indigo-50/40 border border-indigo-200/70 space-y-4">
                        <h3 className="text-xs font-bold text-indigo-900 uppercase tracking-wider">
                          Revision Schedule & Fee
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                          <div className="md:col-span-4">
                            <CurrencyInput
                              label="Revision Fee"
                              name="revisionPrice"
                              value={formData.revisionPrice}
                              onChange={handleChange}
                              placeholder={formData.price || "0"}
                              className="bg-white border-indigo-200"
                            />
                          </div>
                          <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <Select
                              label="Day"
                              name="revisionDay"
                              value={formData.revisionDay}
                              onChange={handleChange}
                              className="bg-white border-indigo-200"
                            >
                              {Object.keys(DAY_INDEX).map((d) => (
                                <option key={d} value={d}>
                                  {d}
                                </option>
                              ))}
                            </Select>
                            <Input
                              label="Start"
                              name="revisionStartTime"
                              type="time"
                              value={formData.revisionStartTime}
                              onChange={handleChange}
                              className="bg-white border-indigo-200"
                            />
                            <Input
                              label="End"
                              name="revisionEndTime"
                              type="time"
                              value={formData.revisionEndTime}
                              onChange={handleChange}
                              className="bg-white border-indigo-200"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Paper Config */}
                    {formData.createPaper && (
                      <div className="p-5 rounded-2xl bg-amber-50/40 border border-amber-200/70 space-y-4">
                        <h3 className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                          Paper Class Schedule & Fee
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                          <div className="md:col-span-4">
                            <CurrencyInput
                              label="Paper Fee"
                              name="paperPrice"
                              value={formData.paperPrice}
                              onChange={handleChange}
                              placeholder={formData.price || "0"}
                              className="bg-white border-amber-200"
                            />
                          </div>
                          <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <Select
                              label="Day"
                              name="paperDay"
                              value={formData.paperDay}
                              onChange={handleChange}
                              className="bg-white border-amber-200"
                            >
                              {Object.keys(DAY_INDEX).map((d) => (
                                <option key={d} value={d}>
                                  {d}
                                </option>
                              ))}
                            </Select>
                            <Input
                              label="Start"
                              name="paperStartTime"
                              type="time"
                              value={formData.paperStartTime}
                              onChange={handleChange}
                              className="bg-white border-amber-200"
                            />
                            <Input
                              label="End"
                              name="paperEndTime"
                              type="time"
                              value={formData.paperEndTime}
                              onChange={handleChange}
                              className="bg-white border-amber-200"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Bundle Pricing */}
                    <div className="p-5 rounded-2xl bg-emerald-50/40 border border-emerald-200/70 space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                          <TagIcon className="w-4 h-4 text-emerald-600" />
                          Bundle Package Pricing
                        </h3>
                        <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-100 px-2.5 py-0.5 rounded-full">
                          Optional
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {formData.createRevision && (
                          <CurrencyInput
                            label="Theory + Revision"
                            name="bundlePriceRevision"
                            value={formData.bundlePriceRevision}
                            onChange={handleChange}
                            placeholder={(
                              Number(formData.price) +
                              Number(formData.revisionPrice || 0)
                            ).toString()}
                            className="bg-white border-emerald-200"
                          />
                        )}
                        {formData.createPaper && (
                          <CurrencyInput
                            label="Theory + Paper"
                            name="bundlePricePaper"
                            value={formData.bundlePricePaper}
                            onChange={handleChange}
                            placeholder={(
                              Number(formData.price) +
                              Number(formData.paperPrice || 0)
                            ).toString()}
                            className="bg-white border-emerald-200"
                          />
                        )}
                        {formData.createRevision && formData.createPaper && (
                          <CurrencyInput
                            label="Full Bundle (All 3)"
                            name="bundlePriceFull"
                            value={formData.bundlePriceFull}
                            onChange={handleChange}
                            placeholder={(
                              Number(formData.price) +
                              Number(formData.revisionPrice || 0) +
                              Number(formData.paperPrice || 0)
                            ).toString()}
                            className="bg-white border-emerald-300 font-bold text-emerald-800"
                          />
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </Section>
        )}

        {/* FOOTER ACTIONS */}
        <div className="fixed bottom-16 md:bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-md border-t border-slate-200/80 md:static md:bg-transparent md:backdrop-blur-none md:border-none md:p-0 flex items-center justify-end gap-3 z-40 md:z-auto">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="hidden md:inline-flex px-6 py-2.5 rounded-xl text-sm font-semibold text-slate-600 bg-white border border-slate-200/80 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="w-full md:w-auto inline-flex items-center justify-center gap-2 bg-brand-prussian hover:bg-brand-cerulean text-white px-7 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm hover:shadow-md active:scale-[0.98]"
          >
            <EyeIcon className="w-4 h-4" />
            <span>Review & Create</span>
          </button>
        </div>
      </form>

      {/* --- CONFIRMATION MODAL --- */}
      <AnimatePresence>
        {showPreview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, y: 12 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 12 }}
              transition={{ duration: 0.18 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200/70 flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center shrink-0">
                <div>
                  <h3 className="text-base font-bold text-brand-prussian">
                    Confirm Class Details
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Review your configuration before publishing.
                  </p>
                </div>
                <button
                  onClick={() => !isSaving && setShowPreview(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-4 overflow-y-auto flex-1">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/70 flex items-center gap-4">
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      className="w-16 h-16 object-cover rounded-xl border border-slate-200 shrink-0"
                      alt="Cover"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-brand-aliceBlue text-brand-cerulean flex items-center justify-center shrink-0">
                      <AcademicCapIcon className="w-7 h-7" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <h4 className="font-bold text-brand-prussian text-base truncate">
                      {formData.name}
                    </h4>
                    <div className="flex flex-wrap items-center gap-1.5 mt-1">
                      <span className="text-[11px] font-semibold bg-brand-aliceBlue text-brand-cerulean px-2 py-0.5 rounded-md">
                        {selectedBatchName}
                      </span>
                      <span className="text-xs text-slate-500 capitalize">
                        {formData.type} • {formData.level} Level
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="p-3.5 rounded-xl border border-slate-200/70 bg-white">
                    <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider block mb-1.5">
                      Schedule
                    </span>
                    <div className="space-y-1">
                      {formData.timeSchedules.map((sch, i) => (
                        <p key={i} className="text-xs font-semibold text-brand-prussian">
                          {sch.day}s •{" "}
                          <span className="font-normal text-slate-600 tabular-nums">
                            {sch.startTime}–{sch.endTime}
                          </span>
                        </p>
                      ))}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl border border-slate-200/70 bg-white">
                    <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider block mb-1.5">
                      Tuition Fee
                    </span>
                    <p className="text-lg font-bold text-emerald-700 tabular-nums">
                      LKR {Number(formData.price || 0).toLocaleString()}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5 capitalize">
                      {formData.totalSessions} sessions • {formData.recurrence}
                    </p>
                  </div>
                </div>

                {selectedParentName && (
                  <div className="p-3.5 bg-blue-50/70 rounded-xl border border-blue-200/70 text-blue-800 text-xs flex items-center gap-2">
                    <LinkIcon className="w-4 h-4 shrink-0" />
                    <span>
                      Linked to Parent Theory: <strong>{selectedParentName}</strong>
                    </span>
                  </div>
                )}

                {formData.type === "theory" &&
                  (formData.createRevision || formData.createPaper) && (
                    <div className="p-3.5 bg-indigo-50/50 rounded-xl border border-indigo-200/70 space-y-1.5">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-indigo-900">
                        Auto-Generated Companion Classes
                      </p>
                      {formData.createRevision && (
                        <p className="text-xs text-indigo-800">
                          • <strong>Revision:</strong> {formData.revisionDay}s (
                          {formData.revisionStartTime}–{formData.revisionEndTime}) — LKR{" "}
                          {Number(formData.revisionPrice || formData.price || 0).toLocaleString()}
                        </p>
                      )}
                      {formData.createPaper && (
                        <p className="text-xs text-amber-800">
                          • <strong>Paper Class:</strong> {formData.paperDay}s (
                          {formData.paperStartTime}–{formData.paperEndTime}) — LKR{" "}
                          {Number(formData.paperPrice || formData.price || 0).toLocaleString()}
                        </p>
                      )}
                    </div>
                  )}
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/60 flex justify-end gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowPreview(false)}
                  disabled={isSaving}
                  className="px-5 py-2.5 rounded-xl font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-colors text-xs"
                >
                  Edit Details
                </button>
                <button
                  type="button"
                  onClick={handleFinalSubmit}
                  disabled={isSaving}
                  className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-white bg-brand-prussian hover:bg-brand-cerulean shadow-sm transition-all text-xs disabled:opacity-60"
                >
                  {isSaving ? (
                    <>
                      <ArrowPathIcon className="w-4 h-4 animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircleIcon className="w-4 h-4" />
                      <span>Confirm & Create</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- SUB-COMPONENTS ---

const Section = ({
  title,
  subtitle,
  icon,
  children,
}: {
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) => (
  <section className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200/70 shadow-sm">
    <div className="flex items-center gap-3 pb-5 mb-6 border-b border-slate-100">
      <div className="w-10 h-10 rounded-xl bg-brand-aliceBlue text-brand-cerulean flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div>
        <h2 className="text-base font-bold text-brand-prussian">{title}</h2>
        {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
      </div>
    </div>
    {children}
  </section>
);

const Input = ({
  label,
  icon,
  className = "",
  required,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  icon?: React.ReactNode;
}) => (
  <div className="space-y-1.5">
    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
      {label} {required && <span className="text-rose-500">*</span>}
    </label>
    <div className="relative group">
      {icon && (
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-focus-within:text-brand-cerulean transition-colors">
          {icon}
        </div>
      )}
      <input
        required={required}
        {...props}
        className={`w-full ${icon ? "pl-10" : "pl-4"
          } pr-4 py-2.5 bg-slate-50 border border-slate-200/80 focus:border-brand-cerulean focus:bg-white focus:ring-2 focus:ring-brand-cerulean/20 rounded-xl outline-none transition-all text-sm font-medium text-brand-prussian placeholder:text-slate-400 ${className}`}
      />
    </div>
  </div>
);

const CurrencyInput = ({
  label,
  className = "",
  required,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) => (
  <div className="space-y-1.5">
    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
      {label} {required && <span className="text-rose-500">*</span>}
    </label>
    <div className="relative">
      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">
        LKR
      </span>
      <input
        type="number"
        required={required}
        {...props}
        className={`w-full pl-12 pr-4 py-2.5 bg-slate-50 border border-slate-200/80 focus:border-brand-cerulean focus:bg-white focus:ring-2 focus:ring-brand-cerulean/20 rounded-xl outline-none transition-all text-sm font-medium text-brand-prussian tabular-nums placeholder:text-slate-400 ${className}`}
      />
    </div>
  </div>
);

const Select = ({
  label,
  children,
  className = "",
  required,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & { label: string }) => (
  <div className="space-y-1.5">
    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
      {label} {required && <span className="text-rose-500">*</span>}
    </label>
    <div className="relative">
      <select
        required={required}
        {...props}
        className={`w-full appearance-none bg-slate-50 border border-slate-200/80 focus:border-brand-cerulean focus:bg-white focus:ring-2 focus:ring-brand-cerulean/20 rounded-xl pl-4 pr-9 py-2.5 outline-none transition-all text-sm font-medium text-brand-prussian cursor-pointer disabled:opacity-60 ${className}`}
      >
        {children}
      </select>
      <ChevronDownIcon className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
    </div>
  </div>
);

const Textarea = ({
  label,
  required,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }) => (
  <div className="space-y-1.5">
    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
      {label} {required && <span className="text-rose-500">*</span>}
    </label>
    <textarea
      required={required}
      {...props}
      className="w-full bg-slate-50 border border-slate-200/80 focus:border-brand-cerulean focus:bg-white focus:ring-2 focus:ring-brand-cerulean/20 rounded-xl px-4 py-3 outline-none transition-all text-sm font-medium text-brand-prussian resize-none placeholder:text-slate-400"
    />
  </div>
);