import React, { useEffect, useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  CheckCircle2,
  Image as ImageIcon,
  Loader2,
  ListVideo,
  RefreshCw,
  Eye,
  EyeOff,
  PlayCircle,
  Clock,
  Paperclip,
  UploadCloud,
  FileText,
  AlertTriangle,
  Filter,
  ChevronDown,
  Video,
} from "lucide-react";
import LessonPackService, {
  type LessonPackData,
  type PlaylistItem,
} from "../../../services/LessonPackService";
import BatchService from "../../../services/BatchService";

// --- Helpers ---

const extractYoutubeId = (url: string) => {
  if (!url) return null;
  const regExp =
    /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
};

const formatUploadUrl = (path?: string | null) => {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  let baseUrl =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api/v1";
  baseUrl = baseUrl.replace(/\/api\/v1\/?$/, "");
  const cleanPath = path.replace(/\\/g, "/").replace(/^\/+/, "");
  return `${baseUrl}/${cleanPath}`;
};

const getSmartCoverUrl = (pack: any) => {
  if (pack.coverImage) {
    return formatUploadUrl(pack.coverImage);
  }
  if (pack.videos && pack.videos.length > 0) {
    const ytId =
      pack.videos[0].youtubeId || extractYoutubeId(pack.videos[0].youtubeUrl);
    if (ytId) return `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg`;
  }
  return null;
};

// --- Skeleton Loader ---

function LessonPacksSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-28 bg-white rounded-2xl border border-slate-100 p-6"
          >
            <div className="h-3 w-24 bg-slate-200 rounded mb-4" />
            <div className="h-7 w-16 bg-slate-200 rounded" />
          </div>
        ))}
      </div>
      <div className="h-20 bg-white rounded-2xl border border-slate-100" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white rounded-2xl border border-slate-100 overflow-hidden"
          >
            <div className="aspect-video bg-slate-100" />
            <div className="p-4 space-y-3">
              <div className="h-5 w-3/4 bg-slate-200 rounded" />
              <div className="h-4 w-1/3 bg-slate-100 rounded" />
              <div className="h-9 bg-slate-50 rounded-xl mt-4" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- Main Component ---

