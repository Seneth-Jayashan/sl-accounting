import React, { useEffect, useState, useRef } from "react";
import DashboardLayout from "../../../layouts/DashboardLayout";
import SidebarAdmin from "../../../components/sidebar/SidebarAdmin";
import BottomNavAdmin from "../../../components/bottomNavbar/BottomNavAdmin";
import KnowledgeBaseAdminService from "../../../services/KnowledgeBaseAdminService";
import Dropdown from "../../../components/Dropdown";
import Swal from "sweetalert2";

const CATEGORIES = [
  "Lecture Notes",
  "Reading Materials",
  "Past Papers",
  "Assignments",
  "Other",
];

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
  const [filter, setFilter] = useState<string>("All");
  const [search, setSearch] = useState<string>('');

  // Ref to hold timer for next scheduled publish refresh
  const publishTimerRef = useRef<number | null>(null);

  // Custom SVG checkbox for nicer, consistent visuals and keyboard accessibility
  const IconCheckbox: React.FC<{
    checked: boolean;
    onChange: (next: boolean) => void;
    ariaLabel?: string;
    title?: string;
  }> = ({ checked, onChange, ariaLabel, title }) => {
    return (
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
        className={`w-5 h-5 inline-flex items-center justify-center rounded-md border transition focus:outline-none focus:ring-2 focus:ring-[#0b2540]/20 ${
          checked ? "bg-[#0b2540] border-transparent" : "bg-white border-gray-300"
        }`}
      >
        {checked ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 text-white" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 00-1.414-1.414L7 12.172 4.707 9.879A1 1 0 003.293 11.293l3 3a1 1 0 001.414 0l8-8z" clipRule="evenodd" />
          </svg>
        ) : null}
      </button>
    );
  };

  useEffect(() => {
    fetchItems();
  }, []);

  // tick every second so scheduled countdowns update live
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // cleanup publish timer on unmount
  useEffect(() => {
    return () => {
      if (publishTimerRef.current) {
        clearTimeout(publishTimerRef.current);
        publishTimerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const getDisplayCategory = (item: any) =>
    item?.catageory || item?.category || "Other";

  const fetchItems = async () => {
    setLoading(true);
    setError(null);
    // clear any previously scheduled refresh before fetching
    if (publishTimerRef.current) {
      clearTimeout(publishTimerRef.current);
      publishTimerRef.current = null;
    }
    try {
      const data = await KnowledgeBaseAdminService.getAll();
      if (data?.success) {
        const items = data.items || [];
        // fetch file sizes in parallel for items that have a filePath/file
        const sizePromises = items.map(async (it: any) => {
          if (!it.filePath && !it.file) return it;
          try {
            const res = await KnowledgeBaseAdminService.getSize(it._id);
            if (res?.success && typeof res.size === 'number') it.fileSize = res.size;
          } catch (e) {
            // ignore per-item size errors
            console.debug('size fetch failed for', it._id, e);
          }
          return it;
        });

        const itemsWithSizes = await Promise.all(sizePromises);
        setItems(itemsWithSizes);

        // schedule a single refresh at the nearest publishAt (for scheduled items)
        try {
          const nowMs = Date.now();
          const futurePublishes = (itemsWithSizes || [])
            .map((it: any) => {
              const p = it.publishAt ? new Date(it.publishAt).getTime() : null;
              return { id: it._id, publishAt: p, isPublished: Boolean(it.isPublished) };
            })
            .filter((x: any) => x.publishAt && x.publishAt > nowMs && !x.isPublished)
            .sort((a: any, b: any) => a.publishAt - b.publishAt);

          if (futurePublishes.length > 0) {
            const nextPublishAt = futurePublishes[0].publishAt;
            // ensure we have a number before subtracting (TypeScript/runtime safe)
            if (typeof nextPublishAt === "number") {
              const nextMs = nextPublishAt - nowMs;
              // minimum 1s delay, add small buffer
              const delay = Math.max(1000, nextMs + 250);
              publishTimerRef.current = window.setTimeout(() => {
                // re-fetch items when next scheduled publish time passes
                fetchItems();
              }, delay) as unknown as number;
            }
          }
        } catch (e) {
          console.debug('schedule publish refresh failed', e);
        }
      }
      else setError(data?.message || "Failed to load items");
    } catch (err: any) {
      console.error(err);
      setError(
        err?.response?.data?.message || err.message || "Failed to load items"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const item = items.find((it) => it._id === id);
    const title = item?.title || "this item";
    const result = await Swal.fire({
      title: `Delete ${title}?`,
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Delete",
      cancelButtonText: "Cancel",
      reverseButtons: true,
    });

    if (!result.isConfirmed) return;

    try {
      const res = await KnowledgeBaseAdminService.delete(id);
      if (res?.success) {
        setItems((s) => s.filter((i) => i._id !== id));
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
    setSelectedIds((s) => {
      if (s.includes(id)) return s.filter((x) => x !== id);
      return [...s, id];
    });
  };

  const selectAll = (checked: boolean) => {
    if (checked) setSelectedIds(items.map((i) => i._id));
    else setSelectedIds([]);
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return;
    const result = await Swal.fire({
      title: `Delete ${selectedIds.length} item(s)?`,
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
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
    setCategory(item.catageory || item.category || CATEGORIES[0]);
    setIsPublished(Boolean(item.isPublished));
    setPublishAt(
      item.publishAt
        ? new Date(item.publishAt).toISOString().slice(0, 16)
        : null
    );
    setFile(null);
    setEditing(true);
  };

  // Validate selected file (allow pdf, doc/docx, xls/xlsx, ppt/pptx, zip, csv)
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

  // load preview for current file when edit modal opens
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

  // update preview when a new file is selected in the modal
  useEffect(() => {
    if (!file) return;
    const u = URL.createObjectURL(file);
    // revoke previous
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
      form.append("catageory", category);
      form.append("isPublished", String(isPublished));
      if (publishAt) form.append("publishAt", publishAt);
      if (file) form.append("file", file as Blob, (file as File).name);

      const res = await KnowledgeBaseAdminService.update(current._id, form);

      if (res?.success) {
        // update local list
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

  const filteredItems = items.filter((it) => {
    const byCategory = filter === "All" ? true : getDisplayCategory(it) === filter;
    const q = (search || "").trim().toLowerCase();
    const bySearch =
      q === ""
        ? true
        : (it.title || "").toLowerCase().includes(q) ||
          (it.description || "").toLowerCase().includes(q);
    return byCategory && bySearch;
  });

  const allSelected = selectedIds.length === items.length && items.length > 0;
  const selectionSummary = selectedIds.length > 0 ? `${selectedIds.length} selected` : "Nothing selected";

  return (
    <DashboardLayout
      Sidebar={SidebarAdmin}
      BottomNav={BottomNavAdmin}
      showHeader={false}
    >
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <div className="bg-white border border-gray-100 rounded-2xl p-4 sm:p-5 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-xl bg-[#0b2540] text-white flex items-center justify-center text-lg font-semibold">KB</div>
                <div>
                  <h1 className="text-2xl font-bold">Knowledge Base — Manage</h1>
                  <p className="text-sm text-gray-500">Review, filter, and update learning materials.</p>
                </div>
              </div>

              <div className="w-full">
                <div className="relative">
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search title or description"
                    className="w-full px-3 py-3 rounded-xl border border-gray-200 bg-white text-sm focus:border-[#0b2540] focus:ring-2 focus:ring-[#0b2540]/10 transition"
                    aria-label="Search materials"
                  />
                  {search ? (
                    <button
                      type="button"
                      onClick={() => setSearch("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 text-xs bg-gray-100 px-2 py-1 rounded-lg hover:bg-gray-200"
                    >
                      Clear
                    </button>
                  ) : (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">⌕</div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 text-sm bg-white border border-gray-200 rounded-xl px-3 py-1.5 shadow-sm">
                <span className="text-gray-500">Filter</span>
                <Dropdown
                  value={filter}
                  onChange={(v) => setFilter(v)}
                  options={[{ value: "All", label: "All" }, ...CATEGORIES.map((c) => ({ value: c, label: c }))]}
                  className="pl-3 pr-9 py-1.5 text-sm rounded-lg"
                  wrapperClassName="w-44"
                />
              </div>
              <button
                onClick={fetchItems}
                className="px-3 py-1.5 rounded-xl border border-gray-200 text-sm bg-white shadow-sm hover:border-[#0b2540]"
              >
                Refresh
              </button>
              {selectedIds.length > 0 && (
                <button
                  onClick={handleDeleteSelected}
                  className="px-3 py-1.5 rounded-xl border border-red-300 text-red-600 text-sm bg-white shadow-sm inline-flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3" />
                  </svg>
                  Delete Selected ({selectedIds.length})
                </button>
              )}
            </div>
          </div>
        </div>

        {error && <div className="text-red-600">{error}</div>}

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 text-sm text-gray-600 bg-slate-50">
            <div className="flex items-center gap-2">
                <IconCheckbox
                  checked={allSelected}
                  onChange={(v) => selectAll(v)}
                  ariaLabel="Select all materials"
                  title={allSelected ? "Deselect all" : "Select all"}
                />
              <span>{allSelected ? "All items selected" : selectionSummary}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span className="px-2 py-1 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-700">Published</span>
              <span className="px-2 py-1 rounded-lg bg-amber-50 border border-amber-100 text-amber-700">Scheduled</span>    
            </div>
          </div>

          {(!loading && filteredItems.length === 0) ? (
            <div className="p-8 text-center text-sm text-gray-600">
              <div className="text-lg font-semibold text-gray-900">No matching materials</div>
              <div className="mt-1">Adjust search or filters to see more results.</div>
              <div className="mt-4 flex items-center justify-center gap-3">
                <button
                  onClick={() => {
                    setSearch("");
                    setFilter("All");
                  }}
                  className="px-3 py-1.5 rounded-lg border text-sm"
                >
                  Reset filters
                </button>
                <button
                  onClick={fetchItems}
                  className="px-3 py-1.5 rounded-lg bg-[#0b2540] text-white text-sm"
                >
                  Refresh list
                </button>
              </div>
            </div>
          ) : (
            <div className="overflow-auto">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-slate-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide sticky top-0 z-10">
                  <tr>
                    <th className="p-3 w-12">Select</th>
                    <th className="p-3 min-w-[220px]">Title</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Created</th>
                    <th className="p-3">Size</th>
                    <th className="p-3 w-48 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {loading
                    ? [1, 2, 3].map((n) => (
                        <tr key={n} className="animate-pulse">
                          <td className="p-3 align-top">
                            <div className="w-5 h-5 bg-gray-200 rounded" />
                          </td>
                          <td className="p-3 align-top">
                            <div className="h-4 bg-gray-200 rounded w-48 mb-2" />
                            <div className="h-3 bg-gray-200 rounded w-60" />
                          </td>
                          <td className="p-3 align-top">
                            <div className="h-3 bg-gray-200 rounded w-20" />
                          </td>
                          <td className="p-3 align-top">
                            <div className="h-3 bg-gray-200 rounded w-20" />
                          </td>
                          <td className="p-3 align-top">
                            <div className="h-3 bg-gray-200 rounded w-36" />
                          </td>
                          <td className="p-3 align-top">
                            <div className="h-3 bg-gray-200 rounded w-12" />
                          </td>
                          <td className="p-3 align-top text-right">
                            <div className="h-8 bg-gray-200 rounded w-20 inline-block" />
                          </td>
                        </tr>
                      ))
                    : filteredItems.map((it) => {
                        const status = it.isPublished
                          ? "Published"
                          : it.publishAt
                          ? "Scheduled"
                          : "Draft";
                        const badgeColor =
                          status === "Published"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                            : status === "Scheduled"
                            ? "bg-amber-50 text-amber-700 border-amber-100"
                            : "bg-gray-50 text-gray-700 border-gray-200";
                        const isSelected = selectedIds.includes(it._id);
                        const created = new Date(it.createdAt);
                        const publishCountdown = (() => {
                          if (!it.publishAt || it.isPublished) return null;
                          const diff = new Date(it.publishAt).getTime() - now;
                          if (diff <= 0) return null;
                          return `Publishes in ${formatDuration(diff)}`;
                        })();

                        return (
                          <tr
                            key={it._id}
                            className={`${isSelected ? "bg-[#f8fafc]" : ""} hover:bg-slate-50 transition`}
                          >
                            <td className="p-3 align-top">
                              <label className="inline-flex items-center cursor-pointer">
                                <IconCheckbox
                                  checked={isSelected}
                                  onChange={() => toggleSelect(it._id)}
                                  ariaLabel={`Select ${it.title}`}
                                  title={isSelected ? `Deselect ${it.title}` : `Select ${it.title}`}
                                />
                              </label>
                            </td>
                            <td className="p-3 align-top min-w-0">
                              <div className="font-semibold text-gray-900 truncate">{it.title}</div>
                              <div className="text-xs text-gray-500 truncate">{it.description || "No description provided."}</div>
                            </td>
                            <td className="p-3 align-top text-sm text-gray-700">{getDisplayCategory(it)}</td>
                            <td className="p-3 align-top text-sm">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border ${badgeColor}`}>
                                {status === "Published" ? "●" : status === "Scheduled" ? "◑" : "○"}
                                <span>{status}</span>
                              </span>
                              {publishCountdown && (
                                <div className="text-amber-700 font-medium text-[11px] mt-1">{publishCountdown}</div>
                              )}
                            </td>
                            <td className="p-3 align-top text-sm text-gray-700">
                              <div>{created.toLocaleString()}</div>
                            </td>
                            <td className="p-3 align-top text-sm text-gray-700">{it.fileSize ? formatBytes(it.fileSize) : "—"}</td>
                            <td className="p-3 align-top text-right">
                              <div className="inline-flex items-center gap-2">
                                <button
                                  onClick={() => openEdit(it)}
                                  title={`Edit ${it.title}`}
                                  aria-label={`Edit ${it.title}`}
                                  className="w-9 h-9 flex items-center justify-center rounded-full bg-[#0b2540] text-white text-sm shadow-sm hover:shadow"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                                    <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828zM4 14v2h2l8.707-8.707-2-2L4 14z" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => handleDelete(it._id)}
                                  title={`Delete ${it.title}`}
                                  aria-label={`Delete ${it.title}`}
                                  className="w-9 h-9 flex items-center justify-center rounded-full bg-white border border-red-200 text-red-600 shadow-sm hover:bg-red-50"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3" />
                                  </svg>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {editing && (
          <div className="fixed inset-0 bg-black/40 flex items-start sm:items-center justify-center z-50 p-4">
            <div className="w-full mx-auto max-w-lg sm:max-w-2xl bg-white rounded-2xl p-4 sm:p-6 shadow-xl max-h-[90vh] overflow-auto">
              <div className="flex items-start justify-between">
                <h2 className="text-lg font-semibold mb-4">Edit Material</h2>
                <button
                  aria-label="Close"
                  onClick={() => {
                    setEditing(false);
                    setCurrent(null);
                  }}
                  className="text-gray-500 hover:text-gray-800"
                >
                  ✕
                </button>
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleUpdate();
                }}
                className="space-y-4"
              >
                <div>
                  <label className="text-sm font-medium">Title</label>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 border rounded"
                  />
                  {title.trim() === "" && (
                    <div className="text-xs text-red-500 mt-1">
                      Title is required
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Category</label>
                  <Dropdown
                    value={category}
                    onChange={(v) => setCategory(v)}
                    options={CATEGORIES.map((c) => ({ value: c, label: c }))}
                    className="px-3 py-2 pr-10"
                  />

                  <div>
                    <label className="text-sm font-medium">File preview</label>
                    <div className="mt-2 relative w-full bg-gray-50 border border-gray-200 rounded-lg overflow-hidden">
                      {previewUrl ? (
                        <div className="w-full">
                          {(current?.fileMime || file?.type || "").startsWith(
                            "image/"
                          ) ? (
                            <img
                              src={previewUrl}
                              alt="preview"
                              className="w-full max-h-48 sm:max-h-64 md:max-h-72 object-contain"
                            />
                          ) : (
                            <iframe
                              src={previewUrl}
                              title="file-preview"
                              className="w-full h-48 sm:h-64 md:h-72"
                            />
                          )}
                        </div>
                      ) : (
                        <div className="p-4 flex items-center justify-between">
                          <div className="text-sm text-gray-700 break-words">
                            {current?.fileName ||
                              current?.fileOriginalName ||
                              current?.file ||
                              "No file attached"}
                          </div>
                          <div className="text-xs text-gray-400">
                            {current?.fileSize
                              ? `${formatBytes(current.fileSize)}`
                              : file
                              ? `${formatBytes(file.size)}`
                              : ""}
                          </div>
                        </div>
                      )}

                      {/* Change file overlay on the preview box */}
                      <label className="absolute top-2 right-2 inline-flex items-center gap-2 bg-white/90 px-3 py-1 rounded-lg cursor-pointer border">
                        <span className="text-sm">Change file</span>
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.csv"
                          onChange={handleFileSelect}
                          className="hidden"
                        />
                      </label>
                    </div>

                    <div className="mt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="text-sm text-gray-600 break-words">
                        {current?.fileName || "No file attached"}
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={handleDownloadCurrent}
                          disabled={!current}
                          className="px-3 py-1 rounded-lg border text-sm"
                        >
                          Download
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(false);
                      setCurrent(null);
                    }}
                    className="px-4 py-2 rounded-lg border"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving || title.trim() === ""}
                    className="px-4 py-2 rounded-lg bg-[#0b2540] text-white"
                  >
                    {saving ? "Saving..." : "Save"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminKnowledgeList;
