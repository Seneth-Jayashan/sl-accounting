import React, { useEffect, useState, useRef, useMemo } from "react";
import KnowledgeBaseAdminService from "../../../services/KnowledgeBaseAdminService";
import Dropdown from "../../../components/Dropdown";
import Swal from "sweetalert2";
import {
  MagnifyingGlassIcon,
  ArrowPathIcon,
  TrashIcon,
  PencilSquareIcon,
  XMarkIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  ClockIcon,
  DocumentDuplicateIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  ExclamationTriangleIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";

const CATEGORIES = [
  "Lecture Notes",
  "Reading Materials",
  "Past Papers",
  "Assignments",
  "Other",
];

// --- Skeleton Loader ---

function KnowledgeListSkeleton() {
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
      <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4">
        <div className="h-10 w-72 bg-slate-100 rounded-xl" />
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-16 bg-slate-50 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

// --- Custom Accessible Checkbox ---

const IconCheckbox: React.FC<{
  checked: boolean;
  onChange: (next: boolean) => void;
  ariaLabel?: string;
  title?: string;
}> = ({ checked, onChange, ariaLabel, title }) => (
  <button
    type="button"
    role="checkbox"
    aria-checked={checked}
    aria-label={ariaLabel}
    title={title}
    onClick={() => onChange(!checked)}
    onKeyDown={(e) => {
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        onChange(!checked);
      }
    }}
    className={`w-5 h-5 inline-flex items-center justify-center rounded-md border transition-all focus:outline-none focus:ring-2 focus:ring-brand-cerulean/25 shrink-0 ${checked
        ? "bg-brand-prussian border-brand-prussian text-white"
        : "bg-white border-slate-300 hover:border-brand-cerulean"
      }`}
  >
    {checked && <CheckIcon className="w-3.5 h-3.5 stroke-[3]" />}
  </button>
);

// --- Main Component ---

const AdminKnowledgeList: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState<number>(Date.now());

  const [editing, setEditing] = useState(false);
  const [current, setCurrent] = useState<any | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [isPublished, setIsPublished] = useState(false);
  const [publishAt, setPublishAt] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  // Filters
  const [filter, setFilter] = useState<string>("All");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "Published" | "Scheduled" | "Draft"
  >("all");
  const [search, setSearch] = useState<string>("");

  const publishTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetchItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Tick every second so scheduled countdowns update live
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Cleanup publish timer on unmount
  useEffect(() => {
    return () => {
      if (publishTimerRef.current) {
        clearTimeout(publishTimerRef.current);
        publishTimerRef.current = null;
      }
    };
  }, []);

  const formatDuration = (ms: number) => {
    if (ms <= 0) return "00:00:00";
    const total = Math.floor(ms / 1000);
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const seconds = total % 60;
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  };

  const formatBytes = (bytes?: number | null) => {
    if (!bytes && bytes !== 0) return "";
    if (bytes === 0) return "0 B";
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(Number(bytes)) / Math.log(1024));
    return `${(Number(bytes) / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  const getDisplayCategory = (item: any) => item?.category || "Other";

  const getItemStatus = (item: any): "Published" | "Scheduled" | "Draft" =>
    item.isPublished ? "Published" : item.publishAt ? "Scheduled" : "Draft";

  const fetchItems = async () => {
    setLoading(true);
    setError(null);
    if (publishTimerRef.current) {
      clearTimeout(publishTimerRef.current);
      publishTimerRef.current = null;
    }
    try {
      const data = await KnowledgeBaseAdminService.getAll();
      if (data?.success) {
        const fetched = data.items || [];
        const sizePromises = fetched.map(async (it: any) => {
          if (!it.filePath && !it.file) return it;
          try {
            const res = await KnowledgeBaseAdminService.getSize(it._id);
            if (res?.success && typeof res.size === "number") {
              it.fileSize = res.size;
            }
          } catch (e) {
            console.debug("size fetch failed for", it._id, e);
          }
          return it;
        });

        const itemsWithSizes = await Promise.all(sizePromises);
        setItems(itemsWithSizes);

        // Schedule a single refresh at the nearest publishAt
        try {
          const nowMs = Date.now();
          const futurePublishes = (itemsWithSizes || [])
            .map((it: any) => {
              const p = it.publishAt ? new Date(it.publishAt).getTime() : null;
              return {
                id: it._id,
                publishAt: p,
                isPublished: Boolean(it.isPublished),
              };
            })
            .filter(
              (x: any) => x.publishAt && x.publishAt > nowMs && !x.isPublished
            )
            .sort((a: any, b: any) => a.publishAt - b.publishAt);

          if (futurePublishes.length > 0) {
            const nextPublishAt = futurePublishes[0].publishAt;
            if (typeof nextPublishAt === "number") {
              const nextMs = nextPublishAt - nowMs;
              const delay = Math.max(1000, nextMs + 250);
              publishTimerRef.current = setTimeout(() => {
                fetchItems();
              }, delay);
            }
          }
        } catch (e) {
          console.debug("schedule publish refresh failed", e);
        }
      } else {
        setError(data?.message || "Failed to load items");
      }
    } catch (err: any) {
      console.error(err);
      setError(
        err?.response?.data?.message || err.message || "Failed to load items"
      );
    } finally {
      setLoading(false);
    }
  };

  // Derived KPI Stats
  const stats = useMemo(() => {
    let published = 0;
    let scheduled = 0;
    let draft = 0;
    items.forEach((it) => {
      const s = getItemStatus(it);
      if (s === "Published") published++;
      else if (s === "Scheduled") scheduled++;
      else draft++;
    });
    return { total: items.length, published, scheduled, draft };
  }, [items]);

  const handleDelete = async (id: string) => {
    const item = items.find((it) => it._id === id);
    const itemTitle = item?.title || "this item";
    const result = await Swal.fire({
      title: `Delete ${itemTitle}?`,
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#e11d48",
      confirmButtonText: "Delete",
      cancelButtonText: "Cancel",
      reverseButtons: true,
    });

    if (!result.isConfirmed) return;

    try {
      const res = await KnowledgeBaseAdminService.delete(id);
      if (res?.success) {
        setItems((s) => s.filter((i) => i._id !== id));
        setSelectedIds((s) => s.filter((x) => x !== id));
      }
      await Swal.fire({
        title: "Deleted",
        text: "Item deleted successfully",
        icon: "success",
        timer: 1400,
        showConfirmButton: false,
      });
    } catch (err: any) {
      console.error(err);
      await Swal.fire({
        title: "Delete failed",
        text: err?.response?.data?.message || err.message || "Delete failed",
        icon: "error",
      });
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((s) =>
      s.includes(id) ? s.filter((x) => x !== id) : [...s, id]
    );
  };

  const selectAll = (checked: boolean) => {
    if (checked) setSelectedIds(filteredItems.map((i) => i._id));
    else setSelectedIds([]);
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return;
    const result = await Swal.fire({
      title: `Delete ${selectedIds.length} item(s)?`,
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#e11d48",
      confirmButtonText: "Delete",
      cancelButtonText: "Cancel",
      reverseButtons: true,
    });
    if (!result.isConfirmed) return;

    try {
      const res = await KnowledgeBaseAdminService.bulkDelete(selectedIds);
      if (res?.success) {
        setItems((s) => s.filter((i) => !selectedIds.includes(i._id)));
        setSelectedIds([]);
        await Swal.fire({
          title: "Deleted",
          text: "Items deleted",
          icon: "success",
          timer: 1400,
          showConfirmButton: false,
        });
      } else {
        await Swal.fire({
          title: "Failed",
          text: res?.message || "Bulk delete failed",
          icon: "error",
        });
      }
    } catch (err: any) {
      console.error(err);
      await Swal.fire({
        title: "Failed",
        text:
          err?.response?.data?.message || err.message || "Bulk delete failed",
        icon: "error",
      });
    }
  };

  const openEdit = (item: any) => {
    setCurrent(item);
    setTitle(item.title || "");
    setDescription(item.description || "");
    setCategory(item.category || CATEGORIES[0]);
    setIsPublished(Boolean(item.isPublished));
    setPublishAt(
      item.publishAt
        ? new Date(item.publishAt).toISOString().slice(0, 16)
        : null
    );
    setFile(null);
    setEditing(true);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0];
      const allowedExt = [
        ".pdf",
        ".doc",
        ".docx",
        ".xls",
        ".xlsx",
        ".ppt",
        ".pptx",
        ".zip",
        ".csv",
      ];
      const name = (f.name || "").toLowerCase();
      const ok = allowedExt.some((ext) => name.endsWith(ext));
      if (!ok) {
        setError(
          "Unsupported file type. Please select PDF, Word, Excel, PowerPoint, ZIP, or CSV."
        );
        return;
      }
      setFile(f);
    }
  };

  // Load preview for current file when edit modal opens
  useEffect(() => {
    let url: string | null = null;
    let cancelled = false;
    if (current && !file) {
      const mime = current.fileMime || "";
      const isPreviewable =
        mime === "application/pdf" || mime.startsWith("image/");
      if (isPreviewable) {
        (async () => {
          try {
            const res = await KnowledgeBaseAdminService.download(current._id);
            if (cancelled) return;
            const blob = new Blob([res.data], {
              type: res.headers["content-type"] || mime,
            });
            url = URL.createObjectURL(blob);
            setPreviewUrl(url);
          } catch (err) {
            console.error("preview fetch failed", err);
            setPreviewUrl(null);
          }
        })();
      } else {
        setPreviewUrl(null);
      }
    }

    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
      setPreviewUrl((p) => {
        if (p) URL.revokeObjectURL(p);
        return null;
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current]);

  // Update preview when a new file is selected in the modal
  useEffect(() => {
    if (!file) return;
    const u = URL.createObjectURL(file);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return u;
    });
    return () => {
      URL.revokeObjectURL(u);
    };
  }, [file]);

  const handleDownloadCurrent = async () => {
    if (!current) return;
    try {
      const res = await KnowledgeBaseAdminService.download(current._id);
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      const name =
        current.fileName ||
        current.fileOriginalName ||
        current.file ||
        "material";
      a.href = url;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error(err);
      await Swal.fire({
        title: "Download failed",
        text: err?.response?.data?.message || err.message || "Download failed",
        icon: "error",
      });
    }
  };

  const handleUpdate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!current) return;
    setSaving(true);
    try {
      const form = new FormData();
      form.append("title", title);
      form.append("description", description || "");
      form.append("category", category);
      form.append("isPublished", String(isPublished));
      if (publishAt) form.append("publishAt", publishAt);
      if (file) form.append("file", file as Blob, (file as File).name);

      const res = await KnowledgeBaseAdminService.update(current._id, form);

      if (res?.success) {
        setItems((s) =>
          s.map((it) =>
            it._id === current._id ? res.item || { ...it, ...res.item } : it
          )
        );
        setEditing(false);
        setCurrent(null);
      } else {
        await Swal.fire({
          title: "Update failed",
          text: res?.message || "Update failed",
          icon: "error",
        });
      }
    } catch (err: any) {
      console.error(err);
      await Swal.fire({
        title: "Update failed",
        text: err?.response?.data?.message || err.message || "Update failed",
        icon: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const filteredItems = useMemo(() => {
    const q = (search || "").trim().toLowerCase();
    return items.filter((it) => {
      const byCategory =
        filter === "All" ? true : getDisplayCategory(it) === filter;
      const byStatus =
        statusFilter === "all" ? true : getItemStatus(it) === statusFilter;
      const bySearch =
        q === ""
          ? true
          : (it.title || "").toLowerCase().includes(q) ||
          (it.description || "").toLowerCase().includes(q);
      return byCategory && byStatus && bySearch;
    });
  }, [items, filter, statusFilter, search]);

  const allSelected =
    filteredItems.length > 0 &&
    filteredItems.every((it) => selectedIds.includes(it._id));

  return (
    <div className="space-y-6 md:space-y-8 pb-24 md:pb-12">
      {/* HEADER */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-brand-prussian tracking-tight">
            Knowledge Base
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Review, filter, schedule, and manage student learning materials.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          {selectedIds.length > 0 && (
            <button
              onClick={handleDeleteSelected}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/80 text-xs font-semibold shadow-sm transition-colors"
            >
              <TrashIcon className="w-4 h-4" />
              <span>Delete Selected ({selectedIds.length})</span>
            </button>
          )}

          <button
            onClick={fetchItems}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white rounded-xl border border-slate-200/80 shadow-sm text-xs font-semibold text-slate-600 hover:text-brand-cerulean hover:border-brand-cerulean/40 transition-colors disabled:opacity-50"
          >
            <ArrowPathIcon
              className={`w-4 h-4 ${loading ? "animate-spin text-brand-cerulean" : ""
                }`}
            />
            <span>Refresh</span>
          </button>
        </div>
      </header>

      {/* ERROR BANNER */}
      {error && (
        <div className="bg-rose-50 border border-rose-200/80 text-rose-700 px-4 py-3.5 rounded-2xl text-sm font-medium flex items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-2.5">
            <ExclamationTriangleIcon className="w-5 h-5 text-rose-500 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => setError(null)}
            className="p-1 rounded-lg hover:bg-rose-100 text-rose-500"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* LOADING SKELETON */}
      {loading && items.length === 0 ? (
        <KnowledgeListSkeleton />
      ) : (
        <div className="space-y-6">
          {/* KPI SUMMARY CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="relative overflow-hidden bg-white p-6 rounded-2xl border border-slate-200/70 shadow-sm">
              <div className="pointer-events-none absolute -top-10 -right-10 w-24 h-24 rounded-full bg-blue-500/10 blur-2xl" />
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Total Materials
                  </p>
                  <h3 className="text-3xl font-bold text-brand-prussian mt-2 tabular-nums">
                    {stats.total}
                  </h3>
                </div>
                <div className="p-3 rounded-xl bg-blue-50 text-blue-600 ring-1 ring-blue-100">
                  <DocumentTextIcon className="w-5 h-5" />
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
                  <CheckCircleIcon className="w-5 h-5" />
                </div>
              </div>
            </div>

            <div className="relative overflow-hidden bg-white p-6 rounded-2xl border border-slate-200/70 shadow-sm">
              <div className="pointer-events-none absolute -top-10 -right-10 w-24 h-24 rounded-full bg-amber-500/10 blur-2xl" />
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Scheduled
                  </p>
                  <h3 className="text-3xl font-bold text-brand-prussian mt-2 tabular-nums">
                    {stats.scheduled}
                  </h3>
                </div>
                <div className="p-3 rounded-xl bg-amber-50 text-amber-600 ring-1 ring-amber-100">
                  <ClockIcon className="w-5 h-5" />
                </div>
              </div>
            </div>

            <div className="relative overflow-hidden bg-white p-6 rounded-2xl border border-slate-200/70 shadow-sm">
              <div className="pointer-events-none absolute -top-10 -right-10 w-24 h-24 rounded-full bg-slate-500/10 blur-2xl" />
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Drafts
                  </p>
                  <h3 className="text-3xl font-bold text-brand-prussian mt-2 tabular-nums">
                    {stats.draft}
                  </h3>
                </div>
                <div className="p-3 rounded-xl bg-slate-100 text-slate-600 ring-1 ring-slate-200">
                  <DocumentDuplicateIcon className="w-5 h-5" />
                </div>
              </div>
            </div>
          </div>

          {/* DIRECTORY CARD */}
          <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm overflow-hidden">
            {/* Toolbar */}
            <div className="p-4 sm:p-5 border-b border-slate-100 space-y-3.5">
              <div className="flex flex-col md:flex-row gap-3">
                {/* Search */}
                <div className="relative flex-1">
                  <MagnifyingGlassIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search materials by title or description..."
                    aria-label="Search materials"
                    className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-sm text-slate-700 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-cerulean/20 focus:border-brand-cerulean transition-all"
                  />
                  {search && (
                    <button
                      type="button"
                      onClick={() => setSearch("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Category Filter Dropdown */}
                <div className="md:w-56">
                  <Dropdown
                    value={filter}
                    onChange={(v) => setFilter(v)}
                    options={[
                      { value: "All", label: "All Categories" },
                      ...CATEGORIES.map((c) => ({ value: c, label: c })),
                    ]}
                    className="px-3.5 py-2.5 text-sm rounded-xl bg-slate-50 border-slate-200/80 font-medium text-brand-prussian"
                    wrapperClassName="w-full"
                  />
                </div>
              </div>

              {/* Status Pills & Bulk Select Row */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <div className="flex items-center gap-1.5 overflow-x-auto">
                  {(
                    [
                      { key: "all", label: "All", count: stats.total },
                      { key: "Published", label: "Published", count: stats.published },
                      { key: "Scheduled", label: "Scheduled", count: stats.scheduled },
                      { key: "Draft", label: "Drafts", count: stats.draft },
                    ] as const
                  ).map((tab) => {
                    const active = statusFilter === tab.key;
                    return (
                      <button
                        key={tab.key}
                        onClick={() => setStatusFilter(tab.key)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${active
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

                {filteredItems.length > 0 && (
                  <div className="flex items-center gap-2.5 text-xs text-slate-500">
                    <IconCheckbox
                      checked={allSelected}
                      onChange={(v) => selectAll(v)}
                      ariaLabel="Select all materials"
                      title={allSelected ? "Deselect all" : "Select all"}
                    />
                    <span className="font-medium">
                      {selectedIds.length > 0
                        ? `${selectedIds.length} selected`
                        : "Select all"}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Empty State */}
            {!loading && filteredItems.length === 0 ? (
              <div className="py-16 px-4 text-center flex flex-col items-center">
                <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mb-3 border border-slate-100">
                  <DocumentTextIcon className="w-7 h-7 text-slate-300" />
                </div>
                <h3 className="text-sm font-semibold text-brand-prussian">
                  No matching materials
                </h3>
                <p className="text-xs text-slate-400 mt-1 max-w-xs">
                  Adjust your search query, category, or status filter to see more results.
                </p>
                <div className="mt-4 flex items-center gap-2.5">
                  <button
                    onClick={() => {
                      setSearch("");
                      setFilter("All");
                      setStatusFilter("all");
                    }}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    Reset Filters
                  </button>
                  <button
                    onClick={fetchItems}
                    className="px-4 py-2 rounded-xl bg-brand-prussian text-white text-xs font-semibold hover:bg-brand-cerulean transition-colors"
                  >
                    Refresh
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Mobile Cards */}
                <div className="md:hidden divide-y divide-slate-100">
                  {filteredItems.map((it) => {
                    const status = getItemStatus(it);
                    const badgeStyle =
                      status === "Published"
                        ? "bg-emerald-50 text-emerald-700 ring-emerald-600/15"
                        : status === "Scheduled"
                          ? "bg-amber-50 text-amber-700 ring-amber-600/15"
                          : "bg-slate-100 text-slate-600 ring-slate-300/70";
                    const isSelected = selectedIds.includes(it._id);
                    const created = new Date(it.createdAt);
                    const publishCountdown = (() => {
                      if (!it.publishAt || it.isPublished) return null;
                      const diff = new Date(it.publishAt).getTime() - now;
                      if (diff <= 0) return null;
                      return `Publishes in ${formatDuration(diff)}`;
                    })();

                    return (
                      <div
                        key={it._id}
                        className={`p-4 space-y-3 transition-colors ${isSelected ? "bg-brand-aliceBlue/30" : "bg-white"
                          }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-semibold text-sm text-brand-prussian break-words">
                              {it.title}
                            </p>
                            <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">
                              {it.description || "No description provided."}
                            </p>
                          </div>
                          <IconCheckbox
                            checked={isSelected}
                            onChange={() => toggleSelect(it._id)}
                            ariaLabel={`Select ${it.title}`}
                          />
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ring-1 ${badgeStyle}`}
                          >
                            {status}
                          </span>
                          <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-600">
                            {getDisplayCategory(it)}
                          </span>
                          <span className="text-xs text-slate-400 tabular-nums">
                            {created.toLocaleDateString()}
                          </span>
                          <span className="text-xs text-slate-400 tabular-nums">
                            • {it.fileSize ? formatBytes(it.fileSize) : "—"}
                          </span>
                        </div>

                        {publishCountdown && (
                          <div className="text-amber-700 font-semibold text-[11px] bg-amber-50 px-2.5 py-1 rounded-lg w-fit tabular-nums">
                            {publishCountdown}
                          </div>
                        )}

                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                          <button
                            onClick={() => openEdit(it)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 text-brand-prussian hover:bg-brand-aliceBlue hover:text-brand-cerulean text-xs font-semibold transition-colors"
                          >
                            <PencilSquareIcon className="w-3.5 h-3.5" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(it._id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 text-xs font-semibold transition-colors"
                          >
                            <TrashIcon className="w-3.5 h-3.5" />
                            Delete
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50/80 text-[11px] uppercase tracking-wider text-slate-500 font-semibold border-b border-slate-100">
                      <tr>
                        <th className="px-5 py-3.5 w-12">
                          <IconCheckbox
                            checked={allSelected}
                            onChange={(v) => selectAll(v)}
                            ariaLabel="Select all materials"
                          />
                        </th>
                        <th className="px-4 py-3.5 min-w-[240px]">Material</th>
                        <th className="px-4 py-3.5">Category</th>
                        <th className="px-4 py-3.5">Status</th>
                        <th className="px-4 py-3.5">Created</th>
                        <th className="px-4 py-3.5">Size</th>
                        <th className="px-6 py-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredItems.map((it) => {
                        const status = getItemStatus(it);
                        const badgeStyle =
                          status === "Published"
                            ? "bg-emerald-50 text-emerald-700 ring-emerald-600/15"
                            : status === "Scheduled"
                              ? "bg-amber-50 text-amber-700 ring-amber-600/15"
                              : "bg-slate-100 text-slate-600 ring-slate-300/70";
                        const dotStyle =
                          status === "Published"
                            ? "bg-emerald-500"
                            : status === "Scheduled"
                              ? "bg-amber-500"
                              : "bg-slate-400";
                        const isSelected = selectedIds.includes(it._id);
                        const created = new Date(it.createdAt);
                        const publishCountdown = (() => {
                          if (!it.publishAt || it.isPublished) return null;
                          const diff = new Date(it.publishAt).getTime() - now;
                          if (diff <= 0) return null;
                          return `In ${formatDuration(diff)}`;
                        })();

                        return (
                          <tr
                            key={it._id}
                            className={`transition-colors ${isSelected
                                ? "bg-brand-aliceBlue/35"
                                : "hover:bg-slate-50/80"
                              }`}
                          >
                            <td className="px-5 py-4">
                              <IconCheckbox
                                checked={isSelected}
                                onChange={() => toggleSelect(it._id)}
                                ariaLabel={`Select ${it.title}`}
                              />
                            </td>

                            <td className="px-4 py-4 max-w-sm">
                              <p className="font-semibold text-sm text-brand-prussian truncate">
                                {it.title}
                              </p>
                              <p className="text-xs text-slate-400 truncate mt-0.5">
                                {it.description || "No description provided."}
                              </p>
                            </td>

                            <td className="px-4 py-4 whitespace-nowrap">
                              <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200/70 text-xs font-medium text-slate-600">
                                {getDisplayCategory(it)}
                              </span>
                            </td>

                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="flex flex-col items-start gap-1">
                                <span
                                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ring-1 ${badgeStyle}`}
                                >
                                  <span
                                    className={`w-1.5 h-1.5 rounded-full ${dotStyle}`}
                                  />
                                  {status}
                                </span>
                                {publishCountdown && (
                                  <span className="text-[11px] font-semibold text-amber-700 tabular-nums">
                                    {publishCountdown}
                                  </span>
                                )}
                              </div>
                            </td>

                            <td className="px-4 py-4 whitespace-nowrap text-xs text-slate-500 tabular-nums">
                              {created.toLocaleDateString()}
                            </td>

                            <td className="px-4 py-4 whitespace-nowrap text-xs font-medium text-slate-500 tabular-nums">
                              {it.fileSize ? formatBytes(it.fileSize) : "—"}
                            </td>

                            <td className="px-6 py-4 text-right whitespace-nowrap">
                              <div className="inline-flex items-center gap-1.5">
                                <button
                                  onClick={() => openEdit(it)}
                                  title={`Edit ${it.title}`}
                                  className="p-2 rounded-lg text-slate-400 hover:text-brand-cerulean hover:bg-brand-aliceBlue transition-colors"
                                >
                                  <PencilSquareIcon className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDelete(it._id)}
                                  title={`Delete ${it.title}`}
                                  className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                >
                                  <TrashIcon className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* --- EDIT MATERIAL MODAL --- */}
      {editing && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200/70 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-base font-bold text-brand-prussian">
                  Edit Material
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Update resource metadata or replace the attached file.
                </p>
              </div>
              <button
                aria-label="Close"
                onClick={() => {
                  if (saving) return;
                  setEditing(false);
                  setCurrent(null);
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form
              id="kb-edit-form"
              onSubmit={(e) => {
                e.preventDefault();
                handleUpdate();
              }}
              className="p-6 space-y-5 overflow-y-auto flex-1"
            >
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Title <span className="text-rose-500">*</span>
                </label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-sm font-medium text-brand-prussian focus:bg-white focus:border-brand-cerulean focus:ring-2 focus:ring-brand-cerulean/20 outline-none"
                />
                {title.trim() === "" && (
                  <p className="text-xs font-medium text-rose-600">
                    Title is required
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-sm text-slate-700 focus:bg-white focus:border-brand-cerulean focus:ring-2 focus:ring-brand-cerulean/20 outline-none resize-none"
                />
              </div>

              <div className="space-y-1.5 max-w-xs">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Category
                </label>
                <Dropdown
                  value={category}
                  onChange={(v) => setCategory(v)}
                  options={CATEGORIES.map((c) => ({ value: c, label: c }))}
                  className="px-3.5 py-2.5 pr-10 rounded-xl bg-slate-50 border-slate-200/80 text-sm font-medium text-brand-prussian"
                />
              </div>

              {/* File Preview */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Attached File
                  </label>
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-aliceBlue text-brand-cerulean hover:bg-brand-cerulean hover:text-white text-xs font-semibold cursor-pointer transition-colors">
                    <ArrowUpTrayIcon className="w-3.5 h-3.5" />
                    <span>Change File</span>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.csv"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </label>
                </div>

                <div className="relative w-full bg-slate-50 border border-slate-200/80 rounded-xl overflow-hidden">
                  {previewUrl ? (
                    (current?.fileMime || file?.type || "").startsWith(
                      "image/"
                    ) ? (
                      <img
                        src={previewUrl}
                        alt="preview"
                        className="w-full max-h-64 object-contain mx-auto"
                      />
                    ) : (
                      <iframe
                        src={previewUrl}
                        title="file-preview"
                        className="w-full h-64"
                      />
                    )
                  ) : (
                    <div className="p-8 text-center text-xs text-slate-400">
                      No inline preview available. Download to view this file.
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50/80 px-4 py-3 rounded-xl border border-slate-200/70">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-brand-prussian truncate">
                      {file?.name ||
                        current?.fileName ||
                        current?.fileOriginalName ||
                        current?.file ||
                        "No file attached"}
                    </p>
                    <p className="text-[11px] text-slate-400 tabular-nums">
                      {file
                        ? formatBytes(file.size)
                        : current?.fileSize
                          ? formatBytes(current.fileSize)
                          : ""}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleDownloadCurrent}
                    disabled={!current}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white border border-slate-200/80 text-xs font-semibold text-brand-prussian hover:text-brand-cerulean hover:border-brand-cerulean/40 shadow-sm transition-colors shrink-0"
                  >
                    <ArrowDownTrayIcon className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </button>
                </div>
              </div>
            </form>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/60 flex justify-end gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setEditing(false);
                  setCurrent(null);
                }}
                disabled={saving}
                className="px-5 py-2.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="kb-edit-form"
                disabled={saving || title.trim() === ""}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand-prussian hover:bg-brand-cerulean text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
              >
                {saving && <ArrowPathIcon className="w-4 h-4 animate-spin" />}
                <span>{saving ? "Saving..." : "Save Changes"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminKnowledgeList;