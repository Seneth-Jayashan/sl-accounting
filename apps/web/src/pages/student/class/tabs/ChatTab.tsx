import React, { useState, useEffect, useRef, useMemo } from "react";
import { useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  MessageSquare,
  ShieldCheck,
  Paperclip,
  Mic,
  Square,
  Trash2,
  X,
  FileText,
  Image as ImageIcon,
  Download,
  Volume2,
  Loader2,
  Sparkles,
} from "lucide-react";

import { useAuth } from "../../../../contexts/AuthContext";
import ClassChatService, {
  type ClassChatMessage,
  type Attachment,
} from "../../../../services/ClassChatService";

const BASE_API_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

// --- HELPERS ---
const formatTime = (dateStr: string) =>
  new Date(dateStr).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

const getDateLabel = (dateStr: string) => {
  const date = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round(
    (today.getTime() - target.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const formatDuration = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
};

export default function ChatTab() {
  const { id: classId } = useParams<{ id: string }>();
  const { user } = useAuth();

  // Chat State
  const [messages, setMessages] = useState<ClassChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);

  // File & Voice State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Manage object URL for selected file preview safely
  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [selectedFile]);

  // Recording timer
  useEffect(() => {
    if (!isRecording) {
      setRecordingSeconds(0);
      return;
    }
    const interval = setInterval(() => {
      setRecordingSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isRecording]);

  const toggleRecording = async () => {
    if (isRecording && mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const voiceFile = new File([blob], `voice-${Date.now()}.webm`, {
          type: "audio/webm",
        });
        setSelectedFile(voiceFile);
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
    } catch {
      alert("Microphone access denied or unavailable.");
    }
  };

  // --- 1. CONNECTION & LISTENERS ---
  useEffect(() => {
    if (!classId) return;

    let isMounted = true;

    const initChat = async () => {
      setLoading(true);
      try {
        ClassChatService.joinClassRoom(classId);
        const history = await ClassChatService.fetchHistory(classId);
        if (isMounted) setMessages(history || []);
      } catch (error) {
        console.error("Failed to join chat:", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    initChat();

    const handleReceive = (msg: ClassChatMessage) => {
      if (!isMounted) return;
      setMessages((prev) => {
        if (msg._id && prev.some((m) => m._id === msg._id)) return prev;
        return [...prev, msg];
      });
    };

    const handleTypingEvent = (data: {
      isTyping: boolean;
      senderId: string;
    }) => {
      if (!isMounted) return;
      if (data.senderId !== user?._id) setIsTyping(data.isTyping);
    };

    const handleDeleteEvent = (data: { messageId: string }) => {
      if (!isMounted) return;
      setMessages((prev) => prev.filter((msg) => msg._id !== data.messageId));
    };

    ClassChatService.onMessage(handleReceive);
    ClassChatService.onTyping(handleTypingEvent);
    ClassChatService.onMessageDeleted(handleDeleteEvent);

    return () => {
      isMounted = false;
      ClassChatService.offMessage(handleReceive);
      ClassChatService.offTyping();
      ClassChatService.offMessageDeleted(handleDeleteEvent);
    };
  }, [classId, user?._id]);

  // Auto-scroll on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping, selectedFile]);

  // --- ACTIONS ---
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const clearSelectedFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((!newMessage.trim() && !selectedFile) || !classId || isUploading) return;

    const msgContent = newMessage.trim();
    const fileToSend = selectedFile;

    setNewMessage("");
    clearSelectedFile();

    const attachments: Attachment[] = [];

    try {
      if (fileToSend) {
        setIsUploading(true);
        const uploaded = await ClassChatService.uploadFile(fileToSend);
        setIsUploading(false);

        if (uploaded) {
          attachments.push(uploaded);
        } else {
          console.error("Upload failed");
          return;
        }
      }

      await ClassChatService.sendMessage({
        classId,
        message: msgContent,
        sender: user?._id || "",
        senderRole: (user?.role === "admin" ? "admin" : "student") as
          | "student"
          | "admin",
        attachments,
      });
    } catch (error) {
      console.error("Failed to send:", error);
      setIsUploading(false);
    }
  };

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    if (!classId) return;

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    ClassChatService.emitTyping(classId, true);

    typingTimeoutRef.current = setTimeout(() => {
      ClassChatService.emitTyping(classId, false);
    }, 1000);
  };

  // Precompute date dividers
  const messagesWithDividers = useMemo(() => {
    let lastDateLabel = "";
    return messages.map((msg) => {
      const label = msg.createdAt ? getDateLabel(msg.createdAt) : "";
      const showDivider = Boolean(label) && label !== lastDateLabel;
      if (label) lastDateLabel = label;
      return { msg, dateLabel: label, showDivider };
    });
  }, [messages]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col h-[calc(100vh-13rem)] min-h-[520px] max-h-[740px] bg-white rounded-3xl border border-gray-100 shadow-lg shadow-brand-prussian/5 overflow-hidden"
    >
      {/* --- 1. HEADER --- */}
      <div className="relative bg-gradient-to-r from-brand-prussian via-[#0d3a4b] to-brand-cerulean px-5 py-4 text-white flex items-center justify-between shrink-0 z-10 overflow-hidden">
        <div className="pointer-events-none absolute -top-10 -right-10 w-36 h-36 bg-brand-jasmine/15 rounded-full blur-2xl" />

        <div className="relative z-10 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md border border-white/15 flex items-center justify-center shrink-0">
            <MessageSquare className="text-brand-jasmine w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-extrabold text-sm sm:text-base tracking-tight">
                Classroom Discussion
              </h2>
              {messages.length > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-white/15 text-[10px] font-bold text-white/90">
                  {messages.length}
                </span>
              )}
            </div>
            <div className="text-[11px] text-white/75 flex items-center gap-1.5 mt-0.5 font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
              </span>
              <span>Live Classroom Chat</span>
            </div>
          </div>
        </div>

        <div className="relative z-10 hidden sm:flex text-[11px] bg-white/10 backdrop-blur-md text-white/85 px-3 py-1.5 rounded-full items-center gap-1.5 font-semibold border border-white/15">
          <ShieldCheck size={13} className="text-brand-jasmine" />
          <span>Encrypted</span>
        </div>
      </div>

      {/* --- 2. MESSAGES AREA --- */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 space-y-4 bg-[#f8fafc] scrollbar-thin">
        {loading && (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <Loader2 className="w-7 h-7 text-brand-cerulean animate-spin" />
            <p className="text-xs font-semibold text-gray-400">
              Loading classroom discussion...
            </p>
          </div>
        )}

        {!loading && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="w-16 h-16 bg-brand-aliceBlue text-brand-cerulean rounded-2xl flex items-center justify-center mb-4">
              <MessageSquare size={28} />
            </div>
            <p className="text-base font-extrabold text-brand-prussian">
              Start the Conversation
            </p>
            <p className="text-xs text-gray-400 max-w-xs mt-1 leading-relaxed">
              Ask questions, share notes, or discuss topics with your instructor
              and classmates.
            </p>
          </div>
        )}

        {messagesWithDividers.map(({ msg, dateLabel, showDivider }, idx) => {
          const isMe = msg.sender === user?._id;
          const isAdmin = msg.senderRole === "admin";

          return (
            <React.Fragment key={msg._id || idx}>
              {/* Date Divider */}
              {showDivider && (
                <div className="flex items-center justify-center my-4">
                  <span className="px-3 py-1 rounded-full bg-white border border-gray-200/80 text-[10px] font-bold uppercase tracking-wider text-gray-400 shadow-2xs">
                    {dateLabel}
                  </span>
                </div>
              )}

              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={`group flex w-full ${isMe ? "justify-end" : "justify-start"
                  }`}
              >
                <div
                  className={`flex max-w-[88%] sm:max-w-[75%] gap-2.5 ${isMe ? "flex-row-reverse" : "flex-row"
                    }`}
                >
                  {/* Avatar */}
                  <div className="shrink-0 mt-auto hidden sm:block">
                    {msg.senderAvatar ? (
                      <img
                        src={`${BASE_API_URL}${msg.senderAvatar}`}
                        className="w-8 h-8 rounded-xl object-cover border border-white shadow-sm"
                        alt={msg.senderName || "avatar"}
                      />
                    ) : (
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-extrabold border border-white shadow-sm ${isAdmin
                            ? "bg-brand-prussian text-brand-jasmine"
                            : isMe
                              ? "bg-brand-cerulean text-white"
                              : "bg-brand-aliceBlue text-brand-cerulean"
                          }`}
                      >
                        {msg.senderName?.charAt(0).toUpperCase() || "U"}
                      </div>
                    )}
                  </div>

                  {/* Bubble Column */}
                  <div
                    className={`flex flex-col ${isMe ? "items-end" : "items-start"
                      }`}
                  >
                    {/* Sender Name */}
                    {!isMe && (
                      <div className="flex items-center gap-1.5 ml-1 mb-1">
                        <span className="text-[11px] font-bold text-gray-500">
                          {msg.senderName}
                        </span>
                        {isAdmin && (
                          <span className="inline-flex items-center gap-0.5 bg-brand-prussian text-brand-jasmine px-1.5 py-0.5 rounded-md text-[9px] font-extrabold uppercase tracking-wider">
                            <Sparkles size={9} />
                            Admin
                          </span>
                        )}
                      </div>
                    )}

                    {/* Bubble + Hover Delete Row */}
                    <div
                      className={`flex items-center gap-1.5 ${isMe ? "flex-row-reverse" : "flex-row"
                        }`}
                    >
                      <div
                        className={`p-1.5 shadow-sm overflow-hidden ${isMe
                            ? "bg-gradient-to-br from-brand-cerulean to-[#0d6e96] text-white rounded-2xl rounded-br-sm"
                            : isAdmin
                              ? "bg-white text-gray-800 border border-brand-cerulean/25 rounded-2xl rounded-bl-sm"
                              : "bg-white text-gray-800 border border-gray-100 rounded-2xl rounded-bl-sm"
                          }`}
                      >
                        {/* Attachments */}
                        {msg.attachments?.map((att, i) => {
                          const fileUrl = att.url.startsWith("http")
                            ? att.url
                            : BASE_API_URL + att.url;

                          return (
                            <div key={i} className="mb-1 last:mb-0">
                              {att.fileType === "image" ? (
                                <a
                                  href={fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="block overflow-hidden rounded-xl"
                                >
                                  <img
                                    src={fileUrl}
                                    alt="attachment"
                                    className="max-w-[240px] max-h-[220px] object-cover hover:scale-105 transition-transform duration-300 rounded-xl"
                                  />
                                </a>
                              ) : (att.fileType as string) === "audio" ? (
                                <div
                                  className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl ${isMe ? "bg-white/15" : "bg-gray-50"
                                    }`}
                                >
                                  <Volume2
                                    size={16}
                                    className={
                                      isMe ? "text-white" : "text-brand-cerulean"
                                    }
                                  />
                                  <audio
                                    controls
                                    src={fileUrl}
                                    className="max-w-[200px] h-8"
                                  />
                                </div>
                              ) : (
                                <a
                                  href={fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={`flex items-center gap-3 p-2.5 rounded-xl transition-colors ${isMe
                                      ? "bg-white/15 hover:bg-white/25 text-white"
                                      : "bg-gray-50 hover:bg-brand-aliceBlue/50 text-gray-800"
                                    }`}
                                >
                                  <div className="w-9 h-9 rounded-lg bg-white text-brand-cerulean flex items-center justify-center shadow-xs shrink-0">
                                    <FileText size={17} />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="text-xs font-bold truncate max-w-[140px]">
                                      {att.originalName || "Document"}
                                    </p>
                                    <p className="text-[10px] opacity-75 flex items-center gap-1">
                                      <Download size={10} /> Download
                                    </p>
                                  </div>
                                </a>
                              )}
                            </div>
                          );
                        })}

                        {/* Text Message */}
                        {msg.message && (
                          <div
                            className={`px-3 py-1.5 text-sm leading-relaxed whitespace-pre-wrap break-words ${isMe ? "text-white" : "text-gray-700"
                              }`}
                          >
                            {msg.message}
                          </div>
                        )}
                      </div>

                      {/* Subtle Hover Delete Button (Own Messages) */}
                      {isMe && msg._id && (
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmId(msg._id || null)}
                          className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all shrink-0"
                          title="Delete message"
                          aria-label="Delete message"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>

                    {/* Timestamp */}
                    <span className="text-[10px] text-gray-400 mt-1 mx-1 font-medium">
                      {formatTime(msg.createdAt)}
                    </span>
                  </div>
                </div>
              </motion.div>
            </React.Fragment>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* --- 3. INPUT COMPOSER --- */}
      <div className="bg-white p-3 sm:p-4 border-t border-gray-100 relative z-20">
        {/* Typing Indicator */}
        <AnimatePresence>
          {isTyping && !selectedFile && !isRecording && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              className="absolute -top-9 left-5 text-[11px] font-medium text-gray-500 bg-white/95 backdrop-blur-sm px-3 py-1 rounded-full shadow-sm border border-gray-100 flex items-center gap-2"
            >
              <span className="flex gap-0.5">
                <span className="w-1.5 h-1.5 bg-brand-cerulean rounded-full animate-bounce" />
                <span className="w-1.5 h-1.5 bg-brand-cerulean rounded-full animate-bounce [animation-delay:120ms]" />
                <span className="w-1.5 h-1.5 bg-brand-cerulean rounded-full animate-bounce [animation-delay:240ms]" />
              </span>
              Someone is typing...
            </motion.div>
          )}
        </AnimatePresence>

        {/* Active Recording Banner */}
        <AnimatePresence>
          {isRecording && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="mb-2.5 px-4 py-2.5 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-between"
            >
              <div className="flex items-center gap-2.5 text-red-600 text-xs font-bold">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                <span>Recording voice message...</span>
                <span className="font-mono bg-white px-2 py-0.5 rounded-md border border-red-100">
                  {formatDuration(recordingSeconds)}
                </span>
              </div>
              <button
                type="button"
                onClick={toggleRecording}
                className="px-3 py-1 rounded-lg bg-red-500 text-white text-xs font-bold hover:bg-red-600 transition-colors"
              >
                Stop
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Selected File Preview */}
        <AnimatePresence>
          {selectedFile && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="mb-2.5 bg-gray-50 rounded-2xl border border-gray-200/80 p-2.5 flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                {selectedFile.type.startsWith("image/") && previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="preview"
                    className="w-11 h-11 rounded-xl object-cover border border-gray-200 shrink-0"
                  />
                ) : (
                  <div className="w-11 h-11 bg-brand-aliceBlue rounded-xl flex items-center justify-center text-brand-cerulean shrink-0">
                    {selectedFile.type.startsWith("audio/") ? (
                      <Volume2 size={20} />
                    ) : selectedFile.type.startsWith("image/") ? (
                      <ImageIcon size={20} />
                    ) : (
                      <FileText size={20} />
                    )}
                  </div>
                )}

                <div className="min-w-0">
                  <p className="text-xs font-bold text-gray-800 truncate">
                    {selectedFile.name}
                  </p>
                  <p className="text-[10px] text-gray-400 font-medium">
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>

              {selectedFile.type.startsWith("audio/") && previewUrl && (
                <audio
                  controls
                  src={previewUrl}
                  className="h-8 max-w-[180px] hidden sm:block"
                />
              )}

              <button
                type="button"
                onClick={clearSelectedFile}
                aria-label="Remove attachment"
                className="p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-xl transition-colors shrink-0"
              >
                <X size={16} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input Form */}
        <form
          onSubmit={handleSendMessage}
          className="flex items-center gap-1.5 bg-gray-50 p-1.5 rounded-2xl border border-gray-200/90 focus-within:border-brand-cerulean focus-within:bg-white focus-within:ring-2 focus-within:ring-brand-cerulean/15 transition-all"
        >
          {/* Attach File */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            className="hidden"
            id="chat-file-upload"
          />
          <label
            htmlFor="chat-file-upload"
            className="p-2.5 text-gray-400 hover:text-brand-cerulean hover:bg-brand-aliceBlue rounded-xl cursor-pointer transition-colors shrink-0"
            title="Attach file"
          >
            <Paperclip size={19} />
          </label>

          {/* Voice Message */}
          <button
            type="button"
            onClick={toggleRecording}
            className={`p-2.5 rounded-xl transition-colors shrink-0 ${isRecording
                ? "bg-red-500 text-white animate-pulse"
                : "text-gray-400 hover:text-brand-cerulean hover:bg-brand-aliceBlue"
              }`}
            title={isRecording ? "Stop recording" : "Record voice message"}
          >
            {isRecording ? <Square size={17} /> : <Mic size={19} />}
          </button>

          {/* Text Input */}
          <input
            type="text"
            value={newMessage}
            onChange={handleTyping}
            placeholder={
              isUploading ? "Uploading attachment..." : "Type a message..."
            }
            disabled={isUploading}
            className="flex-1 bg-transparent border-none outline-none text-sm px-2 py-2.5 text-gray-800 placeholder:text-gray-400 min-w-0"
          />

          {/* Send Button */}
          <button
            type="submit"
            disabled={(!newMessage.trim() && !selectedFile) || isUploading}
            className={`p-2.5 rounded-xl flex items-center justify-center transition-all shrink-0 ${(!newMessage.trim() && !selectedFile) || isUploading
                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                : "bg-brand-prussian text-white hover:bg-brand-cerulean shadow-md active:scale-95"
              }`}
            aria-label="Send message"
          >
            {isUploading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Send
                size={17}
                className={newMessage.trim() ? "translate-x-0.5" : ""}
              />
            )}
          </button>
        </form>
      </div>

      {/* --- DELETE CONFIRMATION MODAL --- */}
      <AnimatePresence>
        {deleteConfirmId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
            onClick={() => setDeleteConfirmId(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl max-w-xs w-full p-6 text-center shadow-2xl border border-gray-100 space-y-4"
            >
              <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center mx-auto">
                <Trash2 size={22} />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-brand-prussian">
                  Delete Message?
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  This message will be permanently removed for everyone.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmId(null)}
                  className="py-2.5 text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const id = deleteConfirmId;
                    setDeleteConfirmId(null);
                    try {
                      await ClassChatService.deleteMessage(id);
                      setMessages((prev) => prev.filter((m) => m._id !== id));
                    } catch {
                      alert("Failed to delete message");
                    }
                  }}
                  className="py-2.5 text-xs font-bold text-white bg-red-500 hover:bg-red-600 rounded-xl transition-colors shadow-sm"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}