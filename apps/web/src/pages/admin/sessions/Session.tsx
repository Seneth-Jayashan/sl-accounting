import { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import moment from "moment";
import Swal from "sweetalert2";
import { motion, AnimatePresence } from "framer-motion";
import ClassService from "../../../services/ClassService";
import SessionService, { type SessionData } from "../../../services/SessionService";
import {
  VideoCameraIcon,
  CalendarDaysIcon,
  ClockIcon,
  PlusIcon,
  TrashIcon,
  XCircleIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon,
  FunnelIcon
} from "@heroicons/react/24/outline";

export default function SessionsPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"upcoming" | "past">("upcoming");
  const [searchTerm, setSearchTerm] = useState("");
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [classMap, setClassMap] = useState<Record<string, string>>({});

  // 1. Sync All Data
  const syncData = useCallback(async () => {
    setLoading(true);
    try {
      const [classRes, sessionRes] = await Promise.all([
        ClassService.getAllClasses(),
        SessionService.getAllSessions()
      ]);

      const classesArray = (classRes as any).classes || (classRes as any).class || (Array.isArray(classRes) ? classRes : []);

      const mapping: Record<string, string> = {};
      classesArray.forEach((c: any) => {
        mapping[c._id] = c.name;
      });
      setClassMap(mapping);

      // Sort chronological
      const sorted = [...sessionRes].sort((a, b) =>
        moment(a.startAt).valueOf() - moment(b.startAt).valueOf()
      );
      setSessions(sorted);
    } catch (error) {
      console.error("Master schedule sync error:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { syncData(); }, [syncData]);

  // 2. Performance Filter
  const filteredSessions = useMemo(() => {
    const now = moment();
    const term = searchTerm.toLowerCase().trim();

    const result = sessions.filter((s) => {
      const isPast = moment(s.startAt).isBefore(now);
      const matchesTab = activeTab === "upcoming" ? !isPast : isPast;

      const className = classMap[s.class] || "";
      const matchesSearch = className.toLowerCase().includes(term) || (s.title || "").toLowerCase().includes(term);

      return matchesTab && matchesSearch;
    });

    return activeTab === "past" ? [...result].reverse() : result;
  }, [sessions, activeTab, searchTerm, classMap]);

  // --- Handlers ---
  const handleCancel = async (sessionId: string) => {
    const { value: reason } = await Swal.fire({
      title: 'Cancel Session',
      input: 'text',
      inputLabel: 'Reason for cancellation',
      inputPlaceholder: 'Enter the reason...',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Cancel Session'
    });

    if (reason === undefined) return;

    try {
      await SessionService.cancelSession(sessionId, reason);
      setSessions(prev => prev.map(s => s._id === sessionId ? { ...s, isCancelled: true } : s));
      Swal.fire('Cancelled!', 'The session has been cancelled.', 'success');
    } catch (error) {
      Swal.fire('Error', 'Failed to cancel.', 'error');
    }
  };

  const handleDelete = async (sessionId: string) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "Permanently delete this session record? This cannot be undone.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    });

    if (!result.isConfirmed) return;

    try {
      await SessionService.deleteSession(sessionId);
      setSessions(prev => prev.filter(s => s._id !== sessionId));
      Swal.fire('Deleted!', 'Session record has been deleted.', 'success');
    } catch (error) {
      Swal.fire('Error', 'Delete failed.', 'error');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-24 px-4 sm:px-6 w-full overflow-x-hidden animate-in fade-in duration-500 pt-4">

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
        <div>
          <h1 className="text-xl md:text-[22px] font-bold text-gray-900 tracking-tight leading-tight">Master Schedule</h1>
          <p className="text-gray-500 text-xs mt-0.5 font-medium">Orchestrating live sessions across all curriculum modules.</p>
        </div>

        <button
          onClick={() => navigate("/admin/sessions/create")}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#0d4b5b] hover:bg-[#093946] text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-md active:scale-95"
        >
          <PlusIcon className="w-5 h-5" />
          Create Session
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Filter sessions by module name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white border border-gray-100 rounded-xl focus:ring-2 focus:ring-[#0d4b5b]/20 outline-none text-[13px] font-medium text-gray-700 transition-all shadow-sm placeholder:text-gray-400"
          />
        </div>
        <div className="relative min-w-[200px]">
          <FunnelIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <select
            value={activeTab}
            onChange={(e) => setActiveTab(e.target.value as "upcoming" | "past")}
            className="w-full pl-11 pr-4 py-3 bg-white border border-gray-100 rounded-xl focus:ring-2 focus:ring-[#0d4b5b]/20 outline-none text-[13px] font-medium text-gray-700 cursor-pointer appearance-none shadow-sm"
          >
            <option value="upcoming">Upcoming</option>
            <option value="past">Past</option>
          </select>
        </div>
      </div>

      {/* Schedule List */}
      {loading ? (
        <div className="py-32 flex flex-col items-center justify-center gap-3">
          <ArrowPathIcon className="w-8 h-8 animate-spin text-[#0d4b5b]" />
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest animate-pulse">Synchronizing Schedule...</p>
        </div>
      ) : (
        <div className="space-y-4">

          {/* Desktop Table View */}
          <div className="hidden md:block bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse table-fixed">
                <thead className="bg-white text-[11px] uppercase text-gray-500 font-bold tracking-wider border-b border-gray-100">
                  <tr>
                    <th className="w-[25%] px-3 sm:px-4 lg:px-6 py-5">Timeline</th>
                    <th className="w-[35%] px-3 sm:px-4 lg:px-6 py-5">Module</th>
                    <th className="w-[20%] px-3 sm:px-4 lg:px-6 py-5 text-left">Connectivity</th>
                    <th className="w-[20%] px-3 sm:px-4 lg:px-6 py-5 text-center">Management</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <AnimatePresence mode="popLayout">
                    {filteredSessions.map((session) => (
                      <SessionRow
                        key={session._id}
                        session={session}
                        classNameLookup={classMap[session.class]}
                        onCancel={() => handleCancel(session._id)}
                        onDelete={() => handleDelete(session._id)}
                      />
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
              {filteredSessions.length === 0 && <EmptyState />}
            </div>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            <AnimatePresence mode="popLayout">
              {filteredSessions.map((session) => (
                <MobileSessionCard
                  key={session._id}
                  session={session}
                  classNameLookup={classMap[session.class]}
                  onCancel={() => handleCancel(session._id)}
                  onDelete={() => handleDelete(session._id)}
                />
              ))}
            </AnimatePresence>
            {filteredSessions.length === 0 && <EmptyState />}
          </div>

        </div>
      )}
    </div>
  );
}

// --- Internal Sub-components ---

function SessionRow({ session, classNameLookup, onCancel, onDelete }: any) {
  const isCancelled = session.isCancelled;

  return (
    <motion.tr layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className={`group transition-colors ${isCancelled ? "bg-red-50/20" : "hover:bg-gray-50/50"}`}>

      <td className="px-3 sm:px-4 lg:px-6 py-4 whitespace-nowrap overflow-hidden">
        <div className="flex items-center gap-4">
          <div className={`flex flex-col items-center justify-center w-[46px] h-[46px] rounded-xl font-bold ${isCancelled ? "bg-gray-100 text-gray-400" : "bg-[#eef2f6] text-[#0d4b5b]"}`}>
            <span className="text-[10px] uppercase leading-none mb-0.5">{moment(session.startAt).format("MMM")}</span>
            <span className="text-lg leading-none">{moment(session.startAt).format("DD")}</span>
          </div>
          <div>
            <div className={`text-[13px] font-semibold ${isCancelled ? "text-gray-400" : "text-gray-800"}`}>{moment(session.startAt).format("dddd")}</div>
            <div className="text-[12px] text-gray-400 font-medium flex items-center gap-1 mt-0.5">
              {moment(session.startAt).format("h:mm A")}
            </div>
          </div>
        </div>
      </td>

      <td className="px-3 sm:px-4 lg:px-6 py-4">
        <p className={`text-[13px] font-semibold truncate max-w-[180px] sm:max-w-[200px] xl:max-w-[250px] mb-1 ${isCancelled ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
          {classNameLookup || "Independent Module"}
        </p>
        <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded inline-block">
          Index {session.index}
        </span>
      </td>

      <td className="px-3 sm:px-4 lg:px-6 py-4 text-center">
        <div className={`inline-flex p-2 rounded-lg ${session.zoomMeetingId && !isCancelled ? "text-[#0d4b5b]" : "text-gray-300"}`}>
          <VideoCameraIcon className="w-5 h-5 stroke-[2px]" />
        </div>
      </td>

      <td className="px-3 sm:px-4 lg:px-6 py-4 text-right">
        <div className="flex items-center justify-end gap-3">
          {session.zoomStartUrl && !isCancelled && (
            <a
              href={session.zoomStartUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] bg-[#0d4b5b] text-white px-4 py-2 rounded-[6px] hover:bg-[#093946] transition-all font-bold uppercase tracking-widest"
            >
              Start
            </a>
          )}
          {!isCancelled && (
            <button onClick={onCancel} className="text-gray-400 hover:text-gray-700 transition-colors" title="Cancel">
              <XCircleIcon className="w-5 h-5 stroke-[1.5px]" />
            </button>
          )}
          <button onClick={onDelete} className="text-gray-400 hover:text-gray-700 transition-colors" title="Delete Permanent">
            <TrashIcon className="w-5 h-5 stroke-[1.5px]" />
          </button>
        </div>
      </td>
    </motion.tr>
  );
}

// Mobile Card Component
function MobileSessionCard({ session, classNameLookup, onCancel, onDelete }: any) {
  const isCancelled = session.isCancelled;

  return (
    <motion.div layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className={`bg-white p-5 rounded-2xl border ${isCancelled ? 'border-red-100 bg-red-50/10' : 'border-gray-100'} shadow-sm relative overflow-hidden`}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className={`flex flex-col items-center justify-center w-12 h-12 rounded-xl font-bold ${isCancelled ? "bg-gray-100 text-gray-400" : "bg-[#eef2f6] text-[#0d4b5b]"}`}>
            <span className="text-[10px] uppercase leading-none mb-0.5">{moment(session.startAt).format("MMM")}</span>
            <span className="text-lg leading-none">{moment(session.startAt).format("DD")}</span>
          </div>
          <div>
            <div className={`text-[13px] font-semibold ${isCancelled ? "text-gray-400" : "text-gray-800"}`}>{moment(session.startAt).format("dddd")}</div>
            <div className="text-xs text-gray-500 font-medium">
              {moment(session.startAt).format("h:mm A")}
            </div>
          </div>
        </div>
        {isCancelled && <span className="bg-red-100 text-red-600 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">Cancelled</span>}
      </div>

      <div className="mb-4">
        <h3 className={`text-[14px] font-bold mb-1 ${isCancelled ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
          {classNameLookup || "Independent Module"}
        </h3>
        <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded inline-block">
          Index {session.index}
        </span>
      </div>

      <div className="flex items-center gap-3 border-t border-gray-100 pt-4">
        {session.zoomStartUrl && !isCancelled && (
          <a href={session.zoomStartUrl} target="_blank" rel="noopener noreferrer" className="flex-1 bg-[#0d4b5b] text-white py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest text-center hover:bg-[#093946]">
            Start Session
          </a>
        )}
        {!isCancelled && (
          <button onClick={onCancel} className="p-2.5 bg-gray-50 text-gray-500 hover:text-gray-700 rounded-lg">
            <XCircleIcon className="w-5 h-5 stroke-[1.5px]" />
          </button>
        )}
        <button onClick={onDelete} className="p-2.5 bg-gray-50 text-gray-500 hover:text-gray-700 rounded-lg">
          <TrashIcon className="w-5 h-5 stroke-[1.5px]" />
        </button>
      </div>
    </motion.div>
  )
}

function EmptyState() {
  return (
    <div className="py-24 text-center">
      <CalendarDaysIcon className="w-12 h-12 text-gray-200 mx-auto mb-3" />
      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Master schedule synchronization complete. No sessions found.</p>
    </div>
  );
}