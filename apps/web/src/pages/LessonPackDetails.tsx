import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Clock,
  PlayCircle,
  Lock,
  BookOpen,
  ShoppingCart,
  Film
} from "lucide-react";

import LessonPackService, { type LessonPackData } from "../services/LessonPackService";

// --- Configuration ---
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

const getImageUrl = (path?: string): string => {
  if (!path) return "https://via.placeholder.com/1200x600?text=Lesson+Pack";
  if (path.startsWith("http")) return path;
  const cleanPath = path.replace(/\\/g, "/").replace(/^\/+/, "");
  return `${API_BASE_URL}/${cleanPath}`;
};

export default function LessonPackDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [pack, setPack] = useState<LessonPackData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPackDetails = async () => {
      if (!id) return;
      try {
        setLoading(true);
        // Assuming your getById method handles public fetching as well, 
        // or you created a getByIdPublic method in your service.
        const data = await LessonPackService.getPublicById(id);
        setPack(data);
      } catch (error) {
        console.error("Failed to load lesson pack details", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPackDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f9fbff] pt-32 pb-20 px-6 flex justify-center">
        <div className="animate-pulse flex flex-col gap-8 w-full max-w-6xl">
          <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
          <div className="h-[400px] bg-gray-200 rounded-[2rem]"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 h-64 bg-gray-200 rounded-3xl"></div>
            <div className="h-64 bg-gray-200 rounded-3xl"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!pack) {
    return (
      <div className="min-h-screen bg-[#f9fbff] flex flex-col items-center justify-center text-center px-4">
        <h2 className="text-3xl font-bold text-[#0d4b5b] mb-4">Lesson Pack Not Found</h2>
        <p className="text-gray-500 mb-8">The lesson pack you are looking for does not exist or has been removed.</p>
        <button
          onClick={() => navigate("/lesson-packs")}
          className="bg-[#0d4b5b] text-white px-6 py-3 rounded-lg font-bold hover:bg-[#093946] transition-colors"
        >
          Browse All Packs
        </button>
      </div>
    );
  }

  // Calculate total duration of all videos
  const totalMinutes = pack.videos.reduce((acc, video) => acc + (video.durationMinutes || 0), 0);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return (
    <div className="min-h-screen bg-[#f9fbff] font-sans text-gray-900 pb-20 pt-28 sm:pt-36">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">

        {/* Back Button */}
        <button
          onClick={() => navigate("/lesson-packs")}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-[#e6ecef] text-[#0d4b5b] hover:bg-[#d0dbe1] transition-colors mb-8"
          aria-label="Go Back"
        >
          <ArrowLeft size={18} />
        </button>

        {/* HERO CARD */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-6 sm:p-8 flex flex-col lg:flex-row gap-8 lg:gap-12 mb-10"
        >
          {/* Image Section */}
          <div className="lg:w-1/2 relative rounded-[1.5rem] overflow-hidden h-64 lg:h-auto min-h-[300px] border border-gray-100">
            <img
              src={getImageUrl(pack.coverImage)}
              alt={pack.title}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Info Section */}
          <div className="lg:w-1/2 flex flex-col justify-center py-4">
            <h1 className="text-3xl sm:text-4xl md:text-[2.75rem] font-black text-[#0d4b5b] leading-tight mb-6 uppercase">
              {pack.title}
            </h1>

            <div className="flex flex-wrap items-center gap-6 mb-8 text-gray-500 text-sm font-medium">
              <div className="flex items-center gap-2">
                <Film size={18} className="text-[#0d4b5b]" />
                {pack.videos.length} Lessons
              </div>
              <div className="flex items-center gap-2">
                <Clock size={18} className="text-[#0d4b5b]" />
                {hours > 0 ? `${hours}h ` : ''}{minutes}m total
              </div>
            </div>

            <div className="text-3xl sm:text-4xl font-black text-[#f88f89] mb-8">
              LKR {pack.price.toLocaleString()}
            </div>

            {/* CTA Button */}
            {pack.hasAccess ? (
              <button className="w-full sm:w-max bg-[#0d4b5b] text-white px-8 py-3.5 rounded-lg font-bold text-sm flex items-center justify-center gap-2 shadow-sm hover:bg-[#093946] transition-colors">
                <PlayCircle size={20} /> Continue Learning
              </button>
            ) : (
              <button
                className="w-full sm:w-max bg-[#0d4b5b] text-white px-8 py-3.5 rounded-lg font-bold text-sm flex items-center justify-center gap-2 shadow-sm hover:bg-[#093946] transition-colors"
                onClick={() => navigate(`/student/lesson-pack/${pack._id}`)}
              >
                <ShoppingCart size={20} /> Purchase Lesson Pack
              </button>
            )}
          </div>
        </motion.div>

        {/* CONTENT GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left Column: Description */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2"
          >
            <div className="bg-white rounded-[2rem] p-8 md:p-10 shadow-sm border border-gray-100 h-full">
              <h2 className="text-2xl font-bold text-[#0d4b5b] flex items-center gap-3 mb-8">
                <BookOpen className="text-[#0d4b5b]" size={28} /> About this Pack
              </h2>
              <div className="text-gray-700 text-sm leading-relaxed font-sans whitespace-pre-wrap">
                {pack.description || "No detailed description provided for this lesson pack."}
              </div>
            </div>
          </motion.div>

          {/* Right Column: Curriculum / Videos */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-1"
          >
            <div className="bg-[#eef2f6] rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden flex flex-col h-full max-h-[600px]">

              {/* Header */}
              <div className="p-6 pb-4">
                <h3 className="text-xl font-bold text-[#0d4b5b]">Course Curriculum</h3>
                <p className="text-xs text-gray-500 font-medium mt-1">{pack.videos.length} videos included</p>
              </div>

              {/* List Container */}
              <div className="bg-white mx-3 mb-3 rounded-2xl flex-1 overflow-hidden flex flex-col">
                <div className="overflow-y-auto p-4 space-y-3 custom-scrollbar h-full">
                  {pack.videos.map((video, index) => (
                    <div
                      key={video._id || index}
                      className={`flex items-start gap-4 p-4 rounded-xl border border-gray-50 transition-colors ${pack.hasAccess
                        ? "bg-[#f5f8fa] hover:bg-[#eef2f6] cursor-pointer group"
                        : "bg-[#f9fbff] cursor-not-allowed"
                        }`}
                    >
                      <div className="mt-0.5 text-gray-400 shrink-0">
                        {pack.hasAccess ? (
                          <PlayCircle size={18} className="text-[#0d4b5b] group-hover:scale-110 transition-transform" />
                        ) : (
                          <Lock size={16} />
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className={`font-bold text-xs sm:text-sm leading-tight ${pack.hasAccess ? "text-gray-800" : "text-gray-500"}`}>
                          {index + 1}. {video.title}
                        </h4>
                        <div className="flex items-center gap-1.5 text-[11px] text-gray-500 mt-2">
                          <Clock size={12} />
                          {video.durationMinutes} min
                        </div>
                      </div>
                    </div>
                  ))}

                  {pack.videos.length === 0 && (
                    <div className="text-center py-8 text-gray-400 text-sm">
                      No videos have been added to this pack yet.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
}