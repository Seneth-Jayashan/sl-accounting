import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { 
  Video, 
  Calendar, 
  Clock, 
  Lock, 
  Eye, 
  EyeOff, 
  Copy, 
  Check, 
  ShieldCheck
} from "lucide-react";

interface OverviewTabProps {
  classData: any;
  sessions: any[];
}

export default function OverviewTab({ classData, sessions }: OverviewTabProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);

  const upcomingSession = useMemo(() => {
    const now = new Date();
    // Assuming sessions array is valid
    return [...(sessions || [])]
      .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())
      .find(s => new Date(s.endAt) > now);
  }, [sessions]);

  const activeZoomLink = upcomingSession?.zoomJoinUrl || classData?.zoomLink;
  const activeMeetingId = upcomingSession?.zoomMeetingId || classData?.zoomMeetingId;
  const activePassword = classData?.zoomPassword;

  const handleCopyPassword = () => {
    if (activePassword) {
      navigator.clipboard.writeText(activePassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Helper for Date Format
  const formatDate = (date: string) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const formatTime = (date: string) => new Date(date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6 sm:space-y-8"
    >
      {/* 1. HERO SECTION */}
      <div className="bg-gradient-to-br from-brand-prussian to-[#022c3d] rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-12 text-white shadow-xl relative overflow-hidden border border-white/5">
        
        {/* Background Blur Blob */}
        <div className="absolute top-0 right-0 w-64 h-64 sm:w-80 sm:h-80 bg-brand-cerulean/15 rounded-full blur-[80px] sm:blur-[100px] -mr-20 -mt-20 pointer-events-none"></div>
        
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          
          {/* Left: Class Info */}
          <div>
            <div className="flex items-center gap-2 mb-4 sm:mb-6">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
              </span>
              <p className="text-green-400 text-[10px] font-bold uppercase tracking-[0.15em]">Live Ready</p>
            </div>
            
            <h2 className="text-2xl sm:text-3xl md:text-5xl font-semibold mb-6 sm:mb-8 leading-tight font-sinhala tracking-tight">
              {upcomingSession ? (upcomingSession.title || "Next Live Session") : "Check Back Later"}
            </h2>
            
            {upcomingSession ? (
              <div className="flex flex-wrap gap-3 sm:gap-4 mb-8 sm:mb-10">
                <div className="flex items-center gap-3 bg-white/5 px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl backdrop-blur-md border border-white/10">
                  <Calendar size={16} className="text-brand-jasmine/80" />
                  <span className="text-xs sm:text-sm font-medium text-brand-aliceBlue">{formatDate(upcomingSession.startAt)}</span>
                </div>
                <div className="flex items-center gap-3 bg-white/5 px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl backdrop-blur-md border border-white/10">
                  <Clock size={16} className="text-brand-coral/80" />
                  <span className="text-xs sm:text-sm font-medium text-brand-aliceBlue">{formatTime(upcomingSession.startAt)}</span>
                </div>
              </div>
            ) : (
              <p className="text-brand-aliceBlue/60 mb-8 sm:mb-10 max-w-sm font-normal text-sm sm:text-base leading-relaxed">
                No live sessions are currently scheduled. Past recordings are available in the recordings tab.
              </p>
            )}

            {activeZoomLink ? (
              <a 
                href={activeZoomLink} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-3 bg-brand-cerulean hover:bg-brand-cerulean/90 text-white font-medium py-3.5 sm:py-4 px-8 sm:px-10 rounded-2xl transition-all shadow-lg shadow-brand-cerulean/20 transform hover:-translate-y-0.5 w-full sm:w-auto group active:scale-95"
              >
                <Video size={18} className="opacity-90" /> 
                <span>Join Live Classroom</span>
              </a>
            ) : (
              <button disabled className="inline-flex items-center justify-center gap-3 bg-white/5 text-gray-400 font-medium py-3.5 sm:py-4 px-8 sm:px-10 rounded-2xl cursor-not-allowed border border-white/5 w-full sm:w-auto">
                <Lock size={18} /> Portal Not Open
              </button>
            )}
          </div>

          {/* Right: Security Panel */}
          <div className="bg-white/[0.03] rounded-[1.5rem] sm:rounded-[2rem] p-6 sm:p-8 backdrop-blur-xl border border-white/10 shadow-inner">
            <div className="flex items-center gap-2 mb-6 sm:mb-8 text-brand-jasmine/90">
                <ShieldCheck size={16} />
                <h3 className="text-[10px] font-bold uppercase tracking-[0.15em]">Security Credentials</h3>
            </div>
            
            <div className="space-y-6 sm:space-y-8">
              <div>
                <p className="text-[10px] text-brand-aliceBlue/40 mb-1.5 uppercase font-medium tracking-widest">Meeting ID</p>
                <p className="font-mono text-xl sm:text-2xl font-semibold tracking-wide select-all text-brand-aliceBlue break-all">
                    {activeMeetingId || "N/A"}
                </p>
              </div>
              
              <div>
                <p className="text-[10px] text-brand-aliceBlue/40 mb-1.5 uppercase font-medium tracking-widest">Passcode</p>
                <div className="flex items-center justify-between sm:justify-start gap-4">
                  <p className="font-mono text-xl sm:text-2xl font-semibold tracking-widest text-brand-aliceBlue">
                    {activePassword 
                      ? (showPassword ? activePassword : "••••••") 
                      : "---"
                    }
                  </p>
                  {activePassword && (
                    <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/5 shrink-0">
                      <button 
                        onClick={() => setShowPassword(!showPassword)}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors text-brand-aliceBlue/70 active:scale-90"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                      <button 
                        onClick={handleCopyPassword}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors text-brand-aliceBlue/70 active:scale-90"
                      >
                        {copied ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="mt-8 sm:mt-10 pt-6 border-t border-white/5">
                <p className="text-[10px] text-brand-aliceBlue/30 leading-relaxed font-normal italic">
                    Credentials are for personal use only. Sharing will result in immediate access revocation.
                </p>
            </div>
          </div>

        </div>
      </div>
    </motion.div>
  );
}