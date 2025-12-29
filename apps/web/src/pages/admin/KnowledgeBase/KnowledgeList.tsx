import React, { useEffect, useState, useRef } from "react";
import KnowledgeBaseAdminService from "../../../services/KnowledgeBaseAdminService";
import Dropdown from "../../../components/Dropdown";
import Swal from "sweetalert2";
import { 
  TrashIcon, 
  PencilIcon, 
  DocumentIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  ArrowPathIcon
} from "@heroicons/react/24/outline";

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

  const publishTimerRef = useRef<number | null>(null);

  // Custom Checkbox Component
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
      onClick={(e) => { e.stopPropagation(); onChange(!checked); }}
      className={`w-5 h-5 inline-flex items-center justify-center rounded border transition focus:outline-none ${
        checked ? "bg-[#0b2540] border-transparent" : "bg-white border-gray-300"
      }`}
    >
      {checked && (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 text-white" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 00-1.414-1.414L7 12.172 4.707 9.879A1 1 0 003.293 11.293l3 3a1 1 0 001.414 0l8-8z" clipRule="evenodd" />
        </svg>
      )}
    </button>
  );

  useEffect(() => { fetchItems(); }, []);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    return () => {
      if (publishTimerRef.current) {
        clearTimeout(publishTimerRef.current);
        publishTimerRef.current = null;
      }
    };
  }, []);

  const formatBytes = (bytes?: number | null) => {
    if (!bytes && bytes !== 0) return "";
    if (bytes === 0) return "0 B";
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(Number(bytes)) / Math.log(1024));
    return `${(Number(bytes) / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  const getDisplayCategory = (item: any) => item?.category || "Other";

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
        const items = data.items || [];
        const sizePromises = items.map(async (it: any) => {
          if (!it.filePath && !it.file) return it;
          try {
            const res = await KnowledgeBaseAdminService.getSize(it._id);
            if (res?.success && typeof res.size === 'number') it.fileSize = res.size;
          } catch (e) { console.debug('size fetch failed', e); }
          return it;
        });

        const itemsWithSizes = await Promise.all(sizePromises);
        setItems(itemsWithSizes);

        // Schedule refresh logic omitted for brevity, same as original
      } else setError(data?.message || "Failed to load items");
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || "Failed to load items");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: `Delete Item?`,
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Delete",
      confirmButtonColor: "#d33",
    });

    if (!result.isConfirmed) return;

    try {
      const res = await KnowledgeBaseAdminService.delete(id);
      if (res?.success) {
        setItems((s) => s.filter((i) => i._id !== id));
        Swal.fire("Deleted", "Item deleted successfully", "success");
      }
    } catch (err) {
      Swal.fire("Error", "Delete failed", "error");
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id]);
  };

  const selectAll = (checked: boolean) => {
    setSelectedIds(checked ? items.map((i) => i._id) : []);
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return;
    const result = await Swal.fire({
      title: `Delete ${selectedIds.length} items?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Delete",
      confirmButtonColor: "#d33",
    });
    if (!result.isConfirmed) return;

    try {
      const res = await KnowledgeBaseAdminService.bulkDelete(selectedIds);
      if (res?.success) {
        setItems((s) => s.filter((i) => !selectedIds.includes(i._id)));
        setSelectedIds([]);
        Swal.fire("Deleted", "Items deleted", "success");
      }
    } catch (err) {
      Swal.fire("Error", "Bulk delete failed", "error");
    }
  };

  const openEdit = (item: any) => {
    setCurrent(item);
    setTitle(item.title || "");
    setDescription(item.description || "");
    setCategory(item.category || CATEGORIES[0]);
    setIsPublished(Boolean(item.isPublished));
    setPublishAt(item.publishAt ? new Date(item.publishAt).toISOString().slice(0, 16) : null);
    setFile(null);
    setEditing(true);
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
        setItems((s) => s.map((it) => it._id === current._id ? res.item || { ...it, ...res.item } : it));
        setEditing(false);
        setCurrent(null);
        Swal.fire("Success", "Item updated", "success");
      }
    } catch (err) {
      Swal.fire("Error", "Update failed", "error");
    } finally {
      setSaving(false);
    }
  };

  const filteredItems = items.filter((it) => {
    const byCategory = filter === "All" ? true : getDisplayCategory(it) === filter;
    const q = (search || "").trim().toLowerCase();
    const bySearch = q === "" ? true : (it.title || "").toLowerCase().includes(q);
    return byCategory && bySearch;
  });

  const allSelected = selectedIds.length === items.length && items.length > 0;

  return (
      <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
        <div className="bg-white border border-gray-100 rounded-2xl p-4 sm:p-5 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-xl bg-[#0b2540] text-white flex items-center justify-center text-lg font-semibold">KB</div>
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Knowledge Base</h1>
                    <p className="text-xs text-gray-500">Manage learning materials.</p>
                </div>
            </div>
            
            {/* Mobile Actions */}
            <div className="flex sm:hidden gap-2">
                <button onClick={fetchItems} className="p-2 border rounded-lg"><ArrowPathIcon className="w-5 h-5"/></button>
            </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search materials..."
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#0b2540]/10 outline-none"
                />
            </div>

            {/* Filter & Actions */}
            <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0">
                <div className="min-w-[140px]">
                    <Dropdown
                        value={filter}
                        onChange={setFilter}
                        options={[{ value: "All", label: "All Types" }, ...CATEGORIES.map((c) => ({ value: c, label: c }))]}
                        className="py-2.5 text-sm"
                    />
                </div>
                
                <button onClick={fetchItems} className="hidden sm:flex items-center gap-2 px-4 py-2.5 border rounded-xl hover:bg-gray-50 text-sm font-medium">
                    <ArrowPathIcon className="w-4 h-4" /> Refresh
                </button>

                {selectedIds.length > 0 && (
                    <button onClick={handleDeleteSelected} className="flex items-center gap-2 px-4 py-2.5 bg-red-50 text-red-600 rounded-xl text-sm font-medium hover:bg-red-100 transition-colors whitespace-nowrap">
                        <TrashIcon className="w-4 h-4" /> Delete ({selectedIds.length})
                    </button>
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
                  wrapperClassName="w-36 sm:w-44"
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
            <span className="hidden sm:inline">Total: {filteredItems.length} items</span>
        </div>

        {error && <div className="text-red-600">{error}</div>}

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-4 py-3 border-b border-gray-100 text-sm text-gray-600 bg-slate-50">
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
            <>
              {/* Mobile cards */}
              <div className="sm:hidden divide-y divide-gray-100">
                {loading
                  ? [1, 2, 3].map((n) => (
                      <div key={n} className="p-4 animate-pulse">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="h-4 bg-gray-200 rounded w-2/3 mb-2" />
                            <div className="h-3 bg-gray-200 rounded w-full" />
                          </div>
                          <div className="w-5 h-5 bg-gray-200 rounded" />
                        </div>
                        <div className="mt-3 flex gap-2">
                          <div className="h-6 bg-gray-200 rounded w-20" />
                          <div className="h-6 bg-gray-200 rounded w-24" />
                        </div>
                      </div>
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
                        <div key={it._id} className={`${isSelected ? "bg-[#f8fafc]" : ""} p-4`}>
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="font-semibold text-gray-900 break-words">{it.title}</div>
                              <div className="text-xs text-gray-500 mt-0.5 break-words">
                                {it.description || "No description provided."}
                              </div>
                            </div>
                            <IconCheckbox
                              checked={isSelected}
                              onChange={() => toggleSelect(it._id)}
                              ariaLabel={`Select ${it.title}`}
                              title={isSelected ? `Deselect ${it.title}` : `Select ${it.title}`}
                            />
                          </div>

                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border ${badgeColor}`}>
                              {status === "Published" ? "●" : status === "Scheduled" ? "◑" : "○"}
                              <span>{status}</span>
                            </span>
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs border bg-gray-50 text-gray-700 border-gray-200">
                              {getDisplayCategory(it)}
                            </span>
                            <span className="text-xs text-gray-500">
                              {created.toLocaleDateString()}
                            </span>
                            <span className="text-xs text-gray-500">
                              {it.fileSize ? formatBytes(it.fileSize) : "—"}
                            </span>
                          </div>

                          {publishCountdown && (
                            <div className="text-amber-700 font-medium text-[11px] mt-2">{publishCountdown}</div>
                          )}

                          <div className="mt-3 flex items-center justify-end gap-2">
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
                        </div>
                      );
                    })}
              </div>

              {/* Desktop table */}
              <div className="hidden sm:block overflow-auto">
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
            </>
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

                {/* Mobile Cards */}
                <div className="sm:hidden divide-y divide-gray-100">
                    {filteredItems.map(item => (
                        <MobileCard 
                            key={item._id}
                            item={item}
                            selected={selectedIds.includes(item._id)}
                            onSelect={() => toggleSelect(item._id)}
                            onEdit={() => openEdit(item)}
                            onDelete={() => handleDelete(item._id)}
                            now={now}
                            formatBytes={formatBytes}
                        />
                    ))}
                </div>
            </>
        )}
      </div>

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 bottom-20 sm:bottom-0 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4 backdrop-blur-sm">
            <div className="bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white z-10 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                    <h2 className="text-lg font-bold">Edit Material</h2>
                    <button onClick={() => setEditing(false)} className="p-2 bg-gray-100 rounded-full"><XMarkIcon className="w-5 h-5"/></button>
                </div>
                
                <form onSubmit={handleUpdate} className="p-6 space-y-5">
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase">Title</label>
                        <input value={title} onChange={e => setTitle(e.target.value)} className="w-full mt-1 p-3 border rounded-xl outline-none focus:ring-2 focus:ring-[#0b2540]/20" />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase">Description</label>
                        <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className="w-full mt-1 p-3 border rounded-xl outline-none focus:ring-2 focus:ring-[#0b2540]/20" />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase">Category</label>
                            <select value={category} onChange={e => setCategory(e.target.value)} className="w-full mt-1 p-3 border rounded-xl bg-white">
                                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase">Status</label>
                            <div className="flex mt-1 border rounded-xl overflow-hidden">
                                <button type="button" onClick={() => setIsPublished(true)} className={`flex-1 py-3 text-xs font-bold ${isPublished ? 'bg-[#0b2540] text-white' : 'bg-gray-50'}`}>Live</button>
                                <button type="button" onClick={() => setIsPublished(false)} className={`flex-1 py-3 text-xs font-bold ${!isPublished ? 'bg-amber-500 text-white' : 'bg-gray-50'}`}>Draft</button>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={() => setEditing(false)} className="flex-1 py-3.5 border rounded-xl font-bold text-gray-600">Cancel</button>
                        <button type="submit" disabled={saving} className="flex-1 py-3.5 bg-[#0b2540] text-white rounded-xl font-bold shadow-lg disabled:opacity-50">
                            {saving ? "Saving..." : "Save Changes"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}

    </div>
  );
};

// --- Sub-components for Cleaner Render ---

const DesktopRow = ({ item, selected, onSelect, onEdit, onDelete, formatBytes }: any) => {
    const status = item.isPublished ? "Published" : item.publishAt ? "Scheduled" : "Draft";
    const badgeColor = status === "Published" ? "bg-emerald-50 text-emerald-700" : status === "Scheduled" ? "bg-amber-50 text-amber-700" : "bg-gray-100 text-gray-600";
    
    return (
        <tr className={`hover:bg-slate-50 transition-colors ${selected ? 'bg-slate-50' : ''}`}>
            <td className="p-4">
                <input type="checkbox" checked={selected} onChange={onSelect} className="w-4 h-4 rounded border-gray-300 text-[#0b2540] focus:ring-[#0b2540]" />
            </td>
            <td className="p-4">
                <div className="font-semibold text-gray-900">{item.title}</div>
                <div className="text-xs text-gray-500 truncate max-w-[200px]">{item.description}</div>
            </td>
            <td className="p-4 text-gray-600">{item.category}</td>
            <td className="p-4">
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${badgeColor}`}>{status}</span>
            </td>
            <td className="p-4 text-gray-500 text-xs font-mono">{item.fileSize ? formatBytes(item.fileSize) : "—"}</td>
            <td className="p-4 text-right">
                <div className="flex justify-end gap-2">
                    <button onClick={onEdit} className="p-2 hover:bg-gray-200 rounded-full text-gray-600"><PencilIcon className="w-4 h-4"/></button>
                    <button onClick={onDelete} className="p-2 hover:bg-red-50 rounded-full text-red-500"><TrashIcon className="w-4 h-4"/></button>
                </div>
            </td>
        </tr>
    )
}

const MobileCard = ({ item, selected, onSelect, onEdit, onDelete, formatBytes }: any) => {
    const status = item.isPublished ? "Published" : item.publishAt ? "Scheduled" : "Draft";
    
    return (
        <div onClick={onEdit} className={`p-4 active:bg-gray-50 transition-colors ${selected ? 'bg-slate-50' : ''}`}>
            <div className="flex items-start gap-3">
                <div onClick={(e) => { e.stopPropagation(); onSelect(); }} className="pt-1">
                    <input type="checkbox" checked={selected} readOnly className="w-5 h-5 rounded border-gray-300 text-[#0b2540] focus:ring-[#0b2540]" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                        <h3 className="font-bold text-gray-900 truncate pr-2">{item.title}</h3>
                        <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded ${status === 'Published' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{status}</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5 truncate">{item.description || "No description"}</p>
                    
                    <div className="flex items-center gap-3 mt-3 text-xs text-gray-400">
                        <span className="bg-gray-100 px-2 py-1 rounded text-gray-600">{item.category}</span>
                        <span>{item.fileSize ? formatBytes(item.fileSize) : "—"}</span>
                    </div>
                </div>
                <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-2 text-gray-400 hover:text-red-500">
                    <TrashIcon className="w-5 h-5" />
                </button>
            </div>
        </div>
    )
}

export default AdminKnowledgeList;