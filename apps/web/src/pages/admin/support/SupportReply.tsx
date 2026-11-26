import {
  type KeyboardEvent as ReactKeyboardEvent,
  useEffect,
  useMemo,
  useState,
  useCallback,
} from "react";
import SupportService, {
  type SupportMessage,
} from "../../../services/SupportService";
import {
  ArrowLeftIcon,
  ArrowPathIcon,
  InboxIcon,
  ClockIcon,
  CheckCircleIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  TrashIcon,
  PaperAirplaneIcon,
  EnvelopeIcon,
  PhoneIcon,
  ExclamationTriangleIcon,
  ChatBubbleLeftRightIcon,
} from "@heroicons/react/24/outline";

type Tab = "all" | "unreplied";

// --- Skeleton Loader ---

function SupportSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-28 bg-white rounded-2xl border border-slate-100 p-6"
          >
            <div className="h-3 w-24 bg-slate-200 rounded mb-4" />
            <div className="h-7 w-16 bg-slate-200 rounded" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 h-[540px]">
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-100 p-4 space-y-3">
          <div className="h-10 bg-slate-100 rounded-xl" />
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-slate-50 rounded-xl" />
          ))}
        </div>
        <div className="hidden lg:block lg:col-span-8 bg-white rounded-2xl border border-slate-100 p-6 space-y-4">
          <div className="h-12 w-1/2 bg-slate-100 rounded-xl" />
          <div className="h-32 bg-slate-50 rounded-xl" />
          <div className="h-40 bg-slate-50 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

