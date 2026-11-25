import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import moment from "moment";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

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
  CheckCircleIcon,
  PencilSquareIcon,
  PlusIcon,
  FolderIcon,
  XMarkIcon,
  ChevronDownIcon,
  PlayCircleIcon,
} from "@heroicons/react/24/outline";

// Components
import StudentEnrollmentTab from "../../../components/admin/class/StudentEnrollmentTab";

// Services & Types
import ClassService, {
  type ClassData,
  type ClassRecording,
} from "../../../services/ClassService";
import SessionService from "../../../services/SessionService";
import AttendanceService from "../../../services/AttendanceService";

// --- SECURITY HELPER ---
const isValidUrl = (str: string) => {
  try {
    const url = new URL(str);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

// --- SKELETON LOADER ---
function ClassDetailSkeleton() {
  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-pulse pb-16">
      <div className="flex justify-between">
        <div className="h-9 w-36 bg-slate-200 rounded-xl" />
        <div className="h-9 w-32 bg-slate-200 rounded-xl" />
      </div>
      <div className="h-40 bg-white rounded-2xl border border-slate-100" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-white rounded-2xl border border-slate-100" />
        ))}
      </div>
      <div className="h-12 w-96 bg-white rounded-2xl border border-slate-100" />
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-white rounded-2xl border border-slate-100" />
        ))}
      </div>
    </div>
  );
}

// --- MAIN COMPONENT ---
export default function ViewClassPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Core State
  const [isLoading, setIsLoading] = useState(true);
  const [classData, setClassData] = useState<ClassData | null>(null);
  const [activeTab, setActiveTab] = useState<
    "students" | "sessions" | "recordings" | "attendance"
  >("sessions");

  // Attendance State
  const [attendanceSummary, setAttendanceSummary] = useState<any>(null);
  const [isLoadingAttendance, setIsLoadingAttendance] = useState(false);
  const [selectedSessionForAttendance, setSelectedSessionForAttendance] = useState("");
  const [selectedStudentForAttendance, setSelectedStudentForAttendance] = useState("");
  const [isMarkingAttendance, setIsMarkingAttendance] = useState(false);

  // Cancel Session Modal State
  const [cancelModal, setCancelModal] = useState<{
    isOpen: boolean;
    sessionId: string | null;
  }>({ isOpen: false, sessionId: null });
  const [cancelReason, setCancelReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Reusable Delete Confirmation Modal State
  const [confirmDialog, setConfirmDialog] = useState<{
    title: string;
    message: string;
    confirmLabel: string;
    onConfirm: () => Promise<void>;
  } | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);

  // Recordings State
  const [recordings, setRecordings] = useState<ClassRecording[]>([]);
  const [recordingName, setRecordingName] = useState("");
  const [recordingUrl, setRecordingUrl] = useState("");
  const [selectedSessionId, setSelectedSessionId] = useState("");
  const [isSavingRecording, setIsSavingRecording] = useState(false);
  const [editingRecordingId, setEditingRecordingId] = useState("");
  const [editRecordingName, setEditRecordingName] = useState("");
  const [isUpdatingRecording, setIsUpdatingRecording] = useState(false);

  // Categories State
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [selectedRecordingCategory, setSelectedRecordingCategory] = useState("");
  const [editSelectedRecordingCategory, setEditSelectedRecordingCategory] =
    useState("");

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
      toast.error("Failed to load class details.");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- ATTENDANCE HANDLERS ---
  const handleAttendanceTabClick = async () => {
    setActiveTab("attendance");
    if (!id || attendanceSummary) return;

    setIsLoadingAttendance(true);
    try {
      const data = await AttendanceService.getClassAttendanceSummary(id);
      setAttendanceSummary(data);
    } catch (err) {
      console.error("Failed to fetch attendance:", err);
      toast.error("Failed to load attendance data.");
    } finally {
      setIsLoadingAttendance(false);
    }
  };

  const handleMarkAttendance = async () => {
    if (!id || !selectedSessionForAttendance || !selectedStudentForAttendance) return;
    setIsMarkingAttendance(true);
    try {
      await AttendanceService.markAttendanceStart(
        selectedSessionForAttendance,
        selectedStudentForAttendance
      );
      const data = await AttendanceService.getClassAttendanceSummary(id);
      setAttendanceSummary(data);
      setSelectedStudentForAttendance("");
      toast.success("Attendance marked successfully.");
    } catch (err) {
      console.error("Failed to mark attendance:", err);
      toast.error("Failed to mark attendance.");
    } finally {
      setIsMarkingAttendance(false);
    }
  };

  // --- SESSION HANDLERS ---
  const handleCancelConfirm = async () => {
    if (!cancelModal.sessionId || !cancelReason.trim()) return;

    setIsProcessing(true);
    try {
      await SessionService.cancelSession(cancelModal.sessionId, cancelReason.trim());
      setClassData((prev) => {
        if (!prev) return null;
        const updatedSessions = (prev as any).sessions.map((s: any) =>
          s._id === cancelModal.sessionId
            ? { ...s, isCancelled: true, cancellationReason: cancelReason.trim() }
            : s
        );
        return { ...prev, sessions: updatedSessions };
      });
      setCancelModal({ isOpen: false, sessionId: null });
      setCancelReason("");
      toast.success("Session cancelled.");
    } catch {
      toast.error("Failed to cancel session.");
    } finally {
      setIsProcessing(false);
    }
  };

  const requestDeleteSession = (sessionId: string) => {
    setConfirmDialog({
      title: "Delete session permanently?",
      message:
        "This will remove the session record and its linked Zoom meeting. This action cannot be undone.",
      confirmLabel: "Delete Session",
      onConfirm: async () => {
        await SessionService.deleteSession(sessionId);
        setClassData((prev) => {
          if (!prev) return null;
          const updatedSessions = (prev as any).sessions.filter(
            (s: any) => s._id !== sessionId
          );
          return { ...prev, sessions: updatedSessions };
        });
        setAttendanceSummary(null);
        toast.success("Session deleted.");
      },
    });
  };

  // --- CATEGORY & RECORDING HANDLERS ---
  const handleAddCategory = async () => {
    if (!id || !newCategoryName.trim()) return;
    const trimmed = newCategoryName.trim();
    const existing = classData?.recordingCategories || [];
    if (existing.includes(trimmed)) {
      toast.error("Category already exists.");
      return;
    }

    setIsAddingCategory(true);
    try {
      await ClassService.updateClass(id, {
        recordingCategories: [...existing, trimmed],
      });
      setNewCategoryName("");
      toast.success(`Category "${trimmed}" added.`);
      await fetchData();
    } catch {
      toast.error("Failed to add category.");
    } finally {
      setIsAddingCategory(false);
    }
  };

  const requestDeleteCategory = (category: string) => {
    if (!id) return;
    setConfirmDialog({
      title: `Delete category "${category}"?`,
      message:
        "Existing recordings in this category will remain accessible under Uncategorized.",
      confirmLabel: "Delete Category",
      onConfirm: async () => {
        const existing = classData?.recordingCategories || [];
        const updated = existing.filter((c) => c !== category);
        await ClassService.updateClass(id, { recordingCategories: updated });
        toast.success("Category removed.");
        await fetchData();
      },
    });
  };

  const handleAddRecording = async () => {
    if (!id || !recordingUrl.trim()) {
      toast.error("Recording URL is required.");
      return;
    }
    if (!selectedSessionId) {
      toast.error("Please select a session first.");
      return;
    }
    if (!isValidUrl(recordingUrl.trim())) {
      toast.error("Please enter a valid URL starting with http:// or https://");
      return;
    }

    setIsSavingRecording(true);
    try {
      const response = await ClassService.addClassRecording(id, {
        name: recordingName.trim() || undefined,
        url: recordingUrl.trim(),
        sessionId: selectedSessionId,
        category: selectedRecordingCategory || undefined,
      });

      if (
        response.message &&
        response.message.toLowerCase().includes("already exists")
      ) {
        toast.error("This recording already exists for this class.");
      } else {
        setRecordingName("");
        setRecordingUrl("");
        toast.success("Recording added.");
      }
      await fetchData();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to add recording.");
    } finally {
      setIsSavingRecording(false);
    }
  };

  const requestDeleteRecording = (recording: ClassRecording) => {
    if (!id) return;
    setConfirmDialog({
      title: "Remove recording?",
      message: `Are you sure you want to remove "${recording.name}" from this class?`,
      confirmLabel: "Remove Recording",
      onConfirm: async () => {
        await ClassService.deleteClassRecording(id, recording._id);
        toast.success("Recording removed.");
        await fetchData();
      },
    });
  };

  const handleStartEditRecording = (recording: ClassRecording) => {
    setEditingRecordingId(recording._id);
    setEditRecordingName(recording.name || "");
    setEditSelectedRecordingCategory(recording.category || "");
  };

  const handleCancelEditRecording = () => {
    setEditingRecordingId("");
    setEditRecordingName("");
    setEditSelectedRecordingCategory("");
  };

  const handleSaveRecordingName = async (recordingId: string) => {
    if (!id) return;
    const trimmed = editRecordingName.trim();
    if (!trimmed) {
      toast.error("Recording name is required.");
      return;
    }

    setIsUpdatingRecording(true);
    try {
      await ClassService.updateClassRecording(id, recordingId, {
        name: trimmed,
        category: editSelectedRecordingCategory || undefined,
      });
      toast.success("Recording updated.");
      await fetchData();
      handleCancelEditRecording();
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Failed to update recording."
      );
    } finally {
      setIsUpdatingRecording(false);
    }
  };

  const executeConfirmDialog = async () => {
    if (!confirmDialog) return;
    setIsConfirming(true);
    try {
      await confirmDialog.onConfirm();
      setConfirmDialog(null);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Action failed.");
    } finally {
      setIsConfirming(false);
    }
  };

  // --- RENDER STATES ---
  if (isLoading && !classData) return <ClassDetailSkeleton />;
  if (!classData) return <NotFoundState onBack={() => navigate("/admin/classes")} />;

  const sessions = (classData as any).sessions || [];
  const hasLinkedModules = Boolean(
    classData.parentTheoryClass ||
    classData.linkedRevisionClass ||
    classData.linkedPaperClass
  );

  const getTypeBadgeStyle = (type: string) => {
    switch (type) {
      case "revision":
        return "bg-indigo-500/20 text-indigo-200 border-indigo-400/30";
      case "paper":
        return "bg-amber-500/20 text-amber-200 border-amber-400/30";
      default:
        return "bg-sky-500/20 text-sky-200 border-sky-400/30";
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 md:space-y-8 pb-24 md:pb-12">
      {/* TOP ACTION BAR */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={() => navigate("/admin/classes")}
          className="group inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-brand-prussian bg-white px-3.5 py-2 rounded-xl border border-slate-200/80 shadow-sm transition-all"
        >
          <ArrowLeftIcon className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
          Back to Curriculum
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchData}
            disabled={isLoading}
            title="Refresh class data"
            className="p-2 bg-white rounded-xl border border-slate-200/80 shadow-sm text-slate-600 hover:text-brand-cerulean hover:border-brand-cerulean/40 transition-colors disabled:opacity-50"
          >
            <ArrowPathIcon
              className={`w-4 h-4 ${isLoading ? "animate-spin text-brand-cerulean" : ""}`}
            />
          </button>

          <button
            onClick={() => navigate(`/admin/classes/edit/${id}`)}
            className="inline-flex items-center gap-2 bg-brand-prussian hover:bg-brand-cerulean text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-sm transition-all"
          >
            <PencilSquareIcon className="w-4 h-4" />
            <span>Edit Module</span>
          </button>
        </div>
      </div>

      {/* HERO CLASS HEADER */}
      <header className="relative overflow-hidden bg-gradient-to-br from-brand-prussian via-[#07273D] to-[#02121E] rounded-2xl p-6 md:p-8 text-white shadow-lg shadow-brand-prussian/15">
        <div className="pointer-events-none absolute -top-16 -right-16 w-56 h-56 rounded-full bg-brand-cerulean/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 left-1/3 w-48 h-48 rounded-full bg-brand-jasmine/10 blur-3xl" />

        <div className="relative z-10 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wide border ${getTypeBadgeStyle(
                classData.type || "theory"
              )}`}
            >
              {classData.type || "Theory"}
            </span>
            {classData.level && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wide bg-white/10 text-slate-200 border border-white/15">
                {classData.level} Level
              </span>
            )}
          </div>

          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
            {classData.name}
          </h1>

          {classData.description && (
            <p className="text-sm text-slate-300 max-w-3xl leading-relaxed line-clamp-2">
              {classData.description}
            </p>
          )}
        </div>
      </header>

      {/* LINKED MODULES */}
      {hasLinkedModules && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {classData.parentTheoryClass && (
            <button
              onClick={() =>
                navigate(`/admin/classes/view/${(classData.parentTheoryClass as any)._id}`)
              }
              className="group text-left bg-blue-50/60 border border-blue-200/70 p-4 rounded-2xl flex items-center justify-between hover:border-blue-400 transition-all"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2.5 bg-white rounded-xl text-blue-600 shadow-sm shrink-0">
                  <LinkIcon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                    Parent Theory Class
                  </p>
                  <p className="text-sm font-bold text-brand-prussian truncate">
                    {(classData.parentTheoryClass as any).name}
                  </p>
                </div>
              </div>
              <ArrowTopRightOnSquareIcon className="w-4 h-4 text-slate-400 group-hover:text-blue-600 shrink-0" />
            </button>
          )}

          {classData.linkedRevisionClass && (
            <button
              onClick={() =>
                navigate(`/admin/classes/view/${(classData.linkedRevisionClass as any)._id}`)
              }
              className="group text-left bg-indigo-50/60 border border-indigo-200/70 p-4 rounded-2xl flex items-center justify-between hover:border-indigo-400 transition-all"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2.5 bg-white rounded-xl text-indigo-600 shadow-sm shrink-0">
                  <AcademicCapIcon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">
                    Linked Revision
                  </p>
                  <p className="text-sm font-bold text-brand-prussian truncate">
                    {(classData.linkedRevisionClass as any).name}
                  </p>
                </div>
              </div>
              <ArrowTopRightOnSquareIcon className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 shrink-0" />
            </button>
          )}

          {classData.linkedPaperClass && (
            <button
              onClick={() =>
                navigate(`/admin/classes/view/${(classData.linkedPaperClass as any)._id}`)
              }
              className="group text-left bg-amber-50/60 border border-amber-200/70 p-4 rounded-2xl flex items-center justify-between hover:border-amber-400 transition-all"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2.5 bg-white rounded-xl text-amber-600 shadow-sm shrink-0">
                  <AcademicCapIcon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">
                    Linked Paper Class
                  </p>
                  <p className="text-sm font-bold text-brand-prussian truncate">
                    {(classData.linkedPaperClass as any).name}
                  </p>
                </div>
              </div>
              <ArrowTopRightOnSquareIcon className="w-4 h-4 text-slate-400 group-hover:text-amber-600 shrink-0" />
            </button>
          )}
        </div>
      )}

      {/* KPI SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <DetailCard
          icon={<AcademicCapIcon className="w-5 h-5" />}
          label="Batch / Intake"
          value={(classData.batch as any)?.name || "Unassigned"}
          accent="blue"
        />
        <DetailCard
          icon={<ClockIcon className="w-5 h-5" />}
          label="Weekly Timing"
          value={
            (classData as any).timeSchedules &&
              (classData as any).timeSchedules.length > 0
              ? (classData as any).timeSchedules
                .map(
                  (sch: any) =>
                    `${moment().day(sch.day).format("ddd")} • ${sch.startTime}`
                )
                .join(" | ")
              : "Schedule TBA"
          }
          accent="purple"
        />
        <DetailCard
          icon={<UserGroupIcon className="w-5 h-5" />}
          label="Enrolled Students"
          value={`${((classData as any).studentCount || 0).toLocaleString()} Students`}
          accent="emerald"
        />
      </div>

      {/* SEGMENTED TABS */}
      <div className="space-y-5">
        <div className="flex items-center gap-1 bg-white p-1.5 rounded-2xl border border-slate-200/70 shadow-sm w-full sm:w-fit overflow-x-auto">
          <TabTrigger
            active={activeTab === "sessions"}
            onClick={() => setActiveTab("sessions")}
            label="Sessions"
            count={sessions.length}
          />
          <TabTrigger
            active={activeTab === "recordings"}
            onClick={() => setActiveTab("recordings")}
            label="Recordings"
            count={recordings.length}
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

        {/* TAB PANELS */}
        <AnimatePresence mode="wait">
          {/* --- 1. SESSIONS TAB --- */}
          {activeTab === "sessions" ? (
            <motion.div
              key="sessions"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
              className="space-y-3"
            >
              {sessions.length > 0 ? (
                sessions.map((session: any) => (
                  <SessionRow
                    key={session._id}
                    session={session}
                    onCancel={() =>
                      setCancelModal({ isOpen: true, sessionId: session._id })
                    }
                    onDelete={() => requestDeleteSession(session._id)}
                  />
                ))
              ) : (
                <div className="bg-white p-14 text-center border border-dashed border-slate-200 rounded-2xl">
                  <ClockIcon className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-brand-prussian">
                    No sessions scheduled yet
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Scheduled live sessions will appear here.
                  </p>
                </div>
              )}
            </motion.div>
          ) : activeTab === "recordings" ? (
            /* --- 2. RECORDINGS TAB --- */
            <motion.div
              key="recordings"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
              className="space-y-6"
            >
              {/* Category Manager Card */}
              <div className="bg-white border border-slate-200/70 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-brand-aliceBlue text-brand-cerulean flex items-center justify-center shrink-0">
                    <FolderIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-brand-prussian">
                      Recording Categories
                    </h3>
                    <p className="text-xs text-slate-400">
                      Group class recordings into structured lessons or units.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {classData?.recordingCategories?.map((cat) => (
                    <span
                      key={cat}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 text-xs font-semibold text-brand-prussian border border-slate-200/80"
                    >
                      {cat}
                      <button
                        onClick={() => requestDeleteCategory(cat)}
                        className="text-slate-400 hover:text-rose-500 transition-colors"
                        title={`Delete ${cat}`}
                      >
                        <XMarkIcon className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                  {(!classData?.recordingCategories ||
                    classData.recordingCategories.length === 0) && (
                      <p className="text-xs text-slate-400 italic">
                        No categories created yet.
                      </p>
                    )}
                </div>

                <div className="flex items-center gap-2 max-w-md pt-1">
                  <input
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddCategory()}
                    placeholder="e.g., Unit 01 - Financial Statements"
                    className="flex-1 bg-slate-50 border border-slate-200/80 rounded-xl px-3.5 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:bg-white focus:border-brand-cerulean focus:ring-2 focus:ring-brand-cerulean/20 outline-none transition-all"
                  />
                  <button
                    onClick={handleAddCategory}
                    disabled={isAddingCategory || !newCategoryName.trim()}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-prussian hover:bg-brand-cerulean text-white text-xs font-semibold transition-colors disabled:opacity-50"
                  >
                    <PlusIcon className="w-4 h-4" />
                    <span>{isAddingCategory ? "Adding..." : "Add"}</span>
                  </button>
                </div>
              </div>

              {/* Add Recording & List Card */}
              <div className="bg-white border border-slate-200/70 rounded-2xl p-6 shadow-sm space-y-6">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-brand-aliceBlue text-brand-cerulean flex items-center justify-center shrink-0">
                    <PlayCircleIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-brand-prussian">
                      Add Class Recording
                    </h3>
                    <p className="text-xs text-slate-400">
                      Attach a video link to a specific session and category.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_1fr_auto] gap-3">
                  <div className="relative">
                    <select
                      value={selectedSessionId}
                      onChange={(e) => setSelectedSessionId(e.target.value)}
                      className="w-full appearance-none bg-slate-50 border border-slate-200/80 rounded-xl pl-3.5 pr-8 py-2.5 text-sm font-medium text-slate-700 focus:bg-white focus:border-brand-cerulean focus:ring-2 focus:ring-brand-cerulean/20 outline-none"
                    >
                      <option value="">Select Session</option>
                      {sessions.map((session: any) => (
                        <option key={session._id} value={session._id}>
                          {session.title || `Session ${session.index}`} —{" "}
                          {moment(session.startAt).format("DD MMM YYYY")}
                        </option>
                      ))}
                    </select>
                    <ChevronDownIcon className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>

                  <div className="relative">
                    <select
                      value={selectedRecordingCategory}
                      onChange={(e) => setSelectedRecordingCategory(e.target.value)}
                      className="w-full appearance-none bg-slate-50 border border-slate-200/80 rounded-xl pl-3.5 pr-8 py-2.5 text-sm font-medium text-slate-700 focus:bg-white focus:border-brand-cerulean focus:ring-2 focus:ring-brand-cerulean/20 outline-none"
                    >
                      <option value="">Uncategorized</option>
                      {classData?.recordingCategories?.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                    <ChevronDownIcon className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>

                  <input
                    value={recordingName}
                    onChange={(e) => setRecordingName(e.target.value)}
                    placeholder="Recording title (optional)"
                    className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-3.5 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:bg-white focus:border-brand-cerulean focus:ring-2 focus:ring-brand-cerulean/20 outline-none"
                  />

                  <input
                    value={recordingUrl}
                    onChange={(e) => setRecordingUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-3.5 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:bg-white focus:border-brand-cerulean focus:ring-2 focus:ring-brand-cerulean/20 outline-none"
                  />

                  <button
                    onClick={handleAddRecording}
                    disabled={isSavingRecording}
                    className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-brand-prussian hover:bg-brand-cerulean text-white text-xs font-semibold transition-colors disabled:opacity-50"
                  >
                    {isSavingRecording ? (
                      <ArrowPathIcon className="w-4 h-4 animate-spin" />
                    ) : (
                      <PlusIcon className="w-4 h-4" />
                    )}
                    <span>{isSavingRecording ? "Saving..." : "Add"}</span>
                  </button>
                </div>

                {/* Grouped Recordings List */}
                <div className="space-y-5 pt-4 border-t border-slate-100">
                  {recordings.length === 0 ? (
                    <div className="text-center py-10 bg-slate-50/60 rounded-xl border border-dashed border-slate-200">
                      <p className="text-sm text-slate-400">
                        No recordings added for this class yet.
                      </p>
                    </div>
                  ) : (
                    Object.entries(
                      recordings.reduce((acc, rec) => {
                        const cat = rec.category || "Uncategorized";
                        if (!acc[cat]) acc[cat] = [];
                        acc[cat].push(rec);
                        return acc;
                      }, {} as Record<string, ClassRecording[]>)
                    ).map(([category, catRecordings]) => (
                      <div key={category} className="space-y-2.5">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-brand-cerulean" />
                          <h4 className="text-xs font-bold uppercase tracking-wider text-brand-prussian">
                            {category}
                          </h4>
                          <span className="text-[11px] text-slate-400 font-semibold tabular-nums">
                            ({catRecordings.length})
                          </span>
                        </div>

                        <div className="space-y-2 pl-3.5 border-l-2 border-slate-100 ml-1">
                          {catRecordings.map((recording) => (
                            <div
                              key={recording._id}
                              className="bg-slate-50/70 hover:bg-white border border-slate-200/70 hover:border-brand-cerulean/30 rounded-xl p-3.5 flex flex-col lg:flex-row lg:items-center gap-3 justify-between transition-all"
                            >
                              <div className="min-w-0 flex-1">
                                {editingRecordingId === recording._id ? (
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-2">
                                    <input
                                      value={editRecordingName}
                                      onChange={(e) =>
                                        setEditRecordingName(e.target.value)
                                      }
                                      placeholder="Recording Name"
                                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-sm font-semibold text-brand-prussian outline-none focus:border-brand-cerulean"
                                    />
                                    <select
                                      value={editSelectedRecordingCategory}
                                      onChange={(e) =>
                                        setEditSelectedRecordingCategory(
                                          e.target.value
                                        )
                                      }
                                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 outline-none focus:border-brand-cerulean"
                                    >
                                      <option value="">Uncategorized</option>
                                      {classData?.recordingCategories?.map((cat) => (
                                        <option key={cat} value={cat}>
                                          {cat}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                ) : (
                                  <p className="text-sm font-semibold text-brand-prussian truncate">
                                    {recording.name}
                                  </p>
                                )}

                                {typeof recording.session === "object" &&
                                  recording.session?.index && (
                                    <p className="text-xs text-slate-400 mt-0.5">
                                      {recording.session.title ||
                                        `Session ${recording.session.index}`}
                                    </p>
                                  )}

                                <a
                                  href={recording.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 text-xs font-medium text-brand-cerulean hover:underline break-all mt-1"
                                >
                                  <LinkIcon className="w-3.5 h-3.5 shrink-0" />
                                  {recording.url}
                                </a>
                              </div>

                              <div className="flex items-center gap-1.5 self-start lg:self-center shrink-0">
                                {editingRecordingId === recording._id ? (
                                  <>
                                    <button
                                      onClick={() =>
                                        handleSaveRecordingName(recording._id)
                                      }
                                      disabled={isUpdatingRecording}
                                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors disabled:opacity-50"
                                    >
                                      {isUpdatingRecording ? "Saving..." : "Save"}
                                    </button>
                                    <button
                                      onClick={handleCancelEditRecording}
                                      disabled={isUpdatingRecording}
                                      className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold transition-colors"
                                    >
                                      Cancel
                                    </button>
                                  </>
                                ) : (
                                  <button
                                    onClick={() =>
                                      handleStartEditRecording(recording)
                                    }
                                    className="p-2 rounded-lg text-slate-400 hover:text-brand-cerulean hover:bg-brand-aliceBlue transition-colors"
                                    title="Edit recording"
                                  >
                                    <PencilSquareIcon className="w-4 h-4" />
                                  </button>
                                )}

                                <button
                                  onClick={() => requestDeleteRecording(recording)}
                                  className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                  title="Remove recording"
                                >
                                  <TrashIcon className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          ) : activeTab === "attendance" ? (
            /* --- 3. ATTENDANCE TAB --- */
            <motion.div
              key="attendance"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
              className="space-y-5"
            >
              {isLoadingAttendance ? (
                <div className="bg-white rounded-2xl border border-slate-200/70 p-12 flex flex-col items-center gap-3">
                  <ArrowPathIcon className="w-6 h-6 text-brand-cerulean animate-spin" />
                  <p className="text-xs font-medium text-slate-400">
                    Loading attendance records...
                  </p>
                </div>
              ) : attendanceSummary &&
                attendanceSummary.sessionSummary &&
                attendanceSummary.sessionSummary.length > 0 ? (
                <>
                  {/* Manual Attendance Marking */}
                  <div className="bg-white border border-slate-200/70 rounded-2xl p-5 shadow-sm space-y-4">
                    <div>
                      <h3 className="text-sm font-bold text-brand-prussian">
                        Manual Attendance Entry
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Record a student manually if the Zoom webhook missed their check-in.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-3">
                      <div className="relative">
                        <select
                          value={selectedSessionForAttendance}
                          onChange={(e) => {
                            setSelectedSessionForAttendance(e.target.value);
                            setSelectedStudentForAttendance("");
                          }}
                          className="w-full appearance-none bg-slate-50 border border-slate-200/80 rounded-xl pl-3.5 pr-8 py-2.5 text-sm font-medium text-slate-700 focus:bg-white focus:border-brand-cerulean focus:ring-2 focus:ring-brand-cerulean/20 outline-none"
                        >
                          <option value="">Select Session</option>
                          {attendanceSummary.sessionSummary.map((session: any) => (
                            <option key={session._id} value={session._id}>
                              Session {session.index} —{" "}
                              {moment(session.startAt).format("DD MMM YYYY")}
                            </option>
                          ))}
                        </select>
                        <ChevronDownIcon className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>

                      <div className="relative">
                        <select
                          value={selectedStudentForAttendance}
                          onChange={(e) =>
                            setSelectedStudentForAttendance(e.target.value)
                          }
                          disabled={!selectedSessionForAttendance}
                          className="w-full appearance-none bg-slate-50 border border-slate-200/80 rounded-xl pl-3.5 pr-8 py-2.5 text-sm font-medium text-slate-700 focus:bg-white focus:border-brand-cerulean focus:ring-2 focus:ring-brand-cerulean/20 outline-none disabled:opacity-50"
                        >
                          <option value="">Select Student</option>
                          {selectedSessionForAttendance &&
                            classData &&
                            classData.students
                            ? (classData.students as any[]).map((student: any) => {
                              const session =
                                attendanceSummary.sessionSummary.find(
                                  (s: any) =>
                                    s._id === selectedSessionForAttendance
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
                        <ChevronDownIcon className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>

                      <button
                        onClick={handleMarkAttendance}
                        disabled={
                          isMarkingAttendance ||
                          !selectedSessionForAttendance ||
                          !selectedStudentForAttendance
                        }
                        className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-brand-prussian hover:bg-brand-cerulean text-white text-xs font-semibold transition-colors disabled:opacity-50"
                      >
                        {isMarkingAttendance ? (
                          <ArrowPathIcon className="w-4 h-4 animate-spin" />
                        ) : (
                          <CheckCircleIcon className="w-4 h-4" />
                        )}
                        <span>
                          {isMarkingAttendance ? "Marking..." : "Mark Present"}
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Overview Banner */}
                  <div className="bg-brand-aliceBlue/50 border border-brand-cerulean/20 rounded-2xl p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white text-brand-cerulean flex items-center justify-center shadow-sm shrink-0">
                        <UserGroupIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold text-brand-cerulean uppercase tracking-wider">
                          Attendance Summary
                        </p>
                        <p className="text-sm font-bold text-brand-prussian tabular-nums">
                          {attendanceSummary.totalSessions} Sessions •{" "}
                          {attendanceSummary.sessionSummary.reduce(
                            (acc: number, sess: any) => acc + sess.attendanceCount,
                            0
                          )}{" "}
                          Total Check-ins
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Session Attendance Cards */}
                  {attendanceSummary.sessionSummary.map((session: any) => (
                    <div
                      key={session._id}
                      className="bg-white border border-slate-200/70 rounded-2xl overflow-hidden shadow-sm"
                    >
                      <div className="bg-slate-50/80 px-5 py-4 flex items-center justify-between border-b border-slate-100">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-brand-prussian text-white flex items-center justify-center text-xs font-bold tabular-nums">
                            S{session.index}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-brand-prussian">
                              {moment(session.startAt).format("DD MMM YYYY")}
                            </p>
                            <p className="text-xs text-slate-400">
                              {moment(session.startAt).format("hh:mm A")} —{" "}
                              {moment(session.endAt).format("hh:mm A")}
                            </p>
                          </div>
                        </div>
                        <span className="px-3 py-1 rounded-full bg-brand-aliceBlue text-brand-cerulean text-xs font-bold tabular-nums">
                          {session.attendanceCount} Attended
                        </span>
                      </div>

                      {session.attendance && session.attendance.length > 0 ? (
                        <div className="divide-y divide-slate-100">
                          {session.attendance.map((record: any) => (
                            <div
                              key={record._id}
                              className="px-5 py-3.5 flex items-center justify-between hover:bg-slate-50/70 transition-colors"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                {record.student?.avatar ? (
                                  <img
                                    src={record.student.avatar}
                                    alt={record.student.firstName}
                                    className="w-9 h-9 rounded-full object-cover ring-1 ring-slate-200 shrink-0"
                                  />
                                ) : (
                                  <div className="w-9 h-9 rounded-full bg-brand-aliceBlue text-brand-cerulean ring-1 ring-brand-cerulean/20 flex items-center justify-center text-xs font-bold shrink-0">
                                    {record.student?.firstName?.charAt(0)}
                                    {record.student?.lastName?.charAt(0)}
                                  </div>
                                )}
                                <div className="min-w-0">
                                  <p className="text-sm font-semibold text-brand-prussian truncate">
                                    {record.student?.firstName}{" "}
                                    {record.student?.lastName}
                                  </p>
                                  <p className="text-xs text-slate-400 truncate">
                                    {record.student?.email}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-3 shrink-0">
                                <div className="text-right">
                                  <p className="text-xs font-bold text-brand-prussian tabular-nums">
                                    {record.durationMinutes} min
                                  </p>
                                  <p className="text-[11px] text-slate-400 tabular-nums">
                                    {moment(record.joinedAt).format("hh:mm A")}
                                  </p>
                                </div>
                                <CheckCircleIcon className="w-5 h-5 text-emerald-500" />
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-6 text-center text-xs text-slate-400">
                          No attendance records for this session.
                        </div>
                      )}
                    </div>
                  ))}
                </>
              ) : (
                <div className="bg-white p-14 text-center border border-dashed border-slate-200 rounded-2xl">
                  <p className="text-sm font-semibold text-brand-prussian">
                    No attendance data yet
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Attendance records will appear here after sessions begin.
                  </p>
                </div>
              )}
            </motion.div>
          ) : (
            /* --- 4. ENROLLMENT TAB --- */
            <motion.div
              key="students"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
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
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() =>
                !isProcessing && setCancelModal({ isOpen: false, sessionId: null })
              }
              className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl p-6 w-full max-w-md relative z-10 shadow-2xl border border-slate-200/70"
            >
              <div className="flex items-start gap-3.5 mb-4">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                  <ExclamationTriangleIcon className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-brand-prussian">
                    Cancel Session
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                    This marks the session as cancelled for all enrolled students.
                  </p>
                </div>
              </div>

              <div className="space-y-1.5 mb-6">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Reason for cancellation <span className="text-rose-500">*</span>
                </label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="e.g., Technical maintenance, instructor unavailable..."
                  className="w-full bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-sm text-slate-700 placeholder:text-slate-400 focus:bg-white focus:border-brand-cerulean focus:ring-2 focus:ring-brand-cerulean/20 outline-none h-24 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2.5">
                <button
                  disabled={isProcessing}
                  onClick={() =>
                    setCancelModal({ isOpen: false, sessionId: null })
                  }
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  Dismiss
                </button>
                <button
                  disabled={isProcessing || !cancelReason.trim()}
                  onClick={handleCancelConfirm}
                  className="inline-flex items-center gap-2 px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold transition-colors disabled:opacity-50"
                >
                  {isProcessing && (
                    <ArrowPathIcon className="w-3.5 h-3.5 animate-spin" />
                  )}
                  <span>
                    {isProcessing ? "Cancelling..." : "Confirm Cancellation"}
                  </span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- REUSABLE CONFIRMATION MODAL --- */}
      {confirmDialog && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl border border-slate-200/70">
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <ExclamationTriangleIcon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-brand-prussian">
                  {confirmDialog.title}
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  {confirmDialog.message}
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 mt-6">
              <button
                onClick={() => setConfirmDialog(null)}
                disabled={isConfirming}
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={executeConfirmDialog}
                disabled={isConfirming}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors disabled:opacity-50"
              >
                {isConfirming && (
                  <ArrowPathIcon className="w-3.5 h-3.5 animate-spin" />
                )}
                <span>
                  {isConfirming ? "Processing..." : confirmDialog.confirmLabel}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- SUB-COMPONENTS ---

const SessionRow = ({
  session,
  onCancel,
  onDelete,
}: {
  session: any;
  onCancel: () => void;
  onDelete: () => void;
}) => {
  const isPast = moment(session.startAt).isBefore(moment());
  const isCancelled = session.isCancelled;
  const hasLink = session.zoomStartUrl && isValidUrl(session.zoomStartUrl);

  return (
    <div
      className={`bg-white border ${isCancelled
          ? "border-rose-200/70 bg-rose-50/20"
          : "border-slate-200/70 hover:border-brand-cerulean/30"
        } rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all shadow-sm`}
    >
      <div className="flex items-center gap-4 min-w-0">
        <div
          className={`w-11 h-11 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 tabular-nums ${isCancelled
              ? "bg-rose-50 text-rose-600 ring-1 ring-rose-200"
              : isPast
                ? "bg-slate-100 text-slate-400"
                : "bg-brand-prussian text-white shadow-sm"
            }`}
        >
          S{session.index}
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-bold text-brand-prussian truncate">
              {session.title || `Session ${session.index}`}
            </p>
            <span className="text-[11px] text-slate-500 font-semibold bg-slate-100 px-2 py-0.5 rounded-md tabular-nums">
              {moment(session.startAt).format("DD MMM YYYY")}
            </span>
            {isCancelled && (
              <span className="text-[10px] font-bold bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full uppercase">
                Cancelled
              </span>
            )}
            {isPast && !isCancelled && (
              <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full uppercase">
                Completed
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1 tabular-nums">
            {moment(session.startAt).format("hh:mm A")} —{" "}
            {moment(session.endAt).format("hh:mm A")}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 w-full sm:w-auto justify-end shrink-0">
        {!isCancelled && !isPast && hasLink && (
          <a
            href={session.zoomStartUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 bg-brand-cerulean hover:bg-brand-prussian text-white px-4 py-2 rounded-xl text-xs font-semibold transition-colors shadow-sm"
          >
            <VideoCameraIcon className="w-4 h-4" />
            <span>Launch</span>
          </a>
        )}

        {isCancelled && (
          <span className="text-xs text-rose-500 italic bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-100 truncate max-w-[200px]">
            "{session.cancellationReason || "No reason specified"}"
          </span>
        )}

        {!isCancelled && !isPast && (
          <button
            onClick={onCancel}
            className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl border border-slate-200/70 transition-colors"
            title="Cancel session"
          >
            <XCircleIcon className="w-4 h-4" />
          </button>
        )}

        <button
          onClick={onDelete}
          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl border border-slate-200/70 transition-colors"
          title="Delete session"
        >
          <TrashIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

const DetailCard = ({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent: "blue" | "purple" | "emerald";
}) => {
  const styles = {
    blue: "bg-blue-50 text-blue-600 ring-blue-100",
    purple: "bg-purple-50 text-purple-600 ring-purple-100",
    emerald: "bg-emerald-50 text-emerald-600 ring-emerald-100",
  }[accent];

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200/70 shadow-sm flex items-center gap-4">
      <div className={`p-3 rounded-xl ring-1 shrink-0 ${styles}`}>{icon}</div>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider truncate">
          {label}
        </p>
        <p className="text-sm font-bold text-brand-prussian truncate mt-0.5 tabular-nums">
          {value}
        </p>
      </div>
    </div>
  );
};

const TabTrigger = ({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count?: number;
}) => (
  <button
    onClick={onClick}
    className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${active
        ? "bg-brand-prussian text-white shadow-sm"
        : "text-slate-500 hover:text-brand-prussian hover:bg-slate-50"
      }`}
  >
    <span>{label}</span>
    {count !== undefined && (
      <span
        className={`px-1.5 py-0.5 rounded-md text-[10px] tabular-nums ${active ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
          }`}
      >
        {count}
      </span>
    )}
  </button>
);

const NotFoundState = ({ onBack }: { onBack: () => void }) => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
    <div className="w-14 h-14 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mb-4">
      <ExclamationTriangleIcon className="w-7 h-7" />
    </div>
    <h2 className="text-lg font-bold text-brand-prussian mb-1">
      Class Not Found
    </h2>
    <p className="text-sm text-slate-500 mb-6 max-w-sm">
      The class module you requested could not be found or has been deleted.
    </p>
    <button
      onClick={onBack}
      className="px-5 py-2.5 bg-brand-prussian text-white text-sm font-semibold rounded-xl hover:bg-brand-cerulean transition-colors"
    >
      Back to Curriculum
    </button>
  </div>
);