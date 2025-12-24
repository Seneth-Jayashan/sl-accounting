import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DashboardLayout from "../../../layouts/DashboardLayout";
import SidebarStudent from "../../../components/sidebar/SidebarStudent";
import BottomNavStudent from "../../../components/bottomNavbar/BottomNavStudent";
import ClassService from "../../../services/ClassService";
import SessionService from "../../../services/SessionService";
import type { SessionData } from "../../../services/SessionService";
import moment from "moment";
import { 
  VideoCameraIcon, 
  PlayCircleIcon, 
  CalendarDaysIcon, 
  ArrowLeftIcon, 
  ChatBubbleLeftRightIcon,
  ExclamationTriangleIcon,
  MegaphoneIcon,
  UserGroupIcon,
  LockClosedIcon,
  ClockIcon,
  HomeIcon,
  FolderOpenIcon
} from "@heroicons/react/24/outline";

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

  const recordings = useMemo(() => {
    return sessions
      .filter(s => (s as any).youtubeVideoId || s.recordingUrl)
      .sort((a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime())
      .map(s => ({
          ...s,
          finalRecordingUrl: (s as any).youtubeVideoId 
            ? `https://www.youtube.com/watch?v=${(s as any).youtubeVideoId}` 
            : s.recordingUrl
      }));
  }, [sessions]);

  // --- Render Loading/Error ---
  if (loading) {
    return (
        <DashboardLayout Sidebar={SidebarStudent} BottomNav={BottomNavStudent}>
            <div className="flex items-center justify-center h-screen bg-gray-50">
                <div className="animate-pulse flex flex-col items-center">
                    <div className="h-12 w-12 bg-gray-200 rounded-full mb-4"></div>
                    <div className="h-4 w-40 bg-gray-200 rounded">Loading Class...</div>
                </div>
            </div>
        </DashboardLayout>
    );
  }

  if (error || !classData) {
    return (
        <DashboardLayout Sidebar={SidebarStudent} BottomNav={BottomNavStudent}>
            <div className="flex flex-col items-center justify-center h-screen bg-gray-50 p-4 text-center">
                <ExclamationTriangleIcon className="w-12 h-12 text-red-400 mb-3" />
                <h3 className="text-lg font-bold text-gray-900">Access Issue</h3>
                <p className="text-gray-500 mb-6">{error}</p>
                <button onClick={() => navigate("/student/enrollments")} className="bg-[#0b2540] text-white px-6 py-2.5 rounded-xl">
                    Back to Dashboard
                </button>
            </div>
        </DashboardLayout>
    );
  }

  // --- Tab Configuration ---
  const tabs = [
    { id: 'overview', label: 'Overview', icon: HomeIcon },
    { id: 'recordings', label: 'Recordings', icon: PlayCircleIcon, count: recordings.length },
    { id: 'resources', label: 'Resources', icon: FolderOpenIcon },
    { id: 'chat', label: 'Chat', icon: ChatBubbleLeftRightIcon },
  ];

  return (
    <DashboardLayout Sidebar={SidebarStudent} BottomNav={BottomNavStudent}>
      <div className="min-h-screen bg-gray-50 pb-24">
        
        {/* --- Header & Navigation --- */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
            <div className="max-w-5xl mx-auto px-4 md:px-6">
                
                {/* Title Row */}
                <div className="py-4 flex items-center gap-3">
                    <button onClick={() => navigate("/student/enrollments")} className="text-gray-400 hover:text-[#0b2540] transition-colors">
                        <ArrowLeftIcon className="w-5 h-5" />
                    </button>
                    <h1 className="text-lg md:text-xl font-bold text-gray-900 truncate">{classData.name}</h1>
                </div>

                {/* --- RESPONSIVE TABS --- */}
                {/* 1. Mobile: 2x2 Grid (No Scrolling) */}
                <div className="grid grid-cols-2 gap-2 pb-4 sm:hidden">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex flex-col items-center justify-center p-3 rounded-xl text-sm font-medium transition-all ${
                                activeTab === tab.id
                                ? "bg-[#0b2540] text-white shadow-md"
                                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                            }`}
                        >
                            <div className="flex items-center gap-2">
                                <tab.icon className="w-5 h-5 mb-1" />
                                {tab.count !== undefined && tab.count > 0 && (
                                    <span className={`text-[10px] px-1.5 rounded-full font-bold ${
                                        activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-gray-300 text-gray-700'
                                    }`}>
                                        {tab.count}
                                    </span>
                                )}
                            </div>
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>

                {/* 2. Desktop: Horizontal Line Tabs (Hidden on Mobile) */}
                <div className="hidden sm:flex space-x-1">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center gap-2 px-4 py-3 border-b-2 text-sm font-medium transition-colors whitespace-nowrap ${
                                activeTab === tab.id
                                ? "border-[#0b2540] text-[#0b2540]"
                                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                            }`}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                            {tab.count !== undefined && tab.count > 0 && (
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${activeTab === tab.id ? 'bg-[#0b2540] text-white' : 'bg-gray-200 text-gray-600'}`}>
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>
        </div>

        {/* --- Tab Content Area --- */}
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-6 space-y-6">

            {/* TAB: OVERVIEW */}
            {activeTab === 'overview' && (
                <div className="animate-fade-in space-y-6">
                    <div className="bg-gradient-to-br from-[#0b2540] to-[#163a5c] rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
                        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                                    <p className="text-green-300 text-xs font-bold uppercase tracking-wider">Live Class</p>
                                </div>
                                <h2 className="text-2xl md:text-3xl font-bold mb-4">
                                    {upcomingSession ? upcomingSession.title || "Next Session" : "No Upcoming Session"}
                                </h2>
                                
                                {upcomingSession ? (
                                    <div className="flex flex-wrap gap-4 text-blue-100 text-sm mb-6">
                                        <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-lg">
                                            <CalendarDaysIcon className="w-4 h-4" />
                                            {moment(upcomingSession.startAt).format("MMM DD")}
                                        </span>
                                        <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-lg">
                                            <ClockIcon className="w-4 h-4" />
                                            {moment(upcomingSession.startAt).format("h:mm A")}
                                        </span>
                                    </div>
                                ) : (
                                    <p className="text-blue-200 text-sm mb-6">Check back later for schedule.</p>
                                )}

                                {activeZoomLink ? (
                                    <a 
                                        href={activeZoomLink} 
                                        target="_blank" 
                                        rel="noreferrer"
                                        className="inline-flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-400 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-lg shadow-blue-500/30 w-full md:w-auto transform hover:-translate-y-0.5"
                                    >
                                        <VideoCameraIcon className="w-5 h-5" />
                                        Join via Zoom
                                    </a>
                                ) : (
                                    <button disabled className="bg-gray-600 text-gray-300 font-bold py-3 px-8 rounded-xl cursor-not-allowed w-full md:w-auto">
                                        Link Unavailable
                                    </button>
                                )}
                            </div>

                            <div className="bg-white/10 rounded-2xl p-5 backdrop-blur-md border border-white/10">
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-xs text-blue-300 mb-1 uppercase font-bold">Meeting ID</p>
                                        <p className="font-mono text-lg font-medium tracking-wide">{activeMeetingId || "N/A"}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-blue-300 mb-1 uppercase font-bold">Passcode</p>
                                        <p className="font-mono text-lg font-medium tracking-wide">{activePassword || "N/A"}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4">
                            <MegaphoneIcon className="w-5 h-5 text-orange-500" />
                            Announcements
                        </h3>
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="p-5 border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded">Instructor</span>
                                    <span className="text-xs text-gray-400">{moment().format("MMM DD")}</span>
                                </div>
                                <p className="text-sm text-gray-700 leading-relaxed">
                                    Welcome to the class! Please verify your Zoom audio settings before joining the live session.
                                </p>
                            </div>
                            <div className="p-3 bg-gray-50 text-center">
                                <span className="text-xs text-gray-400">End of updates</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB: RECORDINGS */}
            {activeTab === 'recordings' && (
                <div className="animate-fade-in space-y-4">
                    {recordings.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {recordings.map((session) => (
                                <div key={session._id} className="group bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                                    <div>
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center text-red-500 group-hover:bg-red-500 group-hover:text-white transition-colors">
                                                <PlayCircleIcon className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-gray-900 line-clamp-1 group-hover:text-blue-600 transition-colors">
                                                    {session.title || `Session ${session.index}`}
                                                </h4>
                                                <p className="text-xs text-gray-500">
                                                    {moment(session.startAt).format("MMMM Do, YYYY")}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <a 
                                        href={session.finalRecordingUrl} 
                                        target="_blank" 
                                        rel="noreferrer"
                                        className="mt-4 w-full text-center text-sm font-bold text-[#0b2540] bg-gray-50 py-2.5 rounded-xl hover:bg-[#0b2540] hover:text-white transition-colors"
                                    >
                                        Watch Recording
                                    </a>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-gray-300">
                            <VideoCameraIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <h3 className="text-lg font-medium text-gray-900">No Recordings</h3>
                            <p className="text-gray-500 text-sm">Past sessions will appear here.</p>
                        </div>
                    )}
                </div>
            )}

            {/* TAB: RESOURCES */}
            {activeTab === 'resources' && (
                <div className="animate-fade-in">
                    <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-gray-300">
                        <FolderOpenIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <h3 className="text-lg font-medium text-gray-900">No Materials</h3>
                        <p className="text-gray-500 text-sm">Files uploaded by the instructor will appear here.</p>
                    </div>
                </div>
            )}

            {/* TAB: CHAT */}
            {activeTab === 'chat' && (
                <div className="animate-fade-in">
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
                        <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <UserGroupIcon className="w-8 h-8 text-green-600" />
                        </div>
                        <h4 className="text-xl font-bold text-gray-900 mb-2">Student Community</h4>
                        <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto">
                            Connect with your classmates, discuss topics, and share notes. This feature will be available soon.
                        </p>
                        <button 
                            disabled
                            className="inline-flex items-center justify-center gap-2 bg-gray-100 text-gray-400 font-bold py-2.5 px-6 rounded-xl cursor-not-allowed"
                        >
                            <LockClosedIcon className="w-4 h-4" /> Chat Locked
                        </button>
                    </div>
                </div>
            )}

        </div>
      </div>
    </DashboardLayout>
  );
}