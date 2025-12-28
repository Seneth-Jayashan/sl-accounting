import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Send, MessageSquare, ShieldCheck, Paperclip, X, FileText, Image as ImageIcon } from "lucide-react";

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

    const initChat = async () => {
      setLoading(true);
      try {
        ClassChatService.joinClassRoom(classId);
        const history = await ClassChatService.fetchHistory(classId);
        setMessages(history);
      } catch (error) {
        console.error("Failed to join chat:", error);
      } finally {
        setLoading(false);
      }
    };

    initChat();

    const handleReceive = (msg: ClassChatMessage) => {
      setMessages((prev) => {
        if (msg._id && prev.some((m) => m._id === msg._id)) return prev;
        return [...prev, msg];
      });
    };

    const handleTypingEvent = (data: { isTyping: boolean; senderId: string }) => {
      if (data.senderId !== user?._id) setIsTyping(data.isTyping);
    };

    ClassChatService.onMessage(handleReceive);
    ClassChatService.onTyping(handleTypingEvent);

    return () => {
      ClassChatService.offMessage(handleReceive);
      ClassChatService.offTyping();
    };
  }, [classId, user?._id]);

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
    
    // Clear Input Immediately (Optimistic UI)
    setNewMessage("");
    setSelectedFile(null); 
    if(fileInputRef.current) fileInputRef.current.value = "";

    let attachments: Attachment[] = [];

    // 1. Upload File (if any)
    if (fileToSend) {
        setIsUploading(true);
        const uploaded = await ClassChatService.uploadFile(fileToSend);
        setIsUploading(false);
        
        if (uploaded) {
            attachments.push(uploaded);
        } else {
            alert("Failed to upload file. Please try again.");
            return; 
        }
    }

    // 2. Send Message
    try {
      await ClassChatService.sendMessage({
        classId,
        message: msgContent,
        sender: user?._id || "",
        senderRole: (user?.role === 'admin' ? 'admin' : 'student') as "student" | "admin",
        attachments 
      });
    } catch (error) {
      console.error("Failed to send:", error);
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

  // --- RENDER ---
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col h-[650px] bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
      
      {/* Header */}
      <div className="bg-white border-b border-gray-100 p-4 flex items-center justify-between shrink-0 z-10">
        <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-aliceBlue rounded-xl">
                <MessageSquare className="text-brand-cerulean w-5 h-5" />
            </div>
            <div>
                <h2 className="font-bold text-gray-900 text-sm">Classroom Discussion</h2>
                <div className="text-xs text-gray-500 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Live Chat
                </div>
            </div>
        </div>
        <div className="text-[10px] bg-gray-100 text-gray-500 px-2 py-1 rounded-md flex items-center gap-1 font-medium">
            <ShieldCheck size={10} /> Secure Channel
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#f8fafc] scrollbar-thin">
        {loading && <div className="flex justify-center mt-10"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-cerulean"></div></div>}
        
        {!loading && messages.length === 0 && (
            <div className="text-center text-gray-400 mt-20 text-sm">
                <p>No messages yet.</p>
                <p className="text-xs">Start the discussion!</p>
            </div>
        )}

        {messages.map((msg, idx) => {
            const isMe = msg.sender === user?._id;
            const isAdmin = msg.senderRole === 'admin';
            
            return (
                <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} key={msg._id || idx} className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`flex max-w-[80%] gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                        {/* Avatar */}
                        <div className="shrink-0 mt-auto">
                            {msg.senderAvatar ? (
                                <img src={`${import.meta.env.VITE_SERVER_URL}${msg.senderAvatar}`} className="w-7 h-7 rounded-full object-cover border border-white shadow-sm" alt="avatar"/>
                            ) : (
                                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold border border-white shadow-sm ${isAdmin ? 'bg-brand-prussian text-white' : 'bg-brand-aliceBlue text-brand-cerulean'}`}>
                                    {msg.senderName?.charAt(0) || "U"}
                                </div>
                            )}
                        </div>

                        {/* Content */}
                        <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                            {!isMe && <span className="text-[10px] font-bold text-gray-500 ml-1 mb-0.5">{msg.senderName}</span>}
                            
                            <div className={`p-1 shadow-sm rounded-2xl ${isMe ? 'bg-brand-cerulean text-white rounded-br-none' : 'bg-white text-gray-700 border border-gray-100 rounded-bl-none'}`}>
                                
                                {/* 1. Render Attachments */}
                                {msg.attachments?.map((att, i) => (
                                    <div key={i} className="mb-1">
                                        {att.fileType === 'image' ? (
                                            <a href={BASE_API_URL + att.url} target="_blank" rel="noopener noreferrer">
                                                <img src={BASE_API_URL + att.url} alt="attachment" className="max-w-[200px] max-h-[200px] rounded-xl object-cover hover:opacity-90 transition-opacity bg-black/10" />
                                            </a>
                                        ) : (
                                            <a href={att.url} target="_blank" rel="noopener noreferrer" className={`flex items-center gap-2 p-3 rounded-xl ${isMe ? 'bg-white/10 hover:bg-white/20' : 'bg-gray-50 hover:bg-gray-100'} transition-colors`}>
                                                <div className="p-2 bg-white rounded-lg text-brand-cerulean"><FileText size={20} /></div>
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold truncate max-w-[150px]">{att.originalName || "File"}</span>
                                                    <span className="text-[10px] opacity-70 uppercase">Download</span>
                                                </div>
                                            </a>
                                        )}
                                    </div>
                                ))}

                                {/* 2. Render Text */}
                                {msg.message && (
                                    <div className="px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap break-words">
                                        {msg.message}
                                    </div>
                                )}
                            </div>
                            
                            <span className="text-[9px] text-gray-400 mt-1 mx-1">
                                {new Date(msg.createdAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                            </span>
                        </div>
                    </div>
                </motion.div>
            );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-white p-3 border-t border-gray-100 relative">
        
        {/* Preview Selected File */}
        <AnimatePresence>
            {selectedFile && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute bottom-full left-0 right-0 bg-gray-50 border-t border-gray-200 p-2 px-4 flex items-center justify-between z-20">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-gray-200 text-brand-cerulean">
                            {selectedFile.type.startsWith('image/') ? <ImageIcon size={20}/> : <FileText size={20}/>}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs font-bold text-gray-700 truncate max-w-[200px]">{selectedFile.name}</span>
                            <span className="text-[10px] text-gray-500">{(selectedFile.size / 1024).toFixed(1)} KB</span>
                        </div>
                    </div>
                    <button onClick={() => { setSelectedFile(null); if(fileInputRef.current) fileInputRef.current.value=""; }} className="p-1 hover:bg-gray-200 rounded-full text-gray-500">
                        <X size={16} />
                    </button>
                </motion.div>
            )}
        </AnimatePresence>

        {/* Typing Indicator */}
        <AnimatePresence>
            {isTyping && !selectedFile && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: -10 }} exit={{ opacity: 0 }} className="absolute -top-8 left-6 text-xs text-gray-500 bg-white/90 px-3 py-1 rounded-full shadow-sm border border-gray-100">
                    Someone is typing...
                </motion.div>
            )}
        </AnimatePresence>

        <form onSubmit={handleSendMessage} className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-full border border-gray-200 focus-within:border-brand-cerulean transition-all">
            
            {/* File Button */}
            <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" id="chat-file-upload" />
            <label htmlFor="chat-file-upload" className="p-2 text-gray-400 hover:text-brand-cerulean rounded-full hover:bg-white transition-all cursor-pointer" title="Attach file">
                <Paperclip size={18} />
            </label>

            <input 
                type="text" 
                value={newMessage} 
                onChange={handleTyping} 
                placeholder={isUploading ? "Uploading file..." : "Type a message..."}
                disabled={isUploading}
                className="flex-1 bg-transparent border-none outline-none text-sm px-2 text-gray-700 placeholder:text-gray-400" 
            />
            
            <button 
                type="submit" 
                disabled={(!newMessage.trim() && !selectedFile) || isUploading} 
                className="p-2 bg-brand-prussian text-white rounded-full hover:bg-brand-cerulean disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm flex items-center justify-center"
            >
                {isUploading ? <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"/> : <Send size={16} className={newMessage.trim() ? "translate-x-0.5" : ""} />}
            </button>
        </form>
      </div>
    </motion.div>
  );
}