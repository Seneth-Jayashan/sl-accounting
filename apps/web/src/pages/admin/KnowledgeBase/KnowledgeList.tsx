import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../../layouts/DashboardLayout';
import SidebarAdmin from '../../../components/sidebar/SidebarAdmin';
import BottomNavAdmin from '../../../components/bottomNavbar/BottomNavAdmin';
import KnowledgeBaseAdminService from '../../../services/KnowledgeBaseAdminService';
import Swal from 'sweetalert2';

const CATEGORIES = [
  'Lecture Notes',
  'Reading Materials',
  'Past Papers',
  'Assignments',
  'Other',
];

const AdminKnowledgeList: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState<number>(Date.now());

  const [editing, setEditing] = useState(false);
  const [current, setCurrent] = useState<any | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [isPublished, setIsPublished] = useState(false);
  const [publishAt, setPublishAt] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchItems();
  }, []);

  // tick every second so scheduled countdowns update live
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDuration = (ms: number) => {
    if (ms <= 0) return '00:00:00';
    const total = Math.floor(ms / 1000);
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const seconds = total % 60;
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  };

  const formatBytes = (bytes?: number | null) => {
    if (!bytes && bytes !== 0) return '';
    if (bytes === 0) return '0 B';
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(Number(bytes)) / Math.log(1024));
    return `${(Number(bytes) / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  const getDisplayCategory = (item: any) => item?.catageory || item?.category || 'Other';

  const fetchItems = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await KnowledgeBaseAdminService.getAll();
      if (data?.success) setItems(data.items || []);
      else setError(data?.message || 'Failed to load items');
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.message || err.message || 'Failed to load items');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const item = items.find((it) => it._id === id);
    const title = item?.title || 'this item';
    const result = await Swal.fire({
      title: `Delete ${title}?`,
      text: 'This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel',
      reverseButtons: true,
    });

    if (!result.isConfirmed) return;

    try {
      const res = await KnowledgeBaseAdminService.delete(id);
      if (res?.success) {
        setItems((s) => s.filter((i) => i._id !== id));
      }
      await Swal.fire({ title: 'Deleted', text: 'Item deleted successfully', icon: 'success', timer: 1400, showConfirmButton: false });
    } catch (err: any) {
      console.error(err);
      await Swal.fire({ title: 'Delete failed', text: err?.response?.data?.message || err.message || 'Delete failed', icon: 'error' });
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((s) => {
      if (s.includes(id)) return s.filter(x => x !== id);
      return [...s, id];
    });
  };

  const selectAll = (checked: boolean) => {
    if (checked) setSelectedIds(items.map(i => i._id));
    else setSelectedIds([]);
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return;
    const result = await Swal.fire({
      title: `Delete ${selectedIds.length} item(s)?`,
      text: 'This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel',
      reverseButtons: true,
    });
    if (!result.isConfirmed) return;

    try {
      const res = await KnowledgeBaseAdminService.bulkDelete(selectedIds);
      if (res?.success) {
        setItems((s) => s.filter(i => !selectedIds.includes(i._id)));
        setSelectedIds([]);
        await Swal.fire({ title: 'Deleted', text: 'Items deleted', icon: 'success', timer: 1400, showConfirmButton: false });
      } else {
        await Swal.fire({ title: 'Failed', text: res?.message || 'Bulk delete failed', icon: 'error' });
      }
    } catch (err: any) {
      console.error(err);
      await Swal.fire({ title: 'Failed', text: err?.response?.data?.message || err.message || 'Bulk delete failed', icon: 'error' });
    }
  };

  const openEdit = (item: any) => {
    setCurrent(item);
    setTitle(item.title || '');
    setDescription(item.description || '');
    setCategory(item.catageory || item.category || CATEGORIES[0]);
    setIsPublished(Boolean(item.isPublished));
    setPublishAt(item.publishAt ? new Date(item.publishAt).toISOString().slice(0,16) : null);
    setFile(null);
    setEditing(true);
  };

  // Validate selected file (allow pdf, doc/docx, xls/xlsx, ppt/pptx, zip, csv)
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0];
      const allowedExt = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.zip', '.csv'];
      const name = (f.name || '').toLowerCase();
      const ok = allowedExt.some(ext => name.endsWith(ext));
      if (!ok) {
        setError('Unsupported file type. Please select PDF, Word, Excel, PowerPoint, ZIP, or CSV.');
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
      const mime = current.fileMime || '';
      const isPreviewable = mime === 'application/pdf' || mime.startsWith('image/');
      if (isPreviewable) {
        (async () => {
            try {
            const res = await KnowledgeBaseAdminService.download(current._id);
            if (cancelled) return;
            const blob = new Blob([res.data], { type: res.headers['content-type'] || mime });
            url = URL.createObjectURL(blob);
            setPreviewUrl(url);
          } catch (err) {
            console.error('preview fetch failed', err);
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
      const a = document.createElement('a');
      const name = current.fileName || current.fileOriginalName || current.file || 'material';
      a.href = url;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error(err);
      await Swal.fire({ title: 'Download failed', text: err?.response?.data?.message || err.message || 'Download failed', icon: 'error' });
    }
  };

  const handleUpdate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!current) return;
    setSaving(true);
    try {
      const form = new FormData();
      form.append('title', title);
      form.append('description', description || '');
      form.append('catageory', category);
      form.append('isPublished', String(isPublished));
      if (publishAt) form.append('publishAt', publishAt);
      if (file) form.append('file', file as Blob, (file as File).name);

      const res = await KnowledgeBaseAdminService.update(current._id, form);

      if (res?.success) {
        // update local list
        setItems((s) => s.map((it) => (it._id === current._id ? res.item || { ...it, ...res.item } : it)));
        setEditing(false);
        setCurrent(null);
      } else {
        await Swal.fire({ title: 'Update failed', text: res?.message || 'Update failed', icon: 'error' });
      }
    } catch (err: any) {
      console.error(err);
      await Swal.fire({ title: 'Update failed', text: err?.response?.data?.message || err.message || 'Update failed', icon: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout Sidebar={SidebarAdmin} BottomNav={BottomNavAdmin} showHeader={false}>
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <label className="inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                onChange={(e) => selectAll(e.target.checked)}
                checked={selectedIds.length === items.length && items.length > 0}
                className="sr-only"
              />
              <span className={`w-5 h-5 inline-flex items-center justify-center rounded-md border ${selectedIds.length === items.length && items.length > 0 ? 'bg-[#0b2540] border-[#0b2540] text-white' : 'bg-white border-gray-300'}`}>
                {selectedIds.length === items.length && items.length > 0 ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                ) : null}
              </span>
            </label>

            <div>
              <h1 className="text-2xl font-bold">Knowledge Base — Manage</h1>
              <p className="text-sm text-gray-500">View, edit or delete uploaded materials.</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {selectedIds.length > 0 && (
              <button onClick={handleDeleteSelected} className="px-3 py-1 rounded-xl border border-red-300 text-red-600 text-sm">Delete Selected ({selectedIds.length})</button>
            )}
          </div>
        </div>

        {loading && (
          <div className="grid gap-4">
            {[1,2,3].map((n) => (
              <div key={n} className="bg-white p-4 pl-12 rounded-2xl border border-gray-100 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/5 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-4/5 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-1/3" />
              </div>
            ))}
          </div>
        )}
        {error && <div className="text-red-600">{error}</div>}

        <div className="grid gap-4">
          {(!loading && items.length === 0) ? (
            <div className="bg-white p-6 rounded-2xl border border-dashed border-gray-200 text-center">
              <div className="text-lg font-semibold">No materials yet</div>
              <div className="text-sm text-gray-500 mt-2">There are no uploaded materials. Once materials are added they'll appear here.</div>
            </div>
          ) : items.map((it) => (
            <div key={it._id} className="relative bg-white p-4 pl-12 rounded-2xl border border-gray-100 flex items-center justify-between hover:shadow-md transition-shadow">
              {/* Absolute checkbox placed in front of the card text */}
              <label className="absolute left-4 top-1/2 -translate-y-1/2 inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={selectedIds.includes(it._id)} onChange={() => toggleSelect(it._id)} className="sr-only" />
                <span className={`w-5 h-5 inline-flex items-center justify-center rounded-md border shadow-sm ${selectedIds.includes(it._id) ? 'bg-[#0b2540] border-[#0b2540] text-white' : 'bg-white border-gray-200 text-transparent'} hover:scale-105 transition-transform`}> 
                  {selectedIds.includes(it._id) ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  ) : (
                    <svg className="w-4 h-4 opacity-0" viewBox="0 0 24 24" />
                  )}
                </span>
              </label>

              <div>
                <div className="font-semibold">{it.title}</div>
                <div className="text-sm text-gray-500">{it.description}</div>
                <div className="text-xs text-gray-400 mt-1">
                  {getDisplayCategory(it)} • {new Date(it.createdAt).toLocaleString()}
                </div>

                {/* scheduled countdown */}
                {it.publishAt && !it.isPublished && (() => {
                  const target = new Date(it.publishAt).getTime();
                  const diff = target - now;
                  if (diff > 0) {
                    return (
                      <div className="text-xs text-yellow-600 mt-2">Scheduled — publishes in {formatDuration(diff)}</div>
                    );
                  }
                  return null;
                })()}
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => openEdit(it)} className="px-3 py-1 rounded-xl bg-blue-600 text-white text-sm">Edit</button>
                <button onClick={() => handleDelete(it._id)} className="px-3 py-1 rounded-xl border border-red-200 text-red-600 text-sm">Delete</button>
              </div>
            </div>
          ))}
        </div>

        {editing && (
          <div className="fixed inset-0 bg-black/40 flex items-start sm:items-center justify-center z-50 p-4">
            <div className="w-full mx-auto max-w-lg sm:max-w-2xl bg-white rounded-2xl p-4 sm:p-6 shadow-xl max-h-[90vh] overflow-auto">
              <div className="flex items-start justify-between">
                <h2 className="text-lg font-semibold mb-4">Edit Material</h2>
                <button aria-label="Close" onClick={() => { setEditing(false); setCurrent(null); }} className="text-gray-500 hover:text-gray-800">✕</button>
              </div>
              <form onSubmit={(e) => { e.preventDefault(); handleUpdate(); }} className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Title</label>
                  <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-3 py-2 border rounded" />
                  {title.trim() === '' && <div className="text-xs text-red-500 mt-1">Title is required</div>}
                </div>

                <div>
                  <label className="text-sm font-medium">Description</label>
                  <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full px-3 py-2 border rounded" />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Category</label>
                  <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-3 py-2 border rounded">
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>

                  <div>
                    <label className="text-sm font-medium">File preview</label>
                    <div className="mt-2 relative w-full bg-gray-50 border border-gray-200 rounded-lg overflow-hidden">
                      {previewUrl ? (
                        <div className="w-full">
                          {((current?.fileMime || file?.type || '').startsWith('image/')) ? (
                            <img src={previewUrl} alt="preview" className="w-full max-h-48 sm:max-h-64 md:max-h-72 object-contain" />
                          ) : (
                            <iframe src={previewUrl} title="file-preview" className="w-full h-48 sm:h-64 md:h-72" />
                          )}
                        </div>
                      ) : (
                        <div className="p-4 flex items-center justify-between">
                          <div className="text-sm text-gray-700 break-words">{current?.fileName || current?.fileOriginalName || current?.file || 'No file attached'}</div>
                          <div className="text-xs text-gray-400">{(current?.fileMime || file?.type) || ''} {current?.fileSize ? `• ${formatBytes(current.fileSize)}` : (file ? `• ${formatBytes(file.size)}` : '')}</div>
                        </div>
                      )}

                      {/* Change file overlay on the preview box */}
                      <label className="absolute top-2 right-2 inline-flex items-center gap-2 bg-white/90 px-3 py-1 rounded-lg cursor-pointer border">
                        <span className="text-sm">Change file</span>
                        <input type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.csv" onChange={handleFileSelect} className="hidden" />
                      </label>
                    </div>

                      <div className="mt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="text-sm text-gray-600 break-words">{current?.fileName || 'No file attached'}</div>
                      <div className="flex gap-2">
                        <button type="button" onClick={handleDownloadCurrent} disabled={!current} className="px-3 py-1 rounded-lg border text-sm">Download</button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <button type="button" onClick={() => { setEditing(false); setCurrent(null); }} className="px-4 py-2 rounded-lg border">Cancel</button>
                  <button type="submit" disabled={saving || title.trim() === ''} className="px-4 py-2 rounded-lg bg-[#0b2540] text-white">{saving ? 'Saving...' : 'Save'}</button>
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
