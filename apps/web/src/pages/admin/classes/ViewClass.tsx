import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DashboardLayout from "../../../layouts/DashboardLayout";
import SidebarAdmin from "../../../components/sidebar/SidebarAdmin";
import BottomNavAdmin from "../../../components/bottomNavbar/BottomNavAdmin";
import ClassService from "../../../services/ClassService";
import moment from "moment";
import {
  ArrowLeftIcon,
  PencilSquareIcon,
  TrashIcon,
  CalendarDaysIcon,
  ClockIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  AcademicCapIcon,
  MapPinIcon,
  VideoCameraIcon,
  CheckBadgeIcon,
  XCircleIcon
} from "@heroicons/react/24/outline";

// --- Configuration ---
// Adjust this to match your backend URL
const API_BASE_URL = "http://localhost:3000"; 

// --- Interfaces ---
interface Session {
  _id: string;
  index: number;
  startAt: string;
  endAt: string;
  zoomMeetingId?: string;
  zoomJoinUrl?: string;
  recordingShared: boolean;
}

interface Schedule {
  day: number; // 0=Sunday, 1=Monday...
  startTime: string;
  timezone: string;
}

interface ClassData {
  _id: string;
  name: string;
  description?: string;
  price?: number;
  batch?: string;
  level?: string;
  coverImage?: string;
  images?: string[];
  tags?: string[];
  firstSessionDate?: string;
  recurrence?: string;
  totalSessions?: number;
  sessionDurationMinutes?: number;
  timeSchedules?: Schedule[];
  sessions?: Session[]; // Populated from backend
  isActive: boolean;
  isPublished: boolean;
  studentCount?: number; // Optional mock
  createdAt?: string;
}

