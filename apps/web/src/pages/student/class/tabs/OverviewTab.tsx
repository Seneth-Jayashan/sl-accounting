import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { 
  Video, 
  Clock, 
  Lock, 
  Eye, 
  EyeOff, 
  Copy, 
  Check, 
  Hash, 
  ShieldCheck,
  Signal,
} from "lucide-react";

interface OverviewTabProps {
  classData: any;
  sessions: any[];
}

export default function OverviewTab({ classData, sessions }: OverviewTabProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [copiedPass, setCopiedPass] = useState(false);

  const upcomingSession = useMemo(() => {
    const now = new Date();
    return [...(sessions || [])]
      .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())
      .find(s => new Date(s.endAt) > now);
  }, [sessions]);

  const activeZoomLink = upcomingSession?.zoomJoinUrl || classData?.zoomLink;
  const activeMeetingId = upcomingSession?.zoomMeetingId || classData?.zoomMeetingId;
  const activePassword = classData?.zoomPassword;

  // Helpers
  const copyToClipboard = (text: string, type: 'id' | 'pass') => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    if (type === 'id') { setCopiedId(true); setTimeout(() => setCopiedId(false), 2000); } 
    else { setCopiedPass(true); setTimeout(() => setCopiedPass(false), 2000); }
  };

  const formatDay = (date: string) => new Date(date).toLocaleDateString('en-US', { day: 'numeric' });
  const formatMonth = (date: string) => new Date(date).toLocaleDateString('en-US', { month: 'short' });
  const formatWeekday = (date: string) => new Date(date).toLocaleDateString('en-US', { weekday: 'long' });
  const formatTime = (date: string) => new Date(date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

  // Animation
  const fadeIn = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={fadeIn}
      className="max-w-5xl mx-auto space-y-6"
    >
      
      {/* --- 1. THE MAIN EVENT CARD --- */}
      <div className="relative bg-brand-prussian rounded-[2rem] overflow-hidden shadow-2xl shadow-brand-prussian/20">
        
        {/* Abstract Background Art */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-cerulean/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-indigo-500/10 rounded-full blur-[80px] translate-y-1/3 -translate-x-1/3 pointer-events-none"></div>

        <div className="relative z-10 p-8 sm:p-10 flex flex-col md:flex-row gap-8 md:items-center justify-between">
            
            {/* Left: Session Details */}
            <div className="flex-1 space-y-6">
                <div className="flex items-center gap-3">
                    {upcomingSession ? (
                        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-[10px] font-bold uppercase tracking-widest">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                            </span>
                            Live Session
                        </span>
                    ) : (
                        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-gray-400 text-[10px] font-bold uppercase tracking-widest">
                            <Clock size={12} />
                            Upcoming
                        </span>
                    )}
                </div>

                <div>
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight leading-tight">
                        {upcomingSession ? upcomingSession.title || "Next Class Session" : "No Session Scheduled"}
                    </h2>
                    <p className="text-brand-aliceBlue/60 mt-3 text-sm sm:text-base font-medium max-w-lg leading-relaxed">
                        {upcomingSession 
                            ? "Everything is ready. Make sure your connection is stable before joining." 
                            : "Check the schedule below or view past recordings for missed content."}
                    </p>
                </div>

                {/* Date Badge (Only if session exists) */}
                {upcomingSession && (
                    <div className="inline-flex items-center gap-4 text-white/90">
                        <div className="flex flex-col">
                            <span className="text-4xl font-black text-white">{formatDay(upcomingSession.startAt)}</span>
                            <span className="text-xs uppercase font-bold text-brand-cerulean">{formatMonth(upcomingSession.startAt)}</span>
                        </div>
                        <div className="w-px h-10 bg-white/10"></div>
                        <div className="flex flex-col gap-1">
                            <span className="text-lg font-bold">{formatWeekday(upcomingSession.startAt)}</span>
                            <span className="text-sm text-white/60 flex items-center gap-1.5">
                                <Clock size={14} />
                                {formatTime(upcomingSession.startAt)}
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {/* Right: Action Button */}
            <div className="w-full md:w-auto">
                {activeZoomLink ? (
                    <a 
                        href={activeZoomLink} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="group relative flex items-center justify-center gap-3 bg-white text-brand-prussian py-5 px-10 rounded-2xl font-bold text-lg shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] hover:shadow-[0_0_50px_-5px_rgba(255,255,255,0.4)] transition-all hover:scale-[1.02] active:scale-95 w-full md:w-auto overflow-hidden"
                    >
                        <span className="relative z-10 flex items-center gap-2">
                           <Video size={20} className="text-brand-cerulean" /> Join Now
                        </span>
                        {/* Shimmer Effect */}
                        <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/50 to-transparent z-0"></div>
                    </a>
                ) : (
                    <button disabled className="flex items-center justify-center gap-3 bg-white/5 text-gray-500 py-5 px-10 rounded-2xl font-bold border border-white/5 cursor-not-allowed w-full md:w-auto">
                        <Lock size={20} /> Access Locked
                    </button>
                )}
            </div>
        </div>
      </div>

      {/* --- 2. CREDENTIALS & INFO BAR --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Meeting ID Panel */}
          <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between group hover:border-brand-cerulean/30 transition-colors">
              <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-brand-aliceBlue/50 rounded-2xl flex items-center justify-center text-brand-cerulean">
                      <Hash size={24} />
                  </div>
                  <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Meeting ID</p>
                      <p className="text-xl font-mono font-bold text-brand-prussian tracking-wide">
                          {activeMeetingId || "---"}
                      </p>
                  </div>
              </div>
              <button 
                onClick={() => copyToClipboard(activeMeetingId, 'id')}
                className="p-3 rounded-xl hover:bg-gray-50 text-gray-400 hover:text-brand-cerulean transition-colors active:scale-90"
                title="Copy ID"
              >
                  {copiedId ? <Check size={20} className="text-green-500" /> : <Copy size={20} />}
              </button>
          </div>

          {/* Password Panel */}
          <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between group hover:border-brand-coral/30 transition-colors">
              <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-brand-aliceBlue/50 rounded-2xl flex items-center justify-center text-brand-coral">
                      <ShieldCheck size={24} />
                  </div>
                  <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Passcode</p>
                      <div className="flex items-center gap-2">
                        <p className="text-xl font-mono font-bold text-brand-prussian tracking-wide min-w-[100px]">
                            {activePassword ? (showPassword ? activePassword : "••••••") : "---"}
                        </p>
                        {activePassword && (
                            <button 
                                onClick={() => setShowPassword(!showPassword)}
                                className="text-gray-300 hover:text-gray-600 transition-colors"
                            >
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        )}
                      </div>
                  </div>
              </div>
              <button 
                onClick={() => copyToClipboard(activePassword, 'pass')}
                disabled={!activePassword}
                className="p-3 rounded-xl hover:bg-gray-50 text-gray-400 hover:text-brand-coral transition-colors active:scale-90"
                title="Copy Password"
              >
                  {copiedPass ? <Check size={20} className="text-green-500" /> : <Copy size={20} />}
              </button>
          </div>

      </div>

      {/* --- 3. SYSTEM STATUS --- */}
      <div className="flex items-center justify-center gap-2 text-xs font-medium text-gray-400 mt-4">
            <Signal size={14} className="text-green-500" />
            <span>Zoom System Status: </span>
            <span className="text-green-600">Operational</span>
            <span className="mx-2">•</span>
            <span>Region: Asia/Colombo</span>
      </div>

    </motion.div>
  );
}