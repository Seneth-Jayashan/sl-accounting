import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Library,
  Search,
  X,
  RefreshCw,
  FileText,
  Image as ImageIcon,
  File as FileIcon,
  FileEdit,
  Presentation,
  Download,
  Eye,
  Calendar,
  HardDrive,
  Loader2,
  AlertCircle,
  BookOpen,
} from "lucide-react";
import { api } from "../../services/api";

type KBItem = {
  _id: string;
  title: string;
  description?: string;
  fileName?: string;
  fileMime?: string;
  uploadedBy?: any;
  createdAt?: string;
  category?: string;
  fileSize?: number | null;
};

const CATEGORIES = [
  "Lecture Notes",
  "Reading Materials",
  "Past Papers",
  "Assignments",
  "Other",
];

// --- HELPERS ---
const formatFileSize = (bytes?: number | null) => {
  if (!bytes || bytes <= 0) return null;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const getFileVisuals = (fileName?: string, fileMime?: string) => {
  const ext = (fileName || "").split(".").pop()?.toLowerCase() || "";
  const mime = (fileMime || "").toLowerCase();

  const isPdf = mime.includes("pdf") || ext === "pdf";
  const isImage =
    mime.startsWith("image/") ||
    ["png", "jpg", "jpeg", "gif", "webp"].includes(ext);
  const isDoc = ["doc", "docx"].includes(ext) || mime.includes("word");
  const isSlide =
    ["ppt", "pptx"].includes(ext) || mime.includes("presentation");

  if (isPdf) {
    return {
      icon: FileText,
      bg: "bg-red-50",
      text: "text-red-500",
      badge: "bg-red-50 text-red-600 border-red-100",
      label: "PDF",
      isPreviewable: true,
    };
  }
  if (isImage) {
    return {
      icon: ImageIcon,
      bg: "bg-emerald-50",
      text: "text-emerald-600",
      badge: "bg-emerald-50 text-emerald-600 border-emerald-100",
      label: "Image",
      isPreviewable: true,
    };
  }
  if (isDoc) {
    return {
      icon: FileEdit,
      bg: "bg-blue-50",
      text: "text-blue-600",
      badge: "bg-blue-50 text-blue-600 border-blue-100",
      label: ext.toUpperCase() || "DOC",
      isPreviewable: false,
    };
  }
  if (isSlide) {
    return {
      icon: Presentation,
      bg: "bg-orange-50",
      text: "text-orange-500",
      badge: "bg-orange-50 text-orange-600 border-orange-100",
      label: ext.toUpperCase() || "SLIDES",
      isPreviewable: false,
    };
  }
  return {
    icon: FileIcon,
    bg: "bg-gray-100",
    text: "text-gray-500",
    badge: "bg-gray-100 text-gray-600 border-gray-200",
    label: ext.toUpperCase() || "FILE",
    isPreviewable: false,
  };
};

const StudentKnowledgeBase: React.FC = () => {
  const [items, setItems] = useState<KBItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("All");
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Preview Modal State
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewMime, setPreviewMime] = useState<string | null>(null);
  const [previewName, setPreviewName] = useState<string | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async (q?: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(
        `/knowledge${q ? `?search=${encodeURIComponent(q)}` : ""}`
      );
      if (res.data?.success) {
        const list = (res.data.items as KBItem[]) || [];
        setItems(list);
      } else {
        setError(res.data?.message || "Failed to load materials");
      }
    } catch (err: any) {
      console.error(err);
      setError(
        err?.response?.data?.message ||
        err.message ||
        "Failed to load materials"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (id: string, fileName?: string) => {
    if (downloadingId === id) return;
    setDownloadingId(id);
    setError(null);
    try {
      const res = await api.get(`/knowledge/${id}/download`, {
        responseType: "blob",
      });
      const contentTypeHeader = res.headers["content-type"];
      const contentType =
        typeof contentTypeHeader === "string"
          ? contentTypeHeader
          : "application/octet-stream";
      const blob = new Blob([res.data], { type: contentType });
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.target = "_self";

      const disposition = res.headers["content-disposition"] as
        | string
        | undefined;
      let filename = fileName || "download";
      if (disposition) {
        const match =
          /filename\*=UTF-8''([^;\n\r]+)/.exec(disposition) ||
          /filename="?([^";]+)"?/.exec(disposition);
        if (match && match[1]) filename = decodeURIComponent(match[1]);
      }

      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => window.URL.revokeObjectURL(downloadUrl), 1500);
    } catch (err: any) {
      console.error("Download error", err);
      if (err.response?.status === 401) {
        setError("Please log in to download materials.");
      } else {
        setError(
          err?.response?.data?.message || err.message || "Download failed"
        );
      }
    } finally {
      setDownloadingId(null);
    }
  };

  const openPreview = async (it: KBItem) => {
    setError(null);
    setLoadingPreview(true);
    setPreviewName(it.title || it.fileName || "Preview");
    setPreviewOpen(true);
    try {
      const res = await api.get(`/knowledge/${it._id}/download`, {
        responseType: "blob",
      });
      const contentType = res.headers["content-type"];
      const mime =
        (typeof contentType === "string" ? contentType : it.fileMime) || "";
      const blob = new Blob([res.data], { type: mime });
      const url = window.URL.createObjectURL(blob);
      setPreviewUrl(url);
      setPreviewMime(mime as string);
      setPreviewName(it.fileName || it.title || "preview");
    } catch (err: any) {
      console.error("Preview failed", err);
      setError(err?.response?.data?.message || err.message || "Preview failed");
      setPreviewOpen(false);
    } finally {
      setLoadingPreview(false);
    }
  };

  const closePreview = () => {
    if (previewUrl) {
      window.URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setPreviewMime(null);
    setPreviewName(null);
    setPreviewOpen(false);
  };

  useEffect(() => {
    if (!previewOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closePreview();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [previewOpen, previewUrl]);

  // Category Counts
  const categoryCounts = useMemo(() => {
    const map: Record<string, number> = { All: items.length };
    CATEGORIES.forEach((c) => {
      map[c] = 0;
    });
    items.forEach((it) => {
      const cat = it.category || "Other";
      map[cat] = (map[cat] || 0) + 1;
    });
    return map;
  }, [items]);

  // Filtered List
  const filteredItems = useMemo(() => {
    const q = (search || "").trim().toLowerCase();
    return items.filter((it) => {
      const byCategory =
        filter === "All" ? true : (it.category || "Other") === filter;
      const bySearch =
        q === ""
          ? true
          : (it.title || "").toLowerCase().includes(q) ||
          (it.description || "").toLowerCase().includes(q) ||
          (it.fileName || "").toLowerCase().includes(q);
      return byCategory && bySearch;
    });
  }, [items, filter, search]);

  return (
    <div className="space-y-6 pb-24 sm:pb-10">
      {/* --- HERO BANNER --- */}
      <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-brand-prussian via-[#0d3a4b] to-brand-cerulean p-6 sm:p-8 text-white shadow-xl shadow-brand-prussian/15">
        <div className="pointer-events-none absolute -top-20 -right-16 w-72 h-72 rounded-full bg-brand-jasmine/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-1/3 w-64 h-64 rounded-full bg-white/10 blur-3xl" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-semibold text-brand-jasmine mb-3">
              <Library size={13} />
              <span>Study Archive</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Knowledge Base
            </h1>
            <p className="text-white/75 text-sm sm:text-base mt-1 max-w-xl">
              Browse, preview, and download lecture notes, past papers, and
              study guides shared for your courses.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start lg:self-auto shrink-0">
            <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl px-4 py-3 text-center min-w-[96px]">
              <p className="text-[10px] font-bold uppercase tracking-wider text-white/65">
                Resources
              </p>
              <p className="text-xl font-black text-brand-jasmine mt-0.5">
                {items.length}
              </p>
            </div>

            <button
              onClick={() => {
                setSearch("");
                setFilter("All");
                fetchItems();
              }}
              disabled={loading}
              title="Refresh Library"
              aria-label="Refresh Library"
              className="h-[62px] px-4 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/15 backdrop-blur-md text-white flex items-center justify-center gap-2 text-xs font-bold transition-colors active:scale-95 disabled:opacity-60"
            >
              <RefreshCw size={17} className={loading ? "animate-spin" : ""} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>
      </section>

      {/* --- FILTER & SEARCH TOOLBAR --- */}
      <div className="bg-white rounded-2xl p-3 sm:p-4 border border-gray-100 shadow-sm space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Category Pills */}
          <div className="flex items-center gap-1.5 bg-gray-100/80 p-1 rounded-xl overflow-x-auto scrollbar-hide">
            {["All", ...CATEGORIES].map((cat) => {
              const active = filter === cat;
              const count = categoryCounts[cat] ?? 0;
              return (
                <button
                  key={cat}
                  onClick={() => setFilter(cat)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg whitespace-nowrap transition-all ${active
                      ? "bg-white text-brand-prussian shadow-sm ring-1 ring-black/5"
                      : "text-gray-500 hover:text-gray-800"
                    }`}
                >
                  <span>{cat}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-md ${active
                        ? "bg-brand-cerulean/10 text-brand-cerulean"
                        : "bg-gray-200/70 text-gray-500"
                      }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search Input */}
          <div className="relative w-full lg:w-72 shrink-0">
            <Search
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search title or description..."
              aria-label="Search materials"
              className="w-full pl-9 pr-8 py-2.5 text-sm bg-gray-50 border border-gray-200/80 rounded-xl focus:outline-none focus:bg-white focus:border-brand-cerulean focus:ring-2 focus:ring-brand-cerulean/15 transition-all"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label="Clear search"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* --- ERROR BANNER --- */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="bg-red-50 border border-red-200/80 text-red-700 px-4 py-3.5 rounded-2xl flex items-center justify-between gap-3 text-sm font-medium"
          >
            <div className="flex items-center gap-2.5">
              <AlertCircle size={18} className="text-red-500 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => setError(null)}
              className="p-1 rounded-lg hover:bg-red-100 text-red-500 transition-colors"
              aria-label="Dismiss error"
            >
              <X size={15} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- CONTENT GRID --- */}
      {loading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm animate-pulse space-y-4"
            >
              <div className="flex justify-between">
                <div className="w-12 h-12 rounded-2xl bg-gray-100" />
                <div className="w-16 h-6 rounded-full bg-gray-100" />
              </div>
              <div className="space-y-2">
                <div className="h-5 bg-gray-200 rounded-lg w-4/5" />
                <div className="h-4 bg-gray-100 rounded-lg w-full" />
              </div>
              <div className="h-11 bg-gray-100 rounded-xl mt-4" />
            </div>
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 sm:p-16 text-center border border-dashed border-gray-200 shadow-sm flex flex-col items-center">
          <div className="w-16 h-16 bg-brand-aliceBlue text-brand-cerulean rounded-2xl flex items-center justify-center mb-4">
            <BookOpen size={30} />
          </div>
          <h3 className="text-lg sm:text-xl font-extrabold text-brand-prussian mb-1">
            {search || filter !== "All"
              ? "No Matching Materials"
              : "No Materials Available Yet"}
          </h3>
          <p className="text-sm text-gray-400 max-w-sm">
            {search || filter !== "All"
              ? "Try adjusting your search keywords or selecting another category."
              : "Study notes and documents uploaded by your instructors will appear here."}
          </p>
          {(search || filter !== "All") && (
            <button
              onClick={() => {
                setSearch("");
                setFilter("All");
              }}
              className="mt-5 px-5 py-2.5 rounded-xl bg-gray-100 text-gray-700 text-xs font-bold hover:bg-gray-200 transition-colors"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {filteredItems.map((it) => {
              const visuals = getFileVisuals(it.fileName, it.fileMime);
              const FileTypeIcon = visuals.icon;
              const sizeLabel = formatFileSize(it.fileSize);
              const dateLabel = it.createdAt
                ? new Date(it.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })
                : "";
              const isDownloading = downloadingId === it._id;

              return (
                <motion.article
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.25 }}
                  key={it._id}
                  className="group bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-brand-prussian/8 hover:border-brand-cerulean/30 hover:-translate-y-1 transition-all duration-300 p-5 sm:p-6 flex flex-col justify-between gap-4"
                >
                  <div>
                    {/* Top Row: File Icon + Badges */}
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-105 ${visuals.bg} ${visuals.text}`}
                      >
                        <FileTypeIcon size={22} />
                      </div>

                      <div className="flex flex-wrap items-center justify-end gap-1.5">
                        <span className="px-2.5 py-1 rounded-full bg-brand-aliceBlue text-brand-prussian text-[10px] font-bold">
                          {it.category || "Other"}
                        </span>
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${visuals.badge}`}
                        >
                          {visuals.label}
                        </span>
                      </div>
                    </div>

                    {/* Title & Description */}
                    <h3 className="text-base sm:text-lg font-extrabold text-brand-prussian leading-snug line-clamp-2 group-hover:text-brand-cerulean transition-colors">
                      {it.title}
                    </h3>

                    {it.description && (
                      <p className="text-xs sm:text-sm text-gray-500 line-clamp-2 mt-1.5 leading-relaxed">
                        {it.description}
                      </p>
                    )}

                    {/* Meta Info */}
                    <div className="flex flex-wrap items-center gap-3 text-[11px] font-medium text-gray-400 mt-4">
                      {dateLabel && (
                        <span className="inline-flex items-center gap-1">
                          <Calendar size={12} />
                          {dateLabel}
                        </span>
                      )}
                      {sizeLabel && (
                        <>
                          <span className="text-gray-300">•</span>
                          <span className="inline-flex items-center gap-1">
                            <HardDrive size={12} />
                            {sizeLabel}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Action Footer */}
                  <div className="pt-4 border-t border-gray-100 flex items-center gap-2.5">
                    <button
                      onClick={() => handleDownload(it._id, it.fileName)}
                      disabled={isDownloading}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand-prussian hover:bg-brand-cerulean text-white font-bold text-xs sm:text-sm transition-all shadow-sm active:scale-[0.98] disabled:opacity-60"
                    >
                      {isDownloading ? (
                        <>
                          <Loader2 size={15} className="animate-spin" />
                          <span>Downloading...</span>
                        </>
                      ) : (
                        <>
                          <Download size={15} />
                          <span>Download</span>
                        </>
                      )}
                    </button>

                    {visuals.isPreviewable && (
                      <button
                        onClick={() => openPreview(it)}
                        className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-brand-aliceBlue/70 hover:bg-brand-aliceBlue text-brand-prussian font-bold text-xs sm:text-sm transition-colors active:scale-[0.98] shrink-0"
                        title="Quick Preview"
                      >
                        <Eye size={15} />
                        <span>Preview</span>
                      </button>
                    )}
                  </div>
                </motion.article>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* --- PREVIEW MODAL --- */}
      <AnimatePresence>
        {previewOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closePreview}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-6"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-gray-100"
            >
              {/* Modal Header */}
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-4 bg-gray-50/70 shrink-0">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-brand-cerulean/10 text-brand-cerulean flex items-center justify-center shrink-0">
                    <Eye size={16} />
                  </div>
                  <h3 className="text-sm font-extrabold text-brand-prussian truncate">
                    {previewName || "Document Preview"}
                  </h3>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {previewUrl && (
                    <a
                      href={previewUrl}
                      download={previewName || "file"}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand-prussian hover:bg-brand-cerulean text-white text-xs font-bold transition-colors"
                    >
                      <Download size={14} />
                      <span className="hidden sm:inline">Download</span>
                    </a>
                  )}
                  <button
                    aria-label="Close preview"
                    onClick={closePreview}
                    className="w-9 h-9 rounded-xl bg-white border border-gray-200 hover:bg-gray-100 text-gray-600 flex items-center justify-center transition-colors"
                  >
                    <X size={17} />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-auto p-4 bg-gray-100/60 flex items-center justify-center min-h-[360px]">
                {loadingPreview ? (
                  <div className="flex flex-col items-center gap-3 text-gray-500 py-16">
                    <Loader2
                      size={32}
                      className="animate-spin text-brand-cerulean"
                    />
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                      Loading preview...
                    </p>
                  </div>
                ) : previewUrl ? (
                  previewMime && previewMime.startsWith("image/") ? (
                    <img
                      src={previewUrl}
                      alt={previewName || "preview"}
                      className="max-w-full max-h-[72vh] object-contain rounded-2xl shadow-sm bg-white"
                    />
                  ) : (
                    <iframe
                      src={previewUrl}
                      title={previewName || "preview"}
                      className="w-full h-[72vh] rounded-2xl border border-gray-200 bg-white"
                    />
                  )
                ) : (
                  <div className="text-center py-12 text-red-500 text-sm font-semibold">
                    Preview not available for this file.
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StudentKnowledgeBase;