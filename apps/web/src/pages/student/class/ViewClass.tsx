import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DashboardLayout from "../../../layouts/DashboardLayout";
import SidebarStudent from "../../../components/sidebar/SidebarStudent";
import BottomNavStudent from "../../../components/bottomNavbar/BottomNavStudent";
import ClassService from "../../../services/ClassService";
import { 
  VideoCameraIcon, 
  PlayCircleIcon, 
  DocumentTextIcon, 
  ClockIcon,
  CalendarDaysIcon,
  ArrowLeftIcon,
  ChatBubbleLeftRightIcon,
  ExclamationTriangleIcon
} from "@heroicons/react/24/outline";

// --- Interfaces ---
interface Recording {
  _id: string;
  title: string;
  date: string;
  videoUrl: string;
  duration: string;
}

interface Resource {
  _id: string;
  title: string;
  type: "pdf" | "link";
  url: string;
}

interface ClassData {
  _id: string;
  name: string;
  description: string;
  coverImage?: string;
  // These fields come from the backend. 
  // If your backend doesn't send them yet, the code below mocks them.
  zoomLink?: string;
  zoomMeetingId?: string;
  zoomPassword?: string;
  timeSchedules?: { day: number; startTime: string; endTime: string }[];
  recordings?: Recording[];
  resources?: Resource[];
}

