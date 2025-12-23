import React, { useEffect, useState } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import SidebarStudent from "../../components/sidebar/SidebarStudent";
import BottomNavStudent from "../../components/bottomNavbar/BottomNavStudent";
import Dropdown from "../../components/Dropdown";
import { api } from "../../services/api";

type KBItem = {
  _id: string;
  title: string;
  description?: string;
  fileName?: string;
  fileMime?: string;
  uploadedBy?: any;
  createdAt?: string;
  catageory?: string;
  fileSize?: number | null;
};

const StudentKnowledgeBase: React.FC = () => {
  const [items, setItems] = useState<KBItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("All");
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
      const res = await api.get(`/knowledge${q ? `?search=${encodeURIComponent(q)}` : ""}`);
      if (res.data?.success) {
        const items = res.data.items || [];
        // fetch sizes in parallel where possible
        const sizePromises = items.map(async (it: KBItem) => {
          try {
            const r = await api.get(`/knowledge/${it._id}/size`);
            if (r?.data?.success && typeof r.data.size === 'number') {
              return { ...it, fileSize: r.data.size } as KBItem;
            }
          } catch (e) {
            // ignore size errors
            console.debug('size fetch failed for', it._id, e);
          }
          return { ...it, fileSize: null } as KBItem;
        });

        const itemsWithSizes = await Promise.all(sizePromises);
        setItems(itemsWithSizes);
      } else {
        setError(res.data?.message || "Failed to load materials");
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.message || err.message || "Failed to load materials");
    } finally {
      setLoading(false);
    }
  };

  const formatBytes = (bytes?: number | null) => {
    if (bytes === null || bytes === undefined) return "";
    if (bytes === 0) return "0 B";
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(Number(bytes)) / Math.log(1024));
    return `${(Number(bytes) / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  const CATEGORIES = [
    "Lecture Notes",
    "Reading Materials",
    "Past Papers",
    "Assignments",
    "Other",
  ];

  const handleDownload = (id: string, fileName?: string) => {
    // Use authenticated axios request to download as blob (includes Authorization)
    (async () => {
      try {
        const res = await api.get(`/knowledge/${id}/download`, { responseType: 'blob' });
        const blob = new Blob([res.data], { type: res.headers['content-type'] || 'application/octet-stream' });
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;

        // Prefer filename from Content-Disposition if available
        const disposition = res.headers['content-disposition'] as string | undefined;
        let filename = fileName || 'download';
        if (disposition) {
          const match = /filename\*=UTF-8''([^;\n\r]+)/.exec(disposition) || /filename="?([^";]+)"?/.exec(disposition);
          if (match && match[1]) filename = decodeURIComponent(match[1]);
        }

        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(downloadUrl);
      } catch (err: any) {
        console.error('Download error', err);
        if (err.response?.status === 401) {
          setError('Please log in to download materials.');
        } else {
          setError(err?.response?.data?.message || err.message || 'Download failed');
        }
      }
    })();
  };

  const timeAgo = (iso?: string) => {
    if (!iso) return "";
    const diff = Date.now() - new Date(iso).getTime();
    const sec = Math.floor(diff / 1000);
    if (sec < 60) return `${sec}s ago`;
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min}m ago`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr}h ago`;
    const days = Math.floor(hr / 24);
    return `${days}d ago`;
  };

  const openPreview = async (it: KBItem) => {
    setError(null);
    setLoadingPreview(true);
    setPreviewOpen(true);
    try {
      const res = await api.get(`/knowledge/${it._id}/download`, { responseType: 'blob' });
      const mime = res.headers['content-type'] || it.fileMime || '';
      const blob = new Blob([res.data], { type: mime });
      const url = window.URL.createObjectURL(blob);
      setPreviewUrl(url);
      setPreviewMime(mime as string);
      setPreviewName(it.fileName || 'preview');
    } catch (err: any) {
      console.error('Preview failed', err);
      setError(err?.response?.data?.message || err.message || 'Preview failed');
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

  // Close preview on ESC
  React.useEffect(() => {
    if (!previewOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closePreview();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewOpen]);

  const filteredItems = items.filter((it) => {
    const byCategory = filter === "All" ? true : (it.catageory || "Other") === filter;
    const q = (search || "").trim().toLowerCase();
    const bySearch =
      q === ""
        ? true
        : (it.title || "").toLowerCase().includes(q) ||
          (it.description || "").toLowerCase().includes(q);
    return byCategory && bySearch;
  });

  return (
    <DashboardLayout Sidebar={SidebarStudent} BottomNav={BottomNavStudent}>
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Knowledge Base</h1>
          <p className="text-sm text-gray-500">Browse and download materials uploaded by admins.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex-1">
            <div className="relative">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search title or description"
                className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl outline-none text-sm"
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

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm bg-white border border-gray-200 rounded-xl px-3 py-1.5">
              <span className="text-gray-500">Filter</span>
              <Dropdown
                value={filter}
                onChange={(v) => setFilter(v)}
                options={[{ value: "All", label: "All" }, ...CATEGORIES.map((c) => ({ value: c, label: c }))]}
                className="pl-3 pr-9 py-1.5 text-sm rounded-lg"
                wrapperClassName="w-44"
              />
            </div>

            <button onClick={() => { setSearch(""); setFilter("All"); fetchItems(); }} className="px-4 py-2 rounded-xl border border-gray-200 bg-white">Refresh</button>
          </div>
        </div>

        {loading && <div className="text-center text-gray-500">Loading...</div>}
        {error && <div className="text-red-600">{error}</div>}

        {!loading && filteredItems.length === 0 && (
          <div className="text-center text-gray-500">
            No materials available.
            <div className="mt-3 flex items-center justify-center gap-3">
              <button onClick={() => { setSearch(""); setFilter("All"); fetchItems(); }} className="px-3 py-1.5 rounded-lg border text-sm">Reset filters</button>
            </div>
          </div>
        )}

        <div className="grid gap-4">
          {filteredItems.map((it) => {
            const ext = (it.fileName || '').split('.').pop()?.toLowerCase() || '';
            const isImage = (it.fileMime || '').startsWith('image/') || ['png','jpg','jpeg','gif','webp'].includes(ext);
            const isPdf = (it.fileMime || '').includes('pdf') || ext === 'pdf';
            const typeLabel = isPdf ? 'PDF' : isImage ? 'Image' : ext.toUpperCase() || 'FILE';

            return (
              <div key={it._id} className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center gap-4">
                <div className="w-14 h-14 flex-shrink-0 rounded-lg bg-[#f1f5f9] flex items-center justify-center text-xl font-semibold text-[#0b2540]">
                  {isPdf ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M6 2h7l5 5v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z"/></svg>
                  ) : isImage ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M21 19V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2zM8.5 11.5l2.5 3 3-4 4.5 6H5l3.5-5.5z"/></svg>
                  ) : (
                    <span className="text-xs">{typeLabel}</span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-semibold text-gray-900 truncate">{it.title}</div>
                    <div className="text-xs text-gray-500">{timeAgo(it.createdAt)}</div>
                  </div>
                  {it.description && <div className="text-sm text-gray-500 truncate mt-1">{it.description}</div>}
                  <div className="mt-3 flex items-center gap-3">
                    <div className="text-xs px-2 py-1 rounded-full bg-slate-50 border border-gray-100 text-gray-700">{it.catageory || 'Other'}</div>
                    <div className="text-xs px-2 py-1 rounded-full bg-white border border-gray-100 text-gray-500">{typeLabel}</div>
                    <div className="text-xs text-gray-400">{it.createdAt ? new Date(it.createdAt).toLocaleDateString() : ''}</div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <div className="text-xs text-gray-500">{it.fileSize ? formatBytes(it.fileSize) : '—'}</div>
                  <div className="flex items-center gap-2">
                    { (isImage || isPdf) && (
                      <button onClick={() => openPreview(it)} className="px-3 py-1 rounded-xl border border-gray-200 text-sm bg-white">Preview</button>
                    ) }
                    <button onClick={() => handleDownload(it._id, it.fileName)} className="px-3 py-1 rounded-xl bg-[#0b2540] text-white text-sm">Download</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {previewOpen && (
        <div onClick={closePreview} className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-auto p-4 relative">
            <button
              aria-label="Close preview"
              title="Close"
              onClick={closePreview}
              className="absolute right-3 top-3 w-9 h-9 rounded-full bg-white/95 flex items-center justify-center shadow text-gray-600 hover:bg-white focus:outline-none focus:ring-2 focus:ring-[#0b2540]/30"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            {loadingPreview ? (
              <div className="text-center py-16">Loading preview...</div>
            ) : previewUrl ? (
              <div>
                {previewMime && previewMime.startsWith('image/') ? (
                  <img src={previewUrl} alt={previewName || 'preview'} className="w-full object-contain" />
                ) : (
                  <iframe src={previewUrl} title={previewName || 'preview'} className="w-full h-[70vh]" />
                )}
                <div className="mt-3 flex items-center justify-end gap-2">
                  <a href={previewUrl} download={previewName || 'file'} className="px-3 py-1 rounded-lg border">Download</a>
                </div>
              </div>
            ) : (
              <div className="text-center text-red-600">Preview not available</div>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default StudentKnowledgeBase;
