import { useEffect, useMemo, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  InboxIcon,
  TrashIcon,
  ExclamationCircleIcon,
  ChatBubbleLeftRightIcon,
  ArrowLeftIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  ArrowPathIcon,
  ClockIcon,
  CheckCircleIcon,
  EnvelopeIcon,
  PhoneIcon,
  TagIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

// Services & Context
import TicketService, { type Ticket } from "../../../services/TicketService";
import ChatService from "../../../services/ChatService";
import { useAuth } from "../../../contexts/AuthContext";

// Components
import Chat from "../../../components/Chat";
import ConfirmDialog from "../../../components/modals/ConfirmDialog";
import Dropdown, { type DropdownOption } from "../../../components/Dropdown";

// --- Skeleton Loader ---

function TicketChatSkeleton() {
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
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 h-[560px]">
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-100 p-4 space-y-3">
          <div className="h-10 bg-slate-100 rounded-xl" />
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-slate-50 rounded-xl" />
          ))}
        </div>
        <div className="hidden lg:block lg:col-span-8 bg-white rounded-2xl border border-slate-100 p-6 space-y-4">
          <div className="h-14 w-2/3 bg-slate-100 rounded-xl" />
          <div className="h-96 bg-slate-50 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

// --- MAIN COMPONENT ---
export default function TicketChatAdmin() {
  const { user, accessToken } = useAuth();
  const params = useParams();
  const navigate = useNavigate();

  // Data State
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // UI & Filter State
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingTicket, setLoadingTicket] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "closed">("all");

  // Action State
  const [statusUpdating, setStatusUpdating] = useState<boolean>(false);
  const [deleting, setDeleting] = useState<boolean>(false);
  const [bulkDeleting, setBulkDeleting] = useState<boolean>(false);
  const [infoDialog, setInfoDialog] = useState<{
    title: string;
    message: string;
  } | null>(null);
  const [showCloseConfirm, setShowCloseConfirm] = useState<boolean>(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] =
    useState<boolean>(false);
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);

  // --- HELPERS ---
  const sortTicketsDesc = useCallback(
    (items: Ticket[]) =>
      [...items].sort((a, b) => {
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bTime - aTime;
      }),
    []
  );

  const selectedCount = useMemo(() => selectedIds.size, [selectedIds]);

  const toggleSelected = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const clearSelected = useCallback(() => setSelectedIds(new Set()), []);

  // --- DATA LOADING ---

  const loadTickets = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const items = await TicketService.getAllTickets();
      const sorted = sortTicketsDesc(items);
      setTickets(sorted);
      clearSelected();

      if (params.id && sorted.some((t) => t._id === params.id)) {
        setSelectedId(params.id);
      } else if (!params.id) {
        setSelectedId(null);
      }
    } catch (e) {
      console.error(e);
      setError("Failed to load tickets.");
    } finally {
      setLoading(false);
    }
  }, [clearSelected, params.id, sortTicketsDesc]);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  // Keep selection clean when ticket list changes
  useEffect(() => {
    setSelectedIds((prev) => {
      if (prev.size === 0) return prev;
      const validIds = new Set(tickets.map((t) => t._id));
      const next = new Set<string>();
      prev.forEach((id) => {
        if (validIds.has(id)) next.add(id);
      });
      return next.size === prev.size ? prev : next;
    });
  }, [tickets]);

  // 2. Load Single Ticket Details
  useEffect(() => {
    if (!selectedId) {
      setSelectedTicket(null);
      return;
    }

    const loadDetails = async () => {
      setLoadingTicket(true);
      try {
        const t = await TicketService.getTicketById(selectedId);
        setSelectedTicket(t ?? null);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } catch {
        setSelectedTicket(null);
      } finally {
        setLoadingTicket(false);
      }
    };

    loadDetails();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleBackToList();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, navigate]);

  // 3. Socket: New Ticket
  useEffect(() => {
    if (!accessToken) return;
    const handleTicketCreated = (ticket: Ticket) => {
      setTickets((prev) => {
        if (!ticket?._id || prev.some((t) => t._id === ticket._id)) return prev;
        return sortTicketsDesc([ticket, ...prev]);
      });
    };
    ChatService.onTicketCreated(handleTicketCreated);
    return () => ChatService.offTicketCreated(handleTicketCreated);
  }, [accessToken, sortTicketsDesc]);

  // 4. Socket: Status Update
  useEffect(() => {
    if (!selectedId || !accessToken) return;
    ChatService.joinTicket(selectedId);

    const handleStatus = (payload: any) => {
      if (!payload?._id || payload._id !== selectedId) return;
      setSelectedTicket((prev) => (prev ? { ...prev, ...payload } : payload));
      setTickets((prev) =>
        prev.map((t) =>
          t._id === payload._id ? { ...t, status: payload.status } : t
        )
      );
    };

    ChatService.onTicketStatusUpdated(handleStatus);
    return () => ChatService.offTicketStatusUpdated(handleStatus);
  }, [selectedId, accessToken]);

  // --- DERIVED STATS & FILTERED LIST ---
  const stats = useMemo(() => {
    const closed = tickets.filter((t) =>
      String(t.status || "").toLowerCase().includes("close")
    ).length;
    return {
      total: tickets.length,
      open: tickets.length - closed,
      closed,
    };
  }, [tickets]);

  const filteredTickets = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return tickets.filter((t) => {
      const isClosed = String(t.status || "").toLowerCase() === "closed";
      if (statusFilter === "active" && isClosed) return false;
      if (statusFilter === "closed" && !isClosed) return false;
      if (!q) return true;

      return (
        (t.name || "").toLowerCase().includes(q) ||
        (t.email || "").toLowerCase().includes(q) ||
        (t.Categories || "").toLowerCase().includes(q)
      );
    });
  }, [tickets, searchQuery, statusFilter]);

  const closedFilteredIds = useMemo(
    () =>
      filteredTickets
        .filter((t) => String(t.status || "").toLowerCase() === "closed")
        .map((t) => t._id),
    [filteredTickets]
  );

  const selectAllVisible = useCallback(() => {
    setSelectedIds(new Set(closedFilteredIds));
  }, [closedFilteredIds]);

  // --- ACTIONS ---

  const handleBackToList = () => {
    setSelectedId(null);
    navigate(`/admin/chat`, { replace: true });
  };

  const applyStatusChange = async (nextStatus: string) => {
    if (!selectedTicket || !selectedId) return;
    setStatusUpdating(true);

    try {
      const updated = await TicketService.updateTicket(selectedId, {
        ...selectedTicket,
        status: nextStatus,
      });

      setSelectedTicket(updated);
      setTickets((prev) =>
        prev.map((t) =>
          t._id === updated._id ? { ...t, status: updated.status } : t
        )
      );

      if (String(updated.status).toLowerCase() === "closed") {
        handleRedirectAfterAction(selectedId);
      }
    } catch {
      setError("Failed to update status.");
    } finally {
      setStatusUpdating(false);
      setPendingStatus(null);
      setShowCloseConfirm(false);
    }
  };

  const handleStatusRequest = (nextStatus: string) => {
    if (!selectedTicket) return;
    const currentStatus = String(selectedTicket.status || "Open");

    if (nextStatus === "Resolved" && currentStatus !== "Resolved") {
      setInfoDialog({
        title: "Action Denied",
        message: "Only the user can mark this ticket as Resolved.",
      });
      return;
    }
    if (
      currentStatus === "Resolved" &&
      nextStatus !== "Closed" &&
      nextStatus !== currentStatus
    ) {
      setInfoDialog({
        title: "Close Required",
        message: "This ticket is Resolved. You can only Close it.",
      });
      return;
    }
    if (nextStatus === "Closed") {
      if (String(currentStatus).toLowerCase() !== "resolved") {
        setInfoDialog({
          title: "Action Denied",
          message:
            "You can only close a ticket after the user marks it as Resolved.",
        });
        return;
      }
      setPendingStatus("Closed");
      setShowCloseConfirm(true);
      return;
    }

    applyStatusChange(nextStatus);
  };

  const confirmDelete = async () => {
    if (!selectedId) return;
    setDeleting(true);
    try {
      await TicketService.deleteTicket(selectedId);
      setTickets((prev) => prev.filter((t) => t._id !== selectedId));
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(selectedId);
        return next;
      });
      handleRedirectAfterAction(selectedId);
    } catch {
      setError("Failed to delete ticket.");
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const confirmBulkDelete = async () => {
    const ids = Array.from(selectedIds);
    if (!ids.length) return;

    setBulkDeleting(true);
    try {
      await TicketService.bulkDeleteTickets(ids);

      const removed = new Set(ids);
      setTickets((prev) => prev.filter((t) => !removed.has(t._id)));
      clearSelected();

      if (selectedId && removed.has(selectedId)) {
        const remaining = tickets.filter((t) => !removed.has(t._id));
        const next = remaining[0]?._id ?? null;
        setSelectedTicket(null);
        setSelectedId(next);
        if (next) navigate(`/admin/chat/ticket/${next}`, { replace: true });
        else navigate(`/admin/chat`, { replace: true });
      }
    } catch {
      setError("Failed to delete selected tickets.");
    } finally {
      setBulkDeleting(false);
      setShowBulkDeleteConfirm(false);
    }
  };

  const handleRedirectAfterAction = (removedId: string) => {
    setSelectedTicket(null);
    const remaining = tickets.filter((t) => t._id !== removedId);

    if (window.innerWidth < 1024) {
      handleBackToList();
    } else {
      const next = remaining[0]?._id ?? null;
      setSelectedId(next);
      if (next) navigate(`/admin/chat/ticket/${next}`, { replace: true });
      else navigate(`/admin/chat`, { replace: true });
    }
  };

  return (
    <div className="space-y-6 md:space-y-8 pb-24 md:pb-8">
      {/* HEADER */}
      <header
        className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${selectedId ? "hidden lg:flex" : "flex"
          }`}
      >
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-brand-prussian tracking-tight">
            Support Tickets
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Manage live student support conversations, statuses, and ticket history.
          </p>
        </div>

        <button
          onClick={loadTickets}
          disabled={loading}
          className="inline-flex items-center gap-2 self-start sm:self-auto px-4 py-2.5 bg-white rounded-xl border border-slate-200/80 shadow-sm text-xs font-semibold text-slate-600 hover:text-brand-cerulean hover:border-brand-cerulean/40 transition-colors disabled:opacity-50"
        >
          <ArrowPathIcon
            className={`w-4 h-4 ${loading ? "animate-spin text-brand-cerulean" : ""
              }`}
          />
          <span>Refresh</span>
        </button>
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
      {loading && tickets.length === 0 ? (
        <TicketChatSkeleton />
      ) : (
        <div className="space-y-6">
          {/* KPI SUMMARY CARDS */}
          <div
            className={`grid grid-cols-1 sm:grid-cols-3 gap-5 ${selectedId ? "hidden lg:grid" : "grid"
              }`}
          >
            <div className="relative overflow-hidden bg-white p-6 rounded-2xl border border-slate-200/70 shadow-sm">
              <div className="pointer-events-none absolute -top-10 -right-10 w-24 h-24 rounded-full bg-blue-500/10 blur-2xl" />
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Total Tickets
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
                    Active Tickets
                  </p>
                  <h3 className="text-3xl font-bold text-brand-prussian mt-2 tabular-nums">
                    {stats.open}
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
                    Closed
                  </p>
                  <h3 className="text-3xl font-bold text-brand-prussian mt-2 tabular-nums">
                    {stats.closed}
                  </h3>
                </div>
                <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
                  <CheckCircleIcon className="w-5 h-5" />
                </div>
              </div>
            </div>
          </div>

          {/* SPLIT-PANE TICKET WORKSPACE */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:h-[640px]">
            {/* LEFT COLUMN: Ticket Inbox */}
            <section
              className={`lg:col-span-5 xl:col-span-4 flex-col bg-white rounded-2xl border border-slate-200/70 shadow-sm overflow-hidden ${selectedId ? "hidden lg:flex" : "flex min-h-[500px]"
                }`}
            >
              {/* Search, Filter & Bulk Controls */}
              <div className="p-3.5 border-b border-slate-100 space-y-3 bg-slate-50/60 shrink-0">
                <div className="relative">
                  <MagnifyingGlassIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search student, email, or category..."
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

                {/* Filter Pills */}
                <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200/70">
                  {(
                    [
                      { key: "all", label: "All", count: stats.total },
                      { key: "active", label: "Active", count: stats.open },
                      { key: "closed", label: "Closed", count: stats.closed },
                    ] as const
                  ).map((tab) => {
                    const active = statusFilter === tab.key;
                    return (
                      <button
                        key={tab.key}
                        onClick={() => setStatusFilter(tab.key)}
                        className={`flex-1 inline-flex items-center justify-center gap-1 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${active
                            ? "bg-brand-prussian text-white shadow-sm"
                            : "text-slate-500 hover:text-brand-prussian"
                          }`}
                      >
                        <span>{tab.label}</span>
                        <span
                          className={`px-1 rounded text-[10px] tabular-nums ${active
                              ? "bg-white/20 text-white"
                              : "bg-slate-100 text-slate-400"
                            }`}
                        >
                          {tab.count}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Bulk Selection Row */}
                <div className="flex items-center justify-between text-xs px-0.5">
                  <span className="font-bold uppercase tracking-wider text-[10px] text-slate-400">
                    Inbox ({filteredTickets.length})
                  </span>
                  <div className="flex items-center gap-2.5">
                    {selectedCount > 0 ? (
                      <>
                        <span className="text-slate-500 font-medium tabular-nums">
                          {selectedCount} selected
                        </span>
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 font-semibold text-rose-600 hover:text-rose-700 disabled:opacity-50"
                          onClick={() => setShowBulkDeleteConfirm(true)}
                          disabled={bulkDeleting || deleting}
                          title="Delete selected tickets"
                        >
                          <TrashIcon className="w-3.5 h-3.5" />
                          Delete
                        </button>
                        <button
                          type="button"
                          className="font-medium text-slate-400 hover:text-slate-600 disabled:opacity-50"
                          onClick={clearSelected}
                          disabled={bulkDeleting}
                        >
                          Clear
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        className="font-semibold text-brand-cerulean hover:text-brand-prussian disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        onClick={selectAllVisible}
                        disabled={closedFilteredIds.length === 0 || bulkDeleting}
                      >
                        Select closed
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Tickets List */}
              <div className="flex-1 overflow-y-auto">
                {filteredTickets.length === 0 ? (
                  <div className="p-10 text-center flex flex-col items-center">
                    <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-3">
                      <InboxIcon className="w-6 h-6 text-slate-300" />
                    </div>
                    <p className="text-sm font-semibold text-brand-prussian">
                      No tickets found
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Try adjusting your search or status filter.
                    </p>
                  </div>
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {filteredTickets.map((ticket) => (
                      <TicketListItem
                        key={ticket._id}
                        ticket={ticket}
                        isActive={selectedId === ticket._id}
                        isSelected={selectedIds.has(ticket._id)}
                        selectionDisabled={
                          String(ticket.status || "").toLowerCase() !== "closed"
                        }
                        onToggleSelect={toggleSelected}
                        onClick={(id) => {
                          const isSame = selectedId === id;
                          const isDesktop = window.innerWidth >= 1024;
                          if (isSame && isDesktop) {
                            setSelectedId(null);
                            navigate(`/admin/chat`, { replace: true });
                            return;
                          }
                          setSelectedId(id);
                          navigate(`/admin/chat/ticket/${id}`);
                        }}
                      />
                    ))}
                  </ul>
                )}
              </div>
            </section>

            {/* RIGHT COLUMN: Chat Area */}
            <section
              className={`lg:col-span-7 xl:col-span-8 flex-col gap-3 min-h-0 ${selectedId ? "flex h-[calc(100vh-120px)] lg:h-full" : "hidden lg:flex"
                }`}
            >
              {/* Meta Panel */}
              <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm p-4 shrink-0 flex items-center gap-2">
                <button
                  onClick={() => {
                    setSelectedId(null);
                    navigate("/admin/chat");
                  }}
                  className="lg:hidden p-2 -ml-1 text-slate-500 hover:text-brand-prussian hover:bg-slate-100 rounded-xl transition-colors"
                  aria-label="Back to ticket list"
                >
                  <ArrowLeftIcon className="w-5 h-5" />
                </button>

                <div className="flex-1 min-w-0">
                  {loadingTicket ? (
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <ArrowPathIcon className="w-4 h-4 animate-spin text-brand-cerulean" />
                      <span>Loading ticket details...</span>
                    </div>
                  ) : selectedTicket ? (
                    <TicketMetaPanel
                      ticket={selectedTicket}
                      statusUpdating={statusUpdating}
                      deleting={deleting}
                      onStatusChange={handleStatusRequest}
                      onDelete={() => setShowDeleteConfirm(true)}
                    />
                  ) : (
                    <div className="flex items-center justify-center gap-2 text-slate-400 text-xs font-medium py-1">
                      <InboxIcon className="w-4 h-4" />
                      <span>Select a ticket from the inbox to view details</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Chat Box */}
              <div className="flex-1 min-h-0 flex flex-col relative bg-white rounded-2xl border border-slate-200/70 shadow-sm overflow-hidden">
                {selectedId && user && selectedTicket ? (
                  isChatDisabled(selectedTicket.status) ? (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-2.5 p-6 text-center">
                      <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center">
                        <ExclamationCircleIcon className="w-6 h-6 text-slate-300" />
                      </div>
                      <p className="text-sm font-semibold text-brand-prussian">
                        Ticket Closed
                      </p>
                      <span className="text-xs text-slate-400">
                        Chat is disabled for closed tickets.
                      </span>
                    </div>
                  ) : (
                    <div className="h-full w-full">
                      <Chat
                        ticketId={selectedId}
                        userId={user._id}
                        role="admin"
                        readOnly={selectedTicket.status === "Resolved"}
                        heightMode="parent"
                        hideHeader
                      />
                    </div>
                  )
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-center p-8">
                    <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-3">
                      <ChatBubbleLeftRightIcon className="w-7 h-7 text-slate-300" />
                    </div>
                    <h3 className="text-sm font-semibold text-brand-prussian">
                      No conversation selected
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 max-w-xs">
                      Choose a support ticket on the left to view its live chat history and reply.
                    </p>
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      )}

      {/* --- MODALS --- */}
      <ConfirmDialog
        isOpen={Boolean(infoDialog)}
        title={infoDialog?.title}
        message={infoDialog?.message}
        confirmLabel="OK"
        hideCancel
        onClose={() => setInfoDialog(null)}
        onConfirm={() => setInfoDialog(null)}
      />

      <ConfirmDialog
        isOpen={showCloseConfirm}
        title="Close Ticket"
        message="Are you sure? This prevents further updates unless reopened by an admin."
        confirmLabel={statusUpdating ? "Closing..." : "Close Ticket"}
        cancelLabel="Cancel"
        loading={statusUpdating}
        onClose={() => {
          setShowCloseConfirm(false);
          setPendingStatus(null);
        }}
        onConfirm={() => pendingStatus && applyStatusChange(pendingStatus)}
      />

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Delete Ticket"
        message="Permanently delete this ticket and all chat history? This cannot be undone."
        confirmLabel={deleting ? "Deleting..." : "Delete Forever"}
        cancelLabel="Cancel"
        loading={deleting}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={confirmDelete}
      />

      <ConfirmDialog
        isOpen={showBulkDeleteConfirm}
        title="Delete Selected Tickets"
        message={`Permanently delete ${selectedCount} ticket(s) and all chat history? This cannot be undone.`}
        confirmLabel={bulkDeleting ? "Deleting..." : "Delete Selected"}
        cancelLabel="Cancel"
        loading={bulkDeleting}
        onClose={() => setShowBulkDeleteConfirm(false)}
        onConfirm={confirmBulkDelete}
      />
    </div>
  );
}

// --- SUB-COMPONENTS ---

const TicketListItem = ({
  ticket,
  isActive,
  isSelected,
  selectionDisabled,
  onToggleSelect,
  onClick,
}: {
  ticket: Ticket;
  isActive: boolean;
  isSelected: boolean;
  selectionDisabled: boolean;
  onToggleSelect: (id: string) => void;
  onClick: (id: string) => void;
}) => (
  <li
    onClick={() => onClick(ticket._id)}
    className={`p-4 cursor-pointer transition-colors border-l-[3px] ${isActive
        ? "bg-brand-aliceBlue/60 border-l-brand-cerulean"
        : "hover:bg-slate-50/80 border-l-transparent"
      }`}
  >
    <div className="flex justify-between items-start gap-2.5">
      <div className="flex items-start gap-2.5 min-w-0">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => !selectionDisabled && onToggleSelect(ticket._id)}
          onClick={(e) => e.stopPropagation()}
          disabled={selectionDisabled}
          title={
            selectionDisabled
              ? "Only closed tickets can be bulk deleted"
              : "Select ticket"
          }
          className="mt-1 h-4 w-4 rounded border-slate-300 text-brand-prussian focus:ring-brand-cerulean shrink-0 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
          aria-label="Select ticket"
        />
        <div className="min-w-0">
          <h3
            className={`text-sm font-semibold truncate ${isActive ? "text-brand-cerulean" : "text-brand-prussian"
              }`}
          >
            {ticket.name}
          </h3>
          <p className="text-[11px] text-slate-400 truncate">{ticket.email}</p>
        </div>
      </div>
      <StatusBadge status={ticket.status} />
    </div>

    <div className="mt-2.5 flex items-center justify-between gap-2 pl-6">
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md truncate max-w-[140px]">
        <TagIcon className="w-3 h-3 text-slate-400 shrink-0" />
        {ticket.Categories || "General"}
      </span>
      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
        {ticket.priority || "Low"} Priority
      </span>
    </div>
  </li>
);

const TicketMetaPanel = ({
  ticket,
  statusUpdating,
  deleting,
  onStatusChange,
  onDelete,
}: any) => {
  const isClosed = String(ticket.status).toLowerCase() === "closed";
  const isResolved = String(ticket.status).toLowerCase() === "resolved";
  const currentStatus = String(ticket.status || "Open");

  const initials = ticket.name
    ? String(ticket.name)
      .split(" ")
      .map((n: string) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase()
    : "TK";

  const statusOptions = useMemo(() => {
    if (isClosed) return ["Closed"];
    if (isResolved) return ["Resolved", "Closed"];
    return ["Open", "In Progress"];
  }, [isClosed, isResolved]);
  const needsCurrentOption = !statusOptions.includes(currentStatus);

  const dropdownOptions = useMemo<DropdownOption[]>(() => {
    const opts: DropdownOption[] = [];
    if (needsCurrentOption) {
      opts.push({ value: currentStatus, label: currentStatus, disabled: true });
    }
    statusOptions.forEach((opt) => {
      opts.push({ value: opt, label: opt, disabled: opt === "Resolved" });
    });
    return opts;
  }, [currentStatus, needsCurrentOption, statusOptions]);

  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-10 h-10 rounded-full bg-brand-aliceBlue text-brand-cerulean ring-1 ring-brand-cerulean/20 flex items-center justify-center font-bold text-xs shrink-0">
          {initials}
        </div>
        <div className="min-w-0">
          <h2 className="font-bold text-sm sm:text-base text-brand-prussian truncate">
            {ticket.name}
          </h2>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-400 mt-0.5">
            {ticket.email && (
              <a
                href={`mailto:${ticket.email}`}
                className="inline-flex items-center gap-1 hover:text-brand-cerulean transition-colors truncate"
              >
                <EnvelopeIcon className="w-3.5 h-3.5 shrink-0" />
                {ticket.email}
              </a>
            )}
            {ticket.phoneNumber && (
              <a
                href={`tel:${ticket.phoneNumber}`}
                className="inline-flex items-center gap-1 hover:text-brand-cerulean transition-colors font-mono"
              >
                <PhoneIcon className="w-3.5 h-3.5 shrink-0" />
                {ticket.phoneNumber}
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2.5 w-full md:w-auto shrink-0">
        <Dropdown
          value={currentStatus}
          onChange={(v) => onStatusChange(v)}
          options={dropdownOptions}
          disabled={statusUpdating || deleting || isClosed}
          className="pl-3 pr-9 py-1.5 text-xs font-semibold rounded-xl w-full md:w-40 bg-slate-50 border-slate-200/80 text-brand-prussian"
          wrapperClassName="w-full md:w-40"
        />

        {isClosed && (
          <button
            onClick={onDelete}
            disabled={deleting}
            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200/70 rounded-xl transition-colors disabled:opacity-50"
            title="Delete Ticket"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

const StatusBadge = ({ status }: { status?: string }) => {
  const s = String(status || "Open");
  let style = "bg-slate-100 text-slate-600 ring-slate-300/70";
  let dot = "bg-slate-400";

  if (s === "Open") {
    style = "bg-amber-50 text-amber-700 ring-amber-600/15";
    dot = "bg-amber-500";
  } else if (s === "In Progress") {
    style = "bg-blue-50 text-blue-700 ring-blue-600/15";
    dot = "bg-blue-500";
  } else if (s === "Resolved") {
    style = "bg-purple-50 text-purple-700 ring-purple-600/15";
    dot = "bg-purple-500";
  } else if (s === "Closed") {
    style = "bg-rose-50 text-rose-700 ring-rose-600/15";
    dot = "bg-rose-500";
  }

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ring-1 whitespace-nowrap shrink-0 ${style}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {s}
    </span>
  );
};

const isChatDisabled = (status?: string) =>
  String(status || "").toLowerCase() === "closed";