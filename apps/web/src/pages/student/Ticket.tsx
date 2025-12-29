import React, { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import { FaUser, FaEnvelope, FaPhoneAlt, FaClipboardList, FaFlag, FaComments } from "react-icons/fa";
import { useAuth } from "../../contexts/AuthContext";
import TicketService from "../../services/TicketService";
import ChatService from "../../services/ChatService";
import Chat from "../../components/Chat";

type TicketFormState = {
  name: string;
  email: string;
  phoneNumber: string;
  category: string;
  priority: string;
  message: string;
};
const CATEGORY_OPTIONS = [
  "Technical Issue",
  "Billing & Payments",
  "Class Content",
  "Account & Login",
  "Other",
];

const PRIORITY_OPTIONS = ["Low", "Medium", "High"];
export default function StudentTicketPage(): React.ReactElement {
  const { user, accessToken, loading: authLoading } = useAuth();
  const [ticketId, setTicketId] = useState<string | null>(null);
  const [ticketInfo, setTicketInfo] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMarkingResolved, setIsMarkingResolved] = useState(false);
  const [form, setForm] = useState<TicketFormState>({
    name: "",
    email: "",
    phoneNumber: "",
    category: CATEGORY_OPTIONS[0],
    priority: "Low",
    message: "",
  });

  useEffect(() => {
    if (!user) return;
    // restore an open ticket for this user from the server (no localStorage)
    (async () => {
      try {
        const open = await TicketService.getOpenTicketForUser(user._id);
        if (open && open._id) {
          setTicketId(String(open._id));
        }
      } catch (err) {
        console.error("Failed to restore open ticket", err);
      }
    })();
    const rawPhone = (user?.phoneNumber || (user as any)?.phone || (user as any)?.contactNumber || "") as string;
    const digits = rawPhone.replace(/\D/g, "");

    setForm((prev) => ({
      ...prev,
      name: prev.name || `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim(),
      email: prev.email || user.email || "",
      phoneNumber: prev.phoneNumber || (digits ? digits : ""),
    }));
  }, [user]);

  const isDisabled = useMemo(() => isSubmitting || authLoading, [isSubmitting, authLoading]);

  const isResolved = useMemo(() => {
    return String(ticketInfo?.status ?? "").toLowerCase() === "resolved";
  }, [ticketInfo?.status]);

  // Helper to determine if a ticket (or a status string) represents a closed state
  const isTicketClosed = (ticketOrStatus: any) => {
    const status = typeof ticketOrStatus === "string" ? ticketOrStatus : ticketOrStatus?.status;
    return ["closed", "close"].includes(String(status ?? "").toLowerCase());
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: name === "phoneNumber" ? value.replace(/\D/g, "") : value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!user) {
      Swal.fire({
        icon: "info",
        title: "Please sign in",
        text: "You need to be logged in to create a ticket.",
        confirmButtonColor: "#053A4E",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        user_id: user._id,
        name: form.name.trim(),
        email: form.email.trim(),
        phoneNumber: form.phoneNumber.trim(),
        Categories: form.category, // backend expects the key `Categories`
        message: form.message.trim(),
        priority: form.priority,
      };

      const newTicket = await TicketService.createTicket(payload);
      // Try common id fields and a few nested/alternate shapes
      let id: string | null = null;
      if (newTicket) {
        const anyT = newTicket as any;
        id = anyT._id ?? anyT.id ?? anyT.ticketId ?? (anyT.ticket && (anyT.ticket._id ?? anyT.ticket.id)) ?? null;
      }
      if (id) setTicketId(String(id));
      // no local persistence: rely on server-side lookup for open tickets
      Swal.fire({
        icon: "success",
        title: "Ticket created",
        text: "We have received your ticket. Our support team will reach out soon.",
        confirmButtonColor: "#053A4E",
      });
      setForm({
        name: user ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() : "",
        email: user?.email ?? "",
        phoneNumber: "",
        category: CATEGORY_OPTIONS[0],
        priority: "Low",
        message: "",
      });
    } catch (error: any) {
      Swal.fire({
        icon: "error",
        title: "Could not create ticket",
        text:
          error?.response?.data?.message ||
          "Something went wrong while submitting your ticket. Please try again.",
        confirmButtonColor: "#d33",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // When we have a ticket id, fetch its details (status, category)
  useEffect(() => {
    if (!ticketId) return;

    let cancelled = false;
    (async () => {
      try {
        const t = await TicketService.getTicketById(ticketId);
        if (cancelled) return;
        setTicketInfo(t ?? null);
        // if ticket closed, reset local state (no localStorage used)
        if (t && isTicketClosed(t)) {
          setTicketId(null);
          setTicketInfo(null);
        }
      } catch (err) {
        console.error("Failed to load ticket info", err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [ticketId]);

  // Real-time status updates for the student's ticket
  useEffect(() => {
    if (!ticketId || !accessToken) return;

    ChatService.joinTicket(ticketId);

    const handleStatus = (payload: any) => {
      if (!payload?._id || payload._id !== ticketId) return;
      setTicketInfo((prev: any) => (prev ? { ...prev, ...payload } : payload));
    };

    ChatService.onTicketStatusUpdated(handleStatus);
    return () => ChatService.offTicketStatusUpdated(handleStatus);
  }, [ticketId, accessToken]);

  const handleMarkResolved = async () => {
    if (!ticketId || !user) return;
    if (isMarkingResolved || isResolved) return;
    setIsMarkingResolved(true);
    try {
      // Send a final message before switching to Resolved (some backends block sending after resolved).
      ChatService.joinTicket(ticketId);
      await ChatService.sendMessage({
        ticket: ticketId,
        sender: user._id,
        senderRole: "student",
        senderName: `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim(),
        senderAvatar: (user as any)?.profilePic || (user as any)?.avatar,
        message: "My problem is solved. Please close this ticket and delete the chat history.",
        clientMessageId: `${Date.now()}_${Math.random().toString(16).slice(2)}`,
      });

      const updated = await TicketService.updateTicket(ticketId, { status: "Resolved" });
      setTicketInfo(updated);
      Swal.fire({
        icon: "success",
        title: "Marked as resolved",
        text: "We tagged this ticket as Resolved. An admin can still close it if needed.",
        confirmButtonColor: "#053A4E",
      });
    } catch (err: any) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "Unable to mark as resolved",
        text: err?.response?.data?.message || "Could not update ticket status.",
        confirmButtonColor: "#d33",
      });
    } finally {
      setIsMarkingResolved(false);
    }
  };

  const inChatMode = ticketId && ticketInfo && !isTicketClosed(ticketInfo);

  return (
      <div className={`max-w-7xl mx-auto ${inChatMode ? 'h-[calc(100vh-64px)] supports-[height:100dvh]:h-[calc(100dvh-64px)] md:h-auto md:min-h-0' : ''}`}>
        <div className={`bg-white rounded-2xl shadow-sm ${inChatMode ? 'h-full flex flex-col overflow-hidden md:h-auto md:block md:overflow-visible p-0 md:p-8' : 'p-4 md:p-8'}`}>
          {inChatMode ? (
            // Ticket exists and is not closed: show only chat with heading
            <div className="flex flex-col h-full md:block">
              <header className="shrink-0 p-4 border-b md:border-none md:p-0 md:mb-4 bg-gray-50/50 md:bg-white">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Ticket #{ticketId?.slice(-6)}</p>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${isResolved ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                        {ticketInfo?.status ?? "Open"}
                      </span>
                    </div>
                    <h1 className="text-lg md:text-2xl font-semibold text-[#053A4E] line-clamp-1">{ticketInfo?.category ?? "Support Request"}</h1>
                    <p className="text-xs text-gray-400 line-clamp-1 mt-0.5">{ticketInfo?.message}</p>
                  </div>
                  {!isTicketClosed(ticketInfo) && !isResolved && (
                    <button
                      type="button"
                      className="text-xs px-3 py-1.5 rounded-lg bg-green-50 border border-green-200 text-green-700 disabled:opacity-60 font-medium whitespace-nowrap"
                      onClick={handleMarkResolved}
                      disabled={isMarkingResolved}
                    >
                      {isMarkingResolved ? "..." : "Resolve"}
                    </button>
                  )}
                </div>
              </header>
              <div className="flex-1 min-h-0 md:min-h-[500px] md:h-[600px] relative">
                <Chat ticketId={ticketId} readOnly={isResolved} heightMode="parent" hideHeader />
              </div>
            </div>
          ) : (
            <>
              <header className="mb-6">
                <p className="text-sm text-gray-500">Support</p>
                <h1 className="text-2xl md:text-3xl font-semibold text-[#053A4E]">Submit a Ticket</h1>
                <p className="text-gray-600 mt-2">Describe the issue you are facing and we will get back to you.</p>
              </header>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex flex-col gap-1 text-sm font-semibold text-[#053A4E]">
                Full name
                <div className="relative">
                  <FaUser className="absolute left-3 top-1/2 -translate-y-1/2 text-[#05668A]" />
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    required
                    minLength={2}
                    maxLength={80}
                    placeholder="Your name"
                    className="w-full bg-white border border-gray-200 pl-10 pr-3 py-3 rounded-xl focus:border-[#05668A] focus:ring-1 focus:ring-[#05668A]"
                  />
                </div>
              </label>

              <label className="flex flex-col gap-1 text-sm font-semibold text-[#053A4E]">
                Email
                <div className="relative">
                  <FaEnvelope className="absolute left-3 top-1/2 -translate-y-1/2 text-[#05668A]" />
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    required
                    placeholder="name@example.com"
                    className="w-full bg-white border border-gray-200 pl-10 pr-3 py-3 rounded-xl focus:border-[#05668A] focus:ring-1 focus:ring-[#05668A]"
                  />
                </div>
              </label>

              <label className="flex flex-col gap-1 text-sm font-semibold text-[#053A4E]">
                Phone number
                <div className="relative">
                  <FaPhoneAlt className="absolute left-3 top-1/2 -translate-y-1/2 text-[#05668A]" />
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={form.phoneNumber}
                    onChange={handleChange}
                    required
                    placeholder="0712345678"
                    className="w-full bg-white border border-gray-200 pl-10 pr-3 py-3 rounded-xl focus:border-[#05668A] focus:ring-1 focus:ring-[#05668A]"
                  />
                </div>
                <span className="text-xs text-gray-500">Enter a 10 digit number</span>
              </label>

              <label className="flex flex-col gap-1 text-sm font-semibold text-[#053A4E]">
                Category
                <div className="relative">
                  <FaClipboardList className="absolute left-3 top-1/2 -translate-y-1/2 text-[#05668A]" />
                  <select
                    name="category"
                    value={form.category}
                    onChange={handleChange}
                    className="w-full bg-white border border-gray-200 pl-10 pr-3 py-3 rounded-xl focus:border-[#05668A] focus:ring-1 focus:ring-[#05668A]"
                  >
                    {CATEGORY_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
              </label>

              <label className="flex flex-col gap-1 text-sm font-semibold text-[#053A4E]">
                Priority
                <div className="relative">
                  <FaFlag className="absolute left-3 top-1/2 -translate-y-1/2 text-[#05668A]" />
                  <select
                    name="priority"
                    value={form.priority}
                    onChange={handleChange}
                    className="w-full bg-white border border-gray-200 pl-10 pr-3 py-3 rounded-xl focus:border-[#05668A] focus:ring-1 focus:ring-[#05668A]"
                  >
                    {PRIORITY_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
              </label>
            </div>

            <label className="flex flex-col gap-1 text-sm font-semibold text-[#053A4E]">
              Describe your issue
              <div className="relative">
                <FaComments className="absolute left-3 top-4 text-[#05668A]" />
                <textarea
                  name="message"
                  value={form.message}
                  onChange={handleChange}
                  required
                  minLength={10}
                  maxLength={600}
                  rows={6}
                  placeholder="Share details that help us resolve this quickly."
                  className="w-full bg-white border border-gray-200 pl-10 pr-3 py-3 rounded-xl focus:border-[#05668A] focus:ring-1 focus:ring-[#05668A]"
                />
              </div>
              <span className="text-xs text-gray-500">{form.message.length}/600 characters</span>
            </label>

            <button
              type="submit"
              disabled={isDisabled}
              className={`w-full md:w-auto px-6 py-3 rounded-xl font-semibold text-white bg-[#053A4E] hover:bg-[#05668A] transition shadow-md flex items-center justify-center gap-2 ${
                isDisabled ? "opacity-70 cursor-not-allowed" : ""
              }`}
            >
              {isSubmitting ? (
                <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                "Create Ticket"
              )}
            </button>
          </form>
            </>
          )}
        </div>
        
      </div>
  );
}
