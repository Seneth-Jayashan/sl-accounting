import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import moment from "moment";
import { motion, AnimatePresence } from "framer-motion";

// Icons
import {
  ChevronLeftIcon,
  UserGroupIcon,
  AcademicCapIcon,
  ClockIcon,
  ArrowPathIcon,
  VideoCameraIcon,
  TrashIcon,
  XMarkIcon,
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
      setAttendanceSummary(null);
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

  return (
    <div className="max-w-6xl mx-auto space-y-6 p-4 sm:p-6 pb-24 w-full overflow-x-hidden">

      {/* --- HEADER --- */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-start md:items-center gap-4">
          <button
            onClick={() => navigate("/admin/classes")}
            className="w-8 h-8 rounded-full bg-[#eef2f6] text-[#0d4b5b] flex items-center justify-center hover:bg-[#e2e8f0] transition-colors shrink-0 mt-1 md:mt-0"
          >
            <ChevronLeftIcon className="w-4 h-4 stroke-[3]" />
          </button>
          <div>
            <h1 className="text-xl md:text-[22px] font-bold text-gray-900 tracking-tight leading-tight">
              {classData.name}
            </h1>
            <div className="flex gap-2 mt-2">
              <span className="px-2.5 py-0.5 border border-gray-200 rounded text-[11px] font-bold text-gray-500 bg-white capitalize tracking-wide">
                {classData.type || 'Theory'}
              </span>
              {classData.level && (
                <span className="px-2.5 py-0.5 border border-gray-200 rounded text-[11px] font-bold text-gray-500 bg-white capitalize tracking-wide">
                  {classData.level}
                </span>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={() => navigate(`/admin/classes/edit/${id}`)}
          className="w-full md:w-auto bg-[#0d4b5b] text-white px-5 py-2.5 rounded-lg text-sm font-bold shadow-sm hover:bg-[#093946] transition-colors shrink-0"
        >
          Edit Module
        </button>
      </header>

      {/* --- STAT CARDS --- */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-5">
        <DetailCard
          icon={<AcademicCapIcon className="w-5 h-5 stroke-[2]" />}
          label="Intake"
          value={(classData.batch as any)?.name || "Independent"}
        />
        <DetailCard
          icon={<ClockIcon className="w-5 h-5 stroke-[2]" />}
          label="Timing"
          value={nextSession ? `${moment().day(nextSession.day).format("dddd")} ${nextSession.startTime}` : "TBA"}
        />
        <DetailCard
          icon={<UserGroupIcon className="w-5 h-5 stroke-[2]" />}
          label="Enrolled"
          value={`${(classData as any).studentCount || 0} Students`}
        />
      </div>

      {/* --- LINKED MODULES (Styled to match new theme without breaking layout) --- */}
      {(classData.parentTheoryClass || classData.linkedRevisionClass || classData.linkedPaperClass) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {classData.parentTheoryClass && (
            <div onClick={() => navigate(`/admin/classes/view/${(classData.parentTheoryClass as any)._id}`)} className="group cursor-pointer bg-white border border-blue-100 p-4 rounded-2xl flex items-center justify-between hover:border-blue-300 transition-all shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-50 rounded-xl text-blue-600"><LinkIcon className="w-4 h-4" /></div>
                <div>
                  <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-0.5">Parent Theory Class</p>
                  <p className="text-[13px] font-bold text-gray-900">{(classData.parentTheoryClass as any).name}</p>
                </div>
              </div>
              <ArrowTopRightOnSquareIcon className="w-4 h-4 text-gray-400 group-hover:text-blue-500" />
            </div>
          )}
          {classData.linkedRevisionClass && (
            <div onClick={() => navigate(`/admin/classes/view/${(classData.linkedRevisionClass as any)._id}`)} className="group cursor-pointer bg-white border border-indigo-100 p-4 rounded-2xl flex items-center justify-between hover:border-indigo-300 transition-all shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-600"><AcademicCapIcon className="w-4 h-4" /></div>
                <div>
                  <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-0.5">Linked Revision</p>
                  <p className="text-[13px] font-bold text-gray-900">{(classData.linkedRevisionClass as any).name}</p>
                </div>
              </div>
              <ArrowTopRightOnSquareIcon className="w-4 h-4 text-gray-400 group-hover:text-indigo-500" />
            </div>
          )}
          {classData.linkedPaperClass && (
            <div onClick={() => navigate(`/admin/classes/view/${(classData.linkedPaperClass as any)._id}`)} className="group cursor-pointer bg-white border border-orange-100 p-4 rounded-2xl flex items-center justify-between hover:border-orange-300 transition-all shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-orange-50 rounded-xl text-orange-600"><AcademicCapIcon className="w-4 h-4" /></div>
                <div>
                  <p className="text-[10px] font-bold text-orange-400 uppercase tracking-widest mb-0.5">Linked Paper</p>
                  <p className="text-[13px] font-bold text-gray-900">{(classData.linkedPaperClass as any).name}</p>
                </div>
              </div>
              <ArrowTopRightOnSquareIcon className="w-4 h-4 text-gray-400 group-hover:text-orange-500" />
            </div>
          )}
        </div>
      )}

      {/* --- TABS --- */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-1">
          <TabTrigger active={activeTab === "sessions"} onClick={() => setActiveTab("sessions")} label="Session Controls" />
          <TabTrigger active={activeTab === "attendance"} onClick={handleAttendanceTabClick} label="Attendance" />
          <TabTrigger active={activeTab === "students"} onClick={() => setActiveTab("students")} label="Enrollment" />
        </div>

        <AnimatePresence mode="wait">
          {activeTab === "sessions" ? (
            <motion.div
              key="sessions"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >

              {/* --- RECORDING MANAGER --- */}
              <div className="bg-white border border-gray-100 rounded-2xl p-6 md:p-8 shadow-sm">
                <h2 className="text-[13px] font-black text-[#0d4b5b] uppercase tracking-widest mb-6">Recording Manager</h2>
                <p className="text-[13px] font-bold text-gray-900 mb-3">Add Class Recordings</p>

                <div className="grid grid-cols-1 sm:grid-cols-[1.5fr_2fr_3fr_auto] gap-3 mb-6">
                  <select
                    value={selectedSessionId}
                    onChange={(e) => setSelectedSessionId(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-[13px] text-gray-700 font-medium outline-none focus:border-[#0d4b5b]"
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
                    placeholder="Recording Name (Optional)"
                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-[13px] text-gray-700 font-medium outline-none focus:border-[#0d4b5b]"
                  />
                  <input
                    value={recordingUrl}
                    onChange={(e) => setRecordingUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-[13px] text-gray-700 font-medium outline-none focus:border-[#0d4b5b]"
                  />
                  <button
                    onClick={handleAddRecording}
                    disabled={isSavingRecording}
                    className="px-8 py-2.5 rounded-lg bg-[#0d4b5b] text-white text-[13px] font-bold hover:bg-[#093946] transition-colors disabled:opacity-60"
                  >
                    {isSavingRecording ? "Saving..." : "Add"}
                  </button>
                </div>

                <div className="space-y-3">
                  {recordings.length === 0 ? (
                    <p className="text-[13px] text-gray-400 font-medium">No recordings added for this class yet.</p>
                  ) : (
                    recordings.map((recording) => (
                      <div key={recording._id} className="border border-gray-100 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-4 sm:justify-between bg-white">
                        <div className="min-w-0">
                          {editingRecordingId === recording._id ? (
                            <input
                              value={editRecordingName}
                              onChange={(e) => setEditRecordingName(e.target.value)}
                              className="w-full bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-[13px] font-bold text-gray-900 outline-none focus:border-[#0d4b5b] mb-2"
                            />
                          ) : (
                            <p className="text-[14px] font-bold text-gray-900 truncate mb-1">{recording.name}</p>
                          )}

                          {typeof recording.session === "object" && recording.session?.index && (
                            <p className="text-[11px] text-gray-400 font-bold mb-1.5 uppercase">Session {formatCount(recording.session.index)}</p>
                          )}
                          <a
                            href={recording.url} target="_blank" rel="noreferrer"
                            className="text-[12px] text-blue-500 hover:underline break-all font-medium"
                          >
                            {recording.url}
                          </a>
                        </div>
                        <div className="self-start sm:self-auto flex items-center gap-2">
                          {editingRecordingId === recording._id ? (
                            <>
                              <button onClick={() => handleSaveRecordingName(recording._id)} disabled={isUpdatingRecording} className="px-4 py-1.5 rounded-lg border border-emerald-400 text-emerald-600 hover:bg-emerald-50 text-[12px] font-bold disabled:opacity-60">
                                {isUpdatingRecording ? "Saving" : "Save"}
                              </button>
                              <button onClick={handleCancelEditRecording} disabled={isUpdatingRecording} className="px-4 py-1.5 rounded-lg border border-gray-300 text-gray-500 hover:bg-gray-50 text-[12px] font-bold">
                                Cancel
                              </button>
                            </>
                          ) : (
                            <button onClick={() => handleStartEditRecording(recording)} className="px-5 py-1.5 rounded-lg border border-blue-400 text-blue-500 hover:bg-blue-50 text-[12px] font-bold">
                              Edit
                            </button>
                          )}

                          <button onClick={() => handleDeleteRecording(recording._id)} className="px-4 py-1.5 rounded-lg border border-red-400 text-red-500 hover:bg-red-50 text-[12px] font-bold">
                            Remove
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* --- SESSIONS LIST --- */}
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
                <div className="p-10 text-center border-2 border-dashed border-gray-200 rounded-2xl">
                  <p className="text-gray-400 text-sm font-medium">No sessions scheduled yet.</p>
                </div>
              )}
            </motion.div>
          ) : activeTab === "attendance" ? (
            <motion.div
              key="attendance"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {isLoadingAttendance ? (
                <div className="flex justify-center py-12">
                  <ArrowPathIcon className="w-6 h-6 text-[#0d4b5b] animate-spin" />
                </div>
              ) : attendanceSummary && attendanceSummary.sessionSummary && attendanceSummary.sessionSummary.length > 0 ? (
                <>
                  <div className="bg-[#eef2f6] border border-[#dce5ed] rounded-2xl p-5">
                    <div className="flex items-center gap-3">
                      <UserGroupIcon className="w-6 h-6 text-[#0d4b5b]" />
                      <div>
                        <p className="text-[11px] font-black text-[#0d4b5b] uppercase tracking-widest mb-0.5">Attendance Overview</p>
                        <p className="text-[14px] font-bold text-gray-900">
                          {attendanceSummary.totalSessions} Sessions • {attendanceSummary.sessionSummary.reduce((acc: number, sess: any) => acc + sess.attendanceCount, 0)} Total Attendances
                        </p>
                      </div>
                    </div>
                  </div>

                  {attendanceSummary.sessionSummary.map((session: any) => (
                    <div key={session._id} className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                      <div className="bg-gray-50/50 p-4 flex items-center justify-between border-b border-gray-100">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-[#eef2f6] text-[#0d4b5b] flex items-center justify-center text-[13px] font-bold">
                            {formatCount(session.index)}
                          </div>
                          <div>
                            <p className="text-[13px] font-bold text-gray-900">{moment(session.startAt).format("DD MMM YYYY")}</p>
                            <p className="text-[11px] text-gray-500 font-medium mt-0.5">
                              {moment(session.startAt).format("hh:mm A")} - {moment(session.endAt).format("hh:mm A")}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[15px] font-black text-[#0d4b5b]">{session.attendanceCount}</p>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Attended</p>
                        </div>
                      </div>

                      {session.attendance && session.attendance.length > 0 ? (
                        <div className="divide-y divide-gray-50">
                          {session.attendance.map((record: any) => (
                            <div key={record._id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                              <div className="flex items-center gap-3">
                                {record.student?.avatar ? (
                                  <img
                                    src={record.student.avatar}
                                    alt={record.student.firstName}
                                    className="w-10 h-10 rounded-full object-cover border border-gray-100"
                                  />
                                ) : (
                                  <div className="w-10 h-10 rounded-full bg-[#eef2f6] flex items-center justify-center text-xs font-bold text-[#0d4b5b]">
                                    {record.student?.firstName?.charAt(0)}{record.student?.lastName?.charAt(0)}
                                  </div>
                                )}
                                <div className="min-w-0">
                                  <p className="text-[13px] font-bold text-gray-900 truncate">
                                    {record.student?.firstName} {record.student?.lastName}
                                  </p>
                                  <p className="text-[11px] text-gray-500 truncate mt-0.5">{record.student?.email}</p>
                                </div>
                              </div>
                              <div className="text-right flex items-center gap-4">
                                <div>
                                  <p className="text-[11px] font-bold text-[#0d4b5b]">{record.durationMinutes} min</p>
                                  <p className="text-[10px] text-gray-400 font-medium mt-0.5">
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
                          <p className="text-[12px] text-gray-400 font-medium">No attendance records for this session.</p>
                        </div>
                      )}
                    </div>
                  ))}
                </>
              ) : (
                <div className="p-10 text-center border-2 border-dashed border-gray-200 rounded-2xl">
                  <p className="text-gray-400 text-sm font-medium">No attendance data available yet.</p>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="students"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            >
              <StudentEnrollmentTab classId={id!} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* --- CANCELLATION MODAL --- */}
      <AnimatePresence>
        {cancelModal.isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => !isProcessing && setCancelModal({ isOpen: false, sessionId: null })}
              className="absolute inset-0 bg-[#0d4b5b]/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl p-6 w-full max-w-md relative z-10 shadow-xl border border-gray-100"
            >
              <div className="flex items-center gap-2 mb-2 text-gray-900">
                <ExclamationTriangleIcon className="w-5 h-5 text-orange-500" />
                <h2 className="text-lg font-bold">Cancel Session</h2>
              </div>
              <p className="text-[13px] text-gray-500 mb-5 font-medium leading-relaxed">
                This will mark the session as cancelled for all students. They will receive a notification if enabled.
              </p>

              <div className="space-y-1.5 mb-6">
                <label className="text-[12px] font-bold text-gray-700">Reason for cancellation</label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="E.g. Technical maintenance, Instructor unavailable..."
                  className="w-full bg-white border border-gray-200 rounded-xl p-3 text-[13px] font-medium focus:ring-2 focus:ring-[#0d4b5b]/20 focus:border-[#0d4b5b] outline-none transition-all h-24 resize-none"
                />
              </div>

              <div className="flex gap-3">
                <button
                  disabled={isProcessing}
                  onClick={() => setCancelModal({ isOpen: false, sessionId: null })}
                  className="flex-1 py-2.5 text-[13px] font-bold text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  Dismiss
                </button>
                <button
                  disabled={isProcessing || !cancelReason.trim()}
                  onClick={handleCancelConfirm}
                  className="flex-[2] py-2.5 bg-red-500 text-white rounded-xl text-[13px] font-bold hover:bg-red-600 transition-colors shadow-sm disabled:opacity-60"
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

// Helper for 2-digit format
const formatCount = (num: number) => String(num).padStart(2, '0');

const SessionRow = ({ session, onCancel, onDelete }: { session: any, onCancel: () => void, onDelete: () => void }) => {
  const isPast = moment(session.startAt).isBefore(moment());
  const isCancelled = session.isCancelled;
  const hasLink = session.zoomStartUrl && isValidUrl(session.zoomStartUrl);

  return (
    <div className={`bg-white border ${isCancelled ? 'border-red-100 bg-red-50/20' : 'border-gray-100'} rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all shadow-sm`}>
      <div className="flex items-center gap-4 w-full sm:w-auto">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 ${isCancelled ? 'bg-white text-red-500 border border-red-100' : isPast ? 'bg-[#f8f9fa] text-gray-400' : 'bg-[#eef2f6] text-[#0d4b5b]'}`}>
          {formatCount(session.index)}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-[14px] font-bold text-gray-900">{moment(session.startAt).format("DD MMM YYYY")}</p>
            {isCancelled && <span className="text-[10px] font-bold border border-red-200 text-red-500 px-2 py-0.5 rounded-full uppercase">Cancelled</span>}
            {isPast && !isCancelled && <span className="text-[10px] font-bold border border-gray-200 text-gray-400 px-2 py-0.5 rounded-full uppercase">Completed</span>}
          </div>
          <p className="text-[12px] text-gray-500 font-medium">
            {moment(session.startAt).format("hh:mm A")} - {moment(session.endAt).format("hh:mm A")}
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto mt-1 sm:mt-0">
        {!isCancelled && !isPast && hasLink && (
          <a
            href={session.zoomStartUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-[#0d4b5b] text-white px-5 py-2.5 sm:py-2 rounded-lg text-[12px] font-bold transition-all shadow-sm active:scale-95"
          >
            Launch
          </a>
        )}

        <div className="flex gap-2 w-full sm:w-auto">
          {!isCancelled && !isPast && (
            <button
              onClick={onCancel}
              className="flex-1 sm:flex-none p-2 text-gray-400 hover:text-red-500 hover:border-red-200 rounded-lg transition-all border border-gray-200 flex justify-center"
              title="Cancel Meeting"
            >
              <XMarkIcon className="w-5 h-5 stroke-[2]" />
            </button>
          )}

          {isCancelled && (
            <div className="flex-1 sm:flex-none text-[11px] font-medium text-red-500 italic px-3 py-2 border-l-2 border-red-200 bg-red-50/50 rounded-r-lg truncate max-w-[200px]">
              "{session.cancellationReason || "No reason specified"}"
            </div>
          )}

          <button
            onClick={onDelete}
            className="flex-1 sm:flex-none p-2 text-gray-400 hover:text-red-500 hover:border-red-200 rounded-lg transition-all border border-gray-200 flex justify-center"
            title="Delete Permanent"
          >
            <TrashIcon className="w-5 h-5 stroke-[2]" />
          </button>
        </div>
      </div>
    </div>
  );
};

const DetailCard = ({ icon, label, value }: { icon: any, label: string, value: string }) => (
  <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
    <div className="p-3 bg-[#eef2f6] rounded-xl text-[#0d4b5b] shrink-0">{icon}</div>
    <div className="min-w-0 overflow-hidden">
      <p className="text-[11px] font-bold text-gray-400 mb-0.5 truncate">{label}</p>
      <p className="text-[13px] font-bold text-gray-900 truncate">{value}</p>
    </div>
  </div>
);

const TabTrigger = ({ active, onClick, label }: { active: boolean, onClick: () => void, label: string }) => (
  <button
    onClick={onClick}
    className={`px-5 py-2 rounded-full text-[12px] font-bold transition-all whitespace-nowrap ${active ? "bg-white text-gray-800 shadow-sm border border-gray-100" : "text-gray-500 hover:text-gray-800 bg-transparent"
      }`}
  >
    {label}
  </button>
);

const LoadingState = () => (
  <div className="flex h-[60vh] items-center justify-center flex-col gap-4">
    <ArrowPathIcon className="w-8 h-8 text-[#0d4b5b]/50 animate-spin" />
    <span className="text-[11px] font-bold text-[#0d4b5b] uppercase tracking-widest animate-pulse">Loading Details...</span>
  </div>
);

const NotFoundState = ({ onBack }: { onBack: () => void }) => (
  <div className="text-center py-32 space-y-4">
    <div className="text-6xl text-gray-200 font-black">404</div>
    <h2 className="text-xl font-bold text-gray-900">Record data unavailable</h2>
    <button onClick={onBack} className="bg-[#0d4b5b] text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-sm hover:bg-[#093946] transition-colors">
      Return to portal
    </button>
  </div>
);