import { useEffect, useMemo, useState } from "react";
import SupportService, { type SupportMessage } from "../../../services/SupportService";
import { 
  ArrowLeftIcon, 
  InboxIcon, 
  CheckCircleIcon, 
  ChatBubbleLeftRightIcon,
  TrashIcon,
  PaperAirplaneIcon,
  ArrowPathIcon
} from "@heroicons/react/24/outline";

type Tab = "all" | "unreplied";

export default function SupportReply() {
  const [loading, setLoading] = useState<boolean>(true);
  const [list, setList] = useState<SupportMessage[]>([]);
  const [error, setError] = useState<string>("");

  const [selected, setSelected] = useState<SupportMessage | null>(null);
  const [reply, setReply] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("all");

  const stats = useMemo(() => {
    const unreplied = list.filter((m) => !m.reply || m.reply.trim() === "").length;
    const total = list.length;
    return {
      total,
      unreplied,
      replied: Math.max(total - unreplied, 0),
    };
  }, [list]);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError("");
    SupportService.list()
      .then((items) => {
        if (!mounted) return;
        // Sort newest first
        const sorted = [...items].sort((a, b) => {
          const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return db - da;
        });
        setList(sorted);
        // Only auto-select on desktop to prevent mobile jumping
        if (window.innerWidth >= 1024 && sorted.length > 0) {
          setSelected(sorted[0]);
          setReply(sorted[0].reply ?? "");
        }
      })
      .catch((e) => {
        console.error(e);
        setError("Failed to load support messages.");
      })
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, []);

  const filtered = useMemo(() => {
    if (tab === "unreplied")
      return list.filter((m) => !m.reply || m.reply.trim() === "");
    return list;
  }, [list, tab]);

  const onSelect = (m: SupportMessage) => {
    // If clicking same, do nothing (on mobile we want to keep it open, on desktop it stays open)
    if (selected?._id === m._id) return;
    
    setSelected(m);
    setReply(m.reply ?? "");
    // Scroll to top on mobile
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToList = () => {
    setSelected(null);
    setReply("");
  };

  const hasChanges = useMemo(() => {
    if (!selected) return false;
    return reply.trim() !== (selected.reply ?? "").trim();
  }, [reply, selected]);

  const handleReplyKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      void handleSubmit();
    }
  };

  const handleReset = () => {
    if (!selected) return;
    setReply(selected.reply ?? "");
    setError("");
  };

  const handleSubmit = async () => {
    if (!selected) return;
    const body = reply.trim();
    if (!body) {
      setError("Reply cannot be empty.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const updated = await SupportService.reply(selected._id, {
        name: selected.name,
        email: selected.email,
        phoneNumber: selected.phoneNumber,
        message: selected.message,
        reply: body,
      });

      setList((prev) => prev.map((m) => (m._id === updated._id ? updated : m)));
      setSelected(updated);
      setReply(updated.reply ?? "");
    } catch (e) {
      console.error(e);
      setError("Failed to send reply. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!id) return;
    const ok = window.confirm("Delete this contact message? This cannot be undone.");
    if (!ok) return;
    setDeletingId(id);
    try {
      await SupportService.remove(id);
      setList((prev) => prev.filter((m) => m._id !== id));
      if (selected?._id === id) {
        setSelected(null);
        setReply("");
      }
    } catch (e) {
      console.error(e);
      setError("Failed to delete message.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="bg-[#e9f0f7] min-h-[calc(100vh-4rem)]">
      <main className="p-4 lg:p-8 pb-24 lg:pb-10 flex justify-center">
        <div className="w-full max-w-7xl space-y-4 lg:space-y-6">
          
          {/* HEADER (Visible on Desktop or Mobile List View) */}
          <div className={`${selected ? 'hidden lg:block' : 'block'}`}>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-4">
              <div>
                <h1 className="text-2xl lg:text-3xl font-semibold text-[#0b2540]">Support Messages</h1>
                <p className="text-sm text-gray-600">Review user questions and replies.</p>
              </div>
              
              {/* Tab Switcher */}
              <div className="inline-flex rounded-xl bg-white shadow-sm border p-1 self-start md:self-auto">
                <button
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                    tab === "all" ? "bg-[#0b2540] text-white shadow-md" : "text-gray-500 hover:bg-gray-50"
                  }`}
                  onClick={() => setTab("all")}
                >
                  All ({stats.total})
                </button>
                <button
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                    tab === "unreplied" ? "bg-[#0b2540] text-white shadow-md" : "text-gray-500 hover:bg-gray-50"
                  }`}
                  onClick={() => setTab("unreplied")}
                >
                  Unreplied ({stats.unreplied})
                </button>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-2 lg:gap-4 mb-2">
              <StatCard icon={<InboxIcon className="w-4 h-4"/>} label="Open" value={stats.unreplied} sub="Pending" />
              <StatCard icon={<CheckCircleIcon className="w-4 h-4"/>} label="Replied" value={stats.replied} sub="Done" />
              <StatCard icon={<ChatBubbleLeftRightIcon className="w-4 h-4"/>} label="Total" value={stats.total} sub="All Time" />
            </div>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 mb-4 font-medium flex items-center gap-2">
                <span className="text-lg">⚠️</span> {error}
              </div>
            )}
          </div>

          {/* MAIN LAYOUT: LIST vs DETAIL */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:h-[600px]">
            
            {/* --- LIST COLUMN (Hidden on Mobile if item selected) --- */}
            <div className={`lg:col-span-1 flex-col h-full bg-white rounded-2xl border shadow-sm overflow-hidden ${selected ? 'hidden lg:flex' : 'flex'}`}>
              <div className="flex items-center justify-between border-b px-4 py-3 bg-gray-50/50">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  {tab === "unreplied" ? "Pending Queue" : "All Messages"}
                </span>
                <span className="rounded-full bg-[#0b2540]/10 px-2 py-0.5 text-[10px] font-bold text-[#0b2540]">
                  {filtered.length}
                </span>
              </div>

              <div className="flex-1 overflow-y-auto">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-2">
                    <ArrowPathIcon className="w-6 h-6 animate-spin" />
                    <span className="text-xs font-medium">Loading...</span>
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="p-10 text-center space-y-2">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto text-gray-400">
                        <InboxIcon className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-medium text-gray-900">All caught up!</p>
                    <p className="text-xs text-gray-500">No messages found in this view.</p>
                  </div>
                ) : (
                  <ul className="divide-y divide-gray-50">
                    {filtered.map((m) => {
                      const isActive = selected?._id === m._id;
                      const hasReply = Boolean(m.reply && m.reply.trim());
                      return (
                        <li
                          key={m._id}
                          className={`p-4 cursor-pointer transition-all hover:bg-gray-50 active:bg-gray-100 ${
                            isActive ? "bg-[#0b2540]/5 border-l-4 border-[#0b2540]" : "border-l-4 border-transparent"
                          }`}
                          onClick={() => onSelect(m)}
                        >
                          <div className="flex justify-between items-start mb-1">
                            <h3 className={`text-sm font-bold truncate ${isActive ? 'text-[#0b2540]' : 'text-gray-700'}`}>
                                {m.name}
                            </h3>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                                hasReply ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                            }`}>
                                {hasReply ? "Replied" : "Open"}
                            </span>
                          </div>
                          
                          <p className="text-xs text-gray-500 line-clamp-2 mb-2 leading-relaxed">{m.message}</p>
                          
                          <div className="flex justify-between items-end">
                             <div className="text-[10px] text-gray-400 font-medium">
                                {m.createdAt ? new Date(m.createdAt).toLocaleDateString() : ""}
                             </div>
                             {isActive && <div className="text-[10px] font-bold text-[#0b2540]">Viewing &rarr;</div>}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>

            {/* --- DETAIL COLUMN (Hidden on Mobile if nothing selected) --- */}
            <div className={`lg:col-span-2 flex-col h-full bg-white rounded-2xl border shadow-sm overflow-hidden ${selected ? 'flex fixed inset-0 z-50 lg:static lg:z-auto' : 'hidden lg:flex'}`}>
              
              {/* Mobile Back Header */}
              <div className="lg:hidden flex items-center gap-2 p-4 border-b bg-white shrink-0">
                 <button onClick={handleBackToList} className="p-2 -ml-2 rounded-full hover:bg-gray-100">
                    <ArrowLeftIcon className="w-5 h-5 text-gray-600" />
                 </button>
                 <span className="font-bold text-gray-800">Message Details</span>
              </div>

              {!selected ? (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8 text-center">
                  <ChatBubbleLeftRightIcon className="w-16 h-16 mb-4 opacity-20" />
                  <p className="text-sm font-medium">Select a message from the list to view details.</p>
                </div>
              ) : (
                <div className="flex-1 flex flex-col h-full overflow-hidden">
                  
                  {/* Content Scroll Area */}
                  <div className="flex-1 overflow-y-auto p-5 lg:p-8 space-y-6">
                    
                    {/* User Info Card */}
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <h2 className="text-lg font-bold text-[#0b2540]">{selected.name}</h2>
                                <p className="text-xs text-gray-500">{selected.createdAt ? new Date(selected.createdAt).toLocaleString() : ""}</p>
                            </div>
                            <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase ${selected.reply?.trim() ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                                {selected.reply?.trim() ? "Status: Replied" : "Status: Pending"}
                            </span>
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm mt-3">
                            <a href={`mailto:${selected.email}`} className="text-blue-600 hover:underline font-medium">{selected.email}</a>
                            <a href={`tel:${selected.phoneNumber}`} className="text-blue-600 hover:underline font-medium">{selected.phoneNumber}</a>
                        </div>
                    </div>

                    {/* Message Body */}
                    <div>
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Inquiry</h3>
                        <div className="bg-white text-gray-800 text-sm leading-relaxed whitespace-pre-wrap">
                            {selected.message}
                        </div>
                    </div>

                    <div className="border-t border-gray-100 my-4"></div>

                    {/* Reply Section */}
                    <div className="space-y-3 pb-20 lg:pb-0">
                        <div className="flex justify-between items-end">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                                {selected.reply?.trim() ? "Sent Reply" : "Your Response"}
                            </h3>
                            {!selected.reply?.trim() && (
                                <span className="text-[10px] text-gray-400 hidden lg:inline">Ctrl + Enter to send</span>
                            )}
                        </div>

                        {selected.reply?.trim() ? (
                            <div className="bg-green-50 border border-green-100 p-4 rounded-xl text-sm text-gray-800 whitespace-pre-wrap">
                                {selected.reply}
                            </div>
                        ) : (
                            <textarea
                                className="w-full rounded-xl border border-gray-300 p-4 text-sm focus:border-[#0b2540] focus:ring-2 focus:ring-[#0b2540]/20 outline-none transition-all resize-none bg-gray-50 focus:bg-white"
                                rows={8}
                                value={reply}
                                onChange={(e) => setReply(e.target.value)}
                                onKeyDown={handleReplyKeyDown}
                                placeholder="Type your reply here..."
                            />
                        )}
                        
                        {/* Status Footer */}
                        <div className="flex items-center justify-between pt-2">
                            {hasChanges && !selected.reply?.trim() && (
                                <span className="text-xs text-amber-600 font-medium">Unsaved changes</span>
                            )}
                            {selected.reply?.trim() && (
                                <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                                    <CheckCircleIcon className="w-3 h-3" /> Reply sent
                                </span>
                            )}
                        </div>
                    </div>
                  </div>

                  {/* Sticky Footer Actions */}
                  <div className="p-4 bg-white border-t border-gray-100 flex items-center justify-between gap-3 shrink-0">
                     <button
                        onClick={() => handleDelete(selected._id)}
                        disabled={deletingId === selected._id}
                        className="p-3 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                        title="Delete Message"
                     >
                        <TrashIcon className="w-5 h-5" />
                     </button>

                     <div className="flex items-center gap-3">
                        {(!selected.reply?.trim() && hasChanges) && (
                            <button onClick={handleReset} className="text-xs font-bold text-gray-500 hover:text-gray-800 px-4">
                                Reset
                            </button>
                        )}
                        
                        {!selected.reply?.trim() && (
                            <button
                                onClick={handleSubmit}
                                disabled={submitting || !reply.trim()}
                                className="bg-[#0b2540] text-white px-6 py-3 rounded-xl text-sm font-bold shadow-lg hover:bg-[#154666] disabled:opacity-50 disabled:shadow-none flex items-center gap-2 transition-all active:scale-95"
                            >
                                {submitting ? <ArrowPathIcon className="w-4 h-4 animate-spin"/> : <PaperAirplaneIcon className="w-4 h-4" />}
                                {submitting ? "Sending..." : "Send Reply"}
                            </button>
                        )}
                     </div>
                  </div>

                </div>
              )}
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}

// Compact Stat Card
function StatCard({ icon, label, value, sub }: any) {
    return (
        <div className="bg-white p-3 lg:p-4 rounded-2xl border shadow-sm flex flex-col justify-between h-full">
            <div className="flex items-center gap-2 text-gray-400 mb-1">
                {icon}
                <span className="text-[10px] uppercase font-bold tracking-wider">{label}</span>
            </div>
            <div>
                <span className="text-xl lg:text-2xl font-bold text-[#0b2540] block leading-none">{value}</span>
                <span className="text-[10px] text-gray-400 font-medium">{sub}</span>
            </div>
        </div>
    )
}