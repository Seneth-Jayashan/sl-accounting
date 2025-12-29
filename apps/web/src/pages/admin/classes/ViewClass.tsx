import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import moment from "moment";
import { motion, AnimatePresence } from "framer-motion";

// Icons
import {
  ArrowLeftIcon,
  UserGroupIcon,
  AcademicCapIcon,
  ClockIcon,
  ArrowPathIcon,
  VideoCameraIcon,
  TrashIcon,
  XCircleIcon,
  ExclamationTriangleIcon
} from "@heroicons/react/24/outline";

// Components
import StudentEnrollmentTab from "../../../components/admin/class/StudentEnrollmentTab";

// Services & Types
import ClassService, { type ClassData } from "../../../services/ClassService";
import SessionService from "../../../services/SessionService";

// --- SECURITY HELPER ---
const isValidUrl = (string: string) => {
  try { 
    const url = new URL(string);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch (_) {
    return false;  
  }
};

export default function ViewClassPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // State
  const [isLoading, setIsLoading] = useState(true);
  const [classData, setClassData] = useState<ClassData | null>(null);
  const [activeTab, setActiveTab] = useState<"students" | "sessions">("sessions");
  
  // Modal State
  const [cancelModal, setCancelModal] = useState<{ isOpen: boolean; sessionId: string | null }>({
    isOpen: false,
    sessionId: null
  });
  const [cancelReason, setCancelReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // --- FETCH DATA ---
  const fetchData = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const res = await ClassService.getClassById(id);
      const data = res.class || (res as any); 
      setClassData(data);
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // --- HANDLERS ---

  const handleCancelClick = (sessionId: string) => {
    setCancelModal({ isOpen: true, sessionId });
  };

  const handleCancelConfirm = async () => {
    if (!cancelModal.sessionId || !cancelReason.trim()) return;
    
    setIsProcessing(true);
    try {
      await SessionService.cancelSession(cancelModal.sessionId, cancelReason);
      
      // Optimistic Update
      setClassData((prev) => {
        if (!prev) return null;
        const updatedSessions = (prev as any).sessions.map((s: any) => 
          s._id === cancelModal.sessionId 
            ? { ...s, isCancelled: true, cancellationReason: cancelReason } 
            : s
        );
        return { ...prev, sessions: updatedSessions };
      });
      
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
      setClassData((prev) => {
        if (!prev) return null;
        const updatedSessions = (prev as any).sessions.filter((s: any) => s._id !== sessionId);
        return { ...prev, sessions: updatedSessions };
      });
    } catch (err) {
      alert("Delete failed.");
    }
  };

  // --- RENDER HELPERS ---
  if (isLoading) return <LoadingState />;
  if (!classData) return <NotFoundState onBack={() => navigate("/admin/classes")} />;

  const sessions = (classData as any).sessions || [];
  const nextSession = (classData as any).timeSchedules?.[0];

  return (
    <div className="max-w-6xl mx-auto space-y-6 p-4 sm:p-6 pb-24 sm:pb-24 animate-in fade-in duration-500">
      
      {/* HEADER */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1 w-full sm:w-auto">
          <button 
            onClick={() => navigate("/admin/classes")} 
            className="flex items-center text-[10px] font-bold text-gray-400 hover:text-brand-cerulean transition-all uppercase tracking-widest"
          >
            <ArrowLeftIcon className="w-3 h-3 mr-2 stroke-[3px]" /> Curriculum
          </button>
          <h1 className="text-xl sm:text-2xl font-semibold text-brand-prussian tracking-tight truncate max-w-[300px] sm:max-w-none">
            {classData.name}
          </h1>
        </div>
        <button 
          onClick={() => navigate(`/admin/classes/edit/${id}`)} 
          className="w-full sm:w-auto bg-brand-aliceBlue text-brand-prussian px-4 py-3 sm:py-2 rounded-xl sm:rounded-lg text-sm sm:text-xs font-semibold hover:bg-brand-cerulean hover:text-white transition-all shadow-sm text-center"
        >
            Edit Module
        </button>
      </header>

      {/* STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <DetailCard 
          icon={<AcademicCapIcon className="w-5 h-5"/>} 
          label="Intake" 
          value={(classData.batch as any)?.name || "N/A"} 
        />
        <DetailCard 
          icon={<ClockIcon className="w-5 h-5"/>} 
          label="Timing" 
          value={nextSession ? `${moment().day(nextSession.day).format("dddd")} @ ${nextSession.startTime}` : "TBA"} 
        />
        <DetailCard 
          icon={<UserGroupIcon className="w-5 h-5"/>} 
          label="Enrolled" 
          value={`${(classData as any).studentCount || 0} Students`} 
        />
      </div>

      {/* TABS & CONTENT */}
      <div className="space-y-4">
        <div className="flex p-1 bg-brand-aliceBlue/50 rounded-lg w-full sm:w-fit border border-brand-aliceBlue overflow-x-auto">
          <TabTrigger 
            active={activeTab === "sessions"} 
            onClick={() => setActiveTab("sessions")} 
            label="Session Controls" 
          />
          <TabTrigger 
            active={activeTab === "students"} 
            onClick={() => setActiveTab("students")} 
            label="Enrollment" 
          />
        </div>

        <AnimatePresence mode="wait">
          {activeTab === "sessions" ? (
            <motion.div 
              key="sessions"
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: -10 }}
              className="space-y-3"
            >
              {sessions.length > 0 ? (
                sessions.map((session: any) => (
                  <SessionRow 
                    key={session._id} 
                    session={session} 
                    onCancel={() => handleCancelClick(session._id)}
                    onDelete={() => handleDeleteSession(session._id)}
                  />
                ))
              ) : (
                  <div className="p-10 text-center border-2 border-dashed border-brand-aliceBlue rounded-xl">
                    <p className="text-gray-400 text-sm font-medium">No sessions scheduled yet.</p>
                  </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="students"
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <StudentEnrollmentTab classId={id!} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* CANCELLATION MODAL */}
      <AnimatePresence>
        {cancelModal.isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
              onClick={() => !isProcessing && setCancelModal({ isOpen: false, sessionId: null })} 
              className="absolute inset-0 bg-brand-prussian/40 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} 
              className="bg-white rounded-2xl p-6 w-full max-w-md relative z-10 shadow-2xl border border-brand-aliceBlue"
            >
              <div className="flex items-center gap-2 mb-2 text-brand-prussian">
                <ExclamationTriangleIcon className="w-5 h-5 text-orange-500" />
                <h2 className="text-lg font-semibold">Cancel Session</h2>
              </div>
              <p className="text-xs text-gray-500 mb-4 font-medium leading-relaxed">
                This will mark the session as cancelled for all students. They will receive a notification if enabled.
              </p>
              
              <div className="space-y-1 mb-6">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Reason for cancellation</label>
                <textarea 
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="E.g. Technical maintenance, Instructor unavailable..."
                  className="w-full bg-brand-aliceBlue/30 border border-brand-aliceBlue rounded-xl p-3 text-sm font-medium focus:ring-2 focus:ring-brand-cerulean/20 outline-none transition-all h-24 resize-none"
                />
              </div>

              <div className="flex gap-3">
                <button 
                  disabled={isProcessing} 
                  onClick={() => setCancelModal({ isOpen: false, sessionId: null })} 
                  className="flex-1 py-3 text-xs font-bold text-gray-400 uppercase hover:bg-gray-50 rounded-xl transition-colors"
                >
                  Dismiss
                </button>
                <button 
                  disabled={isProcessing || !cancelReason.trim()} 
                  onClick={handleCancelConfirm}
                  className="flex-1 py-3 bg-red-500 text-white rounded-xl text-xs font-bold uppercase hover:bg-red-600 transition-colors shadow-lg shadow-red-200 disabled:opacity-50"
                >
                  {isProcessing ? "Processing..." : "Confirm Cancellation"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- SUB-COMPONENTS ---

const SessionRow = ({ session, onCancel, onDelete }: { session: any, onCancel: () => void, onDelete: () => void }) => {
  const isPast = moment(session.startAt).isBefore(moment());
  const isCancelled = session.isCancelled;
  const hasLink = session.zoomStartUrl && isValidUrl(session.zoomStartUrl);

  return (
    <div className={`bg-white border ${isCancelled ? 'border-red-100 bg-red-50/20' : 'border-brand-aliceBlue'} rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all shadow-sm hover:shadow-md`}>
      <div className="flex items-center gap-4 w-full sm:w-auto">
        <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center text-sm font-bold shadow-sm shrink-0 ${isCancelled ? 'bg-white text-red-500 border border-red-100' : isPast ? 'bg-gray-100 text-gray-400' : 'bg-brand-cerulean text-white'}`}>
          {session.index}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-brand-prussian">{moment(session.startAt).format("DD MMM YYYY")}</p>
            {isCancelled && <span className="text-[8px] font-black bg-red-500 text-white px-1.5 py-0.5 rounded uppercase tracking-wider">Cancelled</span>}
            {isPast && !isCancelled && <span className="text-[8px] font-black bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded uppercase tracking-wider">Completed</span>}
          </div>
          <p className="text-xs text-gray-400 font-medium mt-0.5">
            {moment(session.startAt).format("hh:mm A")} - {moment(session.endAt).format("hh:mm A")}
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0">
        {/* START MEETING BUTTON */}
        {!isCancelled && !isPast && hasLink && (
          <a 
            href={session.zoomStartUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-brand-cerulean text-white px-5 py-3 sm:py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider hover:bg-brand-prussian transition-all shadow-sm active:scale-95"
          >
            <VideoCameraIcon className="w-4 h-4 stroke-2" /> Launch
          </a>
        )}

        <div className="flex gap-2 w-full sm:w-auto">
            {/* CANCEL MEETING BUTTON */}
            {!isCancelled && !isPast && (
            <button 
                onClick={onCancel} 
                className="flex-1 sm:flex-none py-3 sm:py-2.5 px-3 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all border border-brand-aliceBlue hover:border-red-100 flex justify-center" 
                title="Cancel Meeting"
            >
                <XCircleIcon className="w-5 h-5" />
            </button>
            )}

            {isCancelled && (
                <div className="flex-1 sm:flex-none text-[10px] font-medium text-red-400 italic px-3 py-2 border-l-2 border-red-200 bg-red-50/50 rounded-r-lg">
                    "{session.cancellationReason || "No reason specified"}"
                </div>
            )}

            <button 
            onClick={onDelete} 
            className="flex-1 sm:flex-none py-3 sm:py-2.5 px-3 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all border border-brand-aliceBlue hover:border-red-100 flex justify-center" 
            title="Delete Permanent"
            >
            <TrashIcon className="w-5 h-5" />
            </button>
        </div>
      </div>
    </div>
  );
};

const DetailCard = ({ icon, label, value }: { icon: any, label: string, value: string }) => (
    <div className="bg-white p-4 sm:p-5 rounded-2xl border border-brand-aliceBlue shadow-sm flex items-center gap-4">
      <div className="p-2 sm:p-3 bg-brand-aliceBlue rounded-xl text-brand-cerulean shrink-0">{icon}</div>
      <div className="min-w-0 overflow-hidden">
        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5 truncate">{label}</p>
        <p className="text-sm font-semibold text-brand-prussian truncate">{value}</p>
      </div>
    </div>
);
  
const TabTrigger = ({ active, onClick, label }: { active: boolean, onClick: () => void, label: string }) => (
    <button 
      onClick={onClick} 
      className={`flex-1 sm:flex-none px-4 sm:px-5 py-2.5 sm:py-2 rounded-md text-[10px] font-bold transition-all uppercase tracking-wider ${active ? "bg-white text-brand-cerulean shadow-sm" : "text-gray-400 hover:text-brand-prussian"}`}
    >
      {label}
    </button>
);

const LoadingState = () => (
    <div className="flex h-[70vh] items-center justify-center flex-col gap-4">
      <ArrowPathIcon className="w-8 h-8 text-brand-cerulean animate-spin" />
      <span className="text-xs font-bold text-gray-300 uppercase tracking-widest">Loading Curriculum...</span>
    </div>
);

const NotFoundState = ({ onBack }: { onBack: () => void }) => (
    <div className="text-center py-32 space-y-4">
      <h2 className="text-lg font-semibold text-brand-prussian">Record data unavailable</h2>
      <button onClick={onBack} className="bg-brand-prussian text-white px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-widest">
        Return to portal
      </button>
    </div>
);