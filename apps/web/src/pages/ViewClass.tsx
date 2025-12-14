import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ClassService from "../services/ClassService";
import {
  CalendarDaysIcon,
  ClockIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  CheckBadgeIcon,
  ArrowLeftIcon,
  ShareIcon
} from "@heroicons/react/24/outline";

// --- Configuration ---
const API_BASE_URL = "http://localhost:3000"; 

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

export default function ViewPublicClassPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [classData, setClassData] = useState<ClassData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- Helper: Image URL ---
  const getImageUrl = (path?: string) => {
    if (!path) return "https://via.placeholder.com/1200x600?text=SL+Accounting";
    if (path.startsWith("http")) return path;
    const cleanPath = path.replace(/\\/g, "/");
    return `${API_BASE_URL}/${cleanPath.startsWith("/") ? cleanPath.slice(1) : cleanPath}`;
  };

  // --- Helper: Day Name ---
  const getDayName = (dayIndex: number) => 
    ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][dayIndex] || "";

  // --- Fetch Data ---
  useEffect(() => {
    if (!id) return;
    const fetchClass = async () => {
      setLoading(true);
      try {
        const data = await ClassService.getPublicClassById(id);
        // Handle array vs object response just in case
        setClassData(Array.isArray(data) ? data[0] : data); 
      } catch (err) {
        console.error(err);
        setError("Class not found or unavailable.");
      } finally {
        setLoading(false);
      }
    };
    fetchClass();
  }, [id]);
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse text-gray-400 font-medium">Loading class details...</div>
      </div>
    );
  }

  if (error || !classData) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center text-center p-4">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Oops!</h2>
        <p className="text-gray-500 mb-6">{error || "We couldn't find that class."}</p>
        <button 
          onClick={() => navigate("/classes")}
          className="bg-[#0b2540] text-white px-6 py-2.5 rounded-xl hover:bg-[#153454] transition-colors"
        >
          Browse All Classes
        </button>
      </div>
    );
  }

  const schedule = classData.timeSchedules && classData.timeSchedules[0];

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 pb-20">
      
      {/* --- HERO IMAGE BACKGROUND --- */}
      <div className="relative h-[40vh] md:h-[50vh] bg-gray-900 overflow-hidden">
        <img 
          src={getImageUrl(classData.coverImage)} 
          alt={classData.name} 
          className="w-full h-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent"></div>
        
        {/* Back Button (Absolute) */}
        <div className="absolute top-6 left-6 z-10">
            <button 
                onClick={() => navigate("/classes")}
                className="flex items-center gap-2 bg-white/20 backdrop-blur-md text-white px-4 py-2 rounded-full hover:bg-white/30 transition-colors text-sm font-medium"
            >
                <ArrowLeftIcon className="w-4 h-4" /> Back
            </button>
        </div>
      </div>

      {/* --- CONTENT CONTAINER --- */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 relative -mt-32 z-10">
        
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-3">
                
                {/* LEFT: Main Content */}
                <div className="lg:col-span-2 p-8 md:p-10 border-b lg:border-b-0 lg:border-r border-gray-100">
                    
                    {/* Header */}
                    <div className="mb-6">
                        <div className="flex flex-wrap gap-2 mb-4">
                            <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
                                {classData.level} Level
                            </span>
                            {classData.batch && (
                                <span className="bg-purple-50 text-purple-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
                                    {typeof classData.batch === 'object' ? classData.batch.name : 'Batch'}
                                </span>
                            )}
                        </div>
                        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">{classData.name}</h1>
                        <p className="text-gray-500 text-lg">Master accounting concepts with expert guidance.</p>
                    </div>

                    {/* Schedule Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                        <div className="bg-gray-50 p-4 rounded-2xl flex items-center gap-4">
                            <div className="bg-white p-3 rounded-xl shadow-sm text-blue-600">
                                <CalendarDaysIcon className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 font-bold uppercase">Class Day</p>
                                <p className="text-gray-900 font-semibold">{schedule ? `${getDayName(schedule.day)}s` : "TBA"}</p>
                            </div>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-2xl flex items-center gap-4">
                            <div className="bg-white p-3 rounded-xl shadow-sm text-blue-600">
                                <ClockIcon className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 font-bold uppercase">Time</p>
                                <p className="text-gray-900 font-semibold">{schedule ? `${schedule.startTime} - ${schedule.endTime}` : "TBA"}</p>
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    <div className="prose prose-blue max-w-none text-gray-600">
                        <h3 className="text-gray-900 font-bold text-lg mb-3">About this Class</h3>
                        <p className="whitespace-pre-wrap leading-relaxed">{classData.description}</p>
                    </div>

                    {/* Tags */}
                    {classData.tags && classData.tags.length > 0 && (
                        <div className="mt-8 pt-6 border-t border-gray-100">
                            <p className="text-sm font-bold text-gray-400 mb-3 uppercase">Topics Covered</p>
                            <div className="flex flex-wrap gap-2">
                                {classData.tags.map((tag, idx) => (
                                    <span key={idx} className="bg-gray-100 text-gray-600 px-3 py-1 rounded-lg text-sm font-medium">
                                        #{tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* RIGHT: Sidebar / Pricing */}
                <div className="lg:col-span-1 bg-gray-50 p-8 md:p-10 flex flex-col">
                    
                    <div className="mb-8">
                        <p className="text-sm text-gray-500 font-bold uppercase mb-1">Monthly Fee</p>
                        <div className="flex items-baseline gap-1">
                            <span className="text-sm font-semibold text-gray-500">LKR</span>
                            <span className="text-4xl font-bold text-[#0b2540]">{classData.price.toLocaleString()}</span>
                        </div>
                    </div>

                    <div className="space-y-4 mb-8 flex-1">
                        <div className="flex items-start gap-3">
                            <CheckBadgeIcon className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-gray-600">Access to all live sessions via Zoom</p>
                        </div>
                        <div className="flex items-start gap-3">
                            <CheckBadgeIcon className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-gray-600">Full recording access for revision</p>
                        </div>
                        <div className="flex items-start gap-3">
                            <CheckBadgeIcon className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-gray-600">Downloadable study materials</p>
                        </div>
                        <div className="flex items-start gap-3">
                            <UserGroupIcon className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-gray-600">Interactive Q&A with instructor</p>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-3 mt-auto">
                        <button 
                            className="w-full bg-[#0b2540] text-white font-bold py-4 rounded-xl hover:bg-[#153454] transition-all shadow-lg shadow-blue-900/20 transform hover:-translate-y-0.5"
                            onClick={() => alert("Enrollment feature coming soon!")}
                        >
                            Enroll Now
                        </button>
                        <button 
                            className="w-full bg-white border border-gray-200 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                            onClick={() => {
                                navigator.clipboard.writeText(window.location.href);
                                alert("Link copied to clipboard!");
                            }}
                        >
                            <ShareIcon className="w-5 h-5" /> Share Class
                        </button>
                    </div>

                </div>
            </div>
        </div>

      </div>
    </div>
  );
}