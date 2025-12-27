import { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import moment from "moment";
import { motion, AnimatePresence } from "framer-motion";
import ClassService from "../../../services/ClassService";
import SessionService, { type SessionData } from "../../../services/SessionService";
import {
  VideoCameraIcon,
  CalendarDaysIcon,
  ClockIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  TrashIcon,
  XCircleIcon,
  ArrowTopRightOnSquareIcon,
  ArrowPathIcon
} from "@heroicons/react/24/outline";

export default function SessionsPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"upcoming" | "past">("upcoming");
  const [searchTerm, setSearchTerm] = useState("");
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [classMap, setClassMap] = useState<Record<string, string>>({});

  // 1. Sync All Data (Handling the forEach Error)
  const syncData = useCallback(async () => {
    setLoading(true);
    try {
      const [classRes, sessionRes] = await Promise.all([
        ClassService.getAllClasses(),
        SessionService.getAllSessions()
      ]);

      // --- FIX: Correctly access classes from the response object ---
      // Usually your service returns { success: true, classes: [...] }
      const classesArray = (classRes as any).classes || (classRes as any).class || (Array.isArray(classRes) ? classRes : []);
      
      const mapping: Record<string, string> = {};
      classesArray.forEach((c: any) => {
        mapping[c._id] = c.name;
      });
      setClassMap(mapping);

      // Sort chronological (Earliest first)
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
    const reason = window.prompt("Reason for cancellation:");
    if (reason === null) return;
    try {
      await SessionService.cancelSession(sessionId, reason);
      setSessions(prev => prev.map(s => s._id === sessionId ? { ...s, isCancelled: true } : s));
    } catch (error) {
      alert("Failed to cancel.");
    }
  };

  const handleDelete = async (sessionId: string) => {
    if (!window.confirm("Permanently delete this session record?")) return;
    try {
      await SessionService.deleteSession(sessionId);
      setSessions(prev => prev.filter(s => s._id !== sessionId));
    } catch (error) {
      alert("Delete failed.");
    }
  };

  return (
      <div className="p-6 max-w-7xl mx-auto space-y-6 pb-24 animate-in fade-in duration-500">
        
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold text-brand-prussian tracking-tight">Master Schedule</h1>
            <p className="text-gray-500 text-sm font-medium">Orchestrating live sessions across all curriculum modules.</p>
          </div>

          <div className="flex items-center gap-3 w-full lg:w-auto">
            {/* NEW CREATE BUTTON */}
            <button
              onClick={() => navigate("/admin/sessions/create")}
              className="flex items-center justify-center gap-2 bg-brand-cerulean hover:bg-brand-prussian text-white px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-md shadow-brand-cerulean/20 active:scale-95 flex-1 sm:flex-none"
            >
              <PlusIcon className="w-4 h-4 stroke-[3px]" />
              Create Session
            </button>

            <div className="flex items-center bg-brand-aliceBlue p-1 rounded-xl border border-brand-aliceBlue">
              {(["upcoming", "past"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-2 text-[10px] font-bold rounded-lg transition-all uppercase tracking-widest ${
                    activeTab === tab ? "bg-white text-brand-cerulean shadow-sm" : "text-gray-400 hover:text-brand-prussian"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative group">
          <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-brand-cerulean transition-colors" />
          <input
            type="text"
            placeholder="Filter sessions by module name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white border border-brand-aliceBlue rounded-xl focus:ring-2 focus:ring-brand-cerulean/10 outline-none text-sm font-medium text-brand-prussian transition-all shadow-sm"
          />
        </div>

        {/* Schedule Table */}
        {loading ? (
          <div className="py-32 flex flex-col items-center justify-center gap-3">
             <ArrowPathIcon className="w-8 h-8 animate-spin text-brand-cerulean" />
             <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest animate-pulse">Synchronizing Schedule...</p>
          </div>
        ) : (
          <div className="bg-white border border-brand-aliceBlue rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-brand-aliceBlue/30 text-[10px] uppercase text-brand-prussian/40 font-bold tracking-widest border-b border-brand-aliceBlue">
                  <tr>
                    <th className="px-8 py-4">Timeline</th>
                    <th className="px-8 py-4">Module</th>
                    <th className="px-8 py-4 text-center">Connectivity</th>
                    <th className="px-8 py-4 text-right">Management</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-aliceBlue/30">
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
        )}
      </div>
  );
}

// --- Internal Sub-components ---

function SessionRow({ session, classNameLookup, onCancel, onDelete }: any) {
  const isCancelled = session.isCancelled;

  return (
    <motion.tr layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className={`group transition-colors ${isCancelled ? "bg-red-50/20" : "hover:bg-brand-aliceBlue/10"}`}>
      
      <td className="px-8 py-5 whitespace-nowrap">
        <div className="flex items-center gap-4">
          <div className={`flex flex-col items-center justify-center w-10 h-10 rounded-xl font-bold ${isCancelled ? "bg-gray-200 text-gray-500" : "bg-brand-aliceBlue text-brand-cerulean"}`}>
            <span className="text-[8px] uppercase leading-none">{moment(session.startAt).format("MMM")}</span>
            <span className="text-lg leading-none mt-0.5">{moment(session.startAt).format("DD")}</span>
          </div>
          <div>
            <div className={`text-sm font-semibold ${isCancelled ? "text-gray-400" : "text-brand-prussian"}`}>{moment(session.startAt).format("dddd")}</div>
            <div className="text-[11px] text-gray-400 font-medium flex items-center gap-1 mt-0.5">
              <ClockIcon className="w-3.5 h-3.5" /> {moment(session.startAt).format("h:mm A")}
            </div>
          </div>
        </div>
      </td>

      <td className="px-8 py-5">
        <p className={`text-sm font-semibold truncate max-w-[220px] ${isCancelled ? 'text-gray-300 line-through' : 'text-brand-prussian'}`}>
          {classNameLookup || "Independent Module"}
        </p>
        <span className="text-[9px] font-bold text-brand-cerulean uppercase tracking-widest bg-brand-aliceBlue px-1.5 py-0.5 rounded mt-1 inline-block">
          Index {session.index}
        </span>
      </td>

      <td className="px-8 py-5 text-center">
        <div className={`inline-flex p-2 rounded-lg transition-all ${session.zoomMeetingId && !isCancelled ? "bg-green-50 text-green-600" : "bg-gray-50 text-gray-300"}`}>
          <VideoCameraIcon className="w-4 h-4" />
        </div>
      </td>

      <td className="px-8 py-5 text-right">
        <div className="flex items-center justify-end gap-2">
          {session.zoomStartUrl && !isCancelled && (
            <a
              href={session.zoomStartUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] bg-brand-prussian text-white px-4 py-1.5 rounded-lg hover:bg-brand-cerulean transition-all font-bold uppercase tracking-wider flex items-center gap-2"
            >
              Start <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5 stroke-[2.5px]" />
            </a>
          )}
          {!isCancelled && (
            <button onClick={onCancel} className="p-2 text-gray-300 hover:text-orange-500 transition-colors" title="Cancel">
              <XCircleIcon className="w-5 h-5" />
            </button>
          )}
          <button onClick={onDelete} className="p-2 text-gray-300 hover:text-red-500 transition-colors" title="Delete Permanent">
            <TrashIcon className="w-5 h-5" />
          </button>
        </div>
      </td>
    </motion.tr>
  );
}

function EmptyState() {
  return (
    <div className="py-24 text-center">
      <CalendarDaysIcon className="w-12 h-12 text-gray-200 mx-auto mb-3" />
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Master schedule synchronization complete. No sessions found.</p>
    </div>
  );
}