export default function ViewClassPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [classData, setClassData] = useState<ClassData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Helper to format image URLs
  const getImageUrl = (path?: string) => {
    if (!path) return null;
    if (path.startsWith("http")) return path;
    // Replace backslashes just in case, and ensure leading slash
    const cleanPath = path.replace(/\\/g, "/");
    return `${API_BASE_URL}/${cleanPath.startsWith("/") ? cleanPath.slice(1) : cleanPath}`;
  };

  const getDayName = (dayIndex: number) => {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    return days[dayIndex] || "Unknown";
  };

  // 1. Fetch Class Data
  useEffect(() => {
    if (!id) return;

    const fetchClass = async () => {
      setIsLoading(true);
      try {
        const data = await ClassService.getClassById(id);
        // Check structure based on your controller response
        if (data) {
          console.log(data);
          setClassData(data); // Assuming controller returns the object directly or data.class
        } else {
          setError("Class not found.");
        }
      } catch (err: any) {
        console.error(err);
        setError("Failed to fetch class details.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchClass();
  }, [id]);

  // 2. Handle Delete
  const handleDelete = async () => {
    if (!id) return;
    if (!window.confirm("Are you sure? This will remove the class and all associated sessions.")) return;

    try {
      await ClassService.deleteClass(id);
      navigate("/admin/classes");
    } catch (err) {
      alert("Failed to delete class.");
    }
  };

  // --- Right Sidebar (Actions) ---
  const ActionSidebar = (
    <div className="space-y-4">
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="font-semibold text-gray-900 mb-4">Class Actions</h3>
        
        {/* Status Indicators */}
        <div className="flex gap-2 mb-4">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${classData?.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                {classData?.isActive ? <CheckBadgeIcon className="w-3 h-3"/> : <XCircleIcon className="w-3 h-3"/>}
                {classData?.isActive ? "Active" : "Inactive"}
            </span>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${classData?.isPublished ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}`}>
                {classData?.isPublished ? "Published" : "Draft"}
            </span>
        </div>

        <button 
          onClick={() => navigate(`/admin/classes/edit/${id}`)}
          className="w-full flex items-center justify-center gap-2 bg-[#0b2540] text-white py-2.5 rounded-xl mb-3 hover:bg-[#153454] transition-colors"
        >
          <PencilSquareIcon className="w-5 h-5" /> Edit Details
        </button>
        <button 
          onClick={handleDelete}
          className="w-full flex items-center justify-center gap-2 bg-white text-red-600 border border-red-100 py-2.5 rounded-xl hover:bg-red-50 transition-colors"
        >
          <TrashIcon className="w-5 h-5" /> Delete Class
        </button>
      </div>

      <div className="bg-blue-50 p-5 rounded-2xl border border-blue-100">
        <h3 className="font-semibold text-blue-800 mb-2">Quick Stats</h3>
        <div className="flex justify-between items-center text-sm text-blue-700 mb-2">
          <span>Active Students</span>
          <span className="font-bold">{classData?.studentCount || 0}</span>
        </div>
        <div className="flex justify-between items-center text-sm text-blue-700">
          <span>Total Revenue</span>
          <span className="font-bold">LKR {((classData?.studentCount || 0) * (classData?.price || 0)).toLocaleString()}</span>
        </div>
      </div>
    </div>
  );

  // --- Loading / Error States ---
  if (isLoading) {
    return (
      <DashboardLayout Sidebar={SidebarAdmin} BottomNav={BottomNavAdmin}>
        <div className="flex h-screen items-center justify-center text-gray-400 animate-pulse">
          Loading Class Details...
        </div>
      </DashboardLayout>
    );
  }

  if (error || !classData) {
    return (
      <DashboardLayout Sidebar={SidebarAdmin} BottomNav={BottomNavAdmin}>
        <div className="text-center py-20">
          <h2 className="text-xl font-bold text-gray-800">Error</h2>
          <p className="text-gray-500">{error || "Class not found"}</p>
          <button onClick={() => navigate(-1)} className="mt-4 text-[#0b2540] underline">Go Back</button>
        </div>
      </DashboardLayout>
    );
  }

  const coverUrl = getImageUrl(classData.coverImage);
  console.log("Cover URL:", coverUrl);
  return (
    <DashboardLayout Sidebar={SidebarAdmin} BottomNav={BottomNavAdmin} rightSidebar={ActionSidebar}>
      <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
        
        {/* Back Button */}
        <button 
          onClick={() => navigate("/admin/classes")}
          className="flex items-center text-gray-500 hover:text-[#0b2540] transition-colors"
        >
          <ArrowLeftIcon className="w-4 h-4 mr-1" /> Back to Classes
        </button>

        {/* HERO BANNER */}
        <div className="relative w-full h-48 sm:h-72 rounded-3xl overflow-hidden shadow-sm border border-gray-100 group">
          {/* Background Image */}
          {coverUrl ? (
             <img 
               src={coverUrl} 
               alt={classData.name} 
               className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
             />
          ) : (
             <div className="w-full h-full bg-gradient-to-r from-[#0b2540] to-[#1a3b5c] flex items-center justify-center">
                <AcademicCapIcon className="w-24 h-24 text-white/20" />
             </div>
          )}
          
          {/* Overlay Gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>

          {/* Title & Batch Badges */}
          <div className="absolute bottom-0 left-0 p-6 sm:p-8 w-full">
            <div className="flex flex-wrap items-center gap-2 mb-3">
                {classData.batch && (
                    <span className="bg-blue-500/30 backdrop-blur-md text-blue-50 border border-blue-400/30 px-3 py-1 rounded-full text-xs font-semibold">
                    Batch: {classData.batch}
                    </span>
                )}
                {classData.level && (
                    <span className="bg-purple-500/30 backdrop-blur-md text-purple-50 border border-purple-400/30 px-3 py-1 rounded-full text-xs font-semibold">
                    {classData.level}
                    </span>
                )}
                {classData.tags && classData.tags.map((tag, idx) => (
                    <span key={idx} className="bg-white/20 backdrop-blur-md text-white border border-white/30 px-3 py-1 rounded-full text-xs font-semibold">
                    #{tag}
                    </span>
                ))}
            </div>
            <h1 className="text-3xl sm:text-5xl font-bold text-white tracking-tight mb-1">
              {classData.name}
            </h1>
            <p className="text-gray-300 text-sm sm:text-base max-w-2xl line-clamp-1">
                Starts on {moment(classData.firstSessionDate).format("MMMM Do, YYYY")} • {classData.recurrence}
            </p>
          </div>
        </div>

        {/* DETAILS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card 1: Schedule */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
             <div className="flex items-center gap-3 mb-3">
                 <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                    <CalendarDaysIcon className="w-6 h-6" />
                 </div>
                 <h4 className="font-semibold text-gray-900">Class Schedule</h4>
             </div>
             <div className="space-y-2">
                 {classData.timeSchedules && classData.timeSchedules.length > 0 ? (
                     classData.timeSchedules.map((sch, i) => (
                         <div key={i} className="flex justify-between items-center text-sm p-2 bg-gray-50 rounded-lg">
                             <span className="font-medium text-gray-700">{getDayName(sch.day)}</span>
                             <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded text-xs font-bold">{sch.startTime}</span>
                         </div>
                     ))
                 ) : (
                     <p className="text-sm text-gray-400 italic">No specific schedule set.</p>
                 )}
             </div>
          </div>

          {/* Card 2: Pricing & Sessions */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
             <div className="flex items-center gap-3 mb-3">
                 <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                    <CurrencyDollarIcon className="w-6 h-6" />
                 </div>
                 <h4 className="font-semibold text-gray-900">Payment & Plan</h4>
             </div>
             <div className="space-y-2">
                <div className="flex justify-between items-end">
                   <span className="text-sm text-gray-500">Price</span>
                   <span className="text-xl font-bold text-gray-900">LKR {classData.price?.toLocaleString()}</span>
                </div>
                <div className="w-full h-px bg-gray-100 my-2"></div>
                <div className="flex justify-between text-sm">
                   <span className="text-gray-500">Total Sessions</span>
                   <span className="font-medium text-gray-900">{classData.totalSessions}</span>
                </div>
                <div className="flex justify-between text-sm">
                   <span className="text-gray-500">Duration</span>
                   <span className="font-medium text-gray-900">{classData.sessionDurationMinutes} mins</span>
                </div>
             </div>
          </div>

          {/* Card 3: Location */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
             <div className="flex items-center gap-3 mb-3">
                 <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                    <MapPinIcon className="w-6 h-6" />
                 </div>
                 <h4 className="font-semibold text-gray-900">Location</h4>
             </div>
             <div className="text-sm text-gray-600">
                 <p className="mb-2">This class is conducted online via Zoom.</p>
                 <div className="flex items-center gap-2 text-xs bg-blue-50 text-blue-700 p-2 rounded-lg border border-blue-100">
                    <VideoCameraIcon className="w-4 h-4"/>
                    <span>Auto-generated Zoom links</span>
                 </div>
             </div>
          </div>
        </div>

        {/* TWO COLUMN SECTION: Description & Sessions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* LEFT: Description & Gallery */}
            <div className="lg:col-span-2 space-y-6">
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                    <h2 className="text-lg font-bold text-gray-900 mb-4">About this Class</h2>
                    <div className="prose prose-sm text-gray-600 max-w-none whitespace-pre-wrap">
                        {classData.description || <span className="italic text-gray-400">No description provided.</span>}
                    </div>
                </div>

                {/* Gallery */}
                {classData.images && classData.images.length > 0 && (
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">Gallery</h2>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            {classData.images.map((img, idx) => (
                                <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-gray-100 group">
                                    <img 
                                        src={getImageUrl(img)!} 
                                        alt={`Gallery ${idx}`}
                                        className="w-full h-full object-cover transition-transform group-hover:scale-110"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* RIGHT: Sessions List */}
            <div className="lg:col-span-1">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-full">
                    <div className="flex items-center justify-between mb-4">
                       <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                          <ClockIcon className="w-5 h-5 text-gray-400" /> 
                          Sessions
                       </h2>
                       <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">
                           {classData.sessions?.length || 0} Total
                       </span>
                    </div>

                    <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                        {classData.sessions && classData.sessions.length > 0 ? (
                            classData.sessions.map((session) => (
                                <div key={session._id} className="p-3 border border-gray-100 rounded-xl hover:border-blue-200 transition-colors group">
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                                            Session {session.index}
                                        </span>
                                        {session.zoomMeetingId ? (
                                            <span className="w-2 h-2 rounded-full bg-green-500" title="Zoom Created"></span>
                                        ) : (
                                            <span className="w-2 h-2 rounded-full bg-red-300" title="No Zoom Link"></span>
                                        )}
                                    </div>
                                    <p className="text-sm font-semibold text-gray-800">
                                        {moment(session.startAt).format("MMM Do, YYYY")}
                                    </p>
                                    <p className="text-xs text-gray-500 flex items-center gap-1">
                                        <ClockIcon className="w-3 h-3"/>
                                        {moment(session.startAt).format("h:mm A")} - {moment(session.endAt).format("h:mm A")}
                                    </p>
                                    
                                    {session.zoomJoinUrl && (
                                        <a 
                                            href={session.zoomJoinUrl} 
                                            target="_blank" 
                                            rel="noreferrer"
                                            className="mt-2 block text-center text-xs bg-[#0b2540] text-white py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            Join Meeting
                                        </a>
                                    )}
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8 text-gray-400 text-sm">
                                No sessions generated yet.
                            </div>
                        )}
                    </div>
                </div>
            </div>

        </div>

      </div>
    </DashboardLayout>
  );
}