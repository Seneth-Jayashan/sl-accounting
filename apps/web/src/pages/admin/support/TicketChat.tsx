import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DashboardLayout from "../../../layouts/DashboardLayout";
import SidebarAdmin from "../../../components/sidebar/SidebarAdmin";
import BottomNavAdmin from "../../../components/bottomNavbar/BottomNavAdmin";
import TicketService, { type Ticket } from "../../../services/TicketService";
import { useAuth } from "../../../contexts/AuthContext";
import Chat from "../../../components/Chat";
import Dropdown from "../../../components/Dropdown";

export default function TicketChatAdmin() {
  const STATUS_OPTIONS = ["Open", "In Progress", "Resolved", "Closed"];
  const { user } = useAuth();
  const params = useParams();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingTicket, setLoadingTicket] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [statusUpdating, setStatusUpdating] = useState<boolean>(false);
  const [deleting, setDeleting] = useState<boolean>(false);

  const loadTicketDetails = async (id: string) => {
    setLoadingTicket(true);
    try {
      const t = await TicketService.getTicketById(id);
      setSelectedTicket(t ?? null);
    } catch (e) {
      console.error(e);
      setSelectedTicket(null);
    } finally {
      setLoadingTicket(false);
    }
  };

  // Load all tickets for admins
  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError("");
    TicketService.getAllTickets()
      .then((items) => {
        if (!mounted) return;
        // Newest first when createdAt is available
        const sorted = [...items].sort((a, b) => {
          const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return bTime - aTime;
        });
        setTickets(sorted);
        // Prefer URL param if present
        const paramId = params.id;
        if (paramId && sorted.some((t) => t._id === paramId)) {
          setSelectedId(paramId);
        } else {
          // Do not auto-select or navigate when visiting the ticket list page
          // (leave selection empty so `/admin/chat` shows the list without opening a chat)
          setSelectedId(null);
        }
      })
      .catch((e) => {
        console.error(e);
        setError("Failed to load tickets.");
      })
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  // Load selected ticket details for header meta
  useEffect(() => {
    if (!selectedId) {
      setSelectedTicket(null);
      return;
    }
    void loadTicketDetails(selectedId);

    // Add Escape key handler to close the selected ticket view
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedId(null);
        navigate(`/admin/chat`, { replace: true });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedId]);

  const stats = useMemo(() => {
    const total = tickets.length;
    const open = tickets.filter(
      (t) =>
        !String(t.status ?? "")
          .toLowerCase()
          .includes("close")
    );
    return { total, open: open.length };
  }, [tickets]);

  // Show all tickets in the left panel

  const renderTicketMeta = () => {
    if (!selectedTicket) return null;
    return (
      <div className="space-y-1 text-sm text-gray-600">
        <div className="font-semibold text-[#0b2540]">
          {selectedTicket.name}
        </div>
        <div className="text-xs text-gray-500">
          {selectedTicket.email} • {selectedTicket.phoneNumber}
        </div>
        <div>Category: {selectedTicket.Categories || "Unspecified"}</div>
        <div>Priority: {selectedTicket.priority || "Low"}</div>
        <div>Status: {selectedTicket.status || "Open"}</div>
      </div>
    );
  };

  const handleStatusChange = async (nextStatus: string) => {
    if (!selectedTicket || !selectedId) return;

    const currentStatus = String(selectedTicket.status || "Open");
    const isResolved = currentStatus === "Resolved";

    // Admin cannot set status to Resolved directly
    if (nextStatus === "Resolved" && !isResolved) {
      window.alert("Only the user can mark this ticket as Resolved.");
      return;
    }

    // When ticket is Resolved, admin may only Close it
    if (isResolved && nextStatus !== "Closed" && nextStatus !== currentStatus) {
      window.alert(
        "This ticket was marked Resolved by the user. You can only Close it."
      );
      return;
    }

    // Confirm before closing
    if (nextStatus === "Closed") {
      const ok = window.confirm(
        "Close this ticket? This will prevent further updates unless reopened by an admin."
      );
      if (!ok) return;
    }
    setStatusUpdating(true);
    setError("");
    try {
      const updated = await TicketService.updateTicket(selectedId, {
        name: selectedTicket.name,
        email: selectedTicket.email,
        phoneNumber: selectedTicket.phoneNumber,
        Categories: selectedTicket.Categories,
        message: selectedTicket.message,
        priority: selectedTicket.priority,
        status: nextStatus,
      });

      setSelectedTicket(updated);
      setTickets((prev) =>
        prev.map((t) =>
          t._id === updated._id ? { ...t, status: updated.status } : t
        )
      );

      // If admin closed the ticket, remove the chat view for admin
      if (String(updated.status || "").toLowerCase() === "closed") {
        setSelectedTicket(null);
        const remaining = tickets.filter((t) => t._id !== selectedId);
        const next = remaining[0]?._id ?? null;
        setSelectedId(next);
        navigate(`/admin/chat${next ? `/ticket/${next}` : ""}`, {
          replace: true,
        });
      }
    } catch (e) {
      console.error(e);
      setError("Failed to update status");
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedId) return;
    const confirmed = window.confirm(
      "Delete this ticket and its chat messages?"
    );
    if (!confirmed) return;

    setDeleting(true);
    setError("");
    try {
      await TicketService.deleteTicket(selectedId);
      setTickets((prev) => prev.filter((t) => t._id !== selectedId));
      setSelectedTicket(null);

      const remaining = tickets.filter((t) => t._id !== selectedId);
      const next = remaining[0]?._id ?? null;
      setSelectedId(next);
      if (next) navigate(`/admin/chat/ticket/${next}`, { replace: true });
      else navigate(`/admin/chat`, { replace: true });
    } catch (e) {
      console.error(e);
      setError("Failed to delete ticket");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <DashboardLayout
      Sidebar={SidebarAdmin}
      BottomNav={BottomNavAdmin}
      showHeader={false}
    >
      <div className="bg-[#e9f0f7] min-h-screen">
        <main className="p-4 lg:p-8 pb-24 lg:pb-10 overflow-x-hidden flex justify-center">
          <div className="w-full max-w-7xl space-y-6">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-3xl font-semibold text-[#0b2540]">
                  Ticket Chats
                </h1>
                <p className="text-sm text-gray-600">
                  Review every ticket thread and reply as admin.
                </p>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <span className="px-3 py-1 rounded-full bg-white border shadow-sm">
                  Total: {stats.total}
                </span>
                <span className="px-3 py-1 rounded-full bg-white border shadow-sm">
                  Open-ish: {stats.open}
                </span>
              </div>
            </div>

            {error && (
              <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {loading ? (
              <div className="flex items-center justify-center py-16 text-gray-600">
                Loading tickets...
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Ticket list */}
                <div className="lg:col-span-1 rounded-2xl border bg-white shadow-sm flex flex-col h-[520px] lg:h-[750px] overflow-hidden">
                  <div className="flex items-center justify-between border-b px-4 py-3 text-sm text-gray-600">
                    <span>All tickets</span>
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                      {tickets.length}
                    </span>
                  </div>
                  {tickets.length === 0 ? (
                    <div className="p-6 text-sm text-gray-600 text-center space-y-2">
                      <div>No tickets yet.</div>
                      <div className="text-xs text-gray-500">
                        New tickets will appear automatically.
                      </div>
                    </div>
                  ) : (
                    <ul className="divide-y overflow-auto min-h-0">
                      {tickets.map((t) => {
                        const isActive = selectedId === t._id;
                        String(t.status ?? "")
                          .toLowerCase()
                          .includes("close");
                        return (
                          <li
                            key={t._id}
                            className={`p-4 cursor-pointer transition hover:bg-gray-50 ${
                              isActive
                                ? "bg-[#0b2540]/5 border-l-4 border-[#0b2540]"
                                : ""
                            }`}
                            onClick={() => {
                              if (isActive) {
                                // toggle off when clicking the active ticket
                                setSelectedId(null);
                                navigate(`/admin/chat`, { replace: true });
                                return;
                              }
                              setSelectedId(t._id);
                              navigate(`/admin/chat/ticket/${t._id}`);
                            }}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0 space-y-1">
                                <div className="font-semibold text-[#0b2540] truncate">
                                  {t.name}
                                </div>
                                <div className="text-xs text-gray-500 truncate">
                                  {t.email}
                                </div>
                                <div className="text-xs text-gray-500 truncate">
                                  {t.Categories || "Category"}
                                </div>
                              </div>
                              <span
                                className={`text-xs px-2 py-0.5 rounded-full ${
                                  t.status === "Closed"
                                    ? "bg-red-100 text-red-700"
                                    : t.status === "Resolved"
                                    ? "bg-purple-100 text-purple-700"
                                    : t.status === "In Progress"
                                    ? "bg-blue-100 text-blue-700"
                                    : "bg-green-100 text-green-700"
                                }`}
                              >
                                {t.status || "Open"}
                              </span>
                            </div>
                            <div className="mt-2 text-xs text-gray-500">
                              Priority: {t.priority || "Low"}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>

                {/* Chat area */}
                <div className="lg:col-span-2 space-y-3">
                  <div className="rounded-2xl border bg-white shadow-sm p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="text-xs text-gray-500">Ticket detail</div>
                      {loadingTicket ? (
                        <div className="text-sm text-gray-600">
                          Loading ticket...
                        </div>
                      ) : selectedTicket ? (
                        renderTicketMeta()
                      ) : (
                        <div className="text-sm text-gray-600">
                          Select a ticket to inspect.
                        </div>
                      )}
                    </div>
                    {selectedTicket && (
                      <div className="flex flex-col md:flex-row gap-2 md:items-center">
                        <label className="text-sm text-gray-600 flex items-center gap-2">
                          <span className="text-xs uppercase tracking-wide text-gray-500">
                            Status
                          </span>
                          <div className="min-w-[180px]">
                            <Dropdown
                              value={selectedTicket.status || "Open"}
                              onChange={(v) => handleStatusChange(v)}
                              options={STATUS_OPTIONS.filter((opt) => {
                                const current = selectedTicket.status || "Open";
                                if (opt === "Resolved" && current !== "Resolved") return false;
                                if (opt === "Closed" && current !== "Resolved" && current !== "Closed") return false;
                                return true;
                              }).map((opt) => ({ value: opt, label: opt }))}
                              disabled={
                                statusUpdating ||
                                deleting ||
                                String(selectedTicket.status || "").toLowerCase() === "closed"
                              }
                              wrapperClassName="w-full"
                              className="px-3 py-2"
                            />
                          </div>
                        </label>
                        {(selectedTicket.status || "").toLowerCase() ===
                        "closed" ? (
                          <button
                            className="text-sm px-3 py-2 rounded-lg border border-red-200 text-red-700 bg-red-50 hover:bg-red-100 disabled:opacity-60"
                            onClick={handleDelete}
                            disabled={deleting || statusUpdating}
                          >
                            {deleting ? "Deleting..." : "Delete"}
                          </button>
                        ) : (
                          <span className="text-xs text-gray-500">
                            Delete available only when ticket is Closed
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="rounded-2xl border bg-white shadow-sm p-2 min-h-[520px] lg:min-h-[560px]">
                    {selectedId && user ? (
                      selectedTicket ? (
                        String(selectedTicket.status || "").toLowerCase() ===
                        "resolved" ? (
                          <div className="h-full">
                            <div className="p-3 text-sm text-gray-600 border-b">
                              This ticket was marked Resolved by the user. Now
                              you can Close the chat.
                            </div>
                            <Chat
                              ticketId={selectedId}
                              userId={user._id}
                              role="admin"
                              readOnly
                            />
                          </div>
                        ) : String(
                            selectedTicket.status || ""
                          ).toLowerCase() === "closed" ? (
                          <div className="flex items-center justify-center h-full text-gray-600 py-12">
                            This ticket is Closed. Conversation is removed for
                            admins.
                          </div>
                        ) : (
                          <Chat
                            ticketId={selectedId}
                            userId={user._id}
                            role="admin"
                          />
                        )
                      ) : (
                        <div className="flex items-center justify-center h-full text-gray-600 py-12">
                          Select a ticket to view the conversation.
                        </div>
                      )
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-600 py-12">
                        Select a ticket to view the conversation.
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
