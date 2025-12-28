import React, { useEffect, useState, useRef, Suspense } from "react";
import { motion } from "framer-motion";
import ChatService from "../services/ChatService";
import type { ChatMessage as ServiceChatMessage } from "../services/ChatService";
import api from "../services/api";
import { useParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
const EmojiPicker = React.lazy(() => import("emoji-picker-react"));

import {
  FaPaperPlane,
  FaSmile,
  FaUser,
  FaUserTie,
  FaSpinner,
  FaPaperclip,
  FaTimes,
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

  type PendingAttachment = {
    id: string;
    localUrl?: string;
    uploading: boolean;
    error?: string;
    attachment?: NonNullable<ChatMessage["attachments"]>[number];
    fileType: "image" | "file";
    originalName: string;
    fileSize?: number;
  };

  const [pendingAttachments, setPendingAttachments] = useState<PendingAttachment[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [containerHeight, setContainerHeight] = useState<number | null>(null);

  const MAX_MESSAGES = 200;
  // Debounce (ms) used for typing indicator expiration
  const TYPING_DEBOUNCE_MS = 700;

  // Derive missing values from router params / auth context when used in a route
  const params = useParams();
  const auth = useAuth();
  const accessToken = auth.accessToken;

  const ticketId = propTicketId ?? params.ticketId ?? "";
  const userId = propUserId ?? auth.user?._id ?? "";
  const role = (propRole ??
    (auth.user?.role === "admin" ? "admin" : "student")) as "student" | "admin";
  const readOnly = !!propReadOnly;
  const cacheKey = ticketId ? `ticket_chat_cache_${ticketId}` : null;

  // Ensure socket client connects once a token exists (avoids init early-return when token is still loading)
  useEffect(() => {
    if (accessToken) {
      ChatService.init();
    }
  }, [accessToken]);

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
            const clientId = (msg as any)?.clientMessageId as string | undefined;
            if (clientId) {
              const idx = prev.findIndex((m) => (m as any)?.clientMessageId === clientId);
              if (idx >= 0) {
                const next = [...prev];
                next[idx] = msg;
                return next.length > MAX_MESSAGES ? next.slice(-MAX_MESSAGES) : next;
              }
            }

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
    const trimmed = message.trim();

    const hasAnyUploading = pendingAttachments.some((p) => p.uploading);
    const uploadedAttachments = pendingAttachments
      .map((p) => p.attachment)
      .filter(Boolean) as NonNullable<ChatMessage["attachments"]>;

    if (hasAnyUploading) return;
    if (!trimmed && uploadedAttachments.length === 0) return;

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
      message: trimmed,
      attachments: uploadedAttachments,
      clientMessageId: `${Date.now()}_${Math.random().toString(16).slice(2)}`,
    };

    // Optimistic bubble: show immediately (especially for images)
    const optimisticAttachments = pendingAttachments
      .map((p) => {
        if (p.fileType === "image" && p.localUrl) {
          return {
            url: p.localUrl,
            fileType: "image" as const,
            originalName: p.originalName,
            fileSize: p.fileSize,
          };
        }
        if (p.attachment) return p.attachment;
        return null;
      })
      .filter(Boolean) as NonNullable<ChatMessage["attachments"]>;

    const optimisticMsg: ChatMessage = {
      _id: `client_${payload.clientMessageId}`,
      ticket: ticketId,
      sender: userId,
      senderRole: role,
      senderName: auth.user
        ? `${auth.user.firstName || ""} ${auth.user.lastName || ""}`.trim()
        : undefined,
      senderAvatar: (auth.user as any)?.profilePic || (auth.user as any)?.avatar,
      clientMessageId: payload.clientMessageId,
      message: trimmed,
      attachments: optimisticAttachments,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => {
      const next = [...prev, optimisticMsg];
      return next.length > MAX_MESSAGES ? next.slice(-MAX_MESSAGES) : next;
    });

    ChatService.sendMessage(payload).then((res) => {
      if (!res?.ok) {
        console.warn("Send failed", res);
      }
      // Replace optimistic message with server message (socket ack or REST fallback)
      const saved = (res as any)?.message as ChatMessage | undefined;
      if (saved?.clientMessageId) {
        setMessages((prev) => {
          const idx = prev.findIndex((m) => (m as any)?.clientMessageId === saved.clientMessageId);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = saved;
            return next.length > MAX_MESSAGES ? next.slice(-MAX_MESSAGES) : next;
          }
          const next = [...prev, saved];
          return next.length > MAX_MESSAGES ? next.slice(-MAX_MESSAGES) : next;
        });
      }
    });
    setMessage("");
    // Don't revoke local preview URLs here; optimistic bubble may still be using them.
    setPendingAttachments([]);
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

  const handlePickFile = () => {
    if (readOnly) return;
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (readOnly) return;
    const file = e.target.files?.[0];
    // allow selecting the same file again
    e.target.value = "";
    if (!file) return;

    const isImage = file.type.startsWith("image/");
    const localUrl = isImage ? URL.createObjectURL(file) : undefined;
    const id = `${Date.now()}_${Math.random().toString(16).slice(2)}`;

    const pending: PendingAttachment = {
      id,
      localUrl,
      uploading: true,
      fileType: isImage ? "image" : "file",
      originalName: file.name,
      fileSize: file.size,
    };

    setPendingAttachments((prev) => [...prev, pending]);

    try {
      const attachment = await ChatService.uploadTicketAttachment(file);
      setPendingAttachments((prev) =>
        prev.map((p) =>
          p.id === id
            ? {
                ...p,
                uploading: false,
                error: undefined,
                attachment,
              }
            : p
        )
      );
    } catch (err) {
      console.error("Attachment upload failed", err);
      setPendingAttachments((prev) =>
        prev.map((p) =>
          p.id === id
            ? {
                ...p,
                uploading: false,
                error: "Upload failed",
              }
            : p
        )
      );
    } finally {
    }
  };

  const removePendingAttachment = (idx: number) => {
    setPendingAttachments((prev) => {
      const target = prev[idx];
      if (target?.localUrl) URL.revokeObjectURL(target.localUrl);
      return prev.filter((_, i) => i !== idx);
    });
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

  const formatBytes = (bytes?: number) => {
    if (!bytes || bytes <= 0) return "";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1);
    const value = bytes / Math.pow(k, i);
    return `${value.toFixed(value >= 10 || i === 0 ? 0 : 1)} ${sizes[i]}`;
  };

  const getAbsoluteUrl = (url: string) => {
    if (!url) return url;
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    if (url.startsWith("blob:") || url.startsWith("data:")) return url;

    const fallback = typeof window !== "undefined" ? window.location.origin : "";
    const rawBase =
      (import.meta as any).env?.VITE_SERVER_URL ||
      api?.defaults?.baseURL ||
      (import.meta as any).env?.VITE_API_URL ||
      fallback;

    try {
      const base = new URL(rawBase, fallback || "http://localhost");
      // Uploaded files are served at /uploads (root). Strip any /api/v* suffix.
      base.pathname = base.pathname.replace(/\/?api(\/v\d+)?\/?$/i, "");
      return `${base.toString().replace(/\/$/, "")}${url}`;
    } catch {
      return `${rawBase}${url}`;
    }
  };

  const renderAttachments = (msg: ChatMessage) => {
    const atts = msg.attachments;
    if (!atts || atts.length === 0) return null;

    return (
      <div className="mt-2 space-y-2">
        {atts.map((att, idx) => {
          const href = getAbsoluteUrl(att.url);
          const name = att.originalName || att.fileName || "Attachment";

          if (att.fileType === "image") {
            return (
              <a
                key={idx}
                href={href}
                target="_blank"
                rel="noreferrer"
                className="block"
              >
                <img
                  src={href}
                  alt={name}
                  className="max-h-64 w-auto rounded-lg border border-black/10"
                />
              </a>
            );
          }

          return (
            <a
              key={idx}
              href={href}
              download={name}
              className="block"
            >
              <div className="flex items-center justify-between gap-3 p-2 rounded-lg bg-black/10 hover:bg-black/20">
                <div className="flex items-center gap-2 min-w-0">
                  <FaPaperclip className="shrink-0" />
                  <div className="min-w-0">
                    <div className="truncate text-sm">{name}</div>
                    {!!att.fileSize && (
                      <div className="text-[11px] opacity-80">
                        {formatBytes(att.fileSize)}
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-xs underline">Download</div>
              </div>
            </a>
          );
        })}
      </div>
    );
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
                    {!!msg.message && (
                      <p className="text-sm leading-5">{msg.message}</p>
                    )}
                    {renderAttachments(msg)}
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
          <div className="space-y-2">
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileSelected}
            />

            {pendingAttachments.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {pendingAttachments.map((att, idx) => (
                  <div
                    key={att.id}
                    className="flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100 border border-gray-200 text-xs"
                  >
                    {att.fileType === "image" && (att.localUrl || att.attachment?.url) && (
                      <img
                        src={att.localUrl || getAbsoluteUrl(att.attachment!.url)}
                        alt={att.originalName || "Attachment"}
                        className="w-7 h-7 rounded-md object-cover border border-black/10"
                      />
                    )}
                    <span className="max-w-[260px] truncate">
                      {att.originalName || "Attachment"}
                    </span>
                    {att.uploading && (
                      <FaSpinner className="animate-spin text-gray-500" />
                    )}
                    {!!att.error && !att.uploading && (
                      <span className="text-red-600">{att.error}</span>
                    )}
                    <button
                      type="button"
                      onClick={() => removePendingAttachment(idx)}
                      className="text-gray-500 hover:text-gray-700"
                      aria-label="Remove attachment"
                    >
                      <FaTimes />
                    </button>
                  </div>
                ))}
              </div>
            )}

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

            {/* Attach */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              onClick={handlePickFile}
              disabled={pendingAttachments.some((p) => p.uploading)}
              className={`p-3 rounded-full hover:bg-blue-50 ${
                pendingAttachments.some((p) => p.uploading)
                  ? "opacity-60 cursor-not-allowed"
                  : ""
              }`}
              title="Attach file"
            >
              {pendingAttachments.some((p) => p.uploading) ? (
                <FaSpinner className="animate-spin" />
              ) : (
                <FaPaperclip />
              )}
            </motion.button>

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
              disabled={
                pendingAttachments.some((p) => p.uploading) ||
                (!message.trim() && pendingAttachments.every((p) => !p.attachment))
              }
              onClick={handleSend}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${
                message.trim() || pendingAttachments.some((p) => !!p.attachment)
                  ? "bg-[#053A4E] text-white"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            >
              <FaPaperPlane />
              <span>Send</span>
            </motion.button>
            </div>
          </div>
        ) : (
          <div className="text-sm text-gray-500">This conversation is read-only.</div>
        )}
      </div>
    </div>
  );
}