export default function LessonPacks() {
  const [packs, setPacks] = useState<LessonPackData[]>([]);
  const [batches, setBatches] = useState<{ _id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "visible" | "hidden">("all");
  const [batchFilter, setBatchFilter] = useState<string>("all");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);

  // Delete Confirmation Modal State
  const [deleteTarget, setDeleteTarget] = useState<LessonPackData | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    isPublished: true,
    batch: "",
    batches: [] as string[],
  });
  const [attachments, setAttachments] = useState<any[]>([]);
  const [videos, setVideos] = useState<PlaylistItem[]>([
    { title: "", youtubeUrl: "", durationMinutes: 0 },
  ]);
  const [customImage, setCustomImage] = useState<File | null>(null);
  const [customImagePreview, setCustomImagePreview] = useState<string | null>(null);
  const [existingCover, setExistingCover] = useState<string | null>(null);

  const fetchPacks = useCallback(async () => {
    try {
      setLoading(true);
      const data = await LessonPackService.getAll();
      setPacks(data || []);
    } catch {
      toast.error("Failed to load lesson packs.");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchBatches = useCallback(async () => {
    try {
      const data = await BatchService.getAllPublicBatches();
      setBatches(data.batches || []);
    } catch {
      toast.error("Failed to load batches.");
    }
  }, []);

  useEffect(() => {
    fetchPacks();
    fetchBatches();
  }, [fetchPacks, fetchBatches]);

  // Manage blob preview URL cleanly
  useEffect(() => {
    if (!customImage) {
      setCustomImagePreview(null);
      return;
    }
    const url = URL.createObjectURL(customImage);
    setCustomImagePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [customImage]);

  // Derived KPI Stats
  const stats = useMemo(() => {
    const visible = packs.filter((p) => p.isPublished).length;
    const totalVideos = packs.reduce(
      (sum, p) => sum + (p.videos?.length || 0),
      0
    );
    return {
      total: packs.length,
      visible,
      hidden: packs.length - visible,
      totalVideos,
    };
  }, [packs]);

  const batchMap = useMemo(() => {
    const map: Record<string, string> = {};
    batches.forEach((b) => {
      map[b._id] = b.name;
    });
    return map;
  }, [batches]);

  // Filtered Packs
  const filteredPacks = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return packs.filter((pack: any) => {
      if (statusFilter === "visible" && !pack.isPublished) return false;
      if (statusFilter === "hidden" && pack.isPublished) return false;

      if (batchFilter !== "all") {
        const packBatches: string[] = Array.isArray(pack.batches)
          ? pack.batches.map((b: any) => (typeof b === "string" ? b : b._id))
          : pack.batch
            ? [typeof pack.batch === "string" ? pack.batch : pack.batch._id]
            : [];
        if (!packBatches.includes(batchFilter)) return false;
      }

      if (!q) return true;
      return (
        pack.title.toLowerCase().includes(q) ||
        (pack.description || "").toLowerCase().includes(q)
      );
    });
  }, [packs, searchTerm, statusFilter, batchFilter]);

  const modalTotalMinutes = useMemo(
    () =>
      videos.reduce((sum, v) => sum + (Number(v.durationMinutes) || 0), 0),
    [videos]
  );

  // --- Handlers ---
  const openModal = async (packId?: string) => {
    setIsModalOpen(true);
    setCustomImage(null);
    setExistingCover(null);

    if (packId) {
      setEditingId(packId);
      setLoadingDetails(true);
      try {
        const fullPack = await LessonPackService.getById(packId);
        const normalizedBatches =
          Array.isArray((fullPack as any).batches) &&
            (fullPack as any).batches.length > 0
            ? (fullPack as any).batches.map((b: any) =>
              typeof b === "string" ? b : b._id
            )
            : fullPack.batch
              ? [
                typeof fullPack.batch === "string"
                  ? fullPack.batch
                  : (fullPack.batch as any)._id,
              ]
              : [];

        setFormData({
          title: fullPack.title,
          description: fullPack.description || "",
          price: fullPack.price.toString(),
          isPublished: fullPack.isPublished,
          batch: normalizedBatches[0] || "",
          batches: normalizedBatches,
        });
        setAttachments((fullPack as any).attachments || []);
        setVideos(
          fullPack.videos && fullPack.videos.length > 0
            ? fullPack.videos
            : [{ title: "", youtubeUrl: "", durationMinutes: 0 }]
        );
        setExistingCover(fullPack.coverImage || null);
      } catch {
        toast.error("Failed to load pack details.");
        setIsModalOpen(false);
      } finally {
        setLoadingDetails(false);
      }
    } else {
      setEditingId(null);
      setFormData({
        title: "",
        description: "",
        price: "",
        isPublished: true,
        batch: "",
        batches: [],
      });
      setAttachments([]);
      setVideos([{ title: "", youtubeUrl: "", durationMinutes: 0 }]);
    }
  };

  const closeModal = () => {
    if (isSubmitting) return;
    setIsModalOpen(false);
    setEditingId(null);
  };

  // Video Array Handlers
  const addVideo = () => {
    setVideos((prev) => [
      ...prev,
      { title: "", youtubeUrl: "", durationMinutes: 0 },
    ]);
  };

  const removeVideo = (index: number) => {
    if (videos.length <= 1) return;
    setVideos((prev) => prev.filter((_, i) => i !== index));
  };

  const updateVideo = (
    index: number,
    field: keyof PlaylistItem,
    value: any
  ) => {
    setVideos((prev) =>
      prev.map((vid, i) => (i === index ? { ...vid, [field]: value } : vid))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return toast.error("Title is required.");
    const selectedBatches =
      formData.batches.length > 0
        ? formData.batches
        : formData.batch
          ? [formData.batch]
          : [];
    if (selectedBatches.length === 0)
      return toast.error("Select at least one batch.");
    if (videos.length === 0 || !videos[0].youtubeUrl.trim())
      return toast.error("At least one video URL is required.");

    setIsSubmitting(true);
    try {
      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        price: Number(formData.price) || 0,
        isPublished: formData.isPublished,
        videos,
        coverImageFile: customImage,
        batch: selectedBatches[0],
        batches: selectedBatches,
      };

      if (editingId) {
        await LessonPackService.update(editingId, payload);
        toast.success("Lesson Pack updated successfully!");
      } else {
        await LessonPackService.create(payload);
        toast.success("Lesson Pack created successfully!");
      }
      setIsModalOpen(false);
      setEditingId(null);
      fetchPacks();
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Failed to save lesson pack."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await LessonPackService.delete(deleteTarget._id);
      setPacks((prev) => prev.filter((p) => p._id !== deleteTarget._id));
      toast.success("Lesson Pack deleted.");
      setDeleteTarget(null);
    } catch {
      toast.error("Failed to delete lesson pack.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleTogglePublish = async (id: string) => {
    setPacks((prev) =>
      prev.map((p) => (p._id === id ? { ...p, isPublished: !p.isPublished } : p))
    );
    try {
      await LessonPackService.togglePublish(id);
    } catch {
      toast.error("Failed to update visibility.");
      fetchPacks();
    }
  };

  const handleAttachmentUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!editingId) return;
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploadingAttachment(true);
    try {
      const uploaded: any[] = [];
      for (const file of files) {
        const res = await LessonPackService.uploadAttachment(editingId, file);
        const att = (res as any).attachment || res.data;
        if (att) uploaded.push(att);
      }
      setAttachments((prev) => [...prev, ...uploaded]);
      toast.success(`${files.length} attachment(s) uploaded.`);
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || "Failed to upload attachment."
      );
    } finally {
      setUploadingAttachment(false);
      e.target.value = "";
    }
  };

  const handleRemoveAttachment = async (attId: string) => {
    if (!editingId) return;
    try {
      await LessonPackService.deleteAttachment(editingId, attId);
      setAttachments((prev) => prev.filter((a) => a._id !== attId));
      toast.success("Attachment removed.");
    } catch {
      toast.error("Failed to remove attachment.");
    }
  };

  // Resolve cover preview inside modal
  const modalCoverPreview =
    customImagePreview ||
    formatUploadUrl(existingCover) ||
    (videos[0]?.youtubeUrl && extractYoutubeId(videos[0].youtubeUrl)
      ? `https://img.youtube.com/vi/${extractYoutubeId(
        videos[0].youtubeUrl
      )}/maxresdefault.jpg`
      : null);

  return (
    <div className="space-y-6 md:space-y-8 pb-24 md:pb-12">
      {/* HEADER */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-brand-prussian tracking-tight">
            Lesson Packs
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Curate video playlists, attach study notes, and manage student access.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={fetchPacks}
            disabled={loading}
            title="Refresh library"
            className="p-2.5 bg-white rounded-xl border border-slate-200/80 shadow-sm text-slate-600 hover:text-brand-cerulean hover:border-brand-cerulean/40 transition-colors disabled:opacity-50"
          >
            <RefreshCw
              className={`w-4 h-4 ${loading ? "animate-spin text-brand-cerulean" : ""
                }`}
            />
          </button>

          <button
            onClick={() => openModal()}
            className="inline-flex items-center gap-2 bg-brand-prussian hover:bg-brand-cerulean text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-sm hover:shadow-md active:scale-[0.98] transition-all"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Playlist</span>
          </button>
        </div>
      </header>

      {/* LOADING SKELETON */}
      {loading && packs.length === 0 ? (
        <LessonPacksSkeleton />
      ) : (
        <div className="space-y-6">
          {/* KPI SUMMARY CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="relative overflow-hidden bg-white p-6 rounded-2xl border border-slate-200/70 shadow-sm">
              <div className="pointer-events-none absolute -top-10 -right-10 w-24 h-24 rounded-full bg-blue-500/10 blur-2xl" />
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Total Packs
                  </p>
                  <h3 className="text-3xl font-bold text-brand-prussian mt-2 tabular-nums">
                    {stats.total}
                  </h3>
                </div>
                <div className="p-3 rounded-xl bg-blue-50 text-blue-600 ring-1 ring-blue-100">
                  <ListVideo className="w-5 h-5" />
                </div>
              </div>
            </div>

            <div className="relative overflow-hidden bg-white p-6 rounded-2xl border border-slate-200/70 shadow-sm">
              <div className="pointer-events-none absolute -top-10 -right-10 w-24 h-24 rounded-full bg-emerald-500/10 blur-2xl" />
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Visible
                  </p>
                  <h3 className="text-3xl font-bold text-brand-prussian mt-2 tabular-nums">
                    {stats.visible}
                  </h3>
                </div>
                <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
                  <Eye className="w-5 h-5" />
                </div>
              </div>
            </div>

            <div className="relative overflow-hidden bg-white p-6 rounded-2xl border border-slate-200/70 shadow-sm">
              <div className="pointer-events-none absolute -top-10 -right-10 w-24 h-24 rounded-full bg-slate-500/10 blur-2xl" />
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Hidden
                  </p>
                  <h3 className="text-3xl font-bold text-brand-prussian mt-2 tabular-nums">
                    {stats.hidden}
                  </h3>
                </div>
                <div className="p-3 rounded-xl bg-slate-100 text-slate-600 ring-1 ring-slate-200">
                  <EyeOff className="w-5 h-5" />
                </div>
              </div>
            </div>

            <div className="relative overflow-hidden bg-white p-6 rounded-2xl border border-slate-200/70 shadow-sm">
              <div className="pointer-events-none absolute -top-10 -right-10 w-24 h-24 rounded-full bg-purple-500/10 blur-2xl" />
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Total Videos
                  </p>
                  <h3 className="text-3xl font-bold text-brand-prussian mt-2 tabular-nums">
                    {stats.totalVideos}
                  </h3>
                </div>
                <div className="p-3 rounded-xl bg-purple-50 text-purple-600 ring-1 ring-purple-100">
                  <PlayCircle className="w-5 h-5" />
                </div>
              </div>
            </div>
          </div>

          {/* SEARCH & FILTER TOOLBAR */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/70 shadow-sm space-y-3.5">
            <div className="flex flex-col md:flex-row gap-3">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search playlists by title or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-sm text-slate-700 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-cerulean/20 focus:border-brand-cerulean transition-all"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Batch Filter */}
              {batches.length > 0 && (
                <div className="relative md:w-56">
                  <Filter className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <select
                    value={batchFilter}
                    onChange={(e) => setBatchFilter(e.target.value)}
                    className="w-full appearance-none pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-sm font-medium text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-cerulean/20 focus:border-brand-cerulean cursor-pointer transition-all"
                  >
                    <option value="all">All Batches</option>
                    {batches.map((b) => (
                      <option key={b._id} value={b._id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              )}
            </div>

            {/* Status Filter Pills */}
            <div className="flex items-center gap-1.5">
              {(
                [
                  { key: "all", label: "All", count: stats.total },
                  { key: "visible", label: "Visible", count: stats.visible },
                  { key: "hidden", label: "Hidden", count: stats.hidden },
                ] as const
              ).map((tab) => {
                const active = statusFilter === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setStatusFilter(tab.key)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${active
                        ? "bg-brand-prussian text-white shadow-sm"
                        : "bg-slate-50 text-slate-600 hover:bg-brand-aliceBlue hover:text-brand-cerulean"
                      }`}
                  >
                    <span>{tab.label}</span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] tabular-nums ${active
                          ? "bg-white/20 text-white"
                          : "bg-slate-200/70 text-slate-500"
                        }`}
                    >
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* PLAYLISTS GRID */}
          {filteredPacks.length === 0 ? (
            <div className="bg-white rounded-2xl p-16 text-center border border-dashed border-slate-200 flex flex-col items-center">
              <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mb-3 border border-slate-100">
                <ListVideo className="w-7 h-7 text-slate-300" />
              </div>
              <h3 className="text-sm font-semibold text-brand-prussian">
                {packs.length === 0
                  ? "No lesson packs created yet"
                  : "No matching playlists"}
              </h3>
              <p className="text-xs text-slate-400 mt-1 max-w-xs">
                {packs.length === 0
                  ? "Bundle YouTube lessons together and publish them as structured lesson packs."
                  : "Try adjusting your search query, batch filter, or visibility tab."}
              </p>
              {packs.length === 0 && (
                <button
                  onClick={() => openModal()}
                  className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-aliceBlue text-brand-cerulean text-xs font-semibold hover:bg-brand-cerulean hover:text-white transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Create First Playlist
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              <AnimatePresence mode="popLayout">
                {filteredPacks.map((pack: any) => {
                  const coverUrl = getSmartCoverUrl(pack);
                  const videoCount = pack.videos?.length || 0;
                  const totalMins = (pack.videos || []).reduce(
                    (s: number, v: any) => s + (Number(v.durationMinutes) || 0),
                    0
                  );
                  const packBatchIds: string[] = Array.isArray(pack.batches)
                    ? pack.batches.map((b: any) =>
                      typeof b === "string" ? b : b._id
                    )
                    : pack.batch
                      ? [
                        typeof pack.batch === "string"
                          ? pack.batch
                          : pack.batch._id,
                      ]
                      : [];

                  return (
                    <motion.article
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.96 }}
                      transition={{ duration: 0.18 }}
                      key={pack._id}
                      className="group bg-white rounded-2xl border border-slate-200/70 hover:border-brand-cerulean/40 overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col"
                    >
                      {/* Thumbnail */}
                      <div className="aspect-video relative bg-slate-100 overflow-hidden flex items-center justify-center">
                        {coverUrl ? (
                          <img
                            src={coverUrl}
                            alt={pack.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <ListVideo className="w-9 h-9 text-slate-300" />
                        )}

                        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-slate-900/60 to-transparent" />

                        {/* Visibility Pill */}
                        <span
                          className={`absolute top-3 left-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold backdrop-blur-md border ${pack.isPublished
                              ? "bg-emerald-500/90 text-white border-emerald-400/50"
                              : "bg-slate-900/75 text-slate-200 border-white/15"
                            }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${pack.isPublished ? "bg-white" : "bg-slate-400"
                              }`}
                          />
                          {pack.isPublished ? "Visible" : "Hidden"}
                        </span>

                        {/* Video Count Overlay */}
                        <span className="absolute bottom-2.5 right-2.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-900/80 text-white text-[10px] font-semibold backdrop-blur-sm tabular-nums">
                          <PlayCircle className="w-3 h-3 text-brand-jasmine" />
                          {videoCount} {videoCount === 1 ? "video" : "videos"}
                        </span>
                      </div>

                      {/* Card Body */}
                      <div className="p-4 flex-1 flex flex-col">
                        <div className="flex flex-wrap items-center gap-1.5 mb-2">
                          {packBatchIds.slice(0, 2).map((bId) => (
                            <span
                              key={bId}
                              className="text-[10px] font-semibold text-brand-cerulean bg-brand-aliceBlue px-2 py-0.5 rounded-md truncate max-w-[130px]"
                            >
                              {batchMap[bId] || "Batch"}
                            </span>
                          ))}
                          {packBatchIds.length > 2 && (
                            <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-md">
                              +{packBatchIds.length - 2}
                            </span>
                          )}
                        </div>

                        <h3
                          className="font-bold text-brand-prussian text-sm line-clamp-2 leading-snug group-hover:text-brand-cerulean transition-colors"
                          title={pack.title}
                        >
                          {pack.title}
                        </h3>

                        {pack.description && (
                          <p className="text-xs text-slate-400 line-clamp-2 mt-1">
                            {pack.description}
                          </p>
                        )}

                        <div className="flex items-center justify-between gap-2 mt-3 pt-2">
                          <span className="text-sm font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/70 px-2.5 py-0.5 rounded-lg tabular-nums">
                            LKR {Number(pack.price || 0).toLocaleString()}
                          </span>
                          {totalMins > 0 && (
                            <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 font-medium tabular-nums">
                              <Clock className="w-3 h-3" />
                              {totalMins}m
                            </span>
                          )}
                        </div>

                        {/* Card Footer Actions */}
                        <div className="mt-auto pt-3.5 mt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                          <button
                            onClick={() => handleTogglePublish(pack._id)}
                            className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${pack.isPublished
                                ? "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                : "bg-brand-aliceBlue text-brand-cerulean hover:bg-brand-cerulean hover:text-white"
                              }`}
                          >
                            {pack.isPublished ? (
                              <>
                                <EyeOff className="w-3.5 h-3.5" />
                                <span>Hide</span>
                              </>
                            ) : (
                              <>
                                <Eye className="w-3.5 h-3.5" />
                                <span>Publish</span>
                              </>
                            )}
                          </button>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => openModal(pack._id)}
                              title="Edit playlist"
                              className="p-2 text-slate-400 hover:text-brand-cerulean hover:bg-brand-aliceBlue rounded-lg transition-colors"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeleteTarget(pack)}
                              title="Delete playlist"
                              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.article>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      )}

      {/* --- ADD / EDIT PLAYLIST MODAL --- */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeModal}
              className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            />

            <motion.div
              initial={{ scale: 0.96, opacity: 0, y: 12 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0, y: 12 }}
              transition={{ duration: 0.18 }}
              className="bg-slate-50 rounded-2xl w-full max-w-2xl relative z-10 shadow-2xl border border-slate-200/70 overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-slate-200/80 flex justify-between items-center bg-white shrink-0">
                <div>
                  <h2 className="text-lg font-bold text-brand-prussian">
                    {editingId ? "Edit Lesson Pack" : "Create New Lesson Pack"}
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Configure bundle pricing, target batches, cover art, and videos.
                  </p>
                </div>
                <button
                  onClick={closeModal}
                  disabled={isSubmitting}
                  className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto flex-1 space-y-5">
                {loadingDetails ? (
                  <div className="py-20 flex flex-col items-center justify-center gap-3">
                    <Loader2 className="w-7 h-7 animate-spin text-brand-cerulean" />
                    <p className="text-xs font-medium text-slate-400">
                      Loading playlist details...
                    </p>
                  </div>
                ) : (
                  <form
                    id="playlist-form"
                    onSubmit={handleSubmit}
                    className="space-y-5"
                  >
                    {/* 1. General Details */}
                    <section className="bg-white p-5 rounded-2xl border border-slate-200/70 space-y-4 shadow-sm">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <h3 className="text-sm font-bold text-brand-prussian">
                          General Details
                        </h3>

                        {/* Visibility Switch */}
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-slate-500">
                            {formData.isPublished ? "Visible" : "Hidden"}
                          </span>
                          <button
                            type="button"
                            role="switch"
                            aria-checked={formData.isPublished}
                            onClick={() =>
                              setFormData((prev) => ({
                                ...prev,
                                isPublished: !prev.isPublished,
                              }))
                            }
                            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${formData.isPublished
                                ? "bg-brand-cerulean"
                                : "bg-slate-300"
                              }`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200 ${formData.isPublished
                                  ? "translate-x-4"
                                  : "translate-x-0"
                                }`}
                            />
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                          Bundle Title <span className="text-rose-500">*</span>
                        </label>
                        <input
                          required
                          type="text"
                          placeholder="e.g., Unit 04 — Company Financial Statements"
                          value={formData.title}
                          onChange={(e) =>
                            setFormData({ ...formData, title: e.target.value })
                          }
                          className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-4 py-2.5 text-sm font-medium text-brand-prussian placeholder:text-slate-400 focus:bg-white focus:border-brand-cerulean focus:ring-2 focus:ring-brand-cerulean/20 outline-none transition-all"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                          Description
                        </label>
                        <textarea
                          rows={2}
                          placeholder="Briefly outline what students will learn in this pack..."
                          value={formData.description}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              description: e.target.value,
                            })
                          }
                          className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-4 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:bg-white focus:border-brand-cerulean focus:ring-2 focus:ring-brand-cerulean/20 outline-none resize-none transition-all"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                            Price <span className="text-rose-500">*</span>
                          </label>
                          <div className="relative">
                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">
                              LKR
                            </span>
                            <input
                              required
                              type="number"
                              min="0"
                              placeholder="2500"
                              value={formData.price}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  price: e.target.value,
                                })
                              }
                              className="w-full pl-12 pr-4 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-sm font-bold text-brand-prussian tabular-nums focus:bg-white focus:border-brand-cerulean focus:ring-2 focus:ring-brand-cerulean/20 outline-none transition-all"
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                              Batches <span className="text-rose-500">*</span>
                            </label>
                            <span className="text-[10px] font-semibold text-brand-cerulean bg-brand-aliceBlue px-2 py-0.5 rounded-md tabular-nums">
                              {formData.batches.length} selected
                            </span>
                          </div>
                          <div className="max-h-32 overflow-y-auto bg-slate-50 border border-slate-200/80 rounded-xl p-2 space-y-1">
                            {batches.map((batch) => {
                              const checked = (formData.batches || []).includes(
                                batch._id
                              );
                              return (
                                <label
                                  key={batch._id}
                                  className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${checked
                                      ? "bg-white text-brand-prussian ring-1 ring-brand-cerulean/25 shadow-sm"
                                      : "text-slate-600 hover:bg-white/70"
                                    }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={(e) => {
                                      const current = formData.batches || [];
                                      const next = e.target.checked
                                        ? [...current, batch._id]
                                        : current.filter(
                                          (id) => id !== batch._id
                                        );
                                      setFormData({
                                        ...formData,
                                        batches: next,
                                        batch: next[0] || "",
                                      });
                                    }}
                                    className="rounded border-slate-300 text-brand-cerulean focus:ring-brand-cerulean"
                                  />
                                  <span className="truncate">{batch.name}</span>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </section>

                    {/* 2. Attachments (Edit Mode) */}
                    {editingId && (
                      <section className="bg-white p-5 rounded-2xl border border-slate-200/70 space-y-3.5 shadow-sm">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-sm font-bold text-brand-prussian flex items-center gap-2">
                              <Paperclip className="w-4 h-4 text-brand-cerulean" />
                              Downloadable Attachments
                            </h3>
                            <p className="text-xs text-slate-400 mt-0.5">
                              Upload PDF or Word study guides for enrolled students.
                            </p>
                          </div>
                          <label
                            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${uploadingAttachment
                                ? "bg-slate-100 text-slate-400 pointer-events-none"
                                : "bg-brand-aliceBlue text-brand-cerulean hover:bg-brand-cerulean hover:text-white"
                              }`}
                          >
                            {uploadingAttachment ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <UploadCloud className="w-3.5 h-3.5" />
                            )}
                            <span>
                              {uploadingAttachment ? "Uploading..." : "Upload Files"}
                            </span>
                            <input
                              type="file"
                              multiple
                              accept=".pdf,.doc,.docx"
                              onChange={handleAttachmentUpload}
                              className="hidden"
                            />
                          </label>
                        </div>

                        {attachments.length > 0 && (
                          <ul className="space-y-2 pt-2 border-t border-slate-100">
                            {attachments.map((att: any) => (
                              <li
                                key={att._id}
                                className="flex items-center justify-between gap-3 text-xs bg-slate-50 px-3.5 py-2.5 rounded-xl border border-slate-200/70"
                              >
                                <a
                                  href={att.fileUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-2 text-brand-cerulean font-semibold hover:underline truncate"
                                >
                                  <FileText className="w-4 h-4 shrink-0" />
                                  <span className="truncate">{att.name}</span>
                                </a>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveAttachment(att._id)}
                                  className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors shrink-0"
                                  title="Remove attachment"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}
                      </section>
                    )}

                    {/* 3. Cover Image */}
                    <section className="bg-white p-5 rounded-2xl border border-slate-200/70 space-y-3 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-sm font-bold text-brand-prussian">
                            Cover Image
                          </h3>
                          <p className="text-xs text-slate-400 mt-0.5">
                            Defaults to the first YouTube thumbnail if left blank.
                          </p>
                        </div>
                        {customImage && (
                          <button
                            type="button"
                            onClick={() => setCustomImage(null)}
                            className="text-xs font-semibold text-rose-600 hover:underline"
                          >
                            Remove custom
                          </button>
                        )}
                      </div>

                      <div className="aspect-[21/9] bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 hover:border-brand-cerulean flex items-center justify-center overflow-hidden relative group transition-colors">
                        {modalCoverPreview ? (
                          <img
                            src={modalCoverPreview}
                            alt="Cover preview"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="flex flex-col items-center text-slate-400">
                            <ImageIcon className="w-7 h-7 mb-1.5 opacity-60" />
                            <span className="text-xs font-semibold">
                              Upload Cover Image
                            </span>
                          </div>
                        )}

                        <label className="absolute inset-0 bg-slate-900/45 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer backdrop-blur-[2px] text-white">
                          <ImageIcon className="w-6 h-6 mb-1" />
                          <span className="text-xs font-semibold">
                            Change Cover Image
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files?.[0]) {
                                setCustomImage(e.target.files[0]);
                              }
                            }}
                          />
                        </label>
                      </div>
                    </section>

                    {/* 4. Playlist Videos */}
                    <section className="bg-white p-5 rounded-2xl border border-slate-200/70 space-y-4 shadow-sm">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <Video className="w-4 h-4 text-brand-cerulean" />
                          <h3 className="text-sm font-bold text-brand-prussian">
                            Playlist Videos ({videos.length})
                          </h3>
                        </div>
                        {modalTotalMinutes > 0 && (
                          <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg tabular-nums">
                            Total: {modalTotalMinutes} mins
                          </span>
                        )}
                      </div>

                      <div className="space-y-3">
                        {videos.map((vid, idx) => {
                          const ytId = extractYoutubeId(vid.youtubeUrl);
                          return (
                            <div
                              key={idx}
                              className="p-4 bg-slate-50/80 border border-slate-200/70 rounded-xl space-y-3"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <span className="w-6 h-6 rounded-lg bg-brand-prussian text-white text-[11px] font-bold flex items-center justify-center tabular-nums">
                                    {idx + 1}
                                  </span>
                                  <span className="text-xs font-semibold text-slate-500">
                                    Lesson #{idx + 1}
                                  </span>
                                  {ytId && (
                                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/70 px-2 py-0.5 rounded-full">
                                      Valid YouTube Link
                                    </span>
                                  )}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeVideo(idx)}
                                  disabled={videos.length === 1}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                  title="Remove video"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>

                              <div className="space-y-3">
                                <input
                                  required
                                  type="text"
                                  placeholder="Video Title (e.g., Part 1: Balance Sheet Adjustments)"
                                  value={vid.title}
                                  onChange={(e) =>
                                    updateVideo(idx, "title", e.target.value)
                                  }
                                  className="w-full bg-white border border-slate-200/80 rounded-xl px-3.5 py-2 text-sm font-medium text-brand-prussian placeholder:text-slate-400 focus:border-brand-cerulean focus:ring-2 focus:ring-brand-cerulean/20 outline-none"
                                />

                                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                                  <div className="sm:col-span-9">
                                    <input
                                      required
                                      type="url"
                                      placeholder="https://www.youtube.com/watch?v=..."
                                      value={vid.youtubeUrl}
                                      onChange={(e) =>
                                        updateVideo(
                                          idx,
                                          "youtubeUrl",
                                          e.target.value
                                        )
                                      }
                                      className="w-full bg-white border border-slate-200/80 rounded-xl px-3.5 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:border-brand-cerulean focus:ring-2 focus:ring-brand-cerulean/20 outline-none"
                                    />
                                  </div>
                                  <div className="sm:col-span-3 relative">
                                    <input
                                      type="number"
                                      min="0"
                                      placeholder="0"
                                      value={vid.durationMinutes}
                                      onChange={(e) =>
                                        updateVideo(
                                          idx,
                                          "durationMinutes",
                                          Number(e.target.value)
                                        )
                                      }
                                      className="w-full bg-white border border-slate-200/80 rounded-xl pl-3 pr-11 py-2 text-sm font-medium text-brand-prussian tabular-nums focus:border-brand-cerulean focus:ring-2 focus:ring-brand-cerulean/20 outline-none"
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-slate-400 pointer-events-none">
                                      min
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <button
                        type="button"
                        onClick={addVideo}
                        className="w-full py-3 border-2 border-dashed border-slate-300 text-slate-500 rounded-xl font-semibold text-xs hover:border-brand-cerulean hover:text-brand-cerulean hover:bg-brand-aliceBlue/25 transition-all flex items-center justify-center gap-1.5"
                      >
                        <Plus className="w-4 h-4 stroke-[2.5]" />
                        Add Another Video
                      </button>
                    </section>
                  </form>
                )}
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 border-t border-slate-200/80 bg-white flex justify-end gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={isSubmitting || loadingDetails}
                  className="px-5 py-2.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="playlist-form"
                  disabled={isSubmitting || loadingDetails}
                  className="inline-flex items-center justify-center gap-2 px-6 py-2.5 text-xs font-semibold text-white bg-brand-prussian hover:bg-brand-cerulean rounded-xl shadow-sm transition-all disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  <span>
                    {isSubmitting
                      ? "Saving..."
                      : editingId
                        ? "Save Changes"
                        : "Create Playlist"}
                  </span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- DELETE CONFIRMATION MODAL --- */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl border border-slate-200/70">
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-brand-prussian">
                  Delete lesson pack?
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  Are you sure you want to delete{" "}
                  <strong className="text-brand-prussian">
                    "{deleteTarget.title}"
                  </strong>
                  ? This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 mt-6">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={isDeleting}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors disabled:opacity-50"
              >
                {isDeleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{isDeleting ? "Deleting..." : "Delete Pack"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}