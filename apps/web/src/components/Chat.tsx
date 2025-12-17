import React, { useEffect, useState, useRef, Suspense } from "react";
import { motion } from "framer-motion";
import ChatService from "../services/ChatService";
import type { ChatMessage as ServiceChatMessage } from "../services/ChatService";
import { useParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
const EmojiPicker = React.lazy(() => import("emoji-picker-react"));

import {
  FaPaperPlane,
  FaSmile,
  FaUser,
  FaUserTie,
  FaSpinner,
} from "react-icons/fa";

// Use the service ChatMessage type at component-level
interface ChatMessage extends ServiceChatMessage {}

interface Props {
  ticketId?: string;
  userId?: string;
  role?: "student" | "admin";
  readOnly?: boolean;
}

export default function TicketChat({
  ticketId: propTicketId,
  userId: propUserId,
  role: propRole,
  readOnly: propReadOnly,
}: Props) {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [hasOlder, setHasOlder] = useState(false);
  const [isTruncated, setIsTruncated] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [containerHeight, setContainerHeight] = useState<number | null>(null);

  const MAX_MESSAGES = 200;
  // Debounce (ms) used for typing indicator expiration
  const TYPING_DEBOUNCE_MS = 700;

  // Derive missing values from router params / auth context when used in a route
  const params = useParams();
  const auth = useAuth();

  const ticketId = propTicketId ?? params.ticketId ?? "";
  const userId = propUserId ?? auth.user?._id ?? "";
  const role = (propRole ??
    (auth.user?.role === "admin" ? "admin" : "student")) as "student" | "admin";
  const readOnly = !!propReadOnly;
  const cacheKey = ticketId ? `ticket_chat_cache_${ticketId}` : null;

  // ------------------------ Emoji ------------------------
  const handleEmojiClick = (emoji: any) => {
    setMessage((prev) => prev + emoji.emoji);
  };

  // ------------------------ Load Messages ------------------------
  // Warm the UI from sessionStorage so a reload does not show an empty panel
  useEffect(() => {
    if (!cacheKey) return;
    try {
      const raw = sessionStorage.getItem(cacheKey);
      if (!raw) return;
      const cached: ChatMessage[] = JSON.parse(raw);
      if (!Array.isArray(cached)) return;
      const sliced = cached.slice(-MAX_MESSAGES);
      setMessages(sliced);
      const hadOverflow = cached.length > MAX_MESSAGES;
      setHasOlder(hadOverflow);
      setIsTruncated(hadOverflow);
    } catch (err) {
      console.warn("Chat cache hydrate failed", err);
    }
  }, [cacheKey]);

  useEffect(() => {
    if (!ticketId || !userId || !role) return;

    let unsubscribe: (() => void) | undefined;
    let cancelled = false;

    (async () => {
      unsubscribe = await ChatService.startTicketSession(ticketId, {
        onInitialMessages: (history) => {
          if (cancelled) return;
          if (Array.isArray(history) && history.length > MAX_MESSAGES) {
            setHasOlder(true);
            setIsTruncated(true);
            setMessages(history.slice(-MAX_MESSAGES));
          } else {
            setHasOlder(false);
            setIsTruncated(false);
            setMessages(history.slice(-MAX_MESSAGES));
          }
        },
        onMessage: (msg) => {
          if (cancelled) return;
          setMessages((prev) => {
            const next = [...prev, msg];
            if (next.length > MAX_MESSAGES) {
              setIsTruncated(true);
              setHasOlder(true);
              return next.slice(-MAX_MESSAGES);
            }
            return next;
          });
        },
        onTyping: (data) => {
          if (cancelled) return;
          if (data.senderId !== userId) setIsTyping(data.isTyping);
        },
      });
    })();

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [ticketId, userId, role]);

  // Persist recent messages per ticket so a page refresh restores the last view instantly
  useEffect(() => {
    if (!cacheKey) return;
    try {
      sessionStorage.setItem(cacheKey, JSON.stringify(messages.slice(-MAX_MESSAGES)));
    } catch (err) {
      // ignore storage quota errors silently
    }
  }, [messages, cacheKey]);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load earlier messages (fetch full history from REST and show all)
  const handleLoadEarlier = async () => {
    if (!ticketId) return;
    try {
      const history = await ChatService.fetchMessages(ticketId);
      setMessages(history.slice(-Math.max(history.length, MAX_MESSAGES)));
      setHasOlder(false);
      setIsTruncated(false);
    } catch (err) {
      console.error("Failed to load earlier messages", err);
    }
  };

  // compute available height so chat fits the viewport (no per-message height changes)
  useEffect(() => {
    const update = () => {
      try {
        if (!rootRef.current) return setContainerHeight(null);
        const top = rootRef.current.getBoundingClientRect().top;
        const avail = window.innerHeight - top - 24; // 24px bottom margin
        // Increase minimum chat height so message area is roomier
        setContainerHeight(Math.max(avail, 520));
      } catch (e) {
        setContainerHeight(null);
      }
    };

    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // ------------------------ Send Message ------------------------
  const handleSend = async () => {
    if (readOnly) return;
    if (!message.trim()) return;

    if (!ticketId || !userId || !role) {
      console.warn("Cannot send: missing ticket/user/role", {
        ticketId,
        userId,
        role,
      });
      return;
    }

    const payload = {
      ticket: ticketId,
      sender: userId,
      senderRole: role,
      message: message.trim(),
    };

    ChatService.sendMessage(payload).then((res) => {
      if (!res?.ok) {
        console.warn("Send failed", res);
      }
      // If fallback saved the message, append it locally so UI updates immediately
      if ((res as any)?.message) {
        const saved = (res as any).message as ChatMessage;
        setMessages((prev) => {
          const next = [...prev, saved];
          return next.length > MAX_MESSAGES ? next.slice(-MAX_MESSAGES) : next;
        });
      }
    });
    setMessage("");
    // reset textarea height after sending so input shrinks back
    setTimeout(() => {
      try {
        if (textareaRef.current) {
          textareaRef.current.style.height = "44px";
          textareaRef.current.style.overflow = "hidden";
        }
      } catch (e) {
        // ignore
      }
    }, 0);
  };

  // ------------------------ Typing ------------------------
  const handleTyping = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (readOnly) return;
    const val = e.target.value;
    setMessage(val);

    // AUTO-RESIZE
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        textareaRef.current.scrollHeight + "px";
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    ChatService.emitTyping(ticketId, val.length > 0, userId);

    typingTimeoutRef.current = setTimeout(() => {
      ChatService.emitTyping(ticketId, false, userId);
    }, TYPING_DEBOUNCE_MS);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ------------------------ UI Helpers ------------------------
  const isOwn = (msg: ChatMessage) => msg.sender === userId;

  const getMessageAlignment = (msg: ChatMessage) =>
    isOwn(msg) ? "flex-end" : "flex-start";

  const getMessageColor = (msg: ChatMessage) => {
    if (isOwn(msg)) return "bg-blue-900 text-white";
    if (msg.senderRole === "admin") return "bg-yellow-300 text-blue-900";
    return "bg-gray-200 text-gray-800";
  };

  const getInitials = (name?: string) => name?.charAt(0)?.toUpperCase() || "U";

  const getRoleIcon = (role: string) => {
    if (role === "admin")
      return <FaUserTie className="text-blue-900 text-xs" />;
    return <FaUser className="text-gray-600 text-xs" />;
  };

  // ------------------------ RENDER --------------------
  return (
    <div
      ref={rootRef}
      className="w-full flex flex-col bg-white border border-gray-200 rounded-2xl shadow-sm"
      style={containerHeight ? { height: `${containerHeight}px` } : undefined}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <div>
          <div className="text-xs text-gray-500">Support Chat</div>
          {ticketId && (
            <div className="text-sm font-semibold text-[#053A4E]">
              Ticket: {ticketId}
            </div>
          )}
        </div>
        <div className="text-xs text-gray-400">Real-time</div>
      </div>

      {/* ---------- Messages ---------- */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-white overflow-x-hidden">
        {hasOlder && (
          <div className="mb-3 flex items-center justify-between bg-yellow-50 border border-yellow-100 text-yellow-800 px-3 py-2 rounded">
            <div className="text-xs">Showing latest {messages.length} messages. Older messages are hidden.</div>
            <button
              className="text-xs underline"
              onClick={handleLoadEarlier}
            >
              Load earlier
            </button>
          </div>
        )}
        {isTruncated && !hasOlder && (
          <div className="mb-3 text-xs text-gray-500">Showing latest messages.</div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${
              getMessageAlignment(msg) === "flex-end"
                ? "justify-end"
                : "justify-start"
            } mb-2`}
          >
            <div className="flex flex-col max-w-[72%] w-full">
              <div
                className={`flex items-end gap-2 ${
                  isOwn(msg) ? "flex-row-reverse" : "flex-row"
                }`}
              >
                {/* Avatar (LMS style) */}
                <div className="relative flex-none">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center overflow-hidden border border-gray-200 ${
                      msg.senderAvatar
                        ? "bg-transparent"
                        : isOwn(msg)
                        ? "bg-[#053A4E] text-white"
                        : msg.senderRole === "admin"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-300 text-gray-700"
                    }`}
                  >
                    {msg.senderAvatar ? (
                      <img
                        src={`${import.meta.env.VITE_SERVER_URL}${
                          msg.senderAvatar
                        }`}
                        className="w-full h-full object-cover"
                        alt={msg.senderName || "avatar"}
                      />
                    ) : (
                      <span className="text-sm font-medium">
                        {getInitials(msg.senderName)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Bubble */}
                <div>
                  {msg.senderName && (
                    <div
                      className={`flex items-center gap-1 mb-1 ${
                        isOwn(msg) ? "justify-end" : "justify-start"
                      }`}
                    >
                      <span className="text-xs text-gray-600">
                        {msg.senderName}
                      </span>
                      {getRoleIcon(msg.senderRole)}
                    </div>
                  )}

                  <div
                    className={`px-4 py-2 rounded-2xl text-sm break-words whitespace-pre-wrap overflow-hidden ${getMessageColor(
                      msg
                    )} ${isOwn(msg) ? "rounded-br-md" : "rounded-bl-md"} shadow-sm`}
                    style={{ wordBreak: "break-word", overflowWrap: "anywhere" }}
                  >
                    <p className="text-sm leading-5">{msg.message}</p>
                  </div>
                </div>
              </div>

              {/* Timestamp */}
              <div
                className={`${isOwn(msg) ? "text-right" : "text-left"} mt-1`}
              >
                <span className="text-[11px] text-gray-400">
                  {new Date(msg.createdAt).toLocaleString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex items-center gap-2">
            <FaSpinner className="animate-spin text-gray-500" />
            <span className="text-sm text-gray-600">typing...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ---------- Input ---------- */}
      <div className="relative p-3 bg-white border-t">
        {showEmojiPicker && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-16 right-4 z-50"
          >
            <Suspense fallback={<div className="p-2">Loading…</div>}>
              <EmojiPicker onEmojiClick={handleEmojiClick} />
            </Suspense>
          </motion.div>
        )}
        {!readOnly ? (
          <div className="flex items-end gap-3">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={handleTyping}
              onKeyDown={handleKeyDown}
              placeholder="Write a message..."
                className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-full 
               focus:ring-2 focus:ring-[#053A4E] resize-none overflow-hidden"
                style={{ minHeight: "60px", maxHeight: "250px" }}
            />

            {/* Emoji */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              onClick={() => setShowEmojiPicker((s) => !s)}
              className="p-3 rounded-full hover:bg-blue-50"
            >
              <FaSmile />
            </motion.button>

            {/* Send */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              disabled={!message.trim()}
              onClick={handleSend}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${
                message.trim()
                  ? "bg-[#053A4E] text-white"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            >
              <FaPaperPlane />
              <span>Send</span>
            </motion.button>
          </div>
        ) : (
          <div className="text-sm text-gray-500">This conversation is read-only.</div>
        )}
      </div>
    </div>
  );
}
