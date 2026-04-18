import React, { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
import { 
  Plus, Search, Edit2, Trash2, X, 
  CheckCircle2, XCircle, Image as ImageIcon,
  Loader2, ListVideo, DollarSign
} from "lucide-react";
import LessonPackService, { type LessonPackData, type PlaylistItem } from "../../../services/LessonPackService";
import BatchService from "../../../services/BatchService";

const extractYoutubeId = (url: string) => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

// --- NEW SAFE URL FORMATTER ---
const getSmartCoverUrl = (pack: any) => {
  if (pack.coverImage) {
    // 1. Get base URL (e.g. "http://localhost:3000/api/v1")
    let baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api/v1";
    
    // 2. Strip off the "/api/v1" part because uploads sit at the root domain
    baseUrl = baseUrl.replace(/\/api\/v1\/?$/, ''); 
    
    // 3. Ensure the cover image path starts with exactly one slash
    const cleanPath = pack.coverImage.replace(/\\/g, "/").replace(/^\/+/, "");
    
    return `${baseUrl}/${cleanPath}`;
  }
  
  if (pack.videos && pack.videos.length > 0 && pack.videos[0].youtubeId) {
    return `https://img.youtube.com/vi/${pack.videos[0].youtubeId}/maxresdefault.jpg`;
  }
  return null;
};

export default function LessonPacks() {
  const [packs, setPacks] = useState<LessonPackData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    isPublished: true,
    batch: "" // For admin view to associate with batch
  });
  const [videos, setVideos] = useState<PlaylistItem[]>([{ title: "", youtubeUrl: "", durationMinutes: 0 }]);
  const [customImage, setCustomImage] = useState<File | null>(null);
  const [existingCover, setExistingCover] = useState<string | null>(null);

  const fetchPacks = async () => {
    try {
      setLoading(true);
      const data = await LessonPackService.getAll();
      setPacks(data);
    } catch (error) {
      toast.error("Failed to load lesson packs.");
    } finally {
      setLoading(false);
    }
  };

  const [batches, setBatches] = useState<{ _id: string; name: string }[]>([]);
  const fetchBatches = async () => {
    try {
      const data = await BatchService.getAllPublicBatches();
      setBatches(data.batches || []);
    } catch (error) {
      toast.error("Failed to load batches.");
    }
  };

  useEffect(() => { fetchPacks(); }, []);
  useEffect(() => { fetchBatches(); }, []);

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
        setFormData({
          title: fullPack.title,
          description: fullPack.description || "",
          price: fullPack.price.toString(),
          isPublished: fullPack.isPublished,
          batch: fullPack.batch || ""
        });
        setVideos(fullPack.videos.length > 0 ? fullPack.videos : [{ title: "", youtubeUrl: "", durationMinutes: 0 }]);
        setExistingCover(fullPack.coverImage || null);
      } catch (e) {
        toast.error("Failed to load pack details");
        setIsModalOpen(false);
      } finally {
        setLoadingDetails(false);
      }
    } else {
      setEditingId(null);
      setFormData({ title: "", description: "", price: "", isPublished: true, batch: "" });
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
    setVideos([...videos, { title: "", youtubeUrl: "", durationMinutes: 0 }]);
  };
  const removeVideo = (index: number) => {
    setVideos(videos.filter((_, i) => i !== index));
  };
  const updateVideo = (index: number, field: keyof PlaylistItem, value: any) => {
    const newVideos = [...videos];
    // @ts-ignore
    newVideos[index][field] = value;
    setVideos(newVideos);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return toast.error("Title is required.");
    if (!formData.batch) return toast.error("Batch is required.");
    if (videos.length === 0 || !videos[0].youtubeUrl.trim()) return toast.error("At least one video is required.");

    setIsSubmitting(true);
    try {
      const payload = { 
          title: formData.title,
          description: formData.description,
          price: Number(formData.price) || 0,
          isPublished: formData.isPublished,
          videos: videos,
          coverImageFile: customImage,
          batch: formData.batch 
      };

      if (editingId) {
        await LessonPackService.update(editingId, payload);
        toast.success("Lesson Pack updated successfully!");
      } else {
        await LessonPackService.create(payload);
        toast.success("Lesson Pack created successfully!");
      }
      closeModal();
      fetchPacks();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to save lesson pack.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) return;
    try {
      await LessonPackService.delete(id);
      setPacks((prev) => prev.filter(p => p._id !== id));
      toast.success("Lesson Pack deleted.");
    } catch (error) {
      toast.error("Failed to delete lesson pack.");
    }
  };

  const handleTogglePublish = async (id: string) => {
    setPacks((prev) => prev.map(p => p._id === id ? { ...p, isPublished: !p.isPublished } : p));
    try { await LessonPackService.togglePublish(id); } 
    catch (error) { fetchPacks(); }
  };

  const filteredPacks = useMemo(() => {
    return packs.filter(p => p.title.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [packs, searchTerm]);

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto pb-24 font-sans">
      
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-brand-prussian tracking-tight">Lesson Packs</h1>
          <p className="text-sm text-gray-500 mt-1">Create premium video playlists for student purchase.</p>
        </div>
        <button 
          onClick={() => openModal()}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-brand-cerulean hover:bg-brand-prussian text-white px-5 py-3 rounded-xl text-sm font-bold transition-all shadow-md shadow-brand-cerulean/20 active:scale-95"
        >
          <Plus size={18} strokeWidth={2.5} /> Add Playlist
        </button>
      </header>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-brand-aliceBlue mb-6 flex items-center">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text" placeholder="Search playlists..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-brand-aliceBlue/30 border border-brand-aliceBlue rounded-xl text-sm focus:ring-2 focus:ring-brand-cerulean/20 focus:border-brand-cerulean outline-none transition-all"
          />
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center">
          <Loader2 className="w-10 h-10 text-brand-cerulean animate-spin mb-4" />
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Loading Library...</p>
        </div>
      ) : filteredPacks.length === 0 ? (
        <div className="bg-white rounded-3xl p-16 text-center border border-dashed border-brand-aliceBlue flex flex-col items-center">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
            <ListVideo className="w-10 h-10 text-gray-300" />
          </div>
          <h3 className="text-xl font-bold text-brand-prussian mb-2">No Playlists Found</h3>
          <p className="text-sm text-gray-500 max-w-sm">Bundle YouTube videos together and sell them as premium lesson packs.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredPacks.map((pack) => (
              <motion.div 
                layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                key={pack._id} 
                className="bg-white rounded-2xl border border-brand-aliceBlue overflow-hidden shadow-sm hover:shadow-lg transition-all flex flex-col"
              >
                <div className="aspect-video relative bg-brand-aliceBlue/50 overflow-hidden flex items-center justify-center">
                  {getSmartCoverUrl(pack) ? (
                    <img src={getSmartCoverUrl(pack)!} alt={pack.title} className="w-full h-full object-cover" />
                  ) : (
                    <ListVideo size={32} className="text-brand-cerulean/30" />
                  )}
                  
                  <div className="absolute top-3 left-3 flex gap-2">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider backdrop-blur-md border ${
                      pack.isPublished ? 'bg-green-500/80 text-white border-green-500/50' : 'bg-gray-900/60 text-white border-gray-700/50'
                    }`}>
                      {pack.isPublished ? <CheckCircle2 size={12}/> : <XCircle size={12}/>}
                      {pack.isPublished ? 'Visible' : 'Hidden'}
                    </span>
                  </div>
                </div>

                <div className="p-4 flex-1 flex flex-col">
                  <h3 className="font-bold text-brand-prussian text-base line-clamp-2 mb-1" title={pack.title}>{pack.title}</h3>
                  <div className="flex items-center gap-4 mb-4 mt-2">
                     <span className="text-xs font-bold text-brand-cerulean bg-brand-aliceBlue px-2 py-1 rounded">LKR {pack.price}</span>
                  </div>
                  
                  <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between gap-2">
                    <button 
                      onClick={() => handleTogglePublish(pack._id)}
                      className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${pack.isPublished ? 'bg-gray-100 text-gray-500 hover:bg-gray-200' : 'bg-brand-cerulean/10 text-brand-cerulean hover:bg-brand-cerulean/20'}`}
                    >
                      {pack.isPublished ? 'Hide' : 'Publish'}
                    </button>
                    
                    <div className="flex items-center gap-1">
                      <button onClick={() => openModal(pack._id)} className="p-2 text-gray-400 hover:text-brand-cerulean hover:bg-brand-aliceBlue rounded-lg transition-colors">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => handleDelete(pack._id, pack.title)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* ADD / EDIT MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closeModal} className="absolute inset-0 bg-brand-prussian/40 backdrop-blur-sm" />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} 
              className="bg-gray-50 rounded-[2rem] w-full max-w-2xl relative z-10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="px-6 py-5 border-b border-gray-200 flex justify-between items-center bg-white shrink-0">
                <div>
                  <h2 className="text-lg font-bold text-brand-prussian">{editingId ? 'Edit Playlist' : 'Create New Playlist'}</h2>
                </div>
                <button onClick={closeModal} disabled={isSubmitting} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
                  <X size={20}/>
                </button>
              </div>

              <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">
                {loadingDetails ? (
                   <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-brand-cerulean"/></div>
                ) : (
                  <form id="playlist-form" onSubmit={handleSubmit} className="space-y-6">
                    
                    {/* Basic Info */}
                    <div className="bg-white p-5 rounded-2xl border border-gray-200 space-y-4">
                      <h3 className="text-sm font-bold text-brand-prussian mb-2">General Details</h3>
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Bundle Title *</label>
                        <input required type="text" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-cerulean/20 outline-none" />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Description</label>
                        <textarea rows={2} value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-cerulean/20 outline-none resize-none" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                         <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-1"><DollarSign size={12}/> Price (LKR) *</label>
                            <input required type="number" min="0" value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-brand-prussian focus:ring-2 focus:ring-brand-cerulean/20 outline-none" />
                         </div>
                         <div>
                           <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Batch *</label>
                           <select
                            required
                            value={formData.batch}
                            onChange={(e) => setFormData({ ...formData, batch: e.target.value })}
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-cerulean/20 outline-none"
                           >
                            <option value="" disabled>Select a batch</option>
                            {batches.map((batch) => (
                              <option key={batch._id} value={batch._id}>{batch.name}</option>
                            ))}
                           </select>
                         </div>
                      </div>
                    </div>

                    {/* Cover Image */}
                    <div className="bg-white p-5 rounded-2xl border border-gray-200">
                        <h3 className="text-sm font-bold text-brand-prussian mb-4">Cover Image</h3>
                        <div className="aspect-[21/9] bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden relative group">
                          
                          {/* --- SMART PREVIEW LOGIC --- */}
                          {customImage ? (
                            <img src={URL.createObjectURL(customImage)} alt="Preview" className="w-full h-full object-cover" />
                          ) : existingCover ? (
                            <img src={`${import.meta.env.VITE_API_BASE_URL}${existingCover}`} alt="Existing" className="w-full h-full object-cover" />
                          ) : videos[0]?.youtubeUrl && extractYoutubeId(videos[0].youtubeUrl) ? (
                            <img src={`https://img.youtube.com/vi/${extractYoutubeId(videos[0].youtubeUrl)}/maxresdefault.jpg`} alt="Auto YT Preview" className="w-full h-full object-cover opacity-70" />
                          ) : (
                            <div className="flex flex-col items-center text-gray-400">
                               <ImageIcon size={32} className="mb-2 opacity-50" />
                               <span className="text-xs font-medium">Upload Cover</span>
                            </div>
                          )}

                          <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer backdrop-blur-sm text-white">
                            <ImageIcon size={24} className="mb-1" />
                            <span className="text-xs font-bold uppercase tracking-wider">Change Image</span>
                            <input type="file" accept="image/*" className="hidden" onChange={(e) => { if (e.target.files && e.target.files[0]) setCustomImage(e.target.files[0]); }} />
                          </label>
                        </div>
                        {customImage && (
                          <button type="button" onClick={() => setCustomImage(null)} className="text-[10px] text-red-500 font-bold uppercase tracking-wider mt-2 hover:underline">
                            Remove Custom Image
                          </button>
                        )}
                    </div>

                    {/* Video Builder */}
                    <div className="bg-white p-5 rounded-2xl border border-gray-200">
                      <div className="flex justify-between items-center mb-4">
                         <h3 className="text-sm font-bold text-brand-prussian">Playlist Videos</h3>
                      </div>
                      
                      <div className="space-y-4">
                        {videos.map((vid, idx) => (
                          <div key={idx} className="p-4 bg-gray-50 border border-gray-200 rounded-xl relative group">
                            <button type="button" onClick={() => removeVideo(idx)} disabled={videos.length === 1} className="absolute top-2 right-2 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30"><Trash2 size={16}/></button>
                            <div className="space-y-3 pr-8">
                               <div>
                                 <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Video Title *</label>
                                 <input required type="text" placeholder="e.g. Chapter 1: Introduction" value={vid.title} onChange={(e) => updateVideo(idx, 'title', e.target.value)} className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-cerulean/20 outline-none" />
                               </div>
                               <div className="grid grid-cols-4 gap-3">
                                 <div className="col-span-3">
                                   <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">YouTube URL *</label>
                                   <input required type="url" placeholder="https://youtube.com/..." value={vid.youtubeUrl} onChange={(e) => updateVideo(idx, 'youtubeUrl', e.target.value)} className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-cerulean/20 outline-none" />
                                 </div>
                                 <div className="col-span-1">
                                   <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Mins</label>
                                   <input type="number" min="0" value={vid.durationMinutes} onChange={(e) => updateVideo(idx, 'durationMinutes', Number(e.target.value))} className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-cerulean/20 outline-none" />
                                 </div>
                               </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <button type="button" onClick={addVideo} className="w-full mt-4 py-3 border-2 border-dashed border-gray-300 text-gray-500 rounded-xl font-bold text-sm hover:border-brand-cerulean hover:text-brand-cerulean hover:bg-brand-aliceBlue/30 transition-colors flex items-center justify-center gap-2">
                         <Plus size={16} /> Add Another Video
                      </button>
                    </div>

                  </form>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-gray-200 bg-white flex gap-3 shrink-0">
                <button type="button" onClick={closeModal} disabled={isSubmitting || loadingDetails} className="flex-1 py-3 text-sm font-bold text-gray-600 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors">
                  Cancel
                </button>
                <button type="submit" form="playlist-form" disabled={isSubmitting || loadingDetails} className="flex-1 py-3 text-sm font-bold text-white bg-brand-prussian hover:bg-brand-cerulean rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50">
                  {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                  {editingId ? 'Save Changes' : 'Create Playlist'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}