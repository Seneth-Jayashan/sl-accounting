import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import moment from "moment";
import { 
  Video, 
  PlayCircle, 
  Calendar, 
  ArrowLeft, 
  MessageSquare,
  AlertTriangle,
  Megaphone,
  Users,
  Lock,
  Clock,
  LayoutDashboard,
  FolderOpen
} from "lucide-react";

// Components & Layouts
import DashboardLayout from "../../../layouts/DashboardLayout";
import SidebarStudent from "../../../components/sidebar/SidebarStudent";
import BottomNavStudent from "../../../components/bottomNavbar/BottomNavStudent";

// Services & Context
import ClassService from "../../../services/ClassService";
import SessionService from "../../../services/SessionService";

// --- Type-Only Import ---
import type { SessionData } from "../../../services/SessionService";

// --- Interfaces ---
interface ClassData {
  _id: string;
  name: string;
  description: string;
  zoomLink?: string;
  zoomMeetingId?: string;
  zoomPassword?: string;
  timeSchedules?: { day: number; startTime: string; endTime: string }[];
}

// Animation Variants
const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
};

export default function ViewClass() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [classData, setClassData] = useState<ClassData | null>(null);
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [activeTab, setActiveTab] = useState<"overview" | "recordings" | "resources" | "chat">("overview");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- Fetch Data ---
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      if (!id) {
        setError("Invalid Class ID.");
        setLoading(false);
        return;
      }

      try {
        const [classRes, sessionsRes] = await Promise.all([
            ClassService.getPublicClassById(id),
            SessionService.getSessionsByClassId(id)
        ]);

        const classObj = Array.isArray(classRes) ? classRes[0] : classRes;
        if (!classObj) throw new Error("Class data not found");
        setClassData(classObj);

        const sessionList = Array.isArray(sessionsRes) ? sessionsRes : (sessionsRes as any).data || [];
        setSessions(sessionList);

      } catch (err: any) {
        console.error("Fetch Error:", err);
        setError("Unable to load classroom.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  // --- Derived Data ---
  const upcomingSession = useMemo(() => {
    const now = new Date();
    return sessions
        .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())
        .find(s => new Date(s.endAt) > now);
  }, [sessions]);

  const activeZoomLink = upcomingSession?.zoomJoinUrl || classData?.zoomLink;
  const activeMeetingId = upcomingSession?.zoomMeetingId || classData?.zoomMeetingId;
  const activePassword = classData?.zoomPassword;

  // 1. Filter Recordings (Securely)
  const recordings = useMemo(() => {
    return sessions
      .filter(s => (s as any).youtubeVideoId || s.youtubeVideoId) // Check if recording exists
      .sort((a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime()); // Descending
  }, [sessions]);

  // 2. Group Recordings by Month
  const groupedRecordings = useMemo(() => {
      const groups: Record<string, SessionData[]> = {};
      
      recordings.forEach(session => {
          const monthKey = moment(session.startAt).format("MMMM YYYY");
          if (!groups[monthKey]) {
              groups[monthKey] = [];
          }
          groups[monthKey].push(session);
      });

      return groups;
  }, [recordings]);

  // --- Render Loading/Error ---
  if (loading) {
    return (
        <DashboardLayout Sidebar={SidebarStudent} BottomNav={BottomNavStudent}>
            <div className="flex items-center justify-center h-screen bg-brand-aliceBlue/30">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-brand-cerulean border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-brand-prussian font-bold">Loading Classroom...</p>
                </div>
            </div>
        </DashboardLayout>
    );
  }

  if (error || !classData) {
    return (
        <DashboardLayout Sidebar={SidebarStudent} BottomNav={BottomNavStudent}>
            <div className="flex flex-col items-center justify-center h-screen bg-brand-aliceBlue/30 p-6 text-center">
                <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6">
                    <AlertTriangle className="w-10 h-10 text-red-400" />
                </div>
                <h3 className="text-2xl font-bold text-brand-prussian mb-2">Access Issue</h3>
                <p className="text-gray-500 mb-8 max-w-sm">{error}</p>
                <button 
                    onClick={() => navigate("/student/enrollment")} 
                    className="bg-brand-prussian text-white px-8 py-3 rounded-xl font-bold hover:bg-brand-cerulean transition-colors"
                >
                    Back to Enrollments
                </button>
            </div>
        </DashboardLayout>
    );
  }

  // --- Tab Configuration ---
  const tabs = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'recordings', label: 'Recordings', icon: PlayCircle, count: recordings.length },
    { id: 'resources', label: 'Resources', icon: FolderOpen },
    { id: 'chat', label: 'Chat', icon: MessageSquare },
  ];

  return (
    <DashboardLayout Sidebar={SidebarStudent} BottomNav={BottomNavStudent}>
      <div className="min-h-screen bg-brand-aliceBlue/30 pb-24">
        
        {/* --- Header & Navigation --- */}
        <div className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-30">
            <div className="max-w-6xl mx-auto px-4 md:px-6">
                
                {/* Title Row */}
                <div className="py-4 flex items-center gap-4">
                    <button onClick={() => navigate("/student/enrollment")} className="p-2 rounded-full hover:bg-brand-aliceBlue text-gray-400 hover:text-brand-prussian transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-lg md:text-xl font-black text-brand-prussian truncate font-sinhala">{classData.name}</h1>
                        <p className="text-xs text-gray-500 hidden md:block">Classroom Dashboard</p>
                    </div>
                </div>

                {/* --- TABS --- */}
                <div className="flex gap-1 overflow-x-auto scrollbar-hide pb-2 md:pb-0">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center gap-2 px-4 py-3 border-b-2 text-sm font-bold transition-all whitespace-nowrap ${
                                activeTab === tab.id
                                ? "border-brand-cerulean text-brand-cerulean bg-brand-aliceBlue/50 rounded-t-xl"
                                : "border-transparent text-gray-500 hover:text-brand-prussian hover:bg-gray-50 rounded-t-xl"
                            }`}
                        >
                            <tab.icon size={18} />
                            {tab.label}
                            {tab.count !== undefined && tab.count > 0 && (
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${activeTab === tab.id ? 'bg-brand-cerulean text-white' : 'bg-gray-200 text-gray-600'}`}>
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>
        </div>

        {/* --- Tab Content Area --- */}
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-8">
            <AnimatePresence mode="wait">
                
                {/* TAB: OVERVIEW */}
                {activeTab === 'overview' && (
                    <motion.div key="overview" variants={fadeInUp} initial="hidden" animate="visible" exit="hidden" className="space-y-8">
                        {/* Live Class Card Code (Same as previous) */}
                        <div className="bg-gradient-to-br from-brand-prussian to-[#022c3d] rounded-[2rem] p-8 text-white shadow-2xl relative overflow-hidden">
                            {/* Decorative Blobs */}
                            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-cerulean/20 rounded-full blur-3xl -mr-16 -mt-16"></div>
                            <div className="absolute bottom-0 left-0 w-48 h-48 bg-brand-coral/10 rounded-full blur-3xl -ml-10 -mb-10"></div>

                            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
                                <div>
                                    <div className="flex items-center gap-2 mb-4">
                                        <span className="relative flex h-3 w-3">
                                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                          <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                                        </span>
                                        <p className="text-green-400 text-xs font-bold uppercase tracking-widest">Live Class Status</p>
                                    </div>
                                    
                                    <h2 className="text-3xl md:text-4xl font-black mb-6 font-sinhala leading-tight">
                                        {upcomingSession ? (upcomingSession.title || "Next Live Session") : "No Session Scheduled"}
                                    </h2>
                                    
                                    {upcomingSession ? (
                                        <div className="flex flex-wrap gap-4 mb-8">
                                            <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl backdrop-blur-sm border border-white/10">
                                                <Calendar size={18} className="text-brand-jasmine" />
                                                <span className="text-sm font-bold">{moment(upcomingSession.startAt).format("MMM DD, YYYY")}</span>
                                            </div>
                                            <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl backdrop-blur-sm border border-white/10">
                                                <Clock size={18} className="text-brand-coral" />
                                                <span className="text-sm font-bold">{moment(upcomingSession.startAt).format("h:mm A")}</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-brand-aliceBlue/60 mb-8 max-w-md">
                                            There are no live classes scheduled at the moment. Please check back later or review past recordings.
                                        </p>
                                    )}

                                    {activeZoomLink ? (
                                        <a 
                                            href={activeZoomLink} 
                                            target="_blank" 
                                            rel="noreferrer"
                                            className="inline-flex items-center gap-3 bg-brand-cerulean hover:bg-[#067aa3] text-white font-bold py-4 px-8 rounded-xl transition-all shadow-lg shadow-brand-cerulean/30 transform hover:-translate-y-1 w-full sm:w-auto justify-center"
                                        >
                                            <Video size={20} /> Join Live Class
                                        </a>
                                    ) : (
                                        <button disabled className="inline-flex items-center gap-3 bg-white/10 text-gray-400 font-bold py-4 px-8 rounded-xl cursor-not-allowed w-full sm:w-auto justify-center border border-white/5">
                                            <Lock size={20} /> Link Unavailable
                                        </button>
                                    )}
                                </div>

                                <div className="bg-white/5 rounded-3xl p-6 backdrop-blur-md border border-white/10">
                                    <h3 className="text-sm font-bold text-brand-jasmine mb-4 uppercase tracking-wider border-b border-white/10 pb-2">Zoom Details</h3>
                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-xs text-brand-aliceBlue/50 mb-1 uppercase font-bold">Meeting ID</p>
                                            <div className="flex items-center gap-3">
                                                <p className="font-mono text-xl font-bold tracking-wide">{activeMeetingId || "---"}</p>
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-xs text-brand-aliceBlue/50 mb-1 uppercase font-bold">Passcode</p>
                                            <div className="flex items-center gap-3">
                                                <p className="font-mono text-xl font-bold tracking-wide">{activePassword || "---"}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-brand-aliceBlue/40 mt-6 leading-relaxed">
                                        * Please join 5 minutes early to test your audio. Keep your microphone muted upon entry.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Announcements */}
                        <div>
                            <h3 className="text-xl font-bold text-brand-prussian flex items-center gap-2 mb-4">
                                <Megaphone className="text-brand-coral" /> Announcements
                            </h3>
                            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                                <div className="p-6 hover:bg-brand-aliceBlue/20 transition-colors">
                                    <div className="flex items-center gap-3 mb-3">
                                        <span className="bg-brand-aliceBlue text-brand-prussian text-[10px] font-black px-2 py-1 rounded uppercase tracking-wider">Instructor</span>
                                        <span className="text-xs text-gray-400 font-medium">{moment().format("MMM DD")}</span>
                                    </div>
                                    <p className="text-gray-600 leading-relaxed font-sans">
                                        Welcome to the class! Make sure to check the <strong>Resources</strong> tab for this week's lecture notes before joining the live session.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* TAB: RECORDINGS (Monthly Grouped) */}
                {activeTab === 'recordings' && (
                    <motion.div key="recordings" variants={fadeInUp} initial="hidden" animate="visible" exit="hidden" className="space-y-8">
                        {recordings.length > 0 ? (
                            Object.entries(groupedRecordings).map(([month, sessionsInMonth]) => (
                                <div key={month} className="space-y-4">
                                    {/* Month Header */}
                                    <div className="flex items-center gap-4">
                                        <div className="h-px bg-gray-200 flex-1"></div>
                                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest bg-brand-aliceBlue/50 px-4 py-1 rounded-full">
                                            {month}
                                        </h3>
                                        <div className="h-px bg-gray-200 flex-1"></div>
                                    </div>

                                    {/* Sessions Grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {sessionsInMonth.map((session) => (
                                            <div key={session._id} className="group bg-white rounded-[2rem] p-5 border border-gray-100 shadow-sm hover:shadow-xl hover:border-brand-cerulean/20 transition-all duration-300 flex flex-col h-full">
                                                <div className="flex items-start gap-4 mb-4">
                                                    <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center text-red-500 group-hover:bg-red-500 group-hover:text-white transition-colors shadow-sm shrink-0">
                                                        <PlayCircle size={24} />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-brand-prussian line-clamp-2 leading-tight group-hover:text-brand-cerulean transition-colors">
                                                            {session.title || `Session ${session.index}`}
                                                        </h4>
                                                        <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                                                            <Calendar size={12} />
                                                            {moment(session.startAt).format("MMM Do, YYYY")}
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                <div className="mt-auto">
                                                    {/* SECURE NAVIGATION BUTTON */}
                                                    <button 
                                                        onClick={() => navigate(`/student/class/recording/${session._id}`)}
                                                        className="w-full flex items-center justify-center gap-2 text-sm font-bold text-brand-prussian bg-brand-aliceBlue py-3 rounded-xl hover:bg-brand-prussian hover:text-white transition-all group-hover:shadow-md"
                                                    >
                                                        Watch Recording
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="bg-white rounded-[2.5rem] p-16 text-center border border-dashed border-gray-200">
                                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Video className="w-10 h-10 text-gray-300" />
                                </div>
                                <h3 className="text-xl font-bold text-brand-prussian">No Recordings Yet</h3>
                                <p className="text-gray-500 mt-2">Past class sessions will appear here automatically.</p>
                            </div>
                        )}
                    </motion.div>
                )}

                {/* TAB: RESOURCES */}
                {activeTab === 'resources' && (
                    <motion.div key="resources" variants={fadeInUp} initial="hidden" animate="visible" exit="hidden">
                        <div className="bg-white rounded-[2.5rem] p-16 text-center border border-dashed border-gray-200">
                            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <FolderOpen className="w-10 h-10 text-gray-300" />
                            </div>
                            <h3 className="text-xl font-bold text-brand-prussian">No Resources Found</h3>
                            <p className="text-gray-500 mt-2">PDFs and other study materials will be uploaded here.</p>
                        </div>
                    </motion.div>
                )}

                {/* TAB: CHAT */}
                {activeTab === 'chat' && (
                    <motion.div key="chat" variants={fadeInUp} initial="hidden" animate="visible" exit="hidden">
                        <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-12 text-center max-w-2xl mx-auto">
                            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Users className="w-10 h-10 text-green-600" />
                            </div>
                            <h4 className="text-2xl font-bold text-brand-prussian mb-3">Student Community</h4>
                            <p className="text-gray-500 mb-8 leading-relaxed">
                                Connect with your classmates, discuss topics, and share notes in a safe environment. This feature is currently locked for maintenance.
                            </p>
                            <button disabled className="inline-flex items-center gap-2 bg-gray-100 text-gray-400 font-bold py-3 px-8 rounded-xl cursor-not-allowed">
                                <Lock size={18} /> Chat Temporarily Locked
                            </button>
                        </div>
                    </motion.div>
                )}

            </AnimatePresence>
        </div>
      </div>
    </DashboardLayout>
  );
}