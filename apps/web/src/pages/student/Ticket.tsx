import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import Swal from "sweetalert2";
import {
  User,
  Mail,
  Phone,
  ClipboardList,
  Flag,
  MessageSquare,
  LifeBuoy,
  Send,
  CheckCircle2,
  Loader2,
  Sparkles,
  ShieldCheck,
  Clock,
} from "lucide-react";
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

const PRIORITY_OPTIONS = [
  { value: "Low", dot: "bg-emerald-500", active: "border-emerald-500 bg-emerald-50 text-emerald-700" },
  { value: "Medium", dot: "bg-amber-400", active: "border-amber-400 bg-amber-50 text-amber-700" },
  { value: "High", dot: "bg-red-500", active: "border-red-400 bg-red-50 text-red-700" },
];

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

    const rawPhone = (user?.phoneNumber ||
      (user as any)?.phone ||
      (user as any)?.contactNumber ||
      "") as string;
    const digits = rawPhone.replace(/\D/g, "");

    setForm((prev) => ({
      ...prev,
      name: prev.name || `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim(),
      email: prev.email || user.email || "",
      phoneNumber: prev.phoneNumber || (digits ? digits : ""),
    }));
  }, [user]);

  const isDisabled = useMemo(
    () => isSubmitting || authLoading,
    [isSubmitting, authLoading]
  );

  const isResolved = useMemo(() => {
    return String(ticketInfo?.status ?? "").toLowerCase() === "resolved";
  }, [ticketInfo?.status]);

  const isTicketClosed = (ticketOrStatus: any) => {
    const status =
      typeof ticketOrStatus === "string"
        ? ticketOrStatus
        : ticketOrStatus?.status;
    return ["closed", "close"].includes(String(status ?? "").toLowerCase());
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === "phoneNumber" ? value.replace(/\D/g, "") : value,
    }));
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
        Categories: form.category,
        message: form.message.trim(),
        priority: form.priority,
      };

      const newTicket = await TicketService.createTicket(payload);
      let id: string | null = null;
      if (newTicket) {
        const anyT = newTicket as any;
        id =
          anyT._id ??
          anyT.id ??
          anyT.ticketId ??
          (anyT.ticket && (anyT.ticket._id ?? anyT.ticket.id)) ??
          null;
      }
      if (id) setTicketId(String(id));

      Swal.fire({
        icon: "success",
        title: "Ticket created",
        text: "We have received your ticket. Our support team will reach out soon.",
        confirmButtonColor: "#053A4E",
      });

      setForm({
        name: user
          ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim()
          : "",
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

  // Fetch ticket details when ticketId changes
  useEffect(() => {
    if (!ticketId) return;

    let cancelled = false;
    (async () => {
      try {
        const t = await TicketService.getTicketById(ticketId);
        if (cancelled) return;
        setTicketInfo(t ?? null);
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

  // Real-time status updates
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
      ChatService.joinTicket(ticketId);
      await ChatService.sendMessage({
        ticket: ticketId,
        sender: user._id,
        senderRole: "student",
        senderName: `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim(),
        senderAvatar: (user as any)?.profilePic || (user as any)?.avatar,
        message:
          "My problem is solved. Please close this ticket and delete the chat history.",
        clientMessageId: `${Date.now()}_${Math.random().toString(16).slice(2)}`,
      });

      const updated = await TicketService.updateTicket(ticketId, {
        status: "Resolved",
      });
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

  const inChatMode = Boolean(
    ticketId && ticketInfo && !isTicketClosed(ticketInfo)
  );

  // --- VIEW 1: ACTIVE SUPPORT CHAT ---
  if (inChatMode) {
    return (
      <div className="max-w-5xl mx-auto h-[calc(100vh-8rem)] supports-[height:100dvh]:h-[calc(100dvh-8rem)] md:h-auto pb-4 sm:pb-8">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-xl shadow-brand-prussian/10 border border-gray-100 h-full flex flex-col overflow-hidden"
        >
          {/* Branded Ticket Header */}
          <header className="relative bg-gradient-to-r from-brand-prussian via-[#0d3a4b] to-brand-cerulean px-5 py-4 sm:px-6 sm:py-5 text-white shrink-0 overflow-hidden">
            <div className="pointer-events-none absolute -top-12 -right-12 w-40 h-40 bg-brand-jasmine/20 rounded-full blur-2xl" />

            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-white/75 bg-white/10 px-2.5 py-0.5 rounded-full border border-white/15">
                    Ticket #{ticketId?.slice(-6).toUpperCase()}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider border ${isResolved
                        ? "bg-emerald-400/20 text-emerald-200 border-emerald-300/30"
                        : "bg-brand-jasmine/20 text-brand-jasmine border-brand-jasmine/30"
                      }`}
                  >
                    {isResolved ? (
                      <CheckCircle2 size={11} />
                    ) : (
                      <Clock size={11} />
                    )}
                    {ticketInfo?.status ?? "Open"}
                  </span>
                </div>

                <h1 className="text-lg sm:text-xl font-extrabold tracking-tight truncate">
                  {ticketInfo?.category ?? "Support Request"}
                </h1>
                {ticketInfo?.message && (
                  <p className="text-xs text-white/75 line-clamp-1 mt-0.5">
                    {ticketInfo.message}
                  </p>
                )}
              </div>

              {!isTicketClosed(ticketInfo) && !isResolved && (
                <button
                  type="button"
                  onClick={handleMarkResolved}
                  disabled={isMarkingResolved}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold shadow-md transition-all active:scale-95 disabled:opacity-60 shrink-0 self-start sm:self-center"
                >
                  {isMarkingResolved ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <CheckCircle2 size={14} />
                  )}
                  <span>
                    {isMarkingResolved ? "Resolving..." : "Mark Resolved"}
                  </span>
                </button>
              )}
            </div>
          </header>

          {/* Resolved Notice Banner */}
          {isResolved && (
            <div className="px-5 py-2.5 bg-emerald-50 border-b border-emerald-100 text-emerald-700 text-xs font-semibold flex items-center gap-2 shrink-0">
              <CheckCircle2 size={14} className="shrink-0" />
              <span>
                This ticket has been marked as resolved. Chat is now read-only
                until an admin closes it.
              </span>
            </div>
          )}

          {/* Chat Workspace */}
          <div className="flex-1 min-h-0 md:min-h-[520px] md:h-[600px] relative bg-[#f8fafc]">
            <Chat
              ticketId={ticketId!}
              readOnly={isResolved}
              heightMode="parent"
              hideHeader
            />
          </div>
        </motion.div>
      </div>
    );
  }

  // --- VIEW 2: CREATE NEW TICKET ---
  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-24 sm:pb-10">
      {/* Hero Banner */}
      <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-brand-prussian via-[#0d3a4b] to-brand-cerulean p-6 sm:p-8 text-white shadow-xl shadow-brand-prussian/15">
        <div className="pointer-events-none absolute -top-20 -right-16 w-64 h-64 rounded-full bg-brand-jasmine/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-1/3 w-56 h-56 rounded-full bg-white/10 blur-3xl" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-semibold text-brand-jasmine mb-2.5">
              <Sparkles size={12} />
              <span>Support Center</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Submit a Support Ticket
            </h1>
            <p className="text-white/75 text-sm sm:text-base mt-1 max-w-xl">
              Facing a technical issue, payment question, or class access
              problem? Send us the details and we'll help you right away.
            </p>
          </div>

          <div className="w-12 h-12 rounded-2xl bg-white/15 border border-white/20 backdrop-blur-md flex items-center justify-center shrink-0 self-start sm:self-center">
            <LifeBuoy size={24} className="text-brand-jasmine" />
          </div>
        </div>
      </section>

      {/* Ticket Form Card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 sm:p-8"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Contact Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Full Name */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">
                Full Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                />
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  minLength={2}
                  maxLength={80}
                  placeholder="Your full name"
                  className="w-full bg-gray-50 border border-gray-200/90 pl-10 pr-4 py-3 rounded-xl text-sm font-medium text-gray-800 focus:bg-white focus:border-brand-cerulean focus:ring-2 focus:ring-brand-cerulean/15 outline-none transition-all"
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">
                Email Address <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                />
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  placeholder="name@example.com"
                  className="w-full bg-gray-50 border border-gray-200/90 pl-10 pr-4 py-3 rounded-xl text-sm font-medium text-gray-800 focus:bg-white focus:border-brand-cerulean focus:ring-2 focus:ring-brand-cerulean/15 outline-none transition-all"
                />
              </div>
            </div>

            {/* Phone Number */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Phone
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                />
                <input
                  type="tel"
                  name="phoneNumber"
                  value={form.phoneNumber}
                  onChange={handleChange}
                  required
                  placeholder="0712345678"
                  className="w-full bg-gray-50 border border-gray-200/90 pl-10 pr-4 py-3 rounded-xl text-sm font-medium text-gray-800 focus:bg-white focus:border-brand-cerulean focus:ring-2 focus:ring-brand-cerulean/15 outline-none transition-all"
                />
              </div>
              <p className="text-[11px] text-gray-400 font-medium">
                Enter a 10-digit mobile number
              </p>
            </div>

            {/* Category */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">
                Category <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <ClipboardList
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                />
                <select
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  className="w-full bg-gray-50 border border-gray-200/90 pl-10 pr-4 py-3 rounded-xl text-sm font-medium text-gray-800 focus:bg-white focus:border-brand-cerulean focus:ring-2 focus:ring-brand-cerulean/15 outline-none transition-all"
                >
                  {CATEGORY_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Priority Pills */}
          <div className="space-y-2">
            <label className="flex items-center gap-1.5 text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">
              <Flag size={12} className="text-brand-cerulean" />
              Priority Level
            </label>
            <div className="grid grid-cols-3 gap-3">
              {PRIORITY_OPTIONS.map((opt) => {
                const isSelected = form.priority === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() =>
                      setForm((prev) => ({ ...prev, priority: opt.value }))
                    }
                    className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border-2 text-xs sm:text-sm font-bold transition-all ${isSelected
                        ? opt.active
                        : "border-gray-100 bg-gray-50/70 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                      }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${opt.dot}`} />
                    <span>{opt.value}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Issue Description */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">
                Describe Your Issue <span className="text-red-500">*</span>
              </label>
              <span
                className={`text-[11px] font-semibold ${form.message.length >= 600 ? "text-red-500" : "text-gray-400"
                  }`}
              >
                {form.message.length} / 600
              </span>
            </div>

            <div className="relative">
              <MessageSquare
                size={16}
                className="absolute left-3.5 top-3.5 text-gray-400 pointer-events-none"
              />
              <textarea
                name="message"
                value={form.message}
                onChange={handleChange}
                required
                minLength={10}
                maxLength={600}
                rows={5}
                placeholder="Share clear details (e.g., class name, error message, or payment date) so we can help you faster..."
                className="w-full bg-gray-50 border border-gray-200/90 pl-10 pr-4 py-3 rounded-2xl text-sm font-medium text-gray-800 placeholder:text-gray-400 focus:bg-white focus:border-brand-cerulean focus:ring-2 focus:ring-brand-cerulean/15 outline-none transition-all resize-y leading-relaxed"
              />
            </div>
          </div>

          {/* Footer Submit Row */}
          <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
              <ShieldCheck size={15} className="text-emerald-500 shrink-0" />
              <span>Once submitted, a live support chat will open automatically.</span>
            </div>

            <button
              type="submit"
              disabled={isDisabled}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl font-extrabold text-sm text-white bg-brand-prussian hover:bg-brand-cerulean transition-all shadow-md shadow-brand-prussian/20 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed shrink-0"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Creating Ticket...</span>
                </>
              ) : (
                <>
                  <Send size={15} />
                  <span>Create Ticket</span>
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}