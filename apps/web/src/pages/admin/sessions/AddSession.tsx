import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import moment from "moment";
import { motion, AnimatePresence } from "framer-motion";
import ClassService from "../../../services/ClassService";
import SessionService, {
  type CreateSessionPayload,
} from "../../../services/SessionService";

import {
  ArrowLeftIcon,
  ClockIcon,
  VideoCameraIcon,
  PencilSquareIcon,
  CheckCircleIcon,
  AcademicCapIcon,
  ArrowPathIcon,
  ChevronDownIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
  CalendarDaysIcon,
} from "@heroicons/react/24/outline";

interface ClassOption {
  _id: string;
  name: string;
  sessionDurationMinutes?: number;
}

const DURATION_PRESETS = [60, 90, 120, 180];

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
      const dataArray =
        (res as any).classes ||
        (res as any).class ||
        (Array.isArray(res) ? res : []);
      setClasses(dataArray);
    } catch {
      setError("Failed to load available classes.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  const handleClassChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const clsId = e.target.value;
    const selectedClass = classes.find((c) => c._id === clsId);
    setFormData((prev) => ({
      ...prev,
      classId: clsId,
      duration: selectedClass?.sessionDurationMinutes || 120,
    }));
  };

  // Live schedule preview
  const schedulePreview = useMemo(() => {
    if (!formData.date || !formData.time) return null;
    const start = moment(`${formData.date} ${formData.time}`, "YYYY-MM-DD HH:mm");
    if (!start.isValid()) return null;
    const end = start.clone().add(Number(formData.duration) || 0, "minutes");
    return {
      dayLabel: start.format("dddd, MMM DD, YYYY"),
      timeRange: `${start.format("h:mm A")} — ${end.format("h:mm A")}`,
    };
  }, [formData.date, formData.time, formData.duration]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.classId || !formData.date) {
      return setError("Please select a class and session date.");
    }

    setSubmitting(true);
    setError(null);

    try {
      const startDateTime = moment(
        `${formData.date} ${formData.time}`,
        "YYYY-MM-DD HH:mm"
      ).toDate();

      const payload: CreateSessionPayload = {
        startAt: startDateTime,
        durationMinutes: Number(formData.duration),
        title: formData.title.trim() || undefined,
        notes: formData.notes.trim() || undefined,
        skipZoom: !formData.createZoom,
        timezone: "Asia/Colombo",
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
    <div className="max-w-3xl mx-auto space-y-6 md:space-y-8 pb-32 md:pb-16">
      {/* HEADER */}
      <header className="space-y-4">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="group inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-brand-prussian bg-white px-3.5 py-2 rounded-xl border border-slate-200/80 shadow-sm transition-all"
        >
          <ArrowLeftIcon className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
          Back to Schedule
        </button>

        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-brand-prussian tracking-tight">
            Schedule New Session
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Add a manual live session to a class module and optionally generate a Zoom link.
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

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 1. MODULE CONTEXT */}
        <FormSection
          title="Module Context"
          subtitle="Choose which class this session belongs to"
          icon={<AcademicCapIcon className="w-5 h-5" />}
        >
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
              Class Module <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <select
                name="classId"
                value={formData.classId}
                onChange={handleClassChange}
                disabled={loading}
                required
                className="w-full appearance-none bg-slate-50 border border-slate-200/80 rounded-xl pl-4 pr-10 py-2.5 text-sm font-medium text-brand-prussian focus:bg-white focus:border-brand-cerulean focus:ring-2 focus:ring-brand-cerulean/20 outline-none transition-all cursor-pointer disabled:opacity-60"
              >
                <option value="">
                  {loading ? "Loading classes..." : "Select Target Class"}
                </option>
                {classes.map((cls) => (
                  <option key={cls._id} value={cls._id}>
                    {cls.name}
                  </option>
                ))}
              </select>
              <ChevronDownIcon className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </FormSection>

        {/* 2. TIMELINE & DURATION */}
        <FormSection
          title="Timeline & Duration"
          subtitle="Set the date, start time, and session length"
          icon={<ClockIcon className="w-5 h-5" />}
        >
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Session Date"
                type="date"
                name="date"
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
                required
              />
              <Input
                label="Start Time"
                type="time"
                name="time"
                value={formData.time}
                onChange={(e) =>
                  setFormData({ ...formData, time: e.target.value })
                }
                required
              />
              <Input
                label="Duration (Mins)"
                type="number"
                name="duration"
                value={formData.duration}
                onChange={(e) =>
                  setFormData({ ...formData, duration: Number(e.target.value) })
                }
                min={15}
                required
              />
            </div>

            {/* Quick Duration Presets + Live Preview */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] font-semibold text-slate-400 mr-1">
                  Quick length:
                </span>
                {DURATION_PRESETS.map((mins) => {
                  const active = Number(formData.duration) === mins;
                  return (
                    <button
                      key={mins}
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({ ...prev, duration: mins }))
                      }
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold tabular-nums transition-all ${active
                          ? "bg-brand-prussian text-white shadow-sm"
                          : "bg-slate-100 text-slate-600 hover:bg-brand-aliceBlue hover:text-brand-cerulean"
                        }`}
                    >
                      {mins}m
                    </button>
                  );
                })}
              </div>

              {schedulePreview && (
                <div className="inline-flex items-center gap-2 text-xs font-semibold text-brand-cerulean bg-brand-aliceBlue/70 px-3 py-1.5 rounded-xl border border-brand-cerulean/15 tabular-nums">
                  <CalendarDaysIcon className="w-4 h-4 shrink-0" />
                  <span>{schedulePreview.timeRange} (LK)</span>
                </div>
              )}
            </div>
          </div>
        </FormSection>

        {/* 3. CONTENT DETAIL */}
        <FormSection
          title="Session Details"
          subtitle="Title and optional notes visible to enrolled students"
          icon={<PencilSquareIcon className="w-5 h-5" />}
        >
          <div className="space-y-4">
            <Input
              label="Session Title"
              type="text"
              placeholder="e.g., Unit 05: Cash Flow Statements"
              name="title"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              required
            />

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                Internal Notes{" "}
                <span className="text-slate-400 font-normal normal-case">
                  (Optional)
                </span>
              </label>
              <textarea
                rows={3}
                placeholder="Add instructions, homework reminders, or required materials..."
                className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-4 py-3 text-sm text-slate-700 placeholder:text-slate-400 focus:bg-white focus:border-brand-cerulean focus:ring-2 focus:ring-brand-cerulean/20 outline-none transition-all resize-none"
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
              />
            </div>
          </div>
        </FormSection>

        {/* 4. ZOOM INTEGRATION TOGGLE */}
        <div
          className={`p-5 sm:p-6 rounded-2xl border shadow-sm flex items-center justify-between gap-4 transition-colors ${formData.createZoom
              ? "bg-white border-brand-cerulean/30"
              : "bg-white border-slate-200/70"
            }`}
        >
          <div className="flex items-center gap-4">
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-colors ${formData.createZoom
                  ? "bg-brand-cerulean text-white shadow-sm shadow-brand-cerulean/25"
                  : "bg-slate-100 text-slate-400"
                }`}
            >
              <VideoCameraIcon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-brand-prussian">
                Live Zoom Meeting Sync
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                Automatically provision a Zoom meeting link for this session.
              </p>
            </div>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={formData.createZoom}
            onClick={() =>
              setFormData((prev) => ({ ...prev, createZoom: !prev.createZoom }))
            }
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${formData.createZoom ? "bg-brand-cerulean" : "bg-slate-300"
              }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ${formData.createZoom ? "translate-x-5" : "translate-x-0"
                }`}
            />
          </button>
        </div>

        {/* ACTION BAR */}
        <div className="fixed bottom-16 md:bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-md border-t border-slate-200/80 md:static md:bg-transparent md:backdrop-blur-none md:border-none md:p-0 flex items-center justify-end gap-3 z-40 md:z-auto">
          <button
            type="button"
            onClick={() => navigate(-1)}
            disabled={submitting}
            className="hidden md:inline-flex px-6 py-2.5 rounded-xl bg-white border border-slate-200/80 text-slate-600 font-semibold text-sm hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || loading}
            className="w-full md:w-auto inline-flex items-center justify-center gap-2 bg-brand-prussian hover:bg-brand-cerulean text-white px-7 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm hover:shadow-md active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <ArrowPathIcon className="w-4 h-4 animate-spin" />
                <span>Scheduling...</span>
              </>
            ) : (
              <>
                <CheckCircleIcon className="w-4 h-4" />
                <span>Confirm Schedule</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

// --- Sub-Components ---

const FormSection = ({
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
  <section className="bg-white p-6 md:p-7 rounded-2xl border border-slate-200/70 shadow-sm">
    <div className="flex items-center gap-3 pb-4 mb-5 border-b border-slate-100">
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
  required,
  className = "",
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) => (
  <div className="space-y-1.5">
    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
      {label} {required && <span className="text-rose-500">*</span>}
    </label>
    <input
      required={required}
      {...props}
      className={`w-full bg-slate-50 border border-slate-200/80 rounded-xl px-4 py-2.5 text-sm font-medium text-brand-prussian placeholder:text-slate-400 focus:bg-white focus:border-brand-cerulean focus:ring-2 focus:ring-brand-cerulean/20 outline-none transition-all tabular-nums ${className}`}
    />
  </div>
);