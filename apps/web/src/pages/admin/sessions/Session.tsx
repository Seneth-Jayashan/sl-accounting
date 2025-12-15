import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import moment from "moment";
import DashboardLayout from "../../../layouts/DashboardLayout";
import SidebarAdmin from "../../../components/sidebar/SidebarAdmin";
import BottomNavAdmin from "../../../components/bottomNavbar/BottomNavAdmin";
import ClassService from "../../../services/ClassService";
import SessionService from "../../../services/SessionService"; // Import SessionService
import {
  VideoCameraIcon,
  CalendarDaysIcon,
  ClockIcon,
  MagnifyingGlassIcon,
  ArrowTopRightOnSquareIcon,
  PlusIcon,
  TrashIcon,       // Added
  NoSymbolIcon,    // Added for Cancel
  ExclamationCircleIcon // Added for visual cues
} from "@heroicons/react/24/outline";

// --- Interfaces ---
interface Session {
  _id: string;
  index: number;
  startAt: string;
  endAt: string;
  zoomMeetingId?: string;
  zoomJoinUrl?: string;
  zoomStartUrl?: string;
  isCancelled?: boolean; // Added to track status
}

interface ClassData {
  _id: string;
  name: string;
  sessions: Session[];
}

// Flattened Session Type for Display
interface FlatSession extends Session {
  className: string;
  classId: string;
}

