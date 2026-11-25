import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  Megaphone,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Filter,
  RefreshCw,
  Pencil,
  X,
  Search,
  ChevronDown,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Send,
} from "lucide-react";
import moment from "moment";

// Services
import AnnouncementService, {
  type AnnouncementData,
} from "../../../services/AnnouncementService";
import ClassService, { type ClassData } from "../../../services/ClassService";

// --- Skeleton Loader ---

function AnnouncementsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-28 bg-white rounded-2xl border border-slate-100 p-6">
            <div className="h-3 w-24 bg-slate-200 rounded mb-4" />
            <div className="h-7 w-16 bg-slate-200 rounded" />
          </div>
        ))}
      </div>
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-36 bg-white rounded-2xl border border-slate-100 p-6 space-y-3">
            <div className="h-4 w-32 bg-slate-200 rounded" />
            <div className="h-5 w-2/3 bg-slate-200 rounded" />
            <div className="h-4 w-full bg-slate-100 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

// --- Main Component ---

export default function AnnouncementsAdmin() {
  const [announcements, setAnnouncements] = useState<AnnouncementData[]>([]);
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterClass, setFilterClass] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "hidden">("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Modal & Action States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AnnouncementData | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    classId: "",
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [annRes, classRes] = await Promise.all([
        AnnouncementService.getAllAnnouncements(filterClass),
        ClassService.getAllClasses(),
      ]);

      setAnnouncements(Array.isArray(annRes.data) ? annRes.data : []);

      if (classRes && classRes.classes) {
        setClasses(classRes.classes);
      } else if (Array.isArray(classRes)) {
        setClasses(classRes);
      }
    } catch (err) {
      console.error("Sync Error:", err);
    } finally {
      setLoading(false);
    }
  }, [filterClass]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Derived KPI Stats
  const stats = useMemo(() => {
    const published = announcements.filter((a) => a.isPublished).length;
    return {
      total: announcements.length,
      published,
      hidden: announcements.length - published,
    };
  }, [announcements]);

  // Client-side filtered list
  const filteredAnnouncements = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return announcements.filter((ann) => {
      if (statusFilter === "published" && !ann.isPublished) return false;
      if (statusFilter === "hidden" && ann.isPublished) return false;
      if (!q) return true;

      return (
        ann.title.toLowerCase().includes(q) ||
        ann.content.toLowerCase().includes(q) ||
        (ann.classDetails?.name || "").toLowerCase().includes(q)
      );
    });
  }, [announcements, statusFilter, searchQuery]);

  // --- Handlers ---

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({ title: "", content: "", classId: filterClass || "" });
    setIsModalOpen(true);
  };

  const handleEditClick = (ann: AnnouncementData) => {
    setEditingId(ann._id);
    setFormData({
      title: ann.title,
      content: ann.content,
      classId:
        ann.class && typeof ann.class === "object"
          ? (ann.class as any)._id
          : (ann.class as string),
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({ title: "", content: "", classId: "" });
  };

  const handleToggleVisibility = async (id: string) => {
    setTogglingId(id);
    try {
      await AnnouncementService.toggleVisibility(id);
      setAnnouncements((prev) =>
        prev.map((ann) =>
          ann._id === id ? { ...ann, isPublished: !ann.isPublished } : ann
        )
      );
    } catch {
      alert("Failed to update visibility");
    } finally {
      setTogglingId(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await AnnouncementService.deleteAnnouncement(deleteTarget._id);
      setAnnouncements((prev) => prev.filter((ann) => ann._id !== deleteTarget._id));
      setDeleteTarget(null);
    } catch {
      alert("Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.classId) return alert("Please select a class");

    setSaving(true);
    try {
      if (editingId) {
        await AnnouncementService.updateAnnouncement(editingId, formData);
      } else {
        await AnnouncementService.createAnnouncement(formData);
      }
      setIsModalOpen(false);
      setEditingId(null);
      setFormData({ title: "", content: "", classId: "" });
      loadData();
    } catch {
      alert(editingId ? "Update failed" : "Creation failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 md:space-y-8 pb-24 md:pb-12">
      {/* HEADER */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-brand-prussian tracking-tight">
            Class Announcements
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Broadcast schedules, exam updates, and notices to specific classes.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={loadData}
            disabled={loading}
            title="Refresh"
            className="p-2.5 bg-white rounded-xl border border-slate-200/80 shadow-sm text-slate-600 hover:text-brand-cerulean hover:border-brand-cerulean/40 transition-colors disabled:opacity-50"
          >
            <RefreshCw
              className={`w-4 h-4 ${loading ? "animate-spin text-brand-cerulean" : ""}`}
            />
          </button>

          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 bg-brand-prussian hover:bg-brand-cerulean text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-sm hover:shadow-md active:scale-[0.98] transition-all"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>New Announcement</span>
          </button>
        </div>
      </header>

      {/* LOADING SKELETON */}
      {loading && announcements.length === 0 ? (
        <AnnouncementsSkeleton />
      ) : (
        <div className="space-y-6">
          {/* KPI SUMMARY CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="relative overflow-hidden bg-white p-6 rounded-2xl border border-slate-200/70 shadow-sm">
              <div className="pointer-events-none absolute -top-10 -right-10 w-24 h-24 rounded-full bg-blue-500/10 blur-2xl" />
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Total Broadcasts
                  </p>
                  <h3 className="text-3xl font-bold text-brand-prussian mt-2 tabular-nums">
                    {stats.total}
                  </h3>
                </div>
                <div className="p-3 rounded-xl bg-blue-50 text-blue-600 ring-1 ring-blue-100">
                  <Megaphone className="w-5 h-5" />
                </div>
              </div>
            </div>

            <div className="relative overflow-hidden bg-white p-6 rounded-2xl border border-slate-200/70 shadow-sm">
              <div className="pointer-events-none absolute -top-10 -right-10 w-24 h-24 rounded-full bg-emerald-500/10 blur-2xl" />
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Published
                  </p>
                  <h3 className="text-3xl font-bold text-brand-prussian mt-2 tabular-nums">
                    {stats.published}
                  </h3>
                </div>
                <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
                  <CheckCircle2 className="w-5 h-5" />
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
          </div>

          {/* FILTER & SEARCH BAR */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/70 shadow-sm space-y-3.5">
            <div className="flex flex-col md:flex-row gap-3">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search announcements by subject or content..."
                  className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-sm text-slate-700 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-cerulean/20 focus:border-brand-cerulean transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Class Dropdown */}
              <div className="relative md:w-64">
                <Filter className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-sm font-medium text-slate-700 focus:bg-white focus:ring-2 focus:ring-brand-cerulean/20 focus:border-brand-cerulean outline-none appearance-none cursor-pointer transition-all"
                  value={filterClass}
                  onChange={(e) => setFilterClass(e.target.value)}
                >
                  <option value="">All Academic Classes</option>
                  {classes.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Status Filter Pills */}
            <div className="flex items-center gap-1.5">
              {(
                [
                  { key: "all", label: "All", count: stats.total },
                  { key: "published", label: "Published", count: stats.published },
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

          {/* ANNOUNCEMENTS LIST */}
          {filteredAnnouncements.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {filteredAnnouncements.map((ann) => {
                const isToggling = togglingId === ann._id;
                return (
                  <article
                    key={ann._id}
                    className={`bg-white p-5 sm:p-6 rounded-2xl border shadow-sm hover:shadow-md transition-all group ${ann.isPublished
                        ? "border-slate-200/70 hover:border-brand-cerulean/30"
                        : "border-slate-200/60 bg-slate-50/40"
                      }`}
                  >
                    {/* Top Meta & Actions */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-brand-aliceBlue text-brand-cerulean ring-1 ring-brand-cerulean/20">
                          {ann.classDetails?.name || "Class Linked"}
                        </span>

                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ring-1 ${ann.isPublished
                              ? "bg-emerald-50 text-emerald-700 ring-emerald-600/15"
                              : "bg-slate-100 text-slate-600 ring-slate-300/70"
                            }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${ann.isPublished ? "bg-emerald-500" : "bg-slate-400"
                              }`}
                          />
                          {ann.isPublished ? "Published" : "Hidden"}
                        </span>

                        <span className="inline-flex items-center gap-1 text-xs text-slate-400 font-medium">
                          <Clock className="w-3.5 h-3.5" />
                          {moment(ann.createdAt).format("MMM DD, YYYY")} (
                          {moment(ann.createdAt).fromNow()})
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 self-end sm:self-auto">
                        <button
                          onClick={() => handleEditClick(ann)}
                          className="p-2 rounded-lg text-slate-400 hover:text-brand-cerulean hover:bg-brand-aliceBlue transition-colors"
                          title="Edit Announcement"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleToggleVisibility(ann._id)}
                          disabled={isToggling}
                          className={`p-2 rounded-lg transition-colors disabled:opacity-50 ${ann.isPublished
                              ? "text-emerald-600 hover:bg-emerald-50"
                              : "text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                            }`}
                          title={ann.isPublished ? "Hide from students" : "Show to students"}
                        >
                          {isToggling ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : ann.isPublished ? (
                            <Eye className="w-4 h-4" />
                          ) : (
                            <EyeOff className="w-4 h-4" />
                          )}
                        </button>

                        <button
                          onClick={() => setDeleteTarget(ann)}
                          className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Delete Announcement"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Title & Message */}
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-brand-prussian group-hover:text-brand-cerulean transition-colors">
                        {ann.title}
                      </h3>
                      <p className="text-slate-600 text-sm leading-relaxed mt-1.5 whitespace-pre-line">
                        {ann.content}
                      </p>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-14 text-center border border-dashed border-slate-200">
              <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-slate-100">
                <Megaphone className="w-7 h-7 text-slate-300" />
              </div>
              <h3 className="text-sm font-semibold text-brand-prussian">
                No announcements found
              </h3>
              <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                {announcements.length === 0
                  ? "Create your first broadcast to notify students about upcoming classes or exams."
                  : "Try adjusting your search query, class filter, or status tab."}
              </p>
              {announcements.length === 0 && (
                <button
                  onClick={handleOpenCreate}
                  className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-aliceBlue text-brand-cerulean text-xs font-semibold hover:bg-brand-cerulean hover:text-white transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Create First Broadcast
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* --- CREATE / EDIT MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200/70 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
              <div>
                <h2 className="text-lg font-bold text-brand-prussian">
                  {editingId ? "Update Broadcast" : "New Broadcast"}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Send an announcement to students enrolled in the selected class.
                </p>
              </div>
              <button
                onClick={closeModal}
                disabled={saving}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form
              id="announcement-form"
              onSubmit={handleSubmit}
              className="p-6 space-y-5 overflow-y-auto flex-1"
            >
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Target Academic Class <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <select
                    required
                    className="w-full px-4 py-2.5 pr-9 bg-slate-50 border border-slate-200/80 rounded-xl text-sm font-medium text-brand-prussian focus:bg-white focus:ring-2 focus:ring-brand-cerulean/20 focus:border-brand-cerulean outline-none appearance-none cursor-pointer transition-all"
                    value={formData.classId}
                    onChange={(e) =>
                      setFormData({ ...formData, classId: e.target.value })
                    }
                  >
                    <option value="">Select a class...</option>
                    {classes.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Announcement Subject <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-sm font-medium text-brand-prussian placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-brand-cerulean/20 focus:border-brand-cerulean outline-none transition-all"
                  placeholder="e.g., Important Update Regarding Term Exams"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Message Content <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={5}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200/80 rounded-xl text-sm text-slate-700 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-brand-cerulean/20 focus:border-brand-cerulean outline-none resize-none transition-all"
                  placeholder="Enter the message you want to broadcast to the class..."
                  value={formData.content}
                  onChange={(e) =>
                    setFormData({ ...formData, content: e.target.value })
                  }
                />
              </div>
            </form>

            {/* Modal Footer */}
            <div className="flex justify-end gap-2.5 px-6 py-4 border-t border-slate-100 bg-slate-50/60 shrink-0">
              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="px-5 py-2.5 text-sm font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="announcement-form"
                disabled={saving}
                className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold bg-brand-prussian hover:bg-brand-cerulean text-white rounded-xl shadow-sm transition-all disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                <span>
                  {saving
                    ? "Saving..."
                    : editingId
                      ? "Save Changes"
                      : "Send Broadcast"}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

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
                  Delete announcement?
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  Are you sure you want to permanently delete{" "}
                  <strong className="text-brand-prussian">
                    "{deleteTarget.title}"
                  </strong>
                  ? This cannot be undone.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 mt-6">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="px-4 py-2 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors disabled:opacity-50"
              >
                {deleting && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{deleting ? "Deleting..." : "Delete"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}