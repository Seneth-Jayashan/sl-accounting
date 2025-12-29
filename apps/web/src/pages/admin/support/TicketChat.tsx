import { useEffect, useMemo, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  InboxIcon, 
  TrashIcon, 
  ExclamationCircleIcon,
  ChatBubbleLeftRightIcon,
  ArrowLeftIcon
} from "@heroicons/react/24/outline";

// Services & Context
import TicketService, { type Ticket } from "../../../services/TicketService";
import ChatService from "../../../services/ChatService";
import { useAuth } from "../../../contexts/AuthContext";

// Components
import Chat from "../../../components/Chat";
import ConfirmDialog from "../../../components/modals/ConfirmDialog";
import Dropdown, { type DropdownOption } from "../../../components/Dropdown";

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
  
  // UI State
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingTicket, setLoadingTicket] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  
  // Action State
  const [statusUpdating, setStatusUpdating] = useState<boolean>(false);
  const [deleting, setDeleting] = useState<boolean>(false);
  const [bulkDeleting, setBulkDeleting] = useState<boolean>(false);
  const [infoDialog, setInfoDialog] = useState<{ title: string; message: string } | null>(null);
  const [showCloseConfirm, setShowCloseConfirm] = useState<boolean>(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState<boolean>(false);
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);

  // --- HELPERS ---
  const sortTicketsDesc = useCallback((items: Ticket[]) =>
    [...items].sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime;
    }), []);

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

  const selectAllVisible = useCallback(() => {
    setSelectedIds(
      new Set(
        tickets
          .filter((t) => String(t.status || "").toLowerCase() === "closed")
          .map((t) => t._id)
      )
    );
  }, [tickets]);

  // --- DATA LOADING ---
  
  // 1. Load All Tickets
  useEffect(() => {
    let mounted = true;
    setLoading(true);
    
    TicketService.getAllTickets()
      .then((items) => {
        if (!mounted) return;
        const sorted = sortTicketsDesc(items);
        setTickets(sorted);
        clearSelected();
        
        // Handle URL Selection
        if (params.id && sorted.some((t) => t._id === params.id)) {
          setSelectedId(params.id);
        } else {
          setSelectedId(null);
        }
      })
      .catch((e) => {
        console.error(e);
        setError("Failed to load tickets.");
      })
      .finally(() => mounted && setLoading(false));

    return () => { mounted = false; };
  }, [clearSelected, params.id, sortTicketsDesc]);

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
        // Scroll to top on mobile when selecting a ticket
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } catch (e) {
        setSelectedTicket(null);
      } finally {
        setLoadingTicket(false);
      }
    };

    loadDetails();

    // Escape Key Handler
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleBackToList();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
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
        prev.map((t) => (t._id === payload._id ? { ...t, status: payload.status } : t))
      );
    };

    ChatService.onTicketStatusUpdated(handleStatus);
    return () => ChatService.offTicketStatusUpdated(handleStatus);
  }, [selectedId, accessToken]);

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
        prev.map((t) => t._id === updated._id ? { ...t, status: updated.status } : t)
      );

      // If Closed, redirect away
      if (String(updated.status).toLowerCase() === "closed") {
        handleRedirectAfterAction(selectedId);
      }
    } catch (e) {
      setError("Failed to update status");
    } finally {
      setStatusUpdating(false);
      setPendingStatus(null);
      setShowCloseConfirm(false);
    }
  };

  const handleStatusRequest = (nextStatus: string) => {
    if (!selectedTicket) return;
    const currentStatus = String(selectedTicket.status || "Open");

    // Validation Logic
    if (nextStatus === "Resolved" && currentStatus !== "Resolved") {
      setInfoDialog({ title: "Action Denied", message: "Only the user can mark this ticket as Resolved." });
      return;
    }
    if (currentStatus === "Resolved" && nextStatus !== "Closed" && nextStatus !== currentStatus) {
      setInfoDialog({ title: "Close Required", message: "This ticket is Resolved. You can only Close it." });
      return;
    }
    if (nextStatus === "Closed") {
      if (String(currentStatus).toLowerCase() !== "resolved") {
        setInfoDialog({
          title: "Action Denied",
          message: "You can only close a ticket after the user marks it as Resolved.",
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
    } catch (e) {
      setError("Failed to delete ticket");
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

      // If current selected ticket got deleted, redirect to next available
      if (selectedId && removed.has(selectedId)) {
        const remaining = tickets.filter((t) => !removed.has(t._id));
        const next = remaining[0]?._id ?? null;
        setSelectedTicket(null);
        setSelectedId(next);
        if (next) navigate(`/admin/chat/ticket/${next}`, { replace: true });
        else navigate(`/admin/chat`, { replace: true });
      }
    } catch (e) {
      setError("Failed to delete selected tickets");
    } finally {
      setBulkDeleting(false);
      setShowBulkDeleteConfirm(false);
    }
  };

  const handleRedirectAfterAction = (removedId: string) => {
    setSelectedTicket(null);
    const remaining = tickets.filter((t) => t._id !== removedId);
    
    // On Mobile: Go back to list. On Desktop: Select next.
    if (window.innerWidth < 1024) {
        handleBackToList();
    } else {
        const next = remaining[0]?._id ?? null;
        setSelectedId(next);
        if (next) navigate(`/admin/chat/ticket/${next}`, { replace: true });
        else navigate(`/admin/chat`, { replace: true });
    }
  };

  // Stats calculation
  const stats = useMemo(() => ({
    total: tickets.length,
    open: tickets.filter((t) => !String(t.status).toLowerCase().includes("close")).length
  }), [tickets]);

  return (
    <div className="bg-[#e9f0f7] min-h-full h-[calc(100vh-64px)] supports-[height:100dvh]:h-[calc(100dvh-64px)] overflow-hidden"> 
      <main className="h-full w-full max-w-7xl mx-auto flex flex-col lg:p-8">
        
        {/* Header - Visible only on Desktop OR Mobile List View */}
        <div className={`p-4 lg:p-0 shrink-0 ${selectedId ? 'hidden lg:block' : 'block'}`}>
          <div className="flex flex-col gap-2 mb-5 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold mb-1 text-[#0b2540]">Support Tickets</h1>
              <p className="text-xs text-gray-500">Manage user inquiries and chat history.</p>
            </div>
            <div className="flex gap-2 text-xs font-medium">
              <span className="bg-white px-3 py-1 rounded-full shadow-sm border text-gray-600">Total: {stats.total}</span>
              <span className="bg-white px-3 py-1 rounded-full shadow-sm border text-blue-600">Active: {stats.open}</span>
            </div>
          </div>
          {error && <div className="mt-4 bg-red-50 text-red-700 p-3 rounded-lg text-sm border border-red-200">{error}</div>}
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center text-gray-400 text-sm animate-pulse">Loading tickets...</div>
        ) : (
          <div className="flex-1 flex overflow-hidden lg:gap-4 relative">
            
            {/* LEFT COLUMN: Ticket List */}
            <div className={`
              flex-col bg-white lg:rounded-2xl border shadow-sm overflow-hidden
              ${selectedId ? 'hidden lg:flex lg:w-1/3' : 'flex w-full h-full lg:w-1/3'}
            `}>
              <div className="p-4 border-b bg-gray-50/50 flex justify-between items-center shrink-0">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Inbox</span>
                <div className="flex items-center gap-2">
                  {selectedCount > 0 ? (
                    <>
                      <span className="text-[10px] text-gray-500">Selected: {selectedCount}</span>
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
                        onClick={() => setShowBulkDeleteConfirm(true)}
                        disabled={bulkDeleting || deleting}
                        title="Delete selected tickets"
                      >
                        <TrashIcon className="w-4 h-4" /> Delete
                      </button>
                      <button
                        type="button"
                        className="text-xs font-medium text-gray-600 hover:text-gray-700 disabled:opacity-50"
                        onClick={clearSelected}
                        disabled={bulkDeleting}
                      >
                        Clear
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      className="text-xs font-medium text-gray-600 hover:text-gray-700 disabled:opacity-50"
                      onClick={selectAllVisible}
                      disabled={tickets.length === 0 || bulkDeleting}
                    >
                      Select all
                    </button>
                  )}
                </div>
              </div>
              <div className="flex-1 overflow-y-auto">
                {tickets.length === 0 ? (
                  <div className="p-8 text-center text-gray-400 text-sm">No tickets found.</div>
                ) : (
                  <ul className="divide-y divide-gray-100">
                    {tickets.map((ticket) => (
                      <TicketListItem 
                        key={ticket._id} 
                        ticket={ticket} 
                        isActive={selectedId === ticket._id}
                        isSelected={selectedIds.has(ticket._id)}
                        selectionDisabled={String(ticket.status || "").toLowerCase() !== "closed"}
                        onToggleSelect={toggleSelected}
                        onClick={(id) => {
                          const isSame = selectedId === id;
                          const isDesktop = window.innerWidth >= 1024;
                          if (isSame && isDesktop) {
                            // On desktop, allow deselecting to return to the list view
                            setSelectedId(null);
                            navigate(`/admin/chat`, { replace: true });
                            return;
                          }
                          // On mobile (or when selecting a different ticket), open the ticket
                          setSelectedId(id);
                          navigate(`/admin/chat/ticket/${id}`);
                        }}
                      />
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* RIGHT COLUMN: Chat Area */}
            <div className={`
              flex-col gap-3 min-h-0 bg-[#e9f0f7] lg:bg-transparent
              ${selectedId ? 'flex w-full h-full absolute inset-0 z-50 lg:static lg:z-auto lg:w-2/3' : 'hidden lg:flex lg:w-2/3'}
            `}>
              {/* Meta Panel */}
              <div className="bg-white lg:rounded-2xl border-b lg:border shadow-sm p-4 shrink-0 flex items-center">
                 {/* Back Button (Mobile Only) */}
                 <button 
                  onClick={() => {
                    setSelectedId(null);
                    navigate('/admin/chat');
                  }}
                  className="mr-2 lg:hidden p-2 -ml-2 text-gray-600 hover:bg-gray-100 active:bg-gray-200 rounded-full transition-colors touch-none"
                  aria-label="Back to ticket list"
                >
                  <ArrowLeftIcon className="w-6 h-6" />
                </button>

                <div className="flex-1 min-w-0">
                  {loadingTicket ? (
                    <div className="text-sm text-gray-400">Loading details...</div>
                  ) : selectedTicket ? (
                    <TicketMetaPanel 
                      ticket={selectedTicket} 
                      statusUpdating={statusUpdating}
                      deleting={deleting}
                      onStatusChange={handleStatusRequest}
                      onDelete={() => setShowDeleteConfirm(true)}
                    />
                  ) : (
                    <div className="flex items-center gap-2 text-gray-400 text-sm justify-center h-full">
                      <InboxIcon className="w-5 h-5" /> Select a ticket to view details
                    </div>
                  )}
                </div>
              </div>

              {/* Chat Box */}
              <div className="flex-1 min-h-0 flex flex-col relative bg-white lg:rounded-2xl border shadow-sm overflow-hidden">
                {selectedId && user && selectedTicket ? (
                  isChatDisabled(selectedTicket.status) ? (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 gap-2">
                      <ExclamationCircleIcon className="w-8 h-8 opacity-50" />
                      <span className="text-sm">This ticket is Closed. Chat is disabled.</span>
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
                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-300 gap-3">
                    <ChatBubbleLeftRightIcon className="w-12 h-12 opacity-20" />
                    <span className="text-sm font-medium">Select a conversation</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

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
        onClose={() => { setShowCloseConfirm(false); setPendingStatus(null); }}
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

// --- SUB COMPONENTS ---

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
    className={`p-4 cursor-pointer transition-all hover:bg-gray-50 border-l-4 active:bg-gray-100 ${
      isActive ? "bg-blue-50/50 border-blue-600" : "border-transparent"
    }`}
  >
    <div className="flex justify-between items-start mb-1 gap-2">
      <div className="flex items-start gap-3 min-w-0">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => !selectionDisabled && onToggleSelect(ticket._id)}
          onClick={(e) => e.stopPropagation()}
          disabled={selectionDisabled}
          className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 shrink-0"
          aria-label="Select ticket"
        />
        <div>
            <h3 className={`text-sm font-semibold truncate ${isActive ? 'text-blue-700' : 'text-gray-700'}`}>
            {ticket.name}
            </h3>
            <div className="text-xs text-gray-500 truncate">{ticket.email}</div>
        </div>
      </div>
      <StatusBadge status={ticket.status} />
    </div>
    <div className="mt-2 flex items-center justify-between text-[10px] text-gray-400 uppercase tracking-wider pl-7">
      <span>{ticket.Categories || "General"}</span>
      <span>{ticket.priority || "Low"} Priority</span>
    </div>
  </li>
);

const TicketMetaPanel = ({ ticket, statusUpdating, deleting, onStatusChange, onDelete }: any) => {
  const isClosed = String(ticket.status).toLowerCase() === 'closed';
  const isResolved = String(ticket.status).toLowerCase() === 'resolved';
  const currentStatus = String(ticket.status || "Open");

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
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div className="space-y-1">
        <h2 className="font-bold text-[#0b2540]">{ticket.name}</h2>
        <p className="text-xs text-gray-500">{ticket.email} • {ticket.phoneNumber}</p>
      </div>

      <div className="flex items-center gap-3 w-full md:w-auto">
        <Dropdown
          value={currentStatus}
          onChange={(v) => onStatusChange(v)}
          options={dropdownOptions}
          disabled={statusUpdating || deleting || isClosed}
          className="pl-3 pr-9 py-1.5 text-sm rounded-lg w-full md:w-44"
          wrapperClassName="w-full md:w-44"
        />

        {isClosed ? (
          <button 
            onClick={onDelete}
            disabled={deleting}
            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
            title="Delete Ticket"
          >
            <TrashIcon className="w-5 h-5" />
          </button>
        ) : (
          <div className="hidden md:block w-9 h-9" /> 
        )}
      </div>
    </div>
  );
};

const StatusBadge = ({ status }: { status?: string }) => {
  const s = String(status || "Open");
  let colors = "bg-gray-100 text-gray-600";
  if (s === "In Progress") colors = "bg-blue-100 text-blue-700";
  if (s === "Resolved") colors = "bg-purple-100 text-purple-700";
  if (s === "Closed") colors = "bg-red-100 text-red-700";

  return <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${colors}`}>{s}</span>;
};

const isChatDisabled = (status?: string) => String(status || "").toLowerCase() === 'closed';