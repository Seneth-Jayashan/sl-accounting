import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { LayoutDashboard, PlayCircle, FolderOpen, MessageSquare, Megaphone, ArrowLeft } from "lucide-react";

// Layouts & Services
import ClassService from "../../../services/ClassService";
import SessionService from "../../../services/SessionService";
import LoadingPage from "../../../components/LoadingPage";

// Separate Tab Components
import OverviewTab from "./tabs/OverviewTab";
import RecordingsTab from "./tabs/RecordingsTab";
import ResourcesTab from "./tabs/ResourcesTab";
import AnnouncementsTab from "./tabs/ClassAnnouncementsTab";
import ChatTab from "./tabs/ChatTab";

export default function ViewClass() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [classData, setClassData] = useState<any>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [classRes, sessionsRes] = await Promise.all([
          ClassService.getClassById(id!),
          SessionService.getSessionsByClassId(id!)
        ]);
        setClassData(Array.isArray(classRes) ? classRes[0] : classRes);
        setSessions(Array.isArray(sessionsRes) ? sessionsRes : (sessionsRes as any)?.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'announcements', label: 'Announcements', icon: Megaphone },
    { id: 'recordings', label: 'Recordings', icon: PlayCircle },
    { id: 'resources', label: 'Resources', icon: FolderOpen },
    { id: 'chat', label: 'Chat', icon: MessageSquare },
  ];

  if (loading) return <div className="min-h-screen"><LoadingPage /></div>;

  return (
      <div className="min-h-screen bg-brand-aliceBlue/30 pb-24">
        {/* Navigation Header */}
        <div className="bg-white/80 backdrop-blur-md border-b sticky top-0 z-30">
          <div className="max-w-6xl mx-auto px-4">
            <div className="py-4 flex items-center gap-4">
              <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full"><ArrowLeft size={20}/></button>
              <h1 className="text-xl font-black text-brand-prussian">{classData?.name}</h1>
            </div>
            <div className="flex gap-1 overflow-x-auto scrollbar-hide">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 border-b-2 text-sm font-bold transition-all ${
                    activeTab === tab.id ? "border-brand-cerulean text-brand-cerulean bg-brand-aliceBlue/50" : "border-transparent text-gray-500"
                  }`}
                >
                  <tab.icon size={18} /> {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tab Content Rendering */}
        <div className="max-w-6xl mx-auto px-4 py-8">
          <AnimatePresence mode="wait">
            {activeTab === 'overview' && <OverviewTab classData={classData} sessions={sessions} />}
            {activeTab === 'announcements' && <AnnouncementsTab classId={id!} />}
            {activeTab === 'recordings' && <RecordingsTab sessions={sessions} />}
            {activeTab === 'resources' && <ResourcesTab classId={id!} />}
            {activeTab === 'chat' && <ChatTab />}
          </AnimatePresence>
        </div>
      </div>
  );
}