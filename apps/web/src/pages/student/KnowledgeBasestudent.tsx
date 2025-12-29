import React, { useEffect, useState } from "react";
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
        const list = (res.data.items as KBItem[]) || [];
        setItems(list);
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

  const handleDownload = (id: string, fileName?: string) => {
    (async () => {
      try {
        const res = await api.get(`/knowledge/${id}/download`, { responseType: "blob" });
        const blob = new Blob([res.data], { type: res.headers["content-type"] || "application/octet-stream" });
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = downloadUrl;
        a.target = "_self";

        const disposition = res.headers["content-disposition"] as string | undefined;
        let filename = fileName || "download";
        if (disposition) {
          const match = /filename\*=UTF-8''([^;\n\r]+)/.exec(disposition) || /filename="?([^";]+)"?/.exec(disposition);
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
          setError(err?.response?.data?.message || err.message || "Download failed");
        }
      }
    })();
  };

  const openPreview = async (it: KBItem) => {
    setError(null);
    setLoadingPreview(true);
    setPreviewOpen(true);
    try {
      const res = await api.get(`/knowledge/${it._id}/download`, { responseType: "blob" });
      const mime = res.headers["content-type"] || it.fileMime || "";
      const blob = new Blob([res.data], { type: mime });
      const url = window.URL.createObjectURL(blob);
      setPreviewUrl(url);
      setPreviewMime(mime as string);
      setPreviewName(it.fileName || "preview");
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
  }, [previewOpen]);

  const filteredItems = items.filter((it) => {
    const byCategory = filter === "All" ? true : (it.category || "Other") === filter;
    const q = (search || "").trim().toLowerCase();
    const bySearch =
      q === ""
        ? true
        : (it.title || "").toLowerCase().includes(q) ||
          (it.description || "").toLowerCase().includes(q);
    return byCategory && bySearch;
  });

  return (
    <div className="w-full min-h-screen bg-[#e8f2ff]">
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-[#0b2540]">Knowledge Base</h1>
          <p className="text-sm text-gray-500">Browse and download materials uploaded by admins.</p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1">
            <div className="relative">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search title or description"
                className="w-full px-4 py-3 bg-white border border-[#dbe7ff] rounded-xl outline-none text-sm shadow-sm"
                aria-label="Search materials"
              />
              {search ? (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 text-xs bg-[#eef3ff] px-3 py-1.5 rounded-lg hover:bg-[#e1e9ff]"
                >
                  Clear
                </button>
              ) : null}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm bg-white border border-[#dbe7ff] rounded-xl px-3 py-2 shadow-sm">
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
              onClick={() => {
                setSearch("");
                setFilter("All");
                fetchItems();
              }}
              className="px-4 py-2 rounded-xl border border-[#dbe7ff] bg-white text-sm shadow-sm hover:bg-[#eef3ff]"
            >
              Refresh
            </button>
          </div>
        </div>

        {loading && <div className="text-center text-gray-500">Loading...</div>}
        {error && <div className="text-red-600">{error}</div>}

        {!loading && filteredItems.length === 0 && (
          <div className="text-center text-gray-500">
            No materials available.
            <div className="mt-3 flex items-center justify-center gap-3">
              <button
                onClick={() => {
                  setSearch("");
                  setFilter("All");
                  fetchItems();
                }}
                className="px-3 py-1.5 rounded-lg border text-sm"
              >
                Reset filters
              </button>
            </div>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredItems.map((it) => {
            const ext = (it.fileName || "").split(".").pop()?.toLowerCase() || "";
            const isImage = (it.fileMime || "").startsWith("image/") || ["png", "jpg", "jpeg", "gif", "webp"].includes(ext);
            const isPdf = (it.fileMime || "").includes("pdf") || ext === "pdf";
            const typeLabel = isPdf ? "PDF" : isImage ? "Image" : ext.toUpperCase() || "FILE";
            const isPreviewable = isImage || isPdf;
            const dateLabel = it.createdAt
              ? new Date(it.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" }).toUpperCase()
              : "";

            return (
              <div key={it._id} className="bg-white rounded-2xl border border-[#e6edf8] shadow-sm p-5 flex flex-col gap-4">
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-[#fff4e8] text-[#f97316] flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20 4H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h5l3 3 3-3h5a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" />
                    </svg>
                  </div>
                  {isPreviewable && (
                    <button
                      onClick={() => openPreview(it)}
                      className="text-xs text-[#0b2540] bg-[#eef3ff] px-3 py-1.5 rounded-lg hover:bg-[#e1e9ff] border border-[#dbe7ff]"
                    >
                      Preview
                    </button>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="text-base font-semibold text-[#0b2540] leading-snug line-clamp-2">{it.title}</div>
                  {it.description && <div className="text-sm text-gray-600 line-clamp-2">{it.description}</div>}
                </div>

                <div className="flex items-center gap-2 text-xs text-gray-500">
                  
                  <span className="text-gray-300">&bull;</span>
                  <span className="tracking-wide">{dateLabel}</span>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span className="px-2 py-1 rounded-full bg-[#eef3ff] text-[#0b2540]">{it.category || "Other"}</span>
                  <span className="px-2 py-1 rounded-full bg-[#f8fafc] border border-[#e6edf8] text-gray-600">{typeLabel}</span>
                </div>

                {isPdf ? (
                  <div>
                    <button
                      onClick={() => handleDownload(it._id, it.fileName)}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#e5edf9] text-[#0b2540] font-semibold text-sm hover:bg-[#d7e4f7] transition"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2M7 10l5 5 5-5M12 15V3" />
                      </svg>
                      <span className="whitespace-nowrap">Download File</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <button
                      onClick={() => handleDownload(it._id, it.fileName)}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#e5edf9] text-[#0b2540] font-semibold text-sm hover:bg-[#d7e4f7] transition"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2M7 10l5 5 5-5M12 15V3" />
                      </svg>
                      <span className="whitespace-nowrap">Download File</span>
                    </button>
                    {isPreviewable && (
                      <button
                        onClick={() => openPreview(it)}
                        className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-3 rounded-xl border border-[#e6edf8] text-sm text-[#0b2540] bg-white hover:bg-[#f6f8fc] transition"
                      >
                        <span className="whitespace-nowrap">Quick Preview</span>
                      </button>
                    )}
                  </div>
                )}
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
                {previewMime && previewMime.startsWith("image/") ? (
                  <img src={previewUrl} alt={previewName || "preview"} className="w-full object-contain" />
                ) : (
                  <iframe src={previewUrl} title={previewName || "preview"} className="w-full h-[70vh]" />
                )}
                <div className="mt-3 flex items-center justify-end gap-2">
                  <a href={previewUrl} download={previewName || "file"} className="px-3 py-1 rounded-lg border">
                    Download
                  </a>
                </div>
              </div>
            ) : (
              <div className="text-center text-red-600">Preview not available</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentKnowledgeBase;