// --- Main Component ---

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

  // Filters
  const [tab, setTab] = useState<Tab>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Reusable Delete Confirmation Modal
  const [confirmModal, setConfirmModal] = useState<{
    title: string;
    message: string;
    confirmLabel: string;
    onConfirm: () => Promise<void>;
  } | null>(null);

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

  const fetchMessages = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const items = await SupportService.list();
      const sorted = [...items].sort((a, b) => {
        const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return db - da;
      });
      setList(sorted);
    } catch (e) {
      console.error(e);
      setError("Failed to load support messages.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return list.filter((m) => {
      if (tab === "unreplied" && m.reply && m.reply.trim() !== "") return false;
      if (!q) return true;
      return (
        (m.name || "").toLowerCase().includes(q) ||
        (m.email || "").toLowerCase().includes(q) ||
        (m.phoneNumber || "") ||
        (m.message || "").toLowerCase().includes(q)
      );
    });
  }, [list, tab, searchQuery]);

  const repliedFilteredIds = useMemo(
    () => filtered.filter((m) => m.reply?.trim()).map((m) => m._id),
    [filtered]
  );

  const selectedPendingCount = useMemo(() => {
    const selectedSet = new Set(selectedIds);
    return list.filter((m) => selectedSet.has(m._id) && !m.reply?.trim()).length;
  }, [list, selectedIds]);

  const onSelect = (m: SupportMessage) => {
    if (selected?._id === m._id) {
      setSelected(null);
      setReply("");
      setError("");
      return;
    }
    setSelected(m);
    setReply(m.reply ?? "");
    setError("");
  };

  const toggleBulkSelection = (id: string) => {
    const target = list.find((m) => m._id === id);
    if (!target?.reply?.trim()) return;
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

  // Press Escape to unselect the current message
  useEffect(() => {
    if (!selected) return;
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape" && !confirmModal) {
        setSelected(null);
        setReply("");
        setError("");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected, confirmModal]);

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

  const requestDelete = (m: SupportMessage) => {
    setConfirmModal({
      title: "Delete support message?",
      message: `Are you sure you want to permanently delete the message from ${m.name}? This action cannot be undone.`,
      confirmLabel: "Delete Message",
      onConfirm: async () => {
        setDeletingId(m._id);
        setError("");
        try {
          await SupportService.remove(m._id);
          setList((prev) => prev.filter((item) => item._id !== m._id));
          if (selected?._id === m._id) {
            setSelected(null);
            setReply("");
          }
          setSelectedIds((prev) => prev.filter((x) => x !== m._id));
        } catch (e) {
          console.error(e);
          setError("Failed to delete message. Please try again.");
        } finally {
          setDeletingId(null);
        }
      },
    });
  };

  const requestBulkDelete = () => {
    if (selectedIds.length === 0) return;
    if (selectedPendingCount > 0) {
      setError(
        "Bulk delete is allowed only when all selected messages are replied."
      );
      return;
    }

    setConfirmModal({
      title: `Delete ${selectedIds.length} message${selectedIds.length > 1 ? "s" : ""
        }?`,
      message:
        "All selected replied messages will be permanently removed. This cannot be undone.",
      confirmLabel: `Delete (${selectedIds.length})`,
      onConfirm: async () => {
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
      },
    });
  };

  const executeConfirm = async () => {
    if (!confirmModal) return;
    await confirmModal.onConfirm();
    setConfirmModal(null);
  };

  const getInitials = (name?: string) =>
    name
      ? name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
      : "US";

  return (
    <div className="space-y-6 md:space-y-8 pb-24 md:pb-12">
      {/* HEADER */}
      <header
        className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${selected ? "hidden lg:flex" : "flex"
          }`}
      >
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-brand-prussian tracking-tight">
            Support Messages
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Review student inquiries, send quick responses, and keep your inbox clear.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200/80 shadow-sm">
            {(
              [
                { key: "all", label: "All", count: stats.total },
                { key: "unreplied", label: "Unreplied", count: stats.unreplied },
              ] as const
            ).map((item) => {
              const active = tab === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => setTab(item.key)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${active
                    ? "bg-brand-prussian text-white shadow-sm"
                    : "text-slate-500 hover:text-brand-prussian hover:bg-slate-50"
                    }`}
                >
                  <span>{item.label}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] tabular-nums ${active
                      ? "bg-white/20 text-white"
                      : "bg-slate-100 text-slate-500"
                      }`}
                  >
                    {item.count}
                  </span>
                </button>
              );
            })}
          </div>

          <button
            onClick={fetchMessages}
            disabled={loading}
            title="Refresh inbox"
            className="p-2.5 bg-white rounded-xl border border-slate-200/80 shadow-sm text-slate-600 hover:text-brand-cerulean hover:border-brand-cerulean/40 transition-colors disabled:opacity-50"
          >
            <ArrowPathIcon
              className={`w-4 h-4 ${loading ? "animate-spin text-brand-cerulean" : ""
                }`}
            />
          </button>
        </div>
      </header>

      {/* ERROR BANNER */}
      {error && (
        <div className="bg-rose-50 border border-rose-200/80 text-rose-700 px-4 py-3.5 rounded-2xl text-sm font-medium flex items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-2.5">
            <ExclamationTriangleIcon className="w-5 h-5 text-rose-500 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => setError("")}
            className="p-1 rounded-lg hover:bg-rose-100 text-rose-500"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* LOADING SKELETON */}
      {loading && list.length === 0 ? (
        <SupportSkeleton />
      ) : (
        <div className="space-y-6">
          {/* KPI SUMMARY CARDS */}
          <div
            className={`grid grid-cols-1 sm:grid-cols-3 gap-5 ${selected ? "hidden lg:grid" : "grid"
              }`}
          >
            <div className="relative overflow-hidden bg-white p-6 rounded-2xl border border-slate-200/70 shadow-sm">
              <div className="pointer-events-none absolute -top-10 -right-10 w-24 h-24 rounded-full bg-blue-500/10 blur-2xl" />
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Total Messages
                  </p>
                  <h3 className="text-3xl font-bold text-brand-prussian mt-2 tabular-nums">
                    {stats.total}
                  </h3>
                </div>
                <div className="p-3 rounded-xl bg-blue-50 text-blue-600 ring-1 ring-blue-100">
                  <InboxIcon className="w-5 h-5" />
                </div>
              </div>
            </div>

            <div className="relative overflow-hidden bg-white p-6 rounded-2xl border border-slate-200/70 shadow-sm">
              <div className="pointer-events-none absolute -top-10 -right-10 w-24 h-24 rounded-full bg-amber-500/10 blur-2xl" />
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Pending Reply
                  </p>
                  <h3 className="text-3xl font-bold text-brand-prussian mt-2 tabular-nums">
                    {stats.unreplied}
                  </h3>
                </div>
                <div className="p-3 rounded-xl bg-amber-50 text-amber-600 ring-1 ring-amber-100">
                  <ClockIcon className="w-5 h-5" />
                </div>
              </div>
            </div>

            <div className="relative overflow-hidden bg-white p-6 rounded-2xl border border-slate-200/70 shadow-sm">
              <div className="pointer-events-none absolute -top-10 -right-10 w-24 h-24 rounded-full bg-emerald-500/10 blur-2xl" />
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Replied
                  </p>
                  <h3 className="text-3xl font-bold text-brand-prussian mt-2 tabular-nums">
                    {stats.replied}
                  </h3>
                </div>
                <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
                  <CheckCircleIcon className="w-5 h-5" />
                </div>
              </div>
            </div>
          </div>

          {/* SPLIT-PANE INBOX & DETAIL */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:h-[620px]">
            {/* LEFT PANE: INBOX LIST */}
            <section
              className={`lg:col-span-5 xl:col-span-4 flex-col bg-white rounded-2xl border border-slate-200/70 shadow-sm overflow-hidden ${selected ? "hidden lg:flex" : "flex min-h-[480px]"
                }`}
            >
              {/* Search & Bulk Bar */}
              <div className="p-3.5 border-b border-slate-100 space-y-3 shrink-0 bg-slate-50/60">
                <div className="relative">
                  <MagnifyingGlassIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search sender, email, or message..."
                    className="w-full pl-9 pr-8 py-2 bg-white border border-slate-200/80 rounded-xl text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-cerulean/20 focus:border-brand-cerulean transition-all"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <XMarkIcon className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs px-0.5">
                  <span className="font-bold uppercase tracking-wider text-[10px] text-slate-400">
                    Inbox ({filtered.length})
                  </span>

                  <div className="flex items-center gap-2.5">
                    {selectedIds.length > 0 ? (
                      <>
                        <span className="text-slate-500 font-medium tabular-nums">
                          {selectedIds.length} selected
                        </span>
                        <button
                          type="button"
                          onClick={requestBulkDelete}
                          disabled={bulkDeleting || selectedPendingCount > 0}
                          title={
                            selectedPendingCount > 0
                              ? "Only replied messages can be bulk deleted"
                              : "Delete selected messages"
                          }
                          className="font-semibold text-rose-600 hover:text-rose-700 disabled:opacity-40"
                        >
                          Delete
                        </button>
                        <button
                          type="button"
                          onClick={clearBulkSelection}
                          disabled={bulkDeleting}
                          className="font-medium text-slate-400 hover:text-slate-600"
                        >
                          Clear
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={toggleSelectAllFiltered}
                        disabled={repliedFilteredIds.length === 0}
                        className="font-semibold text-brand-cerulean hover:text-brand-prussian disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        Select all replied
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Message List */}
              {filtered.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-3">
                    <InboxIcon className="w-6 h-6 text-slate-300" />
                  </div>
                  <p className="text-sm font-semibold text-brand-prussian">
                    No messages found
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    {searchQuery
                      ? "Try a different search term."
                      : "New student messages will appear here."}
                  </p>
                </div>
              ) : (
                <ul className="divide-y divide-slate-100 overflow-y-auto flex-1">
                  {filtered.map((m) => {
                    const isActive = selected?._id === m._id;
                    const hasReply = Boolean(m.reply && m.reply.trim());
                    const isChecked = selectedIds.includes(m._id);

                    return (
                      <li
                        key={m._id}
                        onClick={() => onSelect(m)}
                        className={`p-4 cursor-pointer transition-colors relative ${isActive
                          ? "bg-brand-aliceBlue/60 border-l-[3px] border-l-brand-cerulean"
                          : "hover:bg-slate-50/80 border-l-[3px] border-l-transparent"
                          }`}
                      >
                        <div className="flex items-start justify-between gap-2.5">
                          <div className="flex items-start gap-2.5 min-w-0">
                            <input
                              type="checkbox"
                              className="mt-1 h-4 w-4 rounded border-slate-300 text-brand-prussian focus:ring-brand-cerulean shrink-0 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                              checked={isChecked}
                              disabled={!hasReply}
                              title={
                                hasReply
                                  ? "Select for bulk delete"
                                  : "Only replied messages can be bulk deleted"
                              }
                              onClick={(e) => e.stopPropagation()}
                              onChange={() => toggleBulkSelection(m._id)}
                            />
                            <div className="min-w-0">
                              <p className="font-semibold text-sm text-brand-prussian truncate">
                                {m.name}
                              </p>
                              <p className="text-[11px] text-slate-400 truncate">
                                {m.email}
                              </p>
                            </div>
                          </div>

                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ring-1 shrink-0 ${hasReply
                              ? "bg-emerald-50 text-emerald-700 ring-emerald-600/15"
                              : "bg-amber-50 text-amber-700 ring-amber-600/15"
                              }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${hasReply ? "bg-emerald-500" : "bg-amber-500"
                                }`}
                            />
                            {hasReply ? "Replied" : "Pending"}
                          </span>
                        </div>

                        <p className="mt-2 text-xs text-slate-600 line-clamp-2 leading-relaxed pl-6">
                          {m.message}
                        </p>

                        {m.createdAt && (
                          <p className="mt-1.5 text-[10px] text-slate-400 pl-6 tabular-nums">
                            {new Date(m.createdAt).toLocaleString()}
                          </p>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            {/* RIGHT PANE: DETAIL & REPLY */}
            <section
              className={`lg:col-span-7 xl:col-span-8 flex-col bg-white rounded-2xl border border-slate-200/70 shadow-sm overflow-hidden ${selected ? "flex min-h-[520px]" : "hidden lg:flex"
                }`}
            >
              {!selected ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-3">
                    <ChatBubbleLeftRightIcon className="w-7 h-7 text-slate-300" />
                  </div>
                  <h3 className="text-sm font-semibold text-brand-prussian">
                    No message selected
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs">
                    Select a conversation from the inbox to read the full message and send a reply.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col h-full">
                  {/* Mobile Back Bar */}
                  <div className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/70 shrink-0">
                    <button
                      onClick={() => {
                        setSelected(null);
                        setReply("");
                      }}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-brand-prussian"
                    >
                      <ArrowLeftIcon className="w-4 h-4" />
                      Back to Inbox
                    </button>
                    <span className="text-xs font-semibold text-slate-400">
                      Message Details
                    </span>
                  </div>

                  {/* Sender Header */}
                  <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-11 h-11 rounded-full bg-brand-aliceBlue text-brand-cerulean ring-1 ring-brand-cerulean/20 flex items-center justify-center font-bold text-sm shrink-0">
                        {getInitials(selected.name)}
                      </div>
                      <div className="min-w-0">
                        <h2 className="text-base font-bold text-brand-prussian truncate">
                          {selected.name}
                        </h2>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 mt-0.5">
                          <a
                            href={`mailto:${selected.email}`}
                            className="inline-flex items-center gap-1 hover:text-brand-cerulean transition-colors truncate"
                          >
                            <EnvelopeIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            {selected.email}
                          </a>
                          {selected.phoneNumber && (
                            <a
                              href={`tel:${selected.phoneNumber}`}
                              className="inline-flex items-center gap-1 hover:text-brand-cerulean transition-colors font-mono"
                            >
                              <PhoneIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              {selected.phoneNumber}
                            </a>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 self-start sm:self-center shrink-0">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ring-1 ${selected.reply?.trim()
                          ? "bg-emerald-50 text-emerald-700 ring-emerald-600/15"
                          : "bg-amber-50 text-amber-700 ring-amber-600/15"
                          }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${selected.reply?.trim()
                            ? "bg-emerald-500"
                            : "bg-amber-500"
                            }`}
                        />
                        {selected.reply?.trim() ? "Replied" : "Pending"}
                      </span>

                      <button
                        onClick={() => requestDelete(selected)}
                        disabled={deletingId === selected._id}
                        title="Delete message"
                        className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200/70 transition-colors disabled:opacity-50"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Conversation & Reply Body */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-5">
                    {/* User Message Bubble */}
                    <div className="rounded-2xl bg-slate-50 border border-slate-200/70 p-4 sm:p-5 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                          User Message
                        </span>
                        {selected.createdAt && (
                          <span className="text-[11px] text-slate-400 tabular-nums">
                            {new Date(selected.createdAt).toLocaleString()}
                          </span>
                        )}
                      </div>
                      <p className="whitespace-pre-wrap break-words text-sm text-brand-prussian leading-relaxed">
                        {selected.message}
                      </p>
                    </div>

                    {/* Sent Reply OR Composer */}
                    {selected.reply?.trim() ? (
                      <div className="rounded-2xl bg-emerald-50/60 border border-emerald-200/70 p-4 sm:p-5 space-y-2.5">
                        <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                          <CheckCircleIcon className="w-4 h-4" />
                          <span>Reply Sent</span>
                        </div>
                        <div className="whitespace-pre-wrap break-words text-sm text-emerald-950 bg-white/80 border border-emerald-100 rounded-xl p-3.5 leading-relaxed">
                          {selected.reply}
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 space-y-3 shadow-sm">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold uppercase tracking-wider text-slate-500">
                            Compose Reply
                          </span>
                          <span className="text-[11px] text-slate-400">
                            Ctrl / Cmd + Enter to send
                          </span>
                        </div>

                        <textarea
                          className="w-full rounded-xl bg-slate-50 border border-slate-200/80 p-3.5 text-sm text-brand-prussian placeholder:text-slate-400 outline-none focus:bg-white focus:border-brand-cerulean focus:ring-2 focus:ring-brand-cerulean/20 min-h-[150px] resize-y transition-all"
                          rows={6}
                          value={reply}
                          onChange={(e) => setReply(e.target.value)}
                          onKeyDown={handleReplyKeyDown}
                          placeholder="Write your response to the student..."
                        />

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                          <div className="flex items-center gap-2 text-xs text-slate-400 tabular-nums">
                            <span>
                              {hasChanges ? "Drafting reply..." : "No reply yet"}
                            </span>
                            <span>•</span>
                            <span>{reply.trim().length} chars</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={handleReset}
                              disabled={!hasChanges || submitting}
                              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-40"
                            >
                              Reset
                            </button>
                            <button
                              type="button"
                              onClick={handleSubmit}
                              disabled={submitting || reply.trim() === ""}
                              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-brand-prussian hover:bg-brand-cerulean text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
                            >
                              {submitting ? (
                                <ArrowPathIcon className="w-4 h-4 animate-spin" />
                              ) : (
                                <PaperAirplaneIcon className="w-4 h-4" />
                              )}
                              <span>{submitting ? "Sending..." : "Send Reply"}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </section>
          </div>
        </div>
      )}

      {/* --- DELETE CONFIRMATION MODAL --- */}
      {confirmModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl border border-slate-200/70">
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <ExclamationTriangleIcon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-brand-prussian">
                  {confirmModal.title}
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  {confirmModal.message}
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 mt-6">
              <button
                onClick={() => setConfirmModal(null)}
                disabled={bulkDeleting || Boolean(deletingId)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={executeConfirm}
                disabled={bulkDeleting || Boolean(deletingId)}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors disabled:opacity-50"
              >
                {(bulkDeleting || Boolean(deletingId)) && (
                  <ArrowPathIcon className="w-3.5 h-3.5 animate-spin" />
                )}
                <span>
                  {bulkDeleting || Boolean(deletingId)
                    ? "Deleting..."
                    : confirmModal.confirmLabel}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}