import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search, PlayCircle, Lock, ListVideo, Loader2, CheckCircle2 } from "lucide-react";
import LessonPackService, { type LessonPackData } from "../../../services/LessonPackService";
import { useAuth } from "../../../contexts/AuthContext";

const getSmartCoverUrl = (pack: any) => {
  if (pack.coverImage) return `${import.meta.env.VITE_API_BASE_URL}${pack.coverImage}`;
  if (pack.videos && pack.videos.length > 0 && pack.videos[0].youtubeId) {
    return `https://img.youtube.com/vi/${pack.videos[0].youtubeId}/maxresdefault.jpg`;
  }
  return null;
};

export default function StudentLessonPacks() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [packs, setPacks] = useState<LessonPackData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchPacks = async () => {
      try {
        const data = await LessonPackService.getAll();
        const userBatchId = (user?.role === "student" && user.batch) ? user.batch : null;
        const batchPacks = userBatchId ? data.filter(pack => pack.batch === userBatchId) : [];
        const enrichedPacks = batchPacks.map(pack => ({
          ...pack,
          hasAccess: pack.price === 0 || pack.batch === userBatchId
        }));
        setPacks(enrichedPacks);
      } catch (error) {
        console.error("Failed to load lesson packs", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPacks();
  }, [user]);



  const filteredPacks = useMemo(() => {
    return packs.filter(p => p.title.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [packs, searchTerm]);

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto pb-24 font-sans min-h-screen bg-gray-50/50">
      <header className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-black text-brand-prussian tracking-tight">Premium Playlists</h1>
        <p className="text-sm text-gray-500 mt-1">Unlock exclusive lesson bundles and revision archives.</p>
      </header>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-brand-aliceBlue mb-8">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text" placeholder="Search playlists..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-brand-aliceBlue/30 border border-brand-aliceBlue rounded-xl text-sm focus:ring-2 focus:ring-brand-cerulean/20 outline-none transition-all"
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
          <p className="text-sm text-gray-500 max-w-sm">Check back later for new premium content.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredPacks.map((pack) => (
              <motion.div 
                layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                key={pack._id} 
                className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-xl hover:border-brand-cerulean/30 transition-all flex flex-col group"
              >
                <div className="aspect-video relative bg-brand-aliceBlue/50 overflow-hidden">
                  {getSmartCoverUrl(pack) ? (
                    <img src={getSmartCoverUrl(pack)!} alt={pack.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center"><ListVideo size={32} className="text-brand-cerulean/30" /></div>
                  )}
                  
                  {pack.hasAccess && (
                    <div className="absolute top-3 left-3 bg-green-500/90 backdrop-blur-sm text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 shadow-sm">
                      <CheckCircle2 size={12}/> Purchased
                    </div>
                  )}
                </div>

                <div className="p-6 flex-1 flex flex-col">
                  <h3 className="font-bold text-lg text-brand-prussian line-clamp-2 mb-2 group-hover:text-brand-cerulean transition-colors">{pack.title}</h3>
                  <p className="text-sm text-gray-500 line-clamp-2 mb-4 flex-1">{pack.description || "Comprehensive video lesson bundle."}</p>
                  
                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100">
                    <span className="font-black text-brand-prussian text-lg">
                      {pack.price === 0 ? "FREE" : `LKR ${pack.price}`}
                    </span>
                    
                    <button 
                      onClick={() => navigate(`/student/lesson-packs/${pack._id}`)}
                      className={`px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all active:scale-95 ${
                        pack.hasAccess 
                        ? 'bg-brand-cerulean text-white shadow-md shadow-brand-cerulean/20 hover:bg-brand-prussian' 
                        : 'bg-brand-aliceBlue text-brand-prussian hover:bg-gray-200'
                      }`}
                    >
                      {pack.hasAccess ? <><PlayCircle size={18}/> Watch</> : <><Lock size={18}/> Unlock</>}
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}