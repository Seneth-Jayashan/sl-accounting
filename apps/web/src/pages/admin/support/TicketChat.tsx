import { useEffect, useMemo, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  InboxIcon, 
  TrashIcon, 
  ExclamationCircleIcon,
  ChatBubbleLeftRightIcon
} from "@heroicons/react/24/outline";

// Services & Context
import TicketService, { type Ticket } from "../../../services/TicketService";
import ChatService from "../../../services/ChatService";
import { useAuth } from "../../../contexts/AuthContext";

// Components
import Chat from "../../../components/Chat";
import ConfirmDialog from "../../../components/modals/ConfirmDialog";

// --- MAIN COMPONENT ---
export default function TicketChatAdmin() {
  const { user, accessToken } = useAuth();
  const params = useParams();
  const navigate = useNavigate();

  // Data State
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  
  // UI State
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingTicket, setLoadingTicket] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  
  // Action State
  const [statusUpdating, setStatusUpdating] = useState<boolean>(false);
  const [deleting, setDeleting] = useState<boolean>(false);
  const [infoDialog, setInfoDialog] = useState<{ title: string; message: string } | null>(null);
  const [showCloseConfirm, setShowCloseConfirm] = useState<boolean>(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);

  // --- HELPERS ---
  const sortTicketsDesc = useCallback((items: Ticket[]) =>
    [...items].sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime;
    }), []);

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
  }, []);

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
        setSelectedId(null);
        navigate(`/admin/chat`, { replace: true });
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
      handleRedirectAfterAction(selectedId);
    } catch (e) {
      setError("Failed to delete ticket");
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleRedirectAfterAction = (removedId: string) => {
    setSelectedTicket(null);
    const remaining = tickets.filter((t) => t._id !== removedId);
    const next = remaining[0]?._id ?? null;
    setSelectedId(next);
    if (next) navigate(`/admin/chat/ticket/${next}`, { replace: true });
    else navigate(`/admin/chat`, { replace: true });
  };

  // Stats calculation
  const stats = useMemo(() => ({
    total: tickets.length,
    open: tickets.filter((t) => !String(t.status).toLowerCase().includes("close")).length
  }), [tickets]);

  return (
    <div className="bg-[#e9f0f7] min-h-full"> {/* Layout wrapper removed */}
      <main className="p-4 lg:p-8 pb-24 lg:pb-10 h-[calc(100vh-64px)] flex justify-center">
        <div className="w-full max-w-7xl space-y-4 flex flex-col h-full">
          
          {/* Header */}
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between shrink-0">
            <div>
              <h1 className="text-2xl font-bold text-[#0b2540]">Support Tickets</h1>
              <p className="text-xs text-gray-500">Manage user inquiries and chat history.</p>
            </div>
            <div className="flex gap-2 text-xs font-medium">
              <span className="bg-white px-3 py-1 rounded-full shadow-sm border text-gray-600">Total: {stats.total}</span>
              <span className="bg-white px-3 py-1 rounded-full shadow-sm border text-blue-600">Active: {stats.open}</span>
            </div>
          </div>

          {error && <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm border border-red-200">{error}</div>}

          {loading ? (
            <div className="flex-1 flex items-center justify-center text-gray-400 text-sm animate-pulse">Loading tickets...</div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1 min-h-0">
              
              {/* LEFT COLUMN: Ticket List */}
              <div className="lg:col-span-1 bg-white rounded-2xl border shadow-sm flex flex-col overflow-hidden">
                <div className="p-3 border-b bg-gray-50/50 flex justify-between items-center">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Inbox</span>
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
                          onClick={(id) => {
                            if (selectedId === id) {
                              setSelectedId(null);
                              navigate('/admin/chat', { replace: true });
                            } else {
                              setSelectedId(id);
                              navigate(`/admin/chat/ticket/${id}`);
                            }
                          }}
                        />
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {/* RIGHT COLUMN: Chat Area */}
              <div className="lg:col-span-2 flex flex-col gap-3 min-h-0">
                {/* Meta Panel */}
                <div className="bg-white rounded-2xl border shadow-sm p-4 shrink-0">
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
                    <div className="flex items-center gap-2 text-gray-400 text-sm">
                      <InboxIcon className="w-5 h-5" /> Select a ticket to view details
                    </div>
                  )}
                </div>

                {/* Chat Box */}
                <div className="flex-1 bg-white rounded-2xl border shadow-sm overflow-hidden relative">
                  {selectedId && user && selectedTicket ? (
                    isChatDisabled(selectedTicket.status) ? (
                      <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-2">
                        <ExclamationCircleIcon className="w-8 h-8 opacity-50" />
                        <span className="text-sm">This ticket is Closed. Chat is disabled.</span>
                      </div>
                    ) : (
                      <Chat
                        ticketId={selectedId}
                        userId={user._id}
                        role="admin"
                        readOnly={selectedTicket.status === "Resolved"}
                      />
                    )
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-gray-300 gap-3">
                      <ChatBubbleLeftRightIcon className="w-12 h-12 opacity-20" />
                      <span className="text-sm font-medium">Select a conversation</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
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
    </div>
  );
}

// --- SUB COMPONENTS ---

const TicketListItem = ({ ticket, isActive, onClick }: { ticket: Ticket, isActive: boolean, onClick: (id: string) => void }) => (
  <li
    onClick={() => onClick(ticket._id)}
    className={`p-4 cursor-pointer transition-all hover:bg-gray-50 border-l-4 ${
      isActive ? "bg-blue-50/50 border-blue-600" : "border-transparent"
    }`}
  >
    <div className="flex justify-between items-start mb-1">
      <h3 className={`text-sm font-semibold truncate pr-2 ${isActive ? 'text-blue-700' : 'text-gray-700'}`}>
        {ticket.name}
      </h3>
      <StatusBadge status={ticket.status} />
    </div>
    <div className="text-xs text-gray-500 truncate">{ticket.email}</div>
    <div className="mt-2 flex items-center justify-between text-[10px] text-gray-400 uppercase tracking-wider">
      <span>{ticket.Categories || "General"}</span>
      <span>{ticket.priority || "Low"} Priority</span>
    </div>
  </li>
);

const TicketMetaPanel = ({ ticket, statusUpdating, deleting, onStatusChange, onDelete }: any) => {
  const isClosed = String(ticket.status).toLowerCase() === 'closed';
  
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div className="space-y-1">
        <h2 className="font-bold text-[#0b2540]">{ticket.name}</h2>
        <p className="text-xs text-gray-500">{ticket.email} • {ticket.phoneNumber}</p>
      </div>

      <div className="flex items-center gap-3">
        <select
          className="bg-gray-50 border border-gray-200 text-sm rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-100 transition-shadow disabled:opacity-50"
          value={ticket.status || "Open"}
          onChange={(e) => onStatusChange(e.target.value)}
          disabled={statusUpdating || deleting || isClosed}
        >
          {["Open", "In Progress", "Resolved", "Closed"].map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>

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
          <div className="w-9 h-9" /> // Spacer
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

  return <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${colors}`}>{s}</span>;
};

// Helper to determine if chat is viewable
const isChatDisabled = (status?: string) => String(status || "").toLowerCase() === 'closed';