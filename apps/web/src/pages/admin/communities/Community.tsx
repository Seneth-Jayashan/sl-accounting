import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Search,
    MessageSquare,
    Hash,
    Send,
    Paperclip,
    ShieldCheck,
    X,
    FileText,
    Loader2,
    Trash2,
    ArrowLeft,
    Image as ImageIcon,
    AlertTriangle,
    ExternalLink,
} from "lucide-react";

// Services & Contexts
import ClassService, { type ClassData } from "../../../services/ClassService";
import ClassChatService, {
    type ClassChatMessage,
    type Attachment,
} from "../../../services/ClassChatService";
import { useAuth } from "../../../contexts/AuthContext";

const BASE_API_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:3000";

// --- Helpers ---

const formatDateDivider = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return "Today";
    if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
    return date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
};

const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// --- Skeletons ---

function ClassListSkeleton() {
    return (
        <div className="space-y-2 p-3 animate-pulse">
            {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50">
                    <div className="w-10 h-10 rounded-xl bg-slate-200 shrink-0" />
                    <div className="flex-1 space-y-2">
                        <div className="h-3.5 w-3/4 bg-slate-200 rounded" />
                        <div className="h-2.5 w-1/3 bg-slate-100 rounded" />
                    </div>
                </div>
            ))}
        </div>
    );
}

function ChatSkeleton() {
    return (
        <div className="space-y-5 p-6 animate-pulse">
            {[false, true, false, true].map((isMe, i) => (
                <div key={i} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                    <div className={`flex items-end gap-2.5 max-w-[65%] ${isMe ? "flex-row-reverse" : ""}`}>
                        <div className="w-8 h-8 rounded-full bg-slate-200 shrink-0" />
                        <div
                            className={`h-14 w-56 rounded-2xl ${isMe ? "bg-brand-cerulean/20 rounded-br-sm" : "bg-slate-200/70 rounded-bl-sm"
                                }`}
                        />
                    </div>
                </div>
            ))}
        </div>
    );
}

// --- Main Component ---

export default function AdminCommunity() {
    const { user } = useAuth();

    // Data State
    const [classes, setClasses] = useState<ClassData[]>([]);
    const [selectedClass, setSelectedClass] = useState<ClassData | null>(null);
    const [messages, setMessages] = useState<ClassChatMessage[]>([]);

    // UI State
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
    const [loadingList, setLoadingList] = useState(true);
    const [loadingChat, setLoadingChat] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [newMessage, setNewMessage] = useState("");
    const [isTyping, setIsTyping] = useState(false);

    // Attachment & Moderation State
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [filePreview, setFilePreview] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

    // Refs
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // --- Responsive Handler ---
    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth < 1024;
            setIsMobile(mobile);
            if (!mobile) setIsSidebarOpen(true);
            else setIsSidebarOpen(!selectedClass);
        };
        window.addEventListener("resize", handleResize);
        handleResize();
        return () => window.removeEventListener("resize", handleResize);
    }, [selectedClass]);

    // --- 1. Load Classes ---
    useEffect(() => {
        const loadClasses = async () => {
            setLoadingList(true);
            try {
                const res = await ClassService.getAllClasses();
                let classList: ClassData[] = [];
                if (res.classes && Array.isArray(res.classes)) classList = res.classes;
                else if (Array.isArray(res)) classList = res;
                else if ((res as any).data && Array.isArray((res as any).data))
                    classList = (res as any).data;

                setClasses(classList);
            } catch (error) {
                console.error("Failed to load classes", error);
            } finally {
                setLoadingList(false);
            }
        };
        loadClasses();
    }, []);

    const filteredClasses = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        if (!q) return classes;
        return classes.filter((c) => {
            const batchName =
                typeof c.batch === "object" && c.batch !== null ? c.batch.name || "" : "";
            return (
                c.name.toLowerCase().includes(q) || batchName.toLowerCase().includes(q)
            );
        });
    }, [searchQuery, classes]);

    // --- File Preview Cleanup ---
    useEffect(() => {
        if (!selectedFile || !selectedFile.type.startsWith("image/")) {
            setFilePreview(null);
            return;
        }
        const url = URL.createObjectURL(selectedFile);
        setFilePreview(url);
        return () => URL.revokeObjectURL(url);
    }, [selectedFile]);

    // --- 2. Chat Logic ---
    useEffect(() => {
        if (!selectedClass) return;

        if (isMobile) setIsSidebarOpen(false);

        const initChat = async () => {
            setLoadingChat(true);
            setMessages([]);
            setIsTyping(false);
            try {
                ClassChatService.joinClassRoom(selectedClass._id);
                const history = await ClassChatService.fetchHistory(selectedClass._id);
                setMessages(history);
            } catch (error) {
                console.error("Chat Init Error:", error);
            } finally {
                setLoadingChat(false);
            }
        };

        initChat();

        const handleReceive = (msg: ClassChatMessage) => {
            setMessages((prev) => {
                if (msg._id && prev.some((m) => m._id === msg._id)) return prev;
                return [...prev, msg];
            });
        };

        const handleDeleteEvent = (data: { messageId: string }) => {
            setMessages((prev) => prev.filter((msg) => msg._id !== data.messageId));
        };

        const handleTypingEvent = (data: { isTyping: boolean; senderId: string }) => {
            if (data.senderId !== user?._id) setIsTyping(data.isTyping);
        };

        ClassChatService.onMessage(handleReceive);
        ClassChatService.onMessageDeleted(handleDeleteEvent);
        ClassChatService.onTyping(handleTypingEvent);

        return () => {
            ClassChatService.offMessage(handleReceive);
            ClassChatService.offMessageDeleted(handleDeleteEvent);
            ClassChatService.offTyping();
        };
    }, [selectedClass?._id, user?._id]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isTyping, selectedFile]);

    // --- Handlers ---

    const handleSendMessage = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if ((!newMessage.trim() && !selectedFile) || !selectedClass || isUploading) return;

        const msgContent = newMessage.trim();
        const fileToSend = selectedFile;

        setNewMessage("");
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";

        let attachments: Attachment[] = [];

        if (fileToSend) {
            setIsUploading(true);
            const uploaded = await ClassChatService.uploadFile(fileToSend);
            setIsUploading(false);
            if (uploaded) attachments.push(uploaded);
            else {
                alert("File upload failed. Please try again.");
                return;
            }
        }

        await ClassChatService.sendMessage({
            classId: selectedClass._id,
            message: msgContent,
            sender: user?._id || "",
            senderRole: "admin",
            attachments,
        });
    };

    const confirmDeleteMessage = async () => {
        if (!deleteTargetId) return;
        await ClassChatService.deleteMessage(deleteTargetId);
        setMessages((prev) => prev.filter((m) => m._id !== deleteTargetId));
        setDeleteTargetId(null);
    };

    const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
        setNewMessage(e.target.value);
        if (!selectedClass) return;
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        ClassChatService.emitTyping(selectedClass._id, true);
        typingTimeoutRef.current = setTimeout(() => {
            ClassChatService.emitTyping(selectedClass._id, false);
        }, 1000);
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) setSelectedFile(e.target.files[0]);
    };

    const clearSelectedFile = () => {
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    // --- Render ---

    return (
        <div className="flex h-[calc(100vh-6rem)] lg:h-[calc(100vh-3rem)] bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden relative">
            {/* --- CLASS CHANNELS SIDEBAR --- */}
            <AnimatePresence initial={false}>
                {isSidebarOpen && (
                    <motion.aside
                        initial={isMobile ? { x: "-100%" } : { x: 0 }}
                        animate={{ x: 0 }}
                        exit={isMobile ? { x: "-100%" } : { x: 0 }}
                        transition={{ type: "spring", stiffness: 320, damping: 32 }}
                        className="absolute inset-0 z-20 bg-white lg:relative lg:inset-auto lg:w-80 xl:w-96 flex flex-col border-r border-slate-200/80 shrink-0"
                    >
                        {/* Sidebar Header */}
                        <div className="p-4 border-b border-slate-100 space-y-3.5 shrink-0">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-9 h-9 rounded-xl bg-brand-aliceBlue text-brand-cerulean flex items-center justify-center">
                                        <MessageSquare className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h2 className="text-base font-bold text-brand-prussian leading-tight">
                                            Community
                                        </h2>
                                        <p className="text-[11px] text-slate-400 font-medium">
                                            {classes.length} class channels
                                        </p>
                                    </div>
                                </div>

                                {isMobile && selectedClass && (
                                    <button
                                        onClick={() => setIsSidebarOpen(false)}
                                        className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                )}
                            </div>

                            {/* Search Input */}
                            <div className="relative">
                                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                <input
                                    type="text"
                                    placeholder="Search class or batch..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-8 py-2 bg-slate-50 border border-slate-200/70 rounded-xl text-sm text-slate-700 placeholder:text-slate-400 focus:bg-white focus:border-brand-cerulean focus:ring-2 focus:ring-brand-cerulean/15 outline-none transition-all"
                                />
                                {searchQuery && (
                                    <button
                                        onClick={() => setSearchQuery("")}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Class List */}
                        <div className="flex-1 overflow-y-auto p-2.5 space-y-1">
                            {loadingList ? (
                                <ClassListSkeleton />
                            ) : filteredClasses.length === 0 ? (
                                <div className="text-center py-12 px-4">
                                    <p className="text-sm font-medium text-slate-500">No classes found</p>
                                    <p className="text-xs text-slate-400 mt-1">
                                        Try a different search term.
                                    </p>
                                </div>
                            ) : (
                                filteredClasses.map((cls) => {
                                    const isSelected = selectedClass?._id === cls._id;
                                    const batchLabel =
                                        typeof cls.batch === "string"
                                            ? "Batch"
                                            : cls.batch?.name || "Batch";

                                    return (
                                        <button
                                            key={cls._id}
                                            onClick={() => setSelectedClass(cls)}
                                            className={`group relative w-full text-left p-3 rounded-xl transition-all flex items-center gap-3 ${isSelected
                                                    ? "bg-brand-aliceBlue/70 ring-1 ring-brand-cerulean/25"
                                                    : "hover:bg-slate-50"
                                                }`}
                                        >
                                            {isSelected && (
                                                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-brand-cerulean" />
                                            )}

                                            <div
                                                className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 transition-colors ${isSelected
                                                        ? "bg-brand-prussian text-white shadow-sm"
                                                        : "bg-slate-100 text-slate-600 group-hover:bg-brand-aliceBlue group-hover:text-brand-cerulean"
                                                    }`}
                                            >
                                                {cls.name.charAt(0).toUpperCase()}
                                            </div>

                                            <div className="min-w-0 flex-1">
                                                <h3
                                                    className={`font-semibold text-sm truncate ${isSelected ? "text-brand-prussian" : "text-slate-700"
                                                        }`}
                                                >
                                                    {cls.name}
                                                </h3>
                                                <div className="flex items-center gap-1.5 mt-1">
                                                    <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold bg-white text-brand-cerulean px-2 py-0.5 rounded-md border border-slate-200/70">
                                                        <Hash className="w-2.5 h-2.5" />
                                                        {batchLabel}
                                                    </span>
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    </motion.aside>
                )}
            </AnimatePresence>

            {/* --- CHAT WORKSPACE --- */}
            <div className="flex-1 flex flex-col bg-slate-50/40 relative min-w-0">
                {selectedClass ? (
                    <>
                        {/* Chat Header */}
                        <header className="h-16 border-b border-slate-200/80 flex items-center justify-between px-4 sm:px-6 bg-white shrink-0 z-10">
                            <div className="flex items-center gap-3 min-w-0">
                                {isMobile && (
                                    <button
                                        onClick={() => setIsSidebarOpen(true)}
                                        className="p-2 -ml-2 hover:bg-slate-100 rounded-xl text-slate-500 transition-colors"
                                    >
                                        <ArrowLeft className="w-5 h-5" />
                                    </button>
                                )}

                                <div className="w-9 h-9 rounded-xl bg-brand-prussian text-white flex items-center justify-center font-bold text-sm shrink-0">
                                    {selectedClass.name.charAt(0).toUpperCase()}
                                </div>

                                <div className="min-w-0">
                                    <h2 className="font-bold text-brand-prussian text-sm sm:text-base truncate">
                                        {selectedClass.name}
                                    </h2>
                                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                        <span className="font-medium text-emerald-600">Live Channel</span>
                                    </div>
                                </div>
                            </div>

                            <div className="hidden sm:flex items-center gap-2">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-brand-aliceBlue text-brand-prussian text-xs rounded-full font-semibold ring-1 ring-brand-cerulean/20">
                                    <ShieldCheck className="w-3.5 h-3.5 text-brand-cerulean" />
                                    Admin Mode
                                </span>
                            </div>
                        </header>

                        {/* Messages Feed */}
                        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                            {loadingChat ? (
                                <ChatSkeleton />
                            ) : messages.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-center py-12">
                                    <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200/70 flex items-center justify-center text-slate-300 mb-3 shadow-sm">
                                        <MessageSquare className="w-7 h-7" />
                                    </div>
                                    <p className="text-sm font-semibold text-brand-prussian">
                                        No messages yet
                                    </p>
                                    <p className="text-xs text-slate-400 mt-1">
                                        Start the conversation with your students in {selectedClass.name}.
                                    </p>
                                </div>
                            ) : (
                                messages.map((msg, idx) => {
                                    const isMe = msg.sender === user?._id;
                                    const isAdmin = msg.senderRole === "admin";
                                    const currentDate = formatDateDivider(msg.createdAt);
                                    const prevDate =
                                        idx > 0 ? formatDateDivider(messages[idx - 1].createdAt) : null;
                                    const showDateDivider = currentDate !== prevDate;

                                    return (
                                        <React.Fragment key={msg._id || idx}>
                                            {showDateDivider && (
                                                <div className="flex items-center justify-center my-4">
                                                    <span className="px-3 py-1 rounded-full bg-white border border-slate-200/70 text-[11px] font-semibold text-slate-400 shadow-sm">
                                                        {currentDate}
                                                    </span>
                                                </div>
                                            )}

                                            <motion.div
                                                initial={{ opacity: 0, y: 6 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.15 }}
                                                className={`flex w-full group ${isMe ? "justify-end" : "justify-start"
                                                    }`}
                                            >
                                                <div
                                                    className={`flex max-w-[85%] sm:max-w-[70%] gap-2.5 ${isMe ? "flex-row-reverse" : "flex-row"
                                                        }`}
                                                >
                                                    {/* Avatar */}
                                                    <div className="shrink-0 mt-auto hidden sm:block">
                                                        {msg.senderAvatar ? (
                                                            <img
                                                                src={`${BASE_API_URL}${msg.senderAvatar}`}
                                                                className="w-8 h-8 rounded-full object-cover ring-2 ring-white shadow-sm"
                                                                alt={msg.senderName}
                                                            />
                                                        ) : (
                                                            <div
                                                                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ring-2 ring-white shadow-sm ${isAdmin
                                                                        ? "bg-brand-prussian text-white"
                                                                        : "bg-brand-aliceBlue text-brand-cerulean"
                                                                    }`}
                                                            >
                                                                {msg.senderName?.charAt(0).toUpperCase() || "U"}
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div
                                                        className={`flex flex-col ${isMe ? "items-end" : "items-start"
                                                            }`}
                                                    >
                                                        {/* Sender Name & Delete Action */}
                                                        <div className="flex items-center gap-2 mb-1 px-1">
                                                            <span
                                                                className={`text-[11px] font-semibold ${isAdmin ? "text-brand-cerulean" : "text-slate-500"
                                                                    }`}
                                                            >
                                                                {isMe ? "You" : msg.senderName}
                                                                {isAdmin && !isMe && (
                                                                    <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded bg-brand-aliceBlue text-brand-prussian">
                                                                        Admin
                                                                    </span>
                                                                )}
                                                            </span>

                                                            {msg._id && (
                                                                <button
                                                                    onClick={() => setDeleteTargetId(msg._id!)}
                                                                    title="Delete message"
                                                                    className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-md"
                                                                >
                                                                    <Trash2 className="w-3 h-3" />
                                                                </button>
                                                            )}
                                                        </div>

                                                        {/* Message Bubble */}
                                                        <div
                                                            className={`p-1.5 shadow-sm rounded-2xl ${isMe
                                                                    ? "bg-brand-cerulean text-white rounded-br-sm"
                                                                    : "bg-white border border-slate-200/80 text-slate-700 rounded-bl-sm"
                                                                }`}
                                                        >
                                                            {msg.attachments?.map((att, i) => (
                                                                <div key={i} className="mb-1 last:mb-0">
                                                                    {att.fileType === "image" ? (
                                                                        <a
                                                                            href={BASE_API_URL + att.url}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            className="block overflow-hidden rounded-xl"
                                                                        >
                                                                            <img
                                                                                src={BASE_API_URL + att.url}
                                                                                alt={att.originalName || "Attachment"}
                                                                                loading="lazy"
                                                                                className="max-w-[220px] sm:max-w-[260px] max-h-[220px] object-cover hover:opacity-95 transition-opacity bg-black/5"
                                                                            />
                                                                        </a>
                                                                    ) : (
                                                                        <a
                                                                            href={att.url}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            className={`flex items-center gap-2.5 p-2.5 rounded-xl transition-colors ${isMe
                                                                                    ? "bg-white/15 hover:bg-white/20 text-white"
                                                                                    : "bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/60"
                                                                                }`}
                                                                        >
                                                                            <FileText className="w-4 h-4 shrink-0" />
                                                                            <span className="text-xs font-medium truncate max-w-[160px]">
                                                                                {att.originalName}
                                                                            </span>
                                                                            <ExternalLink className="w-3.5 h-3.5 opacity-70 shrink-0" />
                                                                        </a>
                                                                    )}
                                                                </div>
                                                            ))}

                                                            {msg.message && (
                                                                <div className="px-3 py-1.5 text-sm leading-relaxed whitespace-pre-wrap break-words">
                                                                    {msg.message}
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Timestamp */}
                                                        <span className="text-[10px] text-slate-400 mt-1 px-1 tabular-nums">
                                                            {new Date(msg.createdAt).toLocaleTimeString([], {
                                                                hour: "2-digit",
                                                                minute: "2-digit",
                                                            })}
                                                        </span>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        </React.Fragment>
                                    );
                                })
                            )}

                            {/* Live Typing Indicator */}
                            <AnimatePresence>
                                {isTyping && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 6 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 6 }}
                                        className="flex items-center gap-2 text-xs text-slate-400 pl-2"
                                    >
                                        <span className="inline-flex gap-1 bg-white border border-slate-200/80 px-3 py-2 rounded-2xl shadow-sm">
                                            <span className="w-1.5 h-1.5 rounded-full bg-brand-cerulean animate-bounce [animation-delay:-0.3s]" />
                                            <span className="w-1.5 h-1.5 rounded-full bg-brand-cerulean animate-bounce [animation-delay:-0.15s]" />
                                            <span className="w-1.5 h-1.5 rounded-full bg-brand-cerulean animate-bounce" />
                                        </span>
                                        <span>Someone is typing...</span>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div ref={messagesEndRef} />
                        </div>

                        {/* Composer Area */}
                        <div className="p-3 sm:p-4 bg-white border-t border-slate-200/80 relative shrink-0">
                            <AnimatePresence>
                                {selectedFile && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 8 }}
                                        className="mb-3 flex items-center justify-between gap-3 p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl"
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            {filePreview ? (
                                                <img
                                                    src={filePreview}
                                                    alt="Preview"
                                                    className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0"
                                                />
                                            ) : (
                                                <div className="w-10 h-10 rounded-lg bg-brand-aliceBlue text-brand-cerulean flex items-center justify-center shrink-0">
                                                    {selectedFile.type.startsWith("image/") ? (
                                                        <ImageIcon className="w-5 h-5" />
                                                    ) : (
                                                        <FileText className="w-5 h-5" />
                                                    )}
                                                </div>
                                            )}
                                            <div className="min-w-0">
                                                <p className="text-xs font-semibold text-brand-prussian truncate">
                                                    {selectedFile.name}
                                                </p>
                                                <p className="text-[11px] text-slate-400">
                                                    {formatFileSize(selectedFile.size)}
                                                </p>
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={clearSelectedFile}
                                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors shrink-0"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <form onSubmit={handleSendMessage} className="flex items-center gap-2 sm:gap-2.5">
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileSelect}
                                    className="hidden"
                                    id="admin-chat-upload"
                                />
                                <label
                                    htmlFor="admin-chat-upload"
                                    title="Attach file"
                                    className="cursor-pointer p-2.5 bg-slate-50 border border-slate-200/70 rounded-xl text-slate-500 hover:text-brand-cerulean hover:border-brand-cerulean/40 transition-colors shrink-0"
                                >
                                    <Paperclip className="w-5 h-5" />
                                </label>

                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={handleTyping}
                                    placeholder={`Message ${selectedClass.name}...`}
                                    className="flex-1 bg-slate-50 border border-slate-200/70 rounded-xl px-4 py-2.5 outline-none text-sm text-slate-700 placeholder:text-slate-400 focus:bg-white focus:border-brand-cerulean focus:ring-2 focus:ring-brand-cerulean/15 transition-all"
                                />

                                <button
                                    type="submit"
                                    disabled={(!newMessage.trim() && !selectedFile) || isUploading}
                                    className="p-2.5 bg-brand-prussian text-white rounded-xl hover:bg-brand-cerulean transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                                >
                                    {isUploading ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <Send className="w-5 h-5" />
                                    )}
                                </button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                        <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200/70 shadow-sm flex items-center justify-center text-brand-cerulean mb-4">
                            <MessageSquare className="w-8 h-8" />
                        </div>
                        <h3 className="text-lg font-bold text-brand-prussian">
                            Select a Class Channel
                        </h3>
                        <p className="text-sm text-slate-400 mt-1 max-w-xs">
                            Choose a class from the sidebar to view discussions, share materials, and moderate chat.
                        </p>
                        {isMobile && (
                            <button
                                onClick={() => setIsSidebarOpen(true)}
                                className="mt-6 px-5 py-2.5 bg-brand-prussian text-white rounded-xl text-sm font-semibold shadow-sm hover:bg-brand-cerulean transition-colors"
                            >
                                Browse Classes
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* --- DELETE CONFIRMATION MODAL --- */}
            {deleteTargetId && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl border border-slate-200/70">
                        <div className="flex items-start gap-3.5">
                            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                                <AlertTriangle className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-brand-prussian">
                                    Delete message?
                                </h3>
                                <p className="text-xs text-slate-500 mt-1">
                                    This message will be permanently removed for everyone in this class channel.
                                </p>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 mt-6">
                            <button
                                onClick={() => setDeleteTargetId(null)}
                                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDeleteMessage}
                                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}