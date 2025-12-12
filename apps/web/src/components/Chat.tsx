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
  FaSpinner
} from "react-icons/fa";


// Use the service ChatMessage type at component-level
interface ChatMessage extends ServiceChatMessage {}

interface Props {
  ticketId?: string;
  userId?: string;
  role?: "student" | "admin";
}


export default function TicketChat({ ticketId: propTicketId, userId: propUserId, role: propRole }: Props) {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const MAX_MESSAGES = 200;

  // Derive missing values from router params / auth context when used in a route
  const params = useParams();
  const auth = useAuth();

  const ticketId = propTicketId ?? params.ticketId ?? "";
  const userId = propUserId ?? auth.user?._id ?? "";
  const role = (propRole ?? (auth.user?.role === "admin" ? "admin" : "student")) as "student" | "admin";

  // ------------------------ Emoji ------------------------
  const handleEmojiClick = (emoji: any) => {
    setMessage((prev) => prev + emoji.emoji);
  };

  // ------------------------ Load Messages ------------------------
  useEffect(() => {
    if (!ticketId || !userId || !role) return;

    let unsubscribe: (() => void) | undefined;
    let cancelled = false;

    (async () => {
      unsubscribe = await ChatService.startTicketSession(ticketId, {
        onInitialMessages: (history) => {
          if (cancelled) return;
          setMessages(history.slice(-MAX_MESSAGES));
        },
        onMessage: (msg) => {
          if (cancelled) return;
          setMessages((prev) => {
            const next = [...prev, msg];
            return next.length > MAX_MESSAGES ? next.slice(-MAX_MESSAGES) : next;
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

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ------------------------ Send Message ------------------------
  const handleSend = async () => {
    if (!message.trim()) return;

    if (!ticketId || !userId || !role) {
      console.warn("Cannot send: missing ticket/user/role", { ticketId, userId, role });
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
    });
    setMessage("");
  };

  // ------------------------ Typing ------------------------
  const handleTyping = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setMessage(val);

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    ChatService.emitTyping(ticketId, val.length > 0, userId);

    typingTimeoutRef.current = setTimeout(() => {
      ChatService.emitTyping(ticketId, false, userId);
    }, 700);
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

  const getInitials = (name?: string) =>
    name?.charAt(0)?.toUpperCase() || "U";

  const getRoleIcon = (role: string) => {
    if (role === "admin") return <FaUserTie className="text-blue-900 text-xs" />;
    return <FaUser className="text-gray-600 text-xs" />;
  };

  // ------------------------ RENDER --------------------
  return (
    <div className="w-full h-full flex flex-col bg-gradient-to-br from-blue-50 to-amber-50">
      {/* ---------- Messages ---------- */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${getMessageAlignment(msg) === "flex-end" ? "justify-end" : "justify-start"} mb-4`}
          >
            <div className="flex flex-col max-w-[80%]">
              <div
                className={`flex items-end gap-2 ${
                  isOwn(msg) ? "flex-row-reverse" : "flex-row"
                }`}
              >
                {/* Avatar */}
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-100 to-amber-100 flex items-center justify-center shadow">
                  {msg.senderAvatar ? (
                    <img
                      src={`${import.meta.env.VITE_SERVER_URL}${msg.senderAvatar}`}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-sm font-semibold text-blue-900">
                      {getInitials(msg.senderName)}
                    </span>
                  )}
                </div>

                {/* Bubble */}
                <div>
                  {msg.senderName && (
                    <div className={`flex items-center gap-1 mb-1 ${isOwn(msg) ? "justify-end" : "justify-start"}`}>
                      <span className="text-xs text-gray-600">{msg.senderName}</span>
                      {getRoleIcon(msg.senderRole)}
                    </div>
                  )}

                  <div
                    className={`px-4 py-2 rounded-2xl ${getMessageColor(msg)} ${
                      isOwn(msg) ? "rounded-br-md" : "rounded-bl-md"
                    }`}
                  >
                    <p className="text-sm break-words">{msg.message}</p>
                  </div>
                </div>
              </div>

              {/* Timestamp */}
              <div className={`${isOwn(msg) ? "text-right" : "text-left"} mt-1`}>
                <span className="text-xs text-gray-500">
                  {new Date(msg.createdAt).toLocaleTimeString([], {
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
      <div className="relative p-4 bg-white border-t">
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

        <div className="flex items-end gap-3">
          <textarea
            value={message}
            onChange={handleTyping}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-900 resize-none"
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
            className={`p-3 rounded-full ${
              message.trim()
                ? "bg-blue-900 text-white"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            <FaPaperPlane />
          </motion.button>
        </div>
      </div>
    </div>
  );
}
