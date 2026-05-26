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
      <div className="min-h-screen bg-brand-aliceBlue/30 pt-32 pb-20 px-6 flex justify-center">
        <div className="animate-pulse flex flex-col gap-8 w-full max-w-6xl">
          <div className="h-10 bg-gray-200 rounded w-48"></div>
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
      <div className="min-h-screen bg-brand-aliceBlue/30 flex flex-col items-center justify-center text-center px-4">
        <h2 className="text-3xl font-bold text-brand-prussian mb-4">Lesson Pack Not Found</h2>
        <p className="text-gray-500 mb-8">The lesson pack you are looking for does not exist or has been removed.</p>
        <button 
          onClick={() => navigate("/lesson-packs")}
          className="bg-brand-cerulean text-white px-6 py-3 rounded-xl font-bold hover:bg-brand-prussian transition-colors"
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
    <div className="min-h-screen bg-brand-aliceBlue/30 font-sans text-gray-900 pb-20 pt-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        
        {/* Back Button */}
        <button 
          onClick={() => navigate("/lesson-packs")}
          className="flex items-center gap-2 text-brand-prussian/70 hover:text-brand-cerulean font-bold mb-8 transition-colors"
        >
          <ArrowLeft size={20} /> Back to Lesson Packs
        </button>

        {/* HERO CARD */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[2.5rem] shadow-xl border border-gray-100 overflow-hidden flex flex-col lg:flex-row mb-12"
        >
          {/* Image Section */}
          <div className="lg:w-1/2 relative h-64 lg:h-auto">
            <img 
              src={getImageUrl(pack.coverImage)} 
              alt={pack.title} 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-brand-prussian/80 to-transparent lg:bg-gradient-to-t lg:from-brand-prussian/80 lg:via-brand-prussian/20"></div>
          </div>

          {/* Info Section */}
          <div className="lg:w-1/2 p-8 md:p-12 flex flex-col justify-center bg-brand-prussian text-white">
            <h1 className="text-3xl md:text-4xl font-black font-sinhala leading-tight mb-4 text-transparent bg-clip-text bg-gradient-to-r from-white to-brand-aliceBlue/80">
              {pack.title}
            </h1>
            
            <div className="flex flex-wrap items-center gap-6 mb-8 text-brand-aliceBlue/80 text-sm font-medium">
              <div className="flex items-center gap-2">
                <Film size={18} className="text-brand-cerulean" />
                {pack.videos.length} Lessons
              </div>
              <div className="flex items-center gap-2">
                <Clock size={18} className="text-brand-jasmine" />
                {hours > 0 ? `${hours}h ` : ''}{minutes}m total
              </div>
            </div>

            <div className="text-4xl font-black text-brand-coral mb-8">
              LKR {pack.price.toLocaleString()}
            </div>

            {/* CTA Button */}
            {pack.hasAccess ? (
              <button className="w-full sm:w-auto bg-green-500 text-white px-8 py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 shadow-lg shadow-green-500/20 hover:bg-green-600 transition-colors">
                <PlayCircle size={24} /> Continue Learning
              </button>
            ) : (
              <button
                className="w-full sm:w-auto bg-gradient-to-r from-brand-cerulean to-blue-600 text-white px-8 py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 shadow-lg shadow-brand-cerulean/30 hover:shadow-brand-cerulean/50 transition-all hover:-translate-y-1"
                onClick={() => navigate(`/student/lesson-pack/${pack._id}`)}
              >
                <ShoppingCart size={24} /> Purchase Lesson Pack
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
            className="lg:col-span-2 space-y-8"
          >
            <div className="bg-white rounded-[2rem] p-8 md:p-10 shadow-sm border border-gray-100">
              <h2 className="text-2xl font-bold text-brand-prussian flex items-center gap-2 mb-6">
                <BookOpen className="text-brand-cerulean" /> About this Pack
              </h2>
              <div className="text-gray-600 leading-relaxed font-sans whitespace-pre-wrap">
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
            <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden sticky top-32">
              <div className="p-6 bg-gray-50 border-b border-gray-100">
                <h3 className="text-xl font-bold text-brand-prussian">Course Curriculum</h3>
                <p className="text-sm text-gray-500 mt-1">{pack.videos.length} videos included</p>
              </div>
              
              <div className="max-h-[500px] overflow-y-auto p-4 space-y-2 custom-scrollbar">
                {pack.videos.map((video, index) => (
                  <div 
                    key={video._id || index} 
                    className={`flex items-start gap-4 p-4 rounded-xl transition-colors ${
                      pack.hasAccess 
                        ? "hover:bg-brand-aliceBlue/50 cursor-pointer group" 
                        : "bg-gray-50 opacity-80 cursor-not-allowed"
                    }`}
                  >
                    <div className="mt-1">
                      {pack.hasAccess ? (
                        <PlayCircle size={20} className="text-brand-cerulean group-hover:text-brand-prussian transition-colors" />
                      ) : (
                        <Lock size={18} className="text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className={`font-bold text-sm ${pack.hasAccess ? "text-gray-800" : "text-gray-500"}`}>
                        {index + 1}. {video.title}
                      </h4>
                      <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1.5">
                        <Clock size={12} />
                        {video.durationMinutes} mins
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
          </motion.div>

        </div>
      </div>
    </div>
  );
}