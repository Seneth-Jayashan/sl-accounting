import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { 
  LayoutDashboard, 
  PlayCircle, 
  FolderOpen, 
  MessageSquare, 
  Megaphone, 
  ArrowLeft 
} from "lucide-react";

// Layouts & Services
import ClassService, { type ClassData } from "../../../services/ClassService";
import SessionService, { type SessionData } from "../../../services/SessionService";

// Separate Tab Components
import OverviewTab from "./tabs/OverviewTab";
import RecordingsTab from "./tabs/RecordingsTab";
import ResourcesTab from "./tabs/ResourcesTab";
import AnnouncementsTab from "./tabs/ClassAnnouncementsTab";
import ChatTab from "./tabs/ChatTab";
import { ArrowPathIcon } from "@heroicons/react/24/outline";

export default function ViewClass() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // State
  const [classData, setClassData] = useState<ClassData | null>(null);
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);

  // Fetch Data
  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      if (!id) return;
      try {
        const [classRes, sessionsRes] = await Promise.all([
          ClassService.getClassById(id),
          SessionService.getSessionsByClassId(id)
        ]);
        
        if (isMounted) {
            // Handle varying API response structures (Array vs Object)
            const cls = Array.isArray(classRes) ? classRes[0] : classRes;
            setClassData(cls);

            const sess = Array.isArray(sessionsRes) ? sessionsRes : (sessionsRes as any)?.data || [];
            setSessions(sess);
        }
      } catch (err) {
        console.error("Failed to load class data", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchData();
    return () => { isMounted = false; };
  }, [id]);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'announcements', label: 'News', icon: Megaphone }, // Shortened label for mobile
    { id: 'recordings', label: 'Recordings', icon: PlayCircle },
    { id: 'resources', label: 'Resources', icon: FolderOpen },
    { id: 'chat', label: 'Chat', icon: MessageSquare },
  ];

  if (loading) return <LoadingState />;

  return (
      <div className="min-h-screen bg-brand-aliceBlue/30 pb-24">
        
        {/* --- Sticky Navigation Header --- */}
        <div className="bg-white/90 backdrop-blur-md border-b border-gray-200 sticky top-0 z-30 transition-all">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            
            {/* Top Row: Back & Title */}
            <div className="py-3 flex items-center gap-3">
              <button 
                onClick={() => navigate(-1)} 
                className="p-2 -ml-2 hover:bg-gray-100 rounded-full text-gray-600 transition-colors"
                aria-label="Go Back"
              >
                <ArrowLeft size={20}/>
              </button>
              <h1 className="text-lg sm:text-xl font-black text-brand-prussian truncate">
                {classData?.name || "Loading..."}
              </h1>
            </div>

            {/* Bottom Row: Scrollable Tabs */}
            <div className="flex gap-1 overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-3 border-b-2 text-sm font-bold transition-all whitespace-nowrap outline-none ${
                        isActive 
                            ? "border-brand-cerulean text-brand-cerulean bg-brand-aliceBlue/50" 
                            : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                        }`}
                    >
                        <tab.icon size={18} className={isActive ? "text-brand-cerulean" : "text-gray-400"} /> 
                        {tab.label}
                    </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* --- Content Area --- */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <AnimatePresence mode="wait">
            <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
            >
                {activeTab === 'overview' && <OverviewTab classData={classData} sessions={sessions} />}
                {activeTab === 'announcements' && <AnnouncementsTab classId={id!} />}
                {activeTab === 'recordings' && <RecordingsTab sessions={sessions} />}
                {activeTab === 'resources' && <ResourcesTab classId={id!} />}
                {activeTab === 'chat' && <ChatTab />}
            </motion.div>
          </AnimatePresence>
        </div>

      </div>
  );
}

const LoadingState = () => (
    <div className="flex h-[70vh] items-center justify-center flex-col gap-4">
      <ArrowPathIcon className="w-8 h-8 text-brand-cerulean animate-spin" />
      <span className="text-xs font-bold text-gray-300 uppercase tracking-widest">Loading Curriculum...</span>
    </div>
);