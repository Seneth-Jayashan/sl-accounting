import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, MessageSquare, Hash, Send, Paperclip, 
  ShieldCheck, X, FileText, Image as  Loader2, Trash2 
} from "lucide-react";

// Services & Contexts
import ClassService, { type ClassData } from "../../../services/ClassService";
import ClassChatService, { type ClassChatMessage, type Attachment } from "../../../services/ClassChatService";
import { useAuth } from "../../../contexts/AuthContext";

const BASE_API_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:3000";

export default function AdminCommunity() {
  const { user } = useAuth();

  // --- State ---
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [filteredClasses, setFilteredClasses] = useState<ClassData[]>([]);
  const [selectedClass, setSelectedClass] = useState<ClassData | null>(null);
  const [messages, setMessages] = useState<ClassChatMessage[]>([]);
  
  // Loading & UI
  const [loadingList, setLoadingList] = useState(true);
  const [loadingChat, setLoadingChat] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // --- 1. Load Classes ---
  useEffect(() => {
    const loadClasses = async () => {
      setLoadingList(true);
      try {
        const res = await ClassService.getAllClasses();
        let classList: ClassData[] = [];
        if (res.classes && Array.isArray(res.classes)) classList = res.classes;
        else if (Array.isArray(res)) classList = res;
        else if ((res as any).data && Array.isArray((res as any).data)) classList = (res as any).data;

        setClasses(classList);
        setFilteredClasses(classList);
      } catch (error) {
        console.error("Failed to load classes", error);
      } finally {
        setLoadingList(false);
      }
    };
    loadClasses();
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredClasses(classes);
    } else {
      const lowerQ = searchQuery.toLowerCase();
      setFilteredClasses(classes.filter(c => c.name.toLowerCase().includes(lowerQ)));
    }
  }, [searchQuery, classes]);

  // --- 2. Chat Logic ---
  useEffect(() => {
    if (!selectedClass) return;

    const initChat = async () => {
      setLoadingChat(true);
      setMessages([]);
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

    // Listeners
    const handleReceive = (msg: ClassChatMessage) => {
        setMessages((prev) => {
            if (msg._id && prev.some(m => m._id === msg._id)) return prev;
            return [...prev, msg];
        });
    };

    // NEW: Handle Real-time Deletion
    const handleDeleteEvent = (data: { messageId: string }) => {
        setMessages((prev) => prev.filter(msg => msg._id !== data.messageId));
    };

    const handleTypingEvent = (data: { isTyping: boolean; senderId: string }) => {
        if (data.senderId !== user?._id) setIsTyping(data.isTyping);
    };

    ClassChatService.onMessage(handleReceive);
    ClassChatService.onMessageDeleted(handleDeleteEvent); // <--- Register Listener
    ClassChatService.onTyping(handleTypingEvent);

    return () => {
        ClassChatService.offMessage(handleReceive);
        ClassChatService.offMessageDeleted(handleDeleteEvent); // <--- Cleanup
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
    if(fileInputRef.current) fileInputRef.current.value = "";

    let attachments: Attachment[] = [];

    if (fileToSend) {
        setIsUploading(true);
        const uploaded = await ClassChatService.uploadFile(fileToSend);
        setIsUploading(false);
        if (uploaded) attachments.push(uploaded);
        else {
            alert("File upload failed.");
            return;
        }
    }

    await ClassChatService.sendMessage({
        classId: selectedClass._id,
        message: msgContent,
        sender: user?._id || "",
        senderRole: "admin",
        attachments
    });
  };

  // NEW: Delete Handler
  const handleDeleteMessage = async (messageId?: string) => {
      if (!messageId || !confirm("Are you sure you want to delete this message?")) return;
      await ClassChatService.deleteMessage(messageId);
      // Optimistic update handled by socket listener above, but we can do it here too just in case
      setMessages(prev => prev.filter(m => m._id !== messageId));
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

  // --- Render ---

  return (
    <div className="flex h-[calc(100vh-2rem)] bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
      
      {/* Sidebar */}
      <div className="w-80 md:w-96 bg-gray-50/50 border-r border-gray-200 flex flex-col shrink-0">
        <div className="p-4 border-b border-gray-200 bg-white">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <MessageSquare className="text-brand-cerulean" size={20} /> Community
          </h2>
          <div className="mt-4 relative">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder="Search classes..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-100 border-transparent rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-brand-cerulean/20 transition-all outline-none"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin">
          {loadingList ? (
            <div className="flex justify-center py-10"><Loader2 className="animate-spin text-gray-400" /></div>
          ) : filteredClasses.length === 0 ? (
            <div className="text-center py-10 text-gray-400 text-sm">No classes found.</div>
          ) : (
            filteredClasses.map((cls) => (
              <button
                key={cls._id}
                onClick={() => setSelectedClass(cls)}
                className={`w-full text-left p-3 rounded-xl transition-all border border-transparent
                  ${selectedClass?._id === cls._id 
                    ? "bg-white border-brand-cerulean/30 shadow-sm ring-1 ring-brand-cerulean/10" 
                    : "hover:bg-white hover:shadow-sm"
                  }
                `}
              >
                <div className="flex justify-between items-start">
                  <h3 className={`font-bold text-sm truncate pr-2 ${selectedClass?._id === cls._id ? "text-brand-prussian" : "text-gray-700"}`}>
                    {cls.name}
                  </h3>
                </div>
                <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] bg-brand-aliceBlue text-brand-cerulean px-1.5 py-0.5 rounded font-medium flex items-center gap-1">
                        <Hash size={10} /> {typeof cls.batch === 'string' ? "Batch" : cls.batch?.name || "Batch"}
                    </span>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-white relative">
        {selectedClass ? (
          <>
            <div className="h-16 border-b border-gray-100 flex items-center justify-between px-6 bg-white shrink-0 z-10">
              <div>
                <h2 className="font-bold text-gray-800">{selectedClass.name}</h2>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                   <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Live Discussion
                </div>
              </div>
              <div className="flex items-center gap-3">
                 <div className="px-3 py-1 bg-brand-prussian/5 text-brand-prussian text-xs rounded-full font-bold flex items-center gap-1">
                    <ShieldCheck size={12} /> Admin Mode
                 </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/30 scrollbar-thin">
                {loadingChat ? (
                    <div className="flex justify-center mt-20"><Loader2 className="animate-spin text-brand-cerulean" /></div>
                ) : messages.length === 0 ? (
                    <div className="text-center text-gray-400 mt-20">
                        <p>No messages yet.</p>
                    </div>
                ) : (
                    messages.map((msg, idx) => {
                        const isMe = msg.sender === user?._id;
                        const isAdmin = msg.senderRole === 'admin';

                        return (
                            <motion.div 
                                initial={{ opacity: 0, y: 5 }} 
                                animate={{ opacity: 1, y: 0 }} 
                                key={msg._id || idx} 
                                className={`flex w-full group ${isMe ? 'justify-end' : 'justify-start'}`}
                            >
                                <div className={`flex max-w-[70%] gap-3 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                                    {/* Avatar */}
                                    <div className="shrink-0 mt-auto">
                                        {msg.senderAvatar ? (
                                            <img src={`${BASE_API_URL}${msg.senderAvatar}`} className="w-8 h-8 rounded-full object-cover border border-white shadow-sm" alt="avt"/>
                                        ) : (
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border border-white shadow-sm ${isAdmin ? 'bg-brand-prussian text-white' : 'bg-brand-aliceBlue text-brand-cerulean'}`}>
                                                {msg.senderName?.charAt(0) || "U"}
                                            </div>
                                        )}
                                    </div>

                                    <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`text-xs font-bold ${isAdmin ? 'text-brand-cerulean' : 'text-gray-600'}`}>
                                                {msg.senderName} {isAdmin && !isMe && "(Admin)"}
                                            </span>
                                            <span className="text-[10px] text-gray-400">
                                                {new Date(msg.createdAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                                            </span>
                                            
                                            {/* DELETE BUTTON (Only visible on hover) */}
                                            <button 
                                                onClick={() => handleDeleteMessage(msg._id)}
                                                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-gray-400 hover:text-red-500 bg-gray-100 rounded-full ml-2"
                                                title="Delete Message"
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                        
                                        <div className={`p-1 shadow-sm rounded-2xl ${isMe ? 'bg-brand-cerulean text-white rounded-tr-none' : 'bg-white border border-gray-200 text-gray-700 rounded-tl-none'}`}>
                                            {msg.attachments?.map((att, i) => (
                                                <div key={i} className="mb-1">
                                                    {att.fileType === 'image' ? (
                                                        <a href={BASE_API_URL + att.url} target="_blank" rel="noopener noreferrer">
                                                            <img src={BASE_API_URL + att.url} alt="att" className="max-w-[250px] max-h-[200px] rounded-lg bg-black/5" />
                                                        </a>
                                                    ) : (
                                                        <a href={att.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-3 bg-white/10 rounded-lg">
                                                            <FileText size={18} />
                                                            <span className="text-xs truncate">{att.originalName}</span>
                                                        </a>
                                                    )}
                                                </div>
                                            ))}
                                            {msg.message && <div className="px-3 py-2 text-sm whitespace-pre-wrap">{msg.message}</div>}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 bg-white border-t border-gray-100 relative">
                <AnimatePresence>
                    {selectedFile && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute bottom-full left-0 right-0 bg-gray-50 border-t border-gray-200 p-2 px-4 flex items-center justify-between z-20">
                            <span className="text-xs font-bold truncate">{selectedFile.name}</span>
                            <button onClick={() => setSelectedFile(null)}><X size={16} /></button>
                        </motion.div>
                    )}
                </AnimatePresence>

                <form onSubmit={handleSendMessage} className="flex items-center gap-3">
                    <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" id="admin-chat-upload" />
                    <label htmlFor="admin-chat-upload" className="cursor-pointer text-gray-400 hover:text-brand-cerulean"><Paperclip size={20}/></label>
                    <input 
                        type="text" 
                        value={newMessage}
                        onChange={handleTyping}
                        placeholder="Type a message..."
                        className="flex-1 bg-gray-50 border-none rounded-xl px-4 py-2.5 outline-none text-sm"
                    />
                    <button type="submit" disabled={!newMessage && !selectedFile} className="p-3 bg-brand-prussian text-white rounded-xl hover:bg-brand-cerulean">
                         {isUploading ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
                    </button>
                </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-300">
             <MessageSquare size={40} className="mb-4 opacity-20" />
             <p>Select a class to view chat.</p>
          </div>
        )}
      </div>
    </div>
  );
}