export default function SessionsPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"upcoming" | "past">("upcoming");
  const [searchTerm, setSearchTerm] = useState("");
  
  // Data State
  const [allSessions, setAllSessions] = useState<FlatSession[]>([]);
  const [filteredSessions, setFilteredSessions] = useState<FlatSession[]>([]);

  // 1. Fetch and Flatten Data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const classes = await ClassService.getAllClasses(); 
        
        const flattened: FlatSession[] = [];
        
        classes.forEach((cls: ClassData) => {
          if (cls.sessions && Array.isArray(cls.sessions)) {
            cls.sessions.forEach((sess) => {
              flattened.push({
                ...sess,
                className: cls.name,
                classId: cls._id,
              });
            });
          }
        });

        // Sort by Date (Ascending)
        flattened.sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
        setAllSessions(flattened);

      } catch (error) {
        console.error("Failed to load sessions", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // 2. Filter & Search Logic
  useEffect(() => {
    const now = new Date();
    
    let result = allSessions.filter(s => {
      const sessionDate = new Date(s.startAt);
      const matchesTab = activeTab === "upcoming" ? sessionDate >= now : sessionDate < now;
      const matchesSearch = s.className.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesTab && matchesSearch;
    });

    // If "Past", reverse sort to show most recent past first
    if (activeTab === "past") {
      result.reverse();
    }

    setFilteredSessions(result);
  }, [allSessions, activeTab, searchTerm]);


  // --- Helper: Format Duration ---
  const getDuration = (start: string, end: string) => {
    const diff = moment(end).diff(moment(start), 'minutes');
    return `${diff} mins`;
  };

  // --- Handlers: Cancel & Delete ---
  
  const handleCancelSession = async (sessionId: string) => {
    const confirmCancel = window.confirm("Are you sure you want to CANCEL this session? This will mark it as cancelled and notify students.");
    if (!confirmCancel) return;

    try {
        // Call API to cancel
        await SessionService.cancelSession(sessionId, "Admin Cancelled", true);
        
        // Update local state to reflect change without reload
        setAllSessions(prev => prev.map(s => 
            s._id === sessionId ? { ...s, isCancelled: true, zoomMeetingId: undefined, zoomStartUrl: undefined } : s
        ));
        alert("Session cancelled successfully.");
    } catch (error) {
        console.error("Error cancelling session:", error);
        alert("Failed to cancel session.");
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    const confirmDelete = window.confirm("Are you sure you want to DELETE this session PERMANENTLY? This cannot be undone.");
    if (!confirmDelete) return;

    try {
        // Call API to delete
        await SessionService.deleteSession(sessionId);

        // Remove from local state
        setAllSessions(prev => prev.filter(s => s._id !== sessionId));
        alert("Session deleted successfully.");
    } catch (error) {
        console.error("Error deleting session:", error);
        alert("Failed to delete session.");
    }
  };

  return (
    <DashboardLayout Sidebar={SidebarAdmin} BottomNav={BottomNavAdmin}>
      <div className="p-6 max-w-7xl mx-auto space-y-6 pb-20">
        
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">All Sessions</h1>
            <p className="text-gray-500 text-sm">View and manage schedules across all classes.</p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full lg:w-auto">
            {/* Tabs */}
            <div className="bg-gray-100 p-1 rounded-xl flex gap-1">
              <button
                onClick={() => setActiveTab("upcoming")}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                  activeTab === "upcoming" 
                    ? "bg-white text-[#0b2540] shadow-sm" 
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Upcoming
              </button>
              <button
                onClick={() => setActiveTab("past")}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                  activeTab === "past" 
                    ? "bg-white text-[#0b2540] shadow-sm" 
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Past History
              </button>
            </div>

            {/* Schedule Button */}
            <button
              onClick={() => navigate("/admin/sessions/create")}
              className="flex items-center justify-center gap-2 bg-[#0b2540] hover:bg-[#153454] text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-lg shadow-blue-900/20 whitespace-nowrap w-full sm:w-auto"
            >
              <PlusIcon className="w-5 h-5" />
              <span>Schedule Session</span>
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search by class name..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0b2540] focus:border-transparent outline-none transition-all"
          />
        </div>

        {/* Content Area */}
        {loading ? (
          <div className="flex justify-center py-20 animate-pulse text-gray-400">Loading master schedule...</div>
        ) : filteredSessions.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
             <CalendarDaysIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
             <h3 className="text-lg font-medium text-gray-900">No {activeTab} sessions found</h3>
             <p className="text-gray-500 mb-4">Try adjusting your search or add new classes.</p>
             {activeTab === 'upcoming' && (
                <button 
                  onClick={() => navigate("/admin/sessions/create")}
                  className="text-[#0b2540] font-medium hover:underline"
                >
                  Schedule a Session
                </button>
             )}
          </div>
        ) : (
          <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500 font-semibold">
                    <th className="px-6 py-4">Date & Time</th>
                    <th className="px-6 py-4">Class Name</th>
                    <th className="px-6 py-4">Session</th>
                    <th className="px-6 py-4 text-center">Zoom</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredSessions.map((session) => (
                    <tr 
                        key={session._id} 
                        className={`hover:bg-blue-50/30 transition-colors group ${session.isCancelled ? 'bg-gray-50/50' : ''}`}
                    >
                      
                      {/* Date Column */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`flex items-center gap-3 ${session.isCancelled ? 'opacity-50' : ''}`}>
                           <div className={`font-bold p-2 rounded-lg text-center min-w-[50px] ${session.isCancelled ? 'bg-gray-100 text-gray-400' : 'bg-blue-50 text-blue-700'}`}>
                              <div className="text-xs uppercase">{moment(session.startAt).format("MMM")}</div>
                              <div className="text-lg">{moment(session.startAt).format("DD")}</div>
                           </div>
                           <div>
                              <div className="font-semibold text-gray-900">{moment(session.startAt).format("dddd")}</div>
                              <div className="text-xs text-gray-500 flex items-center gap-1">
                                <ClockIcon className="w-3 h-3" />
                                {moment(session.startAt).format("h:mm A")} - {moment(session.endAt).format("h:mm A")}
                              </div>
                           </div>
                        </div>
                      </td>

                      {/* Class Name */}
                      <td className="px-6 py-4">
                        <span 
                          onClick={() => navigate(`/admin/classes/${session.classId}`)}
                          className={`font-medium cursor-pointer ${session.isCancelled ? 'text-gray-400 line-through decoration-gray-300' : 'text-gray-700 hover:text-[#0b2540] hover:underline'}`}
                        >
                          {session.className}
                        </span>
                        <div className="text-xs text-gray-400 mt-0.5">
                           Duration: {getDuration(session.startAt, session.endAt)}
                        </div>
                      </td>

                      {/* Session Index / Status */}
                      <td className="px-6 py-4">
                        {session.isCancelled ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 border border-red-200">
                                <ExclamationCircleIcon className="w-3 h-3"/> Cancelled
                            </span>
                        ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                Session {session.index}
                            </span>
                        )}
                      </td>

                      {/* Zoom Status */}
                      <td className="px-6 py-4 text-center">
                        {session.isCancelled ? (
                             <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-300">
                                <VideoCameraIcon className="w-5 h-5" />
                             </div>
                        ) : session.zoomMeetingId ? (
                           <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-600" title="Zoom Linked">
                              <VideoCameraIcon className="w-5 h-5" />
                           </div>
                        ) : (
                           <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-400" title="No Zoom Link">
                              <VideoCameraIcon className="w-5 h-5" />
                           </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* Start Zoom Button */}
                            {session.zoomStartUrl && activeTab === 'upcoming' && !session.isCancelled && (
                                <a 
                                  href={session.zoomStartUrl} 
                                  target="_blank" 
                                  rel="noreferrer"
                                  className="text-xs bg-[#0b2540] text-white px-3 py-1.5 rounded-lg hover:bg-[#153454] transition-colors flex items-center gap-1"
                                >
                                  Start <ArrowTopRightOnSquareIcon className="w-3 h-3" />
                                </a>
                            )}
                            
                            {/* Details Button */}
                            <button 
                               onClick={() => navigate(`/admin/classes/${session.classId}`)}
                               className="text-xs border border-gray-200 text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Details
                            </button>

                            {/* Cancel Button (Only if not already cancelled and is upcoming) */}
                            {!session.isCancelled && activeTab === 'upcoming' && (
                                <button
                                    onClick={() => handleCancelSession(session._id)}
                                    title="Cancel Session"
                                    className="p-1.5 text-gray-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-colors"
                                >
                                    <NoSymbolIcon className="w-5 h-5" />
                                </button>
                            )}

                            {/* Delete Button (Always available for admin) */}
                            <button
                                onClick={() => handleDeleteSession(session._id)}
                                title="Delete Permanently"
                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                                <TrashIcon className="w-5 h-5" />
                            </button>
                          </div>
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}