export default function ViewClass() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [classData, setClassData] = useState<ClassData | null>(null);
  const [activeTab, setActiveTab] = useState<"live" | "recordings" | "resources">("live");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- Helper: Day Name ---
  const getDayName = (dayIndex: number) => 
    ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][dayIndex] || "Unknown";

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
        // Fetch Class Data
        const data = await ClassService.getPublicClassById(id);
        const classObj = Array.isArray(data) ? data[0] : data;

        if (!classObj) throw new Error("Class data not found");

        // --- MOCK DATA INJECTION ---
        // (This ensures the UI works even if the backend isn't returning these specific fields yet)
        const enrichedData: ClassData = {
            ...classObj,
            // Use existing data if available, otherwise fallback to mock
            zoomLink: classObj.zoomLink || "https://zoom.us/j/123456789",
            zoomMeetingId: classObj.zoomMeetingId || "845 221 990",
            zoomPassword: classObj.zoomPassword || "accounting101",
            
            // Mock Recordings
            recordings: classObj.recordings?.length ? classObj.recordings : [
                { _id: "1", title: "Introduction to Financial Accounting", date: "2023-10-01", videoUrl: "#", duration: "1h 30m" },
                { _id: "2", title: "Double Entry System Explained", date: "2023-10-08", videoUrl: "#", duration: "1h 45m" },
                { _id: "3", title: "Trial Balance & Errors", date: "2023-10-15", videoUrl: "#", duration: "2h 00m" },
            ],
            
            // Mock Resources
            resources: classObj.resources?.length ? classObj.resources : [
                { _id: "1", title: "Chapter 1: Theory Notes", type: "pdf", url: "#" },
                { _id: "2", title: "Past Paper Questions (2020-2022)", type: "pdf", url: "#" },
                { _id: "3", title: "Reference Link: SL Accounting Standards", type: "link", url: "#" },
            ]
        };
        // -----------------------------

        setClassData(enrichedData);
      } catch (err: any) {
        console.error("Fetch Error:", err);
        setError("Unable to load classroom. You may not be enrolled.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  if (loading) {
    return (
        <DashboardLayout Sidebar={SidebarStudent} BottomNav={BottomNavStudent}>
            <div className="flex items-center justify-center h-screen bg-gray-50">
                <div className="animate-pulse flex flex-col items-center">
                    <div className="h-12 w-12 bg-gray-200 rounded-full mb-4"></div>
                    <div className="h-4 w-32 bg-gray-200 rounded">Loading...</div>
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
                <h3 className="text-lg font-bold text-gray-900">Access Denied</h3>
                <p className="text-gray-500 mb-6">{error}</p>
                <button onClick={() => navigate("/student/enrollments")} className="bg-[#0b2540] text-white px-6 py-2.5 rounded-xl">
                    Back to My Classes
                </button>
            </div>
        </DashboardLayout>
    );
  }

  return (
    <DashboardLayout Sidebar={SidebarStudent} BottomNav={BottomNavStudent}>
      <div className="flex flex-col h-[calc(100vh-64px)] lg:h-screen overflow-hidden bg-gray-50">
        
        {/* --- Header --- */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-4 shrink-0 shadow-sm z-10">
            <button onClick={() => navigate("/student/classes")} className="text-gray-400 hover:text-[#0b2540] transition-colors">
                <ArrowLeftIcon className="w-5 h-5" />
            </button>
            <div>
                <h1 className="text-xl font-bold text-gray-900 leading-tight">{classData.name}</h1>
                <p className="text-xs text-green-600 font-medium flex items-center gap-1.5 mt-0.5">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    Live Classroom
                </p>
            </div>
        </div>

        <div className="flex flex-1 overflow-hidden relative">
            
            {/* --- Main Content --- */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8">
                <div className="max-w-5xl mx-auto space-y-8 pb-20">

                    {/* Tab Navigation */}
                    <div className="bg-white p-1.5 rounded-xl inline-flex shadow-sm border border-gray-100 sticky top-0 z-20">
                        {(['live', 'recordings', 'resources'] as const).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-5 py-2 text-sm font-bold rounded-lg capitalize transition-all ${
                                    activeTab === tab 
                                    ? "bg-[#0b2540] text-white shadow-md" 
                                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                                }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    {/* --- TAB 1: LIVE CLASS --- */}
                    {activeTab === 'live' && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
                            {/* Zoom Card */}
                            <div className="lg:col-span-2 bg-gradient-to-br from-[#0b2540] to-[#1e405f] rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
                                
                                <div className="relative z-10">
                                    <div className="flex items-start justify-between mb-8">
                                        <div>
                                            <h2 className="text-2xl font-bold mb-1">Live Session</h2>
                                            <p className="text-blue-200 text-sm">Join the instructor in real-time.</p>
                                        </div>
                                        <div className="bg-white/10 p-2 rounded-lg backdrop-blur-sm">
                                            <VideoCameraIcon className="w-6 h-6 text-blue-300" />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 mb-8">
                                        <div className="bg-black/20 rounded-xl p-4 backdrop-blur-sm border border-white/5">
                                            <p className="text-[10px] text-blue-300 uppercase font-bold tracking-wider mb-1">Meeting ID</p>
                                            <p className="font-mono text-lg font-medium">{classData.zoomMeetingId}</p>
                                        </div>
                                        <div className="bg-black/20 rounded-xl p-4 backdrop-blur-sm border border-white/5">
                                            <p className="text-[10px] text-blue-300 uppercase font-bold tracking-wider mb-1">Passcode</p>
                                            <p className="font-mono text-lg font-medium">{classData.zoomPassword}</p>
                                        </div>
                                    </div>

                                    <a 
                                        href={classData.zoomLink} 
                                        target="_blank" 
                                        rel="noreferrer"
                                        className={`flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-400 text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-lg shadow-blue-500/20 w-full ${!classData.zoomLink ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        <VideoCameraIcon className="w-5 h-5" />
                                        Launch Zoom App
                                    </a>
                                </div>
                            </div>

                            {/* Schedule Info */}
                            <div className="lg:col-span-1 bg-white rounded-2xl p-6 border border-gray-100 shadow-sm h-fit">
                                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2 border-b border-gray-100 pb-3">
                                    <CalendarDaysIcon className="w-5 h-5 text-gray-400" /> Schedule
                                </h3>
                                <div className="space-y-4">
                                    {classData.timeSchedules && classData.timeSchedules.length > 0 ? (
                                        classData.timeSchedules.map((sch, idx) => (
                                            <div key={idx} className="flex flex-col bg-gray-50 p-3 rounded-lg">
                                                <span className="text-xs text-gray-500 uppercase font-bold mb-1">{getDayName(sch.day)}</span>
                                                <div className="flex items-center gap-2 text-gray-900 font-medium">
                                                    <ClockIcon className="w-4 h-4 text-blue-500" />
                                                    {sch.startTime} - {sch.endTime}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-sm text-gray-400 italic">No schedule set.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* --- TAB 2: RECORDINGS --- */}
                    {activeTab === 'recordings' && (
                        <div className="space-y-4 animate-fade-in">
                            {classData.recordings?.map((rec) => (
                                <div key={rec._id} className="group bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-all flex items-center gap-4 cursor-pointer">
                                    <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center shrink-0 group-hover:bg-red-500 group-hover:text-white transition-colors">
                                        <PlayCircleIcon className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-gray-900 group-hover:text-[#0b2540] transition-colors">{rec.title}</h4>
                                        <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                                            <span className="flex items-center gap-1"><CalendarDaysIcon className="w-3 h-3" /> {rec.date}</span>
                                            <span className="flex items-center gap-1"><ClockIcon className="w-3 h-3" /> {rec.duration}</span>
                                        </div>
                                    </div>
                                    <a href={rec.videoUrl} target="_blank" rel="noreferrer" className="text-sm font-semibold text-[#0b2540] bg-gray-50 px-4 py-2 rounded-lg group-hover:bg-[#0b2540] group-hover:text-white transition-colors">
                                        Watch
                                    </a>
                                </div>
                            ))}
                            {(!classData.recordings || classData.recordings.length === 0) && (
                                <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
                                    <VideoCameraIcon className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                                    <p className="text-gray-400">No recordings available yet.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* --- TAB 3: RESOURCES --- */}
                    {activeTab === 'resources' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-in">
                            {classData.resources?.map((res) => (
                                <a key={res._id} href={res.url} target="_blank" rel="noreferrer" className="group bg-white rounded-xl p-5 border border-gray-100 shadow-sm hover:border-blue-300 hover:shadow-md transition-all flex items-start gap-4">
                                    <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-500 shrink-0 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                                        <DocumentTextIcon className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-900 text-sm group-hover:text-blue-600 transition-colors">{res.title}</p>
                                        <span className="text-xs text-gray-400 mt-1 block uppercase font-medium">Download {res.type}</span>
                                    </div>
                                </a>
                            ))}
                             {(!classData.resources || classData.resources.length === 0) && (
                                <div className="col-span-full text-center py-12 bg-white rounded-2xl border border-gray-100">
                                    <DocumentTextIcon className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                                    <p className="text-gray-400">No materials uploaded yet.</p>
                                </div>
                            )}
                        </div>
                    )}

                </div>
            </div>

            {/* --- Desktop Right Sidebar (Updates) --- */}
            <div className="hidden xl:flex w-80 bg-white border-l border-gray-200 flex-col shrink-0">
                <div className="p-5 border-b border-gray-100">
                    <h3 className="font-bold text-gray-900 flex items-center gap-2">
                        <ChatBubbleLeftRightIcon className="w-5 h-5 text-gray-400" /> Announcements
                    </h3>
                </div>
                <div className="flex-1 p-4 space-y-4 overflow-y-auto">
                    {/* Mock Announcement */}
                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-6 h-6 bg-[#0b2540] rounded-full flex items-center justify-center text-white text-xs font-bold">I</div>
                            <span className="text-sm font-bold text-gray-900">Instructor</span>
                        </div>
                        <p className="text-sm text-gray-700 leading-relaxed">
                            Welcome to the class! Our first session starts this Monday. Please download the materials beforehand.
                        </p>
                        <span className="text-[10px] text-gray-400 mt-2 block font-medium">Today, 09:00 AM</span>
                    </div>
                </div>
            </div>

        </div>
      </div>
    </DashboardLayout>
  );
}