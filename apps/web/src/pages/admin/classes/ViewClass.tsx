import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import moment from "moment";
import { motion, AnimatePresence } from "framer-motion";
import DashboardLayout from "../../../layouts/DashboardLayout";
import SidebarAdmin from "../../../components/sidebar/SidebarAdmin";
import BottomNavAdmin from "../../../components/bottomNavbar/BottomNavAdmin";
import ClassService from "../../../services/ClassService";
import SessionService from "../../../services/SessionService"; // Import Session Service
import {
  ArrowLeftIcon,
  UserGroupIcon,
  AcademicCapIcon,
  ClockIcon,
  ArrowPathIcon,
  VideoCameraIcon,
  TrashIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";

export default function ViewClassPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [classData, setClassData] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<"students" | "sessions">("sessions");
  
  // Cancellation Modal State
  const [cancelModal, setCancelModal] = useState<{ isOpen: boolean; sessionId: string | null }>({
    isOpen: false,
    sessionId: null
  });
  const [cancelReason, setCancelReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchData = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const res = await ClassService.getClassById(id);
      setClassData(res.class || res);
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // --- Handlers ---

  const handleCancelClick = (sessionId: string) => {
    setCancelModal({ isOpen: true, sessionId });
  };

  const handleCancelConfirm = async () => {
    if (!cancelModal.sessionId || !cancelReason.trim()) return;
    
    setIsProcessing(true);
    try {
      await SessionService.cancelSession(cancelModal.sessionId, cancelReason);
      
      // Update UI locally (Optimistic Update)
      setClassData((prev: any) => ({
        ...prev,
        sessions: prev.sessions.map((s: any) => 
          s._id === cancelModal.sessionId 
            ? { ...s, isCancelled: true, cancellationReason: cancelReason } 
            : s
        )
      }));
      
      setCancelModal({ isOpen: false, sessionId: null });
      setCancelReason("");
    } catch (err) {
      alert("Failed to cancel session. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!window.confirm("Permanent Action: This will delete the session record and the Zoom meeting. Proceed?")) return;
    try {
      await SessionService.deleteSession(sessionId);
      setClassData((prev: any) => ({
        ...prev,
        sessions: prev.sessions.filter((s: any) => s._id !== sessionId)
      }));
    } catch (err) {
      alert("Delete failed.");
    }
  };

  if (isLoading) return <LoadingState />;
  if (!classData) return <NotFoundState onBack={() => navigate("/admin/classes")} />;

  return (
    <DashboardLayout Sidebar={SidebarAdmin} BottomNav={BottomNavAdmin}>
      <div className="max-w-6xl mx-auto space-y-6 p-6 pb-24 animate-in fade-in duration-500">
        
        {/* --- HEADER --- */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <button onClick={() => navigate("/admin/classes")} className="flex items-center text-[10px] font-bold text-gray-400 hover:text-brand-cerulean transition-all uppercase tracking-widest">
              <ArrowLeftIcon className="w-3 h-3 mr-2 stroke-[3px]" /> Curriculum
            </button>
            <h1 className="text-2xl font-semibold text-brand-prussian tracking-tight">{classData.name}</h1>
          </div>
          <button onClick={() => navigate(`/admin/classes/edit/${id}`)} className="bg-brand-aliceBlue text-brand-prussian px-4 py-2 rounded-lg text-xs font-semibold hover:bg-brand-cerulean hover:text-white transition-all shadow-sm">
             Edit Module
          </button>
        </header>

        {/* --- STATS --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <DetailCard icon={<AcademicCapIcon />} label="Intake" value={classData.batch?.name || "N/A"} />
          <DetailCard icon={<ClockIcon />} label="Timing" value={classData.timeSchedules?.[0] ? `${moment().day(classData.timeSchedules[0].day).format("dddd")} @ ${classData.timeSchedules[0].startTime}` : "TBA"} />
          <DetailCard icon={<UserGroupIcon />} label="Enrolled" value={`${classData.studentCount || 0} Students`} />
        </div>

        {/* --- SESSIONS TAB --- */}
        <div className="space-y-4">
          <div className="flex p-1 bg-brand-aliceBlue/50 rounded-lg w-fit border border-brand-aliceBlue">
            <TabTrigger active={activeTab === "sessions"} onClick={() => setActiveTab("sessions")} label="Session Controls" />
            <TabTrigger active={activeTab === "students"} onClick={() => setActiveTab("students")} label="Enrollment" />
          </div>

          <AnimatePresence mode="wait">
            {activeTab === "sessions" ? (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                {classData.sessions?.map((session: any) => (
                  <SessionRow 
                    key={session._id} 
                    session={session} 
                    onCancel={() => handleCancelClick(session._id)}
                    onDelete={() => handleDeleteSession(session._id)}
                  />
                ))}
              </motion.div>
            ) : (
                <div className="bg-white border border-brand-aliceBlue rounded-xl p-20 text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                Student Enrollment View
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* --- CANCELLATION MODAL --- */}
      <AnimatePresence>
        {cancelModal.isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => !isProcessing && setCancelModal({ isOpen: false, sessionId: null })} className="absolute inset-0 bg-brand-prussian/40 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white rounded-2xl p-6 w-full max-w-md relative z-10 shadow-2xl border border-brand-aliceBlue">
              <h2 className="text-lg font-semibold text-brand-prussian mb-1">Cancel Session</h2>
              <p className="text-xs text-gray-500 mb-4 font-medium">Please provide a reason. This will be visible to students.</p>
              <textarea 
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="E.g. Technical maintenance, Instructor unavailable..."
                className="w-full bg-brand-aliceBlue/50 border border-brand-aliceBlue rounded-lg p-3 text-sm font-medium focus:ring-2 focus:ring-brand-cerulean outline-none transition-all h-28 resize-none mb-4"
              />
              <div className="flex gap-2">
                <button disabled={isProcessing} onClick={() => setCancelModal({ isOpen: false, sessionId: null })} className="flex-1 py-2.5 text-xs font-bold text-gray-400 uppercase hover:bg-gray-50 rounded-lg transition-colors">Dismiss</button>
                <button 
                    disabled={isProcessing || !cancelReason.trim()} 
                    onClick={handleCancelConfirm}
                    className="flex-1 py-2.5 bg-red-500 text-white rounded-lg text-xs font-bold uppercase hover:bg-red-600 transition-colors shadow-lg shadow-red-200"
                >
                  {isProcessing ? "Processing..." : "Confirm Cancellation"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}

// --- SUB-COMPONENTS ---

const SessionRow = ({ session, onCancel, onDelete }: any) => {
  const isPast = moment(session.startAt).isBefore(moment());
  const isCancelled = session.isCancelled;

  return (
    <div className={`bg-white border ${isCancelled ? 'border-red-100 bg-red-50/20 opacity-80' : 'border-brand-aliceBlue'} rounded-xl p-4 flex flex-col md:flex-row justify-between items-center gap-4 transition-all shadow-sm`}>
      <div className="flex items-center gap-4 w-full md:w-auto">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold ${isCancelled ? 'bg-red-100 text-red-500' : isPast ? 'bg-gray-100 text-gray-400' : 'bg-brand-cerulean text-white'}`}>
          {session.index}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-brand-prussian">{moment(session.startAt).format("DD MMM YYYY")}</p>
            {isCancelled && <span className="text-[8px] font-black bg-red-500 text-white px-1.5 py-0.5 rounded uppercase">Cancelled</span>}
          </div>
          <p className="text-[11px] text-gray-400 font-medium">{moment(session.startAt).format("hh:mm A")} - {moment(session.endAt).format("hh:mm A")}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 w-full md:w-auto">
        {/* START MEETING BUTTON */}
        {!isCancelled && !isPast && session.zoomStartUrl && (
          <a 
            href={session.zoomStartUrl} target="_blank" rel="noopener noreferrer"
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-brand-cerulean text-white px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-brand-prussian transition-all shadow-sm"
          >
            <VideoCameraIcon className="w-4 h-4 stroke-2" /> Start Meeting
          </a>
        )}

        {/* CANCEL MEETING BUTTON */}
        {!isCancelled && !isPast && (
          <button onClick={onCancel} className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all" title="Cancel Meeting">
            <XCircleIcon className="w-5 h-5" />
          </button>
        )}

        {isCancelled && (
            <div className="flex-1 md:flex-none text-[10px] font-medium text-red-400 italic px-3">
                Reason: {session.cancellationReason || "No reason specified"}
            </div>
        )}

        <button onClick={onDelete} className="p-2 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" title="Delete Permanent">
          <TrashIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

/* --- SHARED COMPONENTS (Simplified for brevity) --- */
const DetailCard = ({ icon, label, value }: any) => (
    <div className="bg-white p-4 rounded-xl border border-brand-aliceBlue shadow-sm flex items-center gap-3">
      <div className="p-2 bg-brand-aliceBlue rounded-lg text-brand-cerulean">{icon}</div>
      <div className="min-w-0">
        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">{label}</p>
        <p className="text-sm font-semibold text-brand-prussian truncate">{value}</p>
      </div>
    </div>
  );
  
const TabTrigger = ({ active, onClick, label }: any) => (
    <button onClick={onClick} className={`px-4 py-1.5 rounded-md text-[10px] font-bold transition-all uppercase tracking-wider ${active ? "bg-white text-brand-cerulean shadow-sm" : "text-gray-400 hover:text-brand-prussian"}`}>
      {label}
    </button>
);

const LoadingState = () => (<DashboardLayout Sidebar={SidebarAdmin} BottomNav={BottomNavAdmin}><div className="flex h-[70vh] items-center justify-center"><ArrowPathIcon className="w-8 h-8 text-brand-cerulean animate-spin" /></div></DashboardLayout>);

const NotFoundState = ({ onBack }: any) => (<DashboardLayout Sidebar={SidebarAdmin} BottomNav={BottomNavAdmin}><div className="text-center py-32 space-y-4"><h2 className="text-lg font-semibold text-brand-prussian">Record data unavailable</h2><button onClick={onBack} className="bg-brand-prussian text-white px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-widest">Return to portal</button></div></DashboardLayout>);