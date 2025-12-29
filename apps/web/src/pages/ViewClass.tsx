import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Calendar, 
  Clock,  
  CheckCircle2, 
  ArrowLeft, 
  Share2, 
  ArrowRight,
  BookOpen,
  GraduationCap,
  Layers,
  Tag
} from "lucide-react";

// Services & Context
import ClassService from "../services/ClassService";
import EnrollmentService from "../services/EnrollmentService"; 
import { useAuth } from "../contexts/AuthContext";
import LoadingPage from "../components/LoadingPage";

// --- Configuration ---
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000"; 

// --- Interfaces ---
interface Schedule {
  day: number;
  startTime: string;
  endTime: string;
}

interface ClassData {
  _id: string;
  name: string;
  description: string;
  price: number;
  level: string;
  batch: any;
  coverImage?: string;
  timeSchedules: Schedule[];
  tags?: string[];
  sessionDurationMinutes?: number;
  totalSessions?: number;
  recurrence?: string;
}

// --- Animation Variants ---
const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

export default function ViewPublicClassPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth(); 

  // --- State ---
  const [classData, setClassData] = useState<ClassData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEnrolled, setIsEnrolled] = useState(false);

  // --- Helper: Image URL ---
  const getImageUrl = (path?: string) => {
    if (!path) return "https://via.placeholder.com/1200x600?text=SL+Accounting";
    if (path.startsWith("http")) return path;
    const cleanPath = path.replace(/\\/g, "/").replace(/^\/+/, "");
    return `${API_BASE_URL}/${cleanPath}`;
  };

  // --- Helper: Day Name ---
  const getDayName = (dayIndex: number) => 
    ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][dayIndex] || "";

  // --- Fetch Data ---
  useEffect(() => {
    if (!id) return;

    let isMounted = true;

    const fetchData = async () => {
      setLoading(true);
      try {
        // 1. Fetch Class Data
        const data = await ClassService.getPublicClassById(id);
        if (isMounted) setClassData(Array.isArray(data) ? data[0] : data);

        // 2. Check Enrollment Status (Only if logged in)
        if (user) {
           try {
               const status = await EnrollmentService.checkEnrollmentStatus(id);
               if (isMounted) setIsEnrolled(status);
           } catch (e) {
               console.warn("Enrollment check failed (likely not enrolled)", e);
           }
        }

      } catch (err) {
        console.error(err);
        if (isMounted) setError("Class not found or unavailable.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();
    return () => { isMounted = false; };
  }, [id, user]);

  // --- Handle Enrollment Navigation ---
  const handleEnrollClick = () => {
    if (!classData) return;
    const targetEnrollmentPage = `/student/enrollment/${classData._id}`;
    if (user) {
      navigate(targetEnrollmentPage);
    } else {
      navigate("/login", { state: { from: targetEnrollmentPage } });
    }
  };

  if (loading) return <LoadingPage />;

  if (error || !classData) {
    return (
      <div className="min-h-screen bg-brand-aliceBlue/30 flex flex-col items-center justify-center text-center p-6">
        <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mb-6">
            <BookOpen className="w-10 h-10 text-red-400" />
        </div>
        <h2 className="text-3xl font-bold text-brand-prussian mb-2 font-sinhala">සමාවන්න! (Oops!)</h2>
        <p className="text-gray-500 mb-8 max-w-md">{error || "We couldn't find the class you are looking for."}</p>
        <button 
          onClick={() => navigate("/classes")}
          className="bg-brand-prussian text-white px-8 py-3 rounded-xl hover:bg-brand-cerulean transition-colors font-bold shadow-lg flex items-center gap-2"
        >
          <ArrowLeft size={20} /> Browse All Classes
        </button>
      </div>
    );
  }

  const schedule = classData.timeSchedules && classData.timeSchedules[0];

  return (
    <div className="min-h-screen bg-brand-aliceBlue/30 font-sans text-gray-900 pb-20">
      
      {/* --- HERO HEADER SECTION --- */}
      <div className="relative h-[50vh] min-h-[400px] sm:min-h-[500px] overflow-hidden rounded-b-[2rem] sm:rounded-b-[3rem] shadow-2xl z-10 bg-brand-prussian">
        
        {/* Background Image with Overlay */}
        <motion.div 
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            transition={{ duration: 10 }}
            className="absolute inset-0"
        >
            <img 
              src={getImageUrl(classData.coverImage)} 
              alt={classData.name} 
              className="w-full h-full object-cover opacity-80"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-brand-prussian via-brand-prussian/60 to-transparent"></div>
        </motion.div>

        {/* Hero Content */}
        <div className="absolute bottom-0 left-0 right-0 z-20 pb-12 sm:pb-16 pt-32 bg-gradient-to-t from-brand-prussian to-transparent">
            <div className="container mx-auto px-4 sm:px-6 max-w-6xl">
                <motion.div 
                    initial="hidden"
                    animate="visible"
                    variants={fadeInUp}
                >
                    <div className="flex flex-wrap gap-2 sm:gap-3 mb-4 sm:mb-6">
                        <span className="bg-brand-cerulean text-white px-3 py-1 sm:px-4 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-widest shadow-lg flex items-center gap-1.5">
                            <GraduationCap size={12} /> {classData.level}
                        </span>
                        {classData.batch && (
                            <span className="bg-brand-coral text-white px-3 py-1 sm:px-4 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-widest shadow-lg flex items-center gap-1.5">
                                <Layers size={12} /> {typeof classData.batch === 'object' ? classData.batch.name : 'Batch'}
                            </span>
                        )}
                    </div>
                    <h1 className="text-3xl sm:text-4xl md:text-6xl font-black text-white mb-2 sm:mb-4 leading-tight font-sinhala drop-shadow-lg">
                        {classData.name}
                    </h1>
                    <p className="text-brand-aliceBlue/80 text-base sm:text-lg md:text-xl max-w-2xl font-light leading-relaxed">
                        Master accounting concepts with expert guidance and comprehensive study materials.
                    </p>
                </motion.div>
            </div>
        </div>
      </div>

      {/* --- CONTENT CONTAINER --- */}
      <div className="container mx-auto px-4 sm:px-6 relative -mt-8 sm:-mt-10 z-30 max-w-6xl">
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
            
            {/* LEFT: Main Content */}
            <motion.div 
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="lg:col-span-2 space-y-6 sm:space-y-8"
            >
                {/* Schedule Card */}
                <div className="bg-white rounded-[2rem] p-6 sm:p-8 shadow-xl border border-white/50 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-brand-aliceBlue rounded-full -mr-10 -mt-10 z-0 pointer-events-none"></div>
                    
                    <h3 className="text-lg sm:text-xl font-bold text-brand-prussian mb-6 relative z-10 flex items-center gap-2">
                        <Clock className="text-brand-cerulean" /> Class Schedule
                    </h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10">
                        <div className="bg-brand-aliceBlue/50 p-4 sm:p-5 rounded-2xl flex items-center gap-4 border border-brand-cerulean/10">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-brand-cerulean shrink-0">
                                <Calendar size={20} />
                            </div>
                            <div>
                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Class Day</p>
                                <p className="text-brand-prussian font-bold text-base sm:text-lg">{schedule ? `${getDayName(schedule.day)}s` : "TBA"}</p>
                            </div>
                        </div>
                        <div className="bg-brand-aliceBlue/50 p-4 sm:p-5 rounded-2xl flex items-center gap-4 border border-brand-cerulean/10">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-brand-coral shrink-0">
                                <Clock size={20} />
                            </div>
                            <div>
                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Time</p>
                                <p className="text-brand-prussian font-bold text-base sm:text-lg">{schedule ? `${schedule.startTime} - ${schedule.endTime}` : "TBA"}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Description Card */}
                <div className="bg-white rounded-[2rem] p-6 sm:p-8 md:p-10 shadow-xl border border-white/50">
                    <h3 className="text-lg sm:text-xl font-bold text-brand-prussian mb-6 flex items-center gap-2">
                        <BookOpen className="text-brand-cerulean" /> About this Class
                    </h3>
                    <div className="prose prose-sm sm:prose-lg prose-blue max-w-none text-gray-600 font-sans leading-relaxed">
                        <p className="whitespace-pre-wrap">{classData.description}</p>
                    </div>

                    {/* Tags */}
                    {classData.tags && classData.tags.length > 0 && (
                        <div className="mt-8 sm:mt-10 pt-6 sm:pt-8 border-t border-gray-100">
                            <p className="text-[10px] font-bold text-gray-400 mb-4 uppercase tracking-widest flex items-center gap-2">
                                <Tag size={12} /> Topics Covered
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {classData.tags.map((tag, idx) => (
                                    <span key={idx} className="bg-brand-aliceBlue text-brand-prussian px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-bold border border-brand-cerulean/10">
                                        #{tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Back Navigation */}
                <div className="hidden sm:block">
                    <button 
                        onClick={() => navigate("/classes")}
                        className="inline-flex items-center gap-2 bg-brand-prussian backdrop-blur-md text-white px-5 py-2.5 rounded-full hover:bg-brand-cerulean transition-all text-sm font-bold shadow-lg group"
                    >
                        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back to Classes
                    </button>
                </div>
            </motion.div>

            {/* RIGHT: Sidebar / Pricing */}
            <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="lg:col-span-1 order-first lg:order-last" // On mobile, show pricing first? Or keep it last? Usually last is fine if sticky bottom bar isn't used. Here, order-first might push it above description which is good for conversion. Let's stick to default flow for now.
            >
                <div className="bg-white rounded-[2rem] p-6 sm:p-8 shadow-2xl border border-white/60 sticky top-24">
                    
                    {/* Price Tag */}
                    <div className="text-center mb-6 sm:mb-8 pb-6 sm:pb-8 border-b border-gray-100">
                        <p className="text-sm sm:text-lg text-gray-500 font-bold uppercase tracking-widest mb-1 sm:mb-2 font-sinhala">මාසික ගාස්තු</p>
                        <div className="flex items-center justify-center gap-1 text-brand-prussian">
                            <span className="text-base sm:text-lg font-bold opacity-60">LKR</span>
                            <span className="text-4xl sm:text-5xl font-black">{classData.price.toLocaleString()}</span>
                        </div>
                    </div>

                    {/* Features List */}
                    <div className="space-y-3 sm:space-y-4 mb-8 sm:mb-10">
                        {[
                            "Access to all live sessions via Zoom",
                            "Full recording access for revision",
                            "Downloadable study materials (PDF)",
                            "Interactive Q&A with instructor",
                            "LMS Access 24/7"
                        ].map((feature, i) => (
                            <div key={i} className="flex items-start gap-3">
                                <div className="mt-0.5 w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                                    <CheckCircle2 size={12} className="text-green-600" />
                                </div>
                                <p className="text-xs sm:text-sm text-gray-600 font-medium leading-tight">{feature}</p>
                            </div>
                        ))}
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-4">
                        <AnimatePresence mode="wait">
                            {isEnrolled ? (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="space-y-3"
                                >
                                    <div className="w-full bg-green-50 text-green-700 border border-green-200 font-bold py-3 sm:py-4 rounded-xl flex items-center justify-center gap-2 cursor-default text-sm sm:text-base">
                                        <CheckCircle2 size={18} /> Already Enrolled
                                    </div>
                                    <button 
                                        className="w-full bg-brand-prussian text-white font-bold py-3 sm:py-4 rounded-xl hover:bg-brand-cerulean transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand-prussian/20 active:scale-95 text-sm sm:text-base"
                                        onClick={() => navigate("/student/dashboard")}
                                    >
                                        Go to Dashboard <ArrowRight size={18} />
                                    </button>
                                </motion.div>
                            ) : (
                                <motion.button 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="w-full bg-gradient-to-r from-brand-prussian to-brand-cerulean text-white font-bold py-3 sm:py-4 rounded-xl hover:shadow-xl hover:scale-[1.02] transition-all shadow-lg shadow-brand-cerulean/20 flex items-center justify-center gap-2 text-base sm:text-lg active:scale-95"
                                    onClick={handleEnrollClick}
                                >
                                    Enroll Now <ArrowRight size={20} />
                                </motion.button>
                            )}
                        </AnimatePresence>

                        {!isEnrolled && (
                            <button 
                                className="w-full bg-white border-2 border-brand-aliceBlue text-brand-prussian font-bold py-2.5 sm:py-3 rounded-xl hover:bg-brand-aliceBlue transition-colors flex items-center justify-center gap-2 text-sm sm:text-base active:scale-95"
                                onClick={() => {
                                    navigator.clipboard.writeText(window.location.href);
                                    alert("Link copied to clipboard!"); // Ideally use a toast here
                                }}
                            >
                                <Share2 size={18} /> Share Class
                            </button>
                        )}
                    </div>
                    
                    <p className="text-[10px] text-center text-gray-400 mt-6 leading-relaxed">
                        By enrolling, you agree to our Terms of Service and Privacy Policy.
                    </p>

                </div>
            </motion.div>

        </div>
      </div>
    </div>
  );
}