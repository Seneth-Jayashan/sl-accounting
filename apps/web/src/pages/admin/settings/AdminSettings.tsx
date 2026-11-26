import React, { useState, useEffect, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import {
    Save,
    Image as ImageIcon,
    Calendar,
    Link2,
    Loader2,
    RefreshCw,
    UploadCloud,
    X,
    ExternalLink,
    Megaphone,
    Clock,
} from "lucide-react";
import { toast } from "react-hot-toast";
import SettingService, {
    type SettingData,
} from "../../../services/SettingService";

// --- Skeleton Loader ---

function SettingsSkeleton() {
    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-pulse pb-16">
            <div className="flex justify-between items-center">
                <div className="space-y-2">
                    <div className="h-8 w-48 bg-slate-200 rounded-lg" />
                    <div className="h-4 w-72 bg-slate-100 rounded-md" />
                </div>
                <div className="h-10 w-24 bg-slate-100 rounded-xl" />
            </div>
            {[1, 2, 3].map((i) => (
                <div
                    key={i}
                    className="h-48 bg-white rounded-2xl border border-slate-100 p-6 space-y-4"
                >
                    <div className="h-5 w-44 bg-slate-200 rounded" />
                    <div className="h-24 bg-slate-50 rounded-xl" />
                </div>
            ))}
        </div>
    );
}

// --- Main Component ---

export default function AdminSettings() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState<SettingData>({
        examDate: null,
        heroImageUrl: null,
        newsTitle: "",
        newsLink: "",
    });

    const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);

    const fetchSettings = useCallback(async () => {
        try {
            setLoading(true);
            const res = await SettingService.getSettings();
            if (res.success && res.data) {
                let formattedDate: string | null = null;
                if (res.data.examDate) {
                    const dateObj = new Date(res.data.examDate);
                    if (!isNaN(dateObj.getTime())) {
                        formattedDate = dateObj.toISOString().split("T")[0];
                    }
                }

                setSettings({
                    ...res.data,
                    examDate: formattedDate,
                    newsTitle: res.data.newsTitle || "",
                    newsLink: res.data.newsLink || "",
                });

                setExistingImageUrl(res.data.heroImageUrl || null);
            }
        } catch {
            toast.error("Failed to load settings");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

    // Clean up object URL when selectedImage changes or unmounts
    useEffect(() => {
        if (!selectedImage) {
            setLocalPreviewUrl(null);
            return;
        }
        const url = URL.createObjectURL(selectedImage);
        setLocalPreviewUrl(url);
        return () => URL.revokeObjectURL(url);
    }, [selectedImage]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedImage(e.target.files[0]);
        }
    };

    // Live days remaining calculation
    const daysRemaining = useMemo(() => {
        if (!settings.examDate) return null;
        const target = new Date(`${settings.examDate}T00:00:00`);
        if (isNaN(target.getTime())) return null;
        const diffMs = target.getTime() - Date.now();
        return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    }, [settings.examDate]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const formData = new FormData();

            if (settings.examDate) {
                formData.append("examDate", settings.examDate);
            }
            formData.append("newsTitle", settings.newsTitle?.trim() || "");
            formData.append("newsLink", settings.newsLink?.trim() || "");

            if (selectedImage) {
                formData.append("heroImage", selectedImage);
            }

            const res = await SettingService.updateSettings(formData);
            if (res.success) {
                toast.success("Settings updated successfully");
                setSelectedImage(null);
                fetchSettings();
            } else {
                toast.error(res.message || "Failed to update settings");
            }
        } catch (error) {
            toast.error("An error occurred while saving settings");
            console.error(error);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <SettingsSkeleton />;

    const activePreview = localPreviewUrl || existingImageUrl;

    return (
        <div className="max-w-4xl mx-auto space-y-6 md:space-y-8 pb-32 md:pb-16">
            {/* HEADER */}
            <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-brand-prussian tracking-tight">
                        System Settings
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">
                        Configure global exam countdown, landing page hero banner, and news updates.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={fetchSettings}
                    disabled={loading || saving}
                    className="inline-flex items-center gap-2 self-start sm:self-auto px-4 py-2.5 bg-white rounded-xl border border-slate-200/80 shadow-sm text-xs font-semibold text-slate-600 hover:text-brand-cerulean hover:border-brand-cerulean/40 transition-colors disabled:opacity-50"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                    <span>Refresh</span>
                </button>
            </header>

            <motion.form
                onSubmit={handleSave}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
            >
                {/* 1. EXAM COUNTDOWN TIMER */}
                <section className="bg-white p-6 md:p-7 rounded-2xl border border-slate-200/70 shadow-sm space-y-5">
                    <div className="flex items-center justify-between gap-3 pb-4 border-b border-slate-100">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-brand-aliceBlue text-brand-cerulean flex items-center justify-center shrink-0">
                                <Calendar className="w-5 h-5" />
                            </div>
                            <div>
                                <h2 className="text-base font-bold text-brand-prussian">
                                    Exam Countdown Timer
                                </h2>
                                <p className="text-xs text-slate-400 mt-0.5">
                                    Displays a live countdown (e.g., දින 20 පැය 6 යි...) across student dashboards.
                                </p>
                            </div>
                        </div>

                        {daysRemaining !== null && (
                            <span
                                className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ring-1 tabular-nums shrink-0 ${daysRemaining > 0
                                        ? "bg-emerald-50 text-emerald-700 ring-emerald-600/15"
                                        : "bg-slate-100 text-slate-500 ring-slate-300/70"
                                    }`}
                            >
                                <Clock className="w-3.5 h-3.5" />
                                {daysRemaining > 0
                                    ? `${daysRemaining} days left`
                                    : "Date passed"}
                            </span>
                        )}
                    </div>

                    <div className="space-y-1.5 max-w-sm">
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                            Target Exam Date
                        </label>
                        <input
                            type="date"
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-sm font-medium text-brand-prussian tabular-nums focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-cerulean/20 focus:border-brand-cerulean transition-all"
                            value={settings.examDate || ""}
                            onChange={(e) =>
                                setSettings({ ...settings, examDate: e.target.value })
                            }
                        />
                    </div>
                </section>

                {/* 2. HOME PAGE HERO IMAGE */}
                <section className="bg-white p-6 md:p-7 rounded-2xl border border-slate-200/70 shadow-sm space-y-5">
                    <div className="flex items-center justify-between gap-3 pb-4 border-b border-slate-100">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 ring-1 ring-rose-100 flex items-center justify-center shrink-0">
                                <ImageIcon className="w-5 h-5" />
                            </div>
                            <div>
                                <h2 className="text-base font-bold text-brand-prussian">
                                    Home Page Hero Image
                                </h2>
                                <p className="text-xs text-slate-400 mt-0.5">
                                    Replace the main hero banner photo displayed on the landing page.
                                </p>
                            </div>
                        </div>

                        {selectedImage && (
                            <button
                                type="button"
                                onClick={() => setSelectedImage(null)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 text-xs font-semibold transition-colors shrink-0"
                            >
                                <X className="w-3.5 h-3.5" />
                                <span>Discard New</span>
                            </button>
                        )}
                    </div>

                    <div className="space-y-3">
                        <div className="relative aspect-[21/9] w-full rounded-2xl border-2 border-dashed border-slate-200 hover:border-brand-cerulean bg-slate-50 overflow-hidden flex items-center justify-center group transition-colors">
                            {activePreview ? (
                                <img
                                    src={activePreview}
                                    alt="Hero Banner Preview"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="flex flex-col items-center text-slate-400 p-6 text-center">
                                    <UploadCloud className="w-8 h-8 mb-2 opacity-60" />
                                    <span className="text-sm font-semibold text-brand-prussian">
                                        Upload Hero Image
                                    </span>
                                    <span className="text-xs text-slate-400 mt-0.5">
                                        Recommended: wide landscape (16:9 or 21:9)
                                    </span>
                                </div>
                            )}

                            <label className="absolute inset-0 bg-slate-900/45 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer backdrop-blur-[2px] text-white">
                                <UploadCloud className="w-6 h-6 mb-1.5" />
                                <span className="text-xs font-semibold">
                                    {activePreview ? "Change Hero Image" : "Choose Image"}
                                </span>
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleImageChange}
                                />
                            </label>
                        </div>

                        {selectedImage && (
                            <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200/70 text-xs">
                                <span className="font-semibold text-emerald-800 truncate">
                                    New image ready: {selectedImage.name}
                                </span>
                                <span className="text-emerald-600 font-medium shrink-0 ml-2">
                                    Unsaved
                                </span>
                            </div>
                        )}
                    </div>
                </section>

                {/* 3. BUSINESS & ACCOUNTING NEWS */}
                <section className="bg-white p-6 md:p-7 rounded-2xl border border-slate-200/70 shadow-sm space-y-5">
                    <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                        <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 ring-1 ring-amber-100 flex items-center justify-center shrink-0">
                            <Megaphone className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-brand-prussian">
                                Business & Accounting News
                            </h2>
                            <p className="text-xs text-slate-400 mt-0.5">
                                Highlight a featured announcement or external news link on the home page.
                            </p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                                News Headline
                            </label>
                            <input
                                type="text"
                                placeholder="e.g., Read the latest A/L Accounting syllabus updates..."
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-sm font-medium text-brand-prussian placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-cerulean/20 focus:border-brand-cerulean transition-all"
                                value={settings.newsTitle || ""}
                                onChange={(e) =>
                                    setSettings({ ...settings, newsTitle: e.target.value })
                                }
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                                Destination URL
                            </label>
                            <div className="relative">
                                <Link2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                <input
                                    type="url"
                                    placeholder="https://example.com/news"
                                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-sm text-brand-prussian placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-cerulean/20 focus:border-brand-cerulean transition-all"
                                    value={settings.newsLink || ""}
                                    onChange={(e) =>
                                        setSettings({ ...settings, newsLink: e.target.value })
                                    }
                                />
                            </div>
                        </div>

                        {/* Live News Preview */}
                        {settings.newsTitle?.trim() && (
                            <div className="p-3.5 rounded-xl bg-brand-aliceBlue/50 border border-brand-cerulean/20 flex items-center justify-between gap-3">
                                <div className="min-w-0">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-brand-cerulean">
                                        Live Banner Preview
                                    </span>
                                    <p className="text-xs font-semibold text-brand-prussian truncate mt-0.5">
                                        {settings.newsTitle}
                                    </p>
                                </div>
                                {settings.newsLink?.trim() && (
                                    <a
                                        href={settings.newsLink}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white border border-slate-200/80 text-xs font-semibold text-brand-cerulean hover:text-brand-prussian shadow-sm shrink-0 transition-colors"
                                    >
                                        <span>Test Link</span>
                                        <ExternalLink className="w-3.5 h-3.5" />
                                    </a>
                                )}
                            </div>
                        )}
                    </div>
                </section>

                {/* ACTION BAR */}
                <div className="fixed bottom-16 md:bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-md border-t border-slate-200/80 md:static md:bg-transparent md:backdrop-blur-none md:border-none md:p-0 flex items-center justify-end gap-3 z-40 md:z-auto">
                    <button
                        type="submit"
                        disabled={saving}
                        className="w-full md:w-auto inline-flex items-center justify-center gap-2 bg-brand-prussian hover:bg-brand-cerulean text-white px-7 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm hover:shadow-md active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {saving ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Saving...</span>
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4" />
                                <span>Save Settings</span>
                            </>
                        )}
                    </button>
                </div>
            </motion.form>
        </div>
    );
}