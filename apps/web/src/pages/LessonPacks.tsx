import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  BookOpen,
  ArrowRight,
  Frown,
  PlayCircle
} from "lucide-react";

// Assuming LessonPackService is in the correct relative path
import LessonPackService, { type LessonPackData } from "../services/LessonPackService";

// --- Configuration ---
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

// --- Animation Variants ---
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
};

// --- Helpers ---
const getImageUrl = (path?: string): string => {
  if (!path) return "https://via.placeholder.com/800x450?text=Lesson+Pack";
  if (path.startsWith("http")) return path;
  const cleanPath = path.replace(/\\/g, "/").replace(/^\/+/, "");
  return `${API_BASE_URL}/${cleanPath}`;
};

export default function PublicLessonPacksPage() {
  const navigate = useNavigate();

  const [lessonPacks, setLessonPacks] = useState<LessonPackData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // 1. Fetch Data
  useEffect(() => {
    const fetchLessonPacks = async () => {
      setLoading(true);
      try {
        // UPDATED: Using the public endpoint to avoid 401 Unauthorized errors
        const data = await LessonPackService.getAllPublic();
        
        // Assuming we only want to show published packs to the public
        const publishedPacks = data.filter((pack) => pack.isPublished);
        setLessonPacks(publishedPacks);
      } catch (error) {
        console.error("Failed to load lesson packs", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLessonPacks();
  }, []);

  // 2. Filter Logic (Search Only)
  const filteredPacks = useMemo(() => {
    const searchTerm = search.toLowerCase().trim();
    
    return lessonPacks.filter((pack) => {
      const matchesSearch = 
        pack.title.toLowerCase().includes(searchTerm) || 
        (pack.description && pack.description.toLowerCase().includes(searchTerm));
        
      return matchesSearch;
    });
  }, [lessonPacks, search]);

  return (
    <div className="min-h-screen bg-brand-aliceBlue/30 font-sans text-gray-900 pb-20">
      
      {/* HERO */}
      <div className="relative bg-brand-prussian text-white overflow-hidden rounded-b-[3rem] shadow-2xl z-10 pt-24 pb-20">
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
        <div className="absolute top-[-50%] left-[-10%] w-[600px] h-[600px] bg-brand-cerulean rounded-full blur-[120px] opacity-30 pointer-events-none"></div>
        <div className="absolute bottom-[-50%] right-[-10%] w-[600px] h-[600px] bg-brand-coral rounded-full blur-[120px] opacity-20 pointer-events-none"></div>

        <div className="relative max-w-7xl mx-auto px-6 text-center">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="text-4xl md:text-6xl font-black mb-6 tracking-tight font-sinhala leading-tight"
          >
            Master Topics with <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-jasmine to-brand-coral">Lesson Packs</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            transition={{ delay: 0.2 }} 
            className="text-lg md:text-xl text-brand-aliceBlue/80 max-w-2xl mx-auto mb-10 leading-relaxed font-sans"
          >
             Access premium recorded sessions, comprehensive study materials, and focused video collections to learn at your own pace.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.4 }} 
            className="max-w-2xl mx-auto relative group z-20"
          >
            <div className="absolute -inset-1 bg-gradient-to-r from-brand-cerulean to-brand-coral rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-500"></div>
            <div className="relative flex items-center bg-white rounded-xl overflow-hidden shadow-2xl p-1">
              <div className="pl-4 pr-2 text-gray-400"><Search size={20} /></div>
              <input 
                type="text" 
                placeholder="Search for lesson packs..." 
                value={search} 
                onChange={(e) => setSearch(e.target.value)} 
                className="w-full p-3 text-gray-800 outline-none placeholder-gray-400 font-medium bg-transparent" 
              />
            </div>
          </motion.div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        
        {/* Title */}
        <div className="mb-12">
            <h2 className="text-2xl font-bold text-brand-prussian flex items-center gap-2 font-sinhala">
                <BookOpen className="text-brand-cerulean" /> Available Lesson Packs
            </h2>
        </div>

        {/* Grid */}
        {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[1,2,3].map(i => (
                    <div key={i} className="bg-white rounded-[2rem] h-[450px] animate-pulse border border-gray-100 shadow-sm"></div>
                ))}
            </div>
        ) : filteredPacks.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-[2.5rem] shadow-sm border border-gray-100 max-w-2xl mx-auto">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6"><Frown className="w-10 h-10 text-gray-400" /></div>
                <h3 className="text-xl font-bold text-brand-prussian mb-2">No lesson packs found</h3>
                <p className="text-gray-500 mb-6 text-sm">We couldn't find any lesson packs matching your search.</p>
                <button 
                  onClick={() => setSearch("")} 
                  className="text-brand-cerulean font-bold hover:text-brand-prussian underline transition-colors text-sm"
                >
                  Clear Search
                </button>
            </div>
        ) : (
            <motion.div 
                key={search} 
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
                <AnimatePresence mode="popLayout">
                    {filteredPacks.map((pack) => (
                        <motion.div 
                            key={pack._id} 
                            variants={cardVariants}
                            className="group bg-white rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-2xl hover:border-brand-cerulean/20 transition-all duration-300 overflow-hidden flex flex-col h-full relative"
                        >
                            <div 
                              onClick={() => navigate(`/lesson-packs/${pack._id}`)} 
                              className="cursor-pointer flex flex-col h-full"
                            >
                                <div className="relative h-56 overflow-hidden bg-brand-aliceBlue">
                                    <img 
                                      src={getImageUrl(pack.coverImage)} 
                                      alt={pack.title} 
                                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                                      loading="lazy" 
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-brand-prussian/90 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity"></div>
                                    
                                    {/* Badges */}
                                    <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                                        <span className="flex items-center gap-1.5 bg-brand-cerulean/90 backdrop-blur-md text-white text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-widest shadow-sm border border-white/20">
                                            <PlayCircle size={12} /> {pack.videos?.length || 0} Video{(pack.videos?.length || 0) !== 1 && 's'}
                                        </span>
                                    </div>
                                    
                                    {/* Price Tag */}
                                    <div className="absolute bottom-4 right-4">
                                      <div className="bg-green-700 text-white px-4 py-1.5 rounded-xl font-bold shadow-lg text-sm flex items-center gap-1">
                                        LKR {pack.price.toLocaleString()}
                                      </div>
                                    </div>
                                </div>

                                <div className="p-6 flex-1 flex flex-col">
                                    <h3 className="text-xl font-bold text-brand-prussian mb-2 group-hover:text-brand-cerulean transition-colors line-clamp-1 font-sinhala leading-tight">
                                      {pack.title}
                                    </h3>
                                    
                                    <p className="text-gray-500 text-sm line-clamp-3 mb-6 font-sans leading-relaxed flex-1">
                                      {pack.description || "No description provided for this lesson pack."}
                                    </p>
                                    
                                    <button className="w-full mt-auto bg-brand-prussian text-white font-bold py-3.5 rounded-xl group-hover:bg-brand-cerulean transition-colors flex items-center justify-center gap-2 shadow-lg shadow-brand-prussian/10">
                                      View Lesson Pack <ArrowRight size={16} />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </motion.div>
        )}
      </div>
    </div>
  );
}