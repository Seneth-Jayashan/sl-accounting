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
    <div className="min-h-screen bg-white font-sans text-gray-900 pb-20">

      {/* HERO SECTION - Padding and Alignment Fixed */}
      <div className="relative bg-[#f9fbff] pt-32 pb-8 sm:pt-40 sm:pb-10">
        <div className="relative max-w-7xl mx-auto px-6 text-center">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-[3.5rem] font-black mb-6 font-sans leading-tight"
          >
            <span className="text-[#0d4b5b]">Master Topics with</span> <span className="text-[#f88f89]">Lesson Packs</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-sm sm:text-base text-gray-700 max-w-2xl mx-auto mb-10 leading-relaxed font-sans font-medium"
          >
            Access premium recorded sessions, comprehensive study materials, and focused video collections to learn at your own pace.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="max-w-4xl mx-auto relative group z-20"
          >
            <div className="relative flex items-center bg-white rounded-lg overflow-hidden border border-gray-100 shadow-sm p-1">
              <div className="pl-4 pr-2 text-gray-300"><Search size={18} /></div>
              <input
                type="text"
                placeholder="Search for lesson packs..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full p-3 text-gray-600 outline-none placeholder-gray-400 text-sm bg-transparent font-sans"
              />
            </div>
          </motion.div>
        </div>
      </div>

      {/* CONTENT SECTION */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-16 sm:pt-12">

        {/* Title */}
        <div className="mb-12 border-b border-gray-100 pb-6">
          <h2 className="text-2xl font-bold text-[#0d4b5b] flex items-center gap-3 font-sans">
            <BookOpen className="text-[#0d4b5b]" size={28} /> Available Lesson Packs
          </h2>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-xl h-[400px] animate-pulse border border-gray-100 shadow-sm"></div>
            ))}
          </div>
        ) : filteredPacks.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-gray-100 max-w-2xl mx-auto">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6"><Frown className="w-10 h-10 text-gray-400" /></div>
            <h3 className="text-xl font-bold text-[#0d4b5b] mb-2">No lesson packs found</h3>
            <p className="text-gray-500 mb-6 text-sm">We couldn't find any lesson packs matching your search.</p>
            <button
              onClick={() => setSearch("")}
              className="text-[#0d4b5b] font-bold hover:text-[#f88f89] underline transition-colors text-sm"
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
                  className="group bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col h-full relative"
                >
                  <div
                    onClick={() => navigate(`/lesson-packs/${pack._id}`)}
                    className="cursor-pointer flex flex-col h-full"
                  >
                    <div className="relative h-48 overflow-hidden bg-[#e6ecef]">
                      <img
                        src={getImageUrl(pack.coverImage)}
                        alt={pack.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        loading="lazy"
                      />

                      {/* Video Count Badge */}
                      <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                        <span className="flex items-center gap-1.5 bg-[#0d4b5b] text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-sm">
                          <PlayCircle size={12} /> {pack.videos?.length || 0} Video{(pack.videos?.length || 0) !== 1 && 's'}
                        </span>
                      </div>

                      {/* Price Tag */}
                      <div className="absolute bottom-4 right-4">
                        <div className="bg-[#16a34a] text-white px-3 py-1 rounded-full font-bold shadow-sm text-xs flex items-center gap-1">
                          LKR. {pack.price.toLocaleString()}
                        </div>
                      </div>
                    </div>

                    <div className="p-6 flex-1 flex flex-col">
                      <h3 className="text-lg font-bold text-[#0d4b5b] mb-2 group-hover:text-[#f88f89] transition-colors line-clamp-1 font-sans">
                        {pack.title}
                      </h3>

                      <p className="text-gray-500 text-xs line-clamp-3 mb-6 font-sans leading-relaxed flex-1">
                        {pack.description || "No description provided for this lesson pack."}
                      </p>

                      <button className="w-full mt-auto bg-[#0d4b5b] text-white font-bold py-3 rounded-md hover:bg-[#093946] transition-colors flex items-center justify-center gap-2 text-sm shadow-sm">
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