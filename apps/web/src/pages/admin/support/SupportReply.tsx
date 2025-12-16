import { useEffect, useMemo, useState } from "react";
import SidebarAdmin from "../../../components/sidebar/SidebarAdmin";
import BottomNavAdmin from "../../../components/bottomNavbar/BottomNavAdmin";
import DashboardLayout from "../../../layouts/DashboardLayout";
import SupportService, {
  type SupportMessage,
} from "../../../services/SupportService";

type Tab = "all" | "unreplied";

export default function SupportReply() {
  const [loading, setLoading] = useState<boolean>(true);
  const [list, setList] = useState<SupportMessage[]>([]);
  const [error, setError] = useState<string>("");
  // collapsed state is managed by DashboardLayout when using Sidebar prop

  const [selected, setSelected] = useState<SupportMessage | null>(null);
  const [reply, setReply] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("all");

  const stats = useMemo(() => {
    const unreplied = list.filter(
      (m) => !m.reply || m.reply.trim() === ""
    ).length;
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
          setSelected(sorted[0]);
          setReply(sorted[0].reply ?? "");
        }
      })
      .catch((e) => {
        console.error(e);
        setError("Failed to load support messages.");
      })
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  const filtered = useMemo(() => {
    if (tab === "unreplied")
      return list.filter((m) => !m.reply || m.reply.trim() === "");
    return list;
  }, [list, tab]);

  // Limit visible messages in the list to 5 for the left panel
  const visibleList = useMemo(() => filtered.slice(0, 5), [filtered]);

  const onSelect = (m: SupportMessage) => {
    // Toggle selection: clicking an already-selected message will unselect it
    if (selected?._id === m._id) {
      setSelected(null);
      setReply("");
      setError("");
      return;
    }
    setSelected(m);
    setReply(m.reply ?? "");
  };

  // Allow pressing Escape to unselect the current message
  useEffect(() => {
    if (!selected) return;
    const onKey = (e: KeyboardEvent) => {
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

      // Update list and selected
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
    const ok = window.confirm(
      "Delete this contact message? This cannot be undone."
    );
    if (!ok) return;
    setDeletingId(id);
    setError("");
    try {
      await SupportService.remove(id);
      setList((prev) => prev.filter((m) => m._id !== id));
      if (selected?._id === id) {
        setSelected(null);
        setReply("");
      }
    } catch (e) {
      console.error(e);
      setError("Failed to delete message. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <DashboardLayout
      Sidebar={SidebarAdmin}
      BottomNav={BottomNavAdmin}
      showHeader={false}
    >
      <div className="bg-[#e9f0f7]">
        <main className="p-4 lg:p-8 pb-24 lg:pb-10 overflow-x-hidden flex justify-center">
          <div className="w-full max-w-7xl space-y-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-3xl font-semibold text-[#0b2540]">
                  Support Messages
                </h1>
                <p className="text-sm text-gray-600">
                  Review user questions, reply quickly, and keep the queue
                  clean.
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-2xl border bg-white p-5 shadow-sm">
                <div className="text-xs uppercase tracking-wide text-gray-500">
                  Open
                </div>
                <div className="mt-1 text-2xl font-semibold text-[#0b2540]">
                  {stats.unreplied}
                </div>
                <div className="text-xs text-gray-500">Pending reply</div>
              </div>
              <div className="rounded-2xl border bg-white p-5 shadow-sm">
                <div className="text-xs uppercase tracking-wide text-gray-500">
                  Replied
                </div>
                <div className="mt-1 text-2xl font-semibold text-[#0b2540]">
                  {stats.replied}
                </div>
                <div className="text-xs text-gray-500">
                  Answered and emailed
                </div>
              </div>
              <div className="rounded-2xl border bg-white p-5 shadow-sm">
                <div className="text-xs uppercase tracking-wide text-gray-500">
                  Total
                </div>
                <div className="mt-1 text-2xl font-semibold text-[#0b2540]">
                  {stats.total}
                </div>
                <div className="text-xs text-gray-500">
                  All received messages
                </div>
              </div>
            </div>

            {error && (
              <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {loading ? (
              <div className="flex items-center justify-center py-20 text-gray-500">
                Loading messages...
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* List */}
                <div className="lg:col-span-1 rounded-2xl border bg-white shadow-md flex flex-col h-[520px] lg:h-[560px]">
                  <div className="flex items-center justify-between border-b px-4 py-3 text-sm text-gray-600">
                    <span>
                      {tab === "unreplied" ? "Unreplied queue" : "All messages"}
                    </span>
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                      {filtered.length}
                    </span>
                  </div>
                  {filtered.length === 0 ? (
                    <div className="p-6 text-sm text-gray-600 text-center space-y-2">
                      <div>No messages to show.</div>
                      <div className="text-xs text-gray-500">
                        New messages will land here automatically.
                      </div>
                    </div>
                  ) : (
                    <ul className="divide-y overflow-auto min-h-0">
                      {visibleList.map((m) => {
                        const isActive = selected?._id === m._id;
                        const hasReply = Boolean(m.reply && m.reply.trim());
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
                              <div className="min-w-0">
                                <div className="font-semibold text-[#0b2540] truncate">
                                  {m.name}
                                </div>
                                <div className="text-xs text-gray-500 truncate">
                                  {m.email} • {m.phoneNumber}
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
                <div className="lg:col-span-2 rounded-2xl border bg-white p-5 shadow-md h-[520px] lg:h-[560px] overflow-hidden">
                  <div className="h-full overflow-auto">
                    {!selected ? (
                      <div className="text-gray-500 flex items-center justify-center h-full">
                        Select a message to view and reply.
                      </div>
                    ) : (
                      <div className="space-y-5">
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
                          <div className="flex items-center gap-3 text-xs text-gray-500 flex-wrap">
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
                              <span className="text-gray-400 max-w-[160px] truncate">
                                {new Date(selected.createdAt).toLocaleString()}
                              </span>
                            )}
                          </div>
                        </div>

                        <div>
                          <div className="text-xs font-medium text-gray-500">
                            User Message
                          </div>
                          <div className="mt-2 whitespace-pre-wrap break-words rounded-md border bg-gray-50 p-3 text-sm text-gray-800">
                            {selected.message}
                          </div>
                        </div>

                        {selected.reply?.trim() ? (
                          <div>
                            <div className="text-xs font-medium text-gray-500">
                              Your Reply
                            </div>
                            <div className="mt-2 whitespace-pre-wrap break-words rounded-md border bg-green-50 p-3 text-sm text-gray-800">
                              {selected.reply}
                            </div>
                            <div className="mt-2 text-xs text-gray-500">
                              Reply has been sent to the user.
                            </div>
                            <div className="mt-8 flex">
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
                          <div>
                            <div className="flex items-center justify-between text-xs font-medium text-gray-500">
                              <span>Your Reply</span>
                              <span className="text-[11px] text-gray-400">
                                Press Ctrl/Cmd + Enter to send
                              </span>
                            </div>
                            <textarea
                              className="mt-1 w-full rounded-md border p-3 text-sm outline-none focus:ring-2 focus:ring-[#0b2540]/40"
                              rows={7}
                              value={reply}
                              onChange={(e) => setReply(e.target.value)}
                              onKeyDown={handleReplyKeyDown}
                              placeholder="Type your response to the user..."
                            />
                            <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                              <span>
                                {hasChanges
                                  ? "Unsaved changes"
                                  : selected.reply?.trim()
                                  ? "Last reply saved"
                                  : "No reply sent yet"}
                              </span>
                              <span>{reply.trim().length} chars</span>
                            </div>
                            <div className="mt-3 flex flex-wrap items-center gap-2">
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
            )}
          </div>
        </main>
      </div>
    </DashboardLayout>
  );
}
