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
  ExclamationTriangleIcon,
  LinkIcon,
  ArrowTopRightOnSquareIcon,
  CheckCircleIcon
} from "@heroicons/react/24/outline";

// Components
import StudentEnrollmentTab from "../../../components/admin/class/StudentEnrollmentTab";

// Services & Types
import ClassService, { type ClassData, type ClassRecording } from "../../../services/ClassService";
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
  const [activeTab, setActiveTab] = useState<"students" | "sessions" | "attendance">("sessions");
  
  // Attendance State
  const [attendanceSummary, setAttendanceSummary] = useState<any>(null);
  const [isLoadingAttendance, setIsLoadingAttendance] = useState(false);
  
  // Modal State
  const [cancelModal, setCancelModal] = useState<{ isOpen: boolean; sessionId: string | null }>({
    isOpen: false,
    sessionId: null
  });
  const [cancelReason, setCancelReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordings, setRecordings] = useState<ClassRecording[]>([]);
  const [recordingName, setRecordingName] = useState("");
  const [recordingUrl, setRecordingUrl] = useState("");
  const [selectedSessionId, setSelectedSessionId] = useState("");
  const [isSavingRecording, setIsSavingRecording] = useState(false);
  const [editingRecordingId, setEditingRecordingId] = useState("");
  const [editRecordingName, setEditRecordingName] = useState("");
  const [isUpdatingRecording, setIsUpdatingRecording] = useState(false);

  // --- FETCH DATA ---
  const fetchData = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const [res, recordingsRes] = await Promise.all([
        ClassService.getClassById(id),
        ClassService.getClassRecordings(id),
      ]);
      const data = res.class || (res as any); 
      setClassData(data);
      setRecordings(recordingsRes.recordings || []);
      if (data?.sessions?.length > 0) {
        setSelectedSessionId((prev) => prev || data.sessions[0]._id);
      }
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // --- ATTENDANCE HANDLER ---
  const handleAttendanceTabClick = async () => {
    setActiveTab("attendance");
    if (!id || attendanceSummary) return; // Already loaded

    setIsLoadingAttendance(true);
    try {
      const data = await SessionService.getClassAttendanceSummary(id);
      setAttendanceSummary(data);
    } catch (err) {
      console.error("Failed to fetch attendance:", err);
      alert("Failed to load attendance data. Please try again.");
    } finally {
      setIsLoadingAttendance(false);
    }
  };

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

  const handleAddRecording = async () => {
    if (!id || !recordingUrl.trim()) {
      window.alert("Recording URL is required.");
      return;
    }

    if (!selectedSessionId) {
      window.alert("Please select a session first.");
      return;
    }

    if (!isValidUrl(recordingUrl.trim())) {
      window.alert("Please enter a valid URL starting with http or https.");
      return;
    }

    setIsSavingRecording(true);
    try {
      const response = await ClassService.addClassRecording(id, {
        name: recordingName.trim() || undefined,
        url: recordingUrl.trim(),
        sessionId: selectedSessionId,
      });

      if (response.message && response.message.toLowerCase().includes("already exists")) {
        window.alert("This recording already exists for this class.");
      } else {
        setRecordingName("");
        setRecordingUrl("");
      }
      await fetchData();
    } catch (error: any) {
      window.alert(error?.response?.data?.message || "Failed to add recording.");
    } finally {
      setIsSavingRecording(false);
    }
  };

  const handleDeleteRecording = async (recordingId: string) => {
    if (!id) return;
    const ok = window.confirm("Delete this recording from the class?");
    if (!ok) return;

    try {
      await ClassService.deleteClassRecording(id, recordingId);
      await fetchData();
    } catch (error: any) {
      window.alert(error?.response?.data?.message || "Failed to delete recording.");
    }
  };

  const handleStartEditRecording = (recording: ClassRecording) => {
    setEditingRecordingId(recording._id);
    setEditRecordingName(recording.name || "");
  };

  const handleCancelEditRecording = () => {
    setEditingRecordingId("");
    setEditRecordingName("");
  };

  const handleSaveRecordingName = async (recordingId: string) => {
    if (!id) return;
    const trimmed = editRecordingName.trim();
    if (!trimmed) {
      window.alert("Recording name is required.");
      return;
    }

    setIsUpdatingRecording(true);
    try {
      await ClassService.updateClassRecording(id, recordingId, { name: trimmed });
      await fetchData();
      setEditingRecordingId("");
      setEditRecordingName("");
    } catch (error: any) {
      window.alert(error?.response?.data?.message || "Failed to update recording name.");
    } finally {
      setIsUpdatingRecording(false);
    }
  };

  // --- RENDER HELPERS ---
  if (isLoading) return <LoadingState />;
  if (!classData) return <NotFoundState onBack={() => navigate("/admin/classes")} />;

  const sessions = (classData as any).sessions || [];
  const nextSession = (classData as any).timeSchedules?.[0];

  // Helper to determine type color
  const getTypeColor = (type: string) => {
      switch(type) {
          case 'revision': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
          case 'paper': return 'bg-orange-100 text-orange-700 border-orange-200';
          default: return 'bg-brand-aliceBlue text-brand-cerulean border-brand-cerulean/20';
      }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 p-4 sm:p-6 pb-24 sm:pb-24 animate-in fade-in duration-500">
      
      {/* HEADER */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-2 w-full sm:w-auto">
          <button 
            onClick={() => navigate("/admin/classes")} 
            className="flex items-center text-[10px] font-bold text-gray-400 hover:text-brand-cerulean transition-all uppercase tracking-widest"
          >
            <ArrowLeftIcon className="w-3 h-3 mr-2 stroke-[3px]" /> Curriculum
          </button>
          
          <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase border ${getTypeColor(classData.type || 'theory')}`}>
                      {classData.type || 'Theory'}
                  </span>
                  {classData.level && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase border bg-gray-50 text-gray-500 border-gray-200">
                          {classData.level}
                      </span>
                  )}
              </div>
              <h1 className="text-xl sm:text-2xl font-semibold text-brand-prussian tracking-tight truncate max-w-[500px]">
                {classData.name}
              </h1>
          </div>
        </div>

        <button 
          onClick={() => navigate(`/admin/classes/edit/${id}`)} 
          className="w-full sm:w-auto bg-white border border-gray-200 text-brand-prussian px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-all shadow-sm flex items-center justify-center gap-2"
        >
           Edit Module
        </button>
      </header>

      {/* --- LINKED MODULES SECTION (New) --- */}
      {(classData.parentTheoryClass || classData.linkedRevisionClass || classData.linkedPaperClass) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* If this is a Child, show Parent */}
              {classData.parentTheoryClass && (
                  <div 
                      onClick={() => navigate(`/admin/classes/view/${(classData.parentTheoryClass as any)._id}`)}
                      className="group cursor-pointer bg-blue-50/50 border border-blue-100 p-4 rounded-2xl flex items-center justify-between hover:border-blue-300 transition-all"
                  >
                      <div className="flex items-center gap-3">
                          <div className="p-2 bg-white rounded-lg text-blue-500 shadow-sm"><LinkIcon className="w-4 h-4"/></div>
                          <div>
                              <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">Parent Theory Class</p>
                              <p className="text-sm font-bold text-brand-prussian">{(classData.parentTheoryClass as any).name}</p>
                          </div>
                      </div>
                      <ArrowTopRightOnSquareIcon className="w-4 h-4 text-gray-400 group-hover:text-blue-500" />
                  </div>
              )}

              {/* If this is a Parent, show Children */}
              {classData.linkedRevisionClass && (
                  <div 
                      onClick={() => navigate(`/admin/classes/view/${(classData.linkedRevisionClass as any)._id}`)}
                      className="group cursor-pointer bg-indigo-50/50 border border-indigo-100 p-4 rounded-2xl flex items-center justify-between hover:border-indigo-300 transition-all"
                  >
                      <div className="flex items-center gap-3">
                          <div className="p-2 bg-white rounded-lg text-indigo-500 shadow-sm"><AcademicCapIcon className="w-4 h-4"/></div>
                          <div>
                              <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Linked Revision</p>
                              <p className="text-sm font-bold text-brand-prussian">{(classData.linkedRevisionClass as any).name}</p>
                          </div>
                      </div>
                      <ArrowTopRightOnSquareIcon className="w-4 h-4 text-gray-400 group-hover:text-indigo-500" />
                  </div>
              )}

              {classData.linkedPaperClass && (
                  <div 
                      onClick={() => navigate(`/admin/classes/view/${(classData.linkedPaperClass as any)._id}`)}
                      className="group cursor-pointer bg-orange-50/50 border border-orange-100 p-4 rounded-2xl flex items-center justify-between hover:border-orange-300 transition-all"
                  >
                      <div className="flex items-center gap-3">
                          <div className="p-2 bg-white rounded-lg text-orange-500 shadow-sm"><AcademicCapIcon className="w-4 h-4"/></div>
                          <div>
                              <p className="text-[10px] font-bold text-orange-400 uppercase tracking-wider">Linked Paper</p>
                              <p className="text-sm font-bold text-brand-prussian">{(classData.linkedPaperClass as any).name}</p>
                          </div>
                      </div>
                      <ArrowTopRightOnSquareIcon className="w-4 h-4 text-gray-400 group-hover:text-orange-500" />
                  </div>
              )}
          </div>
      )}


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
            active={activeTab === "attendance"} 
            onClick={handleAttendanceTabClick} 
            label="Attendance" 
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
              <div className="bg-white border border-brand-aliceBlue rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Recording Manager</p>
                  <h3 className="text-sm sm:text-base font-bold text-brand-prussian mt-1">Add class recordings</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr_auto] gap-3">
                  <select
                    value={selectedSessionId}
                    onChange={(e) => setSelectedSessionId(e.target.value)}
                    className="w-full bg-brand-aliceBlue/30 border border-brand-aliceBlue rounded-xl px-3 py-2.5 text-sm font-medium outline-none focus:ring-2 focus:ring-brand-cerulean/20"
                  >
                    <option value="">Select Session</option>
                    {sessions.map((session: any) => (
                      <option key={session._id} value={session._id}>
                        Session {session.index} - {moment(session.startAt).format("DD MMM YYYY")}
                      </option>
                    ))}
                  </select>
                  <input
                    value={recordingName}
                    onChange={(e) => setRecordingName(e.target.value)}
                    placeholder="Recording name (optional)"
                    className="w-full bg-brand-aliceBlue/30 border border-brand-aliceBlue rounded-xl px-3 py-2.5 text-sm font-medium outline-none focus:ring-2 focus:ring-brand-cerulean/20"
                  />
                  <input
                    value={recordingUrl}
                    onChange={(e) => setRecordingUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full bg-brand-aliceBlue/30 border border-brand-aliceBlue rounded-xl px-3 py-2.5 text-sm font-medium outline-none focus:ring-2 focus:ring-brand-cerulean/20"
                  />
                  <button
                    onClick={handleAddRecording}
                    disabled={isSavingRecording}
                    className="px-4 py-2.5 rounded-xl bg-brand-cerulean text-white text-xs font-bold uppercase tracking-wider hover:bg-brand-prussian transition-colors disabled:opacity-60"
                  >
                    {isSavingRecording ? "Saving..." : "Add"}
                  </button>
                </div>

                <div className="space-y-2">
                  {recordings.length === 0 ? (
                    <p className="text-xs text-gray-400 font-medium">No recordings added for this class yet.</p>
                  ) : (
                    recordings.map((recording) => (
                      <div key={recording._id} className="border border-brand-aliceBlue rounded-xl px-3 py-3 flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
                        <div className="min-w-0">
                          {editingRecordingId === recording._id ? (
                            <input
                              value={editRecordingName}
                              onChange={(e) => setEditRecordingName(e.target.value)}
                              className="w-full bg-brand-aliceBlue/30 border border-brand-aliceBlue rounded-lg px-2.5 py-1.5 text-sm font-semibold text-brand-prussian outline-none focus:ring-2 focus:ring-brand-cerulean/20"
                            />
                          ) : (
                            <p className="text-sm font-semibold text-brand-prussian truncate">{recording.name}</p>
                          )}
                          {typeof recording.session === "object" && recording.session?.index && (
                            <p className="text-[11px] text-gray-400 font-semibold mb-1">Session {recording.session.index}</p>
                          )}
                          <a
                            href={recording.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-brand-cerulean hover:underline break-all"
                          >
                            {recording.url}
                          </a>
                        </div>
                        <div className="self-start sm:self-auto flex items-center gap-2">
                          {editingRecordingId === recording._id ? (
                            <>
                              <button
                                onClick={() => handleSaveRecordingName(recording._id)}
                                disabled={isUpdatingRecording}
                                className="px-3 py-2 rounded-lg border border-emerald-100 text-emerald-600 hover:bg-emerald-50 text-xs font-bold uppercase tracking-wide disabled:opacity-60"
                              >
                                {isUpdatingRecording ? "Saving" : "Save"}
                              </button>
                              <button
                                onClick={handleCancelEditRecording}
                                disabled={isUpdatingRecording}
                                className="px-3 py-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 text-xs font-bold uppercase tracking-wide"
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => handleStartEditRecording(recording)}
                              className="px-3 py-2 rounded-lg border border-blue-100 text-blue-600 hover:bg-blue-50 text-xs font-bold uppercase tracking-wide"
                            >
                              Edit
                            </button>
                          )}

                          <button
                            onClick={() => handleDeleteRecording(recording._id)}
                            className="px-3 py-2 rounded-lg border border-red-100 text-red-600 hover:bg-red-50 text-xs font-bold uppercase tracking-wide"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

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
          ) : activeTab === "attendance" ? (
            <motion.div
              key="attendance"
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {isLoadingAttendance ? (
                <div className="flex justify-center py-12">
                  <ArrowPathIcon className="w-6 h-6 text-brand-cerulean animate-spin" />
                </div>
              ) : attendanceSummary && attendanceSummary.sessionSummary && attendanceSummary.sessionSummary.length > 0 ? (
                <>
                  {/* MANUAL ATTENDANCE MARKING */}
                  {/* <div className="bg-white border border-brand-aliceBlue rounded-2xl p-4 shadow-sm space-y-3">
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Manual Mark Attendance</p>
                      <p className="text-xs text-gray-500 mt-0.5">If Zoom webhook missed a student, manually add them here</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-3">
                      <select
                        value={selectedSessionForAttendance}
                        onChange={(e) => setSelectedSessionForAttendance(e.target.value)}
                        className="w-full bg-brand-aliceBlue/30 border border-brand-aliceBlue rounded-xl px-3 py-2.5 text-sm font-medium outline-none focus:ring-2 focus:ring-brand-cerulean/20"
                      >
                        <option value="">Select Session</option>
                        {attendanceSummary.sessionSummary.map((session: any) => (
                          <option key={session._id} value={session._id}>
                            Session {session.index} - {moment(session.startAt).format("DD MMM YYYY")}
                          </option>
                        ))}
                      </select>

                      <select
                        value={selectedStudentForAttendance}
                        onChange={(e) => setSelectedStudentForAttendance(e.target.value)}
                        disabled={!selectedSessionForAttendance}
                        className="w-full bg-brand-aliceBlue/30 border border-brand-aliceBlue rounded-xl px-3 py-2.5 text-sm font-medium outline-none focus:ring-2 focus:ring-brand-cerulean/20 disabled:opacity-50"
                      >
                        <option value="">Select Student</option>
                        {selectedSessionForAttendance && classData && classData.students
                          ? (classData.students as any[]).map((student: any) => {
                              // Check if already marked present
                              const session = attendanceSummary.sessionSummary.find(
                                (s: any) => s._id === selectedSessionForAttendance
                              );
                              const alreadyPresent = session?.attendance?.some(
                                (att: any) => att.student._id === student._id
                              );
                              
                              return !alreadyPresent ? (
                                <option key={student._id} value={student._id}>
                                  {student.firstName} {student.lastName}
                                </option>
                              ) : null;
                            })
                          : null}
                      </select>

                      <button
                        onClick={handleMarkAttendance}
                        disabled={isMarkingAttendance || !selectedSessionForAttendance || !selectedStudentForAttendance}
                        className="px-4 py-2.5 rounded-xl bg-brand-cerulean text-white text-xs font-bold uppercase tracking-wider hover:bg-brand-prussian transition-colors disabled:opacity-60"
                      >
                        {isMarkingAttendance ? "Marking..." : "Mark Present"}
                      </button>
                    </div>
                  </div> */}

                  {/* ATTENDANCE OVERVIEW */}
                  <div className="bg-gradient-to-r from-brand-cerulean/10 to-brand-prussian/10 border border-brand-cerulean/20 rounded-2xl p-4">
                    <div className="flex items-center gap-3">
                      <UserGroupIcon className="w-5 h-5 text-brand-cerulean" />
                      <div>
                        <p className="text-[10px] font-bold text-brand-cerulean uppercase tracking-widest">Attendance Overview</p>
                        <p className="text-sm font-semibold text-brand-prussian">
                          {attendanceSummary.totalSessions} Sessions with {attendanceSummary.sessionSummary.reduce((acc: number, sess: any) => acc + sess.attendanceCount, 0)} Total Attendances
                        </p>
                      </div>
                    </div>
                  </div>

                  {attendanceSummary.sessionSummary.map((session: any) => (
                    <div key={session._id} className="bg-white border border-brand-aliceBlue rounded-2xl overflow-hidden shadow-sm">
                      {/* Session Header */}
                      <div className="bg-gradient-to-r from-brand-aliceBlue/30 to-transparent p-4 flex items-center justify-between border-b border-brand-aliceBlue">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-brand-cerulean text-white flex items-center justify-center text-sm font-bold">
                            {session.index}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-brand-prussian">{moment(session.startAt).format("DD MMM YYYY")}</p>
                            <p className="text-xs text-gray-400">
                              {moment(session.startAt).format("hh:mm A")} - {moment(session.endAt).format("hh:mm A")}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-brand-cerulean">{session.attendanceCount}</p>
                          <p className="text-[10px] text-gray-400 font-medium">Attended</p>
                        </div>
                      </div>

                      {/* Attendance List */}
                      {session.attendance && session.attendance.length > 0 ? (
                        <div className="divide-y divide-brand-aliceBlue">
                          {session.attendance.map((record: any) => (
                            <div key={record._id} className="p-4 flex items-center justify-between hover:bg-brand-aliceBlue/20 transition-colors">
                              <div className="flex items-center gap-3">
                                {record.student?.avatar ? (
                                  <img 
                                    src={record.student.avatar} 
                                    alt={record.student.firstName} 
                                    className="w-10 h-10 rounded-full object-cover border border-brand-aliceBlue"
                                  />
                                ) : (
                                  <div className="w-10 h-10 rounded-full bg-brand-aliceBlue flex items-center justify-center text-sm font-bold text-brand-cerulean">
                                    {record.student?.firstName?.charAt(0)}{record.student?.lastName?.charAt(0)}
                                  </div>
                                )}
                                <div className="min-w-0">
                                  <p className="text-sm font-semibold text-brand-prussian truncate">
                                    {record.student?.firstName} {record.student?.lastName}
                                  </p>
                                  <p className="text-xs text-gray-400 truncate">{record.student?.email}</p>
                                </div>
                              </div>
                              <div className="text-right flex items-center gap-3">
                                <div>
                                  <p className="text-xs font-bold text-brand-cerulean">{record.durationMinutes} min</p>
                                  <p className="text-[10px] text-gray-400">
                                    {moment(record.joinedAt).format("hh:mm A")}
                                  </p>
                                </div>
                                <CheckCircleIcon className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-6 text-center">
                          <p className="text-sm text-gray-400 font-medium">No attendance records for this session.</p>
                        </div>
                      )}
                    </div>
                  ))}
                </>
              ) : (
                <div className="p-10 text-center border-2 border-dashed border-brand-aliceBlue rounded-xl">
                  <p className="text-gray-400 text-sm font-medium">No attendance data available yet.</p>
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