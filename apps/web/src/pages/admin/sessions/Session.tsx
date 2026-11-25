import { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import moment from "moment";
import { motion, AnimatePresence } from "framer-motion";
import ClassService from "../../../services/ClassService";
import SessionService, {
  type SessionData,
} from "../../../services/SessionService";
import {
  VideoCameraIcon,
  CalendarDaysIcon,
  ClockIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  TrashIcon,
  XCircleIcon,
  ArrowTopRightOnSquareIcon,
  ArrowPathIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";

// --- Skeleton Loader ---

function SessionsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-28 bg-white rounded-2xl border border-slate-100 p-6">
            <div className="h-3 w-24 bg-slate-200 rounded mb-4" />
            <div className="h-7 w-16 bg-slate-200 rounded" />
          </div>
        ))}
      </div>
      <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4">
        <div className="h-10 w-72 bg-slate-100 rounded-xl" />
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-16 bg-slate-50 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

// --- Main Component ---

export default function SessionsPage() {
  const navigate = useNavigate();

  // Data State
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"upcoming" | "past">("upcoming");
  const [searchTerm, setSearchTerm] = useState("");
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [classMap, setClassMap] = useState<Record<string, string>>({});

  // Cancel Modal State
  const [cancelTarget, setCancelTarget] = useState<SessionData | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);

  // Delete Modal State
  const [deleteTarget, setDeleteTarget] = useState<SessionData | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // 1. Sync All Data
  const syncData = useCallback(async () => {
    setLoading(true);
    try {
      const [classRes, sessionRes] = await Promise.all([
        ClassService.getAllClasses(),
        SessionService.getAllSessions(),
      ]);

      const classesArray =
        (classRes as any).classes ||
        (classRes as any).class ||
        (Array.isArray(classRes) ? classRes : []);

      const mapping: Record<string, string> = {};
      classesArray.forEach((c: any) => {
        mapping[c._id] = c.name;
      });
      setClassMap(mapping);

      const sorted = [...sessionRes].sort(
        (a, b) => moment(a.startAt).valueOf() - moment(b.startAt).valueOf()
      );
      setSessions(sorted);
    } catch (error) {
      console.error("Master schedule sync error:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    syncData();
  }, [syncData]);

  // 2. Derived KPI Stats
  const stats = useMemo(() => {
    const now = moment();
    let upcoming = 0;
    let past = 0;
    let cancelled = 0;

    sessions.forEach((s) => {
      if (s.isCancelled) cancelled++;
      if (moment(s.startAt).isBefore(now)) past++;
      else upcoming++;
    });

    return { upcoming, past, cancelled };
  }, [sessions]);

  // 3. Filtered Sessions
  const filteredSessions = useMemo(() => {
    const now = moment();
    const term = searchTerm.toLowerCase().trim();

    const result = sessions.filter((s) => {
      const isPast = moment(s.startAt).isBefore(now);
      const matchesTab = activeTab === "upcoming" ? !isPast : isPast;

      const className = classMap[s.class] || "";
      const matchesSearch =
        !term ||
        className.toLowerCase().includes(term) ||
        (s.title || "").toLowerCase().includes(term);

      return matchesTab && matchesSearch;
    });

    return activeTab === "past" ? [...result].reverse() : result;
  }, [sessions, activeTab, searchTerm, classMap]);

  // --- Handlers ---
  const handleConfirmCancel = async () => {
    if (!cancelTarget || !cancelReason.trim()) return;
    setIsCancelling(true);
    try {
      await SessionService.cancelSession(cancelTarget._id, cancelReason.trim());
      setSessions((prev) =>
        prev.map((s) =>
          s._id === cancelTarget._id ? { ...s, isCancelled: true } : s
        )
      );
      setCancelTarget(null);
      setCancelReason("");
    } catch {
      alert("Failed to cancel session.");
    } finally {
      setIsCancelling(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await SessionService.deleteSession(deleteTarget._id);
      setSessions((prev) => prev.filter((s) => s._id !== deleteTarget._id));
      setDeleteTarget(null);
    } catch {
      alert("Delete failed.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 md:space-y-8 pb-24 md:pb-12">
      {/* HEADER */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-brand-prussian tracking-tight">
            Master Schedule
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Orchestrate live Zoom sessions across all curriculum modules.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={syncData}
            disabled={loading}
            title="Refresh schedule"
            className="p-2.5 bg-white rounded-xl border border-slate-200/80 shadow-sm text-slate-600 hover:text-brand-cerulean hover:border-brand-cerulean/40 transition-colors disabled:opacity-50"
          >
            <ArrowPathIcon
              className={`w-4 h-4 ${loading ? "animate-spin text-brand-cerulean" : ""}`}
            />
          </button>

          <button
            onClick={() => navigate("/admin/sessions/create")}
            className="inline-flex items-center gap-2 bg-brand-prussian hover:bg-brand-cerulean text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-sm hover:shadow-md active:scale-[0.98] transition-all"
          >
            <PlusIcon className="w-4 h-4 stroke-[2.5]" />
            <span>Create Session</span>
          </button>
        </div>
      </header>

      {/* LOADING SKELETON */}
      {loading && sessions.length === 0 ? (
        <SessionsSkeleton />
      ) : (
        <div className="space-y-6">
          {/* KPI SUMMARY CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="relative overflow-hidden bg-white p-6 rounded-2xl border border-slate-200/70 shadow-sm">
              <div className="pointer-events-none absolute -top-10 -right-10 w-24 h-24 rounded-full bg-blue-500/10 blur-2xl" />
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Upcoming
                  </p>
                  <h3 className="text-3xl font-bold text-brand-prussian mt-2 tabular-nums">
                    {stats.upcoming}
                  </h3>
                </div>
                <div className="p-3 rounded-xl bg-blue-50 text-blue-600 ring-1 ring-blue-100">
                  <CalendarDaysIcon className="w-5 h-5" />
                </div>
              </div>
            </div>

            <div className="relative overflow-hidden bg-white p-6 rounded-2xl border border-slate-200/70 shadow-sm">
              <div className="pointer-events-none absolute -top-10 -right-10 w-24 h-24 rounded-full bg-emerald-500/10 blur-2xl" />
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Past Sessions
                  </p>
                  <h3 className="text-3xl font-bold text-brand-prussian mt-2 tabular-nums">
                    {stats.past}
                  </h3>
                </div>
                <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
                  <CheckCircleIcon className="w-5 h-5" />
                </div>
              </div>
            </div>

            <div className="relative overflow-hidden bg-white p-6 rounded-2xl border border-slate-200/70 shadow-sm">
              <div className="pointer-events-none absolute -top-10 -right-10 w-24 h-24 rounded-full bg-rose-500/10 blur-2xl" />
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Cancelled
                  </p>
                  <h3 className="text-3xl font-bold text-brand-prussian mt-2 tabular-nums">
                    {stats.cancelled}
                  </h3>
                </div>
                <div className="p-3 rounded-xl bg-rose-50 text-rose-600 ring-1 ring-rose-100">
                  <XCircleIcon className="w-5 h-5" />
                </div>
              </div>
            </div>
          </div>

          {/* SCHEDULE DIRECTORY CARD */}
          <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm overflow-hidden">
            {/* Toolbar */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <MagnifyingGlassIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search by class module or session title..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-9 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-sm text-slate-700 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-cerulean/20 focus:border-brand-cerulean transition-all"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Segmented Tabs */}
              <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200/60 self-start lg:self-auto">
                {(
                  [
                    { key: "upcoming", label: "Upcoming", count: stats.upcoming },
                    { key: "past", label: "Past", count: stats.past },
                  ] as const
                ).map((tab) => {
                  const active = activeTab === tab.key;
                  return (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${active
                          ? "bg-white text-brand-prussian shadow-sm"
                          : "text-slate-500 hover:text-slate-700"
                        }`}
                    >
                      <span>{tab.label}</span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] tabular-nums ${active
                            ? "bg-brand-aliceBlue text-brand-cerulean"
                            : "bg-slate-200/70 text-slate-500"
                          }`}
                      >
                        {tab.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Content */}
            {filteredSessions.length === 0 ? (
              <EmptyState
                activeTab={activeTab}
                hasSearch={Boolean(searchTerm.trim())}
                onCreate={() => navigate("/admin/sessions/create")}
              />
            ) : (
              <>
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50/80 text-[11px] uppercase text-slate-500 font-semibold tracking-wider border-b border-slate-100">
                      <tr>
                        <th className="px-6 py-3.5">Date & Time</th>
                        <th className="px-6 py-3.5">Class & Session</th>
                        <th className="px-6 py-3.5">Status</th>
                        <th className="px-6 py-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      <AnimatePresence mode="popLayout">
                        {filteredSessions.map((session) => (
                          <SessionRow
                            key={session._id}
                            session={session}
                            classNameLookup={classMap[session.class]}
                            onCancel={() => {
                              setCancelReason("");
                              setCancelTarget(session);
                            }}
                            onDelete={() => setDeleteTarget(session)}
                          />
                        ))}
                      </AnimatePresence>
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden divide-y divide-slate-100">
                  <AnimatePresence mode="popLayout">
                    {filteredSessions.map((session) => (
                      <MobileSessionCard
                        key={session._id}
                        session={session}
                        classNameLookup={classMap[session.class]}
                        onCancel={() => {
                          setCancelReason("");
                          setCancelTarget(session);
                        }}
                        onDelete={() => setDeleteTarget(session)}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* --- CANCEL SESSION MODAL --- */}
      {cancelTarget && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl border border-slate-200/70">
            <div className="flex items-start gap-3.5 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <ExclamationTriangleIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-brand-prussian">
                  Cancel Session
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {classMap[cancelTarget.class] || "Session"} •{" "}
                  {moment(cancelTarget.startAt).format("DD MMM YYYY, h:mm A")}
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
                placeholder="e.g., Rescheduled due to public holiday..."
                rows={3}
                className="w-full bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-sm text-slate-700 placeholder:text-slate-400 focus:bg-white focus:border-brand-cerulean focus:ring-2 focus:ring-brand-cerulean/20 outline-none resize-none"
              />
            </div>

            <div className="flex justify-end gap-2.5">
              <button
                onClick={() => setCancelTarget(null)}
                disabled={isCancelling}
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Dismiss
              </button>
              <button
                onClick={handleConfirmCancel}
                disabled={isCancelling || !cancelReason.trim()}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-xl transition-colors disabled:opacity-50"
              >
                {isCancelling && <ArrowPathIcon className="w-3.5 h-3.5 animate-spin" />}
                <span>{isCancelling ? "Cancelling..." : "Confirm Cancel"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- DELETE CONFIRMATION MODAL --- */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl border border-slate-200/70">
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <ExclamationTriangleIcon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-brand-prussian">
                  Delete session permanently?
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  Are you sure you want to delete{" "}
                  <strong className="text-brand-prussian">
                    {deleteTarget.title || `Session ${deleteTarget.index}`}
                  </strong>
                  ? This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 mt-6">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors disabled:opacity-50"
              >
                {isDeleting && <ArrowPathIcon className="w-3.5 h-3.5 animate-spin" />}
                <span>{isDeleting ? "Deleting..." : "Delete Session"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Sub-components ---

interface SessionItemProps {
  session: SessionData;
  classNameLookup?: string;
  onCancel: () => void;
  onDelete: () => void;
}

function SessionRow({
  session,
  classNameLookup,
  onCancel,
  onDelete,
}: SessionItemProps) {
  const isCancelled = session.isCancelled;
  const isPast = moment(session.startAt).isBefore(moment());
  const hasZoom = Boolean(session.zoomMeetingId && !isCancelled);

  return (
    <motion.tr
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`transition-colors ${isCancelled ? "bg-rose-50/20" : "hover:bg-slate-50/80"
        }`}
    >
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center gap-3.5">
          <div
            className={`flex flex-col items-center justify-center w-11 h-11 rounded-xl font-bold shrink-0 ${isCancelled
                ? "bg-slate-100 text-slate-400"
                : "bg-brand-aliceBlue text-brand-cerulean ring-1 ring-brand-cerulean/15"
              }`}
          >
            <span className="text-[9px] uppercase leading-none">
              {moment(session.startAt).format("MMM")}
            </span>
            <span className="text-base leading-none mt-0.5 tabular-nums">
              {moment(session.startAt).format("DD")}
            </span>
          </div>
          <div>
            <div
              className={`text-sm font-semibold ${isCancelled ? "text-slate-400" : "text-brand-prussian"
                }`}
            >
              {moment(session.startAt).format("dddd")}
            </div>
            <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5 tabular-nums">
              <ClockIcon className="w-3.5 h-3.5" />
              {moment(session.startAt).format("h:mm A")}
            </div>
          </div>
        </div>
      </td>

      <td className="px-6 py-4">
        <p
          className={`text-sm font-semibold truncate max-w-xs ${isCancelled ? "text-slate-400 line-through" : "text-brand-prussian"
            }`}
        >
          {classNameLookup || "Independent Module"}
        </p>
        <span className="inline-block mt-1 text-[11px] font-semibold text-brand-cerulean bg-brand-aliceBlue/80 px-2 py-0.5 rounded-md">
          {session.title || `Session ${session.index}`}
        </span>
      </td>

      <td className="px-6 py-4 whitespace-nowrap">
        {isCancelled ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 ring-1 ring-rose-600/15">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            Cancelled
          </span>
        ) : hasZoom ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/15">
            <VideoCameraIcon className="w-3.5 h-3.5" />
            {isPast ? "Completed" : "Zoom Ready"}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 ring-1 ring-slate-300/70">
            {isPast ? "Completed" : "No Link"}
          </span>
        )}
      </td>

      <td className="px-6 py-4 text-right whitespace-nowrap">
        <div className="inline-flex items-center justify-end gap-1.5">
          {session.zoomStartUrl && !isCancelled && !isPast && (
            <a
              href={session.zoomStartUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 bg-brand-prussian hover:bg-brand-cerulean text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors shadow-sm"
            >
              <span>Start</span>
              <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5" />
            </a>
          )}
          {!isCancelled && !isPast && (
            <button
              onClick={onCancel}
              className="p-2 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
              title="Cancel session"
            >
              <XCircleIcon className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onDelete}
            className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
            title="Delete session"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        </div>
      </td>
    </motion.tr>
  );
}

function MobileSessionCard({
  session,
  classNameLookup,
  onCancel,
  onDelete,
}: SessionItemProps) {
  const isCancelled = session.isCancelled;
  const isPast = moment(session.startAt).isBefore(moment());

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-4 space-y-3.5 ${isCancelled ? "bg-rose-50/20" : "bg-white"}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={`flex flex-col items-center justify-center w-11 h-11 rounded-xl font-bold shrink-0 ${isCancelled
                ? "bg-slate-100 text-slate-400"
                : "bg-brand-aliceBlue text-brand-cerulean"
              }`}
          >
            <span className="text-[9px] uppercase leading-none">
              {moment(session.startAt).format("MMM")}
            </span>
            <span className="text-base leading-none mt-0.5 tabular-nums">
              {moment(session.startAt).format("DD")}
            </span>
          </div>
          <div>
            <div className="text-sm font-bold text-brand-prussian">
              {moment(session.startAt).format("dddd")}
            </div>
            <div className="text-xs text-slate-400 flex items-center gap-1 tabular-nums">
              <ClockIcon className="w-3.5 h-3.5" />
              {moment(session.startAt).format("h:mm A")}
            </div>
          </div>
        </div>

        {isCancelled && (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 ring-1 ring-rose-600/15">
            Cancelled
          </span>
        )}
      </div>

      <div>
        <h3
          className={`text-sm font-bold ${isCancelled ? "text-slate-400 line-through" : "text-brand-prussian"
            }`}
        >
          {classNameLookup || "Independent Module"}
        </h3>
        <span className="inline-block mt-1 text-[11px] font-semibold text-brand-cerulean bg-brand-aliceBlue px-2 py-0.5 rounded-md">
          {session.title || `Session ${session.index}`}
        </span>
      </div>

      <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
        {session.zoomStartUrl && !isCancelled && !isPast && (
          <a
            href={session.zoomStartUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 inline-flex items-center justify-center gap-1.5 bg-brand-prussian hover:bg-brand-cerulean text-white py-2 rounded-xl text-xs font-semibold transition-colors"
          >
            <span>Start Session</span>
            <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5" />
          </a>
        )}
        {!isCancelled && !isPast && (
          <button
            onClick={onCancel}
            className="p-2 bg-slate-50 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-colors"
            title="Cancel session"
          >
            <XCircleIcon className="w-4 h-4" />
          </button>
        )}
        <button
          onClick={onDelete}
          className="p-2 bg-slate-50 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors ml-auto"
          title="Delete session"
        >
          <TrashIcon className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}

function EmptyState({
  activeTab,
  hasSearch,
  onCreate,
}: {
  activeTab: "upcoming" | "past";
  hasSearch: boolean;
  onCreate: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-4">
      <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mb-3 border border-slate-100">
        <CalendarDaysIcon className="w-7 h-7 text-slate-300" />
      </div>
      <h3 className="text-sm font-semibold text-brand-prussian">
        No {activeTab} sessions found
      </h3>
      <p className="text-xs text-slate-400 mt-1 max-w-xs">
        {hasSearch
          ? "Try adjusting your search query to find matching sessions."
          : activeTab === "upcoming"
            ? "Schedule a new live session to get started."
            : "Completed sessions will appear here automatically."}
      </p>
      {!hasSearch && activeTab === "upcoming" && (
        <button
          onClick={onCreate}
          className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-aliceBlue text-brand-cerulean text-xs font-semibold hover:bg-brand-cerulean hover:text-white transition-colors"
        >
          <PlusIcon className="w-4 h-4" />
          Create Session
        </button>
      )}
    </div>
  );
}