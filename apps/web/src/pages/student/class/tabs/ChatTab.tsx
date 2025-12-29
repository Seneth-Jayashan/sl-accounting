import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Send, 
  MessageSquare, 
  ShieldCheck, 
  Paperclip, 
  X, 
  FileText, 
  Image as ImageIcon,
} from "lucide-react";

import { useAuth } from "../../../../contexts/AuthContext";
import ClassChatService, { type ClassChatMessage, type Attachment } from "../../../../services/ClassChatService";

const BASE_API_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000"; 

export default function ChatTab() {
  const { id: classId } = useParams<{ id: string }>(); 
  const { user } = useAuth();
  
  // Chat State
  const [messages, setMessages] = useState<ClassChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  
  // File Upload State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- 1. CONNECTION & LISTENERS ---
  useEffect(() => {
    if (!classId) return;

    let isMounted = true;

    const initChat = async () => {
      setLoading(true);
      try {
        ClassChatService.joinClassRoom(classId);
        const history = await ClassChatService.fetchHistory(classId);
        if (isMounted) setMessages(history);
      } catch (error) {
        console.error("Failed to join chat:", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    initChat();

    // Listeners
    const handleReceive = (msg: ClassChatMessage) => {
      if (!isMounted) return;
      setMessages((prev) => {
        // Prevent duplicates
        if (msg._id && prev.some((m) => m._id === msg._id)) return prev;
        return [...prev, msg];
      });
    };

    const handleTypingEvent = (data: { isTyping: boolean; senderId: string }) => {
      if (!isMounted) return;
      if (data.senderId !== user?._id) setIsTyping(data.isTyping);
    };

    const handleDeleteEvent = (data: { messageId: string }) => {
        if (!isMounted) return;
        setMessages((prev) => prev.filter(msg => msg._id !== data.messageId));
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

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((!newMessage.trim() && !selectedFile) || !classId || isUploading) return;

    const msgContent = newMessage.trim();
    const fileToSend = selectedFile;
    
    // Optimistic Reset
    setNewMessage("");
    setSelectedFile(null); 
    if(fileInputRef.current) fileInputRef.current.value = "";

    let attachments: Attachment[] = [];

    try {
        // 1. Upload File (if any)
        if (fileToSend) {
            setIsUploading(true);
            const uploaded = await ClassChatService.uploadFile(fileToSend);
            setIsUploading(false);
            
            if (uploaded) {
                attachments.push(uploaded);
            } else {
                // Handle upload fail silently or with toast
                console.error("Upload failed");
                return; 
            }
        }

        // 2. Send Message
        await ClassChatService.sendMessage({
            classId,
            message: msgContent,
            sender: user?._id || "",
            senderRole: (user?.role === 'admin' ? 'admin' : 'student') as "student" | "admin",
            attachments 
        });
    } catch (error) {
        console.error("Failed to send:", error);
        setIsUploading(false);
    }
  };

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    if (!classId) return;
    
    // Debounce typing emission
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    ClassChatService.emitTyping(classId, true);
    
    typingTimeoutRef.current = setTimeout(() => {
      ClassChatService.emitTyping(classId, false);
    }, 1000);
  };

  // --- RENDER HELPERS ---
  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <motion.div 
        initial={{ opacity: 0, y: 10 }} 
        animate={{ opacity: 1, y: 0 }} 
        // Responsive Height: 600px on desktop, but calculates space on mobile to fit viewport
        className="flex flex-col h-[calc(100vh-12rem)] min-h-[500px] max-h-[700px] bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden"
    >
      
      {/* 1. HEADER */}
      <div className="bg-white border-b border-gray-100 p-4 flex items-center justify-between shrink-0 z-10 relative shadow-sm">
        <div className="flex items-center gap-3">
            <div className="p-2.5 bg-brand-aliceBlue rounded-xl">
                <MessageSquare className="text-brand-cerulean w-5 h-5" />
            </div>
            <div>
                <h2 className="font-bold text-gray-900 text-sm">Classroom Discussion</h2>
                <div className="text-[11px] text-gray-500 flex items-center gap-1.5 mt-0.5">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span> 
                    Live
                </div>
            </div>
        </div>
        <div className="hidden sm:flex text-[10px] bg-gray-50 text-gray-400 px-3 py-1.5 rounded-full items-center gap-1.5 font-medium border border-gray-100">
            <ShieldCheck size={12} /> End-to-End Encrypted
        </div>
      </div>

      {/* 2. MESSAGES AREA */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#f8fafc] scrollbar-thin">
        
        {loading && (
            <div className="flex flex-col items-center justify-center h-full gap-3 opacity-50">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-brand-cerulean border-b-transparent"></div>
                <p className="text-xs text-gray-400">Loading chat history...</p>
            </div>
        )}
        
        {!loading && messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-gray-300 gap-4">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center">
                    <MessageSquare size={32} strokeWidth={1.5} className="opacity-50" />
                </div>
                <div className="text-center">
                    <p className="text-sm font-semibold text-gray-400">No messages yet</p>
                    <p className="text-xs max-w-[200px] mt-1">Be the first to ask a question or say hello to the class!</p>
                </div>
            </div>
        )}

        {messages.map((msg, idx) => {
            const isMe = msg.sender === user?._id;
            const isAdmin = msg.senderRole === 'admin';
            
            return (
                <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }} 
                    animate={{ opacity: 1, y: 0, scale: 1 }} 
                    key={msg._id || idx} 
                    className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'}`}
                >
                    <div className={`flex max-w-[85%] sm:max-w-[75%] gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                        
                        {/* Avatar */}
                        <div className="shrink-0 mt-auto hidden sm:block">
                            {msg.senderAvatar ? (
                                <img src={`${BASE_API_URL}${msg.senderAvatar}`} className="w-8 h-8 rounded-full object-cover border-2 border-white shadow-sm" alt="avatar"/>
                            ) : (
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold border-2 border-white shadow-sm ${isAdmin ? 'bg-brand-prussian text-white' : 'bg-brand-aliceBlue text-brand-cerulean'}`}>
                                    {msg.senderName?.charAt(0).toUpperCase() || "U"}
                                </div>
                            )}
                        </div>

                        {/* Content Container */}
                        <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                            
                            {/* Name Label */}
                            {!isMe && (
                                <span className="text-[10px] font-bold text-gray-400 ml-2 mb-1 flex items-center gap-1">
                                    {msg.senderName} {isAdmin && <span className="bg-brand-prussian text-white px-1 py-0.5 rounded-[3px] text-[8px] uppercase tracking-wider">Admin</span>}
                                </span>
                            )}
                            
                            {/* Message Bubble */}
                            <div className={`p-1.5 shadow-sm overflow-hidden ${
                                isMe 
                                ? 'bg-brand-cerulean text-white rounded-2xl rounded-br-none' 
                                : 'bg-white text-gray-800 border border-gray-100 rounded-2xl rounded-bl-none'
                            }`}>
                                
                                {/* A. Attachments */}
                                {msg.attachments?.map((att, i) => (
                                    <div key={i} className="mb-1 last:mb-0">
                                        {att.fileType === 'image' ? (
                                            <a href={BASE_API_URL + att.url} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-xl">
                                                <img 
                                                    src={BASE_API_URL + att.url} 
                                                    alt="attachment" 
                                                    className="max-w-[200px] max-h-[200px] object-cover hover:scale-105 transition-transform duration-500" 
                                                />
                                            </a>
                                        ) : (
                                            <a 
                                                href={att.url.startsWith('http') ? att.url : BASE_API_URL + att.url} 
                                                target="_blank" 
                                                rel="noopener noreferrer" 
                                                className={`flex items-center gap-3 p-3 rounded-xl transition-all ${isMe ? 'bg-white/10 hover:bg-white/20' : 'bg-gray-50 hover:bg-gray-100'}`}
                                            >
                                                <div className="p-2 bg-white rounded-lg text-brand-cerulean shadow-sm"><FileText size={18} /></div>
                                                <div className="flex flex-col min-w-0">
                                                    <span className="text-xs font-bold truncate max-w-[120px]">{att.originalName || "Document"}</span>
                                                    <span className="text-[9px] opacity-70 uppercase tracking-wide">Download</span>
                                                </div>
                                            </a>
                                        )}
                                    </div>
                                ))}

                                {/* B. Text Content */}
                                {msg.message && (
                                    <div className={`px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap break-words ${isMe ? 'text-white' : 'text-gray-700'}`}>
                                        {msg.message}
                                    </div>
                                )}
                            </div>
                            
                            {/* Time Stamp */}
                            <span className="text-[9px] text-gray-400 mt-1 mx-1 font-medium opacity-70">
                                {formatTime(msg.createdAt)}
                            </span>
                        </div>
                    </div>
                </motion.div>
            );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* 3. INPUT AREA */}
      <div className="bg-white p-3 sm:p-4 border-t border-gray-100 relative z-20">
        
        {/* File Preview Popup */}
        <AnimatePresence>
            {selectedFile && (
                <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }} 
                    animate={{ opacity: 1, y: 0, scale: 1 }} 
                    exit={{ opacity: 0, y: 10, scale: 0.95 }} 
                    className="absolute bottom-full left-4 right-4 mb-2 bg-white rounded-xl shadow-lg border border-gray-100 p-2.5 flex items-center justify-between"
                >
                    <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-10 h-10 bg-brand-aliceBlue rounded-lg flex items-center justify-center text-brand-cerulean shrink-0">
                            {selectedFile.type.startsWith('image/') ? <ImageIcon size={20}/> : <FileText size={20}/>}
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="text-xs font-bold text-gray-700 truncate">{selectedFile.name}</span>
                            <span className="text-[10px] text-gray-500 font-medium">{(selectedFile.size / 1024).toFixed(1)} KB</span>
                        </div>
                    </div>
                    <button 
                        onClick={() => { setSelectedFile(null); if(fileInputRef.current) fileInputRef.current.value=""; }} 
                        className="p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-lg transition-colors"
                    >
                        <X size={16} />
                    </button>
                </motion.div>
            )}
        </AnimatePresence>

        {/* Typing Indicator */}
        <AnimatePresence>
            {isTyping && !selectedFile && (
                <motion.div 
                    initial={{ opacity: 0, y: 5 }} 
                    animate={{ opacity: 1, y: -5 }} 
                    exit={{ opacity: 0 }} 
                    className="absolute -top-8 left-6 text-[10px] text-gray-500 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full shadow-sm border border-gray-100 flex items-center gap-2"
                >
                    <span className="flex gap-0.5">
                        <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce delay-0"></span>
                        <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce delay-100"></span>
                        <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce delay-200"></span>
                    </span>
                    Someone is typing...
                </motion.div>
            )}
        </AnimatePresence>

        {/* Input Form */}
        <form onSubmit={handleSendMessage} className="flex items-end gap-2 bg-gray-50 p-1.5 rounded-[1.5rem] border border-gray-200 focus-within:border-brand-cerulean/50 focus-within:bg-white focus-within:shadow-sm transition-all duration-300">
            
            {/* Attach Button */}
            <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" id="chat-file-upload" />
            <label 
                htmlFor="chat-file-upload" 
                className="p-2.5 text-gray-400 hover:text-brand-cerulean hover:bg-brand-aliceBlue rounded-full cursor-pointer transition-colors shrink-0 mb-0.5"
                title="Attach file"
            >
                <Paperclip size={20} />
            </label>

            {/* Text Input */}
            <input 
                type="text" 
                value={newMessage} 
                onChange={handleTyping} 
                placeholder={isUploading ? "Uploading..." : "Type a message..."}
                disabled={isUploading}
                className="flex-1 bg-transparent border-none outline-none text-sm px-1 py-3 text-gray-700 placeholder:text-gray-400 min-w-0" 
            />
            
            {/* Send Button */}
            <button 
                type="submit" 
                disabled={(!newMessage.trim() && !selectedFile) || isUploading} 
                className={`p-2.5 rounded-full shadow-md flex items-center justify-center transition-all duration-300 mb-0.5 shrink-0 ${
                    (!newMessage.trim() && !selectedFile) || isUploading
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed shadow-none" 
                    : "bg-brand-prussian text-white hover:bg-brand-cerulean hover:shadow-lg transform hover:-translate-y-0.5 active:scale-95"
                }`}
            >
                {isUploading ? <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"/> : <Send size={18} className={newMessage.trim() ? "translate-x-0.5" : ""} />}
            </button>
        </form>
      </div>
    </motion.div>
  );
}