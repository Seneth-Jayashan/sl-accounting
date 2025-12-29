import {
  type KeyboardEvent as ReactKeyboardEvent,
  useEffect,
  useMemo,
  useState,
} from "react";
import SupportService, {
  type SupportMessage,
} from "../../../services/SupportService";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";

type Tab = "all" | "unreplied";

export default function SupportReply() {
  const [loading, setLoading] = useState<boolean>(true);
  const [list, setList] = useState<SupportMessage[]>([]);
  const [error, setError] = useState<string>("");

  const [selected, setSelected] = useState<SupportMessage | null>(null);
  const [reply, setReply] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [bulkDeleting, setBulkDeleting] = useState<boolean>(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
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
        if (sorted.length > 0) {
          // Do not auto-select first item for mobile friendliness (List first)
          // setSelected(sorted[0]);
          // setReply(sorted[0].reply ?? "");
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

  
  const repliedFilteredIds = useMemo(
    () => filtered.filter((m) => m.reply?.trim()).map((m) => m._id),
    [filtered]
  );

  const selectedPendingCount = useMemo(() => {
    const selectedSet = new Set(selectedIds);
    return list.filter((m) => selectedSet.has(m._id) && !m.reply?.trim()).length;
  }, [list, selectedIds]);

  // Show all messages in the left panel

  

  const onSelect = (m: SupportMessage) => {
    // If clicking same, do nothing (on mobile we want to keep it open, on desktop it stays open)
    if (selected?._id === m._id) return;
    
    setSelected(m);
    setReply(m.reply ?? "");
    // Scroll to top on mobile
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleBulkSelection = (id: string) => {
    const target = list.find((m) => m._id === id);
    if (!target?.reply?.trim()) return; // only allow selecting replied messages for bulk actions
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const clearBulkSelection = () => setSelectedIds([]);

  const toggleSelectAllFiltered = () => {
    if (repliedFilteredIds.length === 0) return;
    setSelectedIds((prev) => {
      const base = new Set(prev);
      const everySelected = repliedFilteredIds.every((id) => base.has(id));
      if (everySelected) {
        repliedFilteredIds.forEach((id) => base.delete(id));
      } else {
        repliedFilteredIds.forEach((id) => base.add(id));
      }
      return Array.from(base);
    });
  };

  // Allow pressing Escape to unselect the current message
  useEffect(() => {
    if (!selected) return;
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelected(null);
        setReply("");
        setError("");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected]);

  const hasChanges = useMemo(() => {
    if (!selected) return false;
    return reply.trim() !== (selected.reply ?? "").trim();
  }, [reply, selected]);

  const handleReplyKeyDown = (e: ReactKeyboardEvent<HTMLTextAreaElement>) => {
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
      setSelectedIds((prev) => prev.filter((x) => x !== id));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (selectedPendingCount > 0) {
      setError("Bulk delete is allowed only for replied messages.");
      return;
    }
    const ok = window.confirm(
      `Delete ${selectedIds.length} message${selectedIds.length > 1 ? "s" : ""}? This cannot be undone.`
    );
    if (!ok) return;
    setBulkDeleting(true);
    setError("");
    try {
      await Promise.all(selectedIds.map((id) => SupportService.remove(id)));
      setList((prev) => prev.filter((m) => !selectedIds.includes(m._id)));
      if (selected && selectedIds.includes(selected._id)) {
        setSelected(null);
        setReply("");
      }
      clearBulkSelection();
    } catch (e) {
      console.error(e);
      setError("Failed to delete selected messages. Please try again.");
    } finally {
      setBulkDeleting(false);
    }
  };

  return (
    <div className="bg-[#e9f0f7] h-[calc(100vh-64px)] overflow-hidden">
      <main className="h-full w-full max-w-7xl mx-auto flex flex-col lg:p-8">
        <div
          className={`p-4 lg:p-0 shrink-0 space-y-4 ${
            selected ? "hidden lg:block" : "block"
          }`}
        >
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-[#0b2540]">
                Support Messages
              </h1>
              <p className="text-sm text-gray-600">
                Review user questions, reply quickly, and keep the queue clean.
              </p>
            </div>
            <div className="inline-flex rounded-full bg-white shadow-sm border overflow-hidden text-sm">
              <button
                className={`px-4 py-2 transition ${
                  tab === "all"
                    ? "bg-[#0b2540] text-white"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
                onClick={() => setTab("all")}
              >
                All ({stats.total})
              </button>
              <button
                className={`px-4 py-2 transition ${
                  tab === "unreplied"
                    ? "bg-[#0b2540] text-white"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
                onClick={() => setTab("unreplied")}
              >
                Unreplied ({stats.unreplied})
              </button>
            </div>
          </div>

          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            Loading messages...
          </div>
        ) : (
          <div className="flex-1 flex overflow-hidden lg:gap-4 relative lg:pt-4">
            {/* List */}
            <div
              className={`flex-col bg-white lg:rounded-2xl border shadow-sm overflow-hidden ${
                selected
                  ? "hidden lg:flex lg:w-1/3"
                  : "flex w-full h-full lg:w-1/3"
              }`}
            >
              <div className="flex items-center justify-between border-b px-4 py-3 text-sm text-gray-600 shrink-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wide text-gray-500">
                    Inbox
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  {selectedIds.length > 0 ? (
                    <>
                      <span className="text-gray-500">
                        Selected: {selectedIds.length}
                      </span>
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 text-red-600 hover:text-red-700 disabled:opacity-50"
                        onClick={handleBulkDelete}
                        disabled={bulkDeleting || selectedPendingCount > 0}
                      >
                        Delete
                      </button>
                      <button
                        type="button"
                        className="text-gray-500 hover:text-gray-700 disabled:opacity-50"
                        onClick={clearBulkSelection}
                        disabled={bulkDeleting}
                      >
                        Clear
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      className="text-gray-500 hover:text-gray-700 disabled:opacity-50"
                      onClick={toggleSelectAllFiltered}
                      disabled={repliedFilteredIds.length === 0}
                    >
                      Select all replied
                    </button>
                  )}
                </div>
              </div>
              {filtered.length === 0 ? (
                <div className="p-6 text-sm text-gray-600 text-center space-y-2">
                  <div>No messages to show.</div>
                  <div className="text-xs text-gray-500">
                    New messages will land here automatically.
                  </div>
                </div>
              ) : (
                <ul className="divide-y overflow-auto min-h-0 flex-1">
                  {filtered.map((m) => {
                    const isActive = selected?._id === m._id;
                    const hasReply = Boolean(m.reply && m.reply.trim());
                    const isChecked = selectedIds.includes(m._id);
                    return (
                      <li
                        key={m._id}
                        className={`p-4 cursor-pointer transition hover:bg-gray-50 ${
                          isActive
                            ? "bg-[#0b2540]/5 border-l-4 border-[#0b2540]"
                            : ""
                        }`}
                        onClick={() => onSelect(m)}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 min-w-0">
                            <input
                              type="checkbox"
                              className="mt-1 h-4 w-4 flex-shrink-0"
                              checked={isChecked}
                              disabled={!hasReply}
                              title={
                                hasReply
                                  ? "Select for bulk delete"
                                  : "Only replied messages can be bulk deleted"
                              }
                              onChange={(e) => {
                                e.stopPropagation();
                                toggleBulkSelection(m._id);
                              }}
                              onClick={(e) => e.stopPropagation()}
                            />
                            <div className="min-w-0">
                              <div className="font-semibold text-[#0b2540] truncate">
                                {m.name}
                              </div>
                              <div className="text-xs text-gray-500 truncate">
                                {m.email} • {m.phoneNumber}
                              </div>
                            </div>
                          </div>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full ${
                              hasReply
                                ? "bg-green-100 text-green-700"
                                : "bg-yellow-100 text-yellow-700"
                            }`}
                          >
                            {hasReply ? "Replied" : "Pending"}
                          </span>
                        </div>
                        <div className="mt-2 text-sm text-gray-700 line-clamp-2">
                          {m.message}
                        </div>

                        {m.createdAt && (
                          <div className="mt-1 text-[11px] text-gray-400">
                            {new Date(m.createdAt).toLocaleString()}
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* Detail + Reply */}
            <div
              className={`flex-col bg-white lg:rounded-2xl border shadow-sm overflow-hidden ${
                selected
                  ? "flex w-full h-full absolute inset-0 z-50 lg:static lg:z-auto lg:w-2/3"
                  : "hidden lg:flex lg:w-2/3"
              }`}
            >
              <div className="h-full flex flex-col">
                {selected && (
                  <div className="lg:hidden flex items-center border-b px-4 py-3 bg-white shrink-0">
                    <button
                      onClick={() => setSelected(null)}
                      className="mr-3 text-gray-600 hover:bg-gray-100 p-1 rounded-full"
                    >
                      <ArrowLeftIcon className="w-5 h-5" />
                    </button>
                    <span className="font-semibold text-[#0b2540]">Details</span>
                  </div>
                )}
                <div className="flex-1 overflow-y-auto p-5">
                  {!selected ? (
                    <div className="text-gray-500 flex items-center justify-center h-full">
                      Select a message to view and reply.
                    </div>
                  ) : (
                    <div className="space-y-3 pb-1">
                      <div className="flex flex-col gap-3">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                          <div>
                            <div className="text-lg font-semibold text-[#0b2540]">
                              {selected.name}
                            </div>
                            <div className="text-sm text-gray-500 space-x-2">
                              <a
                                className="hover:underline"
                                href={`mailto:${selected.email}`}
                              >
                                {selected.email}
                              </a>
                              <span>•</span>
                              <a
                                className="hover:underline"
                                href={`tel:${selected.phoneNumber}`}
                              >
                                {selected.phoneNumber}
                              </a>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-500 flex-wrap">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium ${
                                selected.reply?.trim()
                                  ? "bg-green-50 text-green-700"
                                  : "bg-yellow-50 text-yellow-700"
                              }`}
                            >
                              {selected.reply?.trim() ? "Replied" : "Pending"}
                            </span>
                            {selected.createdAt && (
                              <span className="text-gray-400">
                                {new Date(selected.createdAt).toLocaleString()}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="rounded-lg border bg-gray-50 p-3 space-y-2">
                          <div className="text-xs font-semibold text-[#0b2540]">
                            User message
                          </div>
                          <div className="whitespace-pre-wrap break-words text-sm text-gray-800 leading-relaxed">
                            {selected.message}
                          </div>
                        </div>
                      </div>

                      {selected.reply?.trim() ? (
                        <div className="rounded-lg border bg-green-50/70 p-3 space-y-2">
                          <div className="text-xs font-semibold text-green-800">
                            Reply sent
                          </div>
                          <div className="whitespace-pre-wrap break-words text-sm text-gray-800 bg-white/60 border border-green-100 rounded-md p-2 leading-relaxed">
                            {selected.reply}
                          </div>
                          <div className="flex justify-end pt-1">
                            <button
                              onClick={() => void handleDelete(selected._id)}
                              disabled={deletingId === selected._id}
                              className="inline-flex whitespace-nowrap items-center justify-center rounded-md border border-red-200 text-red-700 px-4 py-2 text-sm hover:bg-red-50 disabled:opacity-60"
                            >
                              {deletingId === selected._id
                                ? "Deleting..."
                                : "Delete"}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="rounded-lg border bg-white p-3 space-y-3">
                          <div className="flex items-center justify-between text-xs font-medium text-gray-600">
                            <span>Your reply</span>
                            <span className="text-[11px] text-gray-400">
                              Press Ctrl/Cmd + Enter to send
                            </span>
                          </div>
                          <textarea
                            className="w-full rounded-md border p-2.5 text-sm outline-none focus:ring-2 focus:ring-[#0b2540]/40 min-h-[140px] resize-y"
                            rows={8}
                            value={reply}
                            onChange={(e) => setReply(e.target.value)}
                            onKeyDown={handleReplyKeyDown}
                            placeholder="Type your response to the user..."
                          />
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>
                              {hasChanges
                                ? "Unsaved changes"
                                : selected.reply?.trim()
                                ? "Last reply saved"
                                : "No reply sent yet"}
                            </span>
                            <span>{reply.trim().length} chars</span>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              onClick={handleSubmit}
                              disabled={submitting || reply.trim() === ""}
                              className="inline-flex items-center justify-center rounded-md bg-[#0b2540] px-4 py-2 text-white hover:opacity-95 disabled:opacity-60"
                            >
                              {submitting ? "Sending..." : "Send reply"}
                            </button>
                            <button
                              type="button"
                              onClick={handleReset}
                              disabled={!hasChanges || submitting}
                              className="inline-flex items-center justify-center rounded-md border px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                            >
                              Reset
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
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