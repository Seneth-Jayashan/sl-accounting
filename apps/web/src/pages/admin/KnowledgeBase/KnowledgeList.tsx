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
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6 pb-24">
      
      {/* Header & Controls */}
      <div className="bg-white border border-gray-100 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-[#0b2540] text-white flex items-center justify-center text-lg font-bold">KB</div>
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

      {error && <div className="text-red-600 bg-red-50 p-3 rounded-lg text-sm">{error}</div>}

      {/* List Content */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        
        {/* Selection Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-gray-100 text-xs sm:text-sm text-gray-600">
            <div className="flex items-center gap-3">
                <IconCheckbox checked={allSelected} onChange={selectAll} />
                <span>{selectedIds.length > 0 ? `${selectedIds.length} Selected` : "Select All"}</span>
            </div>
            <span className="hidden sm:inline">Total: {filteredItems.length} items</span>
        </div>

        {loading ? (
            <div className="p-8 text-center text-gray-400 text-sm">Loading materials...</div>
        ) : filteredItems.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
                <DocumentIcon className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                <p>No materials found.</p>
            </div>
        ) : (
            <>
                {/* Desktop Table */}
                <div className="hidden sm:block overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-white text-gray-500 border-b border-gray-100">
                            <tr>
                                <th className="p-4 w-12"></th>
                                <th className="p-4">Title</th>
                                <th className="p-4">Category</th>
                                <th className="p-4">Status</th>
                                <th className="p-4">Size</th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredItems.map(item => (
                                <DesktopRow 
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
                        </tbody>
                    </table